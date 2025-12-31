/**
 * IMAGE-CROP.JS - Image Cropper Tool
 * 100% Client-side image cropping
 */

'use strict';

const ImageCropper = {
    image: null,
    originalImage: null,
    rotation: 0,
    flipH: false,
    flipV: false,
    aspectRatio: null,
    cropBox: { x: 0, y: 0, width: 0, height: 0 },
    isDragging: false,
    isResizing: false,
    resizeHandle: null,
    startPos: { x: 0, y: 0 },
    startCrop: { x: 0, y: 0, width: 0, height: 0 },
    
    init() {
        this.bindElements();
        this.bindEvents();
    },
    
    bindElements() {
        this.el = {
            fileInput: document.getElementById('file-input'),
            dropZone: document.getElementById('drop-zone'),
            pageUpload: document.getElementById('page-upload'),
            pageCrop: document.getElementById('page-crop'),
            pageDownload: document.getElementById('page-download'),
            cropImage: document.getElementById('crop-image'),
            cropBox: document.getElementById('crop-box'),
            cropPreview: document.getElementById('crop-preview'),
            croppedPreview: document.getElementById('cropped-preview'),
            btnCrop: document.getElementById('btn-crop'),
            btnDownload: document.getElementById('btn-download'),
            btnMore: document.getElementById('btn-more'),
            processing: document.getElementById('processing'),
            ratioButtons: document.querySelectorAll('.ratio-btn'),
            rotateLeft: document.getElementById('rotate-left'),
            rotateRight: document.getElementById('rotate-right'),
            flipH: document.getElementById('flip-h'),
            flipV: document.getElementById('flip-v')
        };
    },
    
    bindEvents() {
        // File input
        this.el.fileInput?.addEventListener('change', (e) => this.handleFile(e.target.files[0]));
        
        // Drag and drop
        this.el.dropZone?.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.el.dropZone.classList.add('dragover');
        });
        this.el.dropZone?.addEventListener('dragleave', () => {
            this.el.dropZone.classList.remove('dragover');
        });
        this.el.dropZone?.addEventListener('drop', (e) => {
            e.preventDefault();
            this.el.dropZone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handleFile(file);
            }
        });
        
        // Crop box dragging
        this.el.cropBox?.addEventListener('mousedown', (e) => this.startDrag(e));
        this.el.cropBox?.addEventListener('touchstart', (e) => this.startDrag(e), { passive: false });
        
        // Resize handles
        document.querySelectorAll('.crop-handle').forEach(handle => {
            handle.addEventListener('mousedown', (e) => this.startResize(e, handle));
            handle.addEventListener('touchstart', (e) => this.startResize(e, handle), { passive: false });
        });
        
        document.addEventListener('mousemove', (e) => this.onMove(e));
        document.addEventListener('touchmove', (e) => this.onMove(e), { passive: false });
        document.addEventListener('mouseup', () => this.endDrag());
        document.addEventListener('touchend', () => this.endDrag());
        
        // Aspect ratio buttons
        this.el.ratioButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.el.ratioButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const ratio = btn.dataset.ratio;
                this.setAspectRatio(ratio);
            });
        });
        
        // Transform buttons
        this.el.rotateLeft?.addEventListener('click', () => this.rotate(-90));
        this.el.rotateRight?.addEventListener('click', () => this.rotate(90));
        this.el.flipH?.addEventListener('click', () => this.flip('h'));
        this.el.flipV?.addEventListener('click', () => this.flip('v'));
        
        // Crop and download
        this.el.btnCrop?.addEventListener('click', () => this.crop());
        this.el.btnDownload?.addEventListener('click', () => this.download());
        this.el.btnMore?.addEventListener('click', () => this.reset());
    },
    
    handleFile(file) {
        if (!file || !file.type.startsWith('image/')) return;
        
        this.fileName = file.name;
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.originalImage = img;
                this.image = img;
                this.rotation = 0;
                this.flipH = false;
                this.flipV = false;
                this.showPage('crop');
                this.setupCropBox();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    },
    
    showPage(page) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        if (page === 'upload') this.el.pageUpload?.classList.add('active');
        else if (page === 'crop') this.el.pageCrop?.classList.add('active');
        else if (page === 'download') this.el.pageDownload?.classList.add('active');
    },
    
    setupCropBox() {
        if (!this.image) return;
        
        const preview = this.el.cropPreview;
        const previewRect = preview.getBoundingClientRect();
        
        // Display image
        this.el.cropImage.src = this.image.src;
        
        // Wait for image to load
        setTimeout(() => {
            const imgRect = this.el.cropImage.getBoundingClientRect();
            
            // Set initial crop box (80% of image)
            const padding = 0.1;
            this.cropBox = {
                x: imgRect.width * padding,
                y: imgRect.height * padding,
                width: imgRect.width * (1 - padding * 2),
                height: imgRect.height * (1 - padding * 2)
            };
            
            this.updateCropBox();
        }, 100);
    },
    
    updateCropBox() {
        const box = this.el.cropBox;
        box.style.left = this.cropBox.x + 'px';
        box.style.top = this.cropBox.y + 'px';
        box.style.width = this.cropBox.width + 'px';
        box.style.height = this.cropBox.height + 'px';
    },
    
    setAspectRatio(ratio) {
        if (ratio === 'free') {
            this.aspectRatio = null;
            return;
        }
        
        const [w, h] = ratio.split(':').map(Number);
        this.aspectRatio = w / h;
        
        // Adjust crop box to match ratio
        const imgRect = this.el.cropImage.getBoundingClientRect();
        let newWidth = this.cropBox.width;
        let newHeight = newWidth / this.aspectRatio;
        
        if (newHeight > imgRect.height * 0.8) {
            newHeight = imgRect.height * 0.8;
            newWidth = newHeight * this.aspectRatio;
        }
        
        this.cropBox.width = newWidth;
        this.cropBox.height = newHeight;
        this.cropBox.x = (imgRect.width - newWidth) / 2;
        this.cropBox.y = (imgRect.height - newHeight) / 2;
        
        this.updateCropBox();
    },
    
    startDrag(e) {
        if (e.target.classList.contains('crop-handle')) return;
        
        e.preventDefault();
        this.isDragging = true;
        const pos = this.getEventPos(e);
        this.startPos = pos;
        this.startCrop = { ...this.cropBox };
    },
    
    startResize(e, handle) {
        e.preventDefault();
        e.stopPropagation();
        this.isResizing = true;
        this.resizeHandle = handle.className.split('--')[1];
        const pos = this.getEventPos(e);
        this.startPos = pos;
        this.startCrop = { ...this.cropBox };
    },
    
    onMove(e) {
        if (!this.isDragging && !this.isResizing) return;
        e.preventDefault();
        
        const pos = this.getEventPos(e);
        const dx = pos.x - this.startPos.x;
        const dy = pos.y - this.startPos.y;
        
        const imgRect = this.el.cropImage.getBoundingClientRect();
        
        if (this.isDragging) {
            let newX = this.startCrop.x + dx;
            let newY = this.startCrop.y + dy;
            
            // Bounds
            newX = Math.max(0, Math.min(newX, imgRect.width - this.cropBox.width));
            newY = Math.max(0, Math.min(newY, imgRect.height - this.cropBox.height));
            
            this.cropBox.x = newX;
            this.cropBox.y = newY;
        }
        
        if (this.isResizing) {
            this.resize(dx, dy, imgRect);
        }
        
        this.updateCropBox();
    },
    
    resize(dx, dy, imgRect) {
        const handle = this.resizeHandle;
        let { x, y, width, height } = this.startCrop;
        
        if (handle.includes('e')) {
            width = Math.max(50, this.startCrop.width + dx);
            width = Math.min(width, imgRect.width - x);
        }
        if (handle.includes('w')) {
            const newX = this.startCrop.x + dx;
            if (newX >= 0 && this.startCrop.width - dx >= 50) {
                x = newX;
                width = this.startCrop.width - dx;
            }
        }
        if (handle.includes('s')) {
            height = Math.max(50, this.startCrop.height + dy);
            height = Math.min(height, imgRect.height - y);
        }
        if (handle.includes('n')) {
            const newY = this.startCrop.y + dy;
            if (newY >= 0 && this.startCrop.height - dy >= 50) {
                y = newY;
                height = this.startCrop.height - dy;
            }
        }
        
        // Apply aspect ratio
        if (this.aspectRatio) {
            const targetHeight = width / this.aspectRatio;
            if (targetHeight <= imgRect.height - y) {
                height = targetHeight;
            } else {
                height = imgRect.height - y;
                width = height * this.aspectRatio;
            }
        }
        
        this.cropBox = { x, y, width, height };
    },
    
    endDrag() {
        this.isDragging = false;
        this.isResizing = false;
        this.resizeHandle = null;
    },
    
    getEventPos(e) {
        const rect = this.el.cropPreview.getBoundingClientRect();
        if (e.touches) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
        }
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    },
    
    rotate(deg) {
        this.rotation = (this.rotation + deg + 360) % 360;
        this.el.cropImage.style.transform = this.getTransform();
    },
    
    flip(direction) {
        if (direction === 'h') this.flipH = !this.flipH;
        if (direction === 'v') this.flipV = !this.flipV;
        this.el.cropImage.style.transform = this.getTransform();
    },
    
    getTransform() {
        let transform = `rotate(${this.rotation}deg)`;
        if (this.flipH) transform += ' scaleX(-1)';
        if (this.flipV) transform += ' scaleY(-1)';
        return transform;
    },
    
    async crop() {
        if (!this.image) return;
        
        this.el.btnCrop.disabled = true;
        this.el.processing.classList.add('active');
        
        await new Promise(r => setTimeout(r, 100));
        
        try {
            const imgRect = this.el.cropImage.getBoundingClientRect();
            const scaleX = this.image.naturalWidth / imgRect.width;
            const scaleY = this.image.naturalHeight / imgRect.height;
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const cropWidth = this.cropBox.width * scaleX;
            const cropHeight = this.cropBox.height * scaleY;
            
            canvas.width = cropWidth;
            canvas.height = cropHeight;
            
            // Apply transforms
            ctx.save();
            
            if (this.rotation !== 0 || this.flipH || this.flipV) {
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate(this.rotation * Math.PI / 180);
                if (this.flipH) ctx.scale(-1, 1);
                if (this.flipV) ctx.scale(1, -1);
                ctx.translate(-canvas.width / 2, -canvas.height / 2);
            }
            
            ctx.drawImage(
                this.image,
                this.cropBox.x * scaleX,
                this.cropBox.y * scaleY,
                cropWidth,
                cropHeight,
                0,
                0,
                cropWidth,
                cropHeight
            );
            
            ctx.restore();
            
            this.croppedDataUrl = canvas.toDataURL('image/png', 0.95);
            
            // Show preview
            this.el.croppedPreview.innerHTML = `<img src="${this.croppedDataUrl}" alt="Cropped image">`;
            
            this.showPage('download');
            
        } catch (err) {
            alert('Error cropping image');
            console.error(err);
        } finally {
            this.el.btnCrop.disabled = false;
            this.el.processing.classList.remove('active');
        }
    },
    
    download() {
        if (!this.croppedDataUrl) return;
        
        const link = document.createElement('a');
        const ext = this.fileName?.split('.').pop() || 'png';
        const baseName = this.fileName?.replace(/\.[^.]+$/, '') || 'image';
        link.download = `${baseName}_cropped.${ext}`;
        link.href = this.croppedDataUrl;
        link.click();
    },
    
    reset() {
        this.image = null;
        this.originalImage = null;
        this.rotation = 0;
        this.flipH = false;
        this.flipV = false;
        this.croppedDataUrl = null;
        this.el.fileInput.value = '';
        this.el.cropImage.src = '';
        this.el.cropImage.style.transform = '';
        this.el.croppedPreview.innerHTML = '';
        
        // Reset aspect ratio
        this.el.ratioButtons.forEach(b => b.classList.remove('active'));
        this.el.ratioButtons[0]?.classList.add('active');
        this.aspectRatio = null;
        
        this.showPage('upload');
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => ImageCropper.init());


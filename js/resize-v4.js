/**
 * RESIZE-V4.JS - Redesigned Image Resize Tool
 */

'use strict';

const App = {
    images: [],
    results: [],
    currentIdx: 0,
    
    // Settings
    width: 70,
    height: 70,
    unit: 'percent',
    resolution: 72,
    format: 'jpg',
    quality: 90,
    bgColor: 'white',
    lockRatio: true,
    originalRatio: 1,
    
    maxImages: 20,
    maxFileSize: 15 * 1024 * 1024,
    el: {},
    
    init() {
        this.cacheElements();
        this.bindEvents();
    },
    
    cacheElements() {
        this.el = {
            pageUpload: document.getElementById('page-upload'),
            pageEditor: document.getElementById('page-editor'),
            pageDownload: document.getElementById('page-download'),
            
            dropzone: document.getElementById('dropzone'),
            fileInput: document.getElementById('file-input'),
            fileInputMore: document.getElementById('file-input-more'),
            
            previewArea: document.getElementById('preview-area'),
            imageCount: document.getElementById('image-count'),
            
            widthInput: document.getElementById('width-input'),
            heightInput: document.getElementById('height-input'),
            unitSelect: document.getElementById('unit-select'),
            lockBtn: document.getElementById('lock-btn'),
            resolutionInput: document.getElementById('resolution-input'),
            formatSelect: document.getElementById('format-select'),
            qualityInput: document.getElementById('quality-input'),
            bgBtns: document.querySelectorAll('.bg-btn'),
            
            btnResize: document.getElementById('btn-resize'),
            
            downloadInfo: document.getElementById('download-info'),
            resultsList: document.getElementById('results-list'),
            btnDownload: document.getElementById('btn-download'),
            btnMore: document.getElementById('btn-more'),
            
            processing: document.getElementById('processing'),
            processingText: document.getElementById('processing-text'),
            progressBar: document.getElementById('progress-bar'),
        };
    },
    
    bindEvents() {
        // File inputs
        this.el.fileInput?.addEventListener('change', (e) => this.handleFiles(e.target.files));
        this.el.fileInputMore?.addEventListener('change', (e) => this.handleFiles(e.target.files));
        
        // Drag and drop
        document.body.addEventListener('dragover', (e) => e.preventDefault());
        document.body.addEventListener('drop', (e) => {
            e.preventDefault();
            if (e.dataTransfer.files.length) this.handleFiles(e.dataTransfer.files);
        });
        
        // Width input
        this.el.widthInput?.addEventListener('input', (e) => {
            this.width = parseFloat(e.target.value) || 0;
            if (this.lockRatio && this.images.length) {
                this.height = Math.round(this.width / this.originalRatio);
                this.el.heightInput.value = this.height;
            }
        });
        
        // Height input
        this.el.heightInput?.addEventListener('input', (e) => {
            this.height = parseFloat(e.target.value) || 0;
            if (this.lockRatio && this.images.length) {
                this.width = Math.round(this.height * this.originalRatio);
                this.el.widthInput.value = this.width;
            }
        });
        
        // Unit select
        this.el.unitSelect?.addEventListener('change', (e) => {
            this.unit = e.target.value;
            this.updateDimensionPlaceholders();
        });
        
        // Lock button
        this.el.lockBtn?.addEventListener('click', () => {
            this.lockRatio = !this.lockRatio;
            this.el.lockBtn.classList.toggle('active', this.lockRatio);
        });
        
        // Resolution
        this.el.resolutionInput?.addEventListener('input', (e) => {
            this.resolution = parseInt(e.target.value) || 72;
        });
        
        // Format
        this.el.formatSelect?.addEventListener('change', (e) => {
            this.format = e.target.value;
        });
        
        // Quality
        this.el.qualityInput?.addEventListener('input', (e) => {
            this.quality = parseInt(e.target.value) || 90;
        });
        
        // Background
        this.el.bgBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.el.bgBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.bgColor = btn.dataset.bg;
            });
        });
        
        // Resize
        this.el.btnResize?.addEventListener('click', () => this.resize());
        
        // Download
        this.el.btnDownload?.addEventListener('click', () => this.download());
        
        // More
        this.el.btnMore?.addEventListener('click', () => this.reset());
    },
    
    showPage(name) {
        [this.el.pageUpload, this.el.pageEditor, this.el.pageDownload].forEach(p => {
            if (p) p.classList.remove('active');
        });
        const page = document.getElementById('page-' + name);
        if (page) page.classList.add('active');
    },
    
    async handleFiles(fileList) {
        if (!fileList || !fileList.length) return;
        
        const files = Array.from(fileList);
        const remaining = this.maxImages - this.images.length;
        
        if (remaining <= 0) {
            alert('Maximum ' + this.maxImages + ' images');
            return;
        }
        
        for (const file of files.slice(0, remaining)) {
            if (!file.type.startsWith('image/')) continue;
            if (file.size > this.maxFileSize) continue;
            
            try {
                const img = await this.loadImage(file);
                this.images.push(img);
            } catch (e) {
                console.error('Load error:', file.name);
            }
        }
        
        if (this.el.fileInput) this.el.fileInput.value = '';
        if (this.el.fileInputMore) this.el.fileInputMore.value = '';
        
        if (this.images.length > 0) {
            this.currentIdx = 0;
            this.originalRatio = this.images[0].width / this.images[0].height;
            this.showPage('editor');
            this.updatePreview();
            this.updateDimensionPlaceholders();
        }
    },
    
    loadImage(file) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => resolve({
                file,
                name: file.name,
                size: file.size,
                width: img.naturalWidth,
                height: img.naturalHeight,
                url,
                type: file.type
            });
            img.onerror = () => { URL.revokeObjectURL(url); reject(); };
            img.src = url;
        });
    },
    
    updatePreview() {
        if (!this.images.length) return;
        
        // Render all images in grid
        this.el.previewArea.innerHTML = this.images.map((img, idx) => `
            <div class="img-thumb" data-idx="${idx}">
                <img src="${img.url}" alt="${img.name}">
                <button class="img-remove" onclick="App.removeImage(${idx})" title="Remove">×</button>
            </div>
        `).join('');
        
        this.el.imageCount.textContent = this.images.length + ' image' + (this.images.length > 1 ? 's' : '');
        
        // Update ratio for current image
        if (this.images.length > 0) {
            const currentImg = this.images[this.currentIdx] || this.images[0];
            this.originalRatio = currentImg.width / currentImg.height;
        }
    },
    
    updateDimensionPlaceholders() {
        if (!this.images.length) return;
        const img = this.images[this.currentIdx];
        
        if (this.unit === 'percent') {
            this.el.widthInput.value = this.width || 70;
            this.el.heightInput.value = this.height || 70;
        } else if (this.unit === 'pixels') {
            this.el.widthInput.value = Math.round(img.width * (this.width / 100));
            this.el.heightInput.value = Math.round(img.height * (this.height / 100));
        }
    },
    
    removeImage(idx) {
        const removed = this.images.splice(idx, 1)[0];
        if (removed?.url) URL.revokeObjectURL(removed.url);
        
        if (this.images.length === 0) {
            this.showPage('upload');
        } else {
            this.updatePreview();
            this.updateDimensionPlaceholders();
        }
    },
    
    async resize() {
        if (!this.images.length) return;
        
        this.showProcessing(true);
        this.results = [];
        
        const total = this.images.length;
        
        try {
            for (let i = 0; i < total; i++) {
                this.updateProgress(i, total, `Resizing ${i + 1} of ${total}...`);
                const result = await this.processImage(this.images[i]);
                this.results.push(result);
                await this.delay(30);
            }
            
            this.updateProgress(total, total, 'Done!');
            await this.delay(300);
            
            this.showDownload();
        } catch (e) {
            console.error(e);
            alert('Error during resizing');
        } finally {
            this.showProcessing(false);
        }
    },
    
    processImage(img) {
        return new Promise((resolve, reject) => {
            let newWidth, newHeight;
            
            // Calculate dimensions based on unit
            if (this.unit === 'percent') {
                const scaleW = this.width / 100;
                const scaleH = this.height / 100;
                newWidth = Math.round(img.width * scaleW);
                newHeight = Math.round(img.height * scaleH);
            } else if (this.unit === 'pixels') {
                newWidth = Math.round(this.width);
                newHeight = Math.round(this.height);
            } else if (this.unit === 'cm') {
                // cm to pixels: cm * DPI / 2.54
                newWidth = Math.round(this.width * this.resolution / 2.54);
                newHeight = Math.round(this.height * this.resolution / 2.54);
            } else if (this.unit === 'inches') {
                newWidth = Math.round(this.width * this.resolution);
                newHeight = Math.round(this.height * this.resolution);
            }
            
            // Ensure minimum size
            newWidth = Math.max(1, newWidth);
            newHeight = Math.max(1, newHeight);
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = newWidth;
            canvas.height = newHeight;
            
            // Background
            ctx.fillStyle = this.bgColor === 'black' ? '#000000' : '#ffffff';
            ctx.fillRect(0, 0, newWidth, newHeight);
            
            const image = new Image();
            image.onload = () => {
                ctx.drawImage(image, 0, 0, newWidth, newHeight);
                
                let mimeType = 'image/jpeg';
                let ext = 'jpg';
                
                if (this.format === 'png') {
                    mimeType = 'image/png';
                    ext = 'png';
                } else if (this.format === 'webp') {
                    mimeType = 'image/webp';
                    ext = 'webp';
                }
                
                const quality = this.quality / 100;
                
                canvas.toBlob((blob) => {
                    if (!blob) { reject(); return; }
                    
                    const baseName = img.name.replace(/\.[^/.]+$/, '');
                    const fileName = `${baseName}_${newWidth}x${newHeight}.${ext}`;
                    
                    resolve({
                        fileName,
                        blob,
                        url: URL.createObjectURL(blob),
                        originalWidth: img.width,
                        originalHeight: img.height,
                        newWidth,
                        newHeight,
                        originalName: img.name,
                    });
                    
                    canvas.width = 0;
                    canvas.height = 0;
                }, mimeType, quality);
            };
            image.onerror = () => reject();
            image.src = img.url;
        });
    },
    
    showDownload() {
        this.el.downloadInfo.textContent = `${this.results.length} image${this.results.length > 1 ? 's' : ''} processed`;
        
        this.el.resultsList.innerHTML = '';
        this.results.forEach(r => {
            const item = document.createElement('div');
            item.className = 'result-item';
            item.innerHTML = `
                <img class="result-thumb" src="${r.url}" alt="">
                <div class="result-info">
                    <div class="result-name">${r.originalName}</div>
                    <div class="result-dims">${r.originalWidth}×${r.originalHeight} → <span>${r.newWidth}×${r.newHeight}</span></div>
                </div>
            `;
            this.el.resultsList.appendChild(item);
        });
        
        this.showPage('download');
    },
    
    async download() {
        if (!this.results.length) return;
        
        if (this.results.length === 1) {
            this.downloadBlob(this.results[0].blob, this.results[0].fileName);
            return;
        }
        
        if (typeof JSZip === 'undefined') {
            for (const r of this.results) {
                this.downloadBlob(r.blob, r.fileName);
                await this.delay(200);
            }
            return;
        }
        
        const zip = new JSZip();
        this.results.forEach(r => zip.file(r.fileName, r.blob));
        
        const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
        const date = new Date().toISOString().slice(0, 10);
        this.downloadBlob(zipBlob, `resized-images-${date}.zip`);
    },
    
    downloadBlob(blob, name) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    
    reset() {
        this.results.forEach(r => r.url && URL.revokeObjectURL(r.url));
        this.results = [];
        this.images.forEach(i => i.url && URL.revokeObjectURL(i.url));
        this.images = [];
        this.currentIdx = 0;
        this.showPage('upload');
    },
    
    showProcessing(show) {
        this.el.processing?.classList.toggle('active', show);
        if (this.el.btnResize) this.el.btnResize.disabled = show;
        if (!show && this.el.progressBar) this.el.progressBar.style.width = '0%';
    },
    
    updateProgress(current, total, text) {
        const pct = Math.round((current / total) * 100);
        if (this.el.processingText) this.el.processingText.textContent = text;
        if (this.el.progressBar) this.el.progressBar.style.width = pct + '%';
    },
    
    delay(ms) { return new Promise(r => setTimeout(r, ms)); },
};

document.addEventListener('DOMContentLoaded', () => App.init());


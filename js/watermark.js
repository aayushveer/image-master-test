/**
 * WATERMARK.JS - Add Watermark Tool
 */

'use strict';

const App = {
    images: [],
    results: [],
    currentIdx: 0,
    logoImage: null,
    settings: {
        type: 'text',
        text: '© Image Runner',
        fontFamily: 'Inter, sans-serif',
        fontSize: 48,
        fontColor: '#ffffff',
        logoSize: 20,
        position: 'middle-center',
        opacity: 50,
        rotation: 0,
        tile: false
    },
    maxImages: 20,
    maxFileSize: 15 * 1024 * 1024,
    el: {},
    
    init() {
        this.cacheElements();
        this.bindEvents();
        this.updatePreview();
    },
    
    cacheElements() {
        this.el = {
            pageUpload: document.getElementById('page-upload'),
            pageEditor: document.getElementById('page-editor'),
            pageDownload: document.getElementById('page-download'),
            
            fileInput: document.getElementById('file-input'),
            
            previewImage: document.getElementById('preview-image'),
            watermarkPreview: document.getElementById('watermark-preview'),
            currentIdx: document.getElementById('current-idx'),
            totalCount: document.getElementById('total-count'),
            btnPrev: document.getElementById('btn-prev'),
            btnNext: document.getElementById('btn-next'),
            
            typeTabs: document.querySelectorAll('.type-tab'),
            typeText: document.getElementById('type-text'),
            typeLogo: document.getElementById('type-logo'),
            
            watermarkText: document.getElementById('watermark-text'),
            fontFamily: document.getElementById('font-family'),
            fontSize: document.getElementById('font-size'),
            fontSizeValue: document.getElementById('font-size-value'),
            fontColor: document.getElementById('font-color'),
            
            logoInput: document.getElementById('logo-input'),
            logoBtn: document.getElementById('logo-btn'),
            logoText: document.getElementById('logo-text'),
            logoSize: document.getElementById('logo-size'),
            logoSizeValue: document.getElementById('logo-size-value'),
            
            posBtns: document.querySelectorAll('.pos-btn'),
            opacity: document.getElementById('opacity'),
            opacityValue: document.getElementById('opacity-value'),
            rotation: document.getElementById('rotation'),
            rotationValue: document.getElementById('rotation-value'),
            tileMode: document.getElementById('tile-mode'),
            
            btnApply: document.getElementById('btn-apply'),
            
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
        // File input
        this.el.fileInput?.addEventListener('change', (e) => this.handleFiles(e.target.files));
        
        // Drag and drop
        document.body.addEventListener('dragover', (e) => e.preventDefault());
        document.body.addEventListener('drop', (e) => {
            e.preventDefault();
            if (e.dataTransfer.files.length) this.handleFiles(e.dataTransfer.files);
        });
        
        // Navigation
        this.el.btnPrev?.addEventListener('click', () => this.navigateImage(-1));
        this.el.btnNext?.addEventListener('click', () => this.navigateImage(1));
        
        // Type tabs
        this.el.typeTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.el.typeTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.settings.type = tab.dataset.type;
                this.el.typeText?.classList.toggle('active', this.settings.type === 'text');
                this.el.typeLogo?.classList.toggle('active', this.settings.type === 'logo');
                this.updatePreview();
            });
        });
        
        // Text settings
        this.el.watermarkText?.addEventListener('input', (e) => {
            this.settings.text = e.target.value;
            this.updatePreview();
        });
        
        this.el.fontFamily?.addEventListener('change', (e) => {
            this.settings.fontFamily = e.target.value;
            this.updatePreview();
        });
        
        this.el.fontSize?.addEventListener('input', (e) => {
            this.settings.fontSize = parseInt(e.target.value) || 48;
            if (this.el.fontSizeValue) {
                this.el.fontSizeValue.textContent = this.settings.fontSize + 'px';
            }
            this.updatePreview();
        });
        
        this.el.fontColor?.addEventListener('input', (e) => {
            this.settings.fontColor = e.target.value;
            this.updatePreview();
        });
        
        // Logo settings
        this.el.logoInput?.addEventListener('change', (e) => this.handleLogo(e.target.files[0]));
        
        this.el.logoSize?.addEventListener('input', (e) => {
            this.settings.logoSize = parseInt(e.target.value);
            this.el.logoSizeValue.textContent = this.settings.logoSize + '%';
            this.updatePreview();
        });
        
        // Position
        this.el.posBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.el.posBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.settings.position = btn.dataset.pos;
                this.updatePreview();
            });
        });
        
        // Opacity
        this.el.opacity?.addEventListener('input', (e) => {
            this.settings.opacity = parseInt(e.target.value);
            this.el.opacityValue.textContent = this.settings.opacity + '%';
            this.updatePreview();
        });
        
        // Rotation
        this.el.rotation?.addEventListener('input', (e) => {
            this.settings.rotation = parseInt(e.target.value);
            this.el.rotationValue.textContent = this.settings.rotation + '°';
            this.updatePreview();
        });
        
        // Tile mode
        this.el.tileMode?.addEventListener('change', (e) => {
            this.settings.tile = e.target.checked;
            this.updatePreview();
        });
        
        // Apply
        this.el.btnApply?.addEventListener('click', () => this.applyWatermarks());
        
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
        
        if (this.images.length > 0) {
            this.showPage('editor');
            this.currentIdx = 0;
            this.displayCurrentImage();
            this.updateNavigation();
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
                type: file.type,
                element: img 
            });
            img.onerror = () => { URL.revokeObjectURL(url); reject(); };
            img.src = url;
        });
    },
    
    handleLogo(file) {
        if (!file) return;
        
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            this.logoImage = { url, element: img, width: img.naturalWidth, height: img.naturalHeight };
            this.el.logoBtn.classList.add('has-logo');
            this.el.logoText.textContent = 'Logo uploaded ✓';
            this.updatePreview();
        };
        img.src = url;
    },
    
    displayCurrentImage() {
        const img = this.images[this.currentIdx];
        if (!img) return;
        
        this.el.previewImage.src = img.url;
        this.updatePreview();
    },
    
    updatePreview() {
        const preview = this.el.watermarkPreview;
        if (!preview) return;
        
        preview.innerHTML = '';
        preview.classList.remove('tile');
        preview.style.background = '';
        
        const opacity = this.settings.opacity / 100;
        const rotation = this.settings.rotation;
        
        if (this.settings.tile) {
            // Tile mode - create pattern
            preview.classList.add('tile');
            // For preview, we'll create multiple elements
            const fragment = document.createDocumentFragment();
            for (let i = 0; i < 9; i++) {
                const el = this.createWatermarkElement(opacity, rotation);
                if (el) {
                    el.style.position = 'relative';
                    el.style.margin = '30px 50px';
                    fragment.appendChild(el);
                }
            }
            preview.style.display = 'flex';
            preview.style.flexWrap = 'wrap';
            preview.style.alignItems = 'center';
            preview.style.justifyContent = 'center';
            preview.appendChild(fragment);
        } else {
            // Single watermark
            preview.style.display = 'flex';
            const el = this.createWatermarkElement(opacity, rotation);
            if (el) {
                this.positionWatermark(preview, el);
                preview.appendChild(el);
            }
        }
    },
    
    createWatermarkElement(opacity, rotation) {
        if (this.settings.type === 'text') {
            const span = document.createElement('span');
            span.className = 'watermark-text';
            span.textContent = this.settings.text || '© Watermark';
            span.style.fontFamily = this.settings.fontFamily;
            span.style.fontSize = this.settings.fontSize + 'px';
            span.style.color = this.settings.fontColor;
            span.style.opacity = opacity;
            span.style.transform = `rotate(${rotation}deg)`;
            return span;
        } else if (this.settings.type === 'logo' && this.logoImage) {
            const img = document.createElement('img');
            img.className = 'watermark-logo';
            img.src = this.logoImage.url;
            img.style.width = this.settings.logoSize + '%';
            img.style.opacity = opacity;
            img.style.transform = `rotate(${rotation}deg)`;
            return img;
        }
        return null;
    },
    
    positionWatermark(container, element) {
        const pos = this.settings.position;
        
        // Reset
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        element.style.margin = '20px';
        
        if (pos.includes('top')) container.style.alignItems = 'flex-start';
        if (pos.includes('bottom')) container.style.alignItems = 'flex-end';
        if (pos.includes('left')) container.style.justifyContent = 'flex-start';
        if (pos.includes('right')) container.style.justifyContent = 'flex-end';
    },
    
    navigateImage(direction) {
        this.currentIdx = Math.max(0, Math.min(this.currentIdx + direction, this.images.length - 1));
        this.displayCurrentImage();
        this.updateNavigation();
    },
    
    updateNavigation() {
        this.el.currentIdx.textContent = this.currentIdx + 1;
        this.el.totalCount.textContent = this.images.length;
        this.el.btnPrev.disabled = this.currentIdx === 0;
        this.el.btnNext.disabled = this.currentIdx === this.images.length - 1;
    },
    
    async applyWatermarks() {
        if (!this.images.length) return;
        
        if (this.settings.type === 'logo' && !this.logoImage) {
            alert('Please upload a logo first');
            return;
        }
        
        this.showProcessing(true);
        this.results = [];
        
        const total = this.images.length;
        
        try {
            for (let i = 0; i < total; i++) {
                this.updateProgress(i, total, `Adding watermark ${i + 1} of ${total}...`);
                const result = await this.processImage(this.images[i]);
                this.results.push(result);
                await this.delay(30);
            }
            
            this.updateProgress(total, total, 'Done!');
            await this.delay(300);
            
            this.showDownload();
        } catch (e) {
            console.error(e);
            alert('Error adding watermarks');
        } finally {
            this.showProcessing(false);
        }
    },
    
    processImage(img) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Draw original image
            ctx.drawImage(img.element, 0, 0);
            
            // Apply watermark
            ctx.globalAlpha = this.settings.opacity / 100;
            
            if (this.settings.tile) {
                this.drawTiledWatermark(ctx, img.width, img.height);
            } else {
                this.drawSingleWatermark(ctx, img.width, img.height);
            }
            
            ctx.globalAlpha = 1;
            
            canvas.toBlob((blob) => {
                if (!blob) { reject(); return; }
                
                const baseName = img.name.replace(/\.[^/.]+$/, '');
                const fileName = `${baseName}_watermarked.jpg`;
                
                resolve({
                    fileName,
                    blob,
                    url: URL.createObjectURL(blob),
                    originalName: img.name,
                });
                
                canvas.width = 0;
                canvas.height = 0;
            }, 'image/jpeg', 0.92);
        });
    },
    
    drawSingleWatermark(ctx, width, height) {
        const pos = this.getPositionCoords(width, height);
        
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(this.settings.rotation * Math.PI / 180);
        
        if (this.settings.type === 'text') {
            ctx.font = `${this.settings.fontSize}px ${this.settings.fontFamily}`;
            ctx.fillStyle = this.settings.fontColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.fillText(this.settings.text, 0, 0);
        } else if (this.logoImage) {
            const logoW = width * (this.settings.logoSize / 100);
            const logoH = (this.logoImage.height / this.logoImage.width) * logoW;
            ctx.drawImage(this.logoImage.element, -logoW / 2, -logoH / 2, logoW, logoH);
        }
        
        ctx.restore();
    },
    
    drawTiledWatermark(ctx, width, height) {
        const spacingX = width / 3;
        const spacingY = height / 3;
        
        for (let y = spacingY / 2; y < height; y += spacingY) {
            for (let x = spacingX / 2; x < width; x += spacingX) {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(this.settings.rotation * Math.PI / 180);
                
                if (this.settings.type === 'text') {
                    const fontSize = Math.min(this.settings.fontSize, width / 15);
                    ctx.font = `${fontSize}px ${this.settings.fontFamily}`;
                    ctx.fillStyle = this.settings.fontColor;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.shadowColor = 'rgba(0,0,0,0.3)';
                    ctx.shadowBlur = 2;
                    ctx.fillText(this.settings.text, 0, 0);
                } else if (this.logoImage) {
                    const logoW = width * (this.settings.logoSize / 100) * 0.5;
                    const logoH = (this.logoImage.height / this.logoImage.width) * logoW;
                    ctx.drawImage(this.logoImage.element, -logoW / 2, -logoH / 2, logoW, logoH);
                }
                
                ctx.restore();
            }
        }
    },
    
    getPositionCoords(width, height) {
        const pos = this.settings.position;
        const margin = 0.05;
        
        let x = width / 2;
        let y = height / 2;
        
        if (pos.includes('left')) x = width * margin + 100;
        if (pos.includes('right')) x = width * (1 - margin) - 100;
        if (pos.includes('top')) y = height * margin + 50;
        if (pos.includes('bottom')) y = height * (1 - margin) - 50;
        
        return { x, y };
    },
    
    showDownload() {
        this.el.downloadInfo.textContent = `${this.results.length} images watermarked`;
        
        this.el.resultsList.innerHTML = '';
        this.results.forEach(r => {
            const item = document.createElement('div');
            item.className = 'result-item';
            item.innerHTML = `
                <img class="result-thumb" src="${r.url}" alt="">
                <div class="result-info">
                    <div class="result-name">${r.originalName}</div>
                    <div class="result-status">Watermark added ✓</div>
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
        this.downloadBlob(zipBlob, `watermarked-images-${date}.zip`);
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
        if (this.el.btnApply) this.el.btnApply.disabled = show;
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



/**
 * REDUCER.JS - Image Reducer Tool
 */

'use strict';

const App = {
    images: [],
    results: [],
    quality: 75,
    maxWidth: 1920,
    maxHeight: 1080,
    maxImages: 20,
    maxFileSize: 10 * 1024 * 1024,
    el: {},
    
    init() {
        this.cacheElements();
        this.bindEvents();
        this.updateSlider();
    },
    
    cacheElements() {
        this.el = {
            pageUpload: document.getElementById('page-upload'),
            pageEditor: document.getElementById('page-editor'),
            pageDownload: document.getElementById('page-download'),
            
            dropzone: document.getElementById('dropzone'),
            fileInput: document.getElementById('file-input'),
            fileInputMore: document.getElementById('file-input-more'),
            
            imageList: document.getElementById('image-list'),
            imageCount: document.getElementById('image-count'),
            
            presets: document.querySelectorAll('.preset'),
            maxWidthInput: document.getElementById('max-width'),
            maxHeightInput: document.getElementById('max-height'),
            
            qualitySlider: document.getElementById('quality-slider'),
            qualityValue: document.getElementById('quality-value'),
            btnReduce: document.getElementById('btn-reduce'),
            
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
        
        // Presets
        this.el.presets.forEach(btn => {
            btn.addEventListener('click', () => {
                this.el.presets.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.maxWidth = parseInt(btn.dataset.width);
                this.maxHeight = parseInt(btn.dataset.height);
                if (this.el.maxWidthInput) this.el.maxWidthInput.value = '';
                if (this.el.maxHeightInput) this.el.maxHeightInput.value = '';
            });
        });
        
        // Custom size inputs
        this.el.maxWidthInput?.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            if (val > 0) {
                this.maxWidth = val;
                this.el.presets.forEach(b => b.classList.remove('active'));
            }
        });
        
        this.el.maxHeightInput?.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            if (val > 0) {
                this.maxHeight = val;
                this.el.presets.forEach(b => b.classList.remove('active'));
            }
        });
        
        // Quality slider
        this.el.qualitySlider?.addEventListener('input', (e) => {
            this.quality = parseInt(e.target.value);
            this.el.qualityValue.textContent = this.quality + '%';
            this.updateSlider();
        });
        
        // Reduce button
        this.el.btnReduce?.addEventListener('click', () => this.reduce());
        
        // Download
        this.el.btnDownload?.addEventListener('click', () => this.download());
        
        // More
        this.el.btnMore?.addEventListener('click', () => this.reset());
    },
    
    updateSlider() {
        const slider = this.el.qualitySlider;
        if (!slider) return;
        const pct = (slider.value - slider.min) / (slider.max - slider.min) * 100;
        slider.style.background = `linear-gradient(to right, var(--primary) 0%, var(--primary) ${pct}%, var(--bg) ${pct}%)`;
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
            this.showPage('editor');
            this.renderImages();
            this.el.btnReduce.disabled = false;
        }
    },
    
    loadImage(file) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => resolve({ file, name: file.name, size: file.size, width: img.naturalWidth, height: img.naturalHeight, url, type: file.type });
            img.onerror = () => { URL.revokeObjectURL(url); reject(); };
            img.src = url;
        });
    },
    
    renderImages() {
        this.el.imageList.innerHTML = '';
        
        this.images.forEach((img, idx) => {
            const card = document.createElement('div');
            card.className = 'img-card';
            card.innerHTML = `
                <img src="${img.url}" alt="${img.name}">
                <div class="img-card__info">${this.formatSize(img.size)}</div>
                <button class="img-card__remove" data-idx="${idx}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            `;
            card.querySelector('.img-card__remove').onclick = () => this.removeImage(idx);
            this.el.imageList.appendChild(card);
        });
        
        this.el.imageCount.textContent = this.images.length;
    },
    
    removeImage(idx) {
        const removed = this.images.splice(idx, 1)[0];
        if (removed?.url) URL.revokeObjectURL(removed.url);
        
        if (this.images.length === 0) {
            this.showPage('upload');
            this.el.btnReduce.disabled = true;
        } else {
            this.renderImages();
        }
    },
    
    async reduce() {
        if (!this.images.length) return;
        
        this.showProcessing(true);
        this.results = [];
        
        let totalOrig = 0, totalNew = 0;
        const total = this.images.length;
        
        try {
            for (let i = 0; i < total; i++) {
                this.updateProgress(i, total, `Reducing ${i + 1} of ${total}...`);
                const result = await this.processImage(this.images[i]);
                this.results.push(result);
                totalOrig += result.originalSize;
                totalNew += result.newSize;
                await this.delay(30);
            }
            
            this.updateProgress(total, total, 'Done!');
            await this.delay(300);
            
            this.showDownload(totalOrig, totalNew);
        } catch (e) {
            console.error(e);
            alert('Error during reduction');
        } finally {
            this.showProcessing(false);
        }
    },
    
    processImage(img) {
        return new Promise((resolve, reject) => {
            let newWidth = img.width;
            let newHeight = img.height;
            
            // Calculate scale to fit within max dimensions
            const widthScale = this.maxWidth / img.width;
            const heightScale = this.maxHeight / img.height;
            const scale = Math.min(widthScale, heightScale, 1);
            
            if (scale < 1) {
                newWidth = Math.round(img.width * scale);
                newHeight = Math.round(img.height * scale);
            }
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = newWidth;
            canvas.height = newHeight;
            
            const image = new Image();
            image.onload = () => {
                ctx.drawImage(image, 0, 0, newWidth, newHeight);
                
                const mimeType = 'image/jpeg';
                const quality = this.quality / 100;
                
                canvas.toBlob((blob) => {
                    if (!blob) { reject(); return; }
                    
                    const baseName = img.name.replace(/\.[^/.]+$/, '');
                    const fileName = `${baseName}_reduced.jpg`;
                    const saved = img.size - blob.size;
                    const savedPct = Math.round((saved / img.size) * 100);
                    
                    resolve({
                        fileName,
                        blob,
                        url: URL.createObjectURL(blob),
                        originalSize: img.size,
                        newSize: blob.size,
                        originalWidth: img.width,
                        originalHeight: img.height,
                        newWidth,
                        newHeight,
                        savedPct,
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
    
    showDownload(totalOrig, totalNew) {
        const saved = totalOrig - totalNew;
        const savedPct = Math.round((saved / totalOrig) * 100);
        
        this.el.downloadInfo.textContent = `Saved ${this.formatSize(saved)} (${savedPct}% reduction)`;
        
        this.el.resultsList.innerHTML = '';
        this.results.forEach(r => {
            const item = document.createElement('div');
            item.className = 'result-item';
            item.innerHTML = `
                <img class="result-thumb" src="${r.url}" alt="">
                <div class="result-info">
                    <div class="result-name">${r.originalName}</div>
                    <div class="result-details">${r.originalWidth}×${r.originalHeight} → <span>${r.newWidth}×${r.newHeight}</span></div>
                </div>
                <div class="result-saved">-${r.savedPct}%</div>
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
        this.downloadBlob(zipBlob, `reduced-images-${date}.zip`);
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
        this.showPage('upload');
    },
    
    showProcessing(show) {
        this.el.processing?.classList.toggle('active', show);
        if (this.el.btnReduce) this.el.btnReduce.disabled = show;
        if (!show && this.el.progressBar) this.el.progressBar.style.width = '0%';
    },
    
    updateProgress(current, total, text) {
        const pct = Math.round((current / total) * 100);
        if (this.el.processingText) this.el.processingText.textContent = text;
        if (this.el.progressBar) this.el.progressBar.style.width = pct + '%';
    },
    
    formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    },
    
    delay(ms) { return new Promise(r => setTimeout(r, ms)); },
};

document.addEventListener('DOMContentLoaded', () => App.init());



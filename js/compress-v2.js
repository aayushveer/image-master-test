/**
 * COMPRESS-V2.JS - Image Compression Tool
 */

'use strict';

const App = {
    images: [],
    results: [],
    quality: 75,
    qualityPresets: { low: 85, medium: 75, high: 60 },
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
            
            modes: document.querySelectorAll('.mode'),
            qualitySlider: document.getElementById('quality-slider'),
            qualityValue: document.getElementById('quality-value'),
            btnCompress: document.getElementById('btn-compress'),
            
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
        this.el.fileInput?.addEventListener('change', (e) => this.handleFiles(e.target.files));
        this.el.fileInputMore?.addEventListener('change', (e) => this.handleFiles(e.target.files));
        
        // Drag and drop on body
        document.body.addEventListener('dragover', (e) => e.preventDefault());
        document.body.addEventListener('drop', (e) => {
            e.preventDefault();
            if (e.dataTransfer.files.length) this.handleFiles(e.dataTransfer.files);
        });
        
        // Modes
        this.el.modes.forEach(btn => {
            btn.addEventListener('click', () => {
                this.el.modes.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.quality = this.qualityPresets[btn.dataset.level];
                this.el.qualitySlider.value = this.quality;
                this.el.qualityValue.textContent = this.quality + '%';
                this.updateSlider();
            });
        });
        
        // Quality slider
        this.el.qualitySlider?.addEventListener('input', (e) => {
            this.quality = parseInt(e.target.value);
            this.el.qualityValue.textContent = this.quality + '%';
            this.updateSlider();
        });
        
        // Compress
        this.el.btnCompress?.addEventListener('click', () => this.compress());
        
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
            this.el.btnCompress.disabled = false;
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
            this.el.btnCompress.disabled = true;
        } else {
            this.renderImages();
        }
    },
    
    async compress() {
        if (!this.images.length) return;
        
        this.showProcessing(true);
        this.results = [];
        
        let totalOrig = 0, totalComp = 0;
        const total = this.images.length;
        
        try {
            for (let i = 0; i < total; i++) {
                this.updateProgress(i, total, `Compressing ${i + 1} of ${total}...`);
                const result = await this.processImage(this.images[i]);
                this.results.push(result);
                totalOrig += result.originalSize;
                totalComp += result.compressedSize;
                await this.delay(30);
            }
            
            this.updateProgress(total, total, 'Done!');
            await this.delay(300);
            
            this.showDownload(totalOrig, totalComp);
        } catch (e) {
            console.error(e);
            alert('Error during compression');
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
            
            const image = new Image();
            image.onload = () => {
                ctx.drawImage(image, 0, 0);
                
                // FIXED: Preserve original format instead of forcing JPEG
                let mimeType = img.type || 'image/jpeg';
                let extension = 'jpg';
                
                // Determine correct mime type and extension
                if (mimeType === 'image/png' || img.name.toLowerCase().endsWith('.png')) {
                    mimeType = 'image/png';
                    extension = 'png';
                } else if (mimeType === 'image/webp' || img.name.toLowerCase().endsWith('.webp')) {
                    mimeType = 'image/webp';
                    extension = 'webp';
                } else if (mimeType === 'image/gif' || img.name.toLowerCase().endsWith('.gif')) {
                    // GIF loses animation, convert to PNG for quality
                    mimeType = 'image/png';
                    extension = 'png';
                } else {
                    mimeType = 'image/jpeg';
                    extension = 'jpg';
                }
                
                const quality = this.quality / 100;
                
                canvas.toBlob((blob) => {
                    if (!blob) { reject(); return; }
                    
                    const baseName = img.name.replace(/\.[^/.]+$/, '');
                    const fileName = `${baseName}_compressed.${extension}`;
                    const saved = img.size - blob.size;
                    const savedPct = Math.round((saved / img.size) * 100);
                    
                    resolve({
                        fileName,
                        blob,
                        url: URL.createObjectURL(blob),
                        originalSize: img.size,
                        compressedSize: blob.size,
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
    
    showDownload(totalOrig, totalComp) {
        const saved = totalOrig - totalComp;
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
                    <div class="result-sizes">${this.formatSize(r.originalSize)} → <span>${this.formatSize(r.compressedSize)}</span></div>
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
        this.downloadBlob(zipBlob, `compressed-images-${date}.zip`);
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
        if (this.el.btnCompress) this.el.btnCompress.disabled = show;
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



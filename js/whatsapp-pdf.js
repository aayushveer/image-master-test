/**
 * WHATSAPP-PDF.JS - WhatsApp Chat to PDF Converter
 * 100% Client-side, zero uploads, complete privacy
 */

'use strict';

const App = {
    images: [],
    pdfBlob: null,
    pdfUrl: null,
    
    // Settings
    pageSize: 'a4',
    orientation: 'portrait',
    margin: 10,
    quality: 90,
    
    // Limits
    maxImages: 50,
    maxFileSize: 15 * 1024 * 1024,
    
    // DOM Cache
    el: {},
    
    // Drag state
    draggedItem: null,
    
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
            
            pageSize: document.getElementById('page-size'),
            orientBtns: document.querySelectorAll('.orient-btn'),
            marginBtns: document.querySelectorAll('.margin-btn'),
            qualitySlider: document.getElementById('quality-slider'),
            qualityValue: document.getElementById('quality-value'),
            
            btnConvert: document.getElementById('btn-convert'),
            
            downloadInfo: document.getElementById('download-info'),
            pdfName: document.getElementById('pdf-name'),
            pdfSize: document.getElementById('pdf-size'),
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
        
        // Drag and drop on page
        document.body.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.el.dropzone?.classList.add('dragover');
        });
        
        document.body.addEventListener('dragleave', (e) => {
            if (!e.relatedTarget || !document.body.contains(e.relatedTarget)) {
                this.el.dropzone?.classList.remove('dragover');
            }
        });
        
        document.body.addEventListener('drop', (e) => {
            e.preventDefault();
            this.el.dropzone?.classList.remove('dragover');
            if (e.dataTransfer.files.length) this.handleFiles(e.dataTransfer.files);
        });
        
        // Page size
        this.el.pageSize?.addEventListener('change', (e) => {
            this.pageSize = e.target.value;
        });
        
        // Orientation
        this.el.orientBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.el.orientBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.orientation = btn.dataset.orient;
            });
        });
        
        // Margin
        this.el.marginBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.el.marginBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.margin = parseInt(btn.dataset.margin);
            });
        });
        
        // Quality slider
        this.el.qualitySlider?.addEventListener('input', (e) => {
            this.quality = parseInt(e.target.value);
            this.el.qualityValue.textContent = this.quality + '%';
            this.updateSlider();
        });
        
        // Convert
        this.el.btnConvert?.addEventListener('click', () => this.createPDF());
        
        // Download
        this.el.btnDownload?.addEventListener('click', () => this.downloadPDF());
        
        // More
        this.el.btnMore?.addEventListener('click', () => this.reset());
    },
    
    updateSlider() {
        const slider = this.el.qualitySlider;
        if (!slider) return;
        const pct = (slider.value - slider.min) / (slider.max - slider.min) * 100;
        slider.style.background = `linear-gradient(to right, var(--primary) 0%, var(--primary) ${pct}%, var(--bg-light) ${pct}%)`;
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
            alert('Maximum ' + this.maxImages + ' images allowed');
            return;
        }
        
        for (const file of files.slice(0, remaining)) {
            if (!file.type.startsWith('image/')) continue;
            if (file.size > this.maxFileSize) {
                console.warn('File too large:', file.name);
                continue;
            }
            
            try {
                const img = await this.loadImage(file);
                this.images.push(img);
            } catch (e) {
                console.error('Failed to load:', file.name);
            }
        }
        
        // Reset inputs
        if (this.el.fileInput) this.el.fileInput.value = '';
        if (this.el.fileInputMore) this.el.fileInputMore.value = '';
        
        if (this.images.length > 0) {
            this.showPage('editor');
            this.renderImages();
            this.el.btnConvert.disabled = false;
        }
    },
    
    loadImage(file) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const img = new Image();
            
            img.onload = () => {
                resolve({
                    file,
                    name: file.name,
                    size: file.size,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    url,
                    type: file.type,
                    element: img
                });
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image'));
            };
            
            img.src = url;
        });
    },
    
    renderImages() {
        this.el.imageList.innerHTML = '';
        
        this.images.forEach((img, idx) => {
            const card = document.createElement('div');
            card.className = 'img-card';
            card.draggable = true;
            card.dataset.idx = idx;
            
            card.innerHTML = `
                <span class="img-card__order">${idx + 1}</span>
                <img src="${img.url}" alt="Screenshot ${idx + 1}">
                <button class="img-card__remove" data-idx="${idx}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            `;
            
            // Drag events
            card.addEventListener('dragstart', (e) => this.handleDragStart(e, idx));
            card.addEventListener('dragend', (e) => this.handleDragEnd(e));
            card.addEventListener('dragover', (e) => this.handleDragOver(e));
            card.addEventListener('drop', (e) => this.handleDrop(e, idx));
            
            // Remove button
            card.querySelector('.img-card__remove').onclick = (e) => {
                e.stopPropagation();
                this.removeImage(idx);
            };
            
            this.el.imageList.appendChild(card);
        });
        
        this.el.imageCount.textContent = this.images.length;
    },
    
    handleDragStart(e, idx) {
        this.draggedItem = idx;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    },
    
    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        document.querySelectorAll('.img-card').forEach(card => {
            card.classList.remove('drag-over');
        });
    },
    
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const card = e.target.closest('.img-card');
        if (card && !card.classList.contains('dragging')) {
            document.querySelectorAll('.img-card').forEach(c => c.classList.remove('drag-over'));
            card.classList.add('drag-over');
        }
    },
    
    handleDrop(e, targetIdx) {
        e.preventDefault();
        
        if (this.draggedItem === null || this.draggedItem === targetIdx) return;
        
        // Reorder array
        const item = this.images.splice(this.draggedItem, 1)[0];
        this.images.splice(targetIdx, 0, item);
        
        this.draggedItem = null;
        this.renderImages();
    },
    
    removeImage(idx) {
        const removed = this.images.splice(idx, 1)[0];
        if (removed?.url) URL.revokeObjectURL(removed.url);
        
        if (this.images.length === 0) {
            this.showPage('upload');
            this.el.btnConvert.disabled = true;
        } else {
            this.renderImages();
        }
    },
    
    async createPDF() {
        if (!this.images.length) return;
        if (typeof jspdf === 'undefined') {
            alert('PDF library not loaded');
            return;
        }
        
        this.showProcessing(true);
        
        try {
            const { jsPDF } = jspdf;
            
            // Get page dimensions
            const pageSizes = {
                a4: [210, 297],
                letter: [215.9, 279.4],
                legal: [215.9, 355.6]
            };
            
            let [pageW, pageH] = pageSizes[this.pageSize] || pageSizes.a4;
            
            if (this.orientation === 'landscape') {
                [pageW, pageH] = [pageH, pageW];
            }
            
            const pdf = new jsPDF({
                orientation: this.orientation,
                unit: 'mm',
                format: this.pageSize
            });
            
            const margin = this.margin;
            const contentW = pageW - (margin * 2);
            const contentH = pageH - (margin * 2);
            const quality = this.quality / 100;
            
            const total = this.images.length;
            
            for (let i = 0; i < total; i++) {
                this.updateProgress(i, total, `Processing screenshot ${i + 1} of ${total}...`);
                
                if (i > 0) pdf.addPage();
                
                const img = this.images[i];
                
                // Create normalized canvas with white background
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Calculate dimensions to fit page while maintaining aspect ratio
                const imgRatio = img.width / img.height;
                const pageRatio = contentW / contentH;
                
                let drawW, drawH;
                
                if (imgRatio > pageRatio) {
                    // Image is wider than page
                    drawW = contentW;
                    drawH = contentW / imgRatio;
                } else {
                    // Image is taller than page
                    drawH = contentH;
                    drawW = contentH * imgRatio;
                }
                
                // Set canvas size with reasonable resolution
                const scale = Math.min(2, 2000 / Math.max(img.width, img.height));
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                
                // White background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Draw image
                ctx.drawImage(img.element, 0, 0, canvas.width, canvas.height);
                
                // Get data URL
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                
                // Center on page
                const x = margin + (contentW - drawW) / 2;
                const y = margin + (contentH - drawH) / 2;
                
                pdf.addImage(dataUrl, 'JPEG', x, y, drawW, drawH);
                
                // Cleanup
                canvas.width = 0;
                canvas.height = 0;
                
                await this.delay(20);
            }
            
            this.updateProgress(total, total, 'Generating PDF...');
            await this.delay(100);
            
            // Generate blob
            this.pdfBlob = pdf.output('blob');
            this.pdfUrl = URL.createObjectURL(this.pdfBlob);
            
            this.showDownload();
            
        } catch (e) {
            console.error('PDF creation failed:', e);
            alert('Failed to create PDF. Please try again.');
        } finally {
            this.showProcessing(false);
        }
    },
    
    showDownload() {
        const count = this.images.length;
        this.el.downloadInfo.textContent = `${count} screenshot${count > 1 ? 's' : ''} merged into 1 PDF`;
        
        const date = new Date().toISOString().slice(0, 10);
        this.el.pdfName.textContent = `whatsapp-chat-${date}.pdf`;
        this.el.pdfSize.textContent = this.formatSize(this.pdfBlob.size);
        
        this.showPage('download');
    },
    
    downloadPDF() {
        if (!this.pdfBlob) return;
        
        const date = new Date().toISOString().slice(0, 10);
        const fileName = `whatsapp-chat-${date}.pdf`;
        
        const a = document.createElement('a');
        a.href = this.pdfUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    },
    
    reset() {
        // Cleanup URLs
        this.images.forEach(img => {
            if (img.url) URL.revokeObjectURL(img.url);
        });
        
        if (this.pdfUrl) {
            URL.revokeObjectURL(this.pdfUrl);
        }
        
        this.images = [];
        this.pdfBlob = null;
        this.pdfUrl = null;
        
        this.showPage('upload');
    },
    
    showProcessing(show) {
        this.el.processing?.classList.toggle('active', show);
        if (this.el.btnConvert) this.el.btnConvert.disabled = show;
        if (!show && this.el.progressBar) {
            this.el.progressBar.style.width = '0%';
        }
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
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());


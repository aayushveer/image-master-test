/**
 * IMAGE-TO-PDF.JS - Image to PDF Converter
 */

'use strict';

const App = {
    images: [],
    pdfBlob: null,
    pdfUrl: null,
    originalPdfSize: null, // Store original size for compression comparison
    compressionQuality: 100, // Compression quality (100 = original, 80 = balanced, 50 = compact)
    settings: {
        pageSize: 'a4',
        orientation: 'portrait',
        margin: 10,
        fit: 'contain'
    },
    pageSizes: {
        a4: [210, 297],
        letter: [215.9, 279.4],
        legal: [215.9, 355.6],
        fit: null
    },
    maxImages: 50,
    maxFileSize: 15 * 1024 * 1024,
    el: {},
    dragSrcEl: null,
    
    init() {
        this.cacheElements();
        this.bindEvents();
    },
    
    cacheElements() {
        this.el = {
            pageUpload: document.getElementById('page-upload'),
            pageEditor: document.getElementById('page-editor'),
            pageDownload: document.getElementById('page-download'),
            
            fileInput: document.getElementById('file-input'),
            fileInputMore: document.getElementById('file-input-more'),
            
            imageList: document.getElementById('image-list'),
            imageCount: document.getElementById('image-count'),
            
            pageSize: document.getElementById('page-size'),
            orientBtns: document.querySelectorAll('.orient-btn'),
            marginBtns: document.querySelectorAll('.margin-btn'),
            fitBtns: document.querySelectorAll('.fit-btn'),
            btnConvert: document.getElementById('btn-convert'),
            
            downloadInfo: document.getElementById('download-info'),
            pdfName: document.getElementById('pdf-name'),
            pdfSize: document.getElementById('pdf-size'),
            compBtns: document.querySelectorAll('.comp-btn'),
            compressionNote: document.getElementById('compression-note'),
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
        
        // Drag and drop on body (only for new files, not reordering)
        document.body.addEventListener('dragover', (e) => e.preventDefault());
        document.body.addEventListener('drop', (e) => {
            e.preventDefault();
            // Only handle if it's a file drop, not an internal reorder
            if (e.dataTransfer.files.length && !e.dataTransfer.getData('text/plain')) {
                this.handleFiles(e.dataTransfer.files);
            }
        });
        
        // Page size
        this.el.pageSize?.addEventListener('change', (e) => {
            this.settings.pageSize = e.target.value;
        });
        
        // Orientation
        this.el.orientBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.el.orientBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.settings.orientation = btn.dataset.orient;
            });
        });
        
        // Margin
        this.el.marginBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.el.marginBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.settings.margin = parseInt(btn.dataset.margin);
            });
        });
        
        // Fit
        this.el.fitBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.el.fitBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.settings.fit = btn.dataset.fit;
            });
        });
        
        // Convert
        this.el.btnConvert?.addEventListener('click', () => this.convert());
        
        // Download
        this.el.btnDownload?.addEventListener('click', () => this.download());
        
        // Compression options
        this.el.compBtns.forEach(btn => {
            btn.addEventListener('click', async () => {
                this.el.compBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const newQuality = parseInt(btn.dataset.quality);
                
                if (newQuality !== this.compressionQuality && this.pdfBlob) {
                    this.compressionQuality = newQuality;
                    // Re-generate PDF with new compression
                    await this.regeneratePDF();
                } else {
                    this.compressionQuality = newQuality;
                }
            });
        });
        
        // More
        this.el.btnMore?.addEventListener('click', () => this.reset());
    },
    
    // Regenerate PDF with compression
    async regeneratePDF() {
        this.showProcessing(true);
        this.updateProgress(0, 1, 'Applying compression...');
        
        try {
            await this.createPDF();
            this.updateDownloadInfo();
            
            // Update compression note
            if (this.el.compressionNote) {
                const originalSize = this.originalPdfSize || this.pdfBlob.size;
                const newSize = this.pdfBlob.size;
                const saved = originalSize - newSize;
                const savedPct = Math.round((saved / originalSize) * 100);
                
                if (savedPct > 0) {
                    this.el.compressionNote.textContent = `Saved ${this.formatSize(saved)} (${savedPct}% smaller)`;
                } else {
                    this.el.compressionNote.textContent = '';
                }
            }
        } catch (e) {
            console.error('Compression error:', e);
        } finally {
            this.showProcessing(false);
        }
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
            this.el.btnConvert.disabled = false;
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
    
    renderImages() {
        this.el.imageList.innerHTML = '';
        
        this.images.forEach((img, idx) => {
            const card = document.createElement('div');
            card.className = 'img-card';
            card.draggable = true;
            card.dataset.idx = idx;
            card.innerHTML = `
                <img src="${img.url}" alt="${img.name}">
                <div class="img-card__order">${idx + 1}</div>
                <button class="img-card__remove">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            `;
            
            card.querySelector('.img-card__remove').onclick = (e) => {
                e.stopPropagation();
                this.removeImage(idx);
            };
            
            // Drag events
            card.addEventListener('dragstart', (e) => this.handleDragStart(e, card));
            card.addEventListener('dragend', () => this.handleDragEnd(card));
            card.addEventListener('dragover', (e) => this.handleDragOver(e, card));
            card.addEventListener('drop', (e) => this.handleDrop(e, card));
            
            this.el.imageList.appendChild(card);
        });
        
        this.el.imageCount.textContent = this.images.length;
    },
    
    handleDragStart(e, card) {
        this.dragSrcEl = card;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', card.dataset.idx);
    },
    
    handleDragEnd(card) {
        card.classList.remove('dragging');
        this.dragSrcEl = null;
    },
    
    handleDragOver(e, card) {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
    },
    
    handleDrop(e, card) {
        e.preventDefault();
        e.stopPropagation();
        
        if (!this.dragSrcEl || this.dragSrcEl === card) return;
        
        const srcIdx = parseInt(this.dragSrcEl.dataset.idx);
        const destIdx = parseInt(card.dataset.idx);
        
        if (isNaN(srcIdx) || isNaN(destIdx)) return;
        if (srcIdx === destIdx) return;
        
        const [removed] = this.images.splice(srcIdx, 1);
        this.images.splice(destIdx, 0, removed);
        
        this.dragSrcEl = null;
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
    
    async convert() {
        if (!this.images.length) return;
        if (typeof jspdf === 'undefined') {
            alert('PDF library not loaded');
            return;
        }
        
        this.showProcessing(true);
        
        try {
            const { jsPDF } = jspdf;
            
            const total = this.images.length;
            let pdf = null;
            
            for (let i = 0; i < total; i++) {
                this.updateProgress(i, total, `Processing image ${i + 1} of ${total}...`);
                
                const img = this.images[i];
                const imgData = await this.getImageData(img);
                
                // Calculate page dimensions
                let pageWidth, pageHeight;
                
                if (this.settings.pageSize === 'fit') {
                    // Fit to image
                    const pxToMm = 0.264583;
                    pageWidth = img.width * pxToMm;
                    pageHeight = img.height * pxToMm;
                } else {
                    const size = this.pageSizes[this.settings.pageSize];
                    if (this.settings.orientation === 'landscape') {
                        pageWidth = size[1];
                        pageHeight = size[0];
                    } else {
                        pageWidth = size[0];
                        pageHeight = size[1];
                    }
                }
                
                if (i === 0) {
                    pdf = new jsPDF({
                        orientation: pageWidth > pageHeight ? 'landscape' : 'portrait',
                        unit: 'mm',
                        format: [pageWidth, pageHeight]
                    });
                } else {
                    pdf.addPage([pageWidth, pageHeight], pageWidth > pageHeight ? 'landscape' : 'portrait');
                }
                
                // Calculate image dimensions
                const margin = this.settings.margin;
                const availW = pageWidth - (margin * 2);
                const availH = pageHeight - (margin * 2);
                
                let imgW, imgH, imgX, imgY;
                
                if (this.settings.fit === 'stretch') {
                    imgW = availW;
                    imgH = availH;
                    imgX = margin;
                    imgY = margin;
                } else if (this.settings.fit === 'cover') {
                    const scale = Math.max(availW / img.width, availH / img.height);
                    imgW = img.width * scale;
                    imgH = img.height * scale;
                    imgX = margin + (availW - imgW) / 2;
                    imgY = margin + (availH - imgH) / 2;
                } else {
                    // contain
                    const scale = Math.min(availW / img.width, availH / img.height);
                    imgW = img.width * scale;
                    imgH = img.height * scale;
                    imgX = margin + (availW - imgW) / 2;
                    imgY = margin + (availH - imgH) / 2;
                }
                
                pdf.addImage(imgData, 'JPEG', imgX, imgY, imgW, imgH);
                
                await this.delay(20);
            }
            
            this.updateProgress(total, total, 'Creating PDF...');
            await this.delay(200);
            
            // Generate blob
            this.pdfBlob = pdf.output('blob');
            this.pdfUrl = URL.createObjectURL(this.pdfBlob);
            
            this.showDownload();
        } catch (e) {
            console.error(e);
            alert('Error creating PDF');
        } finally {
            this.showProcessing(false);
        }
    },
    
    getImageData(img) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Limit size for performance - smaller for higher compression
            let maxDim = 2000;
            if (this.compressionQuality <= 50) {
                maxDim = 1200; // Smaller images for compact mode
            } else if (this.compressionQuality <= 80) {
                maxDim = 1600; // Medium size for balanced mode
            }
            
            let w = img.width;
            let h = img.height;
            
            if (w > maxDim || h > maxDim) {
                const scale = maxDim / Math.max(w, h);
                w = Math.round(w * scale);
                h = Math.round(h * scale);
            }
            
            canvas.width = w;
            canvas.height = h;
            
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);
            ctx.drawImage(img.element, 0, 0, w, h);
            
            // Use compression quality for JPEG encoding
            // 100 = 0.95 quality, 80 = 0.75 quality, 50 = 0.50 quality
            let jpegQuality;
            if (this.compressionQuality >= 100) {
                jpegQuality = 0.95;
            } else if (this.compressionQuality >= 80) {
                jpegQuality = 0.75;
            } else {
                jpegQuality = 0.50;
            }
            
            const dataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
            canvas.width = 0;
            canvas.height = 0;
            
            resolve(dataUrl);
        });
    },
    
    showDownload() {
        const count = this.images.length;
        this.el.downloadInfo.textContent = `${count} image${count > 1 ? 's' : ''} merged into 1 PDF`;
        
        // Store original size for comparison
        if (!this.originalPdfSize) {
            this.originalPdfSize = this.pdfBlob.size;
        }
        
        this.updateDownloadInfo();
        this.showPage('download');
    },
    
    updateDownloadInfo() {
        const date = new Date().toISOString().slice(0, 10);
        const fileName = `images-${date}.pdf`;
        this.el.pdfName.textContent = fileName;
        this.el.pdfSize.textContent = this.formatSize(this.pdfBlob.size);
    },
    
    download() {
        if (!this.pdfBlob) return;
        
        const date = new Date().toISOString().slice(0, 10);
        const fileName = `images-${date}.pdf`;
        
        const a = document.createElement('a');
        a.href = this.pdfUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    },
    
    reset() {
        if (this.pdfUrl) URL.revokeObjectURL(this.pdfUrl);
        this.pdfBlob = null;
        this.pdfUrl = null;
        this.originalPdfSize = null;
        this.compressionQuality = 100;
        
        // Reset compression buttons
        this.el.compBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.quality === '100');
        });
        if (this.el.compressionNote) {
            this.el.compressionNote.textContent = '';
        }
        
        this.images.forEach(i => i.url && URL.revokeObjectURL(i.url));
        this.images = [];
        
        this.showPage('upload');
    },
    
    showProcessing(show) {
        this.el.processing?.classList.toggle('active', show);
        if (this.el.btnConvert) this.el.btnConvert.disabled = show;
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



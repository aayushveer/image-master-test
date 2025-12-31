/**
 * PDF-TO-IMAGE.JS - PDF to Image Converter
 * Uses PDF.js for rendering, JSZip for downloading
 */

'use strict';

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const App = {
    pdf: null,
    pages: [],
    results: [],
    selectedPages: new Set(),
    
    settings: {
        format: 'jpg',
        quality: 90,
        scale: 2,
        pageRange: 'all'
    },
    
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
            
            fileInput: document.getElementById('file-input'),
            fileInputNew: document.getElementById('file-input-new'),
            
            pdfName: document.getElementById('pdf-name'),
            pdfPages: document.getElementById('pdf-pages'),
            pagesGrid: document.getElementById('pages-grid'),
            
            formatBtns: document.querySelectorAll('.format-btn'),
            quality: document.getElementById('quality'),
            qualityValue: document.getElementById('quality-value'),
            qualityGroup: document.getElementById('quality-group'),
            resBtns: document.querySelectorAll('.res-btn'),
            pageRangeInputs: document.querySelectorAll('input[name="page-range"]'),
            selectedHint: document.getElementById('selected-hint'),
            
            btnConvert: document.getElementById('btn-convert'),
            
            downloadDesc: document.getElementById('download-desc'),
            resultsGrid: document.getElementById('results-grid'),
            btnDownloadAll: document.getElementById('btn-download-all'),
            btnNew: document.getElementById('btn-new'),
            
            processing: document.getElementById('processing'),
            processingText: document.getElementById('processing-text'),
            progressFill: document.getElementById('progress-fill'),
            progressText: document.getElementById('progress-text'),
            
            shareTwitter: document.getElementById('share-twitter'),
            shareFacebook: document.getElementById('share-facebook'),
            shareWhatsapp: document.getElementById('share-whatsapp'),
        };
    },
    
    bindEvents() {
        // File inputs
        this.el.fileInput?.addEventListener('change', (e) => {
            if (e.target.files[0]) this.loadPDF(e.target.files[0]);
        });
        
        this.el.fileInputNew?.addEventListener('change', (e) => {
            if (e.target.files[0]) this.loadPDF(e.target.files[0]);
        });
        
        // Drag and drop
        document.body.addEventListener('dragover', (e) => e.preventDefault());
        document.body.addEventListener('drop', (e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file && file.type === 'application/pdf') {
                this.loadPDF(file);
            }
        });
        
        // Format buttons
        this.el.formatBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.el.formatBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.settings.format = btn.dataset.format;
                
                // Show/hide quality slider for JPG
                this.el.qualityGroup.style.display = this.settings.format === 'jpg' ? 'flex' : 'none';
            });
        });
        
        // Quality slider
        this.el.quality?.addEventListener('input', (e) => {
            this.settings.quality = parseInt(e.target.value);
            this.el.qualityValue.textContent = this.settings.quality + '%';
        });
        
        // Resolution buttons
        this.el.resBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.el.resBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.settings.scale = parseInt(btn.dataset.scale);
            });
        });
        
        // Page range
        this.el.pageRangeInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.settings.pageRange = input.value;
                this.el.selectedHint.style.display = input.value === 'selected' ? 'block' : 'none';
                
                if (input.value === 'all') {
                    // Select all pages
                    this.selectedPages.clear();
                    this.pages.forEach((_, i) => this.selectedPages.add(i));
                    this.updatePageSelection();
                }
            });
        });
        
        // Convert button
        this.el.btnConvert?.addEventListener('click', () => this.convert());
        
        // Download all
        this.el.btnDownloadAll?.addEventListener('click', () => this.downloadAll());
        
        // New PDF
        this.el.btnNew?.addEventListener('click', () => this.reset());
        
        // Share
        this.setupShareButtons();
    },
    
    async loadPDF(file) {
        this.showProcessing(true, 'Loading PDF...');
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            this.pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            this.el.pdfName.textContent = file.name;
            this.el.pdfPages.textContent = this.pdf.numPages + ' page' + (this.pdf.numPages > 1 ? 's' : '');
            
            // Reset
            this.pages = [];
            this.selectedPages.clear();
            this.el.pagesGrid.innerHTML = '';
            
            // Render thumbnails
            await this.renderThumbnails();
            
            // Select all by default
            this.pages.forEach((_, i) => this.selectedPages.add(i));
            
            this.showPage('editor');
            
        } catch (error) {
            alert('Error loading PDF. Please try another file.');
        } finally {
            this.showProcessing(false);
        }
    },
    
    async renderThumbnails() {
        const total = this.pdf.numPages;
        
        for (let i = 1; i <= total; i++) {
            this.updateProgress(i - 1, total, 'Loading pages...');
            
            const page = await this.pdf.getPage(i);
            const viewport = page.getViewport({ scale: 0.5 });
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            await page.render({
                canvasContext: ctx,
                viewport: viewport
            }).promise;
            
            // Create thumbnail element
            const thumb = document.createElement('div');
            thumb.className = 'page-thumb selected';
            thumb.dataset.idx = i - 1;
            thumb.innerHTML = `
                <div class="page-thumb__check">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <path d="M20 6L9 17l-5-5"/>
                    </svg>
                </div>
                <span class="page-thumb__number">Page ${i}</span>
            `;
            thumb.insertBefore(canvas, thumb.firstChild);
            
            // Click to toggle selection
            thumb.addEventListener('click', () => this.togglePageSelection(i - 1, thumb));
            
            this.el.pagesGrid.appendChild(thumb);
            this.pages.push({ page, canvas });
        }
    },
    
    togglePageSelection(idx, thumb) {
        if (this.settings.pageRange !== 'selected') return;
        
        if (this.selectedPages.has(idx)) {
            this.selectedPages.delete(idx);
            thumb.classList.remove('selected');
        } else {
            this.selectedPages.add(idx);
            thumb.classList.add('selected');
        }
    },
    
    updatePageSelection() {
        const thumbs = this.el.pagesGrid.querySelectorAll('.page-thumb');
        thumbs.forEach((thumb, idx) => {
            if (this.selectedPages.has(idx)) {
                thumb.classList.add('selected');
            } else {
                thumb.classList.remove('selected');
            }
        });
    },
    
    async convert() {
        const pagesToConvert = this.settings.pageRange === 'all' 
            ? [...Array(this.pdf.numPages).keys()]
            : [...this.selectedPages].sort((a, b) => a - b);
        
        if (pagesToConvert.length === 0) {
            alert('Please select at least one page');
            return;
        }
        
        this.showProcessing(true, 'Converting pages...');
        this.results = [];
        
        const total = pagesToConvert.length;
        const format = this.settings.format;
        const quality = this.settings.quality / 100;
        const scale = this.settings.scale;
        
        try {
            for (let i = 0; i < total; i++) {
                const pageIdx = pagesToConvert[i];
                this.updateProgress(i, total, `Converting page ${i + 1} of ${total}...`);
                
                const page = await this.pdf.getPage(pageIdx + 1);
                const viewport = page.getViewport({ scale });
                
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                
                // White background for JPG
                if (format === 'jpg') {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
                
                await page.render({
                    canvasContext: ctx,
                    viewport: viewport
                }).promise;
                
                // Convert to blob
                const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
                const blob = await new Promise(resolve => {
                    canvas.toBlob(resolve, mimeType, format === 'jpg' ? quality : undefined);
                });
                
                const url = URL.createObjectURL(blob);
                
                this.results.push({
                    pageNum: pageIdx + 1,
                    blob,
                    url,
                    name: `page_${String(pageIdx + 1).padStart(3, '0')}.${format}`
                });
            }
            
            // Show results
            this.renderResults();
            this.showPage('download');
            
        } catch (error) {
            alert('Error converting PDF');
        } finally {
            this.showProcessing(false);
        }
    },
    
    renderResults() {
        this.el.downloadDesc.textContent = `${this.results.length} page${this.results.length > 1 ? 's' : ''} converted to ${this.settings.format.toUpperCase()}`;
        
        this.el.resultsGrid.innerHTML = this.results.map((result, idx) => `
            <div class="result-thumb" data-idx="${idx}">
                <img src="${result.url}" alt="Page ${result.pageNum}">
                <div class="result-thumb__download">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                </div>
                <span class="result-thumb__label">Page ${result.pageNum}</span>
            </div>
        `).join('');
        
        // Add click handlers for individual downloads
        this.el.resultsGrid.querySelectorAll('.result-thumb').forEach(thumb => {
            thumb.addEventListener('click', () => {
                const idx = parseInt(thumb.dataset.idx);
                this.downloadSingle(idx);
            });
        });
    },
    
    downloadSingle(idx) {
        const result = this.results[idx];
        if (!result) return;
        
        const a = document.createElement('a');
        a.href = result.url;
        a.download = result.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    },
    
    async downloadAll() {
        if (this.results.length === 0) return;
        
        if (this.results.length === 1) {
            this.downloadSingle(0);
            return;
        }
        
        this.showProcessing(true, 'Creating ZIP...');
        
        try {
            const zip = new JSZip();
            
            for (const result of this.results) {
                zip.file(result.name, result.blob);
            }
            
            const content = await zip.generateAsync({ type: 'blob' });
            
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'pdf_images.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
        } catch (error) {
            alert('Error creating ZIP');
        } finally {
            this.showProcessing(false);
        }
    },
    
    reset() {
        // Cleanup
        this.results.forEach(r => URL.revokeObjectURL(r.url));
        
        this.pdf = null;
        this.pages = [];
        this.results = [];
        this.selectedPages.clear();
        
        this.el.fileInput.value = '';
        this.el.pagesGrid.innerHTML = '';
        this.el.resultsGrid.innerHTML = '';
        
        this.showPage('upload');
    },
    
    showPage(page) {
        this.el.pageUpload.classList.remove('active');
        this.el.pageEditor.classList.remove('active');
        this.el.pageDownload.classList.remove('active');
        
        if (page === 'upload') this.el.pageUpload.classList.add('active');
        else if (page === 'editor') this.el.pageEditor.classList.add('active');
        else if (page === 'download') this.el.pageDownload.classList.add('active');
    },
    
    showProcessing(show, text) {
        if (show) {
            this.el.processing.classList.add('active');
            if (text) this.el.processingText.textContent = text;
            this.el.progressFill.style.width = '0%';
            this.el.progressText.textContent = '';
        } else {
            this.el.processing.classList.remove('active');
        }
    },
    
    updateProgress(current, total, text) {
        const percent = Math.round((current / total) * 100);
        this.el.progressFill.style.width = percent + '%';
        this.el.progressText.textContent = `${current + 1} / ${total}`;
        if (text) this.el.processingText.textContent = text;
    },
    
    setupShareButtons() {
        const url = encodeURIComponent(window.location.href);
        const text = encodeURIComponent('Convert PDF to images instantly with this free tool!');
        
        this.el.shareTwitter?.addEventListener('click', (e) => {
            e.preventDefault();
            window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'width=550,height=420');
        });
        
        this.el.shareFacebook?.addEventListener('click', (e) => {
            e.preventDefault();
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=550,height=420');
        });
        
        this.el.shareWhatsapp?.addEventListener('click', (e) => {
            e.preventDefault();
            window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
        });
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());


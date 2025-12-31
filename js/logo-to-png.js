/**
 * LOGO-TO-PNG.JS - Logo to Transparent PNG Tool
 * Removes background from logos with color-based detection
 */

'use strict';

const App = {
    image: null,
    canvas: null,
    ctx: null,
    originalData: null,
    resultBlob: null,
    
    settings: {
        bgColor: null,
        tolerance: 30,
        smoothing: 1,
        removeSimilar: true,
        invert: false
    },
    
    el: {},
    
    init() {
        this.cacheElements();
        this.createCanvas();
        this.bindEvents();
    },
    
    cacheElements() {
        this.el = {
            pageUpload: document.getElementById('page-upload'),
            pageEditor: document.getElementById('page-editor'),
            pageDownload: document.getElementById('page-download'),
            
            fileInput: document.getElementById('file-input'),
            originalImg: document.getElementById('original-img'),
            resultCanvas: document.getElementById('result-canvas'),
            previewArea: document.getElementById('preview-area'),
            
            toggleBtns: document.querySelectorAll('.toggle-btn'),
            colorBtns: document.querySelectorAll('.color-btn'),
            
            tolerance: document.getElementById('tolerance'),
            toleranceValue: document.getElementById('tolerance-value'),
            smoothing: document.getElementById('smoothing'),
            smoothingValue: document.getElementById('smoothing-value'),
            removeSimilar: document.getElementById('remove-similar'),
            invertSelection: document.getElementById('invert-selection'),
            
            btnReset: document.getElementById('btn-reset'),
            btnDownload: document.getElementById('btn-download'),
            
            finalPreview: document.getElementById('final-preview'),
            fileName: document.getElementById('file-name'),
            fileSize: document.getElementById('file-size'),
            fileDimensions: document.getElementById('file-dimensions'),
            btnSave: document.getElementById('btn-save'),
            btnNew: document.getElementById('btn-new'),
            
            processing: document.getElementById('processing'),
            processingText: document.getElementById('processing-text'),
            
            shareTwitter: document.getElementById('share-twitter'),
            shareFacebook: document.getElementById('share-facebook'),
            shareWhatsapp: document.getElementById('share-whatsapp'),
            shareLinkedin: document.getElementById('share-linkedin'),
        };
    },
    
    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    },
    
    bindEvents() {
        // File input
        this.el.fileInput?.addEventListener('change', (e) => {
            if (e.target.files[0]) this.loadImage(e.target.files[0]);
        });
        
        // Drag and drop
        document.body.addEventListener('dragover', (e) => e.preventDefault());
        document.body.addEventListener('drop', (e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.loadImage(file);
            }
        });
        
        // View toggle
        this.el.toggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.el.toggleBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                this.el.previewArea.classList.remove('split-view', 'result-only');
                this.el.previewArea.classList.add(btn.dataset.view === 'split' ? 'split-view' : 'result-only');
            });
        });
        
        // Color buttons
        this.el.colorBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.el.colorBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const color = btn.dataset.color;
                if (color === 'auto') {
                    this.settings.bgColor = null;
                } else {
                    this.settings.bgColor = this.hexToRgb(color);
                }
                this.processImage();
            });
        });
        
        // Click on image to pick color
        this.el.originalImg?.addEventListener('click', (e) => {
            this.pickColorFromImage(e);
        });
        
        // Settings
        this.el.tolerance?.addEventListener('input', (e) => {
            this.settings.tolerance = parseInt(e.target.value);
            this.el.toleranceValue.textContent = this.settings.tolerance;
            this.debounceProcess();
        });
        
        this.el.smoothing?.addEventListener('input', (e) => {
            this.settings.smoothing = parseInt(e.target.value);
            this.el.smoothingValue.textContent = this.settings.smoothing;
            this.debounceProcess();
        });
        
        this.el.removeSimilar?.addEventListener('change', (e) => {
            this.settings.removeSimilar = e.target.checked;
            this.processImage();
        });
        
        this.el.invertSelection?.addEventListener('change', (e) => {
            this.settings.invert = e.target.checked;
            this.processImage();
        });
        
        // Buttons
        this.el.btnReset?.addEventListener('click', () => this.resetSettings());
        this.el.btnDownload?.addEventListener('click', () => this.goToDownload());
        this.el.btnSave?.addEventListener('click', () => this.saveFile());
        this.el.btnNew?.addEventListener('click', () => this.reset());
        
        // Share buttons
        this.setupShareButtons();
    },
    
    debounceProcess() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => this.processImage(), 150);
    },
    
    async loadImage(file) {
        this.showProcessing(true, 'Loading logo...');
        
        try {
            const url = URL.createObjectURL(file);
            const img = new Image();
            
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = url;
            });
            
            this.image = {
                file,
                name: file.name.replace(/\.[^.]+$/, '') + '_transparent.png',
                width: img.naturalWidth,
                height: img.naturalHeight,
                url,
                element: img
            };
            
            // Set canvas size
            this.canvas.width = img.naturalWidth;
            this.canvas.height = img.naturalHeight;
            
            // Draw and get original data
            this.ctx.drawImage(img, 0, 0);
            this.originalData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            
            // Show original
            this.el.originalImg.src = url;
            this.el.resultCanvas.width = img.naturalWidth;
            this.el.resultCanvas.height = img.naturalHeight;
            
            // Auto-detect background color
            this.settings.bgColor = null;
            this.el.colorBtns.forEach(b => b.classList.remove('active'));
            this.el.colorBtns[0]?.classList.add('active');
            
            this.showPage('editor');
            await this.processImage();
            
        } catch (error) {
            alert('Error loading image');
        } finally {
            this.showProcessing(false);
        }
    },
    
    pickColorFromImage(e) {
        if (!this.originalData) return;
        
        const rect = this.el.originalImg.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const x = Math.floor((e.clientX - rect.left) * scaleX);
        const y = Math.floor((e.clientY - rect.top) * scaleY);
        
        if (x >= 0 && x < this.canvas.width && y >= 0 && y < this.canvas.height) {
            const idx = (y * this.canvas.width + x) * 4;
            this.settings.bgColor = {
                r: this.originalData.data[idx],
                g: this.originalData.data[idx + 1],
                b: this.originalData.data[idx + 2]
            };
            
            // Update UI
            this.el.colorBtns.forEach(b => b.classList.remove('active'));
            this.processImage();
        }
    },
    
    detectBackgroundColor() {
        if (!this.originalData) return { r: 255, g: 255, b: 255 };
        
        const data = this.originalData.data;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        // Sample corners and edges
        const samples = [];
        const sampleSize = 10;
        
        // Top-left corner
        for (let y = 0; y < sampleSize && y < h; y++) {
            for (let x = 0; x < sampleSize && x < w; x++) {
                const idx = (y * w + x) * 4;
                samples.push({ r: data[idx], g: data[idx+1], b: data[idx+2] });
            }
        }
        
        // Top-right corner
        for (let y = 0; y < sampleSize && y < h; y++) {
            for (let x = w - sampleSize; x < w && x >= 0; x++) {
                const idx = (y * w + x) * 4;
                samples.push({ r: data[idx], g: data[idx+1], b: data[idx+2] });
            }
        }
        
        // Bottom-left corner
        for (let y = h - sampleSize; y < h && y >= 0; y++) {
            for (let x = 0; x < sampleSize && x < w; x++) {
                const idx = (y * w + x) * 4;
                samples.push({ r: data[idx], g: data[idx+1], b: data[idx+2] });
            }
        }
        
        // Bottom-right corner
        for (let y = h - sampleSize; y < h && y >= 0; y++) {
            for (let x = w - sampleSize; x < w && x >= 0; x++) {
                const idx = (y * w + x) * 4;
                samples.push({ r: data[idx], g: data[idx+1], b: data[idx+2] });
            }
        }
        
        // Find most common color (simple mode)
        const colorMap = new Map();
        for (const c of samples) {
            const key = `${Math.round(c.r/10)*10},${Math.round(c.g/10)*10},${Math.round(c.b/10)*10}`;
            colorMap.set(key, (colorMap.get(key) || 0) + 1);
        }
        
        let maxCount = 0;
        let dominantKey = '255,255,255';
        for (const [key, count] of colorMap) {
            if (count > maxCount) {
                maxCount = count;
                dominantKey = key;
            }
        }
        
        const [r, g, b] = dominantKey.split(',').map(Number);
        return { r, g, b };
    },
    
    async processImage() {
        if (!this.originalData) return;
        
        const bgColor = this.settings.bgColor || this.detectBackgroundColor();
        const tolerance = this.settings.tolerance;
        const smoothing = this.settings.smoothing;
        const removeSimilar = this.settings.removeSimilar;
        const invert = this.settings.invert;
        
        // Clone original data
        const resultData = new ImageData(
            new Uint8ClampedArray(this.originalData.data),
            this.canvas.width,
            this.canvas.height
        );
        
        const data = resultData.data;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        // Create mask
        const mask = new Uint8Array(w * h);
        
        // First pass: mark pixels to remove based on color similarity
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            const distance = Math.sqrt(
                Math.pow(r - bgColor.r, 2) +
                Math.pow(g - bgColor.g, 2) +
                Math.pow(b - bgColor.b, 2)
            );
            
            const maxDistance = tolerance * 4.42; // Scale tolerance to 0-442 range
            const pixelIdx = i / 4;
            
            if (distance <= maxDistance) {
                mask[pixelIdx] = 1; // Mark for removal
            }
        }
        
        // If removeSimilar, flood fill from corners
        if (removeSimilar) {
            this.floodFillMask(mask, w, h, bgColor, tolerance);
        }
        
        // Apply smoothing (edge feathering)
        if (smoothing > 0) {
            this.smoothMaskEdges(mask, w, h, smoothing);
        }
        
        // Apply mask to image
        for (let i = 0; i < mask.length; i++) {
            const dataIdx = i * 4;
            let alpha = invert ? mask[i] * 255 : (1 - mask[i]) * 255;
            
            // If alpha is partial, blend with background (for smooth edges)
            if (alpha > 0 && alpha < 255) {
                data[dataIdx + 3] = Math.round(alpha);
            } else if (alpha === 0) {
                data[dataIdx + 3] = 0;
            }
            // else keep original alpha
        }
        
        // Draw result
        const resultCtx = this.el.resultCanvas.getContext('2d');
        resultCtx.clearRect(0, 0, w, h);
        resultCtx.putImageData(resultData, 0, 0);
    },
    
    floodFillMask(mask, w, h, bgColor, tolerance) {
        const visited = new Uint8Array(w * h);
        const maxDist = tolerance * 4.42;
        
        const queue = [];
        
        // Start from corners
        const corners = [
            0, w - 1, 
            (h - 1) * w, (h - 1) * w + w - 1
        ];
        
        for (const start of corners) {
            if (!visited[start]) {
                queue.push(start);
                visited[start] = 1;
            }
        }
        
        // Also add edges
        for (let x = 0; x < w; x++) {
            if (!visited[x]) { queue.push(x); visited[x] = 1; }
            const bottomIdx = (h - 1) * w + x;
            if (!visited[bottomIdx]) { queue.push(bottomIdx); visited[bottomIdx] = 1; }
        }
        for (let y = 0; y < h; y++) {
            const leftIdx = y * w;
            const rightIdx = y * w + w - 1;
            if (!visited[leftIdx]) { queue.push(leftIdx); visited[leftIdx] = 1; }
            if (!visited[rightIdx]) { queue.push(rightIdx); visited[rightIdx] = 1; }
        }
        
        const data = this.originalData.data;
        
        while (queue.length > 0) {
            const idx = queue.shift();
            const x = idx % w;
            const y = Math.floor(idx / w);
            const dataIdx = idx * 4;
            
            const r = data[dataIdx];
            const g = data[dataIdx + 1];
            const b = data[dataIdx + 2];
            
            const dist = Math.sqrt(
                Math.pow(r - bgColor.r, 2) +
                Math.pow(g - bgColor.g, 2) +
                Math.pow(b - bgColor.b, 2)
            );
            
            if (dist <= maxDist) {
                mask[idx] = 1;
                
                // Add neighbors
                const neighbors = [
                    idx - 1, idx + 1,
                    idx - w, idx + w
                ];
                
                for (const n of neighbors) {
                    if (n >= 0 && n < w * h && !visited[n]) {
                        const nx = n % w;
                        const ny = Math.floor(n / w);
                        
                        // Check bounds
                        if (Math.abs(nx - x) <= 1 && Math.abs(ny - y) <= 1) {
                            visited[n] = 1;
                            queue.push(n);
                        }
                    }
                }
            }
        }
    },
    
    smoothMaskEdges(mask, w, h, radius) {
        const output = new Float32Array(mask);
        
        for (let pass = 0; pass < radius; pass++) {
            const temp = new Float32Array(output);
            
            for (let y = 1; y < h - 1; y++) {
                for (let x = 1; x < w - 1; x++) {
                    const idx = y * w + x;
                    
                    // Only smooth edge pixels
                    if (mask[idx] === 0 || mask[idx] === 1) {
                        const neighbors = [
                            temp[idx - 1], temp[idx + 1],
                            temp[idx - w], temp[idx + w],
                            temp[idx - w - 1], temp[idx - w + 1],
                            temp[idx + w - 1], temp[idx + w + 1]
                        ];
                        
                        const hasTransparent = neighbors.some(n => n > 0.5);
                        const hasOpaque = neighbors.some(n => n < 0.5);
                        
                        if (hasTransparent && hasOpaque) {
                            // Edge pixel - smooth it
                            const avg = neighbors.reduce((a, b) => a + b, 0) / 8;
                            output[idx] = avg;
                        }
                    }
                }
            }
        }
        
        // Copy back to mask
        for (let i = 0; i < mask.length; i++) {
            mask[i] = output[i];
        }
    },
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    },
    
    resetSettings() {
        this.settings.tolerance = 30;
        this.settings.smoothing = 1;
        this.settings.removeSimilar = true;
        this.settings.invert = false;
        this.settings.bgColor = null;
        
        this.el.tolerance.value = 30;
        this.el.toleranceValue.textContent = '30';
        this.el.smoothing.value = 1;
        this.el.smoothingValue.textContent = '1';
        this.el.removeSimilar.checked = true;
        this.el.invertSelection.checked = false;
        
        this.el.colorBtns.forEach(b => b.classList.remove('active'));
        this.el.colorBtns[0]?.classList.add('active');
        
        this.processImage();
    },
    
    async goToDownload() {
        this.showProcessing(true, 'Creating PNG...');
        
        try {
            // Get blob from result canvas
            const blob = await new Promise(resolve => {
                this.el.resultCanvas.toBlob(resolve, 'image/png');
            });
            
            this.resultBlob = blob;
            
            // Create preview
            const url = URL.createObjectURL(blob);
            this.el.finalPreview.src = url;
            
            // Update info
            this.el.fileName.textContent = this.image.name;
            this.el.fileSize.textContent = this.formatSize(blob.size);
            this.el.fileDimensions.textContent = `${this.image.width} × ${this.image.height}`;
            
            this.showPage('download');
            
        } catch (error) {
            alert('Error creating PNG');
        } finally {
            this.showProcessing(false);
        }
    },
    
    saveFile() {
        if (!this.resultBlob) return;
        
        const url = URL.createObjectURL(this.resultBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.image.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
    
    reset() {
        if (this.image?.url) URL.revokeObjectURL(this.image.url);
        
        this.image = null;
        this.originalData = null;
        this.resultBlob = null;
        
        this.el.fileInput.value = '';
        this.resetSettings();
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
        } else {
            this.el.processing.classList.remove('active');
        }
    },
    
    formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    },
    
    setupShareButtons() {
        const url = encodeURIComponent(window.location.href);
        const text = encodeURIComponent('Remove background from logos instantly with this free tool!');
        
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
        
        this.el.shareLinkedin?.addEventListener('click', (e) => {
            e.preventDefault();
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'width=550,height=420');
        });
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());


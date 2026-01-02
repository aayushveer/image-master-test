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
        
        // Create mask (float for smooth transitions)
        const mask = new Float32Array(w * h);
        
        // IMPROVED: Exponential tolerance curve for better perceptual control
        // At 0% = very strict (distance 5), at 100% = remove everything connected
        const normalizedTolerance = tolerance / 100;
        const maxDistance = tolerance === 100 
            ? 999 // At 100%, remove ALL background-connected pixels regardless of color
            : 5 + Math.pow(normalizedTolerance, 1.5) * 437; // Exponential curve: 5 to 442
        
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
            
            const pixelIdx = i / 4;
            
            if (distance <= maxDistance) {
                // IMPROVED: Soft edge based on distance ratio for anti-aliasing
                if (distance < maxDistance * 0.7) {
                    mask[pixelIdx] = 1; // Fully remove
                } else {
                    // Gradual falloff at edges
                    mask[pixelIdx] = 1 - ((distance - maxDistance * 0.7) / (maxDistance * 0.3));
                    mask[pixelIdx] = Math.max(0, Math.min(1, mask[pixelIdx]));
                }
            }
        }
        
        // If removeSimilar, flood fill from corners (ensures only background is removed)
        if (removeSimilar) {
            this.floodFillMask(mask, w, h, bgColor, tolerance);
        }
        
        // IMPROVED: Morphological cleanup to remove isolated dots/artifacts
        this.morphologicalCleanup(mask, w, h);
        
        // Apply smoothing (edge feathering)
        if (smoothing > 0) {
            this.smoothMaskEdges(mask, w, h, smoothing);
        }
        
        // IMPROVED: Final noise removal pass - remove small isolated transparent/opaque regions
        this.removeIsolatedPixels(mask, w, h, 3); // Remove clusters smaller than 3x3
        
        // Apply mask to image
        for (let i = 0; i < mask.length; i++) {
            const dataIdx = i * 4;
            let alpha = invert ? mask[i] : (1 - mask[i]);
            
            // Clamp and apply alpha
            alpha = Math.max(0, Math.min(1, alpha));
            data[dataIdx + 3] = Math.round(alpha * 255);
        }
        
        // Draw result
        const resultCtx = this.el.resultCanvas.getContext('2d');
        resultCtx.clearRect(0, 0, w, h);
        resultCtx.putImageData(resultData, 0, 0);
    },
    
    // NEW: Morphological cleanup - erode then dilate to remove noise
    morphologicalCleanup(mask, w, h) {
        const temp = new Float32Array(mask);
        
        // Erosion pass - shrink mask to remove single-pixel noise
        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                const idx = y * w + x;
                if (mask[idx] > 0.5) {
                    // Check 4-connected neighbors
                    const neighbors = [
                        mask[idx - 1], mask[idx + 1],
                        mask[idx - w], mask[idx + w]
                    ];
                    // If any neighbor is not marked, this might be noise
                    const markedNeighbors = neighbors.filter(n => n > 0.5).length;
                    if (markedNeighbors < 2) {
                        temp[idx] = 0; // Remove isolated pixel
                    }
                }
            }
        }
        
        // Copy back
        for (let i = 0; i < mask.length; i++) {
            mask[i] = temp[i];
        }
        
        // Dilation pass - restore edges that were over-eroded
        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                const idx = y * w + x;
                if (temp[idx] > 0.5) {
                    // Dilate to neighbors if they were originally marked
                    const neighbors = [idx - 1, idx + 1, idx - w, idx + w];
                    for (const n of neighbors) {
                        if (mask[n] < 0.5 && this.originalData) {
                            // Check if neighbor matches background color
                            const nDataIdx = n * 4;
                            const bgColor = this.settings.bgColor || this.detectBackgroundColor();
                            const r = this.originalData.data[nDataIdx];
                            const g = this.originalData.data[nDataIdx + 1];
                            const b = this.originalData.data[nDataIdx + 2];
                            const dist = Math.sqrt(
                                Math.pow(r - bgColor.r, 2) +
                                Math.pow(g - bgColor.g, 2) +
                                Math.pow(b - bgColor.b, 2)
                            );
                            if (dist < 50) {
                                mask[n] = temp[idx]; // Extend mask to similar neighbor
                            }
                        }
                    }
                }
            }
        }
    },
    
    // NEW: Remove isolated pixel clusters smaller than threshold
    removeIsolatedPixels(mask, w, h, minSize) {
        const visited = new Uint8Array(w * h);
        
        // Find and remove small isolated transparent regions inside the subject
        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                const idx = y * w + x;
                if (visited[idx] || mask[idx] > 0.5) continue;
                
                // Flood fill to find cluster size
                const cluster = [];
                const queue = [idx];
                visited[idx] = 1;
                
                while (queue.length > 0 && cluster.length < minSize * minSize + 1) {
                    const curr = queue.shift();
                    cluster.push(curr);
                    
                    const cx = curr % w;
                    const cy = Math.floor(curr / w);
                    
                    const neighbors = [
                        curr - 1, curr + 1, curr - w, curr + w
                    ];
                    
                    for (const n of neighbors) {
                        const nx = n % w;
                        const ny = Math.floor(n / w);
                        if (nx >= 0 && nx < w && ny >= 0 && ny < h &&
                            !visited[n] && mask[n] < 0.5 &&
                            Math.abs(nx - cx) <= 1 && Math.abs(ny - cy) <= 1) {
                            visited[n] = 1;
                            queue.push(n);
                        }
                    }
                }
                
                // If cluster is small and NOT connected to edge, fill it (remove the hole)
                if (cluster.length > 0 && cluster.length < minSize * minSize) {
                    let touchesEdge = cluster.some(idx => {
                        const x = idx % w;
                        const y = Math.floor(idx / w);
                        return x === 0 || x === w - 1 || y === 0 || y === h - 1;
                    });
                    
                    if (!touchesEdge) {
                        // Fill the hole - these are artifacts inside the logo
                        for (const idx of cluster) {
                            mask[idx] = 0; // Keep these pixels (don't make transparent)
                        }
                    }
                }
            }
        }
    },
    
    floodFillMask(mask, w, h, bgColor, tolerance) {
        const visited = new Uint8Array(w * h);
        
        // IMPROVED: At 100% tolerance, use very high distance threshold
        const normalizedTolerance = tolerance / 100;
        const maxDist = tolerance === 100 
            ? 999 
            : 5 + Math.pow(normalizedTolerance, 1.5) * 437;
        
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
        
        // Reset mask - only flood-filled areas will be marked
        const newMask = new Float32Array(w * h);
        
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
                // IMPROVED: Soft edge calculation
                if (dist < maxDist * 0.7) {
                    newMask[idx] = 1;
                } else {
                    newMask[idx] = Math.max(newMask[idx], 1 - ((dist - maxDist * 0.7) / (maxDist * 0.3)));
                }
                
                // Add neighbors (8-connected for better coverage)
                const neighbors = [
                    idx - 1, idx + 1,
                    idx - w, idx + w,
                    idx - w - 1, idx - w + 1,
                    idx + w - 1, idx + w + 1
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
        
        // Copy flood-filled mask back (this ensures only edge-connected bg is removed)
        for (let i = 0; i < mask.length; i++) {
            mask[i] = newMask[i];
        }
    },
    
    smoothMaskEdges(mask, w, h, radius) {
        // IMPROVED: Better edge smoothing with Gaussian-like blur
        const output = new Float32Array(mask);
        
        for (let pass = 0; pass < radius; pass++) {
            const temp = new Float32Array(output);
            
            for (let y = 1; y < h - 1; y++) {
                for (let x = 1; x < w - 1; x++) {
                    const idx = y * w + x;
                    
                    // Get current value and neighbors
                    const center = temp[idx];
                    const neighbors = [
                        temp[idx - 1], temp[idx + 1],
                        temp[idx - w], temp[idx + w],
                        temp[idx - w - 1], temp[idx - w + 1],
                        temp[idx + w - 1], temp[idx + w + 1]
                    ];
                    
                    const hasTransparent = neighbors.some(n => n > 0.3);
                    const hasOpaque = neighbors.some(n => n < 0.7);
                    
                    // Only smooth edge pixels (transition zones)
                    if (hasTransparent && hasOpaque) {
                        // Weighted Gaussian-like average
                        // Center weight: 4, adjacent: 2, diagonal: 1
                        const weighted = 
                            center * 4 +
                            (neighbors[0] + neighbors[1] + neighbors[2] + neighbors[3]) * 2 +
                            (neighbors[4] + neighbors[5] + neighbors[6] + neighbors[7]) * 1;
                        const totalWeight = 4 + 4 * 2 + 4 * 1;
                        
                        output[idx] = weighted / totalWeight;
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


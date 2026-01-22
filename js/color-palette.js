/**
 * COLOR-PALETTE.JS - Color Palette Extractor
 * Extracts dominant colors from images using k-means clustering
 */

'use strict';

const App = {
    image: null,
    canvas: null,
    ctx: null,
    fullCtx: null,
    fullImageData: null,
    colors: [],
    pickedColors: [], // NEW: Store colors picked from image
    format: 'hex',
    colorCount: 6,
    hoveredColor: null,
    zoomLevel: 1, // Zoom state
    panX: 0, // Pan X offset
    panY: 0, // Pan Y offset
    isPanning: false,
    wasDragging: false, // Track if we just dragged (to prevent color pick)
    panStartX: 0,
    panStartY: 0,
    
    el: {},
    
    init() {
        this.cacheElements();
        this.createCanvas();
        this.bindEvents();
    },
    
    cacheElements() {
        this.el = {
            pageUpload: document.getElementById('page-upload'),
            pageResults: document.getElementById('page-results'),
            
            fileInput: document.getElementById('file-input'),
            fileInputNew: document.getElementById('file-input-new'),
            imageWrapper: document.getElementById('image-wrapper'),
            previewImg: document.getElementById('preview-img'),
            hiddenCanvas: document.getElementById('hidden-canvas'),
            fullCanvas: document.getElementById('full-canvas'),
            
            colorTooltip: document.getElementById('color-tooltip'),
            tooltipSwatch: document.getElementById('tooltip-swatch'),
            tooltipHex: document.getElementById('tooltip-hex'),
            
            colorCount: document.getElementById('color-count'),
            paletteGrid: document.getElementById('palette-grid'),
            
            // Picked colors sidebar
            pickedColorsPanel: document.getElementById('picked-colors-panel'),
            pickedColorsList: document.getElementById('picked-colors-list'),
            pickedColorsCount: document.getElementById('picked-colors-count'),
            btnClearPicked: document.getElementById('btn-clear-picked'),
            btnCopyPicked: document.getElementById('btn-copy-picked'),
            btnDownloadPicked: document.getElementById('btn-download-picked'),
            
            btnDownloadPalette: document.getElementById('btn-download-palette'),
            btnCopyAll: document.getElementById('btn-copy-all'),
            formatBtns: document.querySelectorAll('.format-btn'),
            
            processing: document.getElementById('processing'),
            toast: document.getElementById('toast'),
            toastText: document.getElementById('toast-text'),
            
            shareTwitter: document.getElementById('share-twitter'),
            shareFacebook: document.getElementById('share-facebook'),
            shareWhatsapp: document.getElementById('share-whatsapp'),
            
            // Zoom controls
            zoomIn: document.getElementById('zoom-in'),
            zoomOut: document.getElementById('zoom-out'),
            zoomReset: document.getElementById('zoom-reset'),
            zoomLevel: document.getElementById('zoom-level'),
            imageContainer: document.getElementById('image-container'),
        };
        
        this.fullCtx = this.el.fullCanvas?.getContext('2d', { willReadFrequently: true });
    },
    
    createCanvas() {
        this.canvas = this.el.hiddenCanvas;
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    },
    
    bindEvents() {
        // File inputs
        this.el.fileInput?.addEventListener('change', (e) => {
            if (e.target.files[0]) this.loadImage(e.target.files[0]);
        });
        
        this.el.fileInputNew?.addEventListener('change', (e) => {
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
        
        // Color count
        this.el.colorCount?.addEventListener('change', (e) => {
            this.colorCount = parseInt(e.target.value);
            if (this.image) this.extractColors();
        });
        
        // Format toggle
        this.el.formatBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.el.formatBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.format = btn.dataset.format;
                this.renderPalette();
            });
        });
        
        // Actions
        this.el.btnDownloadPalette?.addEventListener('click', () => this.downloadPalette());
        this.el.btnCopyAll?.addEventListener('click', () => this.copyAllColors());
        
        // Picked colors actions
        this.el.btnClearPicked?.addEventListener('click', () => this.clearPickedColors());
        this.el.btnCopyPicked?.addEventListener('click', () => this.copyPickedColors());
        this.el.btnDownloadPicked?.addEventListener('click', () => this.downloadPickedColors());
        
        // Color picker on image hover
        this.el.previewImg?.addEventListener('mousemove', (e) => this.handleImageHover(e));
        this.el.previewImg?.addEventListener('mouseleave', () => this.hideColorTooltip());
        this.el.previewImg?.addEventListener('click', (e) => this.handleImageClick(e));
        
        // Share
        this.setupShareButtons();
        
        // Zoom controls
        this.el.zoomIn?.addEventListener('click', () => this.zoom(0.25));
        this.el.zoomOut?.addEventListener('click', () => this.zoom(-0.25));
        this.el.zoomReset?.addEventListener('click', () => this.resetZoom());
        
        // Mouse wheel zoom on image
        this.el.imageWrapper?.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            this.zoom(delta);
        });
        
        // Pan/drag when zoomed
        this.el.imageContainer?.addEventListener('mousedown', (e) => this.startPan(e));
        document.addEventListener('mousemove', (e) => this.doPan(e));
        document.addEventListener('mouseup', () => this.endPan());
    },
    
    startPan(e) {
        if (this.zoomLevel <= 1) return;
        this.isPanning = true;
        this.panStartX = e.clientX - this.panX;
        this.panStartY = e.clientY - this.panY;
        this.el.imageContainer?.classList.add('dragging');
    },
    
    doPan(e) {
        if (!this.isPanning) return;
        e.preventDefault();
        
        const newPanX = e.clientX - this.panStartX;
        const newPanY = e.clientY - this.panStartY;
        
        // Mark as dragging if moved more than 5px
        if (Math.abs(newPanX - this.panX) > 5 || Math.abs(newPanY - this.panY) > 5) {
            this.wasDragging = true;
        }
        
        this.panX = newPanX;
        this.panY = newPanY;
        this.applyZoom();
    },
    
    endPan() {
        this.isPanning = false;
        this.el.imageContainer?.classList.remove('dragging');
    },
    
    zoom(delta) {
        this.zoomLevel = Math.max(1, Math.min(10, this.zoomLevel + delta));
        // Reset pan if zooming to 100%
        if (this.zoomLevel === 1) {
            this.panX = 0;
            this.panY = 0;
        }
        this.applyZoom();
    },
    
    resetZoom() {
        this.zoomLevel = 1;
        this.panX = 0;
        this.panY = 0;
        this.applyZoom();
    },
    
    applyZoom() {
        if (this.el.previewImg) {
            this.el.previewImg.style.transform = `scale(${this.zoomLevel}) translate(${this.panX / this.zoomLevel}px, ${this.panY / this.zoomLevel}px)`;
            this.el.previewImg.style.transformOrigin = 'center center';
        }
        if (this.el.imageContainer) {
            this.el.imageContainer.classList.toggle('zoomed', this.zoomLevel > 1);
        }
        if (this.el.zoomLevel) {
            this.el.zoomLevel.textContent = Math.round(this.zoomLevel * 100) + '%';
        }
    },
    
    handleImageHover(e) {
        if (!this.fullImageData) return;
        
        const rect = this.el.previewImg.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Get color at position
        const color = this.getColorAtPosition(x, y, rect.width, rect.height);
        if (!color) return;
        
        const hex = this.rgbToHex(color.r, color.g, color.b);
        
        // Update tooltip
        this.el.tooltipSwatch.style.background = hex;
        this.el.tooltipHex.textContent = hex;
        
        // Position tooltip
        this.el.colorTooltip.style.left = x + 'px';
        this.el.colorTooltip.style.top = y + 'px';
        this.el.colorTooltip.classList.add('active');
        
        this.hoveredColor = hex;
    },
    
    hideColorTooltip() {
        this.el.colorTooltip?.classList.remove('active');
    },
    
    handleImageClick(e) {
        // Don't pick color if we just finished dragging
        if (this.wasDragging) {
            this.wasDragging = false;
            return;
        }
        
        if (this.hoveredColor) {
            // Copy to clipboard
            this.copyToClipboard(this.hoveredColor);
            
            // Add to picked colors list (avoid duplicates)
            if (!this.pickedColors.includes(this.hoveredColor)) {
                this.pickedColors.push(this.hoveredColor);
                this.renderPickedColors();
            }
            
            this.showToast(`Copied & Added: ${this.hoveredColor}`);
        }
    },
    
    // Render picked colors sidebar
    renderPickedColors() {
        if (!this.el.pickedColorsList) return;
        
        // Show panel if colors exist
        if (this.el.pickedColorsPanel) {
            this.el.pickedColorsPanel.style.display = this.pickedColors.length > 0 ? 'block' : 'none';
        }
        
        // Update count
        if (this.el.pickedColorsCount) {
            this.el.pickedColorsCount.textContent = this.pickedColors.length;
        }
        
        // Render color list
        this.el.pickedColorsList.innerHTML = this.pickedColors.map((hex, idx) => `
            <div class="picked-color" data-idx="${idx}" data-hex="${hex}">
                <div class="picked-color__swatch" style="background: ${hex};"></div>
                <span class="picked-color__code">${hex}</span>
                <button class="picked-color__remove" data-idx="${idx}" title="Remove">×</button>
            </div>
        `).join('');
        
        // Add remove handlers
        this.el.pickedColorsList.querySelectorAll('.picked-color__remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.idx);
                this.pickedColors.splice(idx, 1);
                this.renderPickedColors();
            });
        });
        
        // Add copy handlers for individual colors
        this.el.pickedColorsList.querySelectorAll('.picked-color').forEach(item => {
            item.addEventListener('click', () => {
                const hex = item.dataset.hex;
                this.copyToClipboard(hex);
                this.showToast(`Copied: ${hex}`);
            });
        });
    },
    
    // Clear all picked colors
    clearPickedColors() {
        this.pickedColors = [];
        this.renderPickedColors();
        this.showToast('Cleared picked colors');
    },
    
    // Copy all picked colors
    copyPickedColors() {
        if (this.pickedColors.length === 0) {
            this.showToast('No colors picked yet!');
            return;
        }
        this.copyToClipboard(this.pickedColors.join('\n'));
        this.showToast(`Copied ${this.pickedColors.length} picked colors!`);
    },
    
    // Download picked colors as image
    async downloadPickedColors() {
        if (this.pickedColors.length === 0) {
            this.showToast('No colors picked yet!');
            return;
        }
        
        const canvas = document.createElement('canvas');
        const cols = Math.min(this.pickedColors.length, 8);
        const rows = Math.ceil(this.pickedColors.length / cols);
        const swatchSize = 80;
        const padding = 15;
        const textHeight = 25;
        
        canvas.width = cols * swatchSize + padding * 2;
        canvas.height = rows * (swatchSize + textHeight) + padding * 2;
        
        const ctx = canvas.getContext('2d');
        
        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw colors
        this.pickedColors.forEach((hex, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = padding + col * swatchSize;
            const y = padding + row * (swatchSize + textHeight);
            
            // Swatch
            ctx.fillStyle = hex;
            ctx.fillRect(x + 2, y, swatchSize - 8, swatchSize - 8);
            
            // Border
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 2, y, swatchSize - 8, swatchSize - 8);
            
            // Text
            ctx.fillStyle = '#333333';
            ctx.font = '10px Inter, monospace';
            ctx.textAlign = 'center';
            ctx.fillText(hex, x + swatchSize / 2, y + swatchSize + 2);
        });
        
        // Download
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'picked-colors.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Downloaded picked colors!');
    },
    
    getColorAtPosition(x, y, displayWidth, displayHeight) {
        if (!this.fullImageData) return null;
        
        const scaleX = this.el.fullCanvas.width / displayWidth;
        const scaleY = this.el.fullCanvas.height / displayHeight;
        
        const imgX = Math.floor(x * scaleX);
        const imgY = Math.floor(y * scaleY);
        
        if (imgX < 0 || imgX >= this.el.fullCanvas.width || imgY < 0 || imgY >= this.el.fullCanvas.height) {
            return null;
        }
        
        const idx = (imgY * this.el.fullCanvas.width + imgX) * 4;
        
        return {
            r: this.fullImageData.data[idx],
            g: this.fullImageData.data[idx + 1],
            b: this.fullImageData.data[idx + 2]
        };
    },
    
    async loadImage(file) {
        this.showProcessing(true);
        
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
                name: file.name,
                width: img.naturalWidth,
                height: img.naturalHeight,
                url,
                element: img
            };
            
            this.el.previewImg.src = url;
            
            // Store full resolution for color picker (max 800px)
            const fullMaxSize = 800;
            const fullScale = Math.min(fullMaxSize / img.naturalWidth, fullMaxSize / img.naturalHeight, 1);
            const fullW = Math.floor(img.naturalWidth * fullScale);
            const fullH = Math.floor(img.naturalHeight * fullScale);
            
            this.el.fullCanvas.width = fullW;
            this.el.fullCanvas.height = fullH;
            this.fullCtx.drawImage(img, 0, 0, fullW, fullH);
            this.fullImageData = this.fullCtx.getImageData(0, 0, fullW, fullH);
            
            // Resize for palette extraction (max 200px for speed)
            const maxSize = 200;
            const scale = Math.min(maxSize / img.naturalWidth, maxSize / img.naturalHeight, 1);
            const w = Math.floor(img.naturalWidth * scale);
            const h = Math.floor(img.naturalHeight * scale);
            
            this.canvas.width = w;
            this.canvas.height = h;
            this.ctx.drawImage(img, 0, 0, w, h);
            
            await this.extractColors();
            this.showPage('results');
            
        } catch (error) {
            alert('Error loading image');
        } finally {
            this.showProcessing(false);
        }
    },
    
    async extractColors() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const pixels = [];
        
        // Sample pixels
        for (let i = 0; i < imageData.data.length; i += 4) {
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            const a = imageData.data[i + 3];
            
            // Skip transparent pixels
            if (a < 128) continue;
            
            pixels.push([r, g, b]);
        }
        
        // K-means clustering
        this.colors = this.kMeans(pixels, this.colorCount);
        
        // Sort by luminance (light to dark)
        this.colors.sort((a, b) => {
            const lumA = 0.299 * a.r + 0.587 * a.g + 0.114 * a.b;
            const lumB = 0.299 * b.r + 0.587 * b.g + 0.114 * b.b;
            return lumB - lumA;
        });
        
        this.renderPalette();
    },
    
    kMeans(pixels, k) {
        if (pixels.length === 0) return [];
        
        // Initialize centroids randomly
        const centroids = [];
        const used = new Set();
        
        while (centroids.length < k && centroids.length < pixels.length) {
            const idx = Math.floor(Math.random() * pixels.length);
            const key = pixels[idx].join(',');
            if (!used.has(key)) {
                used.add(key);
                centroids.push([...pixels[idx]]);
            }
        }
        
        // Iterate
        const maxIterations = 10;
        for (let iter = 0; iter < maxIterations; iter++) {
            // Assign pixels to nearest centroid
            const clusters = Array.from({ length: k }, () => []);
            
            for (const pixel of pixels) {
                let minDist = Infinity;
                let bestCluster = 0;
                
                for (let i = 0; i < centroids.length; i++) {
                    const dist = this.colorDistance(pixel, centroids[i]);
                    if (dist < minDist) {
                        minDist = dist;
                        bestCluster = i;
                    }
                }
                
                clusters[bestCluster].push(pixel);
            }
            
            // Update centroids
            let changed = false;
            for (let i = 0; i < k; i++) {
                if (clusters[i].length === 0) continue;
                
                const newCentroid = [0, 0, 0];
                for (const pixel of clusters[i]) {
                    newCentroid[0] += pixel[0];
                    newCentroid[1] += pixel[1];
                    newCentroid[2] += pixel[2];
                }
                newCentroid[0] = Math.round(newCentroid[0] / clusters[i].length);
                newCentroid[1] = Math.round(newCentroid[1] / clusters[i].length);
                newCentroid[2] = Math.round(newCentroid[2] / clusters[i].length);
                
                if (centroids[i][0] !== newCentroid[0] ||
                    centroids[i][1] !== newCentroid[1] ||
                    centroids[i][2] !== newCentroid[2]) {
                    changed = true;
                    centroids[i] = newCentroid;
                }
            }
            
            if (!changed) break;
        }
        
        // Calculate percentages
        const clusters = Array.from({ length: k }, () => []);
        for (const pixel of pixels) {
            let minDist = Infinity;
            let bestCluster = 0;
            
            for (let i = 0; i < centroids.length; i++) {
                const dist = this.colorDistance(pixel, centroids[i]);
                if (dist < minDist) {
                    minDist = dist;
                    bestCluster = i;
                }
            }
            clusters[bestCluster].push(pixel);
        }
        
        return centroids.map((c, i) => ({
            r: c[0],
            g: c[1],
            b: c[2],
            percent: Math.round((clusters[i].length / pixels.length) * 100)
        })).filter(c => c.percent > 0);
    },
    
    colorDistance(c1, c2) {
        return Math.sqrt(
            Math.pow(c1[0] - c2[0], 2) +
            Math.pow(c1[1] - c2[1], 2) +
            Math.pow(c1[2] - c2[2], 2)
        );
    },
    
    renderPalette() {
        this.el.paletteGrid.innerHTML = this.colors.map((color, idx) => {
            const hex = this.rgbToHex(color.r, color.g, color.b);
            const rgb = `rgb(${color.r}, ${color.g}, ${color.b})`;
            const hsl = this.rgbToHsl(color.r, color.g, color.b);
            
            let displayCode;
            switch (this.format) {
                case 'rgb':
                    displayCode = rgb;
                    break;
                case 'hsl':
                    displayCode = hsl;
                    break;
                default:
                    displayCode = hex;
            }
            
            return `
                <div class="color-card" data-idx="${idx}" data-hex="${hex}" data-rgb="${rgb}" data-hsl="${hsl}">
                    <div class="color-card__swatch" style="background: ${hex};">
                        <div class="color-card__copy">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2"/>
                                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                            </svg>
                        </div>
                    </div>
                    <div class="color-card__info">
                        <div class="color-card__code">${displayCode}</div>
                        <div class="color-card__percent">${color.percent}% of image</div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add click handlers
        this.el.paletteGrid.querySelectorAll('.color-card').forEach(card => {
            card.addEventListener('click', () => {
                const code = card.dataset[this.format];
                this.copyToClipboard(code);
                this.showToast(`Copied: ${code}`);
            });
        });
    },
    
    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
    },
    
    rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        
        return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
    },
    
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).catch(() => {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        });
    },
    
    copyAllColors() {
        const codes = this.colors.map(c => {
            switch (this.format) {
                case 'rgb': return `rgb(${c.r}, ${c.g}, ${c.b})`;
                case 'hsl': return this.rgbToHsl(c.r, c.g, c.b);
                default: return this.rgbToHex(c.r, c.g, c.b);
            }
        });
        
        this.copyToClipboard(codes.join('\n'));
        this.showToast(`Copied ${codes.length} colors!`);
    },
    
    async downloadPalette() {
        const canvas = document.createElement('canvas');
        const cols = Math.min(this.colors.length, 5);
        const rows = Math.ceil(this.colors.length / cols);
        const swatchSize = 120;
        const padding = 20;
        const textHeight = 40;
        
        canvas.width = cols * swatchSize + padding * 2;
        canvas.height = rows * (swatchSize + textHeight) + padding * 2;
        
        const ctx = canvas.getContext('2d');
        
        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw colors
        this.colors.forEach((color, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = padding + col * swatchSize;
            const y = padding + row * (swatchSize + textHeight);
            
            // Swatch
            ctx.fillStyle = this.rgbToHex(color.r, color.g, color.b);
            ctx.fillRect(x, y, swatchSize - 10, swatchSize - 10);
            
            // Text
            ctx.fillStyle = '#333333';
            ctx.font = '12px Inter, sans-serif';
            ctx.fillText(this.rgbToHex(color.r, color.g, color.b), x, y + swatchSize + 5);
        });
        
        // Download
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'color-palette.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
    
    showPage(page) {
        this.el.pageUpload.classList.remove('active');
        this.el.pageResults.classList.remove('active');
        
        if (page === 'upload') this.el.pageUpload.classList.add('active');
        else if (page === 'results') this.el.pageResults.classList.add('active');
    },
    
    showProcessing(show) {
        if (show) {
            this.el.processing.classList.add('active');
        } else {
            this.el.processing.classList.remove('active');
        }
    },
    
    showToast(text) {
        this.el.toastText.textContent = text;
        this.el.toast.classList.add('active');
        
        setTimeout(() => {
            this.el.toast.classList.remove('active');
        }, 2000);
    },
    
    setupShareButtons() {
        const url = encodeURIComponent(window.location.href);
        const text = encodeURIComponent('Extract beautiful color palettes from any image with this free tool!');
        
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


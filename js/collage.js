/**
 * Photo Collage Maker - Image Runner
 * 100% Client-side, Free, No Watermark
 */

const CollageApp = {
    images: [],
    currentLayout: 0,
    bgColor: '#ffffff',
    gap: 10,
    padding: 20,
    radius: 0,
    width: 1080,
    height: 1080,
    resultDataUrl: null,
    
    // Layout definitions
    layouts: [
        // 2 images
        { cols: '1fr 1fr', rows: '1fr', cells: [[0,0,1,1],[1,0,2,1]], minImages: 2 },
        { cols: '1fr 1fr', rows: '1fr 1fr', cells: [[0,0,1,2],[1,0,2,1],[1,1,2,2]], minImages: 3 },
        // 4 images - grid
        { cols: '1fr 1fr', rows: '1fr 1fr', cells: [[0,0,1,1],[1,0,2,1],[0,1,1,2],[1,1,2,2]], minImages: 4 },
        // 3 images
        { cols: '1fr 1fr', rows: '1fr 1fr', cells: [[0,0,1,2],[1,0,2,1],[1,1,2,2]], minImages: 3 },
        // 5 images
        { cols: '1fr 1fr 1fr', rows: '1fr 1fr', cells: [[0,0,1,1],[1,0,2,1],[2,0,3,1],[0,1,2,2],[2,1,3,2]], minImages: 5 },
        // 6 images - grid
        { cols: '1fr 1fr 1fr', rows: '1fr 1fr', cells: [[0,0,1,1],[1,0,2,1],[2,0,3,1],[0,1,1,2],[1,1,2,2],[2,1,3,2]], minImages: 6 },
        // 9 images - grid
        { cols: '1fr 1fr 1fr', rows: '1fr 1fr 1fr', cells: [[0,0,1,1],[1,0,2,1],[2,0,3,1],[0,1,1,2],[1,1,2,2],[2,1,3,2],[0,2,1,3],[1,2,2,3],[2,2,3,3]], minImages: 9 },
    ],
    
    init() {
        this.bindEvents();
        this.renderLayoutButtons();
    },
    
    bindEvents() {
        // Upload area
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');
        
        uploadArea.addEventListener('click', () => fileInput.click());
        document.querySelector('.btn-select').addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
        });
        
        fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));
        
        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });
        
        // Color buttons
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.bgColor = btn.dataset.color;
                this.renderPreview();
            });
        });
        
        document.getElementById('custom-color').addEventListener('input', (e) => {
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            this.bgColor = e.target.value;
            this.renderPreview();
        });
        
        // Sliders
        document.getElementById('gap-slider').addEventListener('input', (e) => {
            this.gap = parseInt(e.target.value);
            document.getElementById('gap-value').textContent = this.gap;
            this.renderPreview();
        });
        
        document.getElementById('padding-slider').addEventListener('input', (e) => {
            this.padding = parseInt(e.target.value);
            document.getElementById('padding-value').textContent = this.padding;
            this.renderPreview();
        });
        
        document.getElementById('radius-slider').addEventListener('input', (e) => {
            this.radius = parseInt(e.target.value);
            document.getElementById('radius-value').textContent = this.radius;
            this.renderPreview();
        });
        
        // Size buttons
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const [w, h] = btn.dataset.size.split('x').map(Number);
                this.width = w;
                this.height = h;
                this.renderPreview();
            });
        });
        
        // Create button
        document.getElementById('btn-create').addEventListener('click', () => this.createCollage());
        
        // Download button
        document.getElementById('btn-download').addEventListener('click', () => this.downloadCollage());
        
        // New collage button
        document.getElementById('btn-new').addEventListener('click', () => this.reset());
    },
    
    renderLayoutButtons() {
        const grid = document.getElementById('layout-grid');
        grid.innerHTML = '';
        
        this.layouts.forEach((layout, index) => {
            const btn = document.createElement('button');
            btn.className = 'layout-btn' + (index === 0 ? ' active' : '');
            btn.dataset.index = index;
            
            // Create mini SVG preview
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', '0 0 40 40');
            
            const cols = layout.cols.split(' ').length;
            const rows = layout.rows.split(' ').length;
            const cellW = 36 / cols;
            const cellH = 36 / rows;
            
            layout.cells.forEach(([c1, r1, c2, r2]) => {
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('x', 2 + c1 * cellW);
                rect.setAttribute('y', 2 + r1 * cellH);
                rect.setAttribute('width', (c2 - c1) * cellW - 1);
                rect.setAttribute('height', (r2 - r1) * cellH - 1);
                rect.setAttribute('rx', '2');
                rect.setAttribute('fill', 'currentColor');
                rect.setAttribute('opacity', '0.3');
                svg.appendChild(rect);
            });
            
            btn.appendChild(svg);
            
            btn.addEventListener('click', () => {
                document.querySelectorAll('.layout-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentLayout = index;
                this.renderPreview();
            });
            
            grid.appendChild(btn);
        });
    },
    
    handleFiles(files) {
        const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
        
        if (imageFiles.length < 2) {
            alert('Please select at least 2 images');
            return;
        }
        
        if (imageFiles.length > 9) {
            alert('Maximum 9 images allowed');
            return;
        }
        
        this.images = [];
        let loaded = 0;
        
        imageFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    this.images[index] = img;
                    loaded++;
                    
                    if (loaded === imageFiles.length) {
                        this.selectBestLayout();
                        this.showPage('page-editor');
                        this.renderPreview();
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    },
    
    selectBestLayout() {
        // Find layout that matches image count best
        const count = this.images.length;
        let bestIndex = 0;
        let bestDiff = 999;
        
        this.layouts.forEach((layout, index) => {
            const diff = Math.abs(layout.cells.length - count);
            if (diff < bestDiff) {
                bestDiff = diff;
                bestIndex = index;
            }
        });
        
        this.currentLayout = bestIndex;
        
        // Update UI
        document.querySelectorAll('.layout-btn').forEach((btn, index) => {
            btn.classList.toggle('active', index === bestIndex);
        });
    },
    
    renderPreview() {
        const container = document.getElementById('preview-container');
        const layout = this.layouts[this.currentLayout];
        
        // Scale preview
        const maxPreviewSize = Math.min(window.innerWidth - 360, 600);
        const scale = maxPreviewSize / Math.max(this.width, this.height);
        const previewW = this.width * scale;
        const previewH = this.height * scale;
        
        container.style.width = previewW + 'px';
        container.style.height = previewH + 'px';
        container.style.background = this.bgColor;
        container.style.padding = (this.padding * scale) + 'px';
        
        // Create grid
        container.innerHTML = '';
        const grid = document.createElement('div');
        grid.className = 'collage-grid';
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = layout.cols;
        grid.style.gridTemplateRows = layout.rows;
        grid.style.gap = (this.gap * scale) + 'px';
        grid.style.width = '100%';
        grid.style.height = '100%';
        
        layout.cells.forEach((cell, index) => {
            const [c1, r1, c2, r2] = cell;
            const cellDiv = document.createElement('div');
            cellDiv.className = 'collage-cell';
            cellDiv.style.gridColumn = `${c1 + 1} / ${c2 + 1}`;
            cellDiv.style.gridRow = `${r1 + 1} / ${r2 + 1}`;
            cellDiv.style.borderRadius = (this.radius * scale) + 'px';
            
            if (this.images[index]) {
                const img = document.createElement('img');
                img.src = this.images[index].src;
                img.draggable = true;
                
                // Drag to reorder
                img.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('index', index);
                });
                
                cellDiv.addEventListener('dragover', (e) => e.preventDefault());
                cellDiv.addEventListener('drop', (e) => {
                    e.preventDefault();
                    const fromIndex = parseInt(e.dataTransfer.getData('index'));
                    if (fromIndex !== index) {
                        // Swap images
                        const temp = this.images[fromIndex];
                        this.images[fromIndex] = this.images[index];
                        this.images[index] = temp;
                        this.renderPreview();
                    }
                });
                
                cellDiv.appendChild(img);
            } else {
                cellDiv.classList.add('empty');
                cellDiv.textContent = 'No Image';
            }
            
            grid.appendChild(cellDiv);
        });
        
        container.appendChild(grid);
    },
    
    createCollage() {
        const layout = this.layouts[this.currentLayout];
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        const ctx = canvas.getContext('2d');
        
        // Background
        ctx.fillStyle = this.bgColor;
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Calculate grid
        const cols = layout.cols.split(' ').length;
        const rows = layout.rows.split(' ').length;
        const innerW = this.width - this.padding * 2;
        const innerH = this.height - this.padding * 2;
        const cellW = (innerW - (cols - 1) * this.gap) / cols;
        const cellH = (innerH - (rows - 1) * this.gap) / rows;
        
        // Draw each cell
        layout.cells.forEach((cell, index) => {
            if (!this.images[index]) return;
            
            const [c1, r1, c2, r2] = cell;
            const x = this.padding + c1 * (cellW + this.gap);
            const y = this.padding + r1 * (cellH + this.gap);
            const w = (c2 - c1) * cellW + (c2 - c1 - 1) * this.gap;
            const h = (r2 - r1) * cellH + (r2 - r1 - 1) * this.gap;
            
            const img = this.images[index];
            
            // Save state for clipping
            ctx.save();
            
            // Create rounded rect path (with polyfill for older browsers)
            if (this.radius > 0) {
                ctx.beginPath();
                this.drawRoundedRect(ctx, x, y, w, h, this.radius);
                ctx.clip();
            }
            
            // Cover fit
            const imgRatio = img.width / img.height;
            const cellRatio = w / h;
            let drawW, drawH, drawX, drawY;
            
            if (imgRatio > cellRatio) {
                drawH = h;
                drawW = h * imgRatio;
                drawX = x - (drawW - w) / 2;
                drawY = y;
            } else {
                drawW = w;
                drawH = w / imgRatio;
                drawX = x;
                drawY = y - (drawH - h) / 2;
            }
            
            ctx.drawImage(img, drawX, drawY, drawW, drawH);
            ctx.restore();
        });
        
        // Store result
        this.resultDataUrl = canvas.toDataURL('image/png');
        
        // Show download page
        document.getElementById('result-preview').innerHTML = `<img src="${this.resultDataUrl}" alt="Collage">`;
        this.showPage('page-download');
    },
    
    downloadCollage() {
        if (!this.resultDataUrl) return;
        
        const link = document.createElement('a');
        link.download = `collage-${Date.now()}.png`;
        link.href = this.resultDataUrl;
        link.click();
    },
    
    // Polyfill for rounded rect (Safari compatibility)
    drawRoundedRect(ctx, x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    },
    
    reset() {
        this.images = [];
        this.resultDataUrl = null;
        document.getElementById('file-input').value = '';
        this.showPage('page-upload');
    },
    
    showPage(pageId) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(pageId).classList.add('active');
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => CollageApp.init());


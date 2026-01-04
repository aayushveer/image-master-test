/**
 * BEAUTIFIER.JS - Screenshot Beautifier Tool
 */

'use strict';

const App = {
    image: null,
    settings: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 64,
        borderRadius: 12,
        shadow: 50,
        frame: 'none',
        aspectRatio: 'auto'
    },
    el: {},
    
    init() {
        this.cacheElements();
        this.bindEvents();
        this.setupPasteHandler();
    },
    
    cacheElements() {
        this.el = {
            pageUpload: document.getElementById('page-upload'),
            pageEditor: document.getElementById('page-editor'),
            
            fileInput: document.getElementById('file-input'),
            
            canvasWrapper: document.getElementById('canvas-wrapper'),
            screenshotFrame: document.getElementById('screenshot-frame'),
            screenshotImage: document.getElementById('screenshot-image'),
            browserBar: document.getElementById('browser-bar'),
            
            gradientBtns: document.querySelectorAll('.gradient-btn'),
            customBgColor: document.getElementById('custom-bg-color'),
            
            padding: document.getElementById('padding'),
            paddingValue: document.getElementById('padding-value'),
            borderRadius: document.getElementById('border-radius'),
            radiusValue: document.getElementById('radius-value'),
            shadow: document.getElementById('shadow'),
            shadowValue: document.getElementById('shadow-value'),
            
            frameBtns: document.querySelectorAll('.frame-btn'),
            sizeBtns: document.querySelectorAll('.size-btn'),
            
            btnDownload: document.getElementById('btn-download'),
            btnCopy: document.getElementById('btn-copy'),
            btnNew: document.getElementById('btn-new'),
            
            shareModal: document.getElementById('share-modal'),
            closeModal: document.getElementById('close-modal'),
        };
    },
    
    bindEvents() {
        // File input
        this.el.fileInput?.addEventListener('change', (e) => this.handleFile(e.target.files[0]));
        
        // Drag and drop
        document.body.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });
        
        document.body.addEventListener('drop', (e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handleFile(file);
            }
        });
        
        // Background gradients
        this.el.gradientBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const bg = btn.dataset.bg;
                if (bg === 'custom') return;
                
                this.el.gradientBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.settings.background = bg;
                this.updatePreview();
            });
        });
        
        // Custom color
        this.el.customBgColor?.addEventListener('input', (e) => {
            this.el.gradientBtns.forEach(b => b.classList.remove('active'));
            this.el.customBgColor.parentElement.classList.add('active');
            this.settings.background = e.target.value;
            this.updatePreview();
        });
        
        // Padding
        this.el.padding?.addEventListener('input', (e) => {
            this.settings.padding = parseInt(e.target.value);
            this.el.paddingValue.textContent = this.settings.padding + 'px';
            this.updatePreview();
        });
        
        // Border Radius
        this.el.borderRadius?.addEventListener('input', (e) => {
            this.settings.borderRadius = parseInt(e.target.value);
            this.el.radiusValue.textContent = this.settings.borderRadius + 'px';
            this.updatePreview();
        });
        
        // Shadow
        this.el.shadow?.addEventListener('input', (e) => {
            this.settings.shadow = parseInt(e.target.value);
            const labels = ['None', 'Light', 'Medium', 'Strong', 'Heavy'];
            const idx = Math.floor(this.settings.shadow / 25);
            this.el.shadowValue.textContent = labels[Math.min(idx, 4)];
            this.updatePreview();
        });
        
        // Frame style
        this.el.frameBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.el.frameBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.settings.frame = btn.dataset.frame;
                this.updatePreview();
            });
        });
        
        // Size buttons
        this.el.sizeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.el.sizeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.settings.aspectRatio = btn.dataset.size;
                this.updatePreview();
            });
        });
        
        // Download
        this.el.btnDownload?.addEventListener('click', () => this.download());
        
        // Copy to clipboard
        this.el.btnCopy?.addEventListener('click', () => this.copyToClipboard());
        
        // New screenshot
        this.el.btnNew?.addEventListener('click', () => this.reset());
        
        // Modal
        this.el.closeModal?.addEventListener('click', () => {
            this.el.shareModal?.classList.remove('active');
        });
    },
    
    setupPasteHandler() {
        document.addEventListener('paste', (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            
            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    this.handleFile(file);
                    break;
                }
            }
        });
    },
    
    showPage(name) {
        [this.el.pageUpload, this.el.pageEditor].forEach(p => {
            if (p) p.classList.remove('active');
        });
        const page = document.getElementById('page-' + name);
        if (page) page.classList.add('active');
    },
    
    handleFile(file) {
        if (!file || !file.type.startsWith('image/')) return;
        
        const url = URL.createObjectURL(file);
        const img = new Image();
        
        img.onload = () => {
            if (this.image?.url) URL.revokeObjectURL(this.image.url);
            
            this.image = {
                file,
                url,
                width: img.naturalWidth,
                height: img.naturalHeight,
                element: img
            };
            
            this.el.screenshotImage.src = url;
            this.showPage('editor');
            this.updatePreview();
        };
        
        img.src = url;
    },
    
    updatePreview() {
        const wrapper = this.el.canvasWrapper;
        const frame = this.el.screenshotFrame;
        const browserBar = this.el.browserBar;
        
        if (!wrapper || !frame) return;
        
        // Background
        if (this.settings.background === 'transparent') {
            wrapper.style.background = 'repeating-conic-gradient(#808080 0% 25%, #a0a0a0 0% 50%) 50% / 20px 20px';
        } else {
            wrapper.style.background = this.settings.background;
        }
        
        // Padding
        wrapper.style.padding = this.settings.padding + 'px';
        
        // Border Radius
        frame.style.borderRadius = this.settings.borderRadius + 'px';
        
        // Shadow
        const shadowIntensity = this.settings.shadow / 100;
        const blur = 20 + shadowIntensity * 60;
        const spread = shadowIntensity * 20;
        const opacity = 0.2 + shadowIntensity * 0.3;
        frame.style.boxShadow = `0 ${10 + shadowIntensity * 30}px ${blur}px ${spread}px rgba(0,0,0,${opacity})`;
        
        // Frame style
        frame.classList.remove('window-style');
        browserBar.classList.remove('visible');
        
        if (this.settings.frame === 'browser') {
            browserBar.classList.add('visible');
        } else if (this.settings.frame === 'window') {
            browserBar.classList.add('visible');
            frame.classList.add('window-style');
        }
        
        // Aspect ratio
        this.applyAspectRatio();
    },
    
    applyAspectRatio() {
        const wrapper = this.el.canvasWrapper;
        if (!wrapper) return;
        
        wrapper.style.aspectRatio = '';
        wrapper.style.minWidth = '';
        wrapper.style.minHeight = '';
        
        if (this.settings.aspectRatio !== 'auto') {
            const [w, h] = this.settings.aspectRatio.split(':').map(Number);
            wrapper.style.aspectRatio = `${w} / ${h}`;
            wrapper.style.minWidth = '400px';
        }
    },
    
    async download() {
        const canvas = await this.renderToCanvas();
        
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `screenshot-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 'image/png', 1.0);
    },
    
    async copyToClipboard() {
        try {
            const canvas = await this.renderToCanvas();
            
            canvas.toBlob(async (blob) => {
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    
                    // Show feedback
                    const btn = this.el.btnCopy;
                    const originalText = btn.innerHTML;
                    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> Copied!';
                    btn.style.color = '#22c55e';
                    
                    setTimeout(() => {
                        btn.innerHTML = originalText;
                        btn.style.color = '';
                    }, 2000);
                } catch (err) {
                    alert('Could not copy to clipboard');
                }
            }, 'image/png');
        } catch (e) {
            console.error(e);
        }
    },
    
    async renderToCanvas() {
        const wrapper = this.el.canvasWrapper;
        const frame = this.el.screenshotFrame;
        const browserBar = this.el.browserBar;
        const img = this.image;
        
        // Calculate dimensions
        const padding = this.settings.padding;
        const showBar = this.settings.frame !== 'none';
        const barHeight = showBar ? 48 : 0;
        
        // Get actual image dimensions from display
        const displayImg = this.el.screenshotImage;
        const imgWidth = displayImg.offsetWidth;
        const imgHeight = displayImg.offsetHeight;
        
        // Total canvas size
        let canvasWidth = imgWidth + padding * 2;
        let canvasHeight = imgHeight + barHeight + padding * 2;
        
        // Apply aspect ratio
        if (this.settings.aspectRatio !== 'auto') {
            const [w, h] = this.settings.aspectRatio.split(':').map(Number);
            const ratio = w / h;
            const currentRatio = canvasWidth / canvasHeight;
            
            if (currentRatio > ratio) {
                canvasHeight = canvasWidth / ratio;
            } else {
                canvasWidth = canvasHeight * ratio;
            }
        }
        
        // Minimum size
        canvasWidth = Math.max(canvasWidth, 400);
        canvasHeight = Math.max(canvasHeight, 300);
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const scale = 2; // For retina
        
        canvas.width = canvasWidth * scale;
        canvas.height = canvasHeight * scale;
        ctx.scale(scale, scale);
        
        // Draw background
        if (this.settings.background === 'transparent') {
            // Checkerboard for transparent
            const size = 10;
            for (let y = 0; y < canvasHeight; y += size) {
                for (let x = 0; x < canvasWidth; x += size) {
                    ctx.fillStyle = ((x + y) / size) % 2 === 0 ? '#ccc' : '#fff';
                    ctx.fillRect(x, y, size, size);
                }
            }
        } else if (this.settings.background.startsWith('linear-gradient')) {
            // Parse gradient
            const gradientCanvas = this.createGradientCanvas(canvasWidth, canvasHeight);
            ctx.drawImage(gradientCanvas, 0, 0);
        } else {
            ctx.fillStyle = this.settings.background;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        }
        
        // Center position for screenshot
        const frameWidth = imgWidth;
        const frameHeight = imgHeight + barHeight;
        const frameX = (canvasWidth - frameWidth) / 2;
        const frameY = (canvasHeight - frameHeight) / 2;
        
        // Draw shadow
        const shadowIntensity = this.settings.shadow / 100;
        if (shadowIntensity > 0) {
            ctx.save();
            ctx.shadowColor = `rgba(0,0,0,${0.2 + shadowIntensity * 0.3})`;
            ctx.shadowBlur = 20 + shadowIntensity * 60;
            ctx.shadowOffsetY = 10 + shadowIntensity * 30;
            
            ctx.fillStyle = 'white';
            this.roundRect(ctx, frameX, frameY, frameWidth, frameHeight, this.settings.borderRadius);
            ctx.fill();
            ctx.restore();
        }
        
        // Draw frame background
        ctx.save();
        ctx.fillStyle = 'white';
        this.roundRect(ctx, frameX, frameY, frameWidth, frameHeight, this.settings.borderRadius);
        ctx.clip();
        ctx.fill();
        
        // Draw browser bar
        if (showBar) {
            const isWindow = this.settings.frame === 'window';
            
            // Bar background
            ctx.fillStyle = isWindow ? '#e0e0e0' : '#f5f5f5';
            ctx.fillRect(frameX, frameY, frameWidth, barHeight);
            
            // Dots
            const dotColors = ['#ff5f57', '#febc2e', '#28c840'];
            dotColors.forEach((color, i) => {
                ctx.beginPath();
                ctx.fillStyle = color;
                ctx.arc(frameX + 20 + i * 18, frameY + barHeight / 2, 6, 0, Math.PI * 2);
                ctx.fill();
            });
            
            // URL bar (browser only)
            if (!isWindow) {
                ctx.fillStyle = 'white';
                ctx.strokeStyle = '#ddd';
                ctx.lineWidth = 1;
                const urlBarX = frameX + 70;
                const urlBarY = frameY + 10;
                const urlBarW = frameWidth - 90;
                const urlBarH = 28;
                this.roundRect(ctx, urlBarX, urlBarY, urlBarW, urlBarH, 6);
                ctx.fill();
                ctx.stroke();
            }
        }
        
        // Draw image
        ctx.drawImage(img.element, frameX, frameY + barHeight, imgWidth, imgHeight);
        
        ctx.restore();
        
        return canvas;
    },
    
    createGradientCanvas(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Parse gradient string
        const bgStr = this.settings.background;
        const match = bgStr.match(/linear-gradient\((\d+)deg,\s*([^)]+)\)/);
        
        if (match) {
            const angle = parseInt(match[1]) * Math.PI / 180;
            const colorStops = match[2].split(/,(?![^(]*\))/);
            
            const x1 = width / 2 - Math.cos(angle) * width;
            const y1 = height / 2 - Math.sin(angle) * height;
            const x2 = width / 2 + Math.cos(angle) * width;
            const y2 = height / 2 + Math.sin(angle) * height;
            
            const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
            
            colorStops.forEach(stop => {
                const parts = stop.trim().match(/(#[a-f0-9]+|rgba?\([^)]+\))\s*(\d+)?%?/i);
                if (parts) {
                    const color = parts[1];
                    const position = parts[2] ? parseInt(parts[2]) / 100 : null;
                    if (position !== null) {
                        gradient.addColorStop(position, color);
                    }
                }
            });
            
            ctx.fillStyle = gradient;
        } else {
            ctx.fillStyle = this.settings.background;
        }
        
        ctx.fillRect(0, 0, width, height);
        return canvas;
    },
    
    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    },
    
    reset() {
        if (this.image?.url) URL.revokeObjectURL(this.image.url);
        this.image = null;
        this.showPage('upload');
    },
};

document.addEventListener('DOMContentLoaded', () => App.init());



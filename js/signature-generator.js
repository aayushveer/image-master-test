// SIGNATURE GENERATOR PRO - WORLD'S BEST DIGITAL SIGNATURE TOOL
// Features: Type, Draw, Initials | 20+ Styles | All Formats | Offline Support

class SignatureGeneratorPro {
    constructor() {
        // State
        this.mode = 'type';
        this.currentStyle = 0;
        this.currentInitialStyle = 0;
        this.signatureColor = '#000000';
        this.signatureSize = 'medium';
        this.strokeThickness = 'normal';
        this.slantAngle = 0;
        this.userName = '';
        this.userInitials = '';
        this.previewBg = 'transparent';
        
        // Drawing state
        this.isDrawing = false;
        this.drawCanvas = null;
        this.drawCtx = null;
        this.lastX = 0;
        this.lastY = 0;
        this.drawPoints = [];
        this.strokeWidth = 3;
        this.smoothing = 5;
        
        // Signature styles with realistic handwriting simulation
        // Real connected handwriting fonts from Google Fonts
        this.signatureStyles = [
            { name: 'Elegant Script', family: 'Great Vibes', slant: 0, weight: 400, letterSpacing: 0, style: 'normal', baseline: 'connected' },
            { name: 'Flowing Cursive', family: 'Allura', slant: 0, weight: 400, letterSpacing: 0, style: 'normal', baseline: 'flowing' },
            { name: 'Classic Handwriting', family: 'Dancing Script', slant: 0, weight: 600, letterSpacing: 0, style: 'normal', baseline: 'classic' },
            { name: 'Artistic Brush', family: 'Alex Brush', slant: 0, weight: 400, letterSpacing: 0, style: 'normal', baseline: 'brush' },
            { name: 'Natural Handwriting', family: 'Homemade Apple', slant: 0, weight: 400, letterSpacing: 0, style: 'normal', baseline: 'natural' },
            { name: 'Bold Marker', family: 'Permanent Marker', slant: 0, weight: 400, letterSpacing: 0, style: 'normal', baseline: 'marker' },
            { name: 'Casual Script', family: 'Kaushan Script', slant: 0, weight: 400, letterSpacing: 0, style: 'normal', baseline: 'casual' },
            { name: 'Vintage Pen', family: 'Marck Script', slant: 0, weight: 400, letterSpacing: 0, style: 'normal', baseline: 'vintage' },
            { name: 'Modern Flow', family: 'Pacifico', slant: 0, weight: 400, letterSpacing: 0, style: 'normal', baseline: 'modern' },
            { name: 'Quick Scribble', family: 'Kristi', slant: 0, weight: 400, letterSpacing: 0, style: 'normal', baseline: 'quick' },
            { name: 'Rough Handwriting', family: 'Rock Salt', slant: 0, weight: 400, letterSpacing: 0, style: 'normal', baseline: 'rough' },
            { name: 'Smooth Cursive', family: 'Sacramento', slant: 0, weight: 400, letterSpacing: 0, style: 'normal', baseline: 'smooth' },
            { name: 'Satisfying Flow', family: 'Satisfy', slant: 0, weight: 400, letterSpacing: 0, style: 'normal', baseline: 'satisfy' },
            { name: 'Light Handwriting', family: 'Shadows Into Light', slant: 0, weight: 400, letterSpacing: 0, style: 'normal', baseline: 'light' },
            { name: 'Fancy Calligraphy', family: 'Tangerine', slant: 0, weight: 700, letterSpacing: 0, style: 'normal', baseline: 'fancy' },
            { name: 'Playful Script', family: 'Zeyada', slant: 0, weight: 400, letterSpacing: 0, style: 'normal', baseline: 'playful' },
            { name: 'Professional Script', family: 'Dancing Script', slant: 0, weight: 700, letterSpacing: 0, style: 'normal', baseline: 'professional' },
            { name: 'Elegant Thin', family: 'Tangerine', slant: 0, weight: 400, letterSpacing: 0, style: 'normal', baseline: 'thin' },
            { name: 'Bold Cursive', family: 'Dancing Script', slant: 0, weight: 500, letterSpacing: 0, style: 'normal', baseline: 'bold' },
            { name: 'Delicate Script', family: 'Great Vibes', slant: 0, weight: 400, letterSpacing: 1, style: 'normal', baseline: 'delicate' }
        ];

        this.initialStyles = [
            { name: 'Circle', shape: 'circle' },
            { name: 'Square', shape: 'square' },
            { name: 'Rounded', shape: 'rounded' },
            { name: 'Hexagon', shape: 'hexagon' },
            { name: 'Diamond', shape: 'diamond' },
            { name: 'Plain', shape: 'plain' },
            { name: 'Underline', shape: 'underline' },
            { name: 'Box', shape: 'box' }
        ];

        this.sizeConfig = {
            small: { width: 300, height: 100, fontSize: 28 },
            medium: { width: 500, height: 160, fontSize: 42 },
            large: { width: 700, height: 220, fontSize: 56 },
            xlarge: { width: 900, height: 280, fontSize: 72 }
        };

        this.thicknessMultiplier = {
            thin: 0.6,
            normal: 1,
            bold: 1.6
        };

        this.cities = [
            'New York', 'London', 'Tokyo', 'Paris', 'Mumbai', 'Sydney', 'Berlin', 'Toronto',
            'Singapore', 'Dubai', 'Los Angeles', 'Amsterdam', 'Seoul', 'Barcelona', 'Milan',
            'San Francisco', 'Hong Kong', 'Stockholm', 'Copenhagen', 'Zurich'
        ];

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.generateStyleCards();
        this.generateInitialStyles();
        this.setupDrawCanvas();
        this.startViralNotifications();
        this.startLiveCounter();
    }

    setupEventListeners() {
        // Mode tabs
        document.querySelectorAll('.mode-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchMode(e.target.closest('.mode-tab').dataset.mode));
        });

        // Name input
        const nameInput = document.getElementById('nameInput');
        nameInput.addEventListener('input', (e) => {
            this.userName = e.target.value;
            this.updateAllPreviews();
            this.showSections();
        });

        // Initials input
        const initialsInput = document.getElementById('initialsInput');
        initialsInput.addEventListener('input', (e) => {
            this.userInitials = e.target.value.toUpperCase();
            e.target.value = this.userInitials;
            this.updateInitialPreviews();
            this.showSections();
        });

        // Color buttons
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.signatureColor = e.target.dataset.color;
                this.updatePreview();
            });
        });

        // Size buttons
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.signatureSize = e.target.dataset.size;
                this.updatePreview();
            });
        });

        // Thickness buttons
        document.querySelectorAll('.thickness-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.thickness-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.strokeThickness = e.target.dataset.thickness;
                this.updatePreview();
            });
        });

        // Slant angle
        const slantAngle = document.getElementById('slantAngle');
        slantAngle.addEventListener('input', (e) => {
            this.slantAngle = parseInt(e.target.value);
            document.getElementById('slantValue').textContent = `${this.slantAngle}°`;
            this.updatePreview();
        });

        // Background toggle
        document.querySelectorAll('.bg-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.bg-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.previewBg = e.target.dataset.bg;
                this.updatePreviewBackground();
            });
        });

        // Download buttons
        document.getElementById('downloadPNG').addEventListener('click', () => this.download('png'));
        document.getElementById('downloadJPG').addEventListener('click', () => this.download('jpg'));
        document.getElementById('downloadSVG').addEventListener('click', () => this.download('svg'));
        document.getElementById('downloadPDF').addEventListener('click', () => this.download('pdf'));
        document.getElementById('downloadAll').addEventListener('click', () => this.downloadAll());

        // Draw canvas controls
        document.getElementById('strokeWidth').addEventListener('input', (e) => {
            this.strokeWidth = parseInt(e.target.value);
        });

        document.getElementById('smoothing').addEventListener('input', (e) => {
            this.smoothing = parseInt(e.target.value);
        });

        document.getElementById('clearCanvas').addEventListener('click', () => this.clearDrawCanvas());
    }

    switchMode(mode) {
        this.mode = mode;
        
        // Update tabs
        document.querySelectorAll('.mode-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === mode);
        });

        // Update sections
        document.querySelectorAll('.type-section, .draw-section, .initials-section').forEach(section => {
            section.classList.remove('active-section');
        });

        const sectionId = mode === 'type' ? 'typeSection' : mode === 'draw' ? 'drawSection' : 'initialsSection';
        document.getElementById(sectionId).classList.add('active-section');

        // Show/hide relevant sections
        if (mode === 'draw') {
            document.getElementById('customizeSection').style.display = 'block';
            this.showSections();
        } else if (mode === 'initials') {
            if (this.userInitials) {
                this.showSections();
            }
        } else {
            if (this.userName) {
                this.showSections();
            }
        }
    }

    generateStyleCards() {
        const grid = document.getElementById('stylesGrid');
        grid.innerHTML = '';

        this.signatureStyles.forEach((style, index) => {
            const card = document.createElement('div');
            card.className = `style-card ${index === this.currentStyle ? 'active' : ''}`;
            card.dataset.index = index;

            const previewCanvas = document.createElement('canvas');
            previewCanvas.width = 200;
            previewCanvas.height = 50;
            
            card.innerHTML = `
                <div class="style-preview"></div>
                <div class="style-name">${style.name}</div>
            `;

            card.querySelector('.style-preview').appendChild(previewCanvas);
            this.renderStylePreview(previewCanvas, style, 'Sample');

            card.addEventListener('click', () => {
                document.querySelectorAll('.style-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                this.currentStyle = index;
                this.updatePreview();
                document.getElementById('currentStyleName').textContent = style.name;
            });

            grid.appendChild(card);
        });
    }

    generateInitialStyles() {
        const container = document.getElementById('initialsStyles');
        container.innerHTML = '';

        this.initialStyles.forEach((style, index) => {
            const card = document.createElement('div');
            card.className = `initial-card ${index === this.currentInitialStyle ? 'active' : ''}`;
            card.innerHTML = `
                <div class="initial-preview" data-shape="${style.shape}">AB</div>
                <div class="initial-name">${style.name}</div>
            `;

            card.addEventListener('click', () => {
                document.querySelectorAll('.initial-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                this.currentInitialStyle = index;
                this.updatePreview();
            });

            container.appendChild(card);
        });
    }

    setupDrawCanvas() {
        this.drawCanvas = document.getElementById('drawCanvas');
        this.drawCtx = this.drawCanvas.getContext('2d');
        
        // Set canvas size based on container
        const container = this.drawCanvas.parentElement;
        const rect = container.getBoundingClientRect();
        this.drawCanvas.width = Math.min(700, rect.width - 4);
        this.drawCanvas.height = 250;
        
        this.drawCtx.strokeStyle = this.signatureColor;
        this.drawCtx.lineWidth = this.strokeWidth;
        this.drawCtx.lineCap = 'round';
        this.drawCtx.lineJoin = 'round';

        // Mouse events
        this.drawCanvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.drawCanvas.addEventListener('mousemove', (e) => this.draw(e));
        this.drawCanvas.addEventListener('mouseup', () => this.stopDrawing());
        this.drawCanvas.addEventListener('mouseleave', () => this.stopDrawing());

        // Touch events
        this.drawCanvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrawing(e.touches[0]);
        });
        this.drawCanvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e.touches[0]);
        });
        this.drawCanvas.addEventListener('touchend', () => this.stopDrawing());
    }

    startDrawing(e) {
        this.isDrawing = true;
        const rect = this.drawCanvas.getBoundingClientRect();
        const scaleX = this.drawCanvas.width / rect.width;
        const scaleY = this.drawCanvas.height / rect.height;
        this.lastX = (e.clientX - rect.left) * scaleX;
        this.lastY = (e.clientY - rect.top) * scaleY;
        this.drawPoints = [{ x: this.lastX, y: this.lastY }];

        // Hide placeholder
        document.getElementById('canvasPlaceholder').classList.add('hidden');
    }

    draw(e) {
        if (!this.isDrawing) return;

        const rect = this.drawCanvas.getBoundingClientRect();
        const scaleX = this.drawCanvas.width / rect.width;
        const scaleY = this.drawCanvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        this.drawPoints.push({ x, y });

        this.drawCtx.strokeStyle = this.signatureColor;
        this.drawCtx.lineWidth = this.strokeWidth;
        
        // Smooth line drawing
        if (this.drawPoints.length > 2) {
            const p1 = this.drawPoints[this.drawPoints.length - 3];
            const p2 = this.drawPoints[this.drawPoints.length - 2];
            const p3 = this.drawPoints[this.drawPoints.length - 1];
            
            this.drawCtx.beginPath();
            this.drawCtx.moveTo(p1.x, p1.y);
            
            // Calculate control points for smooth curve
            const cp1x = p1.x + (p2.x - p1.x) * 0.5;
            const cp1y = p1.y + (p2.y - p1.y) * 0.5;
            const cp2x = p2.x + (p3.x - p2.x) * 0.5;
            const cp2y = p2.y + (p3.y - p2.y) * 0.5;
            
            this.drawCtx.quadraticCurveTo(p2.x, p2.y, cp2x, cp2y);
            this.drawCtx.stroke();
        }

        this.lastX = x;
        this.lastY = y;
    }

    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.showSections();
            this.updateDrawPreview();
        }
    }

    clearDrawCanvas() {
        this.drawCtx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
        this.drawPoints = [];
        document.getElementById('canvasPlaceholder').classList.remove('hidden');
        
        // Hide sections if no signature
        document.getElementById('previewSection').style.display = 'none';
        document.getElementById('downloadSection').style.display = 'none';
    }

    showSections() {
        const hasContent = (this.mode === 'type' && this.userName) ||
                          (this.mode === 'draw' && this.drawPoints.length > 0) ||
                          (this.mode === 'initials' && this.userInitials);

        document.getElementById('customizeSection').style.display = hasContent ? 'block' : 'none';
        document.getElementById('previewSection').style.display = hasContent ? 'block' : 'none';
        document.getElementById('downloadSection').style.display = hasContent ? 'block' : 'none';

        if (hasContent) {
            this.updatePreview();
        }
    }

    updateAllPreviews() {
        // Update all style card previews with current name
        if (!this.userName) return;

        document.querySelectorAll('.style-card').forEach((card, index) => {
            const canvas = card.querySelector('canvas');
            if (canvas) {
                this.renderStylePreview(canvas, this.signatureStyles[index], this.userName);
            }
        });
    }

    updateInitialPreviews() {
        if (!this.userInitials) return;

        document.querySelectorAll('.initial-preview').forEach(el => {
            el.textContent = this.userInitials;
        });
    }

    renderStylePreview(canvas, style, text) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Use larger font for connected scripts
        const fontSize = style.family === 'Tangerine' ? 32 : 26;
        ctx.font = `${style.weight} ${fontSize}px "${style.family}", cursive`;
        ctx.fillStyle = '#2563eb';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw text centered
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        
        // Measure and scale if needed
        let textWidth = ctx.measureText(text || 'Sample').width;
        if (textWidth > canvas.width * 0.9) {
            const scale = (canvas.width * 0.9) / textWidth;
            ctx.scale(scale, scale);
        }
        
        ctx.fillText(text || 'Sample', 0, 0);
        ctx.restore();
    }

    updatePreview() {
        const canvas = document.getElementById('previewCanvas');
        const ctx = canvas.getContext('2d');
        const size = this.sizeConfig[this.signatureSize];

        canvas.width = size.width;
        canvas.height = size.height;
        document.getElementById('dimensionBadge').textContent = `${size.width} × ${size.height} px`;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (this.mode === 'type' && this.userName) {
            this.renderTypedSignature(ctx, canvas);
        } else if (this.mode === 'draw') {
            this.updateDrawPreview();
        } else if (this.mode === 'initials' && this.userInitials) {
            this.renderInitials(ctx, canvas);
        }
    }

    renderTypedSignature(ctx, canvas) {
        const style = this.signatureStyles[this.currentStyle];
        const size = this.sizeConfig[this.signatureSize];
        const thickness = this.thicknessMultiplier[this.strokeThickness];
        
        // Larger base font for connected scripts
        let fontSize = style.family === 'Tangerine' ? size.fontSize * 1.5 : size.fontSize * 1.2;
        const totalSlant = this.slantAngle; // Only use user's slant, fonts have natural slant

        // Set font with proper connected script
        ctx.font = `${style.weight} ${fontSize}px "${style.family}", cursive`;
        ctx.fillStyle = this.signatureColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Measure and adjust font size if needed
        let textWidth = ctx.measureText(this.userName).width;
        while (textWidth > canvas.width * 0.85 && fontSize > 16) {
            fontSize -= 2;
            ctx.font = `${style.weight} ${fontSize}px "${style.family}", cursive`;
            textWidth = ctx.measureText(this.userName).width;
        }

        // Apply transformations
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        
        // Apply user slant
        if (totalSlant !== 0) {
            ctx.transform(1, 0, Math.tan(totalSlant * Math.PI / 180), 1, 0, 0);
        }

        // Add subtle shadow for ink effect
        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = 1;
        ctx.shadowOffsetX = 0.5;
        ctx.shadowOffsetY = 0.5;

        // Draw the connected signature
        ctx.fillText(this.userName, 0, 0);

        ctx.restore();
    }

    renderInitials(ctx, canvas) {
        const style = this.initialStyles[this.currentInitialStyle];
        const size = this.sizeConfig[this.signatureSize];
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(canvas.width, canvas.height) * 0.35;

        ctx.fillStyle = this.signatureColor;
        ctx.strokeStyle = this.signatureColor;
        ctx.lineWidth = 3 * this.thicknessMultiplier[this.strokeThickness];

        // Draw shape
        ctx.beginPath();
        switch (style.shape) {
            case 'circle':
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.stroke();
                break;
            case 'square':
                ctx.strokeRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
                break;
            case 'rounded':
                this.roundedRect(ctx, centerX - radius, centerY - radius, radius * 2, radius * 2, 15);
                ctx.stroke();
                break;
            case 'hexagon':
                this.drawPolygon(ctx, centerX, centerY, radius, 6);
                ctx.stroke();
                break;
            case 'diamond':
                ctx.moveTo(centerX, centerY - radius);
                ctx.lineTo(centerX + radius, centerY);
                ctx.lineTo(centerX, centerY + radius);
                ctx.lineTo(centerX - radius, centerY);
                ctx.closePath();
                ctx.stroke();
                break;
            case 'underline':
                ctx.moveTo(centerX - radius, centerY + radius * 0.6);
                ctx.lineTo(centerX + radius, centerY + radius * 0.6);
                ctx.stroke();
                break;
            case 'box':
                ctx.strokeRect(centerX - radius * 1.2, centerY - radius * 0.6, radius * 2.4, radius * 1.2);
                break;
        }

        // Draw initials
        const fontSize = radius * (style.shape === 'plain' || style.shape === 'underline' ? 1.5 : 1);
        ctx.font = `700 ${fontSize}px serif`;
        ctx.fillStyle = this.signatureColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.userInitials, centerX, centerY);
    }

    roundedRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    drawPolygon(ctx, x, y, r, sides) {
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
            const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
            const px = x + r * Math.cos(angle);
            const py = y + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
    }

    updateDrawPreview() {
        if (this.drawPoints.length < 2) return;

        const previewCanvas = document.getElementById('previewCanvas');
        const previewCtx = previewCanvas.getContext('2d');
        const size = this.sizeConfig[this.signatureSize];

        previewCanvas.width = size.width;
        previewCanvas.height = size.height;

        // Calculate bounds of drawn signature
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        this.drawPoints.forEach(p => {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        });

        const drawWidth = maxX - minX;
        const drawHeight = maxY - minY;
        const scale = Math.min((size.width * 0.8) / drawWidth, (size.height * 0.8) / drawHeight);
        const offsetX = (size.width - drawWidth * scale) / 2 - minX * scale;
        const offsetY = (size.height - drawHeight * scale) / 2 - minY * scale;

        // Draw scaled signature
        previewCtx.strokeStyle = this.signatureColor;
        previewCtx.lineWidth = this.strokeWidth * this.thicknessMultiplier[this.strokeThickness] * scale;
        previewCtx.lineCap = 'round';
        previewCtx.lineJoin = 'round';

        previewCtx.beginPath();
        this.drawPoints.forEach((p, i) => {
            const x = p.x * scale + offsetX;
            const y = p.y * scale + offsetY;
            if (i === 0) previewCtx.moveTo(x, y);
            else previewCtx.lineTo(x, y);
        });
        previewCtx.stroke();

        document.getElementById('dimensionBadge').textContent = `${size.width} × ${size.height} px`;
    }

    updatePreviewBackground() {
        const wrapper = document.getElementById('previewWrapper');
        wrapper.classList.remove('bg-white', 'bg-paper');
        
        if (this.previewBg === 'white') {
            wrapper.classList.add('bg-white');
        } else if (this.previewBg === 'paper') {
            wrapper.classList.add('bg-paper');
        }
    }

    download(format) {
        const canvas = document.getElementById('previewCanvas');
        const size = this.sizeConfig[this.signatureSize];
        
        // Create high-res version
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = size.width * 2;
        exportCanvas.height = size.height * 2;
        const exportCtx = exportCanvas.getContext('2d');
        exportCtx.scale(2, 2);

        if (format === 'jpg') {
            exportCtx.fillStyle = '#ffffff';
            exportCtx.fillRect(0, 0, size.width, size.height);
        }

        // Re-render at high res
        if (this.mode === 'type' && this.userName) {
            this.renderTypedSignature(exportCtx, { width: size.width, height: size.height });
        } else if (this.mode === 'draw') {
            this.renderDrawnSignature(exportCtx, size);
        } else if (this.mode === 'initials' && this.userInitials) {
            this.renderInitials(exportCtx, { width: size.width, height: size.height });
        }

        const filename = `signature_${Date.now()}`;

        if (format === 'png' || format === 'jpg') {
            const link = document.createElement('a');
            link.download = `${filename}.${format}`;
            link.href = exportCanvas.toDataURL(format === 'jpg' ? 'image/jpeg' : 'image/png', 0.95);
            link.click();
        } else if (format === 'svg') {
            this.downloadSVG(filename);
        } else if (format === 'pdf') {
            this.downloadPDF(exportCanvas, filename);
        }

        this.showToast(`${format.toUpperCase()} downloaded!`);
    }

    renderDrawnSignature(ctx, size) {
        if (this.drawPoints.length < 2) return;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        this.drawPoints.forEach(p => {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        });

        const drawWidth = maxX - minX;
        const drawHeight = maxY - minY;
        const scale = Math.min((size.width * 0.8) / drawWidth, (size.height * 0.8) / drawHeight);
        const offsetX = (size.width - drawWidth * scale) / 2 - minX * scale;
        const offsetY = (size.height - drawHeight * scale) / 2 - minY * scale;

        ctx.strokeStyle = this.signatureColor;
        ctx.lineWidth = this.strokeWidth * this.thicknessMultiplier[this.strokeThickness] * scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        this.drawPoints.forEach((p, i) => {
            const x = p.x * scale + offsetX;
            const y = p.y * scale + offsetY;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
    }

    downloadSVG(filename) {
        const size = this.sizeConfig[this.signatureSize];
        const style = this.signatureStyles[this.currentStyle];
        const fontSize = style.family === 'Tangerine' ? size.fontSize * 1.5 : size.fontSize * 1.2;
        
        let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}">`;
        
        // Embed Google Font for SVG
        svgContent += `
            <defs>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=${style.family.replace(/ /g, '+')}&amp;display=swap');
                </style>
            </defs>
        `;

        if (this.mode === 'type' && this.userName) {
            const totalSlant = this.slantAngle;
            svgContent += `
                <text x="${size.width/2}" y="${size.height/2}" 
                      font-family="'${style.family}', cursive" 
                      font-size="${fontSize}" 
                      font-weight="${style.weight}"
                      fill="${this.signatureColor}"
                      text-anchor="middle"
                      dominant-baseline="central"
                      ${totalSlant !== 0 ? `transform="skewX(${-totalSlant})"` : ''}>${this.userName}</text>
            `;
        } else if (this.mode === 'draw' && this.drawPoints.length > 1) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            this.drawPoints.forEach(p => {
                minX = Math.min(minX, p.x);
                minY = Math.min(minY, p.y);
                maxX = Math.max(maxX, p.x);
                maxY = Math.max(maxY, p.y);
            });

            const drawWidth = maxX - minX;
            const drawHeight = maxY - minY;
            const scale = Math.min((size.width * 0.8) / drawWidth, (size.height * 0.8) / drawHeight);
            const offsetX = (size.width - drawWidth * scale) / 2 - minX * scale;
            const offsetY = (size.height - drawHeight * scale) / 2 - minY * scale;

            let pathData = '';
            this.drawPoints.forEach((p, i) => {
                const x = p.x * scale + offsetX;
                const y = p.y * scale + offsetY;
                pathData += i === 0 ? `M${x},${y}` : ` L${x},${y}`;
            });

            svgContent += `
                <path d="${pathData}" 
                      stroke="${this.signatureColor}" 
                      stroke-width="${this.strokeWidth * this.thicknessMultiplier[this.strokeThickness] * scale}"
                      fill="none"
                      stroke-linecap="round"
                      stroke-linejoin="round"/>
            `;
        }

        svgContent += '</svg>';

        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const link = document.createElement('a');
        link.download = `${filename}.svg`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
    }

    downloadPDF(canvas, filename) {
        // Simple PDF generation with embedded image
        const imgData = canvas.toDataURL('image/png');
        const width = canvas.width;
        const height = canvas.height;

        // Create PDF manually (basic implementation)
        const pdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << >> >> endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer << /Size 4 /Root 1 0 R >>
startxref
229
%%EOF`;

        // For proper PDF, we need a library - for now, download as HTML that can be printed to PDF
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Signature</title>
                <style>
                    body { margin: 0; padding: 50px; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                    img { max-width: 100%; }
                </style>
            </head>
            <body>
                <img src="${imgData}" alt="Signature">
                <script>window.print();</script>
            </body>
            </html>
        `;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const link = document.createElement('a');
        link.download = `${filename}.html`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);

        this.showToast('Open the file and use Print → Save as PDF');
    }

    async downloadAll() {
        // Download all formats
        this.download('png');
        await new Promise(r => setTimeout(r, 300));
        this.download('jpg');
        await new Promise(r => setTimeout(r, 300));
        this.download('svg');
        
        this.showToast('All formats downloaded!');
    }

    showToast(message) {
        const toast = document.getElementById('toast');
        const msg = document.getElementById('toastMsg');
        msg.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // Viral Features
    startViralNotifications() {
        const showNotification = () => {
            const city = this.cities[Math.floor(Math.random() * this.cities.length)];
            const styles = ['Elegant Script', 'CEO Signature', 'Modern Minimal', 'Professional'];
            const style = styles[Math.floor(Math.random() * styles.length)];
            
            const messages = [
                `Someone in <span class="city">${city}</span> created a ${style} signature`,
                `Professional from <span class="city">${city}</span> downloaded their signature`,
                `New ${style} signature created in <span class="city">${city}</span>`
            ];
            
            const box = document.getElementById('viralBox');
            const item = document.createElement('div');
            item.className = 'viral-item';
            item.innerHTML = `<span class="emoji">🖋️</span> ${messages[Math.floor(Math.random() * messages.length)]}`;
            
            box.appendChild(item);
            setTimeout(() => item.classList.add('show'), 100);
            
            setTimeout(() => {
                item.classList.remove('show');
                setTimeout(() => item.remove(), 300);
            }, 5000);

            // Keep max 3
            while (box.children.length > 3) {
                box.firstChild.remove();
            }

            setTimeout(showNotification, Math.random() * 4000 + 3000);
        };

        setTimeout(showNotification, 2000);
    }

    startLiveCounter() {
        const counter = document.getElementById('liveCount');
        let count = parseInt(counter.textContent.replace(/,/g, ''));

        setInterval(() => {
            count += Math.floor(Math.random() * 3) + 1;
            counter.textContent = count.toLocaleString();
        }, Math.random() * 3000 + 2000);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.signatureGenerator = new SignatureGeneratorPro();
});
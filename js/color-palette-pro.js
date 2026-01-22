/**
 * COLOR-PALETTE-PRO.JS - Production Grade Color Palette Extractor
 * Best-in-class features: AI extraction, accessibility, harmony, exports
 * Image Runner - www.imgrunner.com
 */

(function() {
    'use strict';

    // ============================================================
    // STATE & CONFIG
    // ============================================================
    const state = {
        image: null,
        colors: [],
        selectedColor: null,
        selectedIndex: 0,
        colorCount: 8,
        currentFormat: 'css'
    };

    // Comprehensive color name database (147 CSS colors + extras)
    const COLOR_NAMES = {
        '#000000': 'Black', '#FFFFFF': 'White', '#FF0000': 'Red', '#00FF00': 'Lime',
        '#0000FF': 'Blue', '#FFFF00': 'Yellow', '#00FFFF': 'Cyan', '#FF00FF': 'Magenta',
        '#C0C0C0': 'Silver', '#808080': 'Gray', '#800000': 'Maroon', '#808000': 'Olive',
        '#008000': 'Green', '#800080': 'Purple', '#008080': 'Teal', '#000080': 'Navy',
        '#FFA500': 'Orange', '#FF4500': 'OrangeRed', '#FF6347': 'Tomato', '#FF7F50': 'Coral',
        '#FFD700': 'Gold', '#ADFF2F': 'GreenYellow', '#7FFF00': 'Chartreuse',
        '#00FA9A': 'MediumSpringGreen', '#00CED1': 'DarkTurquoise', '#1E90FF': 'DodgerBlue',
        '#8A2BE2': 'BlueViolet', '#9400D3': 'DarkViolet', '#FF1493': 'DeepPink',
        '#DC143C': 'Crimson', '#F5F5DC': 'Beige', '#FFE4C4': 'Bisque',
        '#FAEBD7': 'AntiqueWhite', '#D2691E': 'Chocolate', '#8B4513': 'SaddleBrown',
        '#A52A2A': 'Brown', '#DEB887': 'BurlyWood', '#5F9EA0': 'CadetBlue',
        '#7FFF00': 'Chartreuse', '#D2691E': 'Chocolate', '#6495ED': 'CornflowerBlue',
        '#FFF8DC': 'Cornsilk', '#DC143C': 'Crimson', '#00008B': 'DarkBlue',
        '#008B8B': 'DarkCyan', '#B8860B': 'DarkGoldenRod', '#A9A9A9': 'DarkGray',
        '#006400': 'DarkGreen', '#BDB76B': 'DarkKhaki', '#8B008B': 'DarkMagenta',
        '#556B2F': 'DarkOliveGreen', '#FF8C00': 'DarkOrange', '#9932CC': 'DarkOrchid',
        '#8B0000': 'DarkRed', '#E9967A': 'DarkSalmon', '#8FBC8F': 'DarkSeaGreen',
        '#483D8B': 'DarkSlateBlue', '#2F4F4F': 'DarkSlateGray', '#00CED1': 'DarkTurquoise',
        '#9400D3': 'DarkViolet', '#FF1493': 'DeepPink', '#00BFFF': 'DeepSkyBlue',
        '#696969': 'DimGray', '#1E90FF': 'DodgerBlue', '#B22222': 'FireBrick',
        '#FFFAF0': 'FloralWhite', '#228B22': 'ForestGreen', '#DCDCDC': 'Gainsboro',
        '#F8F8FF': 'GhostWhite', '#FFD700': 'Gold', '#DAA520': 'GoldenRod',
        '#ADFF2F': 'GreenYellow', '#F0FFF0': 'HoneyDew', '#FF69B4': 'HotPink',
        '#CD5C5C': 'IndianRed', '#4B0082': 'Indigo', '#FFFFF0': 'Ivory',
        '#F0E68C': 'Khaki', '#E6E6FA': 'Lavender', '#FFF0F5': 'LavenderBlush',
        '#7CFC00': 'LawnGreen', '#FFFACD': 'LemonChiffon', '#ADD8E6': 'LightBlue',
        '#F08080': 'LightCoral', '#E0FFFF': 'LightCyan', '#FAFAD2': 'LightGoldenRodYellow',
        '#D3D3D3': 'LightGray', '#90EE90': 'LightGreen', '#FFB6C1': 'LightPink',
        '#FFA07A': 'LightSalmon', '#20B2AA': 'LightSeaGreen', '#87CEFA': 'LightSkyBlue',
        '#778899': 'LightSlateGray', '#B0C4DE': 'LightSteelBlue', '#FFFFE0': 'LightYellow',
        '#32CD32': 'LimeGreen', '#FAF0E6': 'Linen', '#66CDAA': 'MediumAquaMarine',
        '#0000CD': 'MediumBlue', '#BA55D3': 'MediumOrchid', '#9370DB': 'MediumPurple',
        '#3CB371': 'MediumSeaGreen', '#7B68EE': 'MediumSlateBlue', '#00FA9A': 'MediumSpringGreen',
        '#48D1CC': 'MediumTurquoise', '#C71585': 'MediumVioletRed', '#191970': 'MidnightBlue',
        '#F5FFFA': 'MintCream', '#FFE4E1': 'MistyRose', '#FFE4B5': 'Moccasin',
        '#FFDEAD': 'NavajoWhite', '#FDF5E6': 'OldLace', '#6B8E23': 'OliveDrab',
        '#FF4500': 'OrangeRed', '#DA70D6': 'Orchid', '#EEE8AA': 'PaleGoldenRod',
        '#98FB98': 'PaleGreen', '#AFEEEE': 'PaleTurquoise', '#DB7093': 'PaleVioletRed',
        '#FFEFD5': 'PapayaWhip', '#FFDAB9': 'PeachPuff', '#CD853F': 'Peru',
        '#FFC0CB': 'Pink', '#DDA0DD': 'Plum', '#B0E0E6': 'PowderBlue',
        '#BC8F8F': 'RosyBrown', '#4169E1': 'RoyalBlue', '#8B4513': 'SaddleBrown',
        '#FA8072': 'Salmon', '#F4A460': 'SandyBrown', '#2E8B57': 'SeaGreen',
        '#FFF5EE': 'SeaShell', '#A0522D': 'Sienna', '#87CEEB': 'SkyBlue',
        '#6A5ACD': 'SlateBlue', '#708090': 'SlateGray', '#FFFAFA': 'Snow',
        '#00FF7F': 'SpringGreen', '#4682B4': 'SteelBlue', '#D2B48C': 'Tan',
        '#D8BFD8': 'Thistle', '#FF6347': 'Tomato', '#40E0D0': 'Turquoise',
        '#EE82EE': 'Violet', '#F5DEB3': 'Wheat', '#F5F5F5': 'WhiteSmoke',
        '#9ACD32': 'YellowGreen'
    };

    // Creative color names by category
    const CREATIVE_NAMES = {
        red: ['Crimson Flame', 'Ruby Passion', 'Scarlet Dream', 'Vermillion Fire', 'Cherry Kiss'],
        orange: ['Tangerine Burst', 'Amber Glow', 'Sunset Blaze', 'Copper Shine', 'Pumpkin Spice'],
        yellow: ['Golden Hour', 'Sunflower Dance', 'Canary Song', 'Honey Drizzle', 'Lemon Zest'],
        green: ['Forest Whisper', 'Emerald Dream', 'Sage Serenity', 'Mint Fresh', 'Jungle Mist'],
        cyan: ['Ocean Breeze', 'Turquoise Wave', 'Aqua Splash', 'Glacier Ice', 'Lagoon Blue'],
        blue: ['Midnight Sky', 'Cobalt Depth', 'Azure Calm', 'Sapphire Echo', 'Pacific Dream'],
        purple: ['Lavender Mist', 'Violet Twilight', 'Amethyst Glow', 'Plum Mystery', 'Grape Royale'],
        pink: ['Rose Petal', 'Blush Whisper', 'Coral Kiss', 'Fuchsia Bloom', 'Ballet Slipper'],
        brown: ['Espresso Rich', 'Mocha Warmth', 'Chestnut Glow', 'Sienna Earth', 'Caramel Swirl'],
        gray: ['Slate Wisdom', 'Ash Calm', 'Stone Balance', 'Graphite Edge', 'Silver Fox'],
        white: ['Snow Pure', 'Ivory Elegance', 'Pearl Sheen', 'Cloud Soft', 'Cotton Dream'],
        black: ['Obsidian Night', 'Onyx Depth', 'Charcoal Bold', 'Jet Noir', 'Midnight Ink']
    };

    // Color psychology database
    const COLOR_PSYCHOLOGY = {
        red: { 
            tags: ['Energy', 'Passion', 'Urgency', 'Bold', 'Excitement'],
            usage: 'Perfect for CTAs, sale banners, food & restaurant brands. Creates urgency and drives action.',
            industries: ['Food', 'Sports', 'Entertainment', 'Sales', 'Automotive']
        },
        orange: { 
            tags: ['Friendly', 'Creative', 'Confident', 'Warm', 'Playful'],
            usage: 'Great for youth brands, creative agencies, tech startups. Inviting and energetic.',
            industries: ['Tech', 'Retail', 'Food', 'Children', 'Creative']
        },
        yellow: { 
            tags: ['Optimism', 'Happiness', 'Attention', 'Warmth', 'Clarity'],
            usage: 'Ideal for grabbing attention, warning signs, cheerful brands. Use sparingly.',
            industries: ['Food', 'Entertainment', 'Children', 'Travel', 'Retail']
        },
        green: { 
            tags: ['Nature', 'Health', 'Growth', 'Calm', 'Prosperity'],
            usage: 'Best for eco-friendly, health, finance, wellness brands. Represents growth.',
            industries: ['Health', 'Finance', 'Environment', 'Organic', 'Wellness']
        },
        cyan: { 
            tags: ['Fresh', 'Clean', 'Modern', 'Trust', 'Innovation'],
            usage: 'Works well for tech, healthcare, cleaning, water brands. Modern feel.',
            industries: ['Tech', 'Healthcare', 'Spa', 'Water', 'Innovation']
        },
        blue: { 
            tags: ['Trust', 'Professional', 'Calm', 'Secure', 'Reliable'],
            usage: 'Perfect for corporate, finance, tech, healthcare. Most used in business.',
            industries: ['Corporate', 'Finance', 'Tech', 'Healthcare', 'Insurance']
        },
        purple: { 
            tags: ['Luxury', 'Creative', 'Wisdom', 'Mystery', 'Royalty'],
            usage: 'Ideal for luxury brands, beauty, spirituality, creative industries.',
            industries: ['Beauty', 'Luxury', 'Creative', 'Wellness', 'Education']
        },
        pink: { 
            tags: ['Feminine', 'Romantic', 'Playful', 'Sweet', 'Caring'],
            usage: 'Great for beauty, fashion, romance, children products. Soft appeal.',
            industries: ['Beauty', 'Fashion', 'Children', 'Desserts', 'Wedding']
        },
        brown: { 
            tags: ['Earthy', 'Reliable', 'Warm', 'Natural', 'Rustic'],
            usage: 'Best for organic, outdoor, coffee, rustic brands. Grounded feel.',
            industries: ['Coffee', 'Outdoor', 'Organic', 'Furniture', 'Craft']
        },
        gray: { 
            tags: ['Neutral', 'Balance', 'Sophisticated', 'Professional', 'Timeless'],
            usage: 'Works well for tech, luxury, professional services. Versatile.',
            industries: ['Tech', 'Luxury', 'Corporate', 'Automotive', 'Architecture']
        },
        white: { 
            tags: ['Pure', 'Clean', 'Minimal', 'Modern', 'Simple'],
            usage: 'Perfect for healthcare, tech, minimalist brands. Clean aesthetic.',
            industries: ['Healthcare', 'Tech', 'Luxury', 'Wellness', 'Fashion']
        },
        black: { 
            tags: ['Luxury', 'Power', 'Elegant', 'Bold', 'Sophisticated'],
            usage: 'Ideal for luxury, fashion, high-end tech. Creates contrast.',
            industries: ['Luxury', 'Fashion', 'Tech', 'Automotive', 'Music']
        }
    };

    // Popular brand palettes for matching
    const BRAND_PALETTES = [
        { name: 'Facebook', colors: ['#1877F2', '#42B72A', '#F0F2F5', '#FFFFFF'] },
        { name: 'Twitter/X', colors: ['#1DA1F2', '#14171A', '#657786', '#FFFFFF'] },
        { name: 'Instagram', colors: ['#E1306C', '#F77737', '#FCAF45', '#833AB4'] },
        { name: 'Spotify', colors: ['#1DB954', '#191414', '#FFFFFF', '#535353'] },
        { name: 'Netflix', colors: ['#E50914', '#000000', '#FFFFFF', '#564D4D'] },
        { name: 'Apple', colors: ['#000000', '#FFFFFF', '#A3AAAE', '#0071E3'] },
        { name: 'Google', colors: ['#4285F4', '#DB4437', '#F4B400', '#0F9D58'] },
        { name: 'Amazon', colors: ['#FF9900', '#232F3E', '#FFFFFF', '#146EB4'] },
        { name: 'Microsoft', colors: ['#F25022', '#7FBA00', '#00A4EF', '#FFB900'] },
        { name: 'Airbnb', colors: ['#FF5A5F', '#00A699', '#FC642D', '#484848'] },
        { name: 'Slack', colors: ['#4A154B', '#36C5F0', '#2EB67D', '#ECB22E'] },
        { name: 'Dribbble', colors: ['#EA4C89', '#F082AC', '#444444', '#C32361'] },
        { name: 'LinkedIn', colors: ['#0A66C2', '#FFFFFF', '#000000', '#86888A'] },
        { name: 'YouTube', colors: ['#FF0000', '#FFFFFF', '#282828', '#AAAAAA'] },
        { name: 'WhatsApp', colors: ['#25D366', '#128C7E', '#075E54', '#FFFFFF'] },
        { name: 'TikTok', colors: ['#000000', '#FF0050', '#00F2EA', '#FFFFFF'] }
    ];

    // ============================================================
    // DOM ELEMENTS
    // ============================================================
    const el = {
        // Pages
        pageUpload: document.getElementById('page-upload'),
        pageAnalysis: document.getElementById('page-analysis'),
        
        // Upload
        dropzone: document.getElementById('dropzone'),
        fileInput: document.getElementById('file-input'),
        urlInput: document.getElementById('url-input'),
        btnLoadUrl: document.getElementById('btn-load-url'),
        btnNew: document.getElementById('btn-new'),
        
        // Preview
        previewImage: document.getElementById('preview-image'),
        imageInfo: document.getElementById('image-info'),
        colorCountSlider: document.getElementById('color-count-slider'),
        colorCountDisplay: document.getElementById('color-count-display'),
        colorsGrid: document.getElementById('colors-grid'),
        
        // Quick Actions
        btnCopyAll: document.getElementById('btn-copy-all'),
        btnDownloadPng: document.getElementById('btn-download-png'),
        btnShare: document.getElementById('btn-share'),
        
        // Details Tab
        detailSwatch: document.getElementById('detail-swatch'),
        detailName: document.getElementById('detail-name'),
        detailFancy: document.getElementById('detail-fancy'),
        valHex: document.getElementById('val-hex'),
        valRgb: document.getElementById('val-rgb'),
        valHsl: document.getElementById('val-hsl'),
        valCmyk: document.getElementById('val-cmyk'),
        psychologyTags: document.getElementById('psychology-tags'),
        usageText: document.getElementById('usage-text'),
        moodWarm: document.getElementById('mood-warm'),
        moodEnergy: document.getElementById('mood-energy'),
        moodCasual: document.getElementById('mood-casual'),
        industryTags: document.getElementById('industry-tags'),
        
        // Accessibility Tab
        a11yScore: document.getElementById('a11y-score'),
        a11yPass: document.getElementById('a11y-pass'),
        a11yWarning: document.getElementById('a11y-warning'),
        a11yFail: document.getElementById('a11y-fail'),
        contrastGrid: document.getElementById('contrast-grid'),
        colorblindPreview: document.getElementById('colorblind-preview'),
        
        // Harmony Tab
        harmonyBadge: document.getElementById('harmony-badge'),
        harmonyDesc: document.getElementById('harmony-desc'),
        colorWheel: document.getElementById('color-wheel'),
        harmonySuggestions: document.getElementById('harmony-suggestions'),
        brandMatches: document.getElementById('brand-matches'),
        
        // Shades Tab
        shadeColorSelect: document.getElementById('shade-color-select'),
        tintsRow: document.getElementById('tints-row'),
        baseRow: document.getElementById('base-row'),
        shadesRow: document.getElementById('shades-row'),
        gradientFrom: document.getElementById('gradient-from'),
        gradientTo: document.getElementById('gradient-to'),
        gradientDirection: document.getElementById('gradient-direction'),
        gradientPreview: document.getElementById('gradient-preview'),
        gradientCode: document.getElementById('gradient-code'),
        
        // Export Tab
        exportCode: document.getElementById('export-code'),
        shareUrl: document.getElementById('share-url'),
        
        // Toast
        toast: document.getElementById('toast'),
        toastMessage: document.getElementById('toast-message')
    };

    // ============================================================
    // INITIALIZATION
    // ============================================================
    function init() {
        bindEvents();
        checkUrlParams();
    }

    function bindEvents() {
        // Upload events
        el.dropzone.addEventListener('click', () => el.fileInput.click());
        el.fileInput.addEventListener('change', handleFileSelect);
        el.dropzone.addEventListener('dragover', handleDragOver);
        el.dropzone.addEventListener('dragleave', handleDragLeave);
        el.dropzone.addEventListener('drop', handleDrop);
        el.btnLoadUrl.addEventListener('click', loadFromUrl);
        el.btnNew.addEventListener('click', resetTool);
        
        // Color count slider
        el.colorCountSlider.addEventListener('input', (e) => {
            state.colorCount = parseInt(e.target.value);
            el.colorCountDisplay.textContent = state.colorCount;
            if (state.image) extractColors();
        });
        
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.dataset.tab));
        });
        
        // Copy buttons
        document.querySelectorAll('.copy-btn[data-copy]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                copyColorValue(btn.dataset.copy);
            });
        });
        
        // Quick actions
        el.btnCopyAll.addEventListener('click', copyAllColors);
        el.btnDownloadPng.addEventListener('click', downloadPalettePng);
        el.btnShare.addEventListener('click', () => {
            switchTab('export');
            generateShareLink();
        });
        
        // Colorblind modes
        document.querySelectorAll('.cb-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.cb-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderColorblindPreview(btn.dataset.mode);
            });
        });
        
        // Export formats
        document.querySelectorAll('.export-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.export-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.currentFormat = btn.dataset.format;
                generateExport(btn.dataset.format);
            });
        });
        
        // Shade color select
        el.shadeColorSelect.addEventListener('change', () => {
            generateShades(el.shadeColorSelect.value);
        });
        
        // Gradient controls
        el.gradientFrom.addEventListener('change', updateGradient);
        el.gradientTo.addEventListener('change', updateGradient);
        el.gradientDirection.addEventListener('change', updateGradient);
        
        // Export actions
        document.getElementById('btn-copy-export').addEventListener('click', () => {
            copyToClipboard(el.exportCode.textContent);
        });
        document.getElementById('btn-download-code').addEventListener('click', downloadExportFile);
        document.getElementById('btn-download-palette-png').addEventListener('click', downloadPalettePng);
        document.getElementById('copy-gradient').addEventListener('click', () => {
            copyToClipboard(el.gradientCode.textContent);
        });
        
        // Share
        document.getElementById('btn-generate-link').addEventListener('click', generateShareLink);
        document.getElementById('btn-copy-link').addEventListener('click', () => {
            copyToClipboard(el.shareUrl.value);
        });
    }

    // ============================================================
    // FILE HANDLING
    // ============================================================
    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            loadImage(file);
        }
        // Reset input so same file can be selected again
        e.target.value = '';
    }

    function handleDragOver(e) {
        e.preventDefault();
        el.dropzone.style.borderColor = 'var(--primary)';
        el.dropzone.style.background = 'var(--primary-light)';
    }

    function handleDragLeave(e) {
        e.preventDefault();
        el.dropzone.style.borderColor = '';
        el.dropzone.style.background = '';
    }

    function handleDrop(e) {
        e.preventDefault();
        el.dropzone.style.borderColor = '';
        el.dropzone.style.background = '';
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            loadImage(file);
        }
    }

    function loadImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                state.image = img;
                el.previewImage.src = e.target.result;
                el.imageInfo.textContent = `${img.width} × ${img.height}px`;
                showAnalysis();
                extractColors();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function loadFromUrl() {
        const url = el.urlInput.value.trim();
        if (!url) return;
        
        showToast('Loading image...');
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            state.image = img;
            el.previewImage.src = url;
            el.imageInfo.textContent = `${img.width} × ${img.height}px`;
            showAnalysis();
            extractColors();
        };
        img.onerror = () => {
            showToast('Failed to load. Try downloading and uploading.');
        };
        img.src = url;
    }

    function checkUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const colors = params.get('colors');
        if (colors) {
            state.colors = colors.split(',').map((c, i) => {
                const hex = '#' + c.toUpperCase();
                const rgb = hexToRgb(hex);
                return {
                    hex: hex,
                    rgb: rgb,
                    hsl: rgbToHsl(rgb.r, rgb.g, rgb.b),
                    percent: 100 / colors.split(',').length
                };
            });
            showAnalysis();
            renderColors();
            updateAllTabs();
        }
    }

    // ============================================================
    // COLOR EXTRACTION (K-means clustering)
    // ============================================================
    function extractColors() {
        if (!state.image) return;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Scale down for performance (max 150px)
        const maxSize = 150;
        const scale = Math.min(maxSize / state.image.width, maxSize / state.image.height, 1);
        canvas.width = Math.floor(state.image.width * scale);
        canvas.height = Math.floor(state.image.height * scale);
        
        ctx.drawImage(state.image, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        
        // Collect all colors with frequency
        const colorMap = new Map();
        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];
            
            if (a < 128) continue; // Skip transparent
            
            // Quantize to reduce unique colors (step of 8)
            const qr = Math.round(r / 8) * 8;
            const qg = Math.round(g / 8) * 8;
            const qb = Math.round(b / 8) * 8;
            
            const key = `${qr},${qg},${qb}`;
            colorMap.set(key, (colorMap.get(key) || 0) + 1);
        }
        
        // Sort by frequency
        const sortedColors = Array.from(colorMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, state.colorCount * 5); // Take top candidates
        
        // K-means clustering
        const totalPixels = pixels.length / 4;
        state.colors = kMeansCluster(sortedColors, state.colorCount).map(color => {
            const [r, g, b] = color.rgb;
            const hex = rgbToHex(r, g, b);
            return {
                hex: hex,
                rgb: { r, g, b },
                hsl: rgbToHsl(r, g, b),
                percent: (color.count / totalPixels) * 100
            };
        });
        
        renderColors();
        updateAllTabs();
    }

    function kMeansCluster(colors, k) {
        const points = colors.map(([key, count]) => {
            const [r, g, b] = key.split(',').map(Number);
            return { rgb: [r, g, b], count };
        });
        
        if (points.length <= k) return points;
        
        // Initialize centroids
        let centroids = points.slice(0, k).map(p => [...p.rgb]);
        
        // Iterate 10 times
        for (let iter = 0; iter < 10; iter++) {
            const clusters = Array.from({ length: k }, () => []);
            
            points.forEach(point => {
                let minDist = Infinity, minIdx = 0;
                centroids.forEach((c, idx) => {
                    const dist = colorDistance(point.rgb, c);
                    if (dist < minDist) { minDist = dist; minIdx = idx; }
                });
                clusters[minIdx].push(point);
            });
            
            centroids = clusters.map((cluster, idx) => {
                if (cluster.length === 0) return centroids[idx];
                let sumR = 0, sumG = 0, sumB = 0, total = 0;
                cluster.forEach(p => {
                    sumR += p.rgb[0] * p.count;
                    sumG += p.rgb[1] * p.count;
                    sumB += p.rgb[2] * p.count;
                    total += p.count;
                });
                return [Math.round(sumR/total), Math.round(sumG/total), Math.round(sumB/total)];
            });
        }
        
        // Return final clusters
        const final = Array.from({ length: k }, () => ({ rgb: [0,0,0], count: 0 }));
        points.forEach(point => {
            let minDist = Infinity, minIdx = 0;
            centroids.forEach((c, idx) => {
                const dist = colorDistance(point.rgb, c);
                if (dist < minDist) { minDist = dist; minIdx = idx; }
            });
            final[minIdx].rgb = centroids[minIdx];
            final[minIdx].count += point.count;
        });
        
        return final.filter(c => c.count > 0).sort((a, b) => b.count - a.count);
    }

    function colorDistance(c1, c2) {
        return Math.sqrt(
            Math.pow(c1[0] - c2[0], 2) +
            Math.pow(c1[1] - c2[1], 2) +
            Math.pow(c1[2] - c2[2], 2)
        );
    }

    // ============================================================
    // RENDERING
    // ============================================================
    function renderColors() {
        el.colorsGrid.innerHTML = state.colors.map((color, idx) => `
            <div class="color-card ${idx === state.selectedIndex ? 'selected' : ''}" data-index="${idx}">
                <div class="color-card__swatch" style="background: ${color.hex}"></div>
                <div class="color-card__info">
                    <div class="color-card__hex">${color.hex.toUpperCase()}</div>
                    <div class="color-card__percent">${color.percent.toFixed(1)}%</div>
                </div>
            </div>
        `).join('');
        
        // Add click handlers
        document.querySelectorAll('.color-card').forEach(card => {
            card.addEventListener('click', () => selectColor(parseInt(card.dataset.index)));
        });
        
        // Auto-select first color
        if (state.colors.length > 0) {
            selectColor(0);
        }
        
        updateColorSelects();
    }

    function selectColor(index) {
        state.selectedIndex = index;
        state.selectedColor = state.colors[index];
        
        // Update UI
        document.querySelectorAll('.color-card').forEach((card, i) => {
            card.classList.toggle('selected', i === index);
        });
        
        // Update details
        const color = state.selectedColor;
        el.detailSwatch.style.background = color.hex;
        
        // Get names
        const category = getColorCategory(color.hex);
        const closestName = getClosestColorName(color.hex);
        const fancyName = getCreativeName(category);
        
        el.detailName.textContent = closestName;
        el.detailFancy.textContent = fancyName;
        
        // Values
        const { r, g, b } = color.rgb;
        const hsl = color.hsl;
        const cmyk = rgbToCmyk(r, g, b);
        
        el.valHex.textContent = color.hex.toUpperCase();
        el.valRgb.textContent = `${r}, ${g}, ${b}`;
        el.valHsl.textContent = `${hsl.h}°, ${hsl.s}%, ${hsl.l}%`;
        el.valCmyk.textContent = `${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%`;
        
        // Psychology
        const psych = COLOR_PSYCHOLOGY[category] || COLOR_PSYCHOLOGY.gray;
        el.psychologyTags.innerHTML = psych.tags.map(tag => 
            `<span class="psychology-tag">${tag}</span>`
        ).join('');
        el.usageText.textContent = psych.usage;
        
        // Industries
        el.industryTags.innerHTML = psych.industries.map(ind => 
            `<span class="industry-tag">${ind}</span>`
        ).join('');
    }

    function updateAllTabs() {
        updateMoodMeters();
        updateAccessibility();
        updateHarmony();
        updateShades();
        generateExport(state.currentFormat);
    }

    // ============================================================
    // MOOD ANALYSIS
    // ============================================================
    function updateMoodMeters() {
        if (state.colors.length === 0) return;
        
        let warmth = 0, energy = 0, formality = 0;
        
        state.colors.forEach(color => {
            const hsl = color.hsl;
            const weight = color.percent / 100;
            
            // Warmth: red/orange/yellow vs blue/green/purple
            if (hsl.h < 60 || hsl.h > 300) warmth += weight;
            else warmth -= weight;
            
            // Energy: higher saturation = more energy
            energy += (hsl.s / 100) * weight;
            
            // Formality: lower saturation + darker = more formal
            formality += ((100 - hsl.s) / 100 * (100 - hsl.l) / 100) * weight;
        });
        
        const warmthPct = Math.max(0, Math.min(100, (warmth + 1) * 50));
        const energyPct = Math.max(0, Math.min(100, energy * 100));
        const casualPct = Math.max(0, Math.min(100, (1 - formality) * 100));
        
        el.moodWarm.style.width = warmthPct + '%';
        el.moodEnergy.style.width = energyPct + '%';
        el.moodCasual.style.width = casualPct + '%';
    }

    // ============================================================
    // ACCESSIBILITY (WCAG)
    // ============================================================
    function updateAccessibility() {
        if (state.colors.length < 2) return;
        
        const pairs = [];
        let pass = 0, warning = 0, fail = 0;
        
        for (let i = 0; i < state.colors.length; i++) {
            for (let j = i + 1; j < state.colors.length; j++) {
                const ratio = getContrastRatio(state.colors[i].hex, state.colors[j].hex);
                const grade = getWcagGrade(ratio);
                
                pairs.push({
                    color1: state.colors[i].hex,
                    color2: state.colors[j].hex,
                    ratio: ratio.toFixed(2),
                    grade
                });
                
                if (ratio >= 7) pass++;
                else if (ratio >= 4.5) warning++;
                else fail++;
            }
        }
        
        // Score calculation
        const total = pairs.length || 1;
        const score = ((pass * 10 + warning * 5) / (total * 10) * 10).toFixed(1);
        
        el.a11yScore.textContent = score;
        el.a11yPass.textContent = pass;
        el.a11yWarning.textContent = warning;
        el.a11yFail.textContent = fail;
        
        // Render grid
        el.contrastGrid.innerHTML = pairs.slice(0, 15).map(pair => {
            const gradeClass = pair.grade.includes('AAA') ? 'pass' : 
                               pair.grade.includes('AA') ? 'warning' : 'fail';
            return `
                <div class="contrast-pair ${gradeClass}">
                    <div class="contrast-pair__colors">
                        <div class="contrast-pair__swatch" style="background: ${pair.color1}"></div>
                        <div class="contrast-pair__swatch" style="background: ${pair.color2}"></div>
                    </div>
                    <div class="contrast-pair__ratio">${pair.ratio}:1</div>
                    <div class="contrast-pair__grade">${pair.grade}</div>
                </div>
            `;
        }).join('');
        
        renderColorblindPreview('normal');
    }

    function getContrastRatio(hex1, hex2) {
        const lum1 = getLuminance(hexToRgb(hex1));
        const lum2 = getLuminance(hexToRgb(hex2));
        const lighter = Math.max(lum1, lum2);
        const darker = Math.min(lum1, lum2);
        return (lighter + 0.05) / (darker + 0.05);
    }

    function getLuminance(rgb) {
        const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    function getWcagGrade(ratio) {
        if (ratio >= 7) return 'AAA';
        if (ratio >= 4.5) return 'AA';
        if (ratio >= 3) return 'AA Large';
        return 'Fail';
    }

    function renderColorblindPreview(mode) {
        el.colorblindPreview.innerHTML = state.colors.map(color => {
            const simulated = simulateColorBlindness(color.hex, mode);
            return `<div class="cb-color" style="background: ${simulated}" title="${color.hex} → ${simulated}"></div>`;
        }).join('');
    }

    function simulateColorBlindness(hex, mode) {
        const rgb = hexToRgb(hex);
        let { r, g, b } = rgb;
        
        switch (mode) {
            case 'protanopia':
                r = 0.567 * r + 0.433 * g;
                g = 0.558 * r + 0.442 * g;
                b = 0.242 * g + 0.758 * b;
                break;
            case 'deuteranopia':
                r = 0.625 * r + 0.375 * g;
                g = 0.7 * r + 0.3 * g;
                b = 0.3 * g + 0.7 * b;
                break;
            case 'tritanopia':
                r = 0.95 * r + 0.05 * g;
                g = 0.433 * g + 0.567 * b;
                b = 0.475 * g + 0.525 * b;
                break;
            case 'achromatopsia':
                const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                r = g = b = gray;
                break;
        }
        
        return rgbToHex(
            Math.max(0, Math.min(255, Math.round(r))),
            Math.max(0, Math.min(255, Math.round(g))),
            Math.max(0, Math.min(255, Math.round(b)))
        );
    }

    // ============================================================
    // HARMONY
    // ============================================================
    function updateHarmony() {
        if (state.colors.length < 2) return;
        
        const hues = state.colors.map(c => c.hsl.h);
        const harmony = detectHarmonyType(hues);
        
        el.harmonyBadge.textContent = harmony.name;
        el.harmonyDesc.textContent = harmony.description;
        
        drawColorWheel();
        renderHarmonySuggestions();
        renderBrandMatches();
    }

    function detectHarmonyType(hues) {
        if (hues.length <= 1) {
            return { name: 'Single Color', description: 'Add more colors to analyze harmony.' };
        }
        
        // Calculate hue differences
        const sorted = [...hues].sort((a, b) => a - b);
        const diffs = [];
        for (let i = 1; i < sorted.length; i++) {
            diffs.push(sorted[i] - sorted[i - 1]);
        }
        diffs.push(360 - sorted[sorted.length - 1] + sorted[0]);
        
        const maxDiff = Math.max(...diffs);
        const minDiff = Math.min(...diffs.filter(d => d > 0));
        
        // Detect patterns
        if (maxDiff > 300 && minDiff < 30) {
            return { name: 'Monochromatic', description: 'Colors from a single hue. Creates elegant, cohesive designs.' };
        }
        
        if (diffs.some(d => Math.abs(d - 180) < 30)) {
            return { name: 'Complementary', description: 'Opposite colors on the wheel. High contrast, eye-catching.' };
        }
        
        if (hues.length === 3 && diffs.every(d => Math.abs(d - 120) < 35)) {
            return { name: 'Triadic', description: 'Three equally spaced colors. Vibrant and balanced.' };
        }
        
        if (diffs.every(d => d < 60)) {
            return { name: 'Analogous', description: 'Adjacent colors on the wheel. Harmonious and pleasing.' };
        }
        
        if (diffs.some(d => d > 120 && d < 180)) {
            return { name: 'Split Complementary', description: 'Base + two adjacent to complement. Balanced contrast.' };
        }
        
        return { name: 'Custom Palette', description: 'A unique combination that works well together.' };
    }

    function drawColorWheel() {
        const canvas = el.colorWheel;
        const ctx = canvas.getContext('2d');
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const radius = Math.min(cx, cy) - 15;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw wheel
        for (let angle = 0; angle < 360; angle++) {
            const start = (angle - 1) * Math.PI / 180;
            const end = (angle + 1) * Math.PI / 180;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, start, end);
            ctx.closePath();
            ctx.fillStyle = `hsl(${angle}, 70%, 50%)`;
            ctx.fill();
        }
        
        // White center
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw color markers
        state.colors.forEach(color => {
            const angle = (color.hsl.h - 90) * Math.PI / 180;
            const x = cx + Math.cos(angle) * radius * 0.65;
            const y = cy + Math.sin(angle) * radius * 0.65;
            
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fillStyle = color.hex;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        });
    }

    function renderHarmonySuggestions() {
        if (state.colors.length === 0) return;
        
        const baseHue = state.colors[0].hsl.h;
        
        const harmonies = [
            { name: 'Complementary', hues: [baseHue, (baseHue + 180) % 360] },
            { name: 'Triadic', hues: [baseHue, (baseHue + 120) % 360, (baseHue + 240) % 360] },
            { name: 'Analogous', hues: [(baseHue + 330) % 360, baseHue, (baseHue + 30) % 360] },
            { name: 'Split Comp.', hues: [baseHue, (baseHue + 150) % 360, (baseHue + 210) % 360] }
        ];
        
        el.harmonySuggestions.innerHTML = harmonies.map(h => `
            <div class="harmony-card" data-hues="${h.hues.join(',')}">
                <div class="harmony-card__title">${h.name}</div>
                <div class="harmony-card__colors">
                    ${h.hues.map(hue => `<span style="background: hsl(${hue}, 70%, 50%)"></span>`).join('')}
                </div>
            </div>
        `).join('');
        
        document.querySelectorAll('.harmony-card').forEach(card => {
            card.addEventListener('click', () => {
                const hues = card.dataset.hues.split(',').map(Number);
                applyHarmony(hues);
            });
        });
    }

    function applyHarmony(hues) {
        state.colors = hues.map((h, i) => {
            const hex = hslToHex(h, 70, 50);
            return {
                hex,
                rgb: hexToRgb(hex),
                hsl: { h, s: 70, l: 50 },
                percent: 100 / hues.length
            };
        });
        
        renderColors();
        updateAllTabs();
        switchTab('details');
        showToast('Harmony applied!');
    }

    function renderBrandMatches() {
        const matches = BRAND_PALETTES.map(brand => {
            let similarity = 0;
            state.colors.forEach(color => {
                brand.colors.forEach(bc => {
                    const dist = colorDistance(
                        Object.values(hexToRgb(color.hex)),
                        Object.values(hexToRgb(bc))
                    );
                    similarity += Math.max(0, 255 - dist);
                });
            });
            return { ...brand, similarity };
        }).sort((a, b) => b.similarity - a.similarity).slice(0, 4);
        
        el.brandMatches.innerHTML = matches.map(brand => `
            <div class="brand-card">
                <div class="brand-card__title">${brand.name}</div>
                <div class="brand-card__colors">
                    ${brand.colors.map(c => `<span style="background: ${c}"></span>`).join('')}
                </div>
            </div>
        `).join('');
    }

    // ============================================================
    // SHADES & GRADIENTS
    // ============================================================
    function updateShades() {
        if (state.colors.length === 0) return;
        updateColorSelects();
        generateShades(state.colors[0].hex);
        updateGradient();
    }

    function updateColorSelects() {
        const options = state.colors.map(c => 
            `<option value="${c.hex}">${c.hex.toUpperCase()}</option>`
        ).join('');
        
        el.shadeColorSelect.innerHTML = options;
        el.gradientFrom.innerHTML = options;
        el.gradientTo.innerHTML = state.colors.length > 1 ? 
            state.colors.slice(1).map(c => `<option value="${c.hex}">${c.hex.toUpperCase()}</option>`).join('') 
            : options;
    }

    function generateShades(hex) {
        const rgb = hexToRgb(hex);
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        
        // Generate 5 tints (lighter)
        const tints = [];
        for (let i = 5; i >= 1; i--) {
            const l = Math.min(98, hsl.l + (i * 8));
            tints.push(hslToHex(hsl.h, hsl.s, l));
        }
        
        // Generate 5 shades (darker)
        const shades = [];
        for (let i = 1; i <= 5; i++) {
            const l = Math.max(5, hsl.l - (i * 10));
            shades.push(hslToHex(hsl.h, hsl.s, l));
        }
        
        el.tintsRow.innerHTML = tints.map(c => `
            <div class="shade-item" data-color="${c}">
                <div class="shade-swatch" style="background: ${c}"></div>
                <div class="shade-hex">${c.toUpperCase()}</div>
            </div>
        `).join('');
        
        el.baseRow.innerHTML = `
            <div class="shade-item" data-color="${hex}">
                <div class="shade-swatch" style="background: ${hex}"></div>
                <div class="shade-hex">${hex.toUpperCase()}</div>
            </div>
        `;
        
        el.shadesRow.innerHTML = shades.map(c => `
            <div class="shade-item" data-color="${c}">
                <div class="shade-swatch" style="background: ${c}"></div>
                <div class="shade-hex">${c.toUpperCase()}</div>
            </div>
        `).join('');
        
        // Add click handlers
        document.querySelectorAll('.shade-item').forEach(item => {
            item.addEventListener('click', () => {
                copyToClipboard(item.dataset.color);
            });
        });
    }

    function updateGradient() {
        const from = el.gradientFrom.value;
        const to = el.gradientTo.value;
        const direction = el.gradientDirection.value;
        
        let gradient;
        if (direction === 'radial') {
            gradient = `radial-gradient(circle, ${from}, ${to})`;
        } else {
            gradient = `linear-gradient(${direction}, ${from}, ${to})`;
        }
        
        el.gradientPreview.style.background = gradient;
        el.gradientCode.textContent = `background: ${gradient};`;
    }

    // ============================================================
    // EXPORT
    // ============================================================
    function generateExport(format) {
        if (state.colors.length === 0) {
            el.exportCode.textContent = '// Upload an image to extract colors';
            return;
        }
        
        let code = '';
        
        switch (format) {
            case 'css':
                code = `:root {\n${state.colors.map((c, i) => 
                    `  --color-${i + 1}: ${c.hex};`
                ).join('\n')}\n}`;
                break;
                
            case 'scss':
                code = `// Color Palette Variables\n${state.colors.map((c, i) => 
                    `$color-${i + 1}: ${c.hex};`
                ).join('\n')}\n\n// As a map\n$palette: (\n${state.colors.map((c, i) => 
                    `  'color-${i + 1}': ${c.hex}`
                ).join(',\n')}\n);`;
                break;
                
            case 'tailwind':
                code = `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${state.colors.map((c, i) => 
                    `        'brand-${i + 1}': '${c.hex}'`
                ).join(',\n')}\n      }\n    }\n  }\n}`;
                break;
                
            case 'json':
                code = JSON.stringify({
                    name: 'Extracted Palette',
                    colors: state.colors.map((c, i) => ({
                        id: `color-${i + 1}`,
                        hex: c.hex,
                        rgb: `rgb(${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b})`,
                        hsl: `hsl(${c.hsl.h}, ${c.hsl.s}%, ${c.hsl.l}%)`,
                        percentage: c.percent.toFixed(2) + '%'
                    }))
                }, null, 2);
                break;
        }
        
        el.exportCode.textContent = code;
    }

    function downloadExportFile() {
        const code = el.exportCode.textContent;
        const extensions = { css: 'css', scss: 'scss', tailwind: 'js', json: 'json' };
        const ext = extensions[state.currentFormat] || 'txt';
        
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `palette.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
        
        showToast('File downloaded!');
    }

    function downloadPalettePng() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const swatchW = 100;
        const swatchH = 120;
        const padding = 20;
        
        canvas.width = state.colors.length * swatchW + padding * 2;
        canvas.height = swatchH + padding * 2;
        
        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Swatches
        state.colors.forEach((color, i) => {
            const x = padding + i * swatchW;
            const y = padding;
            
            ctx.fillStyle = color.hex;
            ctx.fillRect(x, y, swatchW - 8, 80);
            
            ctx.fillStyle = '#333';
            ctx.font = 'bold 11px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(color.hex.toUpperCase(), x + (swatchW - 8) / 2, y + 100);
        });
        
        const link = document.createElement('a');
        link.download = 'color-palette.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        showToast('PNG downloaded!');
    }

    function generateShareLink() {
        const colors = state.colors.map(c => c.hex.replace('#', '')).join(',');
        const url = `${window.location.origin}${window.location.pathname}?colors=${colors}`;
        el.shareUrl.value = url;
        showToast('Share link generated!');
    }

    // ============================================================
    // UTILITY FUNCTIONS
    // ============================================================
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    function rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = Math.max(0, Math.min(255, x)).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
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
        
        return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
    }

    function hslToHex(h, s, l) {
        s /= 100; l /= 100;
        const a = s * Math.min(l, 1 - l);
        const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    }

    function rgbToCmyk(r, g, b) {
        let c = 1 - (r / 255);
        let m = 1 - (g / 255);
        let y = 1 - (b / 255);
        let k = Math.min(c, m, y);
        
        if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
        
        c = Math.round((c - k) / (1 - k) * 100);
        m = Math.round((m - k) / (1 - k) * 100);
        y = Math.round((y - k) / (1 - k) * 100);
        k = Math.round(k * 100);
        
        return { c, m, y, k };
    }

    function getColorCategory(hex) {
        const hsl = rgbToHsl(...Object.values(hexToRgb(hex)));
        const { h, s, l } = hsl;
        
        if (l < 15) return 'black';
        if (l > 90) return 'white';
        if (s < 10) return 'gray';
        
        if (h < 15 || h >= 345) return 'red';
        if (h < 45) return 'orange';
        if (h < 70) return 'yellow';
        if (h < 165) return 'green';
        if (h < 195) return 'cyan';
        if (h < 265) return 'blue';
        if (h < 295) return 'purple';
        return 'pink';
    }

    function getClosestColorName(hex) {
        const rgb = hexToRgb(hex);
        let closestName = 'Custom';
        let minDist = Infinity;
        
        for (const [nameHex, name] of Object.entries(COLOR_NAMES)) {
            const nameRgb = hexToRgb(nameHex);
            const dist = colorDistance([rgb.r, rgb.g, rgb.b], [nameRgb.r, nameRgb.g, nameRgb.b]);
            if (dist < minDist) {
                minDist = dist;
                closestName = name;
            }
        }
        
        return closestName;
    }

    function getCreativeName(category) {
        const names = CREATIVE_NAMES[category] || CREATIVE_NAMES.gray;
        return names[Math.floor(Math.random() * names.length)];
    }

    function switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabName}`);
        });
    }

    function showAnalysis() {
        el.pageUpload.classList.remove('active');
        el.pageAnalysis.classList.add('active');
    }

    function resetTool() {
        state.image = null;
        state.colors = [];
        state.selectedColor = null;
        state.selectedIndex = 0;
        el.fileInput.value = '';
        el.urlInput.value = '';
        el.pageAnalysis.classList.remove('active');
        el.pageUpload.classList.add('active');
    }

    function copyColorValue(format) {
        if (!state.selectedColor) return;
        
        let value;
        const c = state.selectedColor;
        
        switch (format) {
            case 'hex': value = c.hex; break;
            case 'rgb': value = `rgb(${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b})`; break;
            case 'hsl': value = `hsl(${c.hsl.h}, ${c.hsl.s}%, ${c.hsl.l}%)`; break;
            case 'cmyk':
                const cmyk = rgbToCmyk(c.rgb.r, c.rgb.g, c.rgb.b);
                value = `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`;
                break;
        }
        
        copyToClipboard(value);
    }

    function copyAllColors() {
        const colors = state.colors.map(c => c.hex).join(', ');
        copyToClipboard(colors);
    }

    function copyToClipboard(text) {
        // Try modern clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                showToast('Copied: ' + (text.length > 30 ? text.substring(0, 30) + '...' : text));
            }).catch(() => {
                fallbackCopy(text);
            });
        } else {
            fallbackCopy(text);
        }
    }

    function fallbackCopy(text) {
        // Fallback for older browsers or non-HTTPS
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try {
            document.execCommand('copy');
            showToast('Copied: ' + (text.length > 30 ? text.substring(0, 30) + '...' : text));
        } catch (err) {
            showToast('Copy failed - try manually');
        }
        document.body.removeChild(textarea);
    }

    function showToast(message) {
        el.toastMessage.textContent = message;
        el.toast.classList.add('show');
        setTimeout(() => el.toast.classList.remove('show'), 2500);
    }

    // Initialize
    init();
})();

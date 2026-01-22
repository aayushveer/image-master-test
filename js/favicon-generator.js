/**
 * FAVICON-GENERATOR.JS - Favicon Generator Tool
 * High-quality multi-platform favicon/app icon generation
 * NO QUALITY LOSS - Uses high-quality canvas rendering
 * Production-Level Code with Full Error Handling
 */

(function() {
    'use strict';

    // =====================================================
    // ICON CONFIGURATIONS - All platforms and sizes
    // =====================================================
    
    const ICON_CONFIGS = {
        web: {
            name: 'Web (Browsers)',
            emoji: '🌐',
            sizes: [
                { size: 16, format: 'ico', name: 'favicon-16x16' },
                { size: 32, format: 'ico', name: 'favicon-32x32' },
                { size: 48, format: 'ico', name: 'favicon-48x48' },
                { size: 64, format: 'ico', name: 'favicon-64x64' },
                { size: 16, format: 'png', name: 'favicon-16x16' },
                { size: 32, format: 'png', name: 'favicon-32x32' },
                { size: 48, format: 'png', name: 'favicon-48x48' },
                { size: 96, format: 'png', name: 'favicon-96x96' },
                { size: 128, format: 'png', name: 'favicon-128x128' },
                { size: 192, format: 'png', name: 'favicon-192x192' },
                { size: 256, format: 'png', name: 'favicon-256x256' }
            ]
        },
        apple: {
            name: 'Apple iOS',
            emoji: '🍎',
            sizes: [
                { size: 57, format: 'png', name: 'apple-touch-icon-57x57' },
                { size: 60, format: 'png', name: 'apple-touch-icon-60x60' },
                { size: 72, format: 'png', name: 'apple-touch-icon-72x72' },
                { size: 76, format: 'png', name: 'apple-touch-icon-76x76' },
                { size: 114, format: 'png', name: 'apple-touch-icon-114x114' },
                { size: 120, format: 'png', name: 'apple-touch-icon-120x120' },
                { size: 144, format: 'png', name: 'apple-touch-icon-144x144' },
                { size: 152, format: 'png', name: 'apple-touch-icon-152x152' },
                { size: 167, format: 'png', name: 'apple-touch-icon-167x167' },
                { size: 180, format: 'png', name: 'apple-touch-icon-180x180' },
                { size: 1024, format: 'png', name: 'apple-touch-icon-1024x1024' }
            ]
        },
        android: {
            name: 'Android',
            emoji: '🤖',
            sizes: [
                { size: 36, format: 'png', name: 'android-icon-36x36' },
                { size: 48, format: 'png', name: 'android-icon-48x48' },
                { size: 72, format: 'png', name: 'android-icon-72x72' },
                { size: 96, format: 'png', name: 'android-icon-96x96' },
                { size: 144, format: 'png', name: 'android-icon-144x144' },
                { size: 192, format: 'png', name: 'android-icon-192x192' },
                { size: 384, format: 'png', name: 'android-icon-384x384' },
                { size: 512, format: 'png', name: 'android-icon-512x512' }
            ]
        },
        windows: {
            name: 'Windows',
            emoji: '🪟',
            sizes: [
                { size: 70, format: 'png', name: 'ms-icon-70x70' },
                { size: 144, format: 'png', name: 'ms-icon-144x144' },
                { size: 150, format: 'png', name: 'ms-icon-150x150' },
                { size: 310, format: 'png', name: 'ms-icon-310x310' }
            ]
        }
    };

    const BASIC_SIZES = {
        web: [{ size: 16, format: 'ico', name: 'favicon' }, { size: 32, format: 'ico', name: 'favicon-32x32' }],
        apple: [{ size: 180, format: 'png', name: 'apple-touch-icon' }],
        android: [{ size: 192, format: 'png', name: 'android-icon-192x192' }],
        windows: [{ size: 144, format: 'png', name: 'ms-icon-144x144' }]
    };

    // =====================================================
    // STATE
    // =====================================================
    
    let sourceImage = null;
    let sourceImageDataURL = null;
    let sourceFileSize = 0;
    let generatedIcons = [];
    let generationStartTime = 0;

    // =====================================================
    // HELPER
    // =====================================================
    
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // =====================================================
    // DOM ELEMENTS - CORRECT IDs matching HTML
    // =====================================================
    
    let elements = {};

    function cacheElements() {
        elements = {
            // File input
            fileInput: $('#file-input'),
            dropzone: $('#dropzone') || $('.dropzone'),
            
            // Pages
            pageUpload: $('#page-upload'),
            pageOptions: $('#page-options'),
            pageResults: $('#page-results'),
            
            // Preview (Options page)
            previewImage: $('#preview-image'),
            infoDimensions: $('#info-dimensions'),
            infoSize: $('#info-size'),
            btnChangeImage: $('#btn-change-image'),
            
            // Platform checkboxes
            platformCheckboxes: $$('.platform-checkbox'),
            
            // Options
            btnGenerate: $('#btn-generate'),
            optMaintainRatio: $('#opt-maintain-ratio'),
            optTransparentBg: $('#opt-transparent-bg'),
            optIncludeHtml: $('#opt-include-html'),
            
            // Processing
            processing: $('#processing'),
            processingText: $('#processing-text'),
            progressBar: $('#progress-bar'),
            processingCount: $('#processing-count'),
            
            // Results
            iconsSections: $('#icons-sections'),
            totalIcons: $('#total-icons'),
            generationTime: $('#generation-time'),
            btnDownloadAll: $('#btn-download-all'),
            btnNew: $('#btn-new'),
            htmlCodeSection: $('#html-code-section'),
            htmlCode: $('#html-code'),
            btnCopyHtml: $('#btn-copy-html'),
            
            // Toast
            toast: $('#toast'),
            toastText: $('#toast-text')
        };
    }

    // =====================================================
    // INITIALIZATION
    // =====================================================
    
    function init() {
        console.log('[Favicon Generator] Initializing...');
        
        cacheElements();
        
        if (!elements.fileInput) {
            console.error('[Favicon Generator] Critical: file-input not found!');
            return;
        }
        
        setupEventListeners();
        showPage('upload');
        
        console.log('[Favicon Generator] Ready!');
    }

    function setupEventListeners() {
        // File input change
        elements.fileInput.addEventListener('change', handleFileSelect);
        
        // Dropzone events
        const dropzone = elements.dropzone;
        if (dropzone) {
            // Click to upload
            dropzone.addEventListener('click', (e) => {
                // Don't trigger if clicking on file input itself
                if (e.target !== elements.fileInput) {
                    elements.fileInput.click();
                }
            });
            
            // Drag and drop
            dropzone.addEventListener('dragover', handleDragOver);
            dropzone.addEventListener('dragleave', handleDragLeave);
            dropzone.addEventListener('drop', handleDrop);
        }
        
        // Platform checkboxes - toggle on click
        elements.platformCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('click', (e) => {
                // Don't trigger twice if clicking on the input itself
                if (e.target.tagName !== 'INPUT') {
                    checkbox.classList.toggle('checked');
                    const input = checkbox.querySelector('input');
                    if (input) input.checked = checkbox.classList.contains('checked');
                }
            });
            
            // Also handle input change
            const input = checkbox.querySelector('input');
            if (input) {
                input.addEventListener('change', () => {
                    checkbox.classList.toggle('checked', input.checked);
                });
            }
        });
        
        // Generate button
        if (elements.btnGenerate) {
            elements.btnGenerate.addEventListener('click', generateIcons);
        }
        
        // Download all
        if (elements.btnDownloadAll) {
            elements.btnDownloadAll.addEventListener('click', downloadAll);
        }
        
        // Copy HTML code
        if (elements.btnCopyHtml) {
            elements.btnCopyHtml.addEventListener('click', copyHtmlCode);
        }
        
        // New image button
        if (elements.btnNew) {
            elements.btnNew.addEventListener('click', () => {
                showPage('upload');
            });
        }
        
        // Change image button
        if (elements.btnChangeImage) {
            elements.btnChangeImage.addEventListener('click', () => {
                elements.fileInput.click();
            });
        }
    }

    // =====================================================
    // FILE HANDLING
    // =====================================================
    
    function handleFileSelect(e) {
        console.log('[Favicon Generator] File selected');
        const file = e.target.files[0];
        if (file) {
            processFile(file);
        }
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        elements.dropzone.classList.add('dragover');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        elements.dropzone.classList.remove('dragover');
    }

    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        elements.dropzone.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                processFile(file);
            } else {
                showToast('Please drop an image file', 'error');
            }
        }
    }

    function processFile(file) {
        console.log('[Favicon Generator] Processing file:', file.name, file.type, file.size);
        
        // Validate file type
        const validTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'];
        if (!validTypes.includes(file.type)) {
            showToast('Please upload PNG, JPG, GIF, WebP or SVG', 'error');
            return;
        }
        
        // Check file size (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
            showToast('Image too large. Max 50MB allowed.', 'error');
            return;
        }
        
        sourceFileSize = file.size;
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            console.log('[Favicon Generator] File read complete');
            sourceImageDataURL = e.target.result;
            
            const img = new Image();
            
            img.onload = () => {
                console.log('[Favicon Generator] Image loaded:', img.naturalWidth, 'x', img.naturalHeight);
                sourceImage = img;
                
                // Update preview
                if (elements.previewImage) {
                    elements.previewImage.src = sourceImageDataURL;
                }
                
                if (elements.infoDimensions) {
                    elements.infoDimensions.textContent = `${img.naturalWidth} × ${img.naturalHeight}`;
                }
                
                if (elements.infoSize) {
                    elements.infoSize.textContent = formatBytes(sourceFileSize);
                }
                
                // Show options page
                showPage('options');
                showToast('Image loaded successfully!');
            };
            
            img.onerror = () => {
                console.error('[Favicon Generator] Failed to load image');
                showToast('Failed to load image. Try another file.', 'error');
            };
            
            img.src = sourceImageDataURL;
        };
        
        reader.onerror = () => {
            console.error('[Favicon Generator] FileReader error');
            showToast('Failed to read file. Try again.', 'error');
        };
        
        reader.readAsDataURL(file);
    }

    // =====================================================
    // PAGE NAVIGATION
    // =====================================================
    
    function showPage(pageName) {
        console.log('[Favicon Generator] Showing page:', pageName);
        
        // Hide all pages
        [elements.pageUpload, elements.pageOptions, elements.pageResults].forEach(page => {
            if (page) page.classList.remove('active');
        });
        
        // Show target page
        if (pageName === 'upload' && elements.pageUpload) {
            elements.pageUpload.classList.add('active');
            // Reset state
            sourceImage = null;
            sourceImageDataURL = null;
            generatedIcons = [];
            if (elements.fileInput) elements.fileInput.value = '';
        } else if (pageName === 'options' && elements.pageOptions) {
            elements.pageOptions.classList.add('active');
        } else if (pageName === 'results' && elements.pageResults) {
            elements.pageResults.classList.add('active');
        }
        
        // Scroll to top
        window.scrollTo(0, 0);
    }

    // =====================================================
    // ICON GENERATION - HIGH QUALITY
    // =====================================================
    
    async function generateIcons() {
        console.log('[Favicon Generator] Starting generation...');
        
        if (!sourceImage) {
            showToast('Please upload an image first', 'error');
            return;
        }
        
        // Get selected platforms
        const selectedPlatforms = [];
        elements.platformCheckboxes.forEach(checkbox => {
            const input = checkbox.querySelector('input');
            if (input && input.checked) {
                selectedPlatforms.push(input.value);
            }
        });
        
        console.log('[Favicon Generator] Selected platforms:', selectedPlatforms);
        
        if (selectedPlatforms.length === 0) {
            showToast('Please select at least one platform', 'error');
            return;
        }
        
        // Get options
        const quickOption = $('input[name="quick-option"]:checked');
        const useAllSizes = quickOption ? quickOption.value === 'all' : true;
        const maintainRatio = elements.optMaintainRatio ? elements.optMaintainRatio.checked : false;
        const preserveTransparency = elements.optTransparentBg ? elements.optTransparentBg.checked : true;
        const generateHtml = elements.optIncludeHtml ? elements.optIncludeHtml.checked : true;
        
        console.log('[Favicon Generator] Options:', { useAllSizes, maintainRatio, preserveTransparency, generateHtml });
        
        // Build icons list
        const iconsToGenerate = [];
        selectedPlatforms.forEach(platform => {
            const config = ICON_CONFIGS[platform];
            if (!config) return;
            
            const sizes = useAllSizes ? config.sizes : (BASIC_SIZES[platform] || config.sizes);
            sizes.forEach(sizeConfig => {
                iconsToGenerate.push({
                    ...sizeConfig,
                    platform: platform
                });
            });
        });
        
        console.log('[Favicon Generator] Icons to generate:', iconsToGenerate.length);
        
        // Show processing overlay
        if (elements.processing) {
            elements.processing.classList.add('active');
        }
        if (elements.progressBar) {
            elements.progressBar.style.width = '0%';
        }
        if (elements.processingCount) {
            elements.processingCount.textContent = `0 / ${iconsToGenerate.length}`;
        }
        if (elements.processingText) {
            elements.processingText.textContent = 'Generating favicons...';
        }
        
        generatedIcons = [];
        generationStartTime = Date.now();
        
        try {
            for (let i = 0; i < iconsToGenerate.length; i++) {
                const iconConfig = iconsToGenerate[i];
                
                // Generate icon
                const iconData = await generateSingleIcon(
                    iconConfig.size,
                    iconConfig.format,
                    maintainRatio,
                    preserveTransparency
                );
                
                generatedIcons.push({
                    ...iconConfig,
                    data: iconData
                });
                
                // Update progress
                const progress = ((i + 1) / iconsToGenerate.length) * 100;
                if (elements.progressBar) {
                    elements.progressBar.style.width = `${progress}%`;
                }
                if (elements.processingCount) {
                    elements.processingCount.textContent = `${i + 1} / ${iconsToGenerate.length}`;
                }
                
                // Small delay for UI update
                await new Promise(r => setTimeout(r, 5));
            }
            
            const generationTime = Date.now() - generationStartTime;
            console.log('[Favicon Generator] Generation complete:', generatedIcons.length, 'icons in', generationTime, 'ms');
            
            // Hide processing
            if (elements.processing) {
                elements.processing.classList.remove('active');
            }
            
            // Display results
            displayResults(selectedPlatforms, generateHtml, generationTime);
            showPage('results');
            
            showToast(`✨ Generated ${generatedIcons.length} icons!`);
            
        } catch (error) {
            console.error('[Favicon Generator] Generation error:', error);
            if (elements.processing) {
                elements.processing.classList.remove('active');
            }
            showToast('Generation failed. Please try again.', 'error');
        }
    }

    function generateSingleIcon(size, format, maintainRatio, preserveTransparency) {
        return new Promise((resolve, reject) => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = size;
                canvas.height = size;
                
                // HIGH QUALITY SETTINGS
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                
                // Background
                if (preserveTransparency) {
                    ctx.clearRect(0, 0, size, size);
                } else {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, size, size);
                }
                
                const sw = sourceImage.naturalWidth;
                const sh = sourceImage.naturalHeight;
                let dx = 0, dy = 0, dw = size, dh = size;
                
                if (maintainRatio && sw !== sh) {
                    const imgRatio = sw / sh;
                    
                    if (imgRatio > 1) {
                        // Landscape - fit width
                        dh = size / imgRatio;
                        dy = (size - dh) / 2;
                    } else {
                        // Portrait - fit height
                        dw = size * imgRatio;
                        dx = (size - dw) / 2;
                    }
                }
                
                // Draw image
                ctx.drawImage(sourceImage, 0, 0, sw, sh, dx, dy, dw, dh);
                
                if (format === 'ico') {
                    // Generate ICO format
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error('Failed to create blob'));
                            return;
                        }
                        blob.arrayBuffer().then(buffer => {
                            try {
                                const icoData = createICO([{ size, buffer: new Uint8Array(buffer) }]);
                                resolve(icoData);
                            } catch (e) {
                                reject(e);
                            }
                        }).catch(reject);
                    }, 'image/png', 1.0);
                } else {
                    // Generate PNG
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error('Failed to create blob'));
                            return;
                        }
                        resolve(blob);
                    }, 'image/png', 1.0);
                }
                
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Create ICO file from PNG data
     */
    function createICO(images) {
        const numImages = images.length;
        const headerSize = 6;
        const entrySize = 16;
        const dataOffset = headerSize + (entrySize * numImages);
        
        let totalDataSize = 0;
        images.forEach(img => totalDataSize += img.buffer.length);
        
        const totalSize = dataOffset + totalDataSize;
        const buffer = new ArrayBuffer(totalSize);
        const view = new DataView(buffer);
        const bytes = new Uint8Array(buffer);
        
        // ICO Header
        view.setUint16(0, 0, true);           // Reserved
        view.setUint16(2, 1, true);           // Type: 1 = ICO
        view.setUint16(4, numImages, true);   // Number of images
        
        let currentOffset = dataOffset;
        
        images.forEach((img, index) => {
            const entryOffset = headerSize + (index * entrySize);
            const size = img.size;
            
            view.setUint8(entryOffset + 0, size < 256 ? size : 0);
            view.setUint8(entryOffset + 1, size < 256 ? size : 0);
            view.setUint8(entryOffset + 2, 0);
            view.setUint8(entryOffset + 3, 0);
            view.setUint16(entryOffset + 4, 1, true);
            view.setUint16(entryOffset + 6, 32, true);
            view.setUint32(entryOffset + 8, img.buffer.length, true);
            view.setUint32(entryOffset + 12, currentOffset, true);
            
            bytes.set(img.buffer, currentOffset);
            currentOffset += img.buffer.length;
        });
        
        return new Blob([buffer], { type: 'image/x-icon' });
    }

    /**
     * Create multi-size ICO file
     */
    async function createMultiSizeICO(sizes = [16, 32, 48]) {
        const images = [];
        
        for (const size of sizes) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = size;
            canvas.height = size;
            
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(sourceImage, 0, 0, size, size);
            
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/png', 1.0);
            });
            
            const buffer = await blob.arrayBuffer();
            images.push({ size, buffer: new Uint8Array(buffer) });
        }
        
        return createICO(images);
    }

    // =====================================================
    // DISPLAY RESULTS
    // =====================================================
    
    function displayResults(selectedPlatforms, generateHtml, generationTime) {
        // Update stats
        if (elements.totalIcons) {
            elements.totalIcons.textContent = generatedIcons.length;
        }
        if (elements.generationTime) {
            elements.generationTime.textContent = generationTime;
        }
        
        // Group icons by platform
        const groupedIcons = {};
        generatedIcons.forEach(icon => {
            if (!groupedIcons[icon.platform]) {
                groupedIcons[icon.platform] = [];
            }
            groupedIcons[icon.platform].push(icon);
        });
        
        // Build icons grid HTML
        let gridHtml = '';
        
        selectedPlatforms.forEach(platform => {
            const config = ICON_CONFIGS[platform];
            if (!config) return;
            
            const icons = groupedIcons[platform] || [];
            
            gridHtml += `
                <div class="icon-section" data-platform="${platform}">
                    <div class="icon-section__header">
                        <h3 class="icon-section__title">
                            <span>${config.emoji}</span>
                            ${config.name}
                        </h3>
                        <span class="icon-section__count">${icons.length} icons</span>
                    </div>
                    <div class="icon-section__grid">
                        ${icons.map((icon, idx) => {
                            const url = URL.createObjectURL(icon.data);
                            return `
                                <div class="icon-item" data-platform="${platform}" data-index="${idx}" title="Click to download">
                                    <div class="icon-preview">
                                        <img src="${url}" alt="${icon.size}x${icon.size}">
                                    </div>
                                    <span class="icon-size">${icon.size}×${icon.size}</span>
                                    <span class="icon-format">${icon.format.toUpperCase()}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        });
        
        if (elements.iconsSections) {
            elements.iconsSections.innerHTML = gridHtml;
            
            // Add click handlers for individual downloads
            elements.iconsSections.querySelectorAll('.icon-item').forEach(item => {
                item.addEventListener('click', () => {
                    const platform = item.dataset.platform;
                    const index = parseInt(item.dataset.index);
                    const icons = groupedIcons[platform];
                    if (icons && icons[index]) {
                        downloadSingleIcon(icons[index]);
                    }
                });
            });
        }
        
        // Generate HTML code
        if (generateHtml && elements.htmlCode) {
            const htmlCode = generateHtmlCode(selectedPlatforms);
            elements.htmlCode.textContent = htmlCode;
            if (elements.htmlCodeSection) {
                elements.htmlCodeSection.style.display = 'block';
            }
        } else if (elements.htmlCodeSection) {
            elements.htmlCodeSection.style.display = 'none';
        }
    }

    function generateHtmlCode(selectedPlatforms) {
        let code = `<!-- Favicon and App Icons - Generated by Image Runner -->\n`;
        
        if (selectedPlatforms.includes('web')) {
            code += `\n<!-- Standard Favicon -->\n`;
            code += `<link rel="icon" type="image/x-icon" href="/favicon.ico">\n`;
            code += `<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">\n`;
            code += `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">\n`;
            code += `<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png">\n`;
            code += `<link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png">\n`;
        }
        
        if (selectedPlatforms.includes('apple')) {
            code += `\n<!-- Apple Touch Icons -->\n`;
            code += `<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n`;
            code += `<link rel="apple-touch-icon" sizes="57x57" href="/apple-touch-icon-57x57.png">\n`;
            code += `<link rel="apple-touch-icon" sizes="60x60" href="/apple-touch-icon-60x60.png">\n`;
            code += `<link rel="apple-touch-icon" sizes="72x72" href="/apple-touch-icon-72x72.png">\n`;
            code += `<link rel="apple-touch-icon" sizes="76x76" href="/apple-touch-icon-76x76.png">\n`;
            code += `<link rel="apple-touch-icon" sizes="114x114" href="/apple-touch-icon-114x114.png">\n`;
            code += `<link rel="apple-touch-icon" sizes="120x120" href="/apple-touch-icon-120x120.png">\n`;
            code += `<link rel="apple-touch-icon" sizes="144x144" href="/apple-touch-icon-144x144.png">\n`;
            code += `<link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152x152.png">\n`;
            code += `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-180x180.png">\n`;
        }
        
        if (selectedPlatforms.includes('android')) {
            code += `\n<!-- Android / Chrome -->\n`;
            code += `<link rel="manifest" href="/manifest.json">\n`;
            code += `<meta name="theme-color" content="#ffffff">\n`;
        }
        
        if (selectedPlatforms.includes('windows')) {
            code += `\n<!-- Windows Tiles -->\n`;
            code += `<meta name="msapplication-TileColor" content="#ffffff">\n`;
            code += `<meta name="msapplication-TileImage" content="/ms-icon-144x144.png">\n`;
            code += `<meta name="msapplication-config" content="/browserconfig.xml">\n`;
        }
        
        return code;
    }

    // =====================================================
    // DOWNLOAD FUNCTIONS
    // =====================================================
    
    function downloadSingleIcon(icon) {
        const url = URL.createObjectURL(icon.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${icon.name}.${icon.format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        
        showToast(`Downloaded ${icon.name}.${icon.format}`);
    }

    async function downloadAll() {
        if (generatedIcons.length === 0) {
            showToast('No icons to download', 'error');
            return;
        }
        
        // Check JSZip
        if (typeof JSZip === 'undefined') {
            showToast('ZIP library not loaded. Refresh and try again.', 'error');
            return;
        }
        
        // Show processing
        if (elements.processing) {
            elements.processing.classList.add('active');
        }
        if (elements.processingText) {
            elements.processingText.textContent = 'Creating ZIP file...';
        }
        if (elements.progressBar) {
            elements.progressBar.style.width = '0%';
        }
        if (elements.processingCount) {
            elements.processingCount.textContent = 'Packaging icons...';
        }
        
        try {
            const zip = new JSZip();
            
            // Group by platform
            const platforms = {};
            generatedIcons.forEach(icon => {
                if (!platforms[icon.platform]) {
                    platforms[icon.platform] = [];
                }
                platforms[icon.platform].push(icon);
            });
            
            // Add icons to ZIP
            let processed = 0;
            for (const [platform, icons] of Object.entries(platforms)) {
                const folder = zip.folder(platform);
                
                for (const icon of icons) {
                    const filename = `${icon.name}.${icon.format}`;
                    folder.file(filename, icon.data);
                    
                    processed++;
                    const progress = (processed / generatedIcons.length) * 100;
                    if (elements.progressBar) {
                        elements.progressBar.style.width = `${progress}%`;
                    }
                }
            }
            
            // Add multi-size favicon.ico to root
            if (elements.processingCount) {
                elements.processingCount.textContent = 'Creating favicon.ico...';
            }
            
            try {
                const multiIco = await createMultiSizeICO([16, 32, 48]);
                zip.file('favicon.ico', multiIco);
            } catch (e) {
                console.warn('Could not create multi-size ICO:', e);
            }
            
            // Add HTML code
            const htmlCode = elements.htmlCode ? elements.htmlCode.textContent : '';
            if (htmlCode) {
                zip.file('favicon-html-code.txt', htmlCode);
            }
            
            // Add manifest.json for Android
            if (platforms.android) {
                const manifest = {
                    name: 'App Name',
                    short_name: 'App',
                    icons: platforms.android.map(icon => ({
                        src: `/android/${icon.name}.png`,
                        sizes: `${icon.size}x${icon.size}`,
                        type: 'image/png',
                        purpose: 'any maskable'
                    })),
                    theme_color: '#ffffff',
                    background_color: '#ffffff',
                    display: 'standalone'
                };
                zip.file('manifest.json', JSON.stringify(manifest, null, 2));
            }
            
            // Add browserconfig.xml for Windows
            if (platforms.windows) {
                const browserconfig = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
    <msapplication>
        <tile>
            <square70x70logo src="/windows/ms-icon-70x70.png"/>
            <square150x150logo src="/windows/ms-icon-150x150.png"/>
            <square310x310logo src="/windows/ms-icon-310x310.png"/>
            <TileColor>#ffffff</TileColor>
        </tile>
    </msapplication>
</browserconfig>`;
                zip.file('browserconfig.xml', browserconfig);
            }
            
            // Generate ZIP
            if (elements.processingCount) {
                elements.processingCount.textContent = 'Compressing...';
            }
            
            const zipBlob = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            });
            
            // Download
            const url = URL.createObjectURL(zipBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'favicons-imagerunner.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            
            if (elements.processing) {
                elements.processing.classList.remove('active');
            }
            
            showToast(`✅ Downloaded ZIP with ${generatedIcons.length} icons!`);
            
        } catch (error) {
            console.error('[Favicon Generator] ZIP error:', error);
            if (elements.processing) {
                elements.processing.classList.remove('active');
            }
            showToast('Failed to create ZIP file', 'error');
        }
    }

    // =====================================================
    // COPY HTML CODE
    // =====================================================
    
    async function copyHtmlCode() {
        const code = elements.htmlCode ? elements.htmlCode.textContent : '';
        
        if (!code) {
            showToast('No code to copy', 'error');
            return;
        }
        
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(code);
                copySuccess();
            } else {
                fallbackCopy(code);
            }
        } catch (error) {
            fallbackCopy(code);
        }
    }

    function fallbackCopy(text) {
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            copySuccess();
        } catch (error) {
            showToast('Failed to copy', 'error');
        }
    }

    function copySuccess() {
        if (elements.btnCopyHtml) {
            elements.btnCopyHtml.textContent = 'Copied!';
            elements.btnCopyHtml.classList.add('copied');
            
            setTimeout(() => {
                elements.btnCopyHtml.textContent = 'Copy Code';
                elements.btnCopyHtml.classList.remove('copied');
            }, 2000);
        }
        showToast('HTML code copied!');
    }

    // =====================================================
    // TOAST NOTIFICATIONS
    // =====================================================
    
    function showToast(message, type = 'success') {
        if (!elements.toast) return;
        
        if (elements.toastText) {
            elements.toastText.textContent = message;
        }
        
        const svg = elements.toast.querySelector('svg');
        if (svg) {
            svg.style.color = type === 'success' ? '#2563eb' : '#ef4444';
            svg.innerHTML = type === 'success'
                ? '<path d="M20 6L9 17l-5-5"/>'
                : '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>';
        }
        
        elements.toast.classList.add('show');
        
        setTimeout(() => {
            elements.toast.classList.remove('show');
        }, 3000);
    }

    // =====================================================
    // START
    // =====================================================
    
    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();

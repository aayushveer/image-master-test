/**
 * FORMAT-CONVERTER.JS - Image Format Converter
 * Production-level client-side image format conversion
 * Supports: JPG, PNG, WEBP, GIF, BMP, ICO
 */

(function() {
    'use strict';

    // State
    const state = {
        images: [],
        converted: [],
        format: 'jpg',
        quality: 0.9
    };

    // DOM Elements
    const elements = {
        pageUpload: document.getElementById('page-upload'),
        pageConvert: document.getElementById('page-convert'),
        pageDownload: document.getElementById('page-download'),
        
        dropzone: document.getElementById('dropzone'),
        fileInput: document.getElementById('file-input'),
        fileInputMore: document.getElementById('file-input-more'),
        
        imageCount: document.getElementById('image-count'),
        imageGrid: document.getElementById('image-grid'),
        
        formatBtns: document.querySelectorAll('.format-btn'),
        qualitySection: document.getElementById('quality-section'),
        qualitySlider: document.getElementById('quality-slider'),
        qualityValue: document.getElementById('quality-value'),
        transparencyNote: document.getElementById('transparency-note'),
        
        btnConvert: document.getElementById('btn-convert'),
        btnDownloadAll: document.getElementById('btn-download-all'),
        btnConvertMore: document.getElementById('btn-convert-more'),
        
        downloadInfo: document.getElementById('download-info'),
        convertedGrid: document.getElementById('converted-grid'),
        
        processing: document.getElementById('processing'),
        processingText: document.getElementById('processing-text'),
        processingCount: document.getElementById('processing-count'),
        progressBar: document.getElementById('progress-bar')
    };

    // Format configurations
    const formatConfig = {
        jpg: { mime: 'image/jpeg', ext: 'jpg', supportsQuality: true, supportsTransparency: false },
        png: { mime: 'image/png', ext: 'png', supportsQuality: false, supportsTransparency: true },
        webp: { mime: 'image/webp', ext: 'webp', supportsQuality: true, supportsTransparency: true },
        gif: { mime: 'image/gif', ext: 'gif', supportsQuality: false, supportsTransparency: true },
        bmp: { mime: 'image/bmp', ext: 'bmp', supportsQuality: false, supportsTransparency: false },
        ico: { mime: 'image/x-icon', ext: 'ico', supportsQuality: false, supportsTransparency: true }
    };

    // Initialize
    function init() {
        setupEventListeners();
        setupDragAndDrop();
    }

    // Event Listeners
    function setupEventListeners() {
        // File inputs
        elements.fileInput.addEventListener('change', handleFileSelect);
        elements.fileInputMore.addEventListener('change', handleFileSelect);
        
        // Format buttons
        elements.formatBtns.forEach(btn => {
            btn.addEventListener('click', () => selectFormat(btn.dataset.format));
        });
        
        // Quality slider
        elements.qualitySlider.addEventListener('input', (e) => {
            state.quality = e.target.value / 100;
            elements.qualityValue.textContent = e.target.value + '%';
        });
        
        // Action buttons
        elements.btnConvert.addEventListener('click', convertImages);
        elements.btnDownloadAll.addEventListener('click', downloadAll);
        elements.btnConvertMore.addEventListener('click', resetToUpload);
    }

    // Drag & Drop
    function setupDragAndDrop() {
        const dropzone = elements.dropzone;
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => dropzone.classList.add('dragover'), false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => dropzone.classList.remove('dragover'), false);
        });
        
        dropzone.addEventListener('drop', handleDrop, false);
    }

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function handleDrop(e) {
        const files = e.dataTransfer.files;
        if (files.length) {
            processFiles(Array.from(files));
        }
    }

    // File handling
    function handleFileSelect(e) {
        const files = Array.from(e.target.files);
        if (files.length) {
            processFiles(files);
        }
        e.target.value = '';
    }

    function processFiles(files) {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            alert('Please select valid image files.');
            return;
        }
        
        imageFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    state.images.push({
                        id: Date.now() + Math.random(),
                        name: file.name,
                        file: file,
                        dataUrl: e.target.result,
                        width: img.width,
                        height: img.height,
                        size: file.size
                    });
                    renderImageGrid();
                    showPage('convert');
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // Render image grid
    function renderImageGrid() {
        elements.imageCount.textContent = state.images.length;
        elements.imageGrid.innerHTML = state.images.map((img, index) => `
            <div class="image-card" data-index="${index}">
                <img src="${img.dataUrl}" alt="${img.name}">
                <div class="image-card__info">
                    <div class="image-card__name">${truncateName(img.name)}</div>
                    <div class="image-card__meta">${img.width}×${img.height} • ${formatSize(img.size)}</div>
                </div>
                <button class="image-card__remove" onclick="removeImage(${index})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
        `).join('');
    }

    // Remove image
    window.removeImage = function(index) {
        state.images.splice(index, 1);
        if (state.images.length === 0) {
            showPage('upload');
        } else {
            renderImageGrid();
        }
    };

    // Format selection
    function selectFormat(format) {
        state.format = format;
        
        elements.formatBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.format === format);
        });
        
        const config = formatConfig[format];
        
        // Show/hide quality slider
        if (config.supportsQuality) {
            elements.qualitySection.style.display = 'block';
        } else {
            elements.qualitySection.style.display = 'none';
        }
        
        // Show/hide transparency note
        if (!config.supportsTransparency) {
            elements.transparencyNote.classList.remove('hidden');
        } else {
            elements.transparencyNote.classList.add('hidden');
        }
    }

    // Convert images
    async function convertImages() {
        if (state.images.length === 0) return;
        
        showProcessing(true);
        state.converted = [];
        
        const config = formatConfig[state.format];
        const total = state.images.length;
        
        for (let i = 0; i < total; i++) {
            const img = state.images[i];
            
            updateProgress(i + 1, total, `Converting ${truncateName(img.name)}...`);
            
            try {
                const converted = await convertImage(img, config);
                state.converted.push(converted);
            } catch (err) {
                state.converted.push({
                    name: getNewFileName(img.name, config.ext),
                    blob: null,
                    error: true,
                    original: img
                });
            }
            
            await delay(50);
        }
        
        showProcessing(false);
        renderDownloadPage();
        showPage('download');
    }

    // Convert single image
    function convertImage(imgData, config) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // For ICO, limit size to 256x256
                    let width = img.width;
                    let height = img.height;
                    
                    if (config.ext === 'ico') {
                        const maxSize = 256;
                        if (width > maxSize || height > maxSize) {
                            const ratio = Math.min(maxSize / width, maxSize / height);
                            width = Math.round(width * ratio);
                            height = Math.round(height * ratio);
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    // Fill background for non-transparent formats
                    if (!config.supportsTransparency) {
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, width, height);
                    }
                    
                    // Use high quality image rendering
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Handle different formats
                    if (config.ext === 'ico') {
                        // ICO format - use PNG as base
                        canvas.toBlob((blob) => {
                            if (blob) {
                                resolve({
                                    name: getNewFileName(imgData.name, 'ico'),
                                    blob: blob,
                                    dataUrl: canvas.toDataURL('image/png'),
                                    size: blob.size,
                                    width: width,
                                    height: height
                                });
                            } else {
                                reject(new Error('Conversion failed'));
                            }
                        }, 'image/png');
                    } else if (config.supportsQuality) {
                        canvas.toBlob((blob) => {
                            if (blob) {
                                resolve({
                                    name: getNewFileName(imgData.name, config.ext),
                                    blob: blob,
                                    dataUrl: canvas.toDataURL(config.mime, state.quality),
                                    size: blob.size,
                                    width: width,
                                    height: height
                                });
                            } else {
                                reject(new Error('Conversion failed'));
                            }
                        }, config.mime, state.quality);
                    } else {
                        canvas.toBlob((blob) => {
                            if (blob) {
                                resolve({
                                    name: getNewFileName(imgData.name, config.ext),
                                    blob: blob,
                                    dataUrl: canvas.toDataURL(config.mime),
                                    size: blob.size,
                                    width: width,
                                    height: height
                                });
                            } else {
                                reject(new Error('Conversion failed'));
                            }
                        }, config.mime);
                    }
                } catch (err) {
                    reject(err);
                }
            };
            img.onerror = reject;
            img.src = imgData.dataUrl;
        });
    }

    // Render download page
    function renderDownloadPage() {
        const successful = state.converted.filter(c => !c.error);
        const format = state.format.toUpperCase();
        
        elements.downloadInfo.textContent = `${successful.length} image${successful.length !== 1 ? 's' : ''} converted to ${format}`;
        
        elements.convertedGrid.innerHTML = successful.map((item, index) => `
            <div class="converted-item">
                <img src="${item.dataUrl}" alt="${item.name}">
                <button class="converted-item__download" onclick="downloadSingle(${index})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                </button>
            </div>
        `).join('');
    }

    // Download single image
    window.downloadSingle = function(index) {
        const item = state.converted.filter(c => !c.error)[index];
        if (!item || !item.blob) return;
        
        const url = URL.createObjectURL(item.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.name;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Download all as ZIP
    async function downloadAll() {
        const successful = state.converted.filter(c => !c.error);
        
        if (successful.length === 0) {
            alert('No images to download.');
            return;
        }
        
        if (successful.length === 1) {
            downloadSingle(0);
            return;
        }
        
        // Check if JSZip is available, if not load it
        if (typeof JSZip === 'undefined') {
            showProcessing(true);
            updateProgress(0, 1, 'Loading ZIP library...');
            
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
            
            showProcessing(false);
        }
        
        showProcessing(true);
        updateProgress(0, successful.length, 'Creating ZIP file...');
        
        const zip = new JSZip();
        
        successful.forEach((item, index) => {
            zip.file(item.name, item.blob);
            updateProgress(index + 1, successful.length, 'Adding files to ZIP...');
        });
        
        updateProgress(successful.length, successful.length, 'Generating ZIP file...');
        
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `converted-images-${state.format}.zip`;
        a.click();
        URL.revokeObjectURL(url);
        
        showProcessing(false);
    }

    // Load external script
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Reset to upload
    function resetToUpload() {
        state.images = [];
        state.converted = [];
        elements.imageGrid.innerHTML = '';
        elements.convertedGrid.innerHTML = '';
        showPage('upload');
    }

    // Page navigation
    function showPage(page) {
        elements.pageUpload.classList.remove('active');
        elements.pageConvert.classList.remove('active');
        elements.pageDownload.classList.remove('active');
        
        switch(page) {
            case 'upload':
                elements.pageUpload.classList.add('active');
                break;
            case 'convert':
                elements.pageConvert.classList.add('active');
                break;
            case 'download':
                elements.pageDownload.classList.add('active');
                break;
        }
    }

    // Processing overlay
    function showProcessing(show) {
        elements.processing.classList.toggle('active', show);
    }

    function updateProgress(current, total, text) {
        const percent = (current / total) * 100;
        elements.progressBar.style.width = percent + '%';
        elements.processingCount.textContent = `${current} / ${total}`;
        if (text) elements.processingText.textContent = text;
    }

    // Utility functions
    function getNewFileName(originalName, newExt) {
        const baseName = originalName.replace(/\.[^/.]+$/, '');
        return `${baseName}.${newExt}`;
    }

    function truncateName(name, maxLength = 20) {
        if (name.length <= maxLength) return name;
        const ext = name.split('.').pop();
        const base = name.substring(0, name.lastIndexOf('.'));
        const truncatedBase = base.substring(0, maxLength - ext.length - 4) + '...';
        return truncatedBase + '.' + ext;
    }

    function formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();


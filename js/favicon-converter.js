/**
 * FAVICON-CONVERTER.JS - Favicon ICO Generator
 * 100% Client-side favicon.ico creation
 * Generates multi-size ICO files from any image
 */

'use strict';

(function() {
    // Favicon sizes to generate
    const SIZES = [16, 32, 48, 64, 128];
    
    // State
    const state = {
        sourceImage: null,
        canvases: {},
        bgColor: 'transparent'
    };

    // DOM Elements
    const el = {
        stepUpload: document.getElementById('step-upload'),
        stepPreview: document.getElementById('step-preview'),
        
        dropzone: document.getElementById('dropzone'),
        fileInput: document.getElementById('file-input'),
        
        sourceImage: document.getElementById('source-image'),
        imageInfo: document.getElementById('image-info'),
        
        bgBtns: document.querySelectorAll('.bg-btn[data-bg]'),
        customBg: document.getElementById('custom-bg'),
        
        btnDownloadIco: document.getElementById('btn-download-ico'),
        btnDownload16: document.getElementById('btn-download-16'),
        btnDownload32: document.getElementById('btn-download-32'),
        btnDownloadAll: document.getElementById('btn-download-all'),
        btnReset: document.getElementById('btn-reset')
    };

    // Initialize
    function init() {
        // Create canvas references
        SIZES.forEach(size => {
            state.canvases[size] = document.getElementById(`preview-${size}`);
        });
        state.canvases.tab = document.getElementById('tab-favicon');
        state.canvases.address = document.getElementById('address-favicon');
        
        bindEvents();
    }

    // Bind events
    function bindEvents() {
        el.fileInput.addEventListener('change', handleFileSelect);
        
        // Drag and drop
        el.dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            el.dropzone.classList.add('drag-over');
        });
        
        el.dropzone.addEventListener('dragleave', () => {
            el.dropzone.classList.remove('drag-over');
        });
        
        el.dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            el.dropzone.classList.remove('drag-over');
            if (e.dataTransfer.files.length) {
                handleFile(e.dataTransfer.files[0]);
            }
        });
        
        // Background options
        el.bgBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                el.bgBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.bgColor = btn.dataset.bg;
                regeneratePreviews();
            });
        });
        
        el.customBg.addEventListener('change', (e) => {
            el.bgBtns.forEach(b => b.classList.remove('active'));
            e.target.closest('.bg-btn').classList.add('active');
            state.bgColor = e.target.value;
            regeneratePreviews();
        });
        
        // Download buttons
        el.btnDownloadIco.addEventListener('click', downloadICO);
        el.btnDownload16.addEventListener('click', () => downloadPNG(16));
        el.btnDownload32.addEventListener('click', () => downloadPNG(32));
        el.btnDownloadAll.addEventListener('click', downloadAllPNGs);
        el.btnReset.addEventListener('click', reset);
    }

    // Handle file selection
    function handleFileSelect(e) {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    }

    // Handle file
    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                state.sourceImage = img;
                showPreview(img, file);
            };
            img.onerror = () => alert('Failed to load image');
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Show preview step
    function showPreview(img, file) {
        el.sourceImage.src = img.src;
        el.imageInfo.textContent = `${img.width} × ${img.height} px • ${formatFileSize(file.size)}`;
        
        regeneratePreviews();
        
        el.stepUpload.classList.remove('active');
        el.stepPreview.classList.add('active');
    }

    // Regenerate all preview canvases
    function regeneratePreviews() {
        if (!state.sourceImage) return;
        
        SIZES.forEach(size => {
            drawScaledImage(state.canvases[size], size);
        });
        
        // Tab and address bar previews
        drawScaledImage(state.canvases.tab, 16);
        drawScaledImage(state.canvases.address, 16);
    }

    // Draw scaled image to canvas with MAXIMUM quality
    // Uses multi-step downscaling for best results
    function drawScaledImage(canvas, targetSize) {
        const ctx = canvas.getContext('2d');
        const img = state.sourceImage;
        
        canvas.width = targetSize;
        canvas.height = targetSize;
        
        // Clear with background
        if (state.bgColor === 'transparent') {
            ctx.clearRect(0, 0, targetSize, targetSize);
        } else {
            ctx.fillStyle = state.bgColor;
            ctx.fillRect(0, 0, targetSize, targetSize);
        }
        
        // Calculate dimensions to fit and center
        const scale = Math.min(targetSize / img.width, targetSize / img.height);
        const finalW = Math.round(img.width * scale);
        const finalH = Math.round(img.height * scale);
        const finalX = Math.round((targetSize - finalW) / 2);
        const finalY = Math.round((targetSize - finalH) / 2);
        
        // Use multi-step downscaling for better quality
        // This prevents quality loss when scaling down to small sizes
        const scaledImg = multiStepDownscale(img, finalW, finalH);
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(scaledImg, finalX, finalY, finalW, finalH);
    }
    
    // Multi-step downscaling algorithm for maximum quality
    // Scales down in 50% steps to preserve detail
    function multiStepDownscale(img, targetW, targetH) {
        // If upscaling or minor change, just return original
        if (targetW >= img.width * 0.5 && targetH >= img.height * 0.5) {
            return img;
        }
        
        let currentW = img.width;
        let currentH = img.height;
        let currentSource = img;
        
        // Create temporary canvas for step-down scaling
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        // Step down by 50% until we're close to target size
        while (currentW * 0.5 > targetW && currentH * 0.5 > targetH) {
            const nextW = Math.round(currentW * 0.5);
            const nextH = Math.round(currentH * 0.5);
            
            tempCanvas.width = nextW;
            tempCanvas.height = nextH;
            
            tempCtx.imageSmoothingEnabled = true;
            tempCtx.imageSmoothingQuality = 'high';
            tempCtx.clearRect(0, 0, nextW, nextH);
            tempCtx.drawImage(currentSource, 0, 0, nextW, nextH);
            
            // Create new image from this step
            const stepImg = new Image();
            stepImg.src = tempCanvas.toDataURL('image/png');
            
            currentSource = tempCanvas;
            currentW = nextW;
            currentH = nextH;
        }
        
        // Final step to exact target size
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = targetW;
        finalCanvas.height = targetH;
        const finalCtx = finalCanvas.getContext('2d');
        
        finalCtx.imageSmoothingEnabled = true;
        finalCtx.imageSmoothingQuality = 'high';
        finalCtx.drawImage(currentSource, 0, 0, targetW, targetH);
        
        return finalCanvas;
    }

    // Download favicon.ico
    function downloadICO() {
        if (!state.sourceImage) return;
        
        // Generate ICO blob
        const icoBlob = generateICO();
        
        // Download
        const url = URL.createObjectURL(icoBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'favicon.ico';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Generate ICO file blob
    function generateICO() {
        // ICO format specification:
        // ICONDIR (6 bytes) + ICONDIRENTRY array (16 bytes each) + Image data
        
        const images = [];
        const sizesToInclude = [16, 32, 48]; // Standard favicon sizes
        
        sizesToInclude.forEach(size => {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            drawScaledImage(canvas, size);
            
            // Get PNG data
            const pngData = canvasToPNGArray(canvas);
            images.push({
                size: size,
                data: pngData
            });
        });
        
        // Calculate total size
        const headerSize = 6;
        const entrySize = 16;
        const entriesSize = images.length * entrySize;
        let dataOffset = headerSize + entriesSize;
        
        // Create ICO buffer
        let totalDataSize = 0;
        images.forEach(img => totalDataSize += img.data.length);
        
        const buffer = new ArrayBuffer(headerSize + entriesSize + totalDataSize);
        const view = new DataView(buffer);
        
        // ICONDIR header
        view.setUint16(0, 0, true);        // Reserved
        view.setUint16(2, 1, true);        // Type (1 = ICO)
        view.setUint16(4, images.length, true); // Number of images
        
        // ICONDIRENTRY for each image
        let offset = dataOffset;
        images.forEach((img, index) => {
            const entryOffset = headerSize + (index * entrySize);
            
            view.setUint8(entryOffset + 0, img.size < 256 ? img.size : 0); // Width
            view.setUint8(entryOffset + 1, img.size < 256 ? img.size : 0); // Height
            view.setUint8(entryOffset + 2, 0);         // Color palette
            view.setUint8(entryOffset + 3, 0);         // Reserved
            view.setUint16(entryOffset + 4, 1, true);  // Color planes
            view.setUint16(entryOffset + 6, 32, true); // Bits per pixel
            view.setUint32(entryOffset + 8, img.data.length, true); // Size
            view.setUint32(entryOffset + 12, offset, true); // Offset
            
            offset += img.data.length;
        });
        
        // Image data (PNG format for each)
        let dataPos = dataOffset;
        images.forEach(img => {
            const uint8 = new Uint8Array(buffer);
            uint8.set(img.data, dataPos);
            dataPos += img.data.length;
        });
        
        return new Blob([buffer], { type: 'image/x-icon' });
    }

    // Convert canvas to PNG byte array
    function canvasToPNGArray(canvas) {
        const dataURL = canvas.toDataURL('image/png');
        const base64 = dataURL.split(',')[1];
        const binary = atob(base64);
        const array = new Uint8Array(binary.length);
        
        for (let i = 0; i < binary.length; i++) {
            array[i] = binary.charCodeAt(i);
        }
        
        return array;
    }

    // Download individual PNG
    function downloadPNG(size) {
        if (!state.sourceImage) return;
        
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        drawScaledImage(canvas, size);
        
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `favicon-${size}x${size}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 'image/png');
    }

    // Download all PNGs as separate files
    async function downloadAllPNGs() {
        if (!state.sourceImage) return;
        
        for (const size of SIZES) {
            await new Promise(resolve => {
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                drawScaledImage(canvas, size);
                
                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `favicon-${size}x${size}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    setTimeout(resolve, 200);
                }, 'image/png');
            });
        }
    }

    // Reset to upload step
    function reset() {
        state.sourceImage = null;
        el.fileInput.value = '';
        
        el.stepPreview.classList.remove('active');
        el.stepUpload.classList.add('active');
        
        // Reset background
        state.bgColor = 'transparent';
        el.bgBtns.forEach(b => b.classList.remove('active'));
        el.bgBtns[0].classList.add('active');
    }

    // Format file size
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', init);
})();


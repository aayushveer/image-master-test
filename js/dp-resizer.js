/**
 * DP RESIZER - Advanced Profile Picture Maker
 * Features: Zoom in/out, Fit full photo, Crop mode, Multi-platform
 */

'use strict';

(function() {
    // Platform presets with sizes
    const PLATFORMS = {
        whatsapp: { name: 'WhatsApp DP', size: 500 },
        instagram: { name: 'Instagram DP', size: 1080 },
        facebook: { name: 'Facebook DP', size: 720 },
        twitter: { name: 'Twitter/X DP', size: 400 },
        linkedin: { name: 'LinkedIn DP', size: 800 },
        youtube: { name: 'YouTube DP', size: 800 },
        telegram: { name: 'Telegram DP', size: 512 },
        custom: { name: 'Custom Size', size: 500 }
    };

    // State
    const state = {
        currentPage: 'upload',
        image: null,
        platform: 'whatsapp',
        size: 500,
        mode: 'crop', // 'crop' or 'fit'
        zoom: 100,
        minZoom: 50,
        maxZoom: 300,
        baseScale: 1,
        offsetX: 0,
        offsetY: 0,
        isDragging: false,
        dragStart: { x: 0, y: 0 },
        resultBlob: null
    };

    // DOM Elements
    const el = {
        pageUpload: document.getElementById('page-upload'),
        pageEditor: document.getElementById('page-editor'),
        pageDownload: document.getElementById('page-download'),
        
        fileInput: document.getElementById('file-input'),
        dropzone: document.getElementById('dropzone'),
        btnBack: document.getElementById('btn-back'),
        
        previewContainer: document.getElementById('preview-container'),
        previewImage: document.getElementById('preview-image'),
        infoPlatform: document.getElementById('info-platform'),
        outputSize: document.getElementById('output-size'),
        
        btnModeCrop: document.getElementById('btn-mode-crop'),
        btnModeFit: document.getElementById('btn-mode-fit'),
        
        platformBtns: document.querySelectorAll('.platform-btn'),
        customSize: document.getElementById('custom-size'),
        customWidth: document.getElementById('custom-width'),
        customHeight: document.getElementById('custom-height'),
        
        zoomSlider: document.getElementById('zoom-slider'),
        zoomValue: document.getElementById('zoom-value'),
        btnZoomIn: document.getElementById('btn-zoom-in'),
        btnZoomOut: document.getElementById('btn-zoom-out'),
        
        btnCreate: document.getElementById('btn-create'),
        btnReset: document.getElementById('btn-reset'),
        
        resultImage: document.getElementById('result-image'),
        downloadInfo: document.getElementById('download-info'),
        btnDownload: document.getElementById('btn-download'),
        btnMore: document.getElementById('btn-more')
    };

    // Initialize
    function init() {
        bindEvents();
        updateZoomDisplay();
    }

    // Bind events
    function bindEvents() {
        // Back button
        if (el.btnBack) {
            el.btnBack.addEventListener('click', handleBack);
        }
        
        // File input
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
        
        // Mode toggle
        el.btnModeCrop.addEventListener('click', () => setMode('crop'));
        el.btnModeFit.addEventListener('click', () => setMode('fit'));
        
        // Platform selection
        el.platformBtns.forEach(btn => {
            btn.addEventListener('click', () => selectPlatform(btn.dataset.platform));
        });
        
        // Custom size inputs
        el.customWidth.addEventListener('change', updateCustomSize);
        el.customHeight.addEventListener('change', updateCustomSize);
        
        // Zoom controls
        el.zoomSlider.addEventListener('input', handleZoomSlider);
        el.btnZoomIn.addEventListener('click', () => adjustZoom(10));
        el.btnZoomOut.addEventListener('click', () => adjustZoom(-10));
        
        // Mouse wheel zoom
        el.previewContainer.addEventListener('wheel', handleWheelZoom, { passive: false });
        
        // Image dragging
        el.previewImage.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', handleDrag);
        document.addEventListener('mouseup', endDrag);
        
        el.previewImage.addEventListener('touchstart', startDragTouch, { passive: false });
        document.addEventListener('touchmove', handleDragTouch, { passive: false });
        document.addEventListener('touchend', endDrag);
        
        // Actions
        el.btnCreate.addEventListener('click', createDP);
        el.btnReset.addEventListener('click', reset);
        el.btnDownload.addEventListener('click', download);
        el.btnMore.addEventListener('click', reset);
    }

    // Handle back button
    function handleBack() {
        switch(state.currentPage) {
            case 'download':
                showPage('editor');
                break;
            case 'editor':
                showPage('upload');
                break;
            case 'upload':
            default:
                window.location.href = 'index.html';
                break;
        }
    }

    // Handle file select
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
                state.image = {
                    element: img,
                    width: img.width,
                    height: img.height,
                    dataUrl: e.target.result
                };
                
                // Reset state
                state.zoom = 100;
                state.offsetX = 0;
                state.offsetY = 0;
                el.zoomSlider.value = 100;
                updateZoomDisplay();
                
                // Show editor
                showPage('editor');
                setupPreview();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Show page
    function showPage(page) {
        state.currentPage = page;
        
        el.pageUpload.classList.remove('active');
        el.pageEditor.classList.remove('active');
        el.pageDownload.classList.remove('active');
        
        switch(page) {
            case 'upload': el.pageUpload.classList.add('active'); break;
            case 'editor': el.pageEditor.classList.add('active'); break;
            case 'download': el.pageDownload.classList.add('active'); break;
        }
    }

    // Setup preview
    function setupPreview() {
        el.previewImage.src = state.image.dataUrl;
        
        // Calculate base scale based on mode
        calculateBaseScale();
        
        // Reset offset
        state.offsetX = 0;
        state.offsetY = 0;
        state.zoom = 100;
        el.zoomSlider.value = 100;
        updateZoomDisplay();
        
        updateImageTransform();
        updateSizeDisplay();
    }

    // Calculate base scale based on mode
    function calculateBaseScale() {
        const containerSize = el.previewContainer.clientWidth || 320;
        const imgW = state.image.width;
        const imgH = state.image.height;
        
        if (state.mode === 'crop') {
            // Scale to cover container (larger dimension fills)
            const scaleW = containerSize / imgW;
            const scaleH = containerSize / imgH;
            state.baseScale = Math.max(scaleW, scaleH);
            state.minZoom = 50;
            state.maxZoom = 300;
        } else {
            // Fit mode: scale to fit inside container
            const scaleW = containerSize / imgW;
            const scaleH = containerSize / imgH;
            state.baseScale = Math.min(scaleW, scaleH) * 0.9; // 90% to show background
            state.minZoom = 30;
            state.maxZoom = 150;
        }
        
        // Update slider limits
        el.zoomSlider.min = state.minZoom;
        el.zoomSlider.max = state.maxZoom;
        
        // Clamp current zoom to new limits
        state.zoom = Math.max(state.minZoom, Math.min(state.maxZoom, state.zoom));
        el.zoomSlider.value = state.zoom;
    }

    // Set mode (crop or fit)
    function setMode(mode) {
        state.mode = mode;
        
        // Update UI
        el.btnModeCrop.classList.toggle('active', mode === 'crop');
        el.btnModeFit.classList.toggle('active', mode === 'fit');
        
        // Recalculate scale
        if (state.image) {
            calculateBaseScale();
            state.offsetX = 0;
            state.offsetY = 0;
            state.zoom = 100;
            el.zoomSlider.value = 100;
            updateZoomDisplay();
            updateImageTransform();
        }
    }

    // Select platform
    function selectPlatform(platform) {
        state.platform = platform;
        state.size = PLATFORMS[platform].size;
        
        // Update UI
        el.platformBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.platform === platform);
        });
        
        // Show/hide custom size
        el.customSize.style.display = platform === 'custom' ? 'block' : 'none';
        
        if (platform === 'custom') {
            state.size = parseInt(el.customWidth.value) || 500;
        }
        
        updateSizeDisplay();
    }

    // Update custom size
    function updateCustomSize() {
        const w = parseInt(el.customWidth.value) || 500;
        const h = parseInt(el.customHeight.value) || 500;
        state.size = Math.max(w, h);
        el.customHeight.value = el.customWidth.value; // Keep square
        updateSizeDisplay();
    }

    // Update size display
    function updateSizeDisplay() {
        el.infoPlatform.textContent = PLATFORMS[state.platform].name;
        el.outputSize.textContent = `${state.size} × ${state.size} px`;
    }

    // Handle zoom slider
    function handleZoomSlider() {
        state.zoom = parseInt(el.zoomSlider.value);
        updateZoomDisplay();
        updateImageTransform();
    }

    // Adjust zoom by delta
    function adjustZoom(delta) {
        const newZoom = Math.max(state.minZoom, Math.min(state.maxZoom, state.zoom + delta));
        state.zoom = newZoom;
        el.zoomSlider.value = newZoom;
        updateZoomDisplay();
        updateImageTransform();
    }

    // Handle wheel zoom
    function handleWheelZoom(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -5 : 5;
        adjustZoom(delta);
    }

    // Update zoom display
    function updateZoomDisplay() {
        el.zoomValue.textContent = state.zoom + '%';
    }

    // Update image transform
    function updateImageTransform() {
        if (!state.image) return;
        
        const containerSize = el.previewContainer.clientWidth || 320;
        const scale = state.baseScale * (state.zoom / 100);
        
        const imgW = state.image.width * scale;
        const imgH = state.image.height * scale;
        
        // Center image then apply offset
        const translateX = -imgW / 2 + state.offsetX;
        const translateY = -imgH / 2 + state.offsetY;
        
        el.previewImage.style.width = imgW + 'px';
        el.previewImage.style.height = imgH + 'px';
        el.previewImage.style.transform = `translate(${translateX}px, ${translateY}px)`;
    }

    // Drag handlers
    function startDrag(e) {
        if (state.mode === 'fit') return; // No drag in fit mode
        e.preventDefault();
        state.isDragging = true;
        state.dragStart = { x: e.clientX - state.offsetX, y: e.clientY - state.offsetY };
    }

    function startDragTouch(e) {
        if (state.mode === 'fit') return;
        if (e.touches.length === 1) {
            e.preventDefault();
            state.isDragging = true;
            state.dragStart = { 
                x: e.touches[0].clientX - state.offsetX, 
                y: e.touches[0].clientY - state.offsetY 
            };
        }
    }

    function handleDrag(e) {
        if (!state.isDragging) return;
        state.offsetX = e.clientX - state.dragStart.x;
        state.offsetY = e.clientY - state.dragStart.y;
        updateImageTransform();
    }

    function handleDragTouch(e) {
        if (!state.isDragging || e.touches.length !== 1) return;
        e.preventDefault();
        state.offsetX = e.touches[0].clientX - state.dragStart.x;
        state.offsetY = e.touches[0].clientY - state.dragStart.y;
        updateImageTransform();
    }

    function endDrag() {
        state.isDragging = false;
    }

    // Create DP
    function createDP() {
        if (!state.image) return;
        
        const size = state.size;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // White background (important for fit mode)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        if (state.mode === 'crop') {
            // Crop mode: extract visible portion
            const containerSize = el.previewContainer.clientWidth || 320;
            const scale = state.baseScale * (state.zoom / 100);
            
            const img = state.image.element;
            const imgW = img.width * scale;
            const imgH = img.height * scale;
            
            // Image position in container
            const centerX = containerSize / 2;
            const centerY = containerSize / 2;
            const imgLeft = centerX - imgW / 2 + state.offsetX;
            const imgTop = centerY - imgH / 2 + state.offsetY;
            
            // Map container to source image coordinates
            const srcX = (0 - imgLeft) / scale;
            const srcY = (0 - imgTop) / scale;
            const srcW = containerSize / scale;
            const srcH = containerSize / scale;
            
            ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, size, size);
        } else {
            // Fit mode: draw entire image centered
            const img = state.image.element;
            const imgW = img.width;
            const imgH = img.height;
            
            // Calculate scale to fit inside output size with padding
            const fitScale = Math.min(size / imgW, size / imgH) * (state.zoom / 100);
            const drawW = imgW * fitScale;
            const drawH = imgH * fitScale;
            
            // Center in canvas
            const drawX = (size - drawW) / 2;
            const drawY = (size - drawH) / 2;
            
            ctx.drawImage(img, 0, 0, imgW, imgH, drawX, drawY, drawW, drawH);
        }
        
        // Create blob
        canvas.toBlob((blob) => {
            if (!blob) return;
            
            state.resultBlob = blob;
            
            // Show result
            const url = URL.createObjectURL(blob);
            el.resultImage.src = url;
            el.downloadInfo.textContent = `${PLATFORMS[state.platform].name} • ${size} × ${size} px • HD Quality`;
            
            showPage('download');
        }, 'image/jpeg', 0.95);
    }

    // Download
    function download() {
        if (!state.resultBlob) return;
        
        const url = URL.createObjectURL(state.resultBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${state.platform}-dp-${state.size}x${state.size}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Reset
    function reset() {
        state.image = null;
        state.zoom = 100;
        state.offsetX = 0;
        state.offsetY = 0;
        state.resultBlob = null;
        state.mode = 'crop';
        
        el.fileInput.value = '';
        el.zoomSlider.value = 100;
        updateZoomDisplay();
        
        // Reset mode buttons
        el.btnModeCrop.classList.add('active');
        el.btnModeFit.classList.remove('active');
        
        showPage('upload');
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

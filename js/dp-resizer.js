/**
 * DP RESIZER - WhatsApp & Instagram Profile Picture Maker
 */

'use strict';

(function() {
    // Platform presets
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
        image: null,
        platform: 'whatsapp',
        size: 500,
        zoom: 100,
        baseScale: 1, // NEW: Base scale to fit image in container
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
        
        previewContainer: document.getElementById('preview-container'),
        previewImage: document.getElementById('preview-image'),
        outputSize: document.getElementById('output-size'),
        
        platformBtns: document.querySelectorAll('.platform-btn'),
        customSize: document.getElementById('custom-size'),
        customWidth: document.getElementById('custom-width'),
        customHeight: document.getElementById('custom-height'),
        zoomSlider: document.getElementById('zoom-slider'),
        
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
    }

    // Bind events
    function bindEvents() {
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
        
        // Platform selection
        el.platformBtns.forEach(btn => {
            btn.addEventListener('click', () => selectPlatform(btn.dataset.platform));
        });
        
        // Custom size inputs
        el.customWidth.addEventListener('change', updateCustomSize);
        el.customHeight.addEventListener('change', updateCustomSize);
        
        // Zoom
        el.zoomSlider.addEventListener('input', handleZoom);
        
        // Image dragging
        el.previewImage.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', handleDrag);
        document.addEventListener('mouseup', endDrag);
        
        el.previewImage.addEventListener('touchstart', startDragTouch, { passive: true });
        document.addEventListener('touchmove', handleDragTouch, { passive: true });
        document.addEventListener('touchend', endDrag);
        
        // Actions
        el.btnCreate.addEventListener('click', createDP);
        el.btnReset.addEventListener('click', reset);
        el.btnDownload.addEventListener('click', download);
        el.btnMore.addEventListener('click', reset);
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
        
        // Calculate base scale to cover the container
        const containerSize = el.previewContainer.clientWidth || 350;
        const imgW = state.image.width;
        const imgH = state.image.height;
        
        // Scale to cover container (image fills container)
        const scaleW = containerSize / imgW;
        const scaleH = containerSize / imgH;
        state.baseScale = Math.max(scaleW, scaleH) * 1.1; // Slightly larger for margin
        
        // Reset offset
        state.offsetX = 0;
        state.offsetY = 0;
        state.zoom = 100;
        el.zoomSlider.value = 100;
        
        updateImageTransform();
        updateSizeDisplay();
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
        el.outputSize.textContent = `${state.size} × ${state.size} px`;
    }

    // Handle zoom
    function handleZoom() {
        state.zoom = parseInt(el.zoomSlider.value);
        updateImageTransform();
    }

    // FIXED: Update image transform - proper sizing and panning
    function updateImageTransform() {
        if (!state.image) return;
        
        const containerSize = el.previewContainer.clientWidth || 350;
        const scale = state.baseScale * (state.zoom / 100);
        
        const imgW = state.image.width * scale;
        const imgH = state.image.height * scale;
        
        // Calculate the transform: center image then apply offset
        // CSS has left:50%, top:50% so we need to offset by half image size + user offset
        const translateX = -imgW / 2 + state.offsetX;
        const translateY = -imgH / 2 + state.offsetY;
        
        el.previewImage.style.width = imgW + 'px';
        el.previewImage.style.height = imgH + 'px';
        el.previewImage.style.transform = `translate(${translateX}px, ${translateY}px)`;
    }

    // Drag handlers
    function startDrag(e) {
        e.preventDefault();
        state.isDragging = true;
        state.dragStart = { x: e.clientX - state.offsetX, y: e.clientY - state.offsetY };
    }

    function startDragTouch(e) {
        if (e.touches.length === 1) {
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
        
        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        
        // Calculate dimensions based on current transform
        const containerSize = el.previewContainer.clientWidth || 350;
        const scale = state.baseScale * (state.zoom / 100);
        
        const img = state.image.element;
        const imgW = img.width * scale;
        const imgH = img.height * scale;
        
        // Calculate visible area in source image coordinates
        // The preview shows a centered circle with user offset
        // We need to map from container space to source image space
        
        // Center of container (which is also center of visible circle)
        const centerX = containerSize / 2;
        const centerY = containerSize / 2;
        
        // Image position in container
        const imgLeft = centerX - imgW / 2 + state.offsetX;
        const imgTop = centerY - imgH / 2 + state.offsetY;
        
        // Visible area bounds (the circle, but we crop a square)
        const visibleLeft = 0;
        const visibleTop = 0;
        const visibleRight = containerSize;
        const visibleBottom = containerSize;
        
        // Map to source image coordinates
        const srcX = (visibleLeft - imgLeft) / scale;
        const srcY = (visibleTop - imgTop) / scale;
        const srcW = containerSize / scale;
        const srcH = containerSize / scale;
        
        // Draw with high quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, size, size);
        
        // Create blob
        canvas.toBlob((blob) => {
            if (!blob) return;
            
            state.resultBlob = blob;
            
            // Show result
            const url = URL.createObjectURL(blob);
            el.resultImage.src = url;
            el.downloadInfo.textContent = `${PLATFORMS[state.platform].name} • ${size} × ${size} px`;
            
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
        
        el.fileInput.value = '';
        el.zoomSlider.value = 100;
        
        showPage('upload');
    }

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', init);
})();


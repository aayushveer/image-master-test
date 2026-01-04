/**
 * PASSPORT-PHOTO.JS - Passport Photo Maker
 * Professional passport/ID photo generator
 * Supports all major document specifications
 */

(function() {
    'use strict';

    // Document Specifications
    const SPECS = {
        // Indian Passport & Visa
        'india-passport': { name: 'Indian Passport', mm: [35, 35], px: [413, 413], dpi: 300 },
        'india-oci': { name: 'OCI Card', mm: [51, 51], px: [600, 600], dpi: 300 },
        
        // ID Cards
        'aadhaar': { name: 'Aadhaar Card', mm: [35, 45], px: [413, 531], dpi: 300 },
        'pan-card': { name: 'PAN Card', mm: [35, 45], px: [413, 531], dpi: 300 },
        'voter-id': { name: 'Voter ID', mm: [35, 45], px: [413, 531], dpi: 300 },
        'driving-license': { name: 'Driving License', mm: [35, 45], px: [413, 531], dpi: 300 },
        'ration-card': { name: 'Ration Card', mm: [35, 45], px: [413, 531], dpi: 300 },
        
        // Competitive Exams
        'ssc-exam': { name: 'SSC Exam', mm: [35, 45], px: [413, 531], dpi: 300 },
        'upsc-exam': { name: 'UPSC/IAS', mm: [35, 45], px: [413, 531], dpi: 300 },
        'bank-exam': { name: 'Bank Exam (IBPS)', mm: [35, 45], px: [413, 531], dpi: 300 },
        'railway-exam': { name: 'Railway Exam', mm: [35, 45], px: [413, 531], dpi: 300 },
        'neet-jee': { name: 'NEET/JEE', mm: [35, 45], px: [413, 531], dpi: 300 },
        'gate-cat': { name: 'GATE/CAT', mm: [35, 45], px: [413, 531], dpi: 300 },
        
        // School & College
        'school-admission': { name: 'School Admission', mm: [35, 45], px: [413, 531], dpi: 300 },
        'college-admission': { name: 'College Admission', mm: [35, 45], px: [413, 531], dpi: 300 },
        
        // Foreign Visa
        'us-visa': { name: 'US Visa', mm: [51, 51], px: [600, 600], dpi: 300 },
        'uk-visa': { name: 'UK Visa', mm: [35, 45], px: [413, 531], dpi: 300 },
        'canada-visa': { name: 'Canada Visa', mm: [35, 45], px: [413, 531], dpi: 300 },
        'schengen-visa': { name: 'Schengen Visa', mm: [35, 45], px: [413, 531], dpi: 300 },
        'australia-visa': { name: 'Australia Visa', mm: [35, 45], px: [413, 531], dpi: 300 },
        'uae-visa': { name: 'UAE Visa', mm: [43, 55], px: [508, 649], dpi: 300 },
        'saudi-visa': { name: 'Saudi Visa', mm: [40, 60], px: [472, 709], dpi: 300 },
        'singapore-visa': { name: 'Singapore Visa', mm: [35, 45], px: [400, 514], dpi: 300 },
        
        // Standard Size
        'stamp-size': { name: 'Stamp Size (20x25mm)', mm: [20, 25], px: [236, 295], dpi: 300 },
        'standard': { name: 'Standard (35x45mm)', mm: [35, 45], px: [413, 531], dpi: 300 },
        'custom': { name: 'Custom Size', mm: [35, 45], px: [413, 531], dpi: 300 }
    };

    // State
    const state = {
        image: null,
        spec: 'india-passport',
        outputMode: 'single', // 'single' or 'a4'
        photoCount: 8,
        zoom: 100,
        baseScale: 1,
        rotation: 0,
        flipH: false,
        offsetX: 0,
        offsetY: 0,
        isDragging: false,
        dragStart: { x: 0, y: 0 },
        resultBlob: null,
        printBlob: null,
        showCropGuides: true,
        mode: 'auto',
        savedPositions: {},
        currentPage: 'upload', // Track current page for back navigation
        customSizeActive: false,
        bgColor: '#ffffff', // FIX: Added missing background color
        outputQuality: 0.95, // Image quality control
        minResolutionWarned: false
    };

    // DOM Elements
    const el = {
        pageUpload: document.getElementById('page-upload'),
        pageEdit: document.getElementById('page-edit'),
        pageDownload: document.getElementById('page-download'),
        
        dropzone: document.getElementById('dropzone'),
        fileInput: document.getElementById('file-input'),
        
        cropContainer: document.getElementById('crop-container'),
        sourceImage: document.getElementById('source-image'),
        
        zoomSlider: document.getElementById('zoom-slider'),
        btnZoomIn: document.getElementById('btn-zoom-in'),
        btnZoomOut: document.getElementById('btn-zoom-out'),
        btnRotate: document.getElementById('btn-rotate'),
        btnFlipH: document.getElementById('btn-flip-h'),
        btnCropToggle: document.getElementById('btn-crop-toggle'),
        
        btnModeAuto: document.getElementById('btn-mode-auto'),
        btnModeManual: document.getElementById('btn-mode-manual'),
        btnResetPosition: document.getElementById('btn-reset-position'),
        
        countrySelect: document.getElementById('country-select'),
        sizeMm: document.getElementById('size-mm'),
        sizePx: document.getElementById('size-px'),
        sizeDisplay: document.getElementById('size-display'),
        
        // Custom size controls
        btnCustomSize: document.getElementById('btn-custom-size'),
        customSizePanel: document.getElementById('custom-size-panel'),
        customWidth: document.getElementById('custom-width'),
        customHeight: document.getElementById('custom-height'),
        btnApplyCustomSize: document.getElementById('btn-apply-custom-size'),
        
        // Back button
        btnBack: document.getElementById('btn-back'),
        
        // Output controls
        btnOutputSingle: document.getElementById('btn-output-single'),
        btnOutputA4: document.getElementById('btn-output-a4'),
        a4Options: document.getElementById('a4-options'),
        photoCountInput: document.getElementById('photo-count-input'),
        btnCountMinus: document.getElementById('btn-count-minus'),
        btnCountPlus: document.getElementById('btn-count-plus'),
        countMaxInfo: document.getElementById('count-max-info'),
        layoutGrid: document.getElementById('layout-grid'),
        layoutInfo: document.getElementById('layout-info'),
        outputInfo: document.getElementById('output-info'),
        
        btnGenerate: document.getElementById('btn-generate'),
        
        downloadInfo: document.getElementById('download-info'),
        resultImage: document.getElementById('result-image'),
        resultSingle: document.getElementById('result-single'),
        resultPrint: document.getElementById('result-print'),
        resultPrintImage: document.getElementById('result-print-image'),
        
        btnDownload: document.getElementById('btn-download'),
        btnDownloadPrint: document.getElementById('btn-download-print'),
        btnCreateAnother: document.getElementById('btn-create-another'),
        
        specSize: document.getElementById('spec-size'),
        specResolution: document.getElementById('spec-resolution'),
        specDpi: document.getElementById('spec-dpi'),
        
        processing: document.getElementById('processing')
    };

    // Initialize
    function init() {
        setupEventListeners();
        setupDragAndDrop();
        updateSizeDisplay();
        updateCropContainerAspectRatio();
        updateCropContainerBg();
        updateLayoutPreview();
        updateMaxPhotosInfo();
    }

    // Event Listeners
    function setupEventListeners() {
        // File input
        el.fileInput.addEventListener('change', handleFileSelect);
        
        // Zoom controls
        el.zoomSlider.addEventListener('input', handleZoom);
        el.btnZoomIn.addEventListener('click', () => adjustZoom(10));
        el.btnZoomOut.addEventListener('click', () => adjustZoom(-10));
        el.btnRotate.addEventListener('click', handleRotate);
        
        // Flip and crop toggle
        if (el.btnFlipH) {
            el.btnFlipH.addEventListener('click', handleFlipH);
        }
        if (el.btnCropToggle) {
            el.btnCropToggle.addEventListener('click', toggleCropGuides);
        }
        
        // Mode toggle buttons
        if (el.btnModeAuto) {
            el.btnModeAuto.addEventListener('click', () => setMode('auto'));
        }
        if (el.btnModeManual) {
            el.btnModeManual.addEventListener('click', () => setMode('manual'));
        }
        if (el.btnResetPosition) {
            el.btnResetPosition.addEventListener('click', resetPosition);
        }
        
        // Country select
        el.countrySelect.addEventListener('change', handleCountryChange);
        
        // Back button - navigate within tool flow
        if (el.btnBack) {
            el.btnBack.addEventListener('click', handleBackButton);
        }
        
        // Custom size toggle and apply
        if (el.btnCustomSize) {
            el.btnCustomSize.addEventListener('click', toggleCustomSize);
        }
        if (el.btnApplyCustomSize) {
            el.btnApplyCustomSize.addEventListener('click', applyCustomSize);
        }
        
        // Output mode toggle (Single vs A4)
        if (el.btnOutputSingle) {
            el.btnOutputSingle.addEventListener('click', () => setOutputMode('single'));
        }
        if (el.btnOutputA4) {
            el.btnOutputA4.addEventListener('click', () => setOutputMode('a4'));
        }
        
        // Photo count controls
        if (el.btnCountMinus) {
            el.btnCountMinus.addEventListener('click', () => adjustPhotoCount(-1));
        }
        if (el.btnCountPlus) {
            el.btnCountPlus.addEventListener('click', () => adjustPhotoCount(1));
        }
        if (el.photoCountInput) {
            el.photoCountInput.addEventListener('change', handlePhotoCountChange);
            el.photoCountInput.addEventListener('input', handlePhotoCountChange);
        }
        
        // Generate
        el.btnGenerate.addEventListener('click', generatePhoto);
        
        // Download
        el.btnDownload.addEventListener('click', downloadPhoto);
        el.btnDownloadPrint.addEventListener('click', downloadPrintLayout);
        el.btnCreateAnother.addEventListener('click', resetToUpload);
        
        // Crop container drag
        el.cropContainer.addEventListener('mousedown', startDrag);
        el.cropContainer.addEventListener('touchstart', startDrag, { passive: false });
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('touchmove', doDrag, { passive: false });
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
        
        // Scroll to zoom
        el.cropContainer.addEventListener('wheel', handleWheel, { passive: false });
    }
    
    // Output mode (Single vs A4)
    function setOutputMode(mode) {
        state.outputMode = mode;
        
        // Update UI
        if (el.btnOutputSingle) {
            el.btnOutputSingle.classList.toggle('active', mode === 'single');
        }
        if (el.btnOutputA4) {
            el.btnOutputA4.classList.toggle('active', mode === 'a4');
        }
        
        // Show/hide A4 options
        if (el.a4Options) {
            el.a4Options.style.display = mode === 'a4' ? 'block' : 'none';
        }
        
        // Update info text
        updateOutputInfo();
    }
    
    function updateOutputInfo() {
        if (!el.outputInfo) return;
        
        if (state.outputMode === 'single') {
            el.outputInfo.textContent = '💡 Single photo for digital use or printing individually';
        } else {
            const layout = calculateOptimalLayout(state.photoCount);
            el.outputInfo.textContent = `✂️ ${state.photoCount} photos with cutting guides • Print-safe margins`;
        }
    }
    
    // Photo count controls
    function adjustPhotoCount(delta) {
        const maxPhotos = calculateMaxPhotosOnA4().total;
        let newCount = state.photoCount + delta;
        newCount = Math.max(1, Math.min(maxPhotos, newCount));
        state.photoCount = newCount;
        
        if (el.photoCountInput) {
            el.photoCountInput.value = newCount;
        }
        
        updateLayoutPreview();
        updateOutputInfo();
    }
    
    function handlePhotoCountChange(e) {
        const maxPhotos = calculateMaxPhotosOnA4().total;
        let value = parseInt(e.target.value) || 1;
        value = Math.max(1, Math.min(maxPhotos, value));
        state.photoCount = value;
        e.target.value = value;
        
        updateLayoutPreview();
        updateOutputInfo();
    }
    
    // Calculate optimal layout to minimize paper waste
    // ENHANCED: Now considers paper efficiency and optimal photo placement
    function calculateOptimalLayout(count) {
        const spec = SPECS[state.spec];
        const [photoW, photoH] = spec.mm;
        
        // A4 size in mm: 210 x 297
        const a4W = 210;
        const a4H = 297;
        const printMargin = 10; // 10mm print-safe margin
        const cutGap = 3; // 3mm gap for cutting
        
        const usableW = a4W - (printMargin * 2);
        const usableH = a4H - (printMargin * 2);
        const usableArea = usableW * usableH;
        const photoArea = photoW * photoH;
        
        const maxCols = Math.floor((usableW + cutGap) / (photoW + cutGap));
        const maxRows = Math.floor((usableH + cutGap) / (photoH + cutGap));
        
        // Find optimal arrangement that minimizes empty cells AND maximizes paper efficiency
        let bestLayout = { cols: 1, rows: count, waste: count - 1, efficiency: 0 };
        
        for (let cols = 1; cols <= maxCols; cols++) {
            const rows = Math.ceil(count / cols);
            if (rows <= maxRows) {
                const totalCells = cols * rows;
                const waste = totalCells - count;
                
                // Calculate actual paper efficiency (how much of usable area is used by photos)
                const usedPhotoArea = count * photoArea;
                const efficiency = Math.round((usedPhotoArea / usableArea) * 100);
                
                // Prefer layouts with less waste and higher efficiency
                if (waste < bestLayout.waste || 
                    (waste === bestLayout.waste && efficiency > bestLayout.efficiency) ||
                    (waste === bestLayout.waste && efficiency === bestLayout.efficiency && cols >= rows)) {
                    bestLayout = { cols, rows, waste, totalCells, efficiency };
                }
            }
        }
        
        // Calculate actual used area percentage
        const usedPhotoArea = count * photoArea;
        bestLayout.paperEfficiency = Math.round((usedPhotoArea / usableArea) * 100);
        bestLayout.paperWaste = 100 - bestLayout.paperEfficiency;
        
        return bestLayout;
    }
    
    // Calculate the MAXIMUM photos that can fit with ZERO wasted cells
    function suggestOptimalCount() {
        const spec = SPECS[state.spec];
        const [photoW, photoH] = spec.mm;
        
        const a4W = 210;
        const a4H = 297;
        const printMargin = 10;
        const cutGap = 3;
        
        const usableW = a4W - (printMargin * 2);
        const usableH = a4H - (printMargin * 2);
        
        const maxCols = Math.floor((usableW + cutGap) / (photoW + cutGap));
        const maxRows = Math.floor((usableH + cutGap) / (photoH + cutGap));
        
        // Find counts that result in perfect fit (no empty cells)
        const perfectCounts = [];
        for (let r = 1; r <= maxRows; r++) {
            for (let c = 1; c <= maxCols; c++) {
                perfectCounts.push(c * r);
            }
        }
        
        // Remove duplicates and sort
        const uniquePerfect = [...new Set(perfectCounts)].sort((a, b) => b - a);
        
        return {
            maxTotal: maxCols * maxRows,
            maxCols,
            maxRows,
            perfectFitOptions: uniquePerfect.slice(0, 5) // Top 5 options
        };
    }
    
    // Update layout preview grid
    function updateLayoutPreview() {
        if (!el.layoutGrid || !el.layoutInfo) return;
        
        const layout = calculateOptimalLayout(state.photoCount);
        const optimal = suggestOptimalCount();
        
        // Create grid
        el.layoutGrid.innerHTML = '';
        el.layoutGrid.style.gridTemplateColumns = `repeat(${layout.cols}, 1fr)`;
        el.layoutGrid.style.gridTemplateRows = `repeat(${layout.rows}, 1fr)`;
        
        const totalCells = layout.cols * layout.rows;
        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'photo-cell' + (i >= state.photoCount ? ' empty' : '');
            el.layoutGrid.appendChild(cell);
        }
        
        // Update info
        const arrangement = el.layoutInfo.querySelector('.layout-arrangement');
        const efficiency = el.layoutInfo.querySelector('.layout-efficiency');
        
        if (arrangement) {
            arrangement.textContent = `${layout.cols} × ${layout.rows} arrangement`;
        }
        
        if (efficiency) {
            if (layout.waste === 0) {
                efficiency.textContent = `✓ Perfect fit! (${layout.paperEfficiency}% paper used)`;
                efficiency.className = 'layout-efficiency';
            } else if (layout.waste === 1) {
                efficiency.textContent = `✓ 1 empty space (${layout.paperEfficiency}% paper used)`;
                efficiency.className = 'layout-efficiency';
            } else if (layout.waste <= 3) {
                efficiency.textContent = `${layout.waste} empty spaces (${layout.paperEfficiency}% used)`;
                efficiency.className = 'layout-efficiency';
            } else {
                // Suggest a better count
                const betterCount = optimal.perfectFitOptions.find(c => c < state.photoCount && c >= state.photoCount - 3);
                if (betterCount) {
                    efficiency.textContent = `${layout.waste} empty • Try ${betterCount} for perfect fit`;
                } else {
                    efficiency.textContent = `${layout.waste} empty spaces`;
                }
                efficiency.className = 'layout-efficiency warning';
            }
        }
    }
    
    // Update max photos info
    function updateMaxPhotosInfo() {
        if (!el.countMaxInfo) return;
        const maxPhotos = calculateMaxPhotosOnA4().total;
        el.countMaxInfo.textContent = `Max: ${maxPhotos} photos`;
        
        if (el.photoCountInput) {
            el.photoCountInput.max = maxPhotos;
        }
    }
    
    // Flip horizontal
    function handleFlipH() {
        state.flipH = !state.flipH;
        updateImageTransform();
        
        if (el.btnFlipH) {
            el.btnFlipH.classList.toggle('active', state.flipH);
        }
    }
    
    // Toggle crop guides
    function toggleCropGuides() {
        state.showCropGuides = !state.showCropGuides;
        const overlay = el.cropContainer.querySelector('.crop-overlay');
        if (overlay) {
            overlay.style.opacity = state.showCropGuides ? '1' : '0';
        }
        
        if (el.btnCropToggle) {
            el.btnCropToggle.classList.toggle('active', state.showCropGuides);
        }
    }
    
    // Set positioning mode
    function setMode(mode) {
        state.mode = mode;
        
        if (el.btnModeAuto) {
            el.btnModeAuto.classList.toggle('active', mode === 'auto');
        }
        if (el.btnModeManual) {
            el.btnModeManual.classList.toggle('active', mode === 'manual');
        }
        
        if (mode === 'auto' && state.image) {
            fitImageToCrop();
        } else if (mode === 'manual' && state.savedPositions[state.spec]) {
            const saved = state.savedPositions[state.spec];
            state.zoom = saved.zoom;
            state.offsetX = saved.offsetX;
            state.offsetY = saved.offsetY;
            el.zoomSlider.value = saved.zoom;
            updateImageTransform();
        }
    }
    
    // Reset position
    function resetPosition() {
        state.offsetX = 0;
        state.offsetY = 0;
        state.zoom = 100;
        state.rotation = 0;
        state.flipH = false;
        el.zoomSlider.value = 100;
        
        if (el.btnFlipH) {
            el.btnFlipH.classList.remove('active');
        }
        
        if (state.image) {
            fitImageToCrop();
        }
        
        delete state.savedPositions[state.spec];
    }
    
    // Save position for manual mode
    function savePosition() {
        if (state.mode === 'manual') {
            state.savedPositions[state.spec] = {
                zoom: state.zoom,
                offsetX: state.offsetX,
                offsetY: state.offsetY
            };
        }
    }

    // Drag & Drop for upload
    function setupDragAndDrop() {
        const dropzone = el.dropzone;
        
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
            processFile(files[0]);
        }
    }

    // File handling
    function handleFileSelect(e) {
        const files = e.target.files;
        if (files.length) {
            processFile(files[0]);
        }
        e.target.value = '';
    }

    function processFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Validate image quality
                const spec = SPECS[state.spec];
                const minWidth = spec.px[0];
                const minHeight = spec.px[1];
                
                // Check if image resolution is sufficient
                if (img.width < minWidth || img.height < minHeight) {
                    const proceed = confirm(
                        `⚠️ Low Resolution Warning!\n\n` +
                        `Your image: ${img.width}×${img.height} px\n` +
                        `Required: ${minWidth}×${minHeight} px minimum\n\n` +
                        `Photo quality may be poor. Continue anyway?`
                    );
                    if (!proceed) return;
                }
                
                // Warn if image is extremely large (may cause performance issues)
                if (img.width > 6000 || img.height > 6000) {
                    alert('⚠️ Very large image detected. Processing may be slow. Consider using a smaller image (2000-4000px is optimal).');
                }
                
                state.image = {
                    element: img,
                    width: img.width,
                    height: img.height,
                    dataUrl: e.target.result
                };
                
                // Reset transform
                state.zoom = 100;
                state.rotation = 0;
                state.offsetX = 0;
                state.offsetY = 0;
                el.zoomSlider.value = 100;
                
                // Set source image
                el.sourceImage.src = e.target.result;
                
                // First show the page, then position image
                showPage('edit');
                
                // Wait for page to render, then fit image
                setTimeout(() => {
                    updateCropContainerAspectRatio();
                    fitImageToCrop();
                }, 100);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Fit image to crop area with intelligent positioning
    function fitImageToCrop() {
        if (!state.image) return;
        
        const containerW = el.cropContainer.clientWidth || 320;
        const containerH = el.cropContainer.clientHeight || 360;
        const imgW = state.image.width;
        const imgH = state.image.height;
        
        // Prevent division by zero
        if (imgW === 0 || imgH === 0) return;
        
        // Calculate image aspect ratio
        const imgAspect = imgW / imgH;
        const containerAspect = containerW / containerH;
        
        // Improved scaling algorithm
        let scale;
        if (imgAspect > containerAspect) {
            // Wide image - fit to height
            scale = containerH / imgH;
        } else {
            // Tall image or square - fit to width
            scale = containerW / imgW;
        }
        
        // Add 10% buffer for better framing (user can zoom out if needed)
        state.baseScale = scale * 1.1;
        
        // Ensure baseScale is valid
        if (!isFinite(state.baseScale) || state.baseScale <= 0) {
            state.baseScale = 0.5;
        }
        
        // Smart vertical positioning for portraits (assume face is in upper part)
        const isPortrait = imgH > imgW;
        if (isPortrait && state.mode === 'auto') {
            // Shift image up slightly to center face area (typical face is in upper 40%)
            const scaledImgH = imgH * state.baseScale;
            const excessHeight = scaledImgH - containerH;
            if (excessHeight > 0) {
                // Move up by 15% of excess to focus on face area
                state.offsetY = -excessHeight * 0.15;
            }
        } else {
            state.offsetY = 0;
        }
        
        state.zoom = 100;
        state.offsetX = 0;
        
        el.zoomSlider.min = 50;
        el.zoomSlider.max = 250;
        el.zoomSlider.value = 100;
        
        updateImageTransform();
        updateCropContainerBg();
    }

    // Image transform
    function updateImageTransform() {
        if (!state.image || !state.baseScale) return;
        
        const img = el.sourceImage;
        const containerW = el.cropContainer.clientWidth || 320;
        const containerH = el.cropContainer.clientHeight || 360;
        
        // Actual scale = base scale * zoom percentage
        const actualScale = state.baseScale * (state.zoom / 100);
        
        if (!isFinite(actualScale) || actualScale <= 0) return;
        
        const imgW = state.image.width * actualScale;
        const imgH = state.image.height * actualScale;
        
        // Center position
        const left = (containerW - imgW) / 2 + state.offsetX;
        const top = (containerH - imgH) / 2 + state.offsetY;
        
        img.style.width = imgW + 'px';
        img.style.height = imgH + 'px';
        img.style.left = left + 'px';
        img.style.top = top + 'px';
        
        // Build transform with rotation and flip
        let transform = '';
        if (state.rotation !== 0) {
            transform += `rotate(${state.rotation}deg) `;
        }
        if (state.flipH) {
            transform += 'scaleX(-1) ';
        }
        img.style.transform = transform.trim() || 'none';
    }

    // Update crop container background to white
    function updateCropContainerBg() {
        el.cropContainer.style.backgroundColor = '#ffffff';
    }

    // Zoom
    function handleZoom(e) {
        state.zoom = parseInt(e.target.value);
        updateImageTransform();
        
        // NEW: Switch to manual mode when user zooms
        if (state.mode === 'auto') {
            setMode('manual');
        }
        savePosition();
    }

    function adjustZoom(delta) {
        const current = state.zoom;
        const min = parseInt(el.zoomSlider.min);
        const max = parseInt(el.zoomSlider.max);
        const newValue = Math.max(min, Math.min(max, current + delta));
        state.zoom = newValue;
        el.zoomSlider.value = newValue;
        updateImageTransform();
        
        // NEW: Switch to manual mode when user zooms
        if (state.mode === 'auto') {
            setMode('manual');
        }
        savePosition();
    }

    function handleWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -5 : 5;
        adjustZoom(delta);
    }

    // Rotate
    function handleRotate() {
        state.rotation = (state.rotation + 90) % 360;
        updateImageTransform();
    }

    // Drag to move
    function startDrag(e) {
        state.isDragging = true;
        const point = e.touches ? e.touches[0] : e;
        state.dragStart = {
            x: point.clientX - state.offsetX,
            y: point.clientY - state.offsetY
        };
        e.preventDefault();
        
        // NEW: Switch to manual mode when user starts dragging
        if (state.mode === 'auto') {
            setMode('manual');
        }
    }

    function doDrag(e) {
        if (!state.isDragging) return;
        const point = e.touches ? e.touches[0] : e;
        state.offsetX = point.clientX - state.dragStart.x;
        state.offsetY = point.clientY - state.dragStart.y;
        updateImageTransform();
        e.preventDefault();
    }

    function endDrag() {
        if (state.isDragging) {
            state.isDragging = false;
            // NEW: Save position when drag ends
            savePosition();
        }
    }

    // Country change
    function handleCountryChange(e) {
        state.spec = e.target.value;
        updateSizeDisplay();
        updateCropContainerAspectRatio();
        updateMaxPhotosInfo();
        updateLayoutPreview();
        updateOutputInfo();
        
        // In manual mode, restore saved position for new spec if exists
        if (state.mode === 'manual' && state.savedPositions[state.spec]) {
            const saved = state.savedPositions[state.spec];
            state.zoom = saved.zoom;
            state.offsetX = saved.offsetX;
            state.offsetY = saved.offsetY;
            el.zoomSlider.value = saved.zoom;
            updateImageTransform();
        }
    }

    // Update crop container aspect ratio to match selected spec
    function updateCropContainerAspectRatio() {
        const spec = SPECS[state.spec];
        const [w, h] = spec.px;
        const aspectRatio = w / h;
        
        // Base height 360px, calculate width
        const containerH = 360;
        const containerW = Math.round(containerH * aspectRatio);
        
        el.cropContainer.style.width = containerW + 'px';
        el.cropContainer.style.height = containerH + 'px';
        
        // Refit image if loaded
        if (state.image) {
            fitImageToCrop();
        }
    }

    // Calculate max photos that fit on A4 (with print-safe margins)
    function calculateMaxPhotosOnA4() {
        const spec = SPECS[state.spec];
        const [photoW, photoH] = spec.mm;
        
        // A4 size in mm: 210 x 297
        const a4W = 210;
        const a4H = 297;
        const printMargin = 10; // 10mm print-safe margin
        const cutGap = 3; // 3mm gap for cutting
        
        const usableW = a4W - (printMargin * 2);
        const usableH = a4H - (printMargin * 2);
        
        // Calculate how many photos fit with gaps
        const cols = Math.floor((usableW + cutGap) / (photoW + cutGap));
        const rows = Math.floor((usableH + cutGap) / (photoH + cutGap));
        
        return { cols, rows, total: cols * rows };
    }

    // Generate photo
    async function generatePhoto() {
        showProcessing(true);
        
        await delay(100);
        
        const spec = SPECS[state.spec];
        const [width, height] = spec.px;
        
        // Create canvas for single photo
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Fill background
        ctx.fillStyle = state.bgColor;
        ctx.fillRect(0, 0, width, height);
        
        // Calculate crop from visible area
        const containerW = el.cropContainer.clientWidth;
        const containerH = el.cropContainer.clientHeight;
        
        const img = state.image.element;
        const scale = state.baseScale * (state.zoom / 100);
        const imgW = state.image.width * scale;
        const imgH = state.image.height * scale;
        
        // Image position in container
        const imgLeft = (containerW - imgW) / 2 + state.offsetX;
        const imgTop = (containerH - imgH) / 2 + state.offsetY;
        
        // Crop area (visible container area)
        const cropX = -imgLeft / scale;
        const cropY = -imgTop / scale;
        const cropW = containerW / scale;
        const cropH = containerH / scale;
        
        // Save context for transformations
        ctx.save();
        
        // Apply rotation and flip
        if (state.rotation !== 0 || state.flipH) {
            ctx.translate(width / 2, height / 2);
            if (state.rotation !== 0) {
                ctx.rotate(state.rotation * Math.PI / 180);
            }
            if (state.flipH) {
                ctx.scale(-1, 1);
            }
            ctx.translate(-width / 2, -height / 2);
        }
        
        // Draw image with enhanced quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Use better quality for small images (passport photos need to be sharp)
        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, width, height);
        
        ctx.restore();
        
        // Adaptive quality based on output size
        // Smaller passport photos need higher quality to maintain detail
        let quality = 0.95;
        if (width < 500 && height < 500) {
            quality = 0.98; // Higher quality for small photos
        } else if (width > 1000) {
            quality = 0.92; // Slightly lower for large to reduce file size
        }
        
        // Get blob for single photo
        const singleBlob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/jpeg', quality);
        });
        
        state.resultBlob = singleBlob;
        el.resultImage.src = URL.createObjectURL(singleBlob);
        
        // Handle output based on mode
        if (state.outputMode === 'a4') {
            // A4 paper with multiple photos
            const { canvas: printCanvas, actualCount, layout } = createPrintLayout(canvas, width, height, state.photoCount);
            // Higher quality for A4 print (0.96 for better print results)
            const printBlob = await new Promise(resolve => {
                printCanvas.toBlob(resolve, 'image/jpeg', 0.96);
            });
            state.printBlob = printBlob;
            el.resultPrintImage.src = URL.createObjectURL(printBlob);
            el.resultSingle.style.display = 'none';
            el.resultPrint.style.display = 'block';
            el.btnDownloadPrint.style.display = 'inline-flex';
            el.btnDownloadPrint.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 6 2 18 2 18 9"/>
                    <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
                    <rect x="6" y="14" width="12" height="8"/>
                </svg>
                Download A4 (${actualCount} photos)
            `;
        } else {
            // Single photo mode
            el.resultSingle.style.display = 'block';
            el.resultPrint.style.display = 'none';
            el.btnDownloadPrint.style.display = 'none';
        }
        
        // Update specs display
        el.downloadInfo.textContent = `${spec.name} • ${spec.mm[0]}×${spec.mm[1]} mm • ${spec.px[0]}×${spec.px[1]} px`;
        el.specSize.textContent = `${spec.mm[0]}×${spec.mm[1]} mm`;
        el.specResolution.textContent = `${spec.px[0]}×${spec.px[1]} px`;
        el.specDpi.textContent = spec.dpi;
        
        showProcessing(false);
        showPage('download');
    }

    // Create print layout with smart arrangement and cutting guides
    function createPrintLayout(singleCanvas, photoW, photoH, requestedCount) {
        // A4 at 300 DPI: 2480 x 3508 pixels (210mm x 297mm)
        const a4W = 2480;
        const a4H = 3508;
        const dpi = 300;
        const mmToPx = dpi / 25.4;
        
        const canvas = document.createElement('canvas');
        canvas.width = a4W;
        canvas.height = a4H;
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, a4W, a4H);
        
        // Get spec for actual mm dimensions
        const spec = SPECS[state.spec];
        const photoMmW = spec.mm[0];
        const photoMmH = spec.mm[1];
        
        // Calculate photo size in pixels at 300dpi
        const photoPxW = Math.round(photoMmW * mmToPx);
        const photoPxH = Math.round(photoMmH * mmToPx);
        
        // Print-safe margins (10mm from edges - most printers can't print edge-to-edge)
        const printMargin = Math.round(10 * mmToPx); // 10mm margin
        const usableW = a4W - (printMargin * 2);
        const usableH = a4H - (printMargin * 2);
        
        // Gap between photos for easy cutting (3mm gap)
        const cutGap = Math.round(3 * mmToPx);
        
        // Calculate how many photos fit with the gaps
        const maxCols = Math.floor((usableW + cutGap) / (photoPxW + cutGap));
        const maxRows = Math.floor((usableH + cutGap) / (photoPxH + cutGap));
        
        // Use optimal layout
        const layout = calculateOptimalLayout(requestedCount);
        let cols = Math.min(layout.cols, maxCols);
        let rows = Math.min(layout.rows, maxRows);
        const actualCount = Math.min(requestedCount, cols * rows);
        
        // Recalculate rows needed for actual count
        rows = Math.ceil(actualCount / cols);
        
        // Calculate total grid size
        const totalGridW = cols * photoPxW + (cols - 1) * cutGap;
        const totalGridH = rows * photoPxH + (rows - 1) * cutGap;
        
        // Start from top (horizontally centered, vertically from top)
        const startX = printMargin + (usableW - totalGridW) / 2;
        const startY = printMargin; // Start from top, not centered
        
        // Draw light cutting guide lines (dashed gray lines between photos)
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.setLineDash([10, 5]);
        
        // Vertical cutting lines
        for (let c = 1; c < cols; c++) {
            const lineX = startX + c * photoPxW + (c - 0.5) * cutGap;
            ctx.beginPath();
            ctx.moveTo(lineX, startY - 5);
            ctx.lineTo(lineX, startY + totalGridH + 5);
            ctx.stroke();
        }
        
        // Horizontal cutting lines
        for (let r = 1; r < rows; r++) {
            const lineY = startY + r * photoPxH + (r - 0.5) * cutGap;
            ctx.beginPath();
            ctx.moveTo(startX - 5, lineY);
            ctx.lineTo(startX + totalGridW + 5, lineY);
            ctx.stroke();
        }
        
        ctx.setLineDash([]); // Reset to solid lines
        
        // Draw small corner marks for precise cutting
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        const markLen = Math.round(2 * mmToPx); // 2mm corner marks
        
        // Draw photos with corner cutting marks
        let count = 0;
        for (let r = 0; r < rows && count < actualCount; r++) {
            for (let c = 0; c < cols && count < actualCount; c++) {
                const x = startX + c * (photoPxW + cutGap);
                const y = startY + r * (photoPxH + cutGap);
                
                // Draw corner cutting marks
                // Top-left
                ctx.beginPath();
                ctx.moveTo(x - cutGap/2, y);
                ctx.lineTo(x - cutGap/2 + markLen, y);
                ctx.moveTo(x, y - cutGap/2);
                ctx.lineTo(x, y - cutGap/2 + markLen);
                ctx.stroke();
                
                // Top-right
                ctx.beginPath();
                ctx.moveTo(x + photoPxW + cutGap/2, y);
                ctx.lineTo(x + photoPxW + cutGap/2 - markLen, y);
                ctx.moveTo(x + photoPxW, y - cutGap/2);
                ctx.lineTo(x + photoPxW, y - cutGap/2 + markLen);
                ctx.stroke();
                
                // Bottom-left
                ctx.beginPath();
                ctx.moveTo(x - cutGap/2, y + photoPxH);
                ctx.lineTo(x - cutGap/2 + markLen, y + photoPxH);
                ctx.moveTo(x, y + photoPxH + cutGap/2);
                ctx.lineTo(x, y + photoPxH + cutGap/2 - markLen);
                ctx.stroke();
                
                // Bottom-right
                ctx.beginPath();
                ctx.moveTo(x + photoPxW + cutGap/2, y + photoPxH);
                ctx.lineTo(x + photoPxW + cutGap/2 - markLen, y + photoPxH);
                ctx.moveTo(x + photoPxW, y + photoPxH + cutGap/2);
                ctx.lineTo(x + photoPxW, y + photoPxH + cutGap/2 - markLen);
                ctx.stroke();
                
                // Draw photo with high quality scaling
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(singleCanvas, x, y, photoPxW, photoPxH);
                count++;
            }
        }
        
        return { canvas, actualCount, layout: { cols, rows } };
    }

    // Download
    function downloadPhoto() {
        if (!state.resultBlob) return;
        const url = URL.createObjectURL(state.resultBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `passport-photo-${state.spec}.jpg`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function downloadPrintLayout() {
        if (!state.printBlob) return;
        const url = URL.createObjectURL(state.printBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `passport-photos-a4-${state.photoCount}pcs.jpg`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Reset
    function resetToUpload() {
        state.image = null;
        state.resultBlob = null;
        state.printBlob = null;
        el.sourceImage.src = '';
        el.resultImage.src = '';
        showPage('upload');
    }

    // Page navigation
    function showPage(page) {
        state.currentPage = page; // Track current page for back navigation
        
        el.pageUpload.classList.remove('active');
        el.pageEdit.classList.remove('active');
        el.pageDownload.classList.remove('active');
        
        switch(page) {
            case 'upload': el.pageUpload.classList.add('active'); break;
            case 'edit': el.pageEdit.classList.add('active'); break;
            case 'download': el.pageDownload.classList.add('active'); break;
        }
    }
    
    // Back button handler - navigate within tool flow
    function handleBackButton() {
        switch(state.currentPage) {
            case 'download':
                showPage('edit');
                break;
            case 'edit':
                showPage('upload');
                break;
            case 'upload':
            default:
                window.location.href = 'index.html';
                break;
        }
    }
    
    // Custom size toggle
    function toggleCustomSize() {
        state.customSizeActive = !state.customSizeActive;
        
        if (el.customSizePanel) {
            el.customSizePanel.style.display = state.customSizeActive ? 'block' : 'none';
        }
        if (el.btnCustomSize) {
            el.btnCustomSize.textContent = state.customSizeActive ? '✕ Close' : 'Custom Size';
        }
        
        // Pre-fill with current spec dimensions
        if (state.customSizeActive && el.customWidth && el.customHeight) {
            const spec = SPECS[state.spec];
            el.customWidth.value = spec.mm[0];
            el.customHeight.value = spec.mm[1];
        }
    }
    
    // Apply custom size
    function applyCustomSize() {
        const width = parseFloat(el.customWidth?.value) || 35;
        const height = parseFloat(el.customHeight?.value) || 45;
        
        // Validate
        if (width < 10 || width > 200 || height < 10 || height > 200) {
            alert('Size must be between 10mm and 200mm');
            return;
        }
        
        // Update custom spec
        const dpi = 300;
        SPECS['custom'] = {
            name: 'Custom Size',
            mm: [width, height],
            px: [Math.round(width * dpi / 25.4), Math.round(height * dpi / 25.4)],
            dpi: dpi
        };
        
        // Set to custom spec
        state.spec = 'custom';
        
        // Update size display
        updateSizeDisplay();
        
        // Update crop aspect ratio
        updateCropAspectRatio();
        
        // Close panel
        state.customSizeActive = false;
        if (el.customSizePanel) el.customSizePanel.style.display = 'none';
        if (el.btnCustomSize) el.btnCustomSize.textContent = 'Custom Size';
        
        // Update max photos for A4
        updateMaxPhotosInfo();
    }
    
    // Update size display
    function updateSizeDisplay() {
        const spec = SPECS[state.spec];
        
        // Update size boxes
        const sizeMm = document.getElementById('size-mm');
        const sizePx = document.getElementById('size-px');
        
        if (sizeMm) sizeMm.textContent = `${spec.mm[0]} × ${spec.mm[1]} mm`;
        if (sizePx) sizePx.textContent = `${spec.px[0]} × ${spec.px[1]} px`;
    }
    
    // Update crop aspect ratio when size changes
    function updateCropAspectRatio() {
        const spec = SPECS[state.spec];
        state.aspectRatio = spec.mm[0] / spec.mm[1];
        
        // Recalculate crop area with new aspect ratio
        if (state.img) {
            const containerRect = el.cropContainer.getBoundingClientRect();
            const containerW = containerRect.width;
            const containerH = containerRect.height;
            
            // Calculate crop size maintaining aspect ratio
            let cropW, cropH;
            if (containerW / containerH > state.aspectRatio) {
                cropH = containerH * 0.8;
                cropW = cropH * state.aspectRatio;
            } else {
                cropW = containerW * 0.8;
                cropH = cropW / state.aspectRatio;
            }
            
            state.cropW = cropW;
            state.cropH = cropH;
            state.cropX = (containerW - cropW) / 2;
            state.cropY = (containerH - cropH) / 2;
            
            // Update crop area element
            const cropArea = el.cropContainer.querySelector('.crop-area');
            if (cropArea) {
                cropArea.style.width = cropW + 'px';
                cropArea.style.height = cropH + 'px';
                cropArea.style.left = state.cropX + 'px';
                cropArea.style.top = state.cropY + 'px';
            }
        }
    }

    // Processing overlay
    function showProcessing(show) {
        el.processing.classList.toggle('active', show);
    }

    // Utility
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


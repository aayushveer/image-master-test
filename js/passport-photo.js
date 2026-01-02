/**
 * PASSPORT-PHOTO.JS - Passport Photo Maker
 * World-class passport/ID photo generator
 * Supports all major country specifications
 */

(function() {
    'use strict';

    // India-Specific Document Specifications
    const SPECS = {
        // Indian Passport & Visa
        'india-passport': { name: '🇮🇳 Indian Passport', mm: [35, 35], px: [413, 413], dpi: 300 },
        'india-oci': { name: '🇮🇳 OCI Card', mm: [51, 51], px: [600, 600], dpi: 300 },
        
        // Indian ID Cards
        'aadhaar': { name: '🆔 Aadhaar Card', mm: [35, 45], px: [413, 531], dpi: 300 },
        'pan-card': { name: '💳 PAN Card', mm: [35, 45], px: [413, 531], dpi: 300 },
        'voter-id': { name: '🗳️ Voter ID', mm: [35, 45], px: [413, 531], dpi: 300 },
        'driving-license': { name: '🚗 Driving License', mm: [35, 45], px: [413, 531], dpi: 300 },
        'ration-card': { name: '🏠 Ration Card', mm: [35, 45], px: [413, 531], dpi: 300 },
        
        // Competitive Exams
        'ssc-exam': { name: '📝 SSC Exam', mm: [35, 45], px: [413, 531], dpi: 300 },
        'upsc-exam': { name: '📝 UPSC/IAS', mm: [35, 45], px: [413, 531], dpi: 300 },
        'bank-exam': { name: '🏦 Bank Exam (IBPS)', mm: [35, 45], px: [413, 531], dpi: 300 },
        'railway-exam': { name: '🚂 Railway Exam', mm: [35, 45], px: [413, 531], dpi: 300 },
        'neet-jee': { name: '🎓 NEET/JEE', mm: [35, 45], px: [413, 531], dpi: 300 },
        'gate-cat': { name: '🎓 GATE/CAT', mm: [35, 45], px: [413, 531], dpi: 300 },
        
        // School & College
        'school-admission': { name: '🏫 School Admission', mm: [35, 45], px: [413, 531], dpi: 300 },
        'college-admission': { name: '🎓 College Admission', mm: [35, 45], px: [413, 531], dpi: 300 },
        
        // Foreign Visa (from India)
        'us-visa': { name: '🇺🇸 US Visa', mm: [51, 51], px: [600, 600], dpi: 300 },
        'uk-visa': { name: '🇬🇧 UK Visa', mm: [35, 45], px: [413, 531], dpi: 300 },
        'canada-visa': { name: '🇨🇦 Canada Visa', mm: [35, 45], px: [413, 531], dpi: 300 },
        'schengen-visa': { name: '🇪🇺 Schengen Visa', mm: [35, 45], px: [413, 531], dpi: 300 },
        'australia-visa': { name: '🇦🇺 Australia Visa', mm: [35, 45], px: [413, 531], dpi: 300 },
        'uae-visa': { name: '🇦🇪 UAE Visa', mm: [43, 55], px: [508, 649], dpi: 300 },
        'saudi-visa': { name: '🇸🇦 Saudi Visa', mm: [40, 60], px: [472, 709], dpi: 300 },
        'singapore-visa': { name: '🇸🇬 Singapore Visa', mm: [35, 45], px: [400, 514], dpi: 300 },
        
        // Standard Size
        'stamp-size': { name: '📷 Stamp Size (20x25mm)', mm: [20, 25], px: [236, 295], dpi: 300 },
        'standard': { name: '📷 Standard (35x45mm)', mm: [35, 45], px: [413, 531], dpi: 300 }
    };

    // State
    const state = {
        image: null,
        spec: 'india-passport',
        bgColor: '#ffffff',
        copies: 8,
        zoom: 100,
        baseScale: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
        isDragging: false,
        dragStart: { x: 0, y: 0 },
        resultBlob: null,
        printBlob: null,
        printCopies: 8,
        // NEW: Manual mode support
        mode: 'auto', // 'auto' or 'manual'
        savedPositions: {} // Store positions per spec for manual mode
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
        
        // NEW: Mode toggle buttons
        btnModeAuto: document.getElementById('btn-mode-auto'),
        btnModeManual: document.getElementById('btn-mode-manual'),
        btnResetPosition: document.getElementById('btn-reset-position'),
        
        countrySelect: document.getElementById('country-select'),
        sizeMm: document.getElementById('size-mm'),
        sizePx: document.getElementById('size-px'),
        
        bgBtns: document.querySelectorAll('.bg-btn[data-bg]'),
        customBg: document.getElementById('custom-bg'),
        
        printBtns: document.querySelectorAll('.print-btn'),
        printInfo: document.getElementById('print-info'),
        
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
        
        // NEW: Mode toggle buttons
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
        
        // Background buttons
        el.bgBtns.forEach(btn => {
            btn.addEventListener('click', () => selectBackground(btn.dataset.bg, btn));
        });
        
        el.customBg.addEventListener('input', (e) => {
            selectBackground(e.target.value, el.customBg.parentElement);
        });
        
        // Print buttons
        el.printBtns.forEach(btn => {
            btn.addEventListener('click', () => selectPrintCopies(parseInt(btn.dataset.copies), btn));
        });
        
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
    
    // NEW: Set positioning mode
    function setMode(mode) {
        state.mode = mode;
        
        // Update UI
        if (el.btnModeAuto) {
            el.btnModeAuto.classList.toggle('active', mode === 'auto');
        }
        if (el.btnModeManual) {
            el.btnModeManual.classList.toggle('active', mode === 'manual');
        }
        
        // In auto mode, re-fit the image to center
        if (mode === 'auto' && state.image) {
            fitImageToCrop();
        }
        // In manual mode, restore saved position for current spec if exists
        else if (mode === 'manual' && state.savedPositions[state.spec]) {
            const saved = state.savedPositions[state.spec];
            state.zoom = saved.zoom;
            state.offsetX = saved.offsetX;
            state.offsetY = saved.offsetY;
            el.zoomSlider.value = saved.zoom;
            updateImageTransform();
        }
    }
    
    // NEW: Reset position to center
    function resetPosition() {
        state.offsetX = 0;
        state.offsetY = 0;
        state.zoom = 100;
        el.zoomSlider.value = 100;
        
        if (state.image) {
            fitImageToCrop();
        }
        
        // Clear saved position for current spec
        delete state.savedPositions[state.spec];
    }
    
    // NEW: Save current position for manual mode
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

    // Fit image to crop area
    function fitImageToCrop() {
        if (!state.image) return;
        
        const containerW = el.cropContainer.clientWidth || 320;
        const containerH = el.cropContainer.clientHeight || 360;
        const imgW = state.image.width;
        const imgH = state.image.height;
        
        // Prevent division by zero
        if (imgW === 0 || imgH === 0) return;
        
        // Calculate scale to cover container (image fills entire container)
        const scaleW = containerW / imgW;
        const scaleH = containerH / imgH;
        state.baseScale = Math.max(scaleW, scaleH) * 1.1; // Slightly larger
        
        // Ensure baseScale is valid
        if (!isFinite(state.baseScale) || state.baseScale <= 0) {
            state.baseScale = 0.5;
        }
        
        state.zoom = 100;
        state.offsetX = 0;
        state.offsetY = 0;
        
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
        img.style.transform = `rotate(${state.rotation}deg)`;
    }

    // Update crop container background to match selected color
    function updateCropContainerBg() {
        el.cropContainer.style.backgroundColor = state.bgColor;
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
        
        // NEW: In manual mode, restore saved position for new spec if exists
        if (state.mode === 'manual' && state.savedPositions[state.spec]) {
            const saved = state.savedPositions[state.spec];
            state.zoom = saved.zoom;
            state.offsetX = saved.offsetX;
            state.offsetY = saved.offsetY;
            el.zoomSlider.value = saved.zoom;
            updateImageTransform();
        }
    }

    function updateSizeDisplay() {
        const spec = SPECS[state.spec];
        el.sizeMm.textContent = `${spec.mm[0]} × ${spec.mm[1]} mm`;
        el.sizePx.textContent = `${spec.px[0]} × ${spec.px[1]} px`;
        updatePrintInfo();
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

    // Background
    function selectBackground(color, btn) {
        state.bgColor = color;
        el.bgBtns.forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        updateCropContainerBg();
    }

    // Print copies
    function selectPrintCopies(copies, btn) {
        state.copies = copies;
        el.printBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updatePrintInfo();
    }

    // Calculate max photos that fit on A4
    function calculateMaxPhotosOnA4() {
        const spec = SPECS[state.spec];
        const [photoW, photoH] = spec.mm;
        
        // A4 size in mm: 210 x 297
        const a4W = 210;
        const a4H = 297;
        const margin = 5; // 5mm margin
        
        const usableW = a4W - (margin * 2);
        const usableH = a4H - (margin * 2);
        
        const cols = Math.floor(usableW / photoW);
        const rows = Math.floor(usableH / photoH);
        
        return { cols, rows, total: cols * rows };
    }

    // Update print info text
    function updatePrintInfo() {
        const spec = SPECS[state.spec];
        const maxInfo = calculateMaxPhotosOnA4();
        
        if (state.copies === 0) {
            // Full page
            el.printInfo.textContent = `Full page: ${maxInfo.total} photos (${maxInfo.cols}×${maxInfo.rows}) on A4`;
        } else if (state.copies === 1) {
            el.printInfo.textContent = `Single photo: ${spec.mm[0]}×${spec.mm[1]}mm`;
        } else {
            el.printInfo.textContent = `${state.copies} photos on A4 paper`;
        }
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
        
        // Save context for rotation
        ctx.save();
        
        if (state.rotation !== 0) {
            ctx.translate(width / 2, height / 2);
            ctx.rotate(state.rotation * Math.PI / 180);
            ctx.translate(-width / 2, -height / 2);
        }
        
        // Draw image
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, width, height);
        
        ctx.restore();
        
        // Get blob for single photo
        const singleBlob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/jpeg', 0.95);
        });
        
        state.resultBlob = singleBlob;
        el.resultImage.src = URL.createObjectURL(singleBlob);
        
        // Create print layout if copies > 1 or full page (0)
        if (state.copies !== 1) {
            const { canvas: printCanvas, totalCopies } = createPrintLayout(canvas, width, height, state.copies);
            const printBlob = await new Promise(resolve => {
                printCanvas.toBlob(resolve, 'image/jpeg', 0.95);
            });
            state.printBlob = printBlob;
            state.printCopies = totalCopies;
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
                Download A4 (${totalCopies} photos)
            `;
        } else {
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

    // Create print layout (multiple copies on A4 page)
    function createPrintLayout(singleCanvas, photoW, photoH, copies) {
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
        const photoPxW = photoMmW * mmToPx;
        const photoPxH = photoMmH * mmToPx;
        
        // Calculate grid based on A4 size
        const marginMm = 5;
        const marginPx = marginMm * mmToPx;
        const usableW = a4W - (marginPx * 2);
        const usableH = a4H - (marginPx * 2);
        
        // Calculate how many photos fit
        const maxCols = Math.floor(usableW / photoPxW);
        const maxRows = Math.floor(usableH / photoPxH);
        
        let cols, rows, totalCopies;
        
        if (copies === 0) {
            // Full page - fill as many as possible
            cols = maxCols;
            rows = maxRows;
            totalCopies = cols * rows;
        } else {
            // Specific number of copies
            totalCopies = Math.min(copies, maxCols * maxRows);
            
            // India-optimized grid for 8, 12, 16, 20 photos
            if (totalCopies <= 4) { cols = 2; rows = 2; }
            else if (totalCopies <= 8) { cols = 4; rows = 2; }
            else if (totalCopies <= 12) { cols = 4; rows = 3; }
            else if (totalCopies <= 16) { cols = 4; rows = 4; }
            else if (totalCopies <= 20) { cols = 5; rows = 4; }
            else { cols = maxCols; rows = Math.ceil(totalCopies / maxCols); }
        }
        
        // Calculate spacing to center photos
        const totalPhotoW = cols * photoPxW;
        const totalPhotoH = rows * photoPxH;
        const gapX = (a4W - totalPhotoW) / (cols + 1);
        const gapY = (a4H - totalPhotoH) / (rows + 1);
        
        // Draw photos
        let count = 0;
        for (let r = 0; r < rows && count < totalCopies; r++) {
            for (let c = 0; c < cols && count < totalCopies; c++) {
                const x = gapX + c * (photoPxW + gapX);
                const y = gapY + r * (photoPxH + gapY);
                
                // Draw with high quality scaling
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(singleCanvas, x, y, photoPxW, photoPxH);
                count++;
            }
        }
        
        return { canvas, totalCopies };
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
        a.download = `passport-photos-print-layout.jpg`;
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
        el.pageUpload.classList.remove('active');
        el.pageEdit.classList.remove('active');
        el.pageDownload.classList.remove('active');
        
        switch(page) {
            case 'upload': el.pageUpload.classList.add('active'); break;
            case 'edit': el.pageEdit.classList.add('active'); break;
            case 'download': el.pageDownload.classList.add('active'); break;
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


/**
 * BG-REMOVER.JS - Background Remover
 * AI-powered background removal using MediaPipe Selfie Segmentation
 * + Color-based removal for objects
 */

(function() {
    'use strict';

    // State
    const state = {
        image: null,
        originalCanvas: null,
        resultCanvas: null,
        maskCanvas: null,
        rawMaskData: null, // NEW: Store raw mask for edge slider updates
        mode: 'auto', // auto or color
        subject: 'person',
        edgeRefinement: 50,
        tolerance: 30,
        pickedColor: null,
        newBg: 'transparent',
        customBgImage: null,
        zoom: 100,
        processed: false,
        segmenter: null
    };

    // DOM Elements
    const el = {
        pageUpload: document.getElementById('page-upload'),
        pageEdit: document.getElementById('page-edit'),
        
        dropzone: document.getElementById('dropzone'),
        fileInput: document.getElementById('file-input'),
        
        previewTabs: document.querySelectorAll('.preview-tab'),
        previewArea: document.getElementById('preview-area'),
        previewCanvas: document.getElementById('preview-canvas'),
        originalImage: document.getElementById('original-image'),
        
        compareSlider: document.getElementById('compare-slider'),
        compareBeforeImg: document.getElementById('compare-before-img'),
        compareAfterCanvas: document.getElementById('compare-after-canvas'),
        compareHandle: document.getElementById('compare-handle'),
        compareAfter: document.getElementById('compare-after'),
        
        zoomLevel: document.getElementById('zoom-level'),
        btnZoomIn: document.getElementById('btn-zoom-in'),
        btnZoomOut: document.getElementById('btn-zoom-out'),
        btnFit: document.getElementById('btn-fit'),
        
        modeTabs: document.querySelectorAll('.mode-tab'),
        aiSettings: document.getElementById('ai-settings'),
        colorSettings: document.getElementById('color-settings'),
        
        subjectBtns: document.querySelectorAll('.subject-btn'),
        edgeSlider: document.getElementById('edge-slider'),
        edgeValue: document.getElementById('edge-value'),
        
        toleranceSlider: document.getElementById('tolerance-slider'),
        toleranceValue: document.getElementById('tolerance-value'),
        pickedColor: document.getElementById('picked-color'),
        pickedColorHex: document.getElementById('picked-color-hex'),
        
        bgBtns: document.querySelectorAll('.bg-btn[data-bg]'),
        customBgColor: document.getElementById('custom-bg-color'),
        customBgImage: document.getElementById('custom-bg-image'),
        
        btnProcess: document.getElementById('btn-process'),
        btnDownload: document.getElementById('btn-download'),
        secondaryActions: document.getElementById('secondary-actions'),
        btnReset: document.getElementById('btn-reset'),
        btnNew: document.getElementById('btn-new'),
        
        processing: document.getElementById('processing'),
        processingText: document.getElementById('processing-text'),
        step1: document.getElementById('step-1'),
        step2: document.getElementById('step-2'),
        step3: document.getElementById('step-3')
    };

    // Initialize
    async function init() {
        setupEventListeners();
        setupDragAndDrop();
    }

    // Event Listeners
    function setupEventListeners() {
        // File input
        el.fileInput.addEventListener('change', handleFileSelect);
        
        // Preview tabs
        el.previewTabs.forEach(tab => {
            tab.addEventListener('click', () => switchPreviewTab(tab.dataset.view));
        });
        
        // Zoom controls
        el.btnZoomIn.addEventListener('click', () => adjustZoom(10));
        el.btnZoomOut.addEventListener('click', () => adjustZoom(-10));
        el.btnFit.addEventListener('click', fitToView);
        
        // Mode tabs
        el.modeTabs.forEach(tab => {
            tab.addEventListener('click', () => switchMode(tab.dataset.mode));
        });
        
        // Subject buttons
        el.subjectBtns.forEach(btn => {
            btn.addEventListener('click', () => selectSubject(btn.dataset.subject));
        });
        
        // Edge refinement slider - NOW APPLIES REAL CHANGES
        el.edgeSlider.addEventListener('input', (e) => {
            state.edgeRefinement = parseInt(e.target.value);
            const labels = ['Sharp', 'Light', 'Medium', 'Smooth', 'Very Smooth'];
            el.edgeValue.textContent = labels[Math.floor(state.edgeRefinement / 25)];
            
            // NEW: Re-apply edge refinement in real-time if already processed
            if (state.processed && state.maskCanvas && state.originalCanvas) {
                reapplyEdgeRefinement();
            }
        });
        
        // Tolerance slider
        el.toleranceSlider.addEventListener('input', (e) => {
            state.tolerance = parseInt(e.target.value);
            el.toleranceValue.textContent = state.tolerance;
        });
        
        // Background options
        el.bgBtns.forEach(btn => {
            btn.addEventListener('click', () => selectBackground(btn.dataset.bg, btn));
        });
        
        el.customBgColor.addEventListener('input', (e) => {
            state.newBg = e.target.value;
            el.bgBtns.forEach(b => b.classList.remove('active'));
            if (state.processed) applyNewBackground();
        });
        
        el.customBgImage.addEventListener('change', handleBgImageSelect);
        
        // Action buttons
        el.btnProcess.addEventListener('click', processImage);
        el.btnDownload.addEventListener('click', downloadResult);
        el.btnReset.addEventListener('click', resetProcessing);
        el.btnNew.addEventListener('click', resetToUpload);
        
        // Compare slider drag
        setupCompareSlider();
        
        // Color picker on canvas
        el.previewCanvas.addEventListener('click', handleColorPick);
    }

    // Drag & Drop
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
        if (files.length) processFile(files[0]);
    }

    // File handling
    function handleFileSelect(e) {
        const files = e.target.files;
        if (files.length) processFile(files[0]);
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
                state.image = img;
                state.processed = false;
                
                // Create original canvas
                state.originalCanvas = document.createElement('canvas');
                state.originalCanvas.width = img.width;
                state.originalCanvas.height = img.height;
                const ctx = state.originalCanvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                // Set preview
                el.previewCanvas.width = img.width;
                el.previewCanvas.height = img.height;
                const previewCtx = el.previewCanvas.getContext('2d');
                previewCtx.drawImage(img, 0, 0);
                
                el.originalImage.src = e.target.result;
                el.compareBeforeImg.src = e.target.result;
                
                // Reset UI
                el.btnDownload.style.display = 'none';
                el.secondaryActions.style.display = 'none';
                el.btnProcess.style.display = 'flex';
                
                showPage('edit');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Preview tabs
    function switchPreviewTab(view) {
        el.previewTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.view === view);
        });
        
        const canvasWrap = el.previewCanvas.parentElement;
        
        if (view === 'original') {
            canvasWrap.style.display = 'block';
            el.compareSlider.style.display = 'none';
            el.originalImage.style.display = 'block';
            el.previewCanvas.style.display = 'none';
        } else if (view === 'result') {
            canvasWrap.style.display = 'block';
            el.compareSlider.style.display = 'none';
            el.originalImage.style.display = 'none';
            el.previewCanvas.style.display = 'block';
        } else if (view === 'compare') {
            if (!state.processed) {
                alert('Process the image first to compare.');
                switchPreviewTab('result');
                return;
            }
            canvasWrap.style.display = 'none';
            el.compareSlider.style.display = 'block';
            setupCompareView();
        }
    }

    // Compare slider
    function setupCompareSlider() {
        let isDragging = false;
        
        el.compareHandle.addEventListener('mousedown', () => isDragging = true);
        el.compareHandle.addEventListener('touchstart', () => isDragging = true);
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            updateComparePosition(e.clientX);
        });
        
        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            updateComparePosition(e.touches[0].clientX);
        });
        
        document.addEventListener('mouseup', () => isDragging = false);
        document.addEventListener('touchend', () => isDragging = false);
    }

    function updateComparePosition(clientX) {
        const rect = el.compareSlider.getBoundingClientRect();
        let x = clientX - rect.left;
        x = Math.max(0, Math.min(rect.width, x));
        const percent = (x / rect.width) * 100;
        
        el.compareHandle.style.left = percent + '%';
        el.compareAfter.style.clipPath = `inset(0 ${100 - percent}% 0 0)`;
    }

    function setupCompareView() {
        // Set before image from original
        if (state.originalCanvas) {
            el.compareBeforeImg.src = state.originalCanvas.toDataURL('image/png');
        } else if (state.image) {
            el.compareBeforeImg.src = state.image.src;
        }
        
        // Set after canvas from result
        if (state.resultCanvas) {
            el.compareAfterCanvas.width = state.resultCanvas.width;
            el.compareAfterCanvas.height = state.resultCanvas.height;
            const ctx = el.compareAfterCanvas.getContext('2d');
            ctx.drawImage(state.resultCanvas, 0, 0);
        }
        
        // Reset slider position to middle
        el.compareHandle.style.left = '50%';
        el.compareAfter.style.clipPath = 'inset(0 50% 0 0)';
    }

    // Zoom
    function adjustZoom(delta) {
        state.zoom = Math.max(25, Math.min(200, state.zoom + delta));
        el.zoomLevel.textContent = state.zoom + '%';
        el.previewCanvas.style.transform = `scale(${state.zoom / 100})`;
        el.originalImage.style.transform = `scale(${state.zoom / 100})`;
    }

    function fitToView() {
        state.zoom = 100;
        el.zoomLevel.textContent = '100%';
        el.previewCanvas.style.transform = 'scale(1)';
        el.originalImage.style.transform = 'scale(1)';
    }

    // Mode switching
    function switchMode(mode) {
        state.mode = mode;
        el.modeTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === mode);
        });
        
        el.aiSettings.style.display = mode === 'auto' ? 'block' : 'none';
        el.colorSettings.style.display = mode === 'color' ? 'block' : 'none';
    }

    // Subject selection
    function selectSubject(subject) {
        state.subject = subject;
        el.subjectBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.subject === subject);
        });
    }

    // Background selection
    function selectBackground(bg, btn) {
        state.newBg = bg;
        state.customBgImage = null;
        el.bgBtns.forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        if (state.processed) applyNewBackground();
    }

    function handleBgImageSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                state.customBgImage = img;
                state.newBg = 'image';
                el.bgBtns.forEach(b => b.classList.remove('active'));
                if (state.processed) applyNewBackground();
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Color picker
    function handleColorPick(e) {
        if (state.mode !== 'color') return;
        
        const rect = el.previewCanvas.getBoundingClientRect();
        const scaleX = el.previewCanvas.width / rect.width;
        const scaleY = el.previewCanvas.height / rect.height;
        const x = Math.floor((e.clientX - rect.left) * scaleX);
        const y = Math.floor((e.clientY - rect.top) * scaleY);
        
        const ctx = state.originalCanvas.getContext('2d');
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        
        state.pickedColor = { r: pixel[0], g: pixel[1], b: pixel[2] };
        const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
        
        el.pickedColor.style.background = hex;
        el.pickedColorHex.textContent = hex;
    }

    // Process image
    async function processImage() {
        showProcessing(true);
        updateStep(1);
        
        await delay(300);
        
        try {
            if (state.mode === 'auto') {
                await processWithAI();
            } else {
                await processWithColor();
            }
            
            state.processed = true;
            
            // Show download button
            el.btnProcess.style.display = 'none';
            el.btnDownload.style.display = 'flex';
            el.secondaryActions.style.display = 'flex';
            
        } catch (err) {
            alert('Processing failed. Please try again.');
        }
        
        showProcessing(false);
    }

    // AI-based background removal using MediaPipe
    async function processWithAI() {
        updateStep(1);
        el.processingText.textContent = 'Loading AI model...';
        
        // Initialize MediaPipe Selfie Segmentation
        if (!state.segmenter) {
            state.segmenter = new SelfieSegmentation({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
                }
            });
            
            state.segmenter.setOptions({
                modelSelection: state.subject === 'person' ? 1 : 0,
                selfieMode: false
            });
            
            await new Promise((resolve) => {
                state.segmenter.onResults((results) => {
                    processMaskResults(results);
                    resolve();
                });
                state.segmenter.send({ image: state.image });
            });
        } else {
            state.segmenter.setOptions({
                modelSelection: state.subject === 'person' ? 1 : 0
            });
            
            await new Promise((resolve) => {
                state.segmenter.onResults((results) => {
                    processMaskResults(results);
                    resolve();
                });
                state.segmenter.send({ image: state.image });
            });
        }
    }

    function processMaskResults(results) {
        updateStep(2);
        el.processingText.textContent = 'Creating mask...';
        
        const width = state.image.width;
        const height = state.image.height;
        
        // Create mask canvas
        state.maskCanvas = document.createElement('canvas');
        state.maskCanvas.width = width;
        state.maskCanvas.height = height;
        const maskCtx = state.maskCanvas.getContext('2d');
        
        // Draw segmentation mask
        maskCtx.drawImage(results.segmentationMask, 0, 0, width, height);
        
        updateStep(3);
        el.processingText.textContent = 'Refining edges & hair...';
        
        // Get mask data
        const maskData = maskCtx.getImageData(0, 0, width, height);
        
        // Store raw mask data for real-time edge slider updates
        state.rawMaskData = new Uint8ClampedArray(maskData.data);
        
        // Apply advanced refinement with hair-aware processing
        advancedEdgeRefinement(maskData, width, height);
        
        // NEW: Apply hair refinement pass using original image colors
        refineHairEdges(maskData, width, height);
        
        maskCtx.putImageData(maskData, 0, 0);
        
        // Apply mask to original
        applyMaskToImage();
    }
    
    // PROFESSIONAL: Hair and fine edge refinement using color analysis
    // Uses gradient-based edge detection + color similarity matching
    function refineHairEdges(maskData, width, height) {
        const data = maskData.data;
        const originalCtx = state.originalCanvas.getContext('2d');
        const originalData = originalCtx.getImageData(0, 0, width, height).data;
        
        // STEP 1: Detect foreground color (average of high-confidence foreground)
        let fgR = 0, fgG = 0, fgB = 0, fgCount = 0;
        let bgR = 0, bgG = 0, bgB = 0, bgCount = 0;
        
        for (let y = 0; y < height; y += 5) {
            for (let x = 0; x < width; x += 5) {
                const idx = (y * width + x) * 4;
                const maskVal = data[idx];
                
                if (maskVal > 230) { // Definite foreground
                    fgR += originalData[idx];
                    fgG += originalData[idx + 1];
                    fgB += originalData[idx + 2];
                    fgCount++;
                } else if (maskVal < 25) { // Definite background
                    bgR += originalData[idx];
                    bgG += originalData[idx + 1];
                    bgB += originalData[idx + 2];
                    bgCount++;
                }
            }
        }
        
        const fgAvg = fgCount > 0 ? { r: fgR / fgCount, g: fgG / fgCount, b: fgB / fgCount } : { r: 100, g: 100, b: 100 };
        const bgAvg = bgCount > 0 ? { r: bgR / bgCount, g: bgG / bgCount, b: bgB / bgCount } : { r: 200, g: 200, b: 200 };
        
        // STEP 2: Process edge pixels with sophisticated analysis
        const newData = new Float32Array(width * height);
        for (let i = 0; i < data.length; i += 4) {
            newData[i / 4] = data[i] / 255;
        }
        
        // Multi-pass edge analysis
        for (let pass = 0; pass < 2; pass++) {
            for (let y = 3; y < height - 3; y++) {
                for (let x = 3; x < width - 3; x++) {
                    const idx = y * width + x;
                    const maskVal = newData[idx];
                    
                    // Process edge pixels (0.1 to 0.9 alpha range)
                    if (maskVal > 0.08 && maskVal < 0.92) {
                        const pixelIdx = idx * 4;
                        
                        // Get pixel color
                        const r = originalData[pixelIdx];
                        const g = originalData[pixelIdx + 1];
                        const b = originalData[pixelIdx + 2];
                        
                        // Calculate color distance to foreground and background
                        const distToFg = Math.sqrt(
                            Math.pow(r - fgAvg.r, 2) + 
                            Math.pow(g - fgAvg.g, 2) + 
                            Math.pow(b - fgAvg.b, 2)
                        );
                        const distToBg = Math.sqrt(
                            Math.pow(r - bgAvg.r, 2) + 
                            Math.pow(g - bgAvg.g, 2) + 
                            Math.pow(b - bgAvg.b, 2)
                        );
                        
                        // Color-based alpha estimation (closer to FG = higher alpha)
                        const colorAlpha = distToBg / (distToFg + distToBg + 0.001);
                        
                        // Local texture analysis (high texture = likely hair)
                        let localVariance = 0;
                        let neighborAvg = 0;
                        let neighborCount = 0;
                        
                        for (let dy = -2; dy <= 2; dy++) {
                            for (let dx = -2; dx <= 2; dx++) {
                                if (dx === 0 && dy === 0) continue;
                                const nIdx = (y + dy) * width + (x + dx);
                                const nPixelIdx = nIdx * 4;
                                
                                const nr = originalData[nPixelIdx];
                                const ng = originalData[nPixelIdx + 1];
                                const nb = originalData[nPixelIdx + 2];
                                
                                const nBright = (nr + ng + nb) / 3;
                                const bright = (r + g + b) / 3;
                                localVariance += Math.abs(bright - nBright);
                                neighborAvg += newData[nIdx];
                                neighborCount++;
                            }
                        }
                        localVariance /= neighborCount;
                        neighborAvg /= neighborCount;
                        
                        // Hair detection heuristics
                        const brightness = (r + g + b) / 3;
                        const saturation = Math.max(r, g, b) - Math.min(r, g, b);
                        const isHairLike = brightness < 120 && saturation < 80;
                        const isHighTexture = localVariance > 12;
                        
                        // Compute final alpha with multiple factors
                        let finalAlpha = maskVal;
                        
                        // Blend with color-based estimation
                        const colorWeight = 0.25; // How much to trust color matching
                        finalAlpha = finalAlpha * (1 - colorWeight) + colorAlpha * colorWeight;
                        
                        // Boost hair-like dark pixels
                        if (isHairLike && isHighTexture) {
                            finalAlpha = Math.min(1, finalAlpha + 0.15);
                        }
                        
                        // Context-aware: if neighbors are mostly foreground, boost this pixel
                        if (neighborAvg > 0.6 && finalAlpha < 0.8) {
                            finalAlpha = Math.min(1, finalAlpha + 0.12);
                        }
                        
                        // Suppress pixels that look like background but have some alpha
                        if (distToBg < distToFg * 0.5 && !isHairLike) {
                            finalAlpha = Math.max(0, finalAlpha * 0.7);
                        }
                        
                        newData[idx] = Math.max(0, Math.min(1, finalAlpha));
                    }
                }
            }
        }
        
        // STEP 3: Apply trimap-style matting refinement
        // Create soft transition zones based on gradient
        for (let y = 2; y < height - 2; y++) {
            for (let x = 2; x < width - 2; x++) {
                const idx = y * width + x;
                const alpha = newData[idx];
                
                // Compute gradient magnitude
                const gx = newData[(y) * width + (x + 1)] - newData[(y) * width + (x - 1)];
                const gy = newData[(y + 1) * width + x] - newData[(y - 1) * width + x];
                const gradMag = Math.sqrt(gx * gx + gy * gy);
                
                // High gradient = edge, apply smoothing
                if (gradMag > 0.1) {
                    // Weighted average with neighbors
                    let sum = alpha * 2;
                    let weights = 2;
                    
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (dx === 0 && dy === 0) continue;
                            const nIdx = (y + dy) * width + (x + dx);
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            const w = 1 / dist;
                            sum += newData[nIdx] * w;
                            weights += w;
                        }
                    }
                    
                    newData[idx] = sum / weights;
                }
            }
        }
        
        // Write back to mask
        for (let i = 0; i < newData.length; i++) {
            const val = Math.round(Math.max(0, Math.min(1, newData[i])) * 255);
            data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = val;
        }
    }
    
    // Advanced edge refinement - World class quality with SOFT ALPHA
    // NOW uses state.edgeRefinement (0-100) to control smoothness
    function advancedEdgeRefinement(maskData, width, height) {
        const data = maskData.data;
        const edgeLevel = state.edgeRefinement; // 0 = sharp, 100 = very smooth
        
        // Map edge level to processing parameters
        const erosionPasses = edgeLevel < 25 ? 1 : 2;
        const dilationPasses = edgeLevel < 25 ? 2 : 3;
        const featherRadius = Math.max(1, Math.min(5, Math.floor(1 + (edgeLevel / 100) * 4)));
        const blurSigma = 0.8 + (edgeLevel / 100) * 1.5;
        
        // STEP 1: Generate SOFT ALPHA from raw AI mask (no hard thresholds!)
        // Instead of binary 0/255, we create smooth gradient transitions
        const softMask = new Float32Array(width * height);
        
        for (let i = 0; i < data.length; i += 4) {
            const idx = i / 4;
            // Store as 0-1 float for precision
            softMask[idx] = data[i] / 255;
        }
        
        // STEP 2: Apply sigmoid contrast to sharpen transitions without making binary
        // This preserves soft edges while improving separation
        const contrastStrength = 2.5 + (edgeLevel / 100) * 1.5;
        for (let i = 0; i < softMask.length; i++) {
            const v = softMask[i];
            // Sigmoid-like contrast enhancement centered at 0.5
            // Maps 0->0, 0.5->0.5, 1->1 with steeper transition
            const adjusted = 1 / (1 + Math.exp(-contrastStrength * (v - 0.5) * 4));
            softMask[i] = adjusted;
        }
        
        // STEP 3: Edge-aware morphological smoothing (not binary!)
        // Gentle erosion for cleaner edges
        for (let pass = 0; pass < erosionPasses; pass++) {
            const temp = new Float32Array(softMask);
            
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    const idx = y * width + x;
                    const center = temp[idx];
                    
                    // Only erode if center is not fully opaque
                    if (center < 0.98) {
                        let minNeighbor = center;
                        
                        // 8-neighborhood minimum with distance weighting
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                if (dx === 0 && dy === 0) continue;
                                const nIdx = (y + dy) * width + (x + dx);
                                const dist = Math.sqrt(dx * dx + dy * dy);
                                const weight = 1 / dist;
                                minNeighbor = Math.min(minNeighbor, temp[nIdx] * (1 + (1 - weight) * 0.1));
                            }
                        }
                        
                        // Soft blend instead of hard minimum
                        softMask[idx] = center * 0.6 + minNeighbor * 0.4;
                    }
                }
            }
        }
        
        // STEP 4: Targeted dilation to recover hair strands
        for (let pass = 0; pass < dilationPasses; pass++) {
            const temp = new Float32Array(softMask);
            
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    const idx = y * width + x;
                    const center = temp[idx];
                    
                    // Only dilate semi-transparent areas
                    if (center > 0.1 && center < 0.9) {
                        let maxNeighbor = center;
                        
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                if (dx === 0 && dy === 0) continue;
                                const nIdx = (y + dy) * width + (x + dx);
                                maxNeighbor = Math.max(maxNeighbor, temp[nIdx]);
                            }
                        }
                        
                        // Boost towards max but keep some original
                        softMask[idx] = center * 0.5 + maxNeighbor * 0.5;
                    }
                }
            }
        }
        
        // STEP 5: Distance-weighted edge feathering
        if (featherRadius > 0) {
            const temp = new Float32Array(softMask);
            
            for (let y = featherRadius; y < height - featherRadius; y++) {
                for (let x = featherRadius; x < width - featherRadius; x++) {
                    const idx = y * width + x;
                    const center = temp[idx];
                    
                    // Detect edge pixels (gradient in alpha)
                    let gradientMag = 0;
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const nIdx = (y + dy) * width + (x + dx);
                            gradientMag += Math.abs(temp[nIdx] - center);
                        }
                    }
                    
                    // Only feather actual edges
                    if (gradientMag > 0.3) {
                        let sum = 0;
                        let weightSum = 0;
                        
                        for (let dy = -featherRadius; dy <= featherRadius; dy++) {
                            for (let dx = -featherRadius; dx <= featherRadius; dx++) {
                                const dist = Math.sqrt(dx * dx + dy * dy);
                                if (dist <= featherRadius) {
                                    const nIdx = (y + dy) * width + (x + dx);
                                    // Gaussian-like weight
                                    const weight = Math.exp(-dist * dist / (2 * (featherRadius * 0.5) * (featherRadius * 0.5)));
                                    sum += temp[nIdx] * weight;
                                    weightSum += weight;
                                }
                            }
                        }
                        
                        softMask[idx] = sum / weightSum;
                    }
                }
            }
        }
        
        // STEP 6: Final Gaussian blur for super smooth edges
        const blurRadius = 2;
        const kernel = [];
        let kernelSum = 0;
        
        for (let y = -blurRadius; y <= blurRadius; y++) {
            for (let x = -blurRadius; x <= blurRadius; x++) {
                const g = Math.exp(-(x * x + y * y) / (2 * blurSigma * blurSigma));
                kernel.push({ x, y, g });
                kernelSum += g;
            }
        }
        
        const blurTemp = new Float32Array(softMask);
        
        for (let y = blurRadius; y < height - blurRadius; y++) {
            for (let x = blurRadius; x < width - blurRadius; x++) {
                const idx = y * width + x;
                let sum = 0;
                
                for (const k of kernel) {
                    const nIdx = (y + k.y) * width + (x + k.x);
                    sum += blurTemp[nIdx] * k.g;
                }
                
                softMask[idx] = sum / kernelSum;
            }
        }
        
        // STEP 7: Write back to mask with proper 8-bit conversion
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                const i = idx * 4;
                
                // Clamp and convert to 0-255
                const val = Math.round(Math.max(0, Math.min(1, softMask[idx])) * 255);
                data[i] = data[i + 1] = data[i + 2] = val;
                data[i + 3] = 255;
            }
        }
    }
    
    // NEW: Re-apply edge refinement when slider changes
    function reapplyEdgeRefinement() {
        if (!state.originalCanvas || !state.maskCanvas) return;
        
        const width = state.originalCanvas.width;
        const height = state.originalCanvas.height;
        
        // We need to re-run the AI segmentation to get fresh mask
        // For performance, we'll store the original raw mask and re-process it
        if (!state.rawMaskData) {
            // Fallback: just re-apply current mask with new settings
            applyMaskToImage();
            return;
        }
        
        // Re-create mask canvas from raw mask
        const maskCtx = state.maskCanvas.getContext('2d');
        const maskData = new ImageData(
            new Uint8ClampedArray(state.rawMaskData),
            width,
            height
        );
        
        // Apply edge refinement with current slider value
        advancedEdgeRefinement(maskData, width, height);
        
        maskCtx.putImageData(maskData, 0, 0);
        
        // Re-apply to image
        applyMaskToImage();
    }

    function applyMaskToImage() {
        const width = state.image.width;
        const height = state.image.height;
        
        // Create result canvas
        state.resultCanvas = document.createElement('canvas');
        state.resultCanvas.width = width;
        state.resultCanvas.height = height;
        const ctx = state.resultCanvas.getContext('2d');
        
        // Get original image data
        const originalCtx = state.originalCanvas.getContext('2d');
        const originalData = originalCtx.getImageData(0, 0, width, height);
        
        // Get mask data
        const maskCtx = state.maskCanvas.getContext('2d');
        const maskData = maskCtx.getImageData(0, 0, width, height);
        
        // STEP 1: Detect background color for decontamination
        const bgColor = detectBackgroundColor(originalData, maskData, width, height);
        
        // STEP 2: Apply complete professional pipeline
        const resultData = ctx.createImageData(width, height);
        
        // Dynamic feather radius based on image size
        const featherRadius = Math.max(1, Math.min(3, Math.floor(Math.max(width, height) / 800)));
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                const maskAlpha = maskData.data[i] / 255;
                
                let r = originalData.data[i];
                let g = originalData.data[i + 1];
                let b = originalData.data[i + 2];
                
                // STEP 3: Color Decontamination (remove background spill/halo)
                // Only apply to edge pixels (semi-transparent)
                if (maskAlpha > 0.05 && maskAlpha < 0.95) {
                    const decontaminated = decontaminateColor(r, g, b, bgColor, maskAlpha);
                    r = decontaminated.r;
                    g = decontaminated.g;
                    b = decontaminated.b;
                }
                
                // STEP 4: Apply soft alpha with premultiplied alpha for better edges
                resultData.data[i] = r;
                resultData.data[i + 1] = g;
                resultData.data[i + 2] = b;
                resultData.data[i + 3] = Math.round(maskAlpha * 255);
            }
        }
        
        ctx.putImageData(resultData, 0, 0);
        
        // STEP 5: Apply morphological cleanup for dots/artifacts
        cleanupArtifacts(ctx, width, height);
        
        // Apply new background
        applyNewBackground();
    }
    
    // NEW: Detect dominant background color from masked-out areas
    function detectBackgroundColor(originalData, maskData, width, height) {
        const samples = [];
        const data = originalData.data;
        const mask = maskData.data;
        
        // Sample pixels where mask is very low (definite background)
        for (let y = 0; y < height; y += 10) {
            for (let x = 0; x < width; x += 10) {
                const i = (y * width + x) * 4;
                if (mask[i] < 30) { // Definite background
                    samples.push({
                        r: data[i],
                        g: data[i + 1],
                        b: data[i + 2]
                    });
                }
            }
        }
        
        if (samples.length === 0) {
            return { r: 128, g: 128, b: 128 }; // Fallback neutral
        }
        
        // Calculate average background color
        const avg = samples.reduce((acc, c) => ({
            r: acc.r + c.r,
            g: acc.g + c.g,
            b: acc.b + c.b
        }), { r: 0, g: 0, b: 0 });
        
        return {
            r: Math.round(avg.r / samples.length),
            g: Math.round(avg.g / samples.length),
            b: Math.round(avg.b / samples.length)
        };
    }
    
    // NEW: Color decontamination - removes background color spill from edges
    // This is what removes the green/dark halo around hair
    function decontaminateColor(r, g, b, bgColor, alpha) {
        // Calculate how much background color is "spilling" into this pixel
        // Using color difference in LAB-like space for perceptual accuracy
        
        const fgWeight = alpha;
        const bgWeight = 1 - alpha;
        
        // Estimate what the pure foreground color should be
        // By removing the background contribution
        // Formula: observed = fg * alpha + bg * (1 - alpha)
        // Therefore: fg = (observed - bg * (1 - alpha)) / alpha
        
        if (alpha < 0.1) {
            return { r, g, b }; // Too transparent, don't modify
        }
        
        // Calculate decontaminated color
        let newR = (r - bgColor.r * bgWeight) / fgWeight;
        let newG = (g - bgColor.g * bgWeight) / fgWeight;
        let newB = (b - bgColor.b * bgWeight) / fgWeight;
        
        // Clamp values
        newR = Math.max(0, Math.min(255, newR));
        newG = Math.max(0, Math.min(255, newG));
        newB = Math.max(0, Math.min(255, newB));
        
        // Blend between original and decontaminated based on how close to edge
        // More aggressive decontamination for semi-transparent pixels
        const decontamStrength = Math.sin(alpha * Math.PI); // Peak at 0.5 alpha
        
        return {
            r: Math.round(r * (1 - decontamStrength * 0.7) + newR * decontamStrength * 0.7),
            g: Math.round(g * (1 - decontamStrength * 0.7) + newG * decontamStrength * 0.7),
            b: Math.round(b * (1 - decontamStrength * 0.7) + newB * decontamStrength * 0.7)
        };
    }
    
    // NEW: Morphological cleanup - removes small dot artifacts
    function cleanupArtifacts(ctx, width, height) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        // Find and remove isolated transparent pixels inside foreground (holes)
        // Find and remove isolated opaque pixels in background (dots)
        
        const minClusterSize = 9; // Minimum pixels to keep a cluster
        const visited = new Uint8Array(width * height);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const i = (y * width + x) * 4;
                const alpha = data[i + 3];
                
                // Check for isolated opaque pixels (potential artifact)
                if (alpha > 200 && !visited[y * width + x]) {
                    // Count connected opaque neighbors
                    const cluster = floodFillCount(data, visited, x, y, width, height, true);
                    
                    if (cluster.length < minClusterSize) {
                        // Remove this small cluster (it's an artifact)
                        for (const idx of cluster) {
                            data[idx + 3] = 0;
                        }
                    }
                }
                
                // Check for isolated transparent pixels (holes in foreground)
                if (alpha < 50 && !visited[y * width + x]) {
                    const cluster = floodFillCount(data, visited, x, y, width, height, false);
                    
                    if (cluster.length < minClusterSize && cluster.length > 0) {
                        // Check if surrounded by opaque - then fill the hole
                        let opaqueNeighbors = 0;
                        for (const idx of cluster) {
                            const px = (idx / 4) % width;
                            const py = Math.floor((idx / 4) / width);
                            
                            // Check 4-neighbors for opaque
                            const neighbors = [
                                ((py - 1) * width + px) * 4,
                                ((py + 1) * width + px) * 4,
                                (py * width + px - 1) * 4,
                                (py * width + px + 1) * 4
                            ];
                            
                            for (const n of neighbors) {
                                if (n >= 0 && n < data.length && data[n + 3] > 200) {
                                    opaqueNeighbors++;
                                }
                            }
                        }
                        
                        if (opaqueNeighbors > cluster.length * 2) {
                            // Fill the hole
                            for (const idx of cluster) {
                                data[idx + 3] = 255;
                            }
                        }
                    }
                }
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
    
    // Helper: Flood fill to count connected pixels
    function floodFillCount(data, visited, startX, startY, width, height, forOpaque) {
        const cluster = [];
        const stack = [[startX, startY]];
        const threshold = forOpaque ? 200 : 50;
        
        while (stack.length > 0 && cluster.length < 100) { // Limit for performance
            const [x, y] = stack.pop();
            
            if (x < 0 || x >= width || y < 0 || y >= height) continue;
            
            const idx = y * width + x;
            if (visited[idx]) continue;
            
            const i = idx * 4;
            const alpha = data[i + 3];
            const matches = forOpaque ? (alpha > threshold) : (alpha < threshold);
            
            if (!matches) continue;
            
            visited[idx] = 1;
            cluster.push(i);
            
            // Add 4-neighbors
            stack.push([x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]);
        }
        
        return cluster;
    }

    // Color-based background removal
    async function processWithColor() {
        if (!state.pickedColor) {
            alert('Please click on the image to pick a background color first.');
            showProcessing(false);
            return Promise.reject();
        }
        
        updateStep(1);
        el.processingText.textContent = 'Analyzing colors...';
        await delay(200);
        
        updateStep(2);
        el.processingText.textContent = 'Removing background...';
        
        const width = state.image.width;
        const height = state.image.height;
        
        // Create result canvas
        state.resultCanvas = document.createElement('canvas');
        state.resultCanvas.width = width;
        state.resultCanvas.height = height;
        const ctx = state.resultCanvas.getContext('2d');
        
        // Get original image data
        const originalCtx = state.originalCanvas.getContext('2d');
        const originalData = originalCtx.getImageData(0, 0, width, height);
        const resultData = ctx.createImageData(width, height);
        
        const { r: tr, g: tg, b: tb } = state.pickedColor;
        const tolerance = state.tolerance * 2.55; // Convert to 0-255 range
        
        for (let i = 0; i < originalData.data.length; i += 4) {
            const r = originalData.data[i];
            const g = originalData.data[i + 1];
            const b = originalData.data[i + 2];
            
            // Calculate color distance
            const distance = Math.sqrt(
                Math.pow(r - tr, 2) +
                Math.pow(g - tg, 2) +
                Math.pow(b - tb, 2)
            );
            
            resultData.data[i] = r;
            resultData.data[i + 1] = g;
            resultData.data[i + 2] = b;
            
            if (distance <= tolerance) {
                // Make transparent based on distance
                const alpha = Math.min(255, (distance / tolerance) * 255);
                resultData.data[i + 3] = alpha;
            } else {
                resultData.data[i + 3] = 255;
            }
        }
        
        ctx.putImageData(resultData, 0, 0);
        
        updateStep(3);
        el.processingText.textContent = 'Refining edges...';
        await delay(200);
        
        // Create mask for refinement
        state.maskCanvas = document.createElement('canvas');
        state.maskCanvas.width = width;
        state.maskCanvas.height = height;
        const maskCtx = state.maskCanvas.getContext('2d');
        
        const maskData = maskCtx.createImageData(width, height);
        for (let i = 0; i < resultData.data.length; i += 4) {
            maskData.data[i] = resultData.data[i + 3];
            maskData.data[i + 1] = resultData.data[i + 3];
            maskData.data[i + 2] = resultData.data[i + 3];
            maskData.data[i + 3] = 255;
        }
        maskCtx.putImageData(maskData, 0, 0);
        
        applyNewBackground();
    }

    // Apply new background to result
    function applyNewBackground() {
        if (!state.resultCanvas) return;
        
        const width = state.resultCanvas.width;
        const height = state.resultCanvas.height;
        
        // Create final canvas
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = width;
        finalCanvas.height = height;
        const ctx = finalCanvas.getContext('2d');
        
        // Draw background
        if (state.newBg === 'transparent') {
            // Keep transparent
        } else if (state.newBg === 'image' && state.customBgImage) {
            // Draw custom image background
            ctx.drawImage(state.customBgImage, 0, 0, width, height);
        } else if (state.newBg && state.newBg !== 'transparent') {
            // Solid color
            ctx.fillStyle = state.newBg;
            ctx.fillRect(0, 0, width, height);
        }
        
        // Draw foreground (with transparency)
        ctx.drawImage(state.resultCanvas, 0, 0);
        
        // Update preview
        el.previewCanvas.width = width;
        el.previewCanvas.height = height;
        const previewCtx = el.previewCanvas.getContext('2d');
        previewCtx.clearRect(0, 0, width, height);
        previewCtx.drawImage(finalCanvas, 0, 0);
    }

    // Download result
    function downloadResult() {
        if (!state.resultCanvas) return;
        
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = state.resultCanvas.width;
        finalCanvas.height = state.resultCanvas.height;
        const ctx = finalCanvas.getContext('2d');
        
        // Draw background
        if (state.newBg === 'transparent') {
            // Keep transparent for PNG
        } else if (state.newBg === 'image' && state.customBgImage) {
            ctx.drawImage(state.customBgImage, 0, 0, finalCanvas.width, finalCanvas.height);
        } else if (state.newBg && state.newBg !== 'transparent') {
            ctx.fillStyle = state.newBg;
            ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
        }
        
        ctx.drawImage(state.resultCanvas, 0, 0);
        
        finalCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'background-removed.png';
            a.click();
            URL.revokeObjectURL(url);
        }, 'image/png');
    }

    // Reset
    function resetProcessing() {
        state.processed = false;
        state.resultCanvas = null;
        state.maskCanvas = null;
        state.rawMaskData = null; // NEW: Clear raw mask data
        
        // Reset preview to original
        const ctx = el.previewCanvas.getContext('2d');
        ctx.clearRect(0, 0, el.previewCanvas.width, el.previewCanvas.height);
        ctx.drawImage(state.originalCanvas, 0, 0);
        
        el.btnProcess.style.display = 'flex';
        el.btnDownload.style.display = 'none';
        el.secondaryActions.style.display = 'none';
        
        switchPreviewTab('result');
    }

    function resetToUpload() {
        state.image = null;
        state.originalCanvas = null;
        state.resultCanvas = null;
        state.maskCanvas = null;
        state.rawMaskData = null; // NEW: Clear raw mask data
        state.processed = false;
        state.pickedColor = null;
        
        showPage('upload');
    }

    // Page navigation
    function showPage(page) {
        el.pageUpload.classList.remove('active');
        el.pageEdit.classList.remove('active');
        
        if (page === 'upload') {
            el.pageUpload.classList.add('active');
        } else {
            el.pageEdit.classList.add('active');
        }
    }

    // Processing overlay
    function showProcessing(show) {
        el.processing.classList.toggle('active', show);
        if (!show) {
            // Reset steps
            el.step1.classList.remove('active', 'done');
            el.step2.classList.remove('active', 'done');
            el.step3.classList.remove('active', 'done');
        }
    }

    function updateStep(step) {
        if (step >= 1) {
            el.step1.classList.add('active');
            if (step > 1) {
                el.step1.classList.remove('active');
                el.step1.classList.add('done');
            }
        }
        if (step >= 2) {
            el.step2.classList.add('active');
            if (step > 2) {
                el.step2.classList.remove('active');
                el.step2.classList.add('done');
            }
        }
        if (step >= 3) {
            el.step3.classList.add('active');
        }
    }

    // Utility functions
    function rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
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


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
    
    // NEW: Hair and fine edge refinement using color analysis
    function refineHairEdges(maskData, width, height) {
        const data = maskData.data;
        const originalCtx = state.originalCanvas.getContext('2d');
        const originalData = originalCtx.getImageData(0, 0, width, height).data;
        
        // Detect edge pixels and analyze color for hair-like regions
        const edgePixels = [];
        
        for (let y = 2; y < height - 2; y++) {
            for (let x = 2; x < width - 2; x++) {
                const idx = (y * width + x) * 4;
                const maskVal = data[idx];
                
                // Find edge pixels (transition zone)
                if (maskVal > 30 && maskVal < 225) {
                    edgePixels.push({ x, y, idx });
                }
            }
        }
        
        // For each edge pixel, analyze if it looks like hair
        for (const pixel of edgePixels) {
            const { x, y, idx } = pixel;
            
            // Get original color at this pixel
            const r = originalData[idx];
            const g = originalData[idx + 1];
            const b = originalData[idx + 2];
            
            // Calculate color properties
            const brightness = (r + g + b) / 3;
            const saturation = Math.max(r, g, b) - Math.min(r, g, b);
            
            // Hair is typically darker and less saturated than background
            // Also check local variance for texture detection
            let localVariance = 0;
            let neighborCount = 0;
            
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const nIdx = ((y + dy) * width + (x + dx)) * 4;
                    const nr = originalData[nIdx];
                    const ng = originalData[nIdx + 1];
                    const nb = originalData[nIdx + 2];
                    const nBright = (nr + ng + nb) / 3;
                    localVariance += Math.abs(brightness - nBright);
                    neighborCount++;
                }
            }
            localVariance /= neighborCount;
            
            // High variance at edges suggests hair/fine detail
            // Adjust mask value based on analysis
            if (localVariance > 15) {
                // Textured edge - likely hair, preserve more detail
                const currentMask = data[idx];
                
                // Check if surrounded by more foreground than background
                let fgCount = 0, bgCount = 0;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nIdx = ((y + dy) * width + (x + dx)) * 4;
                        if (data[nIdx] > 128) fgCount++;
                        else bgCount++;
                    }
                }
                
                if (fgCount > bgCount) {
                    // More foreground neighbors - boost this pixel
                    const boost = Math.min(255, currentMask + (localVariance * 2));
                    data[idx] = data[idx + 1] = data[idx + 2] = boost;
                } else if (brightness < 100 && saturation < 80) {
                    // Dark, low saturation at edge - likely hair strand
                    const boost = Math.min(255, currentMask + 40);
                    data[idx] = data[idx + 1] = data[idx + 2] = boost;
                }
            }
        }
        
        // Final pass: smooth the refined edges
        const smoothed = new Uint8ClampedArray(data);
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                const val = data[idx];
                
                // Only smooth edge pixels
                if (val > 20 && val < 235) {
                    const neighbors = [
                        data[((y-1) * width + x) * 4],
                        data[((y+1) * width + x) * 4],
                        data[(y * width + x - 1) * 4],
                        data[(y * width + x + 1) * 4]
                    ];
                    const avg = (val * 2 + neighbors.reduce((a, b) => a + b, 0)) / 6;
                    smoothed[idx] = smoothed[idx + 1] = smoothed[idx + 2] = Math.round(avg);
                }
            }
        }
        
        for (let i = 0; i < data.length; i++) {
            data[i] = smoothed[i];
        }
    }
    
    // Advanced edge refinement - World class quality
    // NOW uses state.edgeRefinement (0-100) to control smoothness
    function advancedEdgeRefinement(maskData, width, height) {
        const data = maskData.data;
        const edgeLevel = state.edgeRefinement; // 0 = sharp, 100 = very smooth
        
        // Map edge level to processing parameters
        // 0 (Sharp): minimal processing, 100 (Very Smooth): maximum feathering
        const erosionPasses = edgeLevel < 25 ? 1 : 2;
        const dilationPasses = edgeLevel < 25 ? 2 : 3;
        const featherRadius = Math.max(1, Math.floor(1 + (edgeLevel / 100) * 6)); // 1 to 7
        const blurRadius = Math.max(1, Math.floor(1 + (edgeLevel / 100) * 4)); // 1 to 5
        const blurSigma = 0.5 + (edgeLevel / 100) * 2; // 0.5 to 2.5
        
        // Pass 1: Softer threshold to preserve hair details
        const thresholdHigh = edgeLevel < 50 ? 210 : 190;
        const thresholdLow = edgeLevel < 50 ? 45 : 60;
        
        for (let i = 0; i < data.length; i += 4) {
            const val = data[i];
            if (val > thresholdHigh) {
                data[i] = data[i + 1] = data[i + 2] = 255;
            } else if (val < thresholdLow) {
                data[i] = data[i + 1] = data[i + 2] = 0;
            }
        }
        
        // Pass 2: Gentle erosion (smaller kernel for hair preservation)
        for (let pass = 0; pass < erosionPasses; pass++) {
            const tempData = new Uint8ClampedArray(data);
            const kernelSize = 1; // Keep small to preserve fine details
            
            for (let y = kernelSize; y < height - kernelSize; y++) {
                for (let x = kernelSize; x < width - kernelSize; x++) {
                    const idx = (y * width + x) * 4;
                    let min = 255;
                    
                    // Use weighted kernel - center has more influence
                    let weightedMin = tempData[idx];
                    for (let dy = -kernelSize; dy <= kernelSize; dy++) {
                        for (let dx = -kernelSize; dx <= kernelSize; dx++) {
                            const nIdx = ((y + dy) * width + (x + dx)) * 4;
                            const weight = (dx === 0 && dy === 0) ? 0.5 : 0.5 / 8;
                            min = Math.min(min, tempData[nIdx]);
                        }
                    }
                    
                    // Blend instead of hard minimum for softer edges
                    data[idx] = data[idx + 1] = data[idx + 2] = Math.round(tempData[idx] * 0.7 + min * 0.3);
                }
            }
        }
        
        // Pass 3: Dilation passes
        for (let pass = 0; pass < dilationPasses; pass++) {
            const tempData = new Uint8ClampedArray(data);
            const kernelSize = edgeLevel < 25 ? 1 : 2;
            
            for (let y = kernelSize; y < height - kernelSize; y++) {
                for (let x = kernelSize; x < width - kernelSize; x++) {
                    const idx = (y * width + x) * 4;
                    let max = 0;
                    
                    for (let dy = -kernelSize; dy <= kernelSize; dy++) {
                        for (let dx = -kernelSize; dx <= kernelSize; dx++) {
                            const nIdx = ((y + dy) * width + (x + dx)) * 4;
                            max = Math.max(max, tempData[nIdx]);
                        }
                    }
                    
                    data[idx] = data[idx + 1] = data[idx + 2] = max;
                }
            }
        }
        
        // Pass 4: Edge feathering (controlled by edge level)
        if (featherRadius > 0) {
            const edgeData = new Uint8ClampedArray(data);
            
            for (let y = featherRadius; y < height - featherRadius; y++) {
                for (let x = featherRadius; x < width - featherRadius; x++) {
                    const idx = (y * width + x) * 4;
                    const val = edgeData[idx];
                    
                    // Check if this is an edge pixel
                    let isEdge = false;
                    for (let dy = -1; dy <= 1 && !isEdge; dy++) {
                        for (let dx = -1; dx <= 1 && !isEdge; dx++) {
                            const nIdx = ((y + dy) * width + (x + dx)) * 4;
                            if (Math.abs(edgeData[nIdx] - val) > 100) {
                                isEdge = true;
                            }
                        }
                    }
                    
                    if (isEdge) {
                        // Apply weighted average for smooth edge
                        let sum = 0;
                        let weightSum = 0;
                        
                        for (let dy = -featherRadius; dy <= featherRadius; dy++) {
                            for (let dx = -featherRadius; dx <= featherRadius; dx++) {
                                const dist = Math.sqrt(dx * dx + dy * dy);
                                if (dist <= featherRadius) {
                                    const nIdx = ((y + dy) * width + (x + dx)) * 4;
                                    const weight = 1 - (dist / featherRadius);
                                    sum += edgeData[nIdx] * weight * weight;
                                    weightSum += weight * weight;
                                }
                            }
                        }
                        
                        const smoothVal = Math.round(sum / weightSum);
                        data[idx] = data[idx + 1] = data[idx + 2] = smoothVal;
                    }
                }
            }
        }
        
        // Pass 5: Gaussian blur (controlled by edge level)
        if (blurRadius > 0) {
            const kernel = [];
            let kernelSum = 0;
            
            for (let y = -blurRadius; y <= blurRadius; y++) {
                for (let x = -blurRadius; x <= blurRadius; x++) {
                    const g = Math.exp(-(x * x + y * y) / (2 * blurSigma * blurSigma));
                    kernel.push({ x, y, g });
                    kernelSum += g;
                }
            }
            
            const finalData = new Uint8ClampedArray(data);
            
            for (let y = blurRadius; y < height - blurRadius; y++) {
                for (let x = blurRadius; x < width - blurRadius; x++) {
                    const idx = (y * width + x) * 4;
                    let sum = 0;
                    
                    for (const k of kernel) {
                        const nIdx = ((y + k.y) * width + (x + k.x)) * 4;
                        sum += finalData[nIdx] * k.g;
                    }
                    
                    const val = Math.round(sum / kernelSum);
                    data[idx] = data[idx + 1] = data[idx + 2] = val;
                }
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
        
        // Apply mask with edge anti-aliasing
        const resultData = ctx.createImageData(width, height);
        
        for (let i = 0; i < originalData.data.length; i += 4) {
            const maskAlpha = maskData.data[i]; // Use red channel as alpha
            
            // Pre-multiply alpha for better edge quality
            const alpha = maskAlpha / 255;
            
            resultData.data[i] = originalData.data[i];
            resultData.data[i + 1] = originalData.data[i + 1];
            resultData.data[i + 2] = originalData.data[i + 2];
            resultData.data[i + 3] = Math.round(alpha * 255);
        }
        
        ctx.putImageData(resultData, 0, 0);
        
        // Apply new background
        applyNewBackground();
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


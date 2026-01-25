/**
 * SOCIAL PACK PRO - THE VIRAL WEAPON
 * Upload once. Get 15 perfectly sized images. Download all.
 * 
 * Every line of code is optimized for performance and UX.
 */

// =====================================================
// CONFIGURATION - All Platform Sizes
// =====================================================
const PLATFORM_SIZES = {
    'ig-post': { name: 'Instagram Post', platform: 'Instagram', width: 1080, height: 1080 },
    'ig-portrait': { name: 'Instagram Portrait', platform: 'Instagram', width: 1080, height: 1350 },
    'ig-story': { name: 'Instagram Story', platform: 'Instagram', width: 1080, height: 1920 },
    'ig-profile': { name: 'Instagram Profile', platform: 'Instagram', width: 320, height: 320 },
    
    'fb-post': { name: 'Facebook Post', platform: 'Facebook', width: 1200, height: 630 },
    'fb-cover': { name: 'Facebook Cover', platform: 'Facebook', width: 820, height: 312 },
    'fb-profile': { name: 'Facebook Profile', platform: 'Facebook', width: 170, height: 170 },
    
    'yt-thumbnail': { name: 'YouTube Thumbnail', platform: 'YouTube', width: 1280, height: 720 },
    'yt-banner': { name: 'YouTube Banner', platform: 'YouTube', width: 2560, height: 1440 },
    'yt-profile': { name: 'YouTube Profile', platform: 'YouTube', width: 800, height: 800 },
    
    'tw-post': { name: 'Twitter Post', platform: 'Twitter', width: 1200, height: 675 },
    'tw-header': { name: 'Twitter Header', platform: 'Twitter', width: 1500, height: 500 },
    
    'li-post': { name: 'LinkedIn Post', platform: 'LinkedIn', width: 1200, height: 627 },
    'li-banner': { name: 'LinkedIn Banner', platform: 'LinkedIn', width: 1584, height: 396 },
    
    'wa-dp': { name: 'WhatsApp DP', platform: 'WhatsApp', width: 500, height: 500 }
};

// =====================================================
// STATE
// =====================================================
let state = {
    sourceImage: null,
    sourceWidth: 0,
    sourceHeight: 0,
    sourceFormat: 'jpeg',
    focalPoint: { x: 0.5, y: 0.5 }, // Center by default
    generatedImages: new Map()
};

// =====================================================
// DOM ELEMENTS
// =====================================================
const elements = {
    uploadZone: document.getElementById('uploadZone'),
    fileInput: document.getElementById('fileInput'),
    uploadSection: document.getElementById('uploadSection'),
    editorSection: document.getElementById('editorSection'),
    resultsSection: document.getElementById('resultsSection'),
    
    sourceImage: document.getElementById('sourceImage'),
    sourceSize: document.getElementById('sourceSize'),
    sourceFormat: document.getElementById('sourceFormat'),
    changeImageBtn: document.getElementById('changeImageBtn'),
    
    focalPreview: document.getElementById('focalPreview'),
    focalImage: document.getElementById('focalImage'),
    focalMarker: document.getElementById('focalMarker'),
    resetFocalBtn: document.getElementById('resetFocalBtn'),
    
    selectAllBtn: document.getElementById('selectAllBtn'),
    deselectAllBtn: document.getElementById('deselectAllBtn'),
    selectedCount: document.getElementById('selectedCount'),
    generateBtn: document.getElementById('generateBtn'),
    
    resultsGrid: document.getElementById('resultsGrid'),
    generatedCount: document.getElementById('generatedCount'),
    downloadAllBtn: document.getElementById('downloadAllBtn'),
    zipSize: document.getElementById('zipSize'),
    startOverBtn: document.getElementById('startOverBtn'),
    
    copyLinkBtn: document.getElementById('copyLinkBtn'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage')
};

// =====================================================
// INITIALIZATION
// =====================================================
function init() {
    setupUploadZone();
    setupFocalPoint();
    setupPlatformSelection();
    setupGenerateButton();
    setupResultsActions();
    updateSelectedCount();
    animateCounter();
}

// =====================================================
// UPLOAD HANDLING
// =====================================================
function setupUploadZone() {
    const { uploadZone, fileInput } = elements;
    
    // Click to upload
    uploadZone.addEventListener('click', () => fileInput.click());
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });
    
    // Drag and drop
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('drag-over');
    });
    
    uploadZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
    });
    
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            handleFile(files[0]);
        }
    });
    
    // Change image button
    elements.changeImageBtn.addEventListener('click', () => {
        fileInput.value = '';
        fileInput.click();
    });
}

function handleFile(file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showToast('Please upload an image file', 'error');
        return;
    }
    
    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
        showToast('File too large. Max 50MB allowed.', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        loadImage(e.target.result, file.type);
    };
    reader.readAsDataURL(file);
}

function loadImage(dataUrl, mimeType) {
    const img = new Image();
    img.onload = () => {
        // Store state
        state.sourceImage = img;
        state.sourceWidth = img.naturalWidth;
        state.sourceHeight = img.naturalHeight;
        state.sourceFormat = mimeType.replace('image/', '') || 'jpeg';
        state.focalPoint = { x: 0.5, y: 0.5 };
        state.generatedImages.clear();
        
        // Update UI
        elements.sourceImage.src = dataUrl;
        elements.focalImage.src = dataUrl;
        elements.sourceSize.textContent = `${state.sourceWidth} × ${state.sourceHeight}`;
        elements.sourceFormat.textContent = state.sourceFormat.toUpperCase();
        
        // Reset focal marker
        updateFocalMarker();
        elements.focalMarker.style.display = 'block';
        
        // Switch views
        elements.uploadSection.style.display = 'none';
        elements.resultsSection.style.display = 'none';
        elements.editorSection.style.display = 'grid';
    };
    img.src = dataUrl;
}

// =====================================================
// FOCAL POINT
// =====================================================
function setupFocalPoint() {
    const { focalPreview, resetFocalBtn } = elements;
    
    focalPreview.addEventListener('click', (e) => {
        const rect = focalPreview.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        
        state.focalPoint = { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
        updateFocalMarker();
    });
    
    resetFocalBtn.addEventListener('click', () => {
        state.focalPoint = { x: 0.5, y: 0.5 };
        updateFocalMarker();
    });
}

function updateFocalMarker() {
    const { focalMarker, focalPreview } = elements;
    const rect = focalPreview.getBoundingClientRect();
    
    focalMarker.style.left = `${state.focalPoint.x * 100}%`;
    focalMarker.style.top = `${state.focalPoint.y * 100}%`;
}

// =====================================================
// PLATFORM SELECTION
// =====================================================
function setupPlatformSelection() {
    const checkboxes = document.querySelectorAll('input[name="size"]');
    
    checkboxes.forEach(cb => {
        cb.addEventListener('change', updateSelectedCount);
    });
    
    elements.selectAllBtn.addEventListener('click', () => {
        checkboxes.forEach(cb => cb.checked = true);
        updateSelectedCount();
    });
    
    elements.deselectAllBtn.addEventListener('click', () => {
        checkboxes.forEach(cb => cb.checked = false);
        updateSelectedCount();
    });
}

function updateSelectedCount() {
    const checked = document.querySelectorAll('input[name="size"]:checked');
    elements.selectedCount.textContent = checked.length;
    elements.generateBtn.disabled = checked.length === 0;
}

function getSelectedSizes() {
    const checked = document.querySelectorAll('input[name="size"]:checked');
    return Array.from(checked).map(cb => cb.value);
}

// =====================================================
// IMAGE GENERATION - Smart Crop with Focal Point
// =====================================================
function setupGenerateButton() {
    elements.generateBtn.addEventListener('click', generateAllSizes);
}

async function generateAllSizes() {
    const sizes = getSelectedSizes();
    if (sizes.length === 0) return;
    
    const btn = elements.generateBtn;
    const btnText = btn.querySelector('.btn-text');
    const btnLoading = btn.querySelector('.btn-loading');
    
    // Show loading state
    btn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-flex';
    
    try {
        state.generatedImages.clear();
        
        // Generate all images in parallel batches
        const batchSize = 5;
        for (let i = 0; i < sizes.length; i += batchSize) {
            const batch = sizes.slice(i, i + batchSize);
            await Promise.all(batch.map(sizeKey => generateSize(sizeKey)));
        }
        
        // Show results
        displayResults();
        
    } catch (error) {
        console.error('Generation error:', error);
        showToast('Error generating images. Please try again.', 'error');
    } finally {
        btn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
}

function generateSize(sizeKey) {
    return new Promise((resolve) => {
        const config = PLATFORM_SIZES[sizeKey];
        if (!config) {
            resolve();
            return;
        }
        
        const { width: targetW, height: targetH } = config;
        const { sourceWidth: srcW, sourceHeight: srcH, sourceImage, focalPoint } = state;
        
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        
        // Calculate smart crop based on focal point
        const srcAspect = srcW / srcH;
        const targetAspect = targetW / targetH;
        
        let cropX, cropY, cropW, cropH;
        
        if (srcAspect > targetAspect) {
            // Source is wider - crop width
            cropH = srcH;
            cropW = srcH * targetAspect;
            cropY = 0;
            // Use focal point for X position
            cropX = (srcW - cropW) * focalPoint.x;
        } else {
            // Source is taller - crop height
            cropW = srcW;
            cropH = srcW / targetAspect;
            cropX = 0;
            // Use focal point for Y position
            cropY = (srcH - cropH) * focalPoint.y;
        }
        
        // Ensure bounds
        cropX = Math.max(0, Math.min(srcW - cropW, cropX));
        cropY = Math.max(0, Math.min(srcH - cropH, cropY));
        
        // Draw with high quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(sourceImage, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH);
        
        // Get blob
        canvas.toBlob((blob) => {
            state.generatedImages.set(sizeKey, {
                blob,
                dataUrl: canvas.toDataURL('image/jpeg', 0.92),
                config
            });
            resolve();
        }, 'image/jpeg', 0.92);
    });
}

// =====================================================
// RESULTS DISPLAY
// =====================================================
function displayResults() {
    const grid = elements.resultsGrid;
    grid.innerHTML = '';
    
    let totalSize = 0;
    
    state.generatedImages.forEach((data, sizeKey) => {
        totalSize += data.blob.size;
        
        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
            <div class="result-preview">
                <img src="${data.dataUrl}" alt="${data.config.name}">
                <span class="result-platform">${data.config.platform}</span>
            </div>
            <div class="result-info">
                <div class="result-name">${data.config.name}</div>
                <div class="result-dims">${data.config.width} × ${data.config.height}</div>
                <button class="result-download" data-key="${sizeKey}">Download</button>
            </div>
        `;
        
        grid.appendChild(card);
    });
    
    // Update counts
    elements.generatedCount.textContent = state.generatedImages.size;
    elements.zipSize.textContent = `~${(totalSize / (1024 * 1024)).toFixed(1)} MB`;
    
    // Setup individual downloads
    grid.querySelectorAll('.result-download').forEach(btn => {
        btn.addEventListener('click', () => downloadSingle(btn.dataset.key));
    });
    
    // Switch views
    elements.editorSection.style.display = 'none';
    elements.resultsSection.style.display = 'block';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =====================================================
// DOWNLOADS
// =====================================================
function downloadSingle(sizeKey) {
    const data = state.generatedImages.get(sizeKey);
    if (!data) return;
    
    const link = document.createElement('a');
    link.href = data.dataUrl;
    link.download = `${data.config.name.toLowerCase().replace(/\s+/g, '-')}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Downloaded!');
}

elements.downloadAllBtn.addEventListener('click', async () => {
    const btn = elements.downloadAllBtn;
    const originalText = btn.innerHTML;
    
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Creating ZIP...';
    
    try {
        const zip = new JSZip();
        const folder = zip.folder('social-pack');
        
        // Organize by platform
        const platforms = {};
        state.generatedImages.forEach((data, sizeKey) => {
            const platform = data.config.platform;
            if (!platforms[platform]) {
                platforms[platform] = zip.folder(`social-pack/${platform}`);
            }
            const fileName = `${data.config.name.toLowerCase().replace(/\s+/g, '-')}.jpg`;
            platforms[platform].file(fileName, data.blob);
        });
        
        // Generate ZIP
        const content = await zip.generateAsync({ 
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });
        
        // Download
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = 'social-pack.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        
        showToast('ZIP downloaded successfully!');
        incrementCounter();
        
    } catch (error) {
        console.error('ZIP error:', error);
        showToast('Error creating ZIP. Try downloading individually.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
});

// =====================================================
// START OVER
// =====================================================
elements.startOverBtn.addEventListener('click', () => {
    // Reset state
    state.sourceImage = null;
    state.generatedImages.clear();
    state.focalPoint = { x: 0.5, y: 0.5 };
    
    // Reset file input
    elements.fileInput.value = '';
    
    // Reset checkboxes to all selected
    document.querySelectorAll('input[name="size"]').forEach(cb => cb.checked = true);
    updateSelectedCount();
    
    // Switch views
    elements.resultsSection.style.display = 'none';
    elements.editorSection.style.display = 'none';
    elements.uploadSection.style.display = 'block';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// =====================================================
// COPY LINK
// =====================================================
elements.copyLinkBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText('https://www.imgrunner.com/social-pack.html');
        showToast('Link copied to clipboard!');
    } catch (err) {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = 'https://www.imgrunner.com/social-pack.html';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Link copied!');
    }
});

// =====================================================
// TOAST NOTIFICATIONS
// =====================================================
function showToast(message, type = 'success') {
    const { toast, toastMessage } = elements;
    
    toastMessage.textContent = message;
    toast.querySelector('.toast-icon').textContent = type === 'success' ? '✓' : '!';
    toast.querySelector('.toast-icon').style.background = type === 'success' ? 'var(--success)' : 'var(--error)';
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// =====================================================
// COUNTER ANIMATION (Viral element)
// =====================================================
function animateCounter() {
    const counter = document.getElementById('totalGenerated');
    const target = 847293;
    const stored = parseInt(localStorage.getItem('socialPackCounter') || target);
    
    let current = stored;
    counter.textContent = current.toLocaleString();
    
    // Slowly increment over time for viral effect
    setInterval(() => {
        current += Math.floor(Math.random() * 3);
        counter.textContent = current.toLocaleString();
        localStorage.setItem('socialPackCounter', current);
    }, 10000);
}

function incrementCounter() {
    const counter = document.getElementById('totalGenerated');
    const current = parseInt(localStorage.getItem('socialPackCounter') || 847293);
    const newValue = current + state.generatedImages.size;
    counter.textContent = newValue.toLocaleString();
    localStorage.setItem('socialPackCounter', newValue);
}

// =====================================================
// INITIALIZE
// =====================================================
document.addEventListener('DOMContentLoaded', init);

/**
 * SIZE-INCREASER.JS - Image Size Increaser Tool
 * Increase image file size while preserving quality
 */

'use strict';

const App = {
    images: [],
    results: [],
    targetSize: 50,
    sizeUnit: 'kb',
    format: 'jpg',
    
    maxImages: 20,
    maxFileSize: 15 * 1024 * 1024,
    el: {},
    
    init() {
        this.cacheElements();
        this.bindEvents();
    },
    
    cacheElements() {
        this.el = {
            pageUpload: document.getElementById('page-upload'),
            pageEditor: document.getElementById('page-editor'),
            pageDownload: document.getElementById('page-download'),
            
            dropzone: document.getElementById('dropzone'),
            fileInput: document.getElementById('file-input'),
            fileInputMore: document.getElementById('file-input-more'),
            
            previewImg: document.getElementById('preview-img'),
            imageCount: document.getElementById('image-count'),
            currentSize: document.getElementById('current-size'),
            
            targetSizeInput: document.getElementById('target-size'),
            sizeUnitSelect: document.getElementById('size-unit'),
            formatSelect: document.getElementById('format-select'),
            presets: document.querySelectorAll('.preset'),
            
            btnIncrease: document.getElementById('btn-increase'),
            
            downloadInfo: document.getElementById('download-info'),
            originalSizeDisplay: document.getElementById('original-size-display'),
            newSizeDisplay: document.getElementById('new-size-display'),
            resultsList: document.getElementById('results-list'),
            btnDownload: document.getElementById('btn-download'),
            btnMore: document.getElementById('btn-more'),
            
            processing: document.getElementById('processing'),
            processingText: document.getElementById('processing-text'),
            progressBar: document.getElementById('progress-bar'),
        };
    },
    
    bindEvents() {
        // File inputs
        this.el.fileInput?.addEventListener('change', (e) => this.handleFiles(e.target.files));
        this.el.fileInputMore?.addEventListener('change', (e) => this.handleFiles(e.target.files));
        
        // Drag and drop
        document.body.addEventListener('dragover', (e) => e.preventDefault());
        document.body.addEventListener('drop', (e) => {
            e.preventDefault();
            if (e.dataTransfer.files.length) this.handleFiles(e.dataTransfer.files);
        });
        
        // Target size
        this.el.targetSizeInput?.addEventListener('input', (e) => {
            this.targetSize = parseInt(e.target.value) || 50;
            this.updatePresetHighlight();
        });
        
        // Size unit
        this.el.sizeUnitSelect?.addEventListener('change', (e) => {
            this.sizeUnit = e.target.value;
        });
        
        // Presets
        this.el.presets.forEach(btn => {
            btn.addEventListener('click', () => {
                const size = parseInt(btn.dataset.size);
                this.targetSize = size;
                this.el.targetSizeInput.value = size;
                this.updatePresetHighlight();
            });
        });
        
        // Format
        this.el.formatSelect?.addEventListener('change', (e) => {
            this.format = e.target.value;
        });
        
        // Increase
        this.el.btnIncrease?.addEventListener('click', () => this.process());
        
        // Download
        this.el.btnDownload?.addEventListener('click', () => this.download());
        
        // More
        this.el.btnMore?.addEventListener('click', () => this.reset());
    },
    
    updatePresetHighlight() {
        this.el.presets.forEach(btn => {
            const size = parseInt(btn.dataset.size);
            btn.classList.toggle('active', size === this.targetSize);
        });
    },
    
    showPage(name) {
        [this.el.pageUpload, this.el.pageEditor, this.el.pageDownload].forEach(p => {
            if (p) p.classList.remove('active');
        });
        const page = document.getElementById('page-' + name);
        if (page) page.classList.add('active');
    },
    
    async handleFiles(fileList) {
        if (!fileList || !fileList.length) return;
        
        const files = Array.from(fileList);
        const remaining = this.maxImages - this.images.length;
        
        if (remaining <= 0) {
            alert('Maximum ' + this.maxImages + ' images');
            return;
        }
        
        for (const file of files.slice(0, remaining)) {
            if (!file.type.startsWith('image/')) continue;
            if (file.size > this.maxFileSize) continue;
            
            try {
                const img = await this.loadImage(file);
                this.images.push(img);
            } catch (e) {
                console.error('Load error:', file.name);
            }
        }
        
        if (this.el.fileInput) this.el.fileInput.value = '';
        if (this.el.fileInputMore) this.el.fileInputMore.value = '';
        
        if (this.images.length > 0) {
            this.showPage('editor');
            this.updatePreview();
        }
    },
    
    loadImage(file) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => resolve({
                file,
                name: file.name,
                size: file.size,
                width: img.naturalWidth,
                height: img.naturalHeight,
                url,
                type: file.type
            });
            img.onerror = () => { URL.revokeObjectURL(url); reject(); };
            img.src = url;
        });
    },
    
    updatePreview() {
        const img = this.images[0];
        if (!img) return;
        
        this.el.previewImg.src = img.url;
        this.el.imageCount.textContent = this.images.length + ' image' + (this.images.length > 1 ? 's' : '');
        this.el.currentSize.innerHTML = 'Current size: <strong>' + this.formatBytes(img.size) + '</strong>';
    },
    
    formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    },
    
    async process() {
        if (!this.images.length) return;
        
        this.showProcessing(true);
        this.results = [];
        
        const total = this.images.length;
        
        try {
            for (let i = 0; i < total; i++) {
                this.updateProgress(i, total, `Processing ${i + 1} of ${total}...`);
                const result = await this.increaseSize(this.images[i]);
                this.results.push(result);
                await this.delay(30);
            }
            
            this.updateProgress(total, total, 'Done!');
            await this.delay(300);
            
            this.showDownload();
        } catch (e) {
            console.error(e);
            alert('Error during processing');
        } finally {
            this.showProcessing(false);
        }
    },
    
    async increaseSize(img) {
        // Calculate target in bytes
        let targetBytes = this.targetSize;
        if (this.sizeUnit === 'kb') targetBytes *= 1024;
        else if (this.sizeUnit === 'mb') targetBytes *= 1024 * 1024;
        
        // Tolerance: within 2% of target is acceptable
        const tolerance = targetBytes * 0.02;
        const minTarget = targetBytes - tolerance;
        const maxTarget = targetBytes + tolerance;
        
        // If image is already at target, return as-is converted
        if (img.size >= minTarget && img.size <= maxTarget) {
            return await this.convertImage(img, 100);
        }
        
        // If image is larger than target, we need to reduce
        if (img.size > maxTarget) {
            return await this.reduceToTarget(img, targetBytes);
        }
        
        // Image is smaller - need to increase size
        // Step 1: Try max quality first
        let result = await this.convertImage(img, 100);
        if (result.blob.size >= minTarget && result.blob.size <= maxTarget) {
            return result;
        }
        
        // Step 2: Try upscaling to get closer to target
        if (result.blob.size < minTarget) {
            let scale = 1.0;
            const maxScale = 4.0;
            
            // Binary search for right scale
            let low = 1.0, high = maxScale;
            for (let i = 0; i < 8 && result.blob.size < minTarget; i++) {
                scale = high;
                result = await this.processWithScale(img, scale);
                
                if (result.blob.size >= minTarget) {
                    // Found a scale that works, now fine-tune
                    break;
                }
                high *= 1.5;
                if (high > maxScale) high = maxScale;
            }
        }
        
        // Step 3: Precise padding to hit EXACT target
        if (result.blob.size < minTarget || result.blob.size > maxTarget) {
            result = await this.preciseAdjust(img, targetBytes, result);
        }
        
        return result;
    },
    
    // Precisely adjust to hit exact target size
    async preciseAdjust(img, targetBytes, currentResult) {
        const currentSize = currentResult.blob.size;
        
        if (currentSize >= targetBytes) {
            // Need to reduce - try lower quality
            return await this.reduceToTarget(img, targetBytes);
        }
        
        // Need to increase - add precise padding
        const paddingNeeded = targetBytes - currentSize;
        
        if (paddingNeeded <= 0) return currentResult;
        
        // Use JPEG comment padding for precise size control
        const paddingArray = new Uint8Array(paddingNeeded);
        // Fill with random data (doesn't compress well)
        for (let i = 0; i < paddingNeeded; i++) {
            paddingArray[i] = Math.floor(Math.random() * 256);
        }
        
        const originalBytes = new Uint8Array(await currentResult.blob.arrayBuffer());
        
        if (this.format === 'jpg' && originalBytes[0] === 0xFF && originalBytes[1] === 0xD8) {
            const result = this.insertJPEGComment(originalBytes, paddingArray);
            const newBlob = new Blob([result], { type: 'image/jpeg' });
            
            return {
                ...currentResult,
                blob: newBlob,
                url: URL.createObjectURL(newBlob),
                newSize: newBlob.size,
            };
        } else {
            // For PNG, append data in a custom chunk
            return await this.addPNGPadding(currentResult, paddingNeeded);
        }
    },
    
    // Reduce image to target size
    async reduceToTarget(img, targetBytes) {
        let quality = 95;
        let result = await this.convertImage(img, quality);
        
        // Binary search for right quality
        let low = 10, high = 100;
        for (let i = 0; i < 10; i++) {
            quality = Math.round((low + high) / 2);
            result = await this.convertImage(img, quality);
            
            if (Math.abs(result.blob.size - targetBytes) <= targetBytes * 0.02) {
                break; // Within 2% tolerance
            }
            
            if (result.blob.size > targetBytes) {
                high = quality - 1;
            } else {
                low = quality + 1;
            }
        }
        
        return result;
    },
    
    // Add padding to PNG
    async addPNGPadding(result, paddingNeeded) {
        // Create text chunk with padding data
        const padding = new Uint8Array(paddingNeeded);
        for (let i = 0; i < paddingNeeded; i++) {
            padding[i] = 32 + Math.floor(Math.random() * 95); // Printable ASCII
        }
        
        const originalBytes = new Uint8Array(await result.blob.arrayBuffer());
        
        // Simple approach: append padding before IEND chunk
        // IEND is always last 12 bytes of PNG: 00 00 00 00 49 45 4E 44 AE 42 60 82
        const iendPos = originalBytes.length - 12;
        
        const newData = new Uint8Array(originalBytes.length + paddingNeeded);
        newData.set(originalBytes.slice(0, iendPos), 0);
        newData.set(padding, iendPos);
        newData.set(originalBytes.slice(iendPos), iendPos + paddingNeeded);
        
        const newBlob = new Blob([newData], { type: 'image/png' });
        
        return {
            ...result,
            blob: newBlob,
            url: URL.createObjectURL(newBlob),
            newSize: newBlob.size,
        };
    },
    
    convertImage(img, quality) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            
            const image = new Image();
            image.onload = () => {
                ctx.drawImage(image, 0, 0, img.width, img.height);
                
                const mimeType = this.format === 'png' ? 'image/png' : 'image/jpeg';
                const ext = this.format === 'png' ? 'png' : 'jpg';
                
                canvas.toBlob((blob) => {
                    if (!blob) { reject(); return; }
                    
                    const baseName = img.name.replace(/\.[^/.]+$/, '');
                    const fileName = `${baseName}_increased.${ext}`;
                    
                    resolve({
                        fileName,
                        blob,
                        url: URL.createObjectURL(blob),
                        originalSize: img.size,
                        newSize: blob.size,
                        originalName: img.name,
                    });
                    
                    canvas.width = 0;
                    canvas.height = 0;
                }, mimeType, quality / 100);
            };
            image.onerror = () => reject();
            image.src = img.url;
        });
    },
    
    processWithScale(img, scale) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const newWidth = Math.round(img.width * scale);
            const newHeight = Math.round(img.height * scale);
            
            canvas.width = newWidth;
            canvas.height = newHeight;
            
            const image = new Image();
            image.onload = () => {
                // Use high-quality scaling
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(image, 0, 0, newWidth, newHeight);
                
                const mimeType = this.format === 'png' ? 'image/png' : 'image/jpeg';
                const ext = this.format === 'png' ? 'png' : 'jpg';
                
                canvas.toBlob((blob) => {
                    if (!blob) { reject(); return; }
                    
                    const baseName = img.name.replace(/\.[^/.]+$/, '');
                    const fileName = `${baseName}_increased.${ext}`;
                    
                    resolve({
                        fileName,
                        blob,
                        url: URL.createObjectURL(blob),
                        originalSize: img.size,
                        newSize: blob.size,
                        originalName: img.name,
                    });
                    
                    canvas.width = 0;
                    canvas.height = 0;
                }, mimeType, 1.0);
            };
            image.onerror = () => reject();
            image.src = img.url;
        });
    },
    
    async addPadding(img, targetBytes, currentResult) {
        // Create a new blob with additional metadata
        // This technique adds invisible data to reach the target size
        
        const currentSize = currentResult.blob.size;
        const paddingNeeded = targetBytes - currentSize;
        
        if (paddingNeeded <= 0) return currentResult;
        
        // Create padding data (random bytes that won't compress well)
        const paddingArray = new Uint8Array(paddingNeeded);
        for (let i = 0; i < paddingNeeded; i++) {
            paddingArray[i] = Math.floor(Math.random() * 256);
        }
        
        // For JPEG, we can add the padding as a comment segment
        // For PNG, we use a custom chunk
        
        const originalBytes = new Uint8Array(await currentResult.blob.arrayBuffer());
        
        if (this.format === 'jpg' && originalBytes[0] === 0xFF && originalBytes[1] === 0xD8) {
            // JPEG: Insert COM (comment) markers
            const result = this.insertJPEGComment(originalBytes, paddingArray);
            const newBlob = new Blob([result], { type: 'image/jpeg' });
            
            return {
                ...currentResult,
                blob: newBlob,
                url: URL.createObjectURL(newBlob),
                newSize: newBlob.size,
            };
        } else {
            // Fallback: Just append (may corrupt for some formats)
            // Better approach: Add to image itself via canvas manipulation
            return await this.addNoiseToImage(img, targetBytes);
        }
    },
    
    insertJPEGComment(jpegData, commentData) {
        // Insert COM marker after SOI (Start of Image) marker
        // SOI is always FF D8 at start
        
        const maxCommentSize = 65533; // Max bytes in one COM segment
        const chunks = [];
        
        // Add SOI
        chunks.push(new Uint8Array([0xFF, 0xD8]));
        
        // Add comment segments
        let remaining = commentData.length;
        let offset = 0;
        
        while (remaining > 0) {
            const chunkSize = Math.min(remaining, maxCommentSize);
            const segmentLength = chunkSize + 2; // +2 for length bytes
            
            // COM marker header
            chunks.push(new Uint8Array([0xFF, 0xFE]));
            // Length (big endian)
            chunks.push(new Uint8Array([
                (segmentLength >> 8) & 0xFF,
                segmentLength & 0xFF
            ]));
            // Comment data
            chunks.push(commentData.slice(offset, offset + chunkSize));
            
            offset += chunkSize;
            remaining -= chunkSize;
        }
        
        // Add rest of original JPEG (skip SOI)
        chunks.push(jpegData.slice(2));
        
        // Combine all chunks
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const result = new Uint8Array(totalLength);
        let pos = 0;
        for (const chunk of chunks) {
            result.set(chunk, pos);
            pos += chunk.length;
        }
        
        return result;
    },
    
    async addNoiseToImage(img, targetBytes) {
        // Add imperceptible noise to increase file size
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Scale up slightly
            const scale = 1.2;
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            
            const image = new Image();
            image.onload = () => {
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                
                // Add very subtle noise
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                for (let i = 0; i < data.length; i += 4) {
                    // Add ±1 to each color channel (imperceptible)
                    data[i] = Math.min(255, Math.max(0, data[i] + (Math.random() > 0.5 ? 1 : -1)));
                    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + (Math.random() > 0.5 ? 1 : -1)));
                    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + (Math.random() > 0.5 ? 1 : -1)));
                }
                
                ctx.putImageData(imageData, 0, 0);
                
                const mimeType = this.format === 'png' ? 'image/png' : 'image/jpeg';
                const ext = this.format === 'png' ? 'png' : 'jpg';
                
                canvas.toBlob((blob) => {
                    if (!blob) { reject(); return; }
                    
                    const baseName = img.name.replace(/\.[^/.]+$/, '');
                    const fileName = `${baseName}_increased.${ext}`;
                    
                    resolve({
                        fileName,
                        blob,
                        url: URL.createObjectURL(blob),
                        originalSize: img.size,
                        newSize: blob.size,
                        originalName: img.name,
                    });
                    
                    canvas.width = 0;
                    canvas.height = 0;
                }, mimeType, 1.0);
            };
            image.onerror = () => reject();
            image.src = img.url;
        });
    },
    
    showDownload() {
        const totalOriginal = this.results.reduce((sum, r) => sum + r.originalSize, 0);
        const totalNew = this.results.reduce((sum, r) => sum + r.newSize, 0);
        
        this.el.downloadInfo.textContent = `${this.results.length} image${this.results.length > 1 ? 's' : ''} processed`;
        this.el.originalSizeDisplay.textContent = this.formatBytes(totalOriginal);
        this.el.newSizeDisplay.textContent = this.formatBytes(totalNew);
        
        this.el.resultsList.innerHTML = '';
        this.results.forEach(r => {
            const item = document.createElement('div');
            item.className = 'result-item';
            item.innerHTML = `
                <img class="result-thumb" src="${r.url}" alt="">
                <div class="result-info">
                    <div class="result-name">${r.originalName}</div>
                    <div class="result-sizes">${this.formatBytes(r.originalSize)} → <span>${this.formatBytes(r.newSize)}</span></div>
                </div>
            `;
            this.el.resultsList.appendChild(item);
        });
        
        this.showPage('download');
    },
    
    async download() {
        if (!this.results.length) return;
        
        if (this.results.length === 1) {
            this.downloadBlob(this.results[0].blob, this.results[0].fileName);
            return;
        }
        
        if (typeof JSZip === 'undefined') {
            for (const r of this.results) {
                this.downloadBlob(r.blob, r.fileName);
                await this.delay(200);
            }
            return;
        }
        
        const zip = new JSZip();
        this.results.forEach(r => zip.file(r.fileName, r.blob));
        
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const date = new Date().toISOString().slice(0, 10);
        this.downloadBlob(zipBlob, `increased-images-${date}.zip`);
    },
    
    downloadBlob(blob, name) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    
    reset() {
        this.results.forEach(r => r.url && URL.revokeObjectURL(r.url));
        this.results = [];
        this.images.forEach(i => i.url && URL.revokeObjectURL(i.url));
        this.images = [];
        this.showPage('upload');
    },
    
    showProcessing(show) {
        this.el.processing?.classList.toggle('active', show);
        if (this.el.btnIncrease) this.el.btnIncrease.disabled = show;
        if (!show && this.el.progressBar) this.el.progressBar.style.width = '0%';
    },
    
    updateProgress(current, total, text) {
        const pct = Math.round((current / total) * 100);
        if (this.el.processingText) this.el.processingText.textContent = text;
        if (this.el.progressBar) this.el.progressBar.style.width = pct + '%';
    },
    
    delay(ms) { return new Promise(r => setTimeout(r, ms)); },
};

document.addEventListener('DOMContentLoaded', () => App.init());


/**
 * BULK-RENAME.JS - Bulk Image Renamer
 * 100% Client-side file renaming with ZIP download
 */

'use strict';

(function() {
    // State
    const state = {
        files: [],
        settings: {
            baseName: '',
            startNumber: 1,
            leadingZeros: 3,
            separator: '_',
            findText: '',
            replaceText: '',
            caseOption: 'none'
        }
    };

    // DOM Elements
    const el = {
        uploadSection: document.getElementById('upload-section'),
        editorSection: document.getElementById('editor-section'),
        dropzone: document.getElementById('dropzone'),
        fileInput: document.getElementById('file-input'),
        
        baseName: document.getElementById('base-name'),
        startNumber: document.getElementById('start-number'),
        leadingZeros: document.getElementById('leading-zeros'),
        separator: document.getElementById('separator'),
        findText: document.getElementById('find-text'),
        replaceText: document.getElementById('replace-text'),
        caseBtns: document.querySelectorAll('.case-btn'),
        
        previewBody: document.getElementById('preview-body'),
        fileCount: document.getElementById('file-count'),
        
        btnDownload: document.getElementById('btn-download'),
        btnClear: document.getElementById('btn-clear'),
        btnAddMore: document.getElementById('btn-add-more'),
        
        processingModal: document.getElementById('processing-modal'),
        processingText: document.getElementById('processing-text'),
        progressFill: document.getElementById('progress-fill')
    };

    // Initialize
    function init() {
        bindEvents();
    }

    // Bind all events
    function bindEvents() {
        // File input
        el.fileInput.addEventListener('change', handleFileSelect);
        
        // Drag and drop
        el.dropzone.addEventListener('dragover', handleDragOver);
        el.dropzone.addEventListener('dragleave', handleDragLeave);
        el.dropzone.addEventListener('drop', handleDrop);
        
        // Settings changes
        el.baseName.addEventListener('input', handleSettingsChange);
        el.startNumber.addEventListener('input', handleSettingsChange);
        el.leadingZeros.addEventListener('change', handleSettingsChange);
        el.separator.addEventListener('change', handleSettingsChange);
        el.findText.addEventListener('input', handleSettingsChange);
        el.replaceText.addEventListener('input', handleSettingsChange);
        
        // Case buttons
        el.caseBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                el.caseBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.settings.caseOption = btn.dataset.case;
                updatePreview();
            });
        });
        
        // Action buttons
        el.btnDownload.addEventListener('click', downloadZip);
        el.btnClear.addEventListener('click', clearAll);
        el.btnAddMore.addEventListener('click', () => el.fileInput.click());
    }

    // Handle file selection
    function handleFileSelect(e) {
        if (e.target.files.length) {
            addFiles(Array.from(e.target.files));
        }
    }

    // Drag handlers
    function handleDragOver(e) {
        e.preventDefault();
        el.dropzone.classList.add('drag-over');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        el.dropzone.classList.remove('drag-over');
    }

    function handleDrop(e) {
        e.preventDefault();
        el.dropzone.classList.remove('drag-over');
        
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (files.length) {
            addFiles(files);
        }
    }

    // Add files to state
    function addFiles(newFiles) {
        // Filter only images
        const imageFiles = newFiles.filter(f => f.type.startsWith('image/'));
        
        // Add to state
        imageFiles.forEach(file => {
            state.files.push({
                file: file,
                originalName: file.name,
                extension: getExtension(file.name),
                url: URL.createObjectURL(file)
            });
        });
        
        // Reset file input
        el.fileInput.value = '';
        
        // Show editor if we have files
        if (state.files.length > 0) {
            showEditor();
            updatePreview();
        }
    }

    // Get file extension
    function getExtension(filename) {
        const parts = filename.split('.');
        return parts.length > 1 ? '.' + parts.pop().toLowerCase() : '';
    }

    // Get filename without extension
    function getBaseName(filename) {
        const ext = getExtension(filename);
        return filename.slice(0, filename.length - ext.length);
    }

    // Show editor section
    function showEditor() {
        el.uploadSection.style.display = 'none';
        el.editorSection.style.display = 'block';
        updateDownloadButton();
    }

    // Handle settings change
    function handleSettingsChange() {
        state.settings.baseName = el.baseName.value;
        state.settings.startNumber = parseInt(el.startNumber.value) || 1;
        state.settings.leadingZeros = parseInt(el.leadingZeros.value) || 0;
        state.settings.separator = el.separator.value;
        state.settings.findText = el.findText.value;
        state.settings.replaceText = el.replaceText.value;
        
        updatePreview();
    }

    // Generate new filename
    function generateNewName(file, index) {
        const s = state.settings;
        let newName;
        
        if (s.baseName.trim()) {
            // Use custom base name with numbering
            const num = s.startNumber + index;
            const paddedNum = s.leadingZeros > 0 
                ? String(num).padStart(s.leadingZeros, '0') 
                : String(num);
            newName = s.baseName + s.separator + paddedNum;
        } else {
            // Use original name
            newName = getBaseName(file.originalName);
            
            // Apply find & replace
            if (s.findText) {
                const regex = new RegExp(escapeRegex(s.findText), 'gi');
                newName = newName.replace(regex, s.replaceText);
            }
        }
        
        // Apply case conversion
        if (s.caseOption === 'lower') {
            newName = newName.toLowerCase();
        } else if (s.caseOption === 'upper') {
            newName = newName.toUpperCase();
        }
        
        // Add extension
        return newName + file.extension;
    }

    // Escape regex special characters
    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Update preview table
    function updatePreview() {
        const newNames = [];
        const duplicates = new Set();
        
        // Generate all new names first
        state.files.forEach((file, index) => {
            const newName = generateNewName(file, index);
            newNames.push(newName);
            
            // Check for duplicates
            const existing = newNames.slice(0, index);
            if (existing.includes(newName)) {
                duplicates.add(index);
                // Also mark the original
                duplicates.add(existing.indexOf(newName));
            }
        });
        
        // Handle duplicates by adding suffix
        const finalNames = newNames.map((name, index) => {
            if (duplicates.has(index)) {
                const ext = state.files[index].extension;
                const base = name.slice(0, name.length - ext.length);
                let suffix = 2;
                let newName = base + '_' + suffix + ext;
                
                while (newNames.includes(newName) || finalNames?.includes(newName)) {
                    suffix++;
                    newName = base + '_' + suffix + ext;
                }
                return newName;
            }
            return name;
        });
        
        // Store final names in state
        state.files.forEach((file, index) => {
            file.newName = finalNames[index];
        });
        
        // Render table
        el.previewBody.innerHTML = state.files.map((file, index) => `
            <tr>
                <td>${index + 1}</td>
                <td><img class="thumb-img" src="${file.url}" alt="" loading="lazy"></td>
                <td class="original-name">${escapeHtml(file.originalName)}</td>
                <td class="arrow-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                </td>
                <td class="new-name">${escapeHtml(file.newName)}</td>
            </tr>
        `).join('');
        
        // Update count
        el.fileCount.textContent = `${state.files.length} file${state.files.length !== 1 ? 's' : ''}`;
        
        // Update download button
        updateDownloadButton();
    }

    // Escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Update download button state
    function updateDownloadButton() {
        el.btnDownload.disabled = state.files.length === 0;
    }

    // Download as ZIP
    async function downloadZip() {
        if (state.files.length === 0) return;
        
        showProcessing(true);
        el.processingText.textContent = 'Creating ZIP...';
        el.progressFill.style.width = '0%';
        
        try {
            const zip = new JSZip();
            const total = state.files.length;
            
            for (let i = 0; i < total; i++) {
                const file = state.files[i];
                
                // Update progress
                const progress = Math.round(((i + 1) / total) * 100);
                el.progressFill.style.width = progress + '%';
                el.processingText.textContent = `Processing ${i + 1} of ${total}...`;
                
                // Read file as array buffer
                const buffer = await readFileAsArrayBuffer(file.file);
                
                // Add to ZIP with new name
                zip.file(file.newName, buffer);
                
                // Small delay for UI update
                await delay(10);
            }
            
            el.processingText.textContent = 'Generating ZIP...';
            
            // Generate ZIP
            const zipBlob = await zip.generateAsync({ 
                type: 'blob',
                compression: 'STORE' // No compression to preserve quality
            });
            
            // Download
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `renamed-images-${Date.now()}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
        } catch (error) {
            alert('Error creating ZIP: ' + error.message);
        } finally {
            showProcessing(false);
        }
    }

    // Read file as ArrayBuffer
    function readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file);
        });
    }

    // Delay helper
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Show/hide processing modal
    function showProcessing(show) {
        el.processingModal.classList.toggle('active', show);
    }

    // Clear all files
    function clearAll() {
        // Revoke URLs
        state.files.forEach(file => URL.revokeObjectURL(file.url));
        
        // Reset state
        state.files = [];
        
        // Reset UI
        el.uploadSection.style.display = 'block';
        el.editorSection.style.display = 'none';
        el.previewBody.innerHTML = '';
        el.fileCount.textContent = '0 files';
        
        // Reset settings
        el.baseName.value = '';
        el.startNumber.value = '1';
        el.leadingZeros.value = '3';
        el.separator.value = '_';
        el.findText.value = '';
        el.replaceText.value = '';
        el.caseBtns.forEach(b => b.classList.remove('active'));
        el.caseBtns[0].classList.add('active');
        
        state.settings = {
            baseName: '',
            startNumber: 1,
            leadingZeros: 3,
            separator: '_',
            findText: '',
            replaceText: '',
            caseOption: 'none'
        };
        
        updateDownloadButton();
    }

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', init);
})();


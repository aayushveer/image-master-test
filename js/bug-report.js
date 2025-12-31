/**
 * BUG-REPORT.JS - Bug Report Button
 * Opens Google Form for bug reports
 */

'use strict';

const BugReport = {
    // Google Form URL
    FORM_URL: 'https://docs.google.com/forms/d/e/1FAIpQLSfKhHA1HOKUGctZDCLXhZJgqZvQWYs7RbvPICCEmQG3Ji3SHw/viewform',
    
    init() {
        this.injectStyles();
        this.injectButton();
    },
    
    getToolName() {
        const page = window.location.pathname.split('/').pop() || 'index.html';
        const toolNames = {
            'index.html': 'Home Page',
            'image-resize.html': 'Image Resize',
            'image-compress.html': 'Image Compress',
            'image-crop.html': 'Image Crop',
            'image-reducer.html': 'Image Reducer',
            'image-to-pdf.html': 'Image to PDF',
            'pdf-to-image.html': 'PDF to Image',
            'background-remover.html': 'Background Remover',
            'passport-photo.html': 'Passport Photo',
            'photo-collage.html': 'Photo Collage',
            'add-watermark.html': 'Add Watermark',
            'screenshot-beautifier.html': 'Screenshot Beautifier',
            'format-converter.html': 'Format Converter',
            'dp-resizer.html': 'DP Resizer',
            'bulk-rename.html': 'Bulk Rename',
            'favicon-converter.html': 'Favicon Converter',
            'logo-to-png.html': 'Logo to PNG',
            'color-palette.html': 'Color Palette',
            'whatsapp-chat-to-pdf.html': 'WhatsApp to PDF',
            'image-size-increaser.html': 'Image Size Increaser'
        };
        return toolNames[page] || page.replace('.html', '').replace(/-/g, ' ');
    },
    
    injectStyles() {
        if (document.getElementById('bug-report-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'bug-report-styles';
        style.textContent = `
            .bug-report-btn {
                position: fixed;
                bottom: 24px;
                right: 24px;
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 20px;
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
                border: none;
                border-radius: 50px;
                box-shadow: 0 4px 20px rgba(238, 90, 90, 0.4);
                cursor: pointer;
                z-index: 1000;
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                text-decoration: none;
                font-family: 'Inter', -apple-system, sans-serif;
                font-size: 14px;
                font-weight: 600;
                color: white;
            }
            .bug-report-btn:hover {
                transform: scale(1.05) translateY(-2px);
                box-shadow: 0 8px 30px rgba(238, 90, 90, 0.5);
            }
            .bug-report-btn svg {
                width: 18px;
                height: 18px;
            }
            
            @media (max-width: 600px) {
                .bug-report-btn {
                    padding: 12px;
                    border-radius: 50%;
                }
                .bug-report-btn span {
                    display: none;
                }
            }
        `;
        document.head.appendChild(style);
    },
    
    injectButton() {
        if (document.getElementById('bug-report-btn')) return;
        
        const toolName = this.getToolName();
        
        // Pre-fill tool name in Google Form URL
        const formUrl = `${this.FORM_URL}?entry.1234567890=${encodeURIComponent(toolName)}`;
        
        const btn = document.createElement('a');
        btn.id = 'bug-report-btn';
        btn.className = 'bug-report-btn';
        btn.href = this.FORM_URL;
        btn.target = '_blank';
        btn.rel = 'noopener noreferrer';
        btn.title = 'Report a Bug';
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8 2l1.88 1.88"/>
                <path d="M14.12 3.88L16 2"/>
                <path d="M9 7.13v-1a3.003 3.003 0 116 0v1"/>
                <path d="M12 20c-3.3 0-6-2.7-6-6v-3a6 6 0 0112 0v3c0 3.3-2.7 6-6 6"/>
                <path d="M12 20v-9"/>
                <path d="M6.53 9C4.6 8.8 3 7.1 3 5"/>
                <path d="M6 13H2"/>
                <path d="M3 21c0-2.1 1.7-3.9 3.8-4"/>
                <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/>
                <path d="M22 13h-4"/>
                <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/>
            </svg>
            <span>Report Bug</span>
        `;
        
        document.body.appendChild(btn);
    }
};

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => BugReport.init());
} else {
    BugReport.init();
}

window.BugReport = BugReport;

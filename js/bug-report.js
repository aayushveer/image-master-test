/**
 * BUG-REPORT.JS - Advanced Bug Report System
 * Auto-detects tool name, captures context
 * Supports: Discord Webhook, Telegram Bot, or Local Storage
 */

'use strict';

const BugReport = {
    reports: [],
    
    // ⚠️ PASTE YOUR WEBHOOK URL HERE ⚠️
    // Discord: Server Settings > Integrations > Webhooks > New Webhook > Copy URL
    // Format: https://discord.com/api/webhooks/XXXXX/YYYYY
    DISCORD_WEBHOOK: '',
    
    // OR Telegram Bot (optional)
    // 1. Message @BotFather on Telegram, create bot, get token
    // 2. Message your bot, then visit: https://api.telegram.org/bot<TOKEN>/getUpdates to get chat_id
    TELEGRAM_BOT_TOKEN: '',
    TELEGRAM_CHAT_ID: '',
    
    init() {
        this.injectStyles();
        this.injectHTML();
        this.bindEvents();
        this.loadReports();
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
                width: 52px;
                height: 52px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
                border: none;
                border-radius: 50%;
                box-shadow: 0 4px 20px rgba(238, 90, 90, 0.4);
                cursor: pointer;
                z-index: 1000;
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .bug-report-btn:hover {
                transform: scale(1.1) rotate(-5deg);
                box-shadow: 0 8px 30px rgba(238, 90, 90, 0.5);
            }
            .bug-report-btn svg {
                width: 24px;
                height: 24px;
                color: white;
            }
            
            .bug-modal {
                position: fixed;
                inset: 0;
                z-index: 2000;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(4px);
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s;
                padding: 20px;
            }
            .bug-modal.active { opacity: 1; visibility: visible; }
            
            .bug-modal__content {
                width: 100%;
                max-width: 440px;
                padding: 28px;
                background: #ffffff;
                border-radius: 16px;
                box-shadow: 0 25px 80px rgba(0,0,0,0.2);
                transform: scale(0.9) translateY(-20px);
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .bug-modal.active .bug-modal__content {
                transform: scale(1) translateY(0);
            }
            
            .bug-modal__header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 24px;
            }
            .bug-modal__header h3 {
                font-size: 20px;
                font-weight: 700;
                color: #1a1a1a;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .bug-modal__close {
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #f5f5f5;
                border: none;
                border-radius: 50%;
                font-size: 20px;
                color: #666;
                cursor: pointer;
                transition: all 0.2s;
            }
            .bug-modal__close:hover { 
                background: #eee; 
                transform: rotate(90deg); 
            }
            
            .bug-modal__tool {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 16px;
                background: linear-gradient(135deg, #f0f7ff 0%, #e8f4f8 100%);
                border-radius: 10px;
                margin-bottom: 20px;
                font-size: 14px;
                color: #4a90d9;
                font-weight: 600;
            }
            .bug-modal__tool svg {
                width: 18px;
                height: 18px;
            }
            
            .bug-modal__form { display: flex; flex-direction: column; gap: 18px; }
            .bug-modal__field { display: flex; flex-direction: column; gap: 8px; }
            .bug-modal__field label {
                font-size: 14px;
                font-weight: 600;
                color: #333;
            }
            .bug-modal__field textarea {
                width: 100%;
                min-height: 120px;
                padding: 14px;
                font-family: 'Inter', -apple-system, sans-serif;
                font-size: 14px;
                border: 2px solid #e5e5e5;
                border-radius: 12px;
                resize: vertical;
                background: #fafafa;
                transition: all 0.2s;
            }
            .bug-modal__field textarea:focus {
                outline: none;
                border-color: #4a90d9;
                background: #ffffff;
                box-shadow: 0 0 0 4px rgba(74, 144, 217, 0.1);
            }
            .bug-modal__field textarea::placeholder {
                color: #aaa;
            }
            
            .bug-modal__upload {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .bug-modal__upload-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 18px;
                font-size: 14px;
                font-weight: 600;
                color: #555;
                background: #f5f5f5;
                border: 2px dashed #ddd;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .bug-modal__upload-btn:hover {
                border-color: #4a90d9;
                color: #4a90d9;
                background: #f0f7ff;
            }
            .bug-modal__upload-btn svg { width: 18px; height: 18px; }
            .bug-modal__filename { 
                font-size: 13px; 
                color: #22c55e; 
                font-weight: 500;
            }
            
            .bug-modal__submit {
                padding: 16px;
                font-size: 16px;
                font-weight: 700;
                color: white;
                background: linear-gradient(135deg, #4a90d9 0%, #3a7bc8 100%);
                border: none;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s;
            }
            .bug-modal__submit:hover { 
                background: linear-gradient(135deg, #3a7bc8 0%, #2d6bb3 100%);
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(74, 144, 217, 0.35);
            }
            
            .bug-modal__success {
                display: none;
                text-align: center;
                padding: 30px 0;
            }
            .bug-modal__success.active { display: block; }
            .bug-modal__success svg {
                width: 64px;
                height: 64px;
                color: #22c55e;
                margin: 0 auto 16px;
            }
            .bug-modal__success h4 {
                font-size: 18px;
                color: #1a1a1a;
                margin-bottom: 8px;
            }
            .bug-modal__success p { color: #666; }
        `;
        document.head.appendChild(style);
    },
    
    injectHTML() {
        if (document.getElementById('bug-report-container')) return;
        
        const toolName = this.getToolName();
        
        const container = document.createElement('div');
        container.id = 'bug-report-container';
        container.innerHTML = `
            <button class="bug-report-btn" id="bug-btn" title="Report a Bug">
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
            </button>
            
            <div class="bug-modal" id="bug-modal">
                <div class="bug-modal__content">
                    <div class="bug-modal__header">
                        <h3>🐛 Report a Bug</h3>
                        <button class="bug-modal__close" id="bug-close">&times;</button>
                    </div>
                    
                    <div class="bug-modal__tool" id="bug-tool-name">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
                        </svg>
                        Tool: <span>${toolName}</span>
                    </div>
                    
                    <div class="bug-modal__form" id="bug-form">
                        <div class="bug-modal__field">
                            <label>What's the issue?</label>
                            <textarea id="bug-description" placeholder="Describe what went wrong or what you expected to happen..."></textarea>
                        </div>
                        
                        <div class="bug-modal__field">
                            <label>Screenshot (optional)</label>
                            <div class="bug-modal__upload">
                                <label class="bug-modal__upload-btn">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                                        <circle cx="8.5" cy="8.5" r="1.5"/>
                                        <path d="M21 15l-5-5L5 21"/>
                                    </svg>
                                    Attach Image
                                    <input type="file" accept="image/*" id="bug-image" hidden>
                                </label>
                                <span class="bug-modal__filename" id="bug-filename"></span>
                            </div>
                        </div>
                        
                        <button class="bug-modal__submit" id="bug-submit">Submit Bug Report</button>
                    </div>
                    
                    <div class="bug-modal__success" id="bug-success">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M9 12l2 2 4-4"/>
                        </svg>
                        <h4>Thank you!</h4>
                        <p>Your bug report has been saved.</p>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(container);
    },
    
    bindEvents() {
        const btn = document.getElementById('bug-btn');
        const modal = document.getElementById('bug-modal');
        const close = document.getElementById('bug-close');
        const submit = document.getElementById('bug-submit');
        const imageInput = document.getElementById('bug-image');
        
        btn?.addEventListener('click', () => this.openModal());
        close?.addEventListener('click', () => this.closeModal());
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });
        
        submit?.addEventListener('click', () => this.submitReport());
        
        imageInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            const filename = document.getElementById('bug-filename');
            if (file && filename) {
                filename.textContent = '✓ ' + file.name;
            }
        });
    },
    
    openModal() {
        const modal = document.getElementById('bug-modal');
        const form = document.getElementById('bug-form');
        const success = document.getElementById('bug-success');
        const toolNameEl = document.getElementById('bug-tool-name');
        
        // Update tool name
        if (toolNameEl) {
            const toolName = this.getToolName();
            toolNameEl.querySelector('span').textContent = toolName;
        }
        
        form.style.display = 'flex';
        success?.classList.remove('active');
        success.style.display = 'none';
        
        modal?.classList.add('active');
    },
    
    closeModal() {
        const modal = document.getElementById('bug-modal');
        modal?.classList.remove('active');
        
        // Reset form
        setTimeout(() => {
            const desc = document.getElementById('bug-description');
            const filename = document.getElementById('bug-filename');
            const imageInput = document.getElementById('bug-image');
            
            if (desc) desc.value = '';
            if (filename) filename.textContent = '';
            if (imageInput) imageInput.value = '';
        }, 300);
    },
    
    async submitReport() {
        const desc = document.getElementById('bug-description')?.value?.trim();
        const imageInput = document.getElementById('bug-image');
        const file = imageInput?.files[0];
        
        if (!desc) {
            alert('Please describe the bug.');
            return;
        }
        
        let imageData = null;
        if (file) {
            imageData = await this.fileToBase64(file);
        }
        
        const report = {
            id: Date.now(),
            tool: this.getToolName(),
            description: desc,
            image: imageData,
            page: window.location.pathname,
            userAgent: navigator.userAgent,
            screenSize: `${window.innerWidth}x${window.innerHeight}`,
            timestamp: new Date().toISOString(),
            status: 'new'
        };
        
        // Save locally
        this.saveReport(report);
        
        // Send to Discord/Telegram (live notification)
        await this.sendToWebhook(report);
        
        this.showSuccess();
    },
    
    async sendToWebhook(report) {
        // Try Discord first
        if (this.DISCORD_WEBHOOK) {
            try {
                const embed = {
                    title: `🐛 Bug Report: ${report.tool}`,
                    description: report.description,
                    color: 0xff6b6b,
                    fields: [
                        { name: '📄 Page', value: report.page, inline: true },
                        { name: '📱 Screen', value: report.screenSize, inline: true },
                        { name: '🕐 Time', value: new Date(report.timestamp).toLocaleString(), inline: true }
                    ],
                    footer: { text: 'Image Master Bug Report' }
                };
                
                await fetch(this.DISCORD_WEBHOOK, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ embeds: [embed] })
                });
                console.log('Bug sent to Discord');
            } catch (e) {
                console.warn('Discord webhook failed:', e);
            }
        }
        
        // Try Telegram
        if (this.TELEGRAM_BOT_TOKEN && this.TELEGRAM_CHAT_ID) {
            try {
                const text = `🐛 *Bug Report*\n\n` +
                    `*Tool:* ${report.tool}\n` +
                    `*Description:* ${report.description}\n` +
                    `*Page:* ${report.page}\n` +
                    `*Screen:* ${report.screenSize}\n` +
                    `*Time:* ${new Date(report.timestamp).toLocaleString()}`;
                
                await fetch(`https://api.telegram.org/bot${this.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: this.TELEGRAM_CHAT_ID,
                        text: text,
                        parse_mode: 'Markdown'
                    })
                });
                console.log('Bug sent to Telegram');
            } catch (e) {
                console.warn('Telegram send failed:', e);
            }
        }
    },
    
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },
    
    loadReports() {
        try {
            const saved = localStorage.getItem('bug_reports');
            this.reports = saved ? JSON.parse(saved) : [];
        } catch (e) {
            this.reports = [];
        }
    },
    
    saveReport(report) {
        this.reports.unshift(report);
        try {
            localStorage.setItem('bug_reports', JSON.stringify(this.reports));
        } catch (e) {
            console.error('Failed to save report');
        }
    },
    
    showSuccess() {
        const form = document.getElementById('bug-form');
        const success = document.getElementById('bug-success');
        
        if (form) form.style.display = 'none';
        if (success) {
            success.style.display = 'block';
            success.classList.add('active');
        }
        
        setTimeout(() => this.closeModal(), 2500);
    },
    
    getReports() {
        this.loadReports();
        return this.reports;
    },
    
    clearReports() {
        this.reports = [];
        localStorage.removeItem('bug_reports');
    },
    
    updateReportStatus(id, status) {
        this.loadReports();
        const report = this.reports.find(r => r.id === id);
        if (report) {
            report.status = status;
            localStorage.setItem('bug_reports', JSON.stringify(this.reports));
        }
    }
};

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => BugReport.init());
} else {
    BugReport.init();
}

window.BugReport = BugReport;

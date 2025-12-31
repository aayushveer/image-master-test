/**
 * BUG-REPORT.JS - Bug Report Button with Popup
 * Opens Google Form in a popup modal
 */

'use strict';

const BugReport = {
    // Google Form URL
    FORM_URL: 'https://docs.google.com/forms/d/e/1FAIpQLSfKhHA1HOKUGctZDCLXhZJgqZvQWYs7RbvPICCEmQG3Ji3SHw/viewform',
    
    init() {
        this.injectStyles();
        this.injectButton();
        this.injectModal();
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
                    padding: 14px;
                    border-radius: 50%;
                }
                .bug-report-btn span {
                    display: none;
                }
            }
            
            /* Modal Popup */
            .bug-modal-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(4px);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }
            .bug-modal-overlay.active {
                opacity: 1;
                visibility: visible;
            }
            
            .bug-modal-content {
                width: 100%;
                max-width: 500px;
                max-height: 90vh;
                background: #fff;
                border-radius: 16px;
                box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3);
                overflow: hidden;
                transform: scale(0.9) translateY(20px);
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .bug-modal-overlay.active .bug-modal-content {
                transform: scale(1) translateY(0);
            }
            
            .bug-modal-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 16px 20px;
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
                color: white;
            }
            .bug-modal-header h3 {
                font-size: 16px;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .bug-modal-close {
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(255,255,255,0.2);
                border: none;
                border-radius: 50%;
                font-size: 20px;
                color: white;
                cursor: pointer;
                transition: all 0.2s;
            }
            .bug-modal-close:hover {
                background: rgba(255,255,255,0.3);
                transform: rotate(90deg);
            }
            
            .bug-modal-body {
                height: 500px;
                max-height: calc(90vh - 60px);
            }
            .bug-modal-body iframe {
                width: 100%;
                height: 100%;
                border: none;
            }
            
            @media (max-width: 600px) {
                .bug-modal-content {
                    max-width: 100%;
                    max-height: 85vh;
                    border-radius: 12px;
                }
                .bug-modal-body {
                    height: 400px;
                    max-height: calc(85vh - 60px);
                }
            }
        `;
        document.head.appendChild(style);
    },
    
    injectButton() {
        if (document.getElementById('bug-report-btn')) return;
        
        const btn = document.createElement('button');
        btn.id = 'bug-report-btn';
        btn.className = 'bug-report-btn';
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
        
        btn.addEventListener('click', () => this.openModal());
        document.body.appendChild(btn);
    },
    
    injectModal() {
        if (document.getElementById('bug-modal-overlay')) return;
        
        const modal = document.createElement('div');
        modal.id = 'bug-modal-overlay';
        modal.className = 'bug-modal-overlay';
        modal.innerHTML = `
            <div class="bug-modal-content">
                <div class="bug-modal-header">
                    <h3>🐛 Report a Bug</h3>
                    <button class="bug-modal-close" id="bug-modal-close">&times;</button>
                </div>
                <div class="bug-modal-body">
                    <iframe src="" id="bug-form-iframe" title="Bug Report Form"></iframe>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close button
        document.getElementById('bug-modal-close').addEventListener('click', () => this.closeModal());
        
        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });
        
        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
    },
    
    openModal() {
        const modal = document.getElementById('bug-modal-overlay');
        const iframe = document.getElementById('bug-form-iframe');
        
        // Load form in iframe
        iframe.src = this.FORM_URL + '?embedded=true';
        
        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    },
    
    closeModal() {
        const modal = document.getElementById('bug-modal-overlay');
        const iframe = document.getElementById('bug-form-iframe');
        
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Clear iframe after animation
        setTimeout(() => {
            iframe.src = '';
        }, 300);
    }
};

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => BugReport.init());
} else {
    BugReport.init();
}

window.BugReport = BugReport;

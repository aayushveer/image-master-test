/**
 * BUG-REPORT.JS - Floating Bug Report Button with Popup
 * Image Runner - Report issues without leaving the page
 */

(function() {
    'use strict';
    
    // Google Form URL (viewform for embedding)
    const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSc8VWBLMQKXZg5YHhKqX5V8X5x5X5x5X5x5/viewform?embedded=true';
    const FORM_LINK = 'https://docs.google.com/forms/d/1mnUbiyqabesIqS0zPnTH3LVsW_66eByjt1LLqP4D72s/viewform';
    
    // Create and inject styles
    function injectStyles() {
        const style = document.createElement('style');
        style.id = 'bug-report-styles';
        style.textContent = `
            /* Floating Bug Report Button */
            .bug-report-btn {
                position: fixed;
                bottom: 24px;
                right: 24px;
                z-index: 9998;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 56px;
                height: 56px;
                padding: 0;
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                color: white;
                border: none;
                border-radius: 50%;
                cursor: pointer;
                box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);
                transition: all 0.3s ease;
            }
            
            .bug-report-btn:hover {
                transform: translateY(-3px) scale(1.05);
                box-shadow: 0 8px 24px rgba(239, 68, 68, 0.6);
            }
            
            .bug-report-btn:active {
                transform: translateY(-1px) scale(1.02);
            }
            
            .bug-report-btn svg {
                width: 28px;
                height: 28px;
                filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
            }
            
            /* Popup Overlay */
            .bug-report-overlay {
                position: fixed;
                inset: 0;
                z-index: 9999;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(4px);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }
            
            .bug-report-overlay.active {
                opacity: 1;
                visibility: visible;
            }
            
            /* Popup Modal */
            .bug-report-modal {
                background: white;
                border-radius: 16px;
                width: 100%;
                max-width: 600px;
                max-height: 90vh;
                overflow: hidden;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                transform: scale(0.9) translateY(20px);
                transition: all 0.3s ease;
            }
            
            .bug-report-overlay.active .bug-report-modal {
                transform: scale(1) translateY(0);
            }
            
            /* Modal Header */
            .bug-report-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 16px 20px;
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                color: white;
            }
            
            .bug-report-header h3 {
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 18px;
                font-weight: 600;
                margin: 0;
            }
            
            .bug-report-header h3 svg {
                width: 24px;
                height: 24px;
                filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
            }
            
            .bug-report-close {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 36px;
                height: 36px;
                background: rgba(255, 255, 255, 0.2);
                border: none;
                border-radius: 50%;
                color: white;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .bug-report-close:hover {
                background: rgba(255, 255, 255, 0.3);
            }
            
            .bug-report-close svg {
                width: 20px;
                height: 20px;
            }
            
            /* Modal Body */
            .bug-report-body {
                height: 500px;
                overflow: hidden;
            }
            
            .bug-report-body iframe {
                width: 100%;
                height: 100%;
                border: none;
            }
            
            /* Loading State */
            .bug-report-loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                gap: 16px;
                color: #64748b;
            }
            
            .bug-report-loading .spinner {
                width: 40px;
                height: 40px;
                border: 3px solid #e2e8f0;
                border-top-color: #ef4444;
                border-radius: 50%;
                animation: bug-spin 1s linear infinite;
            }
            
            @keyframes bug-spin {
                to { transform: rotate(360deg); }
            }
            
            /* Footer */
            .bug-report-footer {
                padding: 12px 20px;
                background: #f8fafc;
                border-top: 1px solid #e2e8f0;
                text-align: center;
            }
            
            .bug-report-footer a {
                color: #2563eb;
                font-size: 13px;
                text-decoration: none;
            }
            
            .bug-report-footer a:hover {
                text-decoration: underline;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Create floating button
    function createButton() {
        const btn = document.createElement('button');
        btn.className = 'bug-report-btn';
        btn.setAttribute('aria-label', 'Report a Bug');
        btn.setAttribute('title', 'Report a Bug');
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 8h-2.81a5.985 5.985 0 0 0-1.82-1.96L17 4.41 15.59 3l-2.17 2.17a6.002 6.002 0 0 0-2.83 0L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z"/>
            </svg>
        `;
        btn.addEventListener('click', openPopup);
        document.body.appendChild(btn);
    }
    
    // Create popup overlay and modal
    function createPopup() {
        const overlay = document.createElement('div');
        overlay.className = 'bug-report-overlay';
        overlay.id = 'bug-report-overlay';
        overlay.innerHTML = `
            <div class="bug-report-modal">
                <div class="bug-report-header">
                    <h3>
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 8h-2.81a5.985 5.985 0 0 0-1.82-1.96L17 4.41 15.59 3l-2.17 2.17a6.002 6.002 0 0 0-2.83 0L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z"/>
                        </svg>
                        Report a Bug
                    </h3>
                    <button class="bug-report-close" id="bug-report-close" aria-label="Close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="bug-report-body" id="bug-report-body">
                    <div class="bug-report-loading">
                        <div class="spinner"></div>
                        <span>Loading form...</span>
                    </div>
                </div>
                <div class="bug-report-footer">
                    <a href="${FORM_LINK}" target="_blank" rel="noopener">Open in new tab ↗</a>
                </div>
            </div>
        `;
        
        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closePopup();
        });
        
        document.body.appendChild(overlay);
        
        // Close button
        document.getElementById('bug-report-close').addEventListener('click', closePopup);
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay.classList.contains('active')) {
                closePopup();
            }
        });
    }
    
    // Open popup
    function openPopup() {
        const overlay = document.getElementById('bug-report-overlay');
        const body = document.getElementById('bug-report-body');
        
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Load iframe if not already loaded
        if (!body.querySelector('iframe')) {
            setTimeout(() => {
                body.innerHTML = `<iframe src="${FORM_LINK}?embedded=true" loading="lazy"></iframe>`;
            }, 300);
        }
    }
    
    // Close popup
    function closePopup() {
        const overlay = document.getElementById('bug-report-overlay');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // Initialize
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setup);
        } else {
            setup();
        }
    }
    
    function setup() {
        injectStyles();
        createButton();
        createPopup();
    }
    
    init();
})();

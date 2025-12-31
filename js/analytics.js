/**
 * ANALYTICS.JS - Visitor & Tool Usage Tracking
 * Stores analytics locally + can sync to external service
 */

'use strict';

const Analytics = {
    storageKey: 'im_analytics',
    sessionKey: 'im_session',
    
    data: {
        totalVisits: 0,
        uniqueVisitors: 0,
        toolUsage: {},
        dailyVisits: {},
        lastVisit: null,
        sessions: []
    },
    
    init() {
        this.load();
        this.trackVisit();
        this.trackToolUsage();
        this.setupBeforeUnload();
    },
    
    load() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                this.data = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Analytics load failed');
        }
    },
    
    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch (e) {
            console.warn('Analytics save failed');
        }
    },
    
    trackVisit() {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date().toISOString();
        
        // Check if new session
        const lastSession = sessionStorage.getItem(this.sessionKey);
        if (!lastSession) {
            // New session
            this.data.totalVisits++;
            
            // Check if new day
            if (!this.data.dailyVisits[today]) {
                this.data.dailyVisits[today] = 0;
            }
            this.data.dailyVisits[today]++;
            
            // Check if unique visitor (first time ever)
            const visitorId = localStorage.getItem('im_visitor_id');
            if (!visitorId) {
                const newId = 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('im_visitor_id', newId);
                this.data.uniqueVisitors++;
            }
            
            // Create session
            const session = {
                id: 's_' + Date.now(),
                start: now,
                page: this.getCurrentPage(),
                toolsUsed: [],
                userAgent: navigator.userAgent.substring(0, 100)
            };
            
            this.data.sessions.unshift(session);
            
            // Keep only last 100 sessions
            if (this.data.sessions.length > 100) {
                this.data.sessions = this.data.sessions.slice(0, 100);
            }
            
            sessionStorage.setItem(this.sessionKey, session.id);
        }
        
        this.data.lastVisit = now;
        this.save();
    },
    
    trackToolUsage() {
        const page = this.getCurrentPage();
        const toolName = this.getToolName();
        
        if (toolName && toolName !== 'Home') {
            if (!this.data.toolUsage[toolName]) {
                this.data.toolUsage[toolName] = 0;
            }
            this.data.toolUsage[toolName]++;
            
            // Add to current session
            const sessionId = sessionStorage.getItem(this.sessionKey);
            if (sessionId) {
                const session = this.data.sessions.find(s => s.id === sessionId);
                if (session && !session.toolsUsed.includes(toolName)) {
                    session.toolsUsed.push(toolName);
                }
            }
            
            this.save();
        }
    },
    
    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop() || 'index.html';
        return filename;
    },
    
    getToolName() {
        const page = this.getCurrentPage();
        const toolNames = {
            'index.html': 'Home',
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
    
    setupBeforeUnload() {
        window.addEventListener('beforeunload', () => {
            const sessionId = sessionStorage.getItem(this.sessionKey);
            if (sessionId) {
                const session = this.data.sessions.find(s => s.id === sessionId);
                if (session) {
                    session.end = new Date().toISOString();
                    this.save();
                }
            }
        });
    },
    
    getStats() {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        
        // Sort tools by usage
        const topTools = Object.entries(this.data.toolUsage)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        return {
            totalVisits: this.data.totalVisits,
            uniqueVisitors: this.data.uniqueVisitors,
            todayVisits: this.data.dailyVisits[today] || 0,
            yesterdayVisits: this.data.dailyVisits[yesterday] || 0,
            topTools: topTools,
            recentSessions: this.data.sessions.slice(0, 20),
            lastVisit: this.data.lastVisit
        };
    },
    
    clearData() {
        this.data = {
            totalVisits: 0,
            uniqueVisitors: 0,
            toolUsage: {},
            dailyVisits: {},
            lastVisit: null,
            sessions: []
        };
        this.save();
    }
};

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Analytics.init());
} else {
    Analytics.init();
}

window.Analytics = Analytics;


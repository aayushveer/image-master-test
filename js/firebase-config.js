/**
 * FIREBASE CONFIG - Cloud Bug Reports & Analytics
 * Free tier: 1GB storage, 10GB/month transfer
 */

// Firebase Configuration
// TODO: Replace with your own Firebase config from https://console.firebase.google.com
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Firebase Database Helper
const FirebaseDB = {
    db: null,
    initialized: false,
    
    async init() {
        if (this.initialized) return true;
        
        try {
            // Check if Firebase is loaded
            if (typeof firebase === 'undefined') {
                console.warn('Firebase SDK not loaded');
                return false;
            }
            
            // Initialize Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            
            this.db = firebase.database();
            this.initialized = true;
            console.log('Firebase initialized successfully');
            return true;
        } catch (error) {
            console.error('Firebase init error:', error);
            return false;
        }
    },
    
    // Bug Reports
    async addBugReport(report) {
        if (!await this.init()) {
            // Fallback to localStorage
            return this.localAddBug(report);
        }
        
        try {
            const ref = this.db.ref('bug_reports').push();
            report.id = ref.key;
            report.timestamp = new Date().toISOString();
            await ref.set(report);
            console.log('Bug report saved to Firebase:', report.id);
            return report;
        } catch (error) {
            console.error('Firebase save error:', error);
            return this.localAddBug(report);
        }
    },
    
    async getBugReports() {
        if (!await this.init()) {
            return this.localGetBugs();
        }
        
        try {
            const snapshot = await this.db.ref('bug_reports').orderByChild('timestamp').once('value');
            const reports = [];
            snapshot.forEach(child => {
                reports.unshift({ ...child.val(), id: child.key });
            });
            return reports;
        } catch (error) {
            console.error('Firebase fetch error:', error);
            return this.localGetBugs();
        }
    },
    
    async updateBugStatus(id, status) {
        if (!await this.init()) {
            return this.localUpdateBug(id, status);
        }
        
        try {
            await this.db.ref(`bug_reports/${id}`).update({ status });
            return true;
        } catch (error) {
            console.error('Firebase update error:', error);
            return false;
        }
    },
    
    async deleteBugReport(id) {
        if (!await this.init()) {
            return this.localDeleteBug(id);
        }
        
        try {
            await this.db.ref(`bug_reports/${id}`).remove();
            return true;
        } catch (error) {
            console.error('Firebase delete error:', error);
            return false;
        }
    },
    
    // Analytics
    async trackVisit(data) {
        if (!await this.init()) return;
        
        try {
            const today = new Date().toISOString().split('T')[0];
            const visitsRef = this.db.ref(`analytics/visits/${today}`);
            await visitsRef.transaction(count => (count || 0) + 1);
            
            // Track tool usage
            if (data.tool && data.tool !== 'Home') {
                const toolRef = this.db.ref(`analytics/tools/${data.tool.replace(/[.#$/[\]]/g, '_')}`);
                await toolRef.transaction(count => (count || 0) + 1);
            }
        } catch (error) {
            console.error('Analytics track error:', error);
        }
    },
    
    async getAnalytics() {
        if (!await this.init()) {
            return this.localGetAnalytics();
        }
        
        try {
            const snapshot = await this.db.ref('analytics').once('value');
            return snapshot.val() || { visits: {}, tools: {} };
        } catch (error) {
            console.error('Analytics fetch error:', error);
            return { visits: {}, tools: {} };
        }
    },
    
    // LocalStorage Fallbacks
    localAddBug(report) {
        const reports = this.localGetBugs();
        report.id = Date.now();
        reports.unshift(report);
        localStorage.setItem('bug_reports', JSON.stringify(reports));
        return report;
    },
    
    localGetBugs() {
        try {
            return JSON.parse(localStorage.getItem('bug_reports') || '[]');
        } catch {
            return [];
        }
    },
    
    localUpdateBug(id, status) {
        const reports = this.localGetBugs();
        const report = reports.find(r => r.id == id);
        if (report) {
            report.status = status;
            localStorage.setItem('bug_reports', JSON.stringify(reports));
        }
        return !!report;
    },
    
    localDeleteBug(id) {
        let reports = this.localGetBugs();
        reports = reports.filter(r => r.id != id);
        localStorage.setItem('bug_reports', JSON.stringify(reports));
        return true;
    },
    
    localGetAnalytics() {
        try {
            return JSON.parse(localStorage.getItem('im_analytics') || '{}');
        } catch {
            return {};
        }
    }
};

// Export for global use
window.FirebaseDB = FirebaseDB;









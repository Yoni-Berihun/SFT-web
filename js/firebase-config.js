console.log('🔥 Loading Firebase configuration...');

// Initialize Firebase immediately (no DOMContentLoaded wait)
(function initFirebase() {
    // Check if Firebase SDK is loaded
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase SDK not loaded. Check internet connection and script order.');
        window.firebaseApp = null;
        window.firebaseAuth = null;
        window.firestore = null;
        window.firebaseReady = false;
        return;
    }
    
    console.log('✅ Firebase SDK loaded:', firebase.SDK_VERSION);
    
    const firebaseConfig = {
        apiKey: "AIzaSyBDJKZAWeOr723ukImwDjxFRrwOhIWiTLM",
        authDomain: "edufinance-cfc53.firebaseapp.com",
        projectId: "edufinance-cfc53",
        storageBucket: "edufinance-cfc53.firebasestorage.app",
        messagingSenderId: "908250102794",
        appId: "1:908250102794:web:0f314208ef345f695db3f3"
    };

    try {
        // Initialize Firebase
        let app;
        try {
            app = firebase.initializeApp(firebaseConfig);
            console.log('✅ Firebase initialized successfully');
        } catch (initError) {
            // Check if already initialized
            if (initError.code === 'app/duplicate-app') {
                console.log('ℹ️ Firebase already initialized, using existing instance');
                app = firebase.app();
            } else {
                throw initError;
            }
        }
        
        // Export services
        window.firebaseApp = app;
        window.firebaseAuth = firebase.auth();
        window.firestore = firebase.firestore();
        window.firebaseReady = true;
        
        console.log('✅ Firebase services ready:', {
            auth: !!window.firebaseAuth,
            firestore: !!window.firestore
        });
        
        // Dispatch ready event
        window.dispatchEvent(new CustomEvent('firebaseReady'));
        
    } catch (error) {
        console.error('❌ Firebase initialization error:', error);
        window.firebaseApp = null;
        window.firebaseAuth = null;
        window.firestore = null;
        window.firebaseReady = false;
    }
})();
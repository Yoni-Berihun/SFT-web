
console.log('🔥 Loading Firebase configuration...');

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait a tiny bit to ensure Firebase SDK is loaded
    setTimeout(function() {
        initFirebase();
    }, 100);
});

function initFirebase() {
    // Check if Firebase SDK is loaded
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase SDK not loaded. Check internet connection and script order.');
        window.firebaseApp = null;
        window.firebaseAuth = null;
        window.firestore = null;
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
        const app = firebase.initializeApp(firebaseConfig);
        console.log('✅ Firebase initialized successfully');
        
        // Export services
        window.firebaseApp = app;
        window.firebaseAuth = firebase.auth();
        window.firestore = firebase.firestore();
        
        console.log('Firebase services ready:', {
            auth: !!window.firebaseAuth,
            firestore: !!window.firestore
        });
        
    } catch (error) {
        console.error('❌ Firebase initialization error:', error);
        
        // Check if already initialized
        if (error.code === 'app/duplicate-app') {
            console.log('ℹ️ Firebase already initialized');
            window.firebaseApp = firebase.app();
            window.firebaseAuth = firebase.auth();
            window.firestore = firebase.firestore();
        } else {
            window.firebaseApp = null;
            window.firebaseAuth = null;
            window.firestore = null;
        }
    }
}
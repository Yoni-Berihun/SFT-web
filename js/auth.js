// js/auth.js - IMPROVED VERSION
console.log('Loading authentication module...');

const Auth = {
    // Track if Firebase is ready
    _firebaseReady: false,
    _readyCallbacks: [],
    
    // Initialize Firebase auth
    init() {
        console.log('Initializing Firebase Auth...');
        
        // Check periodically if Firebase is ready
        const checkInterval = setInterval(() => {
            if (window.firebaseAuth && typeof firebase !== 'undefined') {
                console.log('✅ Firebase Auth is now ready');
                this._firebaseReady = true;
                clearInterval(checkInterval);
                
                // Notify all waiting callbacks
                this._readyCallbacks.forEach(callback => callback());
                this._readyCallbacks = [];
            }
        }, 100);
        
        // Set timeout to stop checking after 5 seconds
        setTimeout(() => {
            if (!this._firebaseReady) {
                console.warn('⚠️ Firebase Auth not ready after 5 seconds, using fallback');
                clearInterval(checkInterval);
            }
        }, 5000);
    },
    
    // Wait for Firebase to be ready
    waitForFirebase() {
        return new Promise((resolve) => {
            if (this._firebaseReady) {
                resolve();
            } else {
                this._readyCallbacks.push(resolve);
            }
        });
    },
    
    // Sign up new user
    async signUp(email, password, userData = {}) {
        try {
            await this.waitForFirebase();
            
            if (!window.firebaseAuth) {
                throw new Error("Firebase is not available. Check your internet connection.");
            }
            
            console.log('Creating user account for:', email);
            const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Prepare user profile
            const profile = {
                name: userData.name || email.split('@')[0] || 'Student',
                email: user.email,
                budget: userData.budget || 5000,
                currency: userData.currency || 'Birr',
                notifications: true,
                avatarBase64: null,
                theme: 'light',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // Save to Firestore
            await this.saveUserProfile(user.uid, profile);
            
            console.log('✅ User created successfully:', user.uid);
            return { 
                success: true, 
                user: user,
                profile: profile
            };
            
        } catch (error) {
            console.error('❌ Sign up error:', error);
            
            // User-friendly error messages
            let errorMessage = "Registration failed. Please try again.";
            
            switch(error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = "This email is already registered. Please sign in instead.";
                    break;
                case 'auth/invalid-email':
                    errorMessage = "Please enter a valid email address.";
                    break;
                case 'auth/weak-password':
                    errorMessage = "Password should be at least 6 characters.";
                    break;
                case 'auth/network-request-failed':
                    errorMessage = "Network error. Please check your internet connection.";
                    break;
            }
            
            return { 
                success: false, 
                error: errorMessage,
                code: error.code 
            };
        }
    },

    // Sign in existing user
    async signIn(email, password) {
        try {
            await this.waitForFirebase();
            
            if (!window.firebaseAuth) {
                throw new Error("Firebase is not available. Check your internet connection.");
            }
            
            console.log('Signing in user:', email);
            const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            console.log('✅ User signed in successfully:', user.uid);
            return { 
                success: true, 
                user: user 
            };
            
        } catch (error) {
            console.error('❌ Sign in error:', error);
            
            // User-friendly error messages
            let errorMessage = "Login failed. Please check your credentials.";
            
            switch(error.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    errorMessage = "Invalid email or password.";
                    break;
                case 'auth/invalid-email':
                    errorMessage = "Please enter a valid email address.";
                    break;
                case 'auth/user-disabled':
                    errorMessage = "This account has been disabled.";
                    break;
                case 'auth/too-many-requests':
                    errorMessage = "Too many failed attempts. Please try again later.";
                    break;
                case 'auth/network-request-failed':
                    errorMessage = "Network error. Please check your internet connection.";
                    break;
            }
            
            return { 
                success: false, 
                error: errorMessage,
                code: error.code 
            };
        }
    },

    // Sign out
    async signOut() {
        try {
            await this.waitForFirebase();
            
            if (window.firebaseAuth) {
                await firebaseAuth.signOut();
                console.log('✅ User signed out');
            }
            return { success: true };
        } catch (error) {
            console.error('❌ Sign out error:', error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    },

    // Save user profile to Firestore
    async saveUserProfile(userId, profileData) {
        try {
            await this.waitForFirebase();
            
            if (!window.firestore) {
                console.warn('Firestore not available, skipping profile save');
                return;
            }
            
            await firestore.collection('users').doc(userId).set({
                ...profileData,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            
            console.log('✅ User profile saved to Firestore:', userId);
        } catch (error) {
            console.error('❌ Save profile error:', error);
        }
    },

    // Get user profile from Firestore
    async getUserProfile(userId) {
        try {
            await this.waitForFirebase();
            
            if (!window.firestore) {
                console.warn('Firestore not available');
                return null;
            }
            
            const doc = await firestore.collection('users').doc(userId).get();
            if (doc.exists) {
                return doc.data();
            }
            return null;
        } catch (error) {
            console.error('❌ Get profile error:', error);
            return null;
        }
    },

    // Get current user from Firebase
    getCurrentUser() {
        if (this._firebaseReady && window.firebaseAuth) {
            return firebaseAuth.currentUser;
        }
        return null;
    },

    // Check auth state changes
    onAuthStateChanged(callback) {
        if (this._firebaseReady && window.firebaseAuth) {
            console.log('✅ Setting up Firebase auth state listener');
            return firebaseAuth.onAuthStateChanged(callback);
        }
        
        // If Firebase not ready yet, wait for it
        console.log('⏳ Firebase Auth not ready yet, queuing listener');
        this._readyCallbacks.push(() => {
            if (window.firebaseAuth) {
                console.log('✅ Setting up queued Firebase auth state listener');
                return firebaseAuth.onAuthStateChanged(callback);
            }
        });
        
        // Fallback for offline/demo
        console.warn('Firebase auth not available, using localStorage fallback');
        const session = window.App?.getSession?.();
        if (session?.isAuthenticated) {
            callback({ 
                uid: 'local-user', 
                email: session.email,
                isLocal: true 
            });
        } else {
            callback(null);
        }
        
        return () => {}; // Return empty unsubscribe function
    },

    // Reset password
    async resetPassword(email) {
        try {
            await this.waitForFirebase();
            
            if (!window.firebaseAuth) {
                throw new Error("Firebase is not available.");
            }
            
            await firebaseAuth.sendPasswordResetEmail(email);
            console.log('✅ Password reset email sent to:', email);
            return { success: true };
            
        } catch (error) {
            console.error('❌ Reset password error:', error);
            
            let errorMessage = "Failed to send reset email. Please try again.";
            
            switch(error.code) {
                case 'auth/user-not-found':
                    errorMessage = "No account found with this email.";
                    break;
                case 'auth/invalid-email':
                    errorMessage = "Please enter a valid email address.";
                    break;
            }
            
            return { 
                success: false, 
                error: errorMessage 
            };
        }
    },

    // Update user profile
    async updateUserProfile(userId, updates) {
        try {
            await this.waitForFirebase();
            
            if (!window.firestore) {
                console.warn('Firestore not available');
                return { success: false, error: 'Firestore not available' };
            }
            
            await firestore.collection('users').doc(userId).update({
                ...updates,
                updatedAt: new Date().toISOString()
            });
            
            console.log('✅ User profile updated:', userId);
            return { success: true };
            
        } catch (error) {
            console.error('❌ Update profile error:', error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    }
};

// Initialize auth when module loads
Auth.init();

window.Auth = Auth;
console.log('✅ Authentication module loaded with async support');
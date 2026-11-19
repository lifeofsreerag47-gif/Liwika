// LIWI-KA FIREBASE CONFIGURATION
// Firebase's web API key is safe to include in client-side code.
// Keep any Firebase Admin/service-account credentials OFF the website.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, browserLocalPersistence, setPersistence } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-storage.js';
import { getFunctions } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-functions.js';

const firebaseConfig = {
    apiKey: 'AIzaSyCZyZWxse33ll5t6lffJ4lIUKYx8lRe1T4',
    authDomain: 'liwika-3719e.firebaseapp.com',
    projectId: 'liwika-3719e',
    storageBucket: 'liwika-3719e.firebasestorage.app',
    messagingSenderId: '370761593444',
    appId: '1:370761593444:web:5aff158fe0b4f946c02571',
    measurementId: 'G-65529K0KQP'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});
const storage = getStorage(app);
// All order, payment, OTP and profile actions run in trusted Cloud Functions (asia-south1).
const functions = getFunctions(app, 'asia-south1');

// Optional App Check (blocks bots/scripts that are not your real website).
// 1) Firebase Console > App Check > register this web app with reCAPTCHA Enterprise
// 2) Paste the site key below, deploy, then set ENFORCE_APP_CHECK=true in functions/.env
const APP_CHECK_SITE_KEY = '';
if (APP_CHECK_SITE_KEY) {
    try {
        const ac = await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-app-check.js');
        ac.initializeAppCheck(app, { provider: new ac.ReCaptchaEnterpriseProvider(APP_CHECK_SITE_KEY), isTokenAutoRefreshEnabled: true });
    } catch (error) { console.warn('App Check could not start', error); }
}

// Keep the Firebase login persistent in this browser, similar to the old
// Liwi-Ka "Remember me" behaviour.
const persistenceReady = setPersistence(auth, browserLocalPersistence);

export { app, auth, db, storage, functions, persistenceReady };

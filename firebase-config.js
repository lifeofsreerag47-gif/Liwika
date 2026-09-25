// LIWI-KA FIREBASE CONFIGURATION
// Firebase's web API key is safe to include in client-side code.
// Keep any Firebase Admin/service-account credentials OFF the website.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, browserLocalPersistence, setPersistence } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

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
const db = getFirestore(app);

// Keep the Firebase login persistent in this browser, similar to the old
// Liwi-Ka "Remember me" behaviour.
const persistenceReady = setPersistence(auth, browserLocalPersistence);

export { app, auth, db, persistenceReady };

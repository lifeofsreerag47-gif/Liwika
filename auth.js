// LIWI-KA CUSTOMER AUTHENTICATION
// Firebase Authentication handles email/password accounts and sessions.
// Firestore stores the customer's Liwi-Ka profile data.

import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';

import {
    doc,
    setDoc,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

import { auth, db, persistenceReady } from './firebase-config.js';

(function () {
    'use strict';

    const AUTH_KEY = 'liwika_auth_session';

    document.querySelectorAll('.password-toggle').forEach(function (button) {
        button.addEventListener('click', function () {
            const targetId = button.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (!input) return;

            if (input.type === 'password') {
                input.type = 'text';
                button.textContent = 'HIDE';
                window.setTimeout(function () {
                    if (input.type === 'text') input.type = 'password';
                    button.textContent = 'VIEW';
                }, 1000);
            } else {
                input.type = 'password';
                button.textContent = 'VIEW';
            }
        });
    });

    function safeWrite(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            return false;
        }
    }

    function getReturnTo() {
        const params = new URLSearchParams(window.location.search);
        const requested = params.get('returnTo');
        if (!requested || requested.includes('://') || requested.startsWith('//')) {
            return 'index.html';
        }
        return requested;
    }

    function redirectAfterAuth() {
        window.location.href = getReturnTo();
    }

    function showAuthError(error, fallbackMessage) {
        const code = error && error.code ? error.code : '';

        const messages = {
            'auth/email-already-in-use': 'An account with this email already exists. Please sign in instead.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/weak-password': 'Please use a stronger password. Firebase requires at least 6 characters.',
            'auth/invalid-credential': 'We could not sign you in with those details. Please check your email and password.',
            'auth/invalid-login-credentials': 'We could not sign you in with those details. Please check your email and password.',
            'auth/user-disabled': 'This account has been disabled.',
            'auth/too-many-requests': 'Too many attempts. Please wait a little and try again.',
            'auth/network-request-failed': 'Network error. Please check your internet connection and try again.'
        };

        alert(messages[code] || fallbackMessage || 'Something went wrong. Please try again.');
        console.error('Liwi-Ka Firebase Auth error:', error);
    }

    function rememberFirebaseUser(user) {
        safeWrite(AUTH_KEY, {
            uid: user.uid,
            email: user.email || '',
            name: user.displayName || '',
            signedInAt: Date.now()
        });
    }

    // SIGN IN
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const email = document.getElementById('loginEmail').value.trim().toLowerCase();
            const password = document.getElementById('loginPassword').value;
            const submitButton = loginForm.querySelector('button[type="submit"]');

            if (!email || !password) return;

            submitButton.disabled = true;

            try {
                await persistenceReady;
                const credential = await signInWithEmailAndPassword(auth, email, password);
                const user = credential.user;

                // Signup sends a verification email. Don't allow an unverified
                // account to enter the normal Liwi-Ka customer session yet.
                if (!user.emailVerified) {
                    await sendEmailVerification(user);
                    await signOut(auth);
                    alert('Your email is not verified yet. We sent you a new verification email. Please verify it, then sign in again.');
                    return;
                }

                rememberFirebaseUser(user);
                redirectAfterAuth();
            } catch (error) {
                showAuthError(error, 'We could not sign you in. Please check your details and try again.');
            } finally {
                submitButton.disabled = false;
            }
        });
    }

    // SIGN UP
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const name = document.getElementById('fullName').value.trim();
            const email = document.getElementById('signupEmail').value.trim().toLowerCase();
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const submitButton = signupForm.querySelector('button[type="submit"]');

            if (!name) {
                alert('Please enter your full name.');
                return;
            }

            if (password !== confirmPassword) {
                alert('Passwords do not match.');
                return;
            }

            if (password.length < 8) {
                alert('Please use a password with at least 8 characters.');
                return;
            }

            submitButton.disabled = true;

            try {
                await persistenceReady;

                const credential = await createUserWithEmailAndPassword(auth, email, password);
                const user = credential.user;

                // Store the non-sensitive customer profile in Firestore.
                await setDoc(doc(db, 'users', user.uid), {
                    uid: user.uid,
                    name: name,
                    email: email,
                    emailVerified: false,
                    createdAt: serverTimestamp()
                }, { merge: true });

                // Use Firebase's built-in email verification for this first
                // Firebase integration. A custom 6-digit OTP can be added later
                // with a Cloud Function + email provider.
                await sendEmailVerification(user);
                await signOut(auth);

                alert('Account created! We sent a verification email to ' + email + '. Verify your email, then sign in.');
                window.location.href = 'login.html' + (getReturnTo() !== 'index.html' ? '?returnTo=' + encodeURIComponent(getReturnTo()) : '');
            } catch (error) {
                showAuthError(error, 'We could not create your account. Please try again.');
            } finally {
                submitButton.disabled = false;
            }
        });
    }

    // FORGOT PASSWORD
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', async function (event) {
            event.preventDefault();

            const emailInput = document.getElementById('loginEmail');
            const email = (emailInput ? emailInput.value.trim().toLowerCase() : '');
            const requestedEmail = email || window.prompt('Enter the email address for your Liwi-Ka account:');

            if (!requestedEmail) return;

            try {
                await persistenceReady;
                await sendPasswordResetEmail(auth, requestedEmail.trim().toLowerCase());
                alert('Password reset email sent. Please check your inbox.');
            } catch (error) {
                showAuthError(error, 'We could not send the password reset email. Please check the email address and try again.');
            }
        });
    }
})();

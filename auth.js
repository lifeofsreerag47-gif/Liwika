// LIWI-KA CUSTOMER AUTHENTICATION
// Only verified phone OTP and Google sign-in are offered on the customer pages.
// No email/password form or synthetic email address is created for phone users.

import {
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    GoogleAuthProvider,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    getAdditionalUserInfo,
    deleteUser,
    signOut,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

import { auth, db, persistenceReady } from './firebase-config.js';

(function () {
    'use strict';

    const AUTH_KEY = 'liwika_auth_session';
    const feedback = document.getElementById('authFeedback');
    const googleButton = document.getElementById('googleSignInButton');
    const phoneInput = document.getElementById('phoneNumber');
    const phoneNameInput = document.getElementById('phoneName');
    const sendCodeButton = document.getElementById('sendPhoneCode');
    const otpPanel = document.getElementById('otpPanel');
    const otpInput = document.getElementById('phoneOtp');
    const verifyCodeButton = document.getElementById('verifyPhoneCode');
    const changeNumberButton = document.getElementById('changePhoneNumber');
    const resendCodeButton = document.getElementById('resendPhoneCode');
    const termsAgreement = document.getElementById('termsAgreement');
    const isSignUp = document.body.dataset.authMode === 'sign-up';

    let recaptchaVerifier = null;
    let phoneConfirmation = null;
    let requestedPhoneNumber = '';

    if (phoneNameInput) {
        phoneNameInput.required = isSignUp;
        const nameField = phoneNameInput.closest('.phone-name-field');
        if (nameField) nameField.hidden = !isSignUp;
    }

    function setFeedback(message, type) {
        if (!feedback) return;
        feedback.textContent = message;
        feedback.dataset.type = type || 'info';
        feedback.hidden = !message;
    }

    function setButtonLabel(button, label) {
        if (!button) return;
        const labelNode = button.querySelector('span:first-child');
        if (labelNode) labelNode.textContent = label;
        else button.textContent = label;
    }

    function setBusy(button, isBusy, busyText) {
        if (!button) return;
        if (isBusy) {
            if (!button.dataset.originalHtml) button.dataset.originalHtml = button.innerHTML;
            button.disabled = true;
            button.setAttribute('aria-busy', 'true');
            if (busyText) setButtonLabel(button, busyText);
        } else {
            button.disabled = false;
            button.removeAttribute('aria-busy');
            if (button.dataset.originalHtml) {
                button.innerHTML = button.dataset.originalHtml;
                delete button.dataset.originalHtml;
            }
        }
    }

    function getReturnTo() {
        const params = new URLSearchParams(window.location.search);
        const requested = params.get('returnTo');
        if (!requested) return 'index.html';
        try {
            const safeUrl = new URL(requested, window.location.href);
            if (safeUrl.origin !== window.location.origin) return 'index.html';
            return safeUrl.pathname + safeUrl.search + safeUrl.hash;
        } catch (error) {
            return 'index.html';
        }
    }

    function redirectAfterAuth() {
        window.location.assign(getReturnTo());
    }

    function hasAcceptedTerms() {
        return !isSignUp || Boolean(termsAgreement && termsAgreement.checked);
    }

    function validateCreateAccountDetails(requirePhoneName) {
        if (!isSignUp) return true;

        const name = phoneNameInput ? phoneNameInput.value.trim() : '';
        if (requirePhoneName && !name) {
            setFeedback('Please enter your full name to create your Liwi-Ka account.', 'error');
            if (phoneNameInput) phoneNameInput.focus();
            return false;
        }
        if (!hasAcceptedTerms()) {
            setFeedback('Please tick the agreement checkbox before creating your account.', 'error');
            if (termsAgreement) termsAgreement.focus();
            return false;
        }
        return true;
    }

    function rememberFirebaseUser(user, name) {
        try {
            localStorage.setItem(AUTH_KEY, JSON.stringify({
                uid: user.uid,
                email: user.email || '',
                phoneNumber: user.phoneNumber || '',
                name: name || user.displayName || '',
                signedInAt: Date.now()
            }));
        } catch (error) {
            console.warn('Liwi-Ka could not save the local account hint:', error);
        }
    }

    async function saveCustomerProfile(user, suppliedName) {
        const nameFromInput = (suppliedName || '').trim();
        let previous = {};

        try {
            const snapshot = await getDoc(doc(db, 'users', user.uid));
            if (snapshot.exists()) previous = snapshot.data() || {};
        } catch (error) {
            console.warn('Liwi-Ka profile lookup skipped:', error);
        }

        const finalName = nameFromInput || user.displayName || previous.name || 'Liwi-Ka Customer';
        if (nameFromInput && user.displayName !== nameFromInput) {
            try {
                await updateProfile(user, { displayName: nameFromInput });
            } catch (error) {
                console.warn('Liwi-Ka display name update skipped:', error);
            }
        }

        // Phone-only Firebase users intentionally have no synthetic email address.
        const profileEmail = user.email || (user.phoneNumber ? '' : (previous.email || ''));

        try {
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                name: finalName,
                email: profileEmail,
                phoneNumber: user.phoneNumber || previous.phoneNumber || '',
                emailVerified: Boolean(user.emailVerified),
                providers: (user.providerData || []).map(function (provider) { return provider.providerId; }),
                createdAt: previous.createdAt || serverTimestamp(),
                lastLoginAt: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.warn('Liwi-Ka customer profile could not be saved:', error);
        }

        rememberFirebaseUser(user, finalName);
        return finalName;
    }

    async function finishAuthentication(user, suppliedName) {
        await saveCustomerProfile(user, suppliedName);
        redirectAfterAuth();
    }

    function authErrorMessage(error) {
        const code = error && error.code ? error.code : '';
        const messages = {
            'auth/invalid-credential': 'Those sign-in details were not recognised. Please check them and try again.',
            'auth/invalid-login-credentials': 'Those sign-in details were not recognised. Please check them and try again.',
            'auth/user-disabled': 'This account has been disabled.',
            'auth/too-many-requests': 'Too many attempts were made. Please wait a little before trying again.',
            'auth/network-request-failed': 'Network error. Check your internet connection and try again.',
            'auth/operation-not-allowed': 'This sign-in method is not enabled in Firebase Authentication yet. Enable the provider in the Firebase Console.',
            'auth/unauthorized-domain': 'This website domain is not authorised in Firebase Authentication. Add the domain in Firebase Console.',
            'auth/invalid-phone-number': 'Enter a valid phone number in international format, for example +919876543210.',
            'auth/missing-phone-number': 'Enter your phone number, including the country code.',
            'auth/invalid-verification-code': 'That verification code is incorrect. Check the SMS and try again.',
            'auth/code-expired': 'That verification code has expired. Request a new code.',
            'auth/captcha-check-failed': 'The security check could not be completed. Please try again.',
            'auth/quota-exceeded': 'The SMS limit for this project has been reached. Try again later.',
            'auth/account-exists-with-different-credential': 'An account already exists with this Google email using another sign-in method. Please use the method originally linked to the account.'
        };
        return messages[code] || (error && error.message) || 'Something went wrong. Please try again.';
    }

    function showAuthError(error, fallbackMessage) {
        const message = authErrorMessage(error) || fallbackMessage || 'Something went wrong. Please try again.';
        setFeedback(message, 'error');
        console.error('Liwi-Ka Firebase Auth error:', error);
    }

    function getRecaptchaVerifier() {
        if (!sendCodeButton) throw new Error('Phone sign-in is not available on this page.');
        if (!recaptchaVerifier) {
            recaptchaVerifier = new RecaptchaVerifier(auth, sendCodeButton, {
                size: 'invisible',
                callback: function () {},
                'expired-callback': function () {
                    setFeedback('The security check expired. Tap the button to try again.', 'error');
                }
            });
        }
        return recaptchaVerifier;
    }

    async function requestPhoneCode() {
        if (!phoneInput || !sendCodeButton) return;
        if (!validateCreateAccountDetails(true)) return;

        const rawPhone = phoneInput.value.trim().replace(/[\s().-]/g, '');
        if (!/^\+[1-9]\d{7,14}$/.test(rawPhone)) {
            setFeedback('Enter your full phone number with country code, for example +919876543210.', 'error');
            phoneInput.focus();
            return;
        }

        requestedPhoneNumber = rawPhone;
        setBusy(sendCodeButton, true, 'Sending secure code…');
        setFeedback('Preparing your secure phone verification…', 'info');

        try {
            await persistenceReady;
            if (typeof auth.useDeviceLanguage === 'function') auth.useDeviceLanguage();
            const verifier = getRecaptchaVerifier();
            phoneConfirmation = await signInWithPhoneNumber(auth, requestedPhoneNumber, verifier);
            if (otpPanel) {
                otpPanel.hidden = false;
                otpPanel.classList.remove('otp-reveal');
                void otpPanel.offsetWidth;
                otpPanel.classList.add('otp-reveal');
            }
            if (otpInput) {
                otpInput.value = '';
                otpInput.focus();
            }
            setFeedback('A one-time verification code has been sent to ' + requestedPhoneNumber + '.', 'success');
        } catch (error) {
            if (recaptchaVerifier) {
                try { recaptchaVerifier.clear(); } catch (clearError) {}
                recaptchaVerifier = null;
            }
            showAuthError(error, 'We could not send a verification code. Please check the number and try again.');
        } finally {
            setBusy(sendCodeButton, false);
            if (sendCodeButton) setButtonLabel(sendCodeButton, isSignUp ? 'Send another verification code' : 'Send secure sign-in code');
        }
    }

    if (sendCodeButton) sendCodeButton.addEventListener('click', requestPhoneCode);

    if (resendCodeButton) {
        resendCodeButton.addEventListener('click', async function () {
            if (recaptchaVerifier) {
                try { recaptchaVerifier.clear(); } catch (error) {}
                recaptchaVerifier = null;
            }
            await requestPhoneCode();
        });
    }

    if (changeNumberButton) {
        changeNumberButton.addEventListener('click', function () {
            phoneConfirmation = null;
            requestedPhoneNumber = '';
            if (recaptchaVerifier) {
                try { recaptchaVerifier.clear(); } catch (error) {}
                recaptchaVerifier = null;
            }
            if (otpPanel) otpPanel.hidden = true;
            if (otpInput) otpInput.value = '';
            setButtonLabel(sendCodeButton, isSignUp ? 'Create account with phone' : 'Send secure sign-in code');
            setFeedback('Update your details and request a fresh code.', 'info');
            if (isSignUp && phoneNameInput) phoneNameInput.focus();
            else if (phoneInput) phoneInput.focus();
        });
    }

    if (verifyCodeButton) {
        verifyCodeButton.addEventListener('click', async function () {
            if (!validateCreateAccountDetails(true)) return;
            const code = otpInput ? otpInput.value.trim().replace(/\s/g, '') : '';
            if (!phoneConfirmation) {
                setFeedback('Request a verification code first.', 'error');
                return;
            }
            if (!/^\d{6}$/.test(code)) {
                setFeedback('Enter the six-digit code sent to your phone.', 'error');
                if (otpInput) otpInput.focus();
                return;
            }

            setBusy(verifyCodeButton, true, 'Verifying…');
            setFeedback('Verifying your number securely…', 'info');
            try {
                await persistenceReady;
                const credential = await phoneConfirmation.confirm(code);
                const verifiedUser = credential.user;
                const additionalInfo = getAdditionalUserInfo(credential);
                const isNewFirebaseUser = additionalInfo ? additionalInfo.isNewUser : null;
                let hasCustomerProfile = false;

                // The users/{uid} profile is the Liwi-Ka customer-account marker.
                // Checking it also covers phone credentials for which Firebase may
                // not return AdditionalUserInfo.
                try {
                    const profileSnapshot = await getDoc(doc(db, 'users', verifiedUser.uid));
                    hasCustomerProfile = profileSnapshot.exists();
                } catch (profileCheckError) {
                    console.error('Liwi-Ka could not verify the customer profile:', profileCheckError);
                    if (isNewFirebaseUser === true) {
                        try { await deleteUser(verifiedUser); } catch (cleanupError) {
                            try { await signOut(auth); } catch (signOutError) {}
                        }
                    } else {
                        try { await signOut(auth); } catch (signOutError) {}
                    }
                    phoneConfirmation = null;
                    setFeedback('We could not safely verify this account. Please try again, or contact customer care if the problem continues.', 'error');
                    return;
                }

                // A phone number must not create a customer account through Sign In.
                // Remove an unregistered Firebase Auth record when no Liwi-Ka
                // customer profile exists for it.
                if (!isSignUp && !hasCustomerProfile) {
                    try {
                        await deleteUser(verifiedUser);
                    } catch (cleanupError) {
                        console.error('Liwi-Ka could not remove an unregistered sign-in attempt:', cleanupError);
                        try { await signOut(auth); } catch (signOutError) {}
                    }
                    phoneConfirmation = null;
                    if (otpPanel) otpPanel.hidden = true;
                    setFeedback('No Liwi-Ka account exists for this number yet. Please create an account first.', 'error');
                    return;
                }

                // Never overwrite an existing customer profile through Sign Up.
                if (isSignUp && hasCustomerProfile) {
                    try { await signOut(auth); } catch (signOutError) {}
                    phoneConfirmation = null;
                    if (otpPanel) otpPanel.hidden = true;
                    setFeedback('This number is already registered. Please sign in instead.', 'error');
                    return;
                }

                const suppliedName = isSignUp && phoneNameInput ? phoneNameInput.value.trim() : '';
                await finishAuthentication(verifiedUser, suppliedName);
            } catch (error) {
                showAuthError(error, 'We could not verify that code. Please try again.');
            } finally {
                setBusy(verifyCodeButton, false);
            }
        });
    }

    if (otpInput) {
        otpInput.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' && verifyCodeButton) verifyCodeButton.click();
        });
        otpInput.addEventListener('input', function () {
            otpInput.value = otpInput.value.replace(/\D/g, '').slice(0, 6);
        });
    }

    if (googleButton) {
        googleButton.addEventListener('click', async function () {
            if (!validateCreateAccountDetails(false)) return;
            setBusy(googleButton, true, 'Connecting to Google…');
            setFeedback('Opening secure Google sign-in…', 'info');
            try {
                await persistenceReady;
                const provider = new GoogleAuthProvider();
                provider.setCustomParameters({ prompt: 'select_account' });
                const useRedirect = window.matchMedia && window.matchMedia('(max-width: 760px)').matches;
                if (useRedirect) {
                    await signInWithRedirect(auth, provider);
                    return;
                }
                const result = await signInWithPopup(auth, provider);
                await finishAuthentication(result.user, '');
            } catch (error) {
                if (error && error.code === 'auth/popup-blocked') {
                    try {
                        const provider = new GoogleAuthProvider();
                        provider.setCustomParameters({ prompt: 'select_account' });
                        await signInWithRedirect(auth, provider);
                        return;
                    } catch (redirectError) {
                        showAuthError(redirectError, 'Google sign-in could not be opened.');
                    }
                } else {
                    showAuthError(error, 'Google sign-in could not be completed.');
                }
            } finally {
                setBusy(googleButton, false);
            }
        });
    }

    (async function handleGoogleRedirect() {
        try {
            await persistenceReady;
            const result = await getRedirectResult(auth);
            if (result && result.user) await finishAuthentication(result.user, '');
        } catch (error) {
            showAuthError(error, 'Google sign-in could not be completed.');
        }
    })();

    // Preserve returnTo during the Sign In / Create Account switch.
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get('returnTo');
    if (returnTo) {
        const encoded = encodeURIComponent(returnTo);
        const signupLink = document.getElementById('signupSwitchLink');
        const loginLink = document.getElementById('loginSwitchLink');
        if (signupLink) signupLink.href = 'signup.html?returnTo=' + encoded;
        if (loginLink) loginLink.href = 'login.html?returnTo=' + encoded;
    }
})();

// LIWI-KA CUSTOMER AUTHENTICATION FRONTEND
// The existing sign-in/sign-up screens are also the authentication gate for checkout.
(function () {
    'use strict';

    const AUTH_KEY = 'liwika_auth_session';
    const USERS_KEY = 'liwika_demo_users';

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

    function safeRead(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
        catch (e) { return fallback; }
    }

    function safeWrite(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); return true; }
        catch (e) { return false; }
    }

    function getReturnTo() {
        const params = new URLSearchParams(window.location.search);
        const requested = params.get('returnTo');
        // Keep redirects inside the Liwi-Ka site.
        if (!requested || requested.includes('://') || requested.startsWith('//')) return 'index.html';
        return requested;
    }

    function redirectAfterAuth() {
        const destination = getReturnTo();
        window.location.href = destination;
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function (event) {
            event.preventDefault();
            const email = document.getElementById('loginEmail').value.trim().toLowerCase();
            const password = document.getElementById('loginPassword').value;
            const users = safeRead(USERS_KEY, {});
            const user = users[email];

            if (!user || user.password !== password) {
                alert('We could not sign you in with those details. Please check your email and password, or create an account.');
                return;
            }

            safeWrite(AUTH_KEY, { email: email, name: user.name || '', signedInAt: Date.now() });
            redirectAfterAuth();
        });
    }

    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', function (event) {
            event.preventDefault();
            const name = document.getElementById('fullName').value.trim();
            const email = document.getElementById('signupEmail').value.trim().toLowerCase();
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                alert('Passwords do not match.');
                return;
            }
            if (password.length < 8) {
                alert('Please use a password with at least 8 characters.');
                return;
            }

            const users = safeRead(USERS_KEY, {});
            if (users[email]) {
                alert('An account with this email already exists. Please sign in instead.');
                return;
            }

            users[email] = { name: name, password: password, createdAt: Date.now() };
            safeWrite(USERS_KEY, users);
            safeWrite(AUTH_KEY, { email: email, name: name, signedInAt: Date.now() });
            redirectAfterAuth();
        });
    }
})();

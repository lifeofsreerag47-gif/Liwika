/* LIWI-KA PREMIUM ACCOUNT MENU
   Shows the signed-in customer's name/email from Firebase + Firestore.
*/
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { auth, db, persistenceReady } from './firebase-config.js';

(function () {
    'use strict';

    var AUTH_KEY = 'liwika_auth_session';
    var button = document.querySelector('.profile-icon-button');
    if (!button) return;

    var currentUser = null;
    var profile = null;
    var menu = null;

    function getStoredSession() {
        try {
            return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
        } catch (e) {
            return null;
        }
    }

    function getSiteUrl(file) {
        var script = document.querySelector('script[src*="profile-menu.js"]');
        if (!script) return file;
        try {
            return new URL(file, script.src).href;
        } catch (e) {
            return file;
        }
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function initials(name, email) {
        var source = (name || '').trim();
        if (source) {
            var parts = source.split(/\s+/).filter(Boolean);
            return ((parts[0] || '')[0] + (parts.length > 1 ? (parts[parts.length - 1] || '')[0] : '')).toUpperCase();
        }
        return ((email || 'L')[0] || 'L').toUpperCase();
    }

    function closeMenu() {
        if (!menu) return;
        menu.classList.remove('is-open');
        button.setAttribute('aria-expanded', 'false');
    }

    function openMenu() {
        if (!menu) return;
        menu.classList.add('is-open');
        button.setAttribute('aria-expanded', 'true');
    }

    function renderMenu(name, email) {
        if (!menu) {
            menu = document.createElement('div');
            menu.className = 'liwika-account-menu';
            menu.setAttribute('role', 'dialog');
            menu.setAttribute('aria-label', 'Your Liwi-Ka account');
            document.body.appendChild(menu);
        }

        var safeName = escapeHtml(name || 'Liwi-Ka Customer');
        var safeEmail = escapeHtml(email || '');
        var safeInitials = escapeHtml(initials(name, email));

        menu.innerHTML = `
            <div class="liwika-account-topline"></div>
            <div class="liwika-account-header">
                <div class="liwika-account-avatar" aria-hidden="true">${safeInitials}</div>
                <div class="liwika-account-heading">
                    <span class="liwika-account-label">YOUR ACCOUNT</span>
                    <strong>${safeName}</strong>
                    <span>${safeEmail}</span>
                </div>
            </div>
            <div class="liwika-account-divider"></div>
            <button type="button" class="liwika-account-logout" id="liwikaAccountLogout">
                <span class="liwika-logout-icon" aria-hidden="true">↗</span>
                <span>LOG OUT</span>
            </button>
        `;

        var logoutButton = menu.querySelector('#liwikaAccountLogout');
        logoutButton.addEventListener('click', async function () {
            logoutButton.disabled = true;
            logoutButton.classList.add('is-loading');
            try {
                await persistenceReady;
                await signOut(auth);
            } catch (error) {
                console.error('Liwi-Ka logout error:', error);
            } finally {
                try { localStorage.removeItem(AUTH_KEY); } catch (e) {}
                window.location.href = getSiteUrl('index.html');
            }
        });
    }

    async function loadProfile(user) {
        var stored = getStoredSession() || {};
        var name = stored.name || user.displayName || '';
        var email = user.email || stored.email || '';

        try {
            var snapshot = await getDoc(doc(db, 'users', user.uid));
            if (snapshot.exists()) {
                var data = snapshot.data() || {};
                name = data.name || name;
                email = data.email || email;
            }
        } catch (error) {
            // Firebase Auth data is enough to keep the account menu usable.
            console.warn('Liwi-Ka profile lookup skipped:', error);
        }

        profile = { name: name, email: email };
        renderMenu(name, email);
    }

    button.setAttribute('type', 'button');
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-expanded', 'false');

    button.addEventListener('click', async function (event) {
        event.preventDefault();
        event.stopPropagation();

        if (!currentUser) {
            // Let Firebase finish restoring the persistent browser session before
            // deciding that the customer is signed out.
            try { await persistenceReady; } catch (e) {}
            currentUser = auth.currentUser || null;
        }

        if (!currentUser) {
            window.location.href = getSiteUrl('login.html');
            return;
        }

        if (!profile) await loadProfile(currentUser);
        if (menu && menu.classList.contains('is-open')) closeMenu();
        else openMenu();
    });

    document.addEventListener('click', function (event) {
        if (!menu || !menu.classList.contains('is-open')) return;
        if (event.target.closest('.liwika-account-menu') || event.target.closest('.profile-icon-button')) return;
        closeMenu();
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') closeMenu();
    });

    persistenceReady.then(function () {
        onAuthStateChanged(auth, function (user) {
            currentUser = user || null;
            if (!currentUser) {
                profile = null;
                closeMenu();
            } else if (menu) {
                loadProfile(currentUser);
            }
        });
    }).catch(function (error) {
        console.warn('Liwi-Ka Firebase persistence initialization skipped:', error);
    });
})();

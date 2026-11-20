import { applyActionCode } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
        import { auth } from './firebase-config.js';

        const card = document.getElementById('verificationCard');
        const title = document.getElementById('verificationTitle');
        const errorText = document.getElementById('verificationError');
        const verifiedEmail = document.getElementById('verifiedEmail');

        function showSuccess() {
            card.classList.remove('is-loading', 'is-ready', 'is-error');
            card.classList.add('is-success', 'verified');
            title.textContent = 'Email Verified';
        }

        function showError(message) {
            card.classList.remove('is-loading', 'is-ready', 'is-success');
            card.classList.add('is-error', 'error');
            title.textContent = 'Verification Failed';

            if (message) {
                errorText.textContent = message;
            }
        }

        async function verifyEmail() {
            const params = new URLSearchParams(window.location.search);
            const mode = params.get('mode');
            const oobCode = params.get('oobCode');

            if (mode !== 'verifyEmail' || !oobCode) {
                showError('This verification link is incomplete or invalid. Please request a new verification email.');
                return;
            }

            try {
                await applyActionCode(auth, oobCode);

                const email = params.get('email');
                if (email) {
                    verifiedEmail.textContent = email;
                    verifiedEmail.style.display = 'block';
                }

                showSuccess();
            } catch (error) {
                console.error('Liwi-Ka email verification error:', error);

                const messages = {
                    'auth/expired-action-code':
                        'This verification link has expired. Please request a new verification email.',
                    'auth/invalid-action-code':
                        'This verification link is invalid or has already been used. Please request a new verification email.',
                    'auth/user-disabled':
                        'This account has been disabled. Please contact Liwi-Ka support.',
                    'auth/user-not-found':
                        'We could not find the account associated with this verification link.'
                };

                showError(
                    messages[error.code] ||
                    'We could not verify this email. The link may have expired or already been used.'
                );
            }
        }

        verifyEmail();

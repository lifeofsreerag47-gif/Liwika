// Checkout account gate: a real Firebase session AND a verified email are required to order.
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { auth, db, persistenceReady } from './firebase-config.js';
import { mountEmailVerifier } from './email-verify.js';

const gate = document.getElementById('emailGate');
const pill = document.getElementById('customerEmail');
const required = document.getElementById('authRequired');
const content = document.getElementById('checkoutContent');

function ready(fn) { const t = setInterval(() => { if (window.LiwikaCheckout) { clearInterval(t); fn(window.LiwikaCheckout); } }, 40); setTimeout(() => clearInterval(t), 8000); }

await persistenceReady;
const unsubscribe = onAuthStateChanged(auth, async (user) => {
  unsubscribe();
  if (!user) {
    try { localStorage.removeItem('liwika_auth_session'); } catch (e) {}
    if (content) content.classList.remove('show');
    if (required) required.classList.add('show');
    return;
  }
  let profile = {};
  try { const snap = await getDoc(doc(db, 'users', user.uid)); profile = snap.exists() ? snap.data() : {}; } catch (e) { console.warn(e); }
  ready((api) => {
    if (profile.emailVerified === true && profile.email) {
      if (pill) pill.textContent = profile.email;
      api.setEmailVerified(true);
      return;
    }
    api.setEmailVerified(false);
    gate.hidden = false;
    mountEmailVerifier(gate, {
      email: profile.email || '',
      heading: 'Verify your email to place orders',
      sub: 'Your order confirmation and the delivery OTP are emailed to you. Verify the address once and you are set.',
      onVerified: (email) => { if (pill) pill.textContent = email; api.setEmailVerified(true); setTimeout(() => { gate.hidden = true; }, 1600); }
    });
  });
});

import { httpsCallable } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-functions.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { auth, functions, persistenceReady } from './firebase-config.js';
import { startCashfreeCheckout } from './cashfree-pay.js';
import { friendlyError } from './email-verify.js';

const createOrder = httpsCallable(functions, 'createCustomerOrder');
const $ = (id) => document.getElementById(id);
const details = (() => { try { return JSON.parse(sessionStorage.getItem('liwika_checkout_details') || 'null'); } catch (e) { return null; } })();
let total = Number(sessionStorage.getItem('liwika_checkout_total') || 0);
const items = window.LiwikaCart ? window.LiwikaCart.getItems() : [];

if (!localStorage.getItem('liwika_auth_session') || !details || !total || !items.length) { location.replace('checkout.html'); throw new Error('Checkout state missing'); }

const btn = $('pay'); const errorBox = $('payError'); const overlay = $('payOverlay'); const overlayText = $('payOverlayText'); const info = $('payInfo');
$('total').textContent = '₹' + total.toLocaleString('en-IN');

const INFO = {
  'UPI': 'You will be taken to Cashfree\'s secure page to approve the payment in your UPI app. Your order is confirmed only after the payment succeeds.',
  'Cash on Delivery': `Keep ₹${total.toLocaleString('en-IN')} ready (cash or UPI to the delivery partner). Cash on Delivery orders are placed instantly.`
};
const selected = () => document.querySelector('input[name=method]:checked').value;
function syncMethod() {
  document.querySelectorAll('.method').forEach((m) => m.classList.toggle('selected', m.querySelector('input').checked));
  const m = selected();
  info.textContent = INFO[m];
  btn.textContent = m === 'UPI' ? `PAY ₹${total.toLocaleString('en-IN')} WITH UPI →` : 'PLACE ORDER →';
}
document.querySelectorAll('.method').forEach((m) => m.addEventListener('click', () => { m.querySelector('input').checked = true; syncMethod(); }));
syncMethod();

function showError(text) { errorBox.textContent = text; errorBox.hidden = !text; if (text) errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
function busy(on, text) { overlay.hidden = !on; if (text) overlayText.textContent = text; btn.disabled = on; }
const newIntent = () => { const i = (crypto.randomUUID ? crypto.randomUUID() : 'lk-' + Date.now() + '-' + Math.random().toString(16).slice(2)); sessionStorage.setItem('liwika_checkout_intent', i); return i; };

async function place(retried) {
  showError('');
  const method = selected();
  let intent = sessionStorage.getItem('liwika_checkout_intent') || newIntent();
  busy(true, method === 'UPI' ? 'Preparing secure UPI payment…' : 'Placing your order…');
  try {
    await persistenceReady;
    const user = auth.currentUser || await new Promise((res) => { const u = onAuthStateChanged(auth, (x) => { u(); res(x); }); });
    if (!user) { location.href = 'login.html?returnTo=' + encodeURIComponent('payment.html'); return; }
    const payload = {
      checkoutIntentId: intent, paymentMethod: method, expectedTotal: total,
      shippingAddress: details,
      // Only ids/quantities/options are trusted from the browser — prices are re-read from the database.
      items: items.map((i) => ({ productId: i.id, quantity: i.quantity, flavour: i.flavour, isGiftWrapped: Boolean(i.isGiftWrapped), giftMessage: i.giftMessage || '' }))
    };
    const res = (await createOrder(payload)).data;
    sessionStorage.setItem('liwika_last_order', JSON.stringify({ orderId: res.orderId, orderNumber: res.orderNumber, method, total: res.total }));
    if (method === 'Cash on Delivery') {
      busy(true, 'Order placed!');
      try { window.LiwikaCart.clearCart(); } catch (e) {}
      location.replace('order-confirmation.html?o=' + encodeURIComponent(res.orderId));
      return;
    }
    if (res.paymentSessionId) {
      busy(true, 'Opening your UPI payment…');
      await startCashfreeCheckout(res.paymentSessionId, res.cashfreeMode);
      return;
    }
    location.replace('order-confirmation.html?o=' + encodeURIComponent(res.orderId));
  } catch (error) {
    busy(false);
    const d = error && error.details;
    if (d && d.code === 'price-changed') {
      // Another price was updated by the store — sync the bag and ask the customer to confirm the new total.
      try { items.forEach((i) => { if (d.prices[i.id] !== undefined) i.price = d.prices[i.id]; }); window.LiwikaCart.saveItems(items); } catch (e) {}
      total = d.total; sessionStorage.setItem('liwika_checkout_total', String(total));
      $('total').textContent = '₹' + total.toLocaleString('en-IN'); syncMethod();
      showError(`Prices were just updated. Your new total is ₹${total.toLocaleString('en-IN')}. Please review and place the order again.`);
      return;
    }
    if (d && d.code === 'intent-used' && !retried) { newIntent(); return place(true); }
    console.error('Order failed', error);
    showError(friendlyError(error, 'We could not place your order. No payment has been taken. Please try again.'));
  }
}
btn.addEventListener('click', () => place(false));
window.addEventListener('pageshow', (e) => { if (e.persisted) busy(false); });

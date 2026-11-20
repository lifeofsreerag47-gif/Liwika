import { httpsCallable } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-functions.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { auth, db, functions, persistenceReady } from './firebase-config.js';
import { startCashfreeCheckout } from './cashfree-pay.js';
import { friendlyError } from './email-verify.js';

const verifyPayment = httpsCallable(functions, 'verifyPayment');
const resumePayment = httpsCallable(functions, 'resumePayment');
const $ = (id) => document.getElementById(id);
const orderId = new URLSearchParams(location.search).get('o') || '';
const REDIRECT_SECONDS = 7;
const MY_ORDERS = 'my-orders.html';

function view(name) {
  document.body.dataset.state = name;
  document.querySelectorAll('.oc-view').forEach((v) => { v.hidden = v.dataset.view !== name; });
}
const maskEmail = (e) => { const [u, d] = String(e || '').split('@'); return d ? `${u.slice(0, 2)}${'*'.repeat(Math.max(2, u.length - 2))}@${d}` : 'your email'; };
const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function problem(title, text, { retry } = {}) {
  $('problemTitle').textContent = title; $('problemText').textContent = text;
  const btn = $('retryBtn'); btn.hidden = !retry;
  if (retry) btn.onclick = async () => {
    btn.disabled = true; btn.textContent = 'OPENING PAYMENT…';
    try { const r = (await resumePayment({ orderId })).data; await startCashfreeCheckout(r.paymentSessionId, r.cashfreeMode); }
    catch (e) { btn.disabled = false; btn.textContent = 'TRY PAYMENT AGAIN'; $('problemText').textContent = friendlyError(e, 'Could not reopen the payment. Please try again from My Orders.'); }
  };
  view('problem');
}

async function main() {
  if (!/^[a-f0-9]{20}$/.test(orderId)) { location.replace('index.html'); return; }
  await persistenceReady;
  const user = auth.currentUser || await new Promise((res) => { const u = onAuthStateChanged(auth, (x) => { u(); res(x); }); });
  if (!user) { location.replace('login.html?returnTo=' + encodeURIComponent('order-confirmation.html?o=' + orderId)); return; }

  let result = null;
  for (let attempt = 0; attempt < 24; attempt++) {
    try { result = (await verifyPayment({ orderId })).data; }
    catch (error) {
      if (attempt >= 2) { problem('We could not confirm your order', friendlyError(error, 'Please check My Orders in a minute. If you were charged, your order will appear there.')); return; }
      await sleep(2000); continue;
    }
    if (result.state !== 'pending') break;
    if (attempt === 1) { $('verifyTitle').textContent = 'Waiting for your bank…'; $('verifyText').textContent = 'Your UPI app is confirming the payment with the bank.'; $('verifyWarn').hidden = false; }
    await sleep(3000);
  }
  if (!result || result.state === 'pending') { problem('Still confirming your payment', 'Your bank has not confirmed yet. If money was deducted it will be confirmed automatically and your order will appear in My Orders — please do not pay again.'); return; }

  if (result.state === 'paid' || result.state === 'cod') return celebrate(result, user);
  if (result.state === 'review') { problem('Payment received — under review', `We received your payment for order ${result.orderNumber}, but the amount needs a quick manual check. Our team will confirm shortly. You can follow it in My Orders.`); return; }
  if (result.state === 'failed') { problem('Payment was not completed', 'No money has been taken for this attempt. You can try the payment again within the payment window.', { retry: true }); return; }
  problem('This order has expired', 'The payment window ended before the payment was completed. No order was placed. Your bag is still saved.');
}

async function celebrate(result) {
  let order = {};
  try { const s = await getDoc(doc(db, 'orders', orderId)); if (s.exists()) order = s.data(); } catch (e) { /* summary falls back to function result */ }
  try { window.LiwikaCart && window.LiwikaCart.clearCart(); ['liwika_checkout_details', 'liwika_checkout_intent', 'liwika_checkout_total', 'liwika_last_order', 'liwika_current_order_number'].forEach((k) => sessionStorage.removeItem(k)); } catch (e) {}

  const first = String(order.customerName || '').split(' ')[0];
  const cod = result.paymentMethod === 'Cash on Delivery' || order.paymentMethod === 'Cash on Delivery';
  $('orderNumber').textContent = result.orderNumber || order.orderNumber || '';
  $('tileTotal').textContent = money(result.total || order.total);
  $('tileItems').textContent = String(result.itemCount || (order.items || []).reduce((s, i) => s + i.quantity, 0));
  $('tilePay').textContent = cod ? 'Pay on delivery' : 'Paid via UPI ✓';
  $('otpEmail').textContent = maskEmail(order.customerEmail);
  $('successLead').textContent = (first ? `${first}, your ` : 'Your ') + (cod ? 'order is confirmed and your chocolates are being lovingly prepared.' : 'payment went through and your chocolates are being lovingly prepared.');
  $('goNow').href = `${MY_ORDERS}?new=${encodeURIComponent(orderId)}`;

  // Title, letter by letter
  const title = $('successTitle'); title.textContent = '';
  const words = [['Order', ''], ['placed!', 'gold']]; let i = 0;
  words.forEach(([w, cls], wi) => {
    [...w].forEach((ch) => { const s = document.createElement('span'); s.textContent = ch; if (cls) s.className = cls; s.style.animationDelay = (0.9 + i * 0.055) + 's'; title.appendChild(s); i++; });
    if (wi < words.length - 1) { title.appendChild(document.createTextNode(' ')); }
  });

  view('success');
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced) { setTimeout(() => confettiBurst(1), 700); setTimeout(() => confettiBurst(0.6), 1500); setTimeout(() => confettiBurst(0.45), 2600); }

  // Redirect with visible countdown
  const bar = $('bar'); const count = $('count'); const start = performance.now() + 2600; let cancelled = false;
  $('goNow').addEventListener('click', () => { cancelled = true; });
  const total = REDIRECT_SECONDS * 1000;
  (function tick(now) {
    if (cancelled) return;
    const p = Math.max(0, Math.min(1, (now - start) / total));
    bar.style.width = (p * 100) + '%'; count.textContent = String(Math.max(0, Math.ceil(REDIRECT_SECONDS - p * REDIRECT_SECONDS)));
    if (p >= 1) { location.replace(`${MY_ORDERS}?new=${encodeURIComponent(orderId)}`); return; }
    requestAnimationFrame(tick);
  })(performance.now());
}

/* ---------------- confetti (no libraries) ---------------- */
const canvas = $('confetti'); const ctx = canvas.getContext('2d');
let parts = []; let raf = 0;
function size() { const r = window.devicePixelRatio || 1; canvas.width = innerWidth * r; canvas.height = innerHeight * r; ctx.setTransform(r, 0, 0, r, 0, 0); }
addEventListener('resize', size); size();
const COLORS = ['#f6dc92', '#d9a441', '#b98524', '#f5efe4', '#7a3f1d', '#4a2410', '#e8b4a0'];
function confettiBurst(scale) {
  const n = Math.round((innerWidth < 600 ? 70 : 120) * scale);
  const cx = innerWidth / 2; const cy = Math.min(innerHeight * 0.33, 260);
  for (let k = 0; k < n; k++) {
    const a = Math.random() * Math.PI * 2; const v = 5 + Math.random() * 11;
    parts.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 5, g: 0.22 + Math.random() * 0.12, w: 6 + Math.random() * 7, h: 4 + Math.random() * 6,
      r: Math.random() * 6.28, vr: (Math.random() - .5) * .35, c: COLORS[(Math.random() * COLORS.length) | 0], shape: Math.random() < .22 ? 'heart' : Math.random() < .5 ? 'rect' : 'circ', life: 0 });
  }
  if (!raf) raf = requestAnimationFrame(loop);
}
function heart(x, y, s) { ctx.beginPath(); ctx.moveTo(x, y + s * .35); ctx.bezierCurveTo(x - s, y - s * .4, x - s * .5, y - s, x, y - s * .45); ctx.bezierCurveTo(x + s * .5, y - s, x + s, y - s * .4, x, y + s * .35); ctx.fill(); }
function loop() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter((p) => p.y < innerHeight + 30 && p.life < 260);
  for (const p of parts) {
    p.vx *= 0.992; p.vy += p.g; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life++;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.max(0, 1 - p.life / 260); ctx.fillStyle = p.c;
    if (p.shape === 'rect') ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    else if (p.shape === 'circ') { ctx.beginPath(); ctx.arc(0, 0, p.h / 1.6, 0, 6.28); ctx.fill(); }
    else heart(0, 0, p.w * .9);
    ctx.restore();
  }
  raf = parts.length ? requestAnimationFrame(loop) : 0;
  if (!raf) ctx.clearRect(0, 0, innerWidth, innerHeight);
}

main().catch((e) => { console.error(e); problem('Something went wrong', 'We could not load your order. Please open My Orders to see its status.'); });

import { auth, db, functions, persistenceReady } from '../firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { collection, query, where, orderBy, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { httpsCallable } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-functions.js';
import { startCashfreeCheckout } from '../cashfree-pay.js';

const getDeliveryOtp = httpsCallable(functions, 'getDeliveryOtp');
const resendDeliveryOtp = httpsCallable(functions, 'resendDeliveryOtp');
const resumePayment = httpsCallable(functions, 'resumePayment');
const cancelMyOrder = httpsCallable(functions, 'cancelMyOrder');

const $ = id => document.getElementById(id);
const money = a => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(Number(a||0));
const esc = v => String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeImg = u => { try { const x = new URL(u, location.href); return (x.protocol === 'https:' || x.origin === location.origin) ? x.href : '../images/liwi.png'; } catch { return '../images/liwi.png'; } };
const dateText = v => {const d=v?.toDate?v.toDate():new Date(v||0);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});};
const ordersList = $('ordersList');
const statusLabels = {awaiting_payment:'Awaiting payment',pending:'Order received',processing:'Preparing',shipped:'Out for delivery',delivered:'Delivered',cancelled:'Cancelled'};
const params = new URLSearchParams(location.search);
const highlightId = params.get('new') || '';
let allOrders = [];
let unsub = null;
const revealed = new Map();   // orderId -> {otp, timer}
const busy = new Set();

function friendly(e, fb){ const m = e?.message || ''; return (m && !/^internal|unknown/i.test(m)) ? m.replace(/^.*?:\s*/, '') : fb; }
function progressFor(s){return ({pending:0,processing:1,shipped:2,delivered:3})[s]??0;}
function timeline(order){
  if(order.status==='cancelled') return `<div class="tracking-timeline"><div class="timeline-step completed"><span class="timeline-marker">✓</span><div><strong>Order placed</strong><p>Your order was received.</p></div></div><div class="timeline-step current"><span class="timeline-marker">×</span><div><strong>Order cancelled</strong><p>${order.refundRequired||order.paymentStatus==='refunded'?'Any payment made will be refunded to your UPI account in 5–7 working days.':'This order is no longer being processed.'}</p></div></div></div>`;
  const steps=[['Order received','Your order was recorded securely.'],['Being prepared','Your chocolates are being prepared with care.'],['Out for delivery','Your parcel is on its way. Keep your delivery OTP ready.'],['Delivered','Your chocolate moment has arrived.']];
  const cur=order.status==='delivered'?4:progressFor(order.status);
  return `<div class="tracking-timeline">${steps.map((s,i)=>`<div class="timeline-step ${i<cur?'completed':i===cur?'current':''}"><span class="timeline-marker">${i<cur?'✓':''}</span><div><strong>${s[0]}</strong><p>${i<=cur?s[1]:'We will update this step when your order progresses.'}</p></div></div>`).join('')}</div>`;
}
function otpCard(order){
  const id = esc(order.id);
  const live = ['pending','processing','shipped'].includes(order.status);
  if (!live) return '';
  const r = revealed.get(order.id);
  const failed = Number(order.otpFailedAttempts || 0);
  const needsRegen = failed >= 10;
  const digits = r ? r.otp.split('').map(d=>`<b>${esc(d)}</b>`).join('') : '<b>•</b><b>•</b><b>•</b><b>•</b><b>•</b><b>•</b>';
  const cod = order.paymentMethod === 'Cash on Delivery';
  return `<div class="otp-card ${order.status==='shipped'?'otp-hot':''}" data-otp-card="${id}">
    <div class="otp-card-head"><span class="otp-shield" aria-hidden="true">✳</span><div><strong>Delivery OTP</strong><p>${order.status==='shipped'?'Your order is out for delivery — show this code only when the parcel is in your hands.':'Keep this code for delivery day. Never share it over a call, chat or with anyone but our delivery partner.'}</p></div></div>
    <div class="otp-digits ${r?'shown':''}" aria-live="polite" ${r?'':'aria-label="OTP hidden"'}>${digits}</div>
    ${cod?`<p class="otp-cod">Cash on Delivery — please keep <b>${money(order.total)}</b> ready.</p>`:''}
    ${failed>0&&!needsRegen?`<p class="otp-warn">${failed} wrong code${failed===1?' was':'s were'} entered at delivery. If this wasn’t you or the delivery partner, tap “New OTP”.</p>`:''}
    ${needsRegen?`<p class="otp-warn">This OTP was disabled after repeated wrong attempts. Please generate a new one.</p>`:''}
    <div class="otp-actions-row">
      <button type="button" class="otp-btn" data-act="reveal" data-id="${id}" ${needsRegen?'disabled':''}>${r?'HIDE OTP':'SHOW MY OTP'}</button>
      <button type="button" class="otp-btn ghost" data-act="regen" data-id="${id}">NEW OTP</button>
    </div>
    <p class="otp-msg" data-otp-msg="${id}" role="status"></p>
  </div>`;
}
function payBar(order){
  if (order.status !== 'awaiting_payment') return '';
  const id = esc(order.id);
  return `<div class="pay-bar"><div><strong>Payment not completed</strong><p>Complete your UPI payment to confirm this order. Unpaid orders are released automatically after 30 minutes.</p></div><div class="pay-bar-actions"><button class="otp-btn" data-act="pay" data-id="${id}">COMPLETE PAYMENT</button><button class="otp-btn ghost" data-act="cancel" data-id="${id}">CANCEL</button></div><p class="otp-msg" data-otp-msg="${id}" role="status"></p></div>`;
}
function orderCard(order){
  const status=String(order.status||'pending').toLowerCase();
  const items=Array.isArray(order.items)?order.items:[];
  const totalQty=items.reduce((s,i)=>s+Number(i.quantity||1),0);
  const id=esc(order.id);
  const itemsHtml=items.map(i=>`<div class="order-product"><img src="${esc(safeImg(i.imageUrl))}" alt="${esc(i.name||'Liwi-Ka chocolate')}" onerror="this.onerror=null;this.src='../images/liwi.png'"><div class="product-description"><h4>${esc(i.name||'Liwi-Ka chocolate')}</h4><p>${esc(i.flavour||'Classic')}</p><span>Qty: ${Number(i.quantity||1)} · ${money(Number(i.price||0)*Number(i.quantity||1))}</span></div></div>`).join('');
  const pay = order.paymentStatus==='paid' ? 'Paid' : order.paymentStatus==='refunded' ? 'Refunded' : (order.paymentMethod==='Cash on Delivery' ? 'Pay on delivery' : 'Unpaid');
  const note = {delivered:'Delivered with love',shipped:'Out for delivery',cancelled:'This order was cancelled',processing:'Your chocolates are being prepared',awaiting_payment:'Waiting for your payment'}[status]||'We have received your order';
  const detailId=`order-detail-${id}`;
  const sa=order.shippingAddress||{};
  return `<article class="order-card ${order.id===highlightId?'order-new':''}" data-order-card data-status="${esc(status)}" data-id="${id}">
    <div class="order-card-top"><div class="order-reference"><span class="order-label">ORDER NUMBER</span><h3>#${esc(order.orderNumber||order.id)}</h3></div><span class="order-status status-${esc(status)}"><span class="status-dot"></span>${esc(statusLabels[status]||status)}</span></div>
    <div class="order-meta"><div><span class="meta-label">ORDERED ON</span><p>${esc(dateText(order.createdAt))}</p></div><div><span class="meta-label">TOTAL</span><p>${money(order.total)}</p></div><div><span class="meta-label">ITEMS</span><p>${totalQty} item${totalQty===1?'':'s'}</p></div></div>
    <div class="order-products">${itemsHtml||'<p>No item details found.</p>'}</div>
    <div class="delivery-note ${status==='delivered'?'delivered-note':''}"><span class="delivery-note-icon">${status==='delivered'?'✓':'✦'}</span><div><strong>${note}</strong><p>Payment: ${esc(pay)} · ${esc(order.paymentMethod||'—')}</p></div></div>
    ${payBar(order)}${otpCard(order)}
    ${status==='delivered'?`<div class="delivered-banner"><b>Delivered ✓</b><span>Confirmed with your OTP${order.deliveredAt?' on '+esc(dateText(order.deliveredAt)):''}. A confirmation email was sent to you.</span></div>`:''}
    <div class="order-card-actions"><a class="button-outline" href="#${detailId}">View Details</a><a class="button-gold" href="../seasonals/shop.html">Continue Shopping <span>→</span></a></div>
    <div class="order-details" id="${detailId}"><div class="details-heading"><h4>Delivery progress</h4><span>${esc(statusLabels[status]||status)}</span></div>${timeline(order)}<div style="margin-top:18px;color:#82776b;font-size:11px;line-height:1.7"><strong>Delivery address</strong><br>${esc(sa.address||'—')}<br>${esc(sa.city||'Visakhapatnam')} · ${esc(sa.pin||'')}<br><br><strong>Order total</strong> ${money(order.total)} (Delivery ${money(order.deliveryFee||0)})</div><a href="#" class="close-details" onclick="this.parentElement.style.display='none';return false">Close details ↑</a></div>
  </article>`;
}
function renderOrders(){
  const term=($('orderSearch')?.value||'').trim().toLowerCase();
  const status=$('statusFilter')?.value||'all';
  const filtered=allOrders.filter(o=>{const st=String(o.status||'pending').toLowerCase();const text=[o.orderNumber,o.id,...(o.items||[]).map(i=>i.name)].join(' ').toLowerCase();return(status==='all'||st===status)&&(!term||text.includes(term));});
  $('orderCount').innerHTML=`<strong>${filtered.length}</strong> of ${allOrders.length} order${allOrders.length===1?'':'s'}`;
  $('emptyOrders').hidden=allOrders.length>0;
  if(!allOrders.length){ordersList.innerHTML='';return;}
  ordersList.innerHTML=filtered.length?filtered.map(orderCard).join(''):'<div class="order-search-empty">No orders match this search or filter.</div>';
}
function msg(id,text,kind){ const el=document.querySelector(`[data-otp-msg="${CSS.escape(id)}"]`); if(el){el.textContent=text||'';el.dataset.kind=kind||'';} }
function hideOtp(id){ const r=revealed.get(id); if(r){clearTimeout(r.timer);revealed.delete(id);} renderOrders(); }
function showOtp(id,otp){ const old=revealed.get(id); if(old)clearTimeout(old.timer); revealed.set(id,{otp,timer:setTimeout(()=>hideOtp(id),60000)}); renderOrders(); msg(id,'Visible for 60 seconds, then hidden again.','ok'); }

ordersList.addEventListener('click', async (ev) => {
  const btn = ev.target.closest('button[data-act]'); if(!btn) return;
  const id = btn.dataset.id, act = btn.dataset.act;
  if (busy.has(id+act)) return; busy.add(id+act); btn.disabled = true;
  try {
    if (act==='reveal') {
      if (revealed.has(id)) { hideOtp(id); return; }
      msg(id,'Fetching…'); const r=(await getDeliveryOtp({orderId:id})).data; showOtp(id,String(r.otp));
    } else if (act==='regen') {
      if (!confirm('Generate a new delivery OTP? The old one will stop working and we will email you the new one.')) return;
      msg(id,'Creating a new OTP…'); const r=(await resendDeliveryOtp({orderId:id})).data; if(r?.otp) showOtp(id,String(r.otp)); else msg(id,'A new OTP has been emailed to you. Tap “Show my OTP” to view it.','ok');
    } else if (act==='pay') {
      msg(id,'Opening secure payment…'); const r=(await resumePayment({orderId:id})).data; await startCashfreeCheckout(r.paymentSessionId,r.cashfreeMode);
    } else if (act==='cancel') {
      if (!confirm('Cancel this unpaid order?')) return;
      await cancelMyOrder({orderId:id}); msg(id,'Order cancelled.','ok');
    }
  } catch (e) { msg(id, friendly(e,'Something went wrong. Please try again.'), 'err'); }
  finally { busy.delete(id+act); btn.disabled = false; }
});

function showLoadError(m){ordersList.innerHTML=`<div class="orders-offline"><strong>We couldn’t load your orders.</strong><p>${esc(m)}</p><button class="button-gold" id="retryOrders" type="button">TRY AGAIN ↻</button></div>`;$('retryOrders')?.addEventListener('click',()=>startLive(auth.currentUser));}
function startLive(user){
  if(unsub){unsub();unsub=null;}
  const q=query(collection(db,'orders'),where('customerUid','==',user.uid),orderBy('createdAt','desc'));
  unsub=onSnapshot(q,snap=>{ allOrders=snap.docs.map(d=>({id:d.id,...d.data()})); renderOrders(); const n=highlightId&&document.querySelector('.order-new'); if(n&&!startLive.scrolled){startLive.scrolled=true;n.scrollIntoView({behavior:'smooth',block:'center'});} },
    err=>{console.error('orders listener',err);showLoadError(err.message||'Please check your connection and try again.');});
}
$('orderSearch')?.addEventListener('input',renderOrders);
$('statusFilter')?.addEventListener('change',renderOrders);
window.addEventListener('offline',()=>{if(!ordersList.querySelector('.orders-offline'))ordersList.insertAdjacentHTML('afterbegin','<div class="orders-offline">You are offline. Order updates may be delayed.</div>');});
await persistenceReady;
onAuthStateChanged(auth,user=>{if(!user){location.replace('../login.html?returnTo='+encodeURIComponent('videos/my-orders.html'));return;}startLive(user);});

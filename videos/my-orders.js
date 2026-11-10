import { auth, db, persistenceReady } from '../firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { collection, query, where, orderBy, getDocs, getDocsFromCache } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const $ = id => document.getElementById(id);
const money = amount => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(Number(amount||0));
const esc = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateText = value => {const d=value?.toDate?value.toDate():new Date(value||0);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});};
let allOrders=[];
const ordersList=$('ordersList');
const statusLabels={pending:'Order received',processing:'Processing',shipped:'Shipped',delivered:'Delivered',cancelled:'Cancelled'};

function progressFor(status){return ({pending:0,processing:1,shipped:2,delivered:3,cancelled:-1})[status]??0;}
function timeline(order){
  if(order.status==='cancelled')return `<div class="tracking-timeline"><div class="timeline-step completed"><span class="timeline-marker">✓</span><div><strong>Order placed</strong><p>Your order was received.</p></div></div><div class="timeline-step current"><span class="timeline-marker">×</span><div><strong>Order cancelled</strong><p>This order is no longer being processed.</p></div></div></div>`;
  const steps=[['Order received','Your order was recorded securely.'],['Being prepared','Your chocolates are being prepared with care.'],['Shipped','Your parcel has been dispatched.'],['Delivered','Your chocolate moment has arrived.']];
  const current=progressFor(order.status);
  return `<div class="tracking-timeline">${steps.map((step,index)=>`<div class="timeline-step ${index<current?'completed':index===current?'current':''}"><span class="timeline-marker">${index<current?'✓':''}</span><div><strong>${step[0]}</strong><p>${index<current?step[1]:index===current?step[1]:'We will update this step when your order progresses.'}</p></div></div>`).join('')}</div>`;
}
function orderCard(order){
  const status=String(order.status||'pending').toLowerCase();
  const items=Array.isArray(order.items)?order.items:[];
  const totalQty=items.reduce((sum,item)=>sum+Number(item.quantity||1),0);
  const first=items[0]||{};
  const orderId=esc(order.id);
  const itemsHtml=items.map(item=>`<div class="order-product"><img src="${esc(item.imageUrl||'../images/liwi.png')}" alt="${esc(item.name||'Liwi-Ka chocolate')}" onerror="this.src='../images/liwi.png'"><div class="product-description"><h4>${esc(item.name||'Liwi-Ka chocolate')}</h4><p>${esc(item.flavour||'Classic')}</p><span>Qty: ${Number(item.quantity||1)} · ${money(Number(item.price||0)*Number(item.quantity||1))}</span></div></div>`).join('');
  const payment=String(order.paymentStatus||'unpaid').replaceAll('_',' ');
  const note=status==='delivered'?'Delivered with love':status==='shipped'?'Your chocolates are on their way':status==='cancelled'?'This order was cancelled':status==='processing'?'Your chocolates are being prepared':'We have received your order';
  const detailId=`order-detail-${orderId}`;
  return `<article class="order-card" data-order-card data-status="${esc(status)}" data-search="${esc((order.orderNumber||'')+' '+items.map(i=>i.name||'').join(' '))}">
    <div class="order-card-top"><div class="order-reference"><span class="order-label">ORDER NUMBER</span><h3>#${esc(order.orderNumber||order.id)}</h3></div><span class="order-status status-${esc(status)}"><span class="status-dot"></span>${esc(statusLabels[status]||status)}</span></div>
    <div class="order-meta"><div><span class="meta-label">ORDERED ON</span><p>${esc(dateText(order.createdAt))}</p></div><div><span class="meta-label">TOTAL</span><p>${money(order.total)}</p></div><div><span class="meta-label">ITEMS</span><p>${totalQty} item${totalQty===1?'':'s'}</p></div></div>
    <div class="order-products">${itemsHtml||'<p>No item details found.</p>'}</div>
    <div class="delivery-note ${status==='delivered'?'delivered-note':''}"><span class="delivery-note-icon">${status==='delivered'?'✓':'✦'}</span><div><strong>${note}</strong><p>Payment: ${esc(payment)} · ${esc(order.paymentMethod||'—')}</p></div></div>
    <div class="order-card-actions"><a class="button-outline" href="#${detailId}">View Details</a><a class="button-gold" href="../seasonals/shop.html">Continue Shopping <span>→</span></a></div>
    <div class="order-details" id="${detailId}"><div class="details-heading"><h4>Delivery progress</h4><span>${esc(order.status||'pending')}</span></div>${timeline(order)}<div style="margin-top:18px;color:#82776b;font-size:11px;line-height:1.7"><strong>Delivery address</strong><br>${esc(order.shippingAddress?.address||'—')}<br>${esc(order.shippingAddress?.city||'Visakhapatnam')} · ${esc(order.shippingAddress?.pin||'')}<br><br><strong>Order total</strong> ${money(order.total)} (Delivery ${money(order.deliveryFee||0)})</div><a href="#" class="close-details" onclick="document.getElementById('${detailId}').style.display='none';return false">Close details ↑</a></div>
  </article>`;
}
function renderOrders(){
  const term=($('orderSearch')?.value||'').trim().toLowerCase();
  const status=$('statusFilter')?.value||'all';
  const filtered=allOrders.filter(order=>{const state=String(order.status||'pending').toLowerCase();const text=[order.orderNumber,order.id,...(order.items||[]).map(i=>i.name)].join(' ').toLowerCase();return(status==='all'||state===status)&&(!term||text.includes(term));});
  $('orderCount').innerHTML=`<strong>${filtered.length}</strong> of ${allOrders.length} order${allOrders.length===1?'':'s'}`;
  $('emptyOrders').hidden=allOrders.length>0;
  if(!allOrders.length){ordersList.innerHTML='';return;}
  ordersList.innerHTML=filtered.length?filtered.map(orderCard).join(''):`<div class="order-search-empty">No orders match this search or filter.</div>`;
}
function showLoadError(message){ordersList.innerHTML=`<div class="orders-offline"><strong>We couldn’t load your orders.</strong><p>${esc(message)}</p><button class="button-gold" id="retryOrders" type="button">TRY AGAIN ↻</button></div>`;$('retryOrders')?.addEventListener('click',loadOrders);}
async function loadOrders(){
  ordersList.innerHTML='<div class="orders-loading"><span></span><span></span><span></span><p>Loading your order history…</p></div>';
  if(!auth.currentUser){location.replace('../login.html?returnTo='+encodeURIComponent('videos/my-orders.html'));return;}
  const q=query(collection(db,'orders'),where('customerUid','==',auth.currentUser.uid),orderBy('createdAt','desc'));
  try{
    let snap;
    if(navigator.onLine)snap=await getDocs(q);else snap=await getDocsFromCache(q);
    allOrders=snap.docs.map(d=>({id:d.id,...d.data()}));
    if(!navigator.onLine){ordersList.insertAdjacentHTML('afterbegin','<div class="orders-offline">You are offline. Showing any saved order information available on this device.</div>');}
    renderOrders();
  }catch(error){
    if(!navigator.onLine){try{const cached=await getDocsFromCache(q);allOrders=cached.docs.map(d=>({id:d.id,...d.data()}));renderOrders();ordersList.insertAdjacentHTML('afterbegin','<div class="orders-offline">You are offline. These order details may be out of date.</div>');return;}catch(_){}}
    console.error('Could not load customer orders',error);showLoadError(error.message||'Please check your connection and try again.');
  }
}
$('orderSearch')?.addEventListener('input',renderOrders);
$('statusFilter')?.addEventListener('change',renderOrders);
window.addEventListener('online',loadOrders);
window.addEventListener('offline',()=>{if(!ordersList.querySelector('.orders-offline'))ordersList.insertAdjacentHTML('afterbegin','<div class="orders-offline">You are offline. Order updates may be delayed.</div>');});
await persistenceReady;
onAuthStateChanged(auth,user=>{if(!user){location.replace('../login.html?returnTo='+encodeURIComponent('videos/my-orders.html'));return;}loadOrders();});

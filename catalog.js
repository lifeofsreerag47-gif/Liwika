import { auth, db } from './firebase-config.js';
import { collection, query, where, orderBy, getDocs, getDocsFromCache, doc, getDoc, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const CATALOG_ENDPOINT = 'https://asia-south1-liwika-3719e.cloudfunctions.net/publicCatalog';
const $ = (selector, root=document) => root.querySelector(selector);
const esc = (v='') => String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => `₹${Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:0})}`;
const file = location.pathname.split('/').pop().toLowerCase();
let catalogue = [];
let storeSettings = { storefrontOnline: true, maintenanceMode: false };
let selectedProduct = null;

// Remove old local-only sample baskets/metrics once, so customers do not carry
// cart lines from the retired hard-coded catalogue into the Firebase catalogue.
try {
  if (localStorage.getItem('liwika_catalog_reset_v1') !== 'done') {
    localStorage.removeItem('liwika_cart_items');
    localStorage.removeItem('liwika_sales_metrics');
    localStorage.setItem('liwika_catalog_reset_v1', 'done');
  }
} catch (_) {}

function stateMarkup(state, message='') {
  if (state === 'loading') return `<div class="liwika-catalog-skeletons" aria-label="Loading products">${Array.from({length:3},()=>`<div class="liwika-skeleton-card"><div class="liwika-skeleton-image"></div><div class="liwika-skeleton-line"></div><div class="liwika-skeleton-line short"></div><div class="liwika-skeleton-button"></div></div>`).join('')}</div>`;
  if (state === 'offline') return `<div class="liwika-catalog-state liwika-offline-state"><div class="state-orbit">⌁</div><p class="state-kicker">CONNECTION INTERRUPTED</p><h3>You’re temporarily offline.</h3><p>${esc(message || 'Please check your internet connection. Your catalogue will return as soon as you are back online.')}</p><button type="button" class="liwika-state-retry" data-catalog-retry>TRY AGAIN ↻</button></div>`;
  if (state === 'maintenance') return `<div class="liwika-catalog-state liwika-empty-state"><div class="state-orbit">✧</div><p class="state-kicker">A LITTLE PAUSE, A BETTER MOMENT</p><h3>We’ll be back shortly.</h3><p>${esc(message || 'Our chocolate atelier is being refreshed. Please visit us again soon.')}</p></div>`;
  return `<div class="liwika-catalog-state liwika-empty-state"><div class="state-orbit">✧</div><p class="state-kicker">A LITTLE SPACE FOR SOMETHING SPECIAL</p><h3>No chocolates here just yet.</h3><p>${esc(message || 'We are preparing the collection. Check back soon for something beautifully crafted.')}</p><a class="liwika-state-retry" href="${file==='index.html'?'seasonals/shop.html':'../index.html'}">EXPLORE LIWI-KA</a></div>`;
}
function showState(target,state,message='') {
  target.dataset.catalogState=state;
  target.innerHTML=stateMarkup(state,message);
}
function getPlacement() {
  if (file==='index.html') return 'best-sellers';
  if (file==='shop.html') return 'shop';
  if (file==='new-arrivals.html') return 'new-arrivals';
  const key=file.replace('.html','').replaceAll(' ','-');
  if (['birthday','anniversary','christmas','valentines','graduation','justbecause'].includes(key)) return key==='christmas'?'festivals':key==='justbecause'?'just-because':key;
  return null;
}
function sortProducts(products) {
  const placement=getPlacement();
  let result=products.filter(p=>p.isVisible!==false && p.isPublished!==false);
  if (placement==='new-arrivals') result=result.filter(p=>p.newArrival===true||(p.placements||[]).includes('new-arrivals'));
  else if (placement) result=result.filter(p=>(p.placements||[]).includes(placement) || (placement==='best-sellers' && (p.placements||[]).includes('shop')));
  if(file==='index.html') result=result.slice(0,6);
  return result;
}
function productCard(p,kind) {
  const id=esc(p.id), name=esc(p.name||'Liwi-Ka chocolate'), image=esc(p.imageUrl||''), category=esc(p.category||'CHOCOLATE COLLECTION'), desc=esc(p.description||'A handcrafted Liwi-Ka chocolate creation.'), price=money(p.price);
  if(kind==='shop') return `<article class="shop-product" data-catalog-product="${id}" data-product="${id}"><div class="shop-product-image"><span class="product-badge">${esc(p.badge||'LIWI-KA')}</span>${image?`<img src="${image}" alt="${name}" loading="lazy">`:`<div class="liwika-no-image">LIWI-KA</div>`}<button class="quick-add" type="button" data-catalog-add="${id}">QUICK ADD</button></div><div class="shop-product-info"><div><p class="product-category">${category}</p><h2>${name}</h2><p class="product-description">${desc}</p></div><div class="shop-product-bottom"><span class="shop-price">${price}</span><button class="shop-add" type="button" data-catalog-view="${id}">VIEW</button></div></div></article>`;
  if(kind==='occasion') return `<article class="occasion-product" data-catalog-product="${id}" data-product="${id}"><div class="occasion-product-image">${image?`<img src="${image}" alt="${name}" loading="lazy">`:`<div class="liwika-no-image">LIWI-KA</div>`}<span class="product-badge">${esc(p.badge||'HANDCRAFTED')}</span></div><div class="occasion-product-info"><p class="product-category">${category}</p><h3>${name}</h3><p>${desc}</p><div class="occasion-product-bottom"><strong>${price}</strong><button type="button" class="add-button" data-catalog-view="${id}">EXPLORE</button></div></div></article>`;
  if(kind==='arrival') return `<article class="product-card" data-catalog-product="${id}" data-product="${id}"><div class="product-image-wrapper">${image?`<img class="product-image" src="${image}" alt="${name}" loading="lazy">`:`<div class="liwika-no-image">LIWI-KA</div>`}<div class="product-image-overlay"><button type="button" class="view-product-btn" data-catalog-view="${id}">VIEW</button></div></div><div class="product-info"><h3 class="product-name">${name}</h3><p class="product-category">${category}</p><p class="product-price">${price}</p></div></article>`;
  return `<article class="product-card" data-catalog-product="${id}" data-product="${id}"><div class="product-image">${image?`<img src="${image}" alt="${name}" loading="lazy">`:`<div class="liwika-no-image">LIWI-KA</div>`}</div><div class="product-info"><h3>${name}</h3><p class="product-description">${desc}</p><div class="product-bottom"><span class="price">${price}</span><button type="button" class="add-button" data-catalog-add="${id}">Add to Cart</button></div></div></article>`;
}
function determineKind(target) {
  if(target.classList.contains('shop-products')) return 'shop';
  if(target.classList.contains('occasion-products')) return 'occasion';
  if(target.id==='newArrivalsProducts') return 'arrival';
  return 'home';
}
function renderAll(products) {
  const targets=[...document.querySelectorAll('.product-grid.cine-items,.shop-products,.occasion-products,#newArrivalsProducts')];
  targets.forEach(target=>{
    const kind=determineKind(target);const list=sortProducts(products);
    if(!list.length){showState(target,'empty');return;}
    target.dataset.catalogState='ready';target.innerHTML=list.map(p=>productCard(p,kind)).join('');
  });
}

function showModal(p) {
  selectedProduct=p;
  let modal=$('#liwikaFirebaseProductModal');
  if(!modal){
    modal=document.createElement('div');modal.id='liwikaFirebaseProductModal';modal.className='liwika-product-modal';modal.innerHTML=`<div class="liwika-product-dialog" role="dialog" aria-modal="true" aria-labelledby="liwikaModalName"><button class="liwika-modal-close" type="button" aria-label="Close">×</button><div class="liwika-modal-image"></div><div class="liwika-modal-copy"><p class="state-kicker">LIWI-KA · HANDCRAFTED</p><h2 id="liwikaModalName"></h2><p class="liwika-modal-description"></p><label class="liwika-flavour-label">FLAVOUR</label><select class="liwika-flavour"></select><div class="liwika-modal-bottom"><strong class="liwika-modal-price"></strong><button class="liwika-modal-add" type="button">ADD TO CART</button></div><form class="liwika-review-form" id="liwikaReviewForm"><div class="liwika-review-heading">SHARE YOUR EXPERIENCE</div><label>YOUR RATING<select name="rating" required><option value="5">★★★★★ · Excellent</option><option value="4">★★★★ · Very good</option><option value="3">★★★ · Good</option><option value="2">★★ · Fair</option><option value="1">★ · Needs improvement</option></select></label><label>YOUR REVIEW<textarea name="message" rows="3" maxlength="1000" placeholder="Tell us what you loved…" required></textarea></label><button class="liwika-review-submit" type="submit">SUBMIT REVIEW</button><p class="liwika-review-note" aria-live="polite"></p></form></div></div>`;document.body.appendChild(modal);
    modal.addEventListener('click',e=>{if(e.target===modal||e.target.closest('.liwika-modal-close'))modal.classList.remove('open');if(e.target.closest('.liwika-modal-add'))addToCart(selectedProduct,$('.liwika-flavour',modal).value||'Classic');});
    modal.addEventListener('submit', async e=>{if(e.target.id!=='liwikaReviewForm')return;e.preventDefault();const form=e.target,note=$('.liwika-review-note',form),button=$('.liwika-review-submit',form);const user=auth.currentUser;if(!user){note.textContent='Please sign in to leave a review.';return;}const rating=Number(new FormData(form).get('rating'));const message=String(new FormData(form).get('message')||'').trim();if(!Number.isInteger(rating)||rating<1||rating>5||message.length<5){note.textContent='Please choose a rating and write at least 5 characters.';return;}button.disabled=true;button.textContent='SENDING…';try{await addDoc(collection(db,'feedback'),{customerUid:user.uid,customerName:user.displayName||user.phoneNumber||'Customer',productId:selectedProduct.id,productName:selectedProduct.name||'Liwi-Ka chocolate',rating,message,createdAt:serverTimestamp(),reviewed:false,isVisible:false});form.reset();note.textContent='Thank you. Your review has been sent to the Liwi-Ka team for moderation.';}catch(error){note.textContent=error.message||'Could not send your review. Please try again.';}finally{button.disabled=false;button.textContent='SUBMIT REVIEW';}});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')modal.classList.remove('open');});
  }
  $('.liwika-modal-image',modal).innerHTML=p.imageUrl?`<img src="${esc(p.imageUrl)}" alt="${esc(p.name)}">`:'<div class="liwika-no-image">LIWI-KA</div>';
  $('#liwikaModalName',modal).textContent=p.name||'Liwi-Ka chocolate';
  $('.liwika-modal-description',modal).textContent=p.description||'A handcrafted Liwi-Ka chocolate creation.';
  $('.liwika-modal-price',modal).textContent=money(p.price);
  const flavours=Array.isArray(p.flavours)&&p.flavours.length?p.flavours.map(f=>typeof f==='string'?f:f.name).filter(Boolean):[p.flavour||'Classic'];
  $('.liwika-flavour',modal).innerHTML=flavours.map(f=>`<option value="${esc(f)}">${esc(f)}</option>`).join('');
  $('.liwika-review-form',modal).hidden = !storeSettings.reviewsEnabled;
  modal.classList.add('open');
}
function addToCart(p,flavour='Classic') {
  if(!p)return;
  if(!window.LiwikaCart?.addItem){alert('The cart is unavailable. Please refresh the page and try again.');return;}
  const item={id:p.id,name:p.name,flavour,quantity:1,price:Number(p.price||0),image:p.imageUrl||''};
  window.LiwikaCart.addItem(item);
  if(typeof window.LiwikaShowCartToast==='function')window.LiwikaShowCartToast(item);
  else {const toast=document.createElement('div');toast.className='liwika-cart-toast';toast.textContent=`${p.name} added to your cart`;document.body.appendChild(toast);setTimeout(()=>toast.remove(),2400);}
}

document.addEventListener('click',e=>{
  const retry=e.target.closest('[data-catalog-retry]');if(retry){loadCatalog();return;}
  const add=e.target.closest('[data-catalog-add]');if(add){e.preventDefault();const p=catalogue.find(x=>x.id===add.dataset.catalogAdd);if(p)addToCart(p,p.flavour||'Classic');return;}
  const view=e.target.closest('[data-catalog-view]');if(view){e.preventDefault();const p=catalogue.find(x=>x.id===view.dataset.catalogView);if(p)showModal(p);return;}
  const card=e.target.closest('[data-catalog-product]');if(card&&!e.target.closest('button')){const p=catalogue.find(x=>x.id===card.dataset.catalogProduct);if(p)showModal(p);}
});

async function getProducts() {
  // Redis-backed Cloud Function first; direct Firestore is a safe fallback until
  // Cloud Functions/Upstash are deployed or when the cache endpoint is unavailable.
  try {
    const response=await fetch(CATALOG_ENDPOINT,{method:'GET',cache:'no-store'});
    if(response.ok){const payload=await response.json();if(payload.settings && typeof payload.settings==='object'){storeSettings={storefrontOnline:payload.settings.storefrontOnline!==false,maintenanceMode:payload.settings.maintenanceMode===true,reviewsEnabled:payload.settings.reviewsEnabled!==false};}if(Array.isArray(payload.products))return payload.products;}
  } catch (_) {}
  const q=query(collection(db,'products'),where('isPublished','==',true),where('isVisible','==',true),orderBy('sortOrder','asc'));
  try {
    const [snap,settingsSnap]=await Promise.all([getDocs(q),getDoc(doc(db,'settings','store'))]);
    if(settingsSnap.exists()){const v=settingsSnap.data();storeSettings={storefrontOnline:v.storefrontOnline!==false,maintenanceMode:v.maintenanceMode===true,reviewsEnabled:v.reviewsEnabled!==false};}
    return snap.docs.map(d=>({id:d.id,...d.data()}));
  }
  catch(error){
    if(!navigator.onLine){try{const snap=await getDocsFromCache(q);return snap.docs.map(d=>({id:d.id,...d.data()}));}catch(_){}}
    throw error;
  }
}
async function loadCatalog() {
  const targets=[...document.querySelectorAll('.product-grid.cine-items,.shop-products,.occasion-products,#newArrivalsProducts')];
  targets.forEach(t=>showState(t,'loading'));
  if(!navigator.onLine){targets.forEach(t=>showState(t,'offline'));return;}
  try {
    catalogue=await getProducts();
    if(storeSettings.maintenanceMode || storeSettings.storefrontOnline===false){targets.forEach(t=>showState(t,'maintenance'));return;}
    renderAll(catalogue);
  }
  catch(error){console.error('Liwi-Ka catalogue could not load',error);targets.forEach(t=>showState(t,'offline','We could not reach the product catalogue. Check your connection and try again.'));}
}
window.addEventListener('offline',()=>{document.querySelectorAll('.product-grid.cine-items,.shop-products,.occasion-products,#newArrivalsProducts').forEach(t=>showState(t,'offline'));});
window.addEventListener('online',loadCatalog);
window.addEventListener('focus',()=>{if(navigator.onLine)loadCatalog();});
loadCatalog();

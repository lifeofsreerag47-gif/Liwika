import { db } from './firebase-config.js';
import { collection, query, where, orderBy, getDocs, getDocsFromCache, doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const CATALOG_ENDPOINT = 'https://asia-south1-liwika-3719e.cloudfunctions.net/publicCatalog';
const $ = (selector, root = document) => root.querySelector(selector);
const esc = (value = '') => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const money = value => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const file = location.pathname.split('/').pop().toLowerCase();
let catalogue = [];
let storeSettings = { storefrontOnline: true, maintenanceMode: false };

function getPlacement() {
  if (file === 'index.html' || file === '') return 'best-sellers';
  if (file === 'shop.html') return 'shop';
  if (file === 'new-arrivals.html') return 'new-arrivals';
  const key = file.replace('.html', '').replaceAll(' ', '-');
  if (['birthday','anniversary','christmas','valentines','graduation','justbecause'].includes(key)) {
    return key === 'christmas' ? 'festivals' : key === 'justbecause' ? 'just-because' : key;
  }
  return null;
}
function stateMarkup(state, message = '') {
  if (state === 'loading') return `<div class="liwika-catalog-skeletons" aria-label="Loading products">${Array.from({length:3},()=>`<div class="liwika-skeleton-card"><div class="liwika-skeleton-image"></div><div class="liwika-skeleton-line"></div><div class="liwika-skeleton-line short"></div><div class="liwika-skeleton-button"></div></div>`).join('')}</div>`;
  if (state === 'offline') return `<div class="liwika-catalog-state"><div class="state-orbit">⌁</div><p class="state-kicker">CONNECTION INTERRUPTED</p><h3>You’re temporarily offline.</h3><p>${esc(message || 'Please check your internet connection and try again.')}</p><button type="button" class="liwika-state-retry" data-catalog-retry>TRY AGAIN ↻</button></div>`;
  if (state === 'maintenance') return `<div class="liwika-catalog-state"><div class="state-orbit">✧</div><p class="state-kicker">A LITTLE PAUSE, A BETTER MOMENT</p><h3>We’ll be back shortly.</h3><p>Our chocolate atelier is being refreshed. Please visit us again soon.</p></div>`;
  return `<div class="liwika-catalog-state"><div class="state-orbit">✧</div><p class="state-kicker">A LITTLE SPACE FOR SOMETHING SPECIAL</p><h3>No chocolates here just yet.</h3><p>We are preparing this collection. Check back soon for something beautifully crafted.</p></div>`;
}
/* New Arrivals page: its hero, "coming soon" panel and product section must follow the catalogue state.
   (Previously the cards rendered but the section stayed hidden and "coming soon" never went away.) */
const arrivalsDefaults = {};
function syncArrivalsPage(target, state) {
  if (target.id !== 'newArrivalsProducts') return;
  const section = document.getElementById('newArrivalsSection'), empty = document.getElementById('emptyState');
  if (!section || !empty) return;
  const hasProducts = state === 'ready';
  const showEmpty = state === 'empty';
  section.classList.toggle('is-hidden', showEmpty);
  section.hidden = showEmpty;
  empty.classList.toggle('is-hidden', !showEmpty);
  empty.hidden = !showEmpty;
  empty.style.display = showEmpty ? '' : 'none';
  const one = document.getElementById('titleLineOne'), two = document.getElementById('titleLineTwo'), desc = document.getElementById('newArrivalsDescription');
  if (one && !('one' in arrivalsDefaults)) { arrivalsDefaults.one = one.textContent; arrivalsDefaults.two = two?.textContent; arrivalsDefaults.desc = desc?.textContent; }
  if (one && two) {
    one.textContent = hasProducts ? 'Fresh from our' : arrivalsDefaults.one;
    two.textContent = hasProducts ? 'chocolatiers.' : arrivalsDefaults.two;
  }
  if (desc && arrivalsDefaults.desc !== undefined) desc.textContent = hasProducts ? 'Discover the latest creations from Liwi-Ka.' : arrivalsDefaults.desc;
}
function showState(target, state, message = '') {
  target.dataset.catalogState = state;
  target.innerHTML = stateMarkup(state, message);
  syncArrivalsPage(target, state);
}
function normalizeProduct(p) {
  const image = p.imageUrl || p.image || '';
  const flavours = Array.isArray(p.flavours) && p.flavours.length
    ? p.flavours.map(flavour => typeof flavour === 'string' ? { name: flavour, image } : { name: flavour.name || 'Classic', image: flavour.image || image })
    : [{ name: p.flavour || 'Classic', image }];
  const images = (Array.isArray(p.images) ? p.images : Array.isArray(p.imageUrls) ? p.imageUrls : [])
    .map(item => typeof item === 'string' ? item : (item?.url || item?.imageUrl || item?.downloadURL || ''))
    .filter(Boolean);
  if (image && !images.includes(image)) images.unshift(image);
  return { ...p, id: p.id, name: p.name || 'Liwi-Ka Chocolate', basePrice: Number(p.price ?? p.basePrice ?? 0), image, imageUrl: image, images, flavours, nutrition: p.nutrition || {}, ingredients: p.ingredients || '' };
}
function productsForPlacement(products) {
  const placement = getPlacement();
  let list = products.filter(p => p.isPublished !== false && p.isVisible !== false);
  if (placement === 'new-arrivals') list = list.filter(p => p.newArrival === true || (p.placements || []).includes('new-arrivals'));
  else if (placement) list = list.filter(p => (p.placements || []).includes(placement) || (placement === 'best-sellers' && (p.placements || []).includes('shop')));
  if (placement === 'best-sellers') list = list.slice(0, 6);
  return list;
}
function bindDesktopBestsellerTilt(target) {
  const finePointer = window.matchMedia?.('(hover: hover) and (pointer: fine)');
  if (!finePointer?.matches) return;
  target.querySelectorAll('.product-card').forEach(card => {
    if (card.dataset.liwikaTiltBound === '1') return;
    card.dataset.liwikaTiltBound = '1';
    const reset = () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)';
    };
    card.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse') return;
      const rect = card.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      if (!centerX || !centerY) return;
      const rotateX = ((event.clientY - rect.top - centerY) / centerY) * -6;
      const rotateY = ((event.clientX - rect.left - centerX) / centerX) * 6;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px) scale(1.02)`;
    });
    card.addEventListener('pointerleave', reset);
    card.addEventListener('pointercancel', reset);
  });
}

function homeCard(p) {
  const words = String(p.name || 'Liwi-Ka Chocolate').trim().split(/\s+/);
  const first = words.shift() || 'Liwi-Ka';
  const second = words.join(' ');
  const title = `<h3><span>${esc(first)}</span>${second ? `<span>${esc(second)}</span>` : ''}</h3>`;
  const image = p.imageUrl ? `<img src="${esc(p.imageUrl)}" alt="${esc(p.name)}" loading="lazy" decoding="async">` : `<div class="liwika-no-image">LIWI-KA</div>`;
  return `<div class="product-card" data-product="${esc(p.id)}" tabindex="0" role="button" aria-label="View ${esc(p.name)}"><div class="product-image">${image}</div><div class="product-info">${title}<p class="product-description">${esc(p.description || '')}</p><div class="product-bottom"><span class="price">${money(p.price)}</span><button type="button" class="add-button">Add to Cart</button></div></div><span class="card-corner-name" aria-hidden="true">${esc(first)}${second ? `<br>${esc(second)}` : ''}</span></div>`;
}
function categorySlug(p) {
  const value = String(p.category || '').toLowerCase();
  if (value.includes('dark')) return 'dark';
  if (value.includes('milk')) return 'milk';
  if (value.includes('nut') || value.includes('hazel')) return 'nutty';
  return 'other';
}
function shopCard(p) {
  const image = p.imageUrl ? `<img src="${esc(p.imageUrl)}" alt="${esc(p.name)} chocolate" loading="lazy" decoding="async">` : `<div class="liwika-no-image">LIWI-KA</div>`;
  const cat = esc(p.category || 'CHOCOLATE');
  return `<article class="shop-product" data-product="${esc(p.id)}" data-catalog-product="${esc(p.id)}" data-sales="${Number(p.salesCount || 0)}" data-weekly-sales="${Number(p.weeklySales || 0)}" data-category="${categorySlug(p)}" tabindex="0" role="button" aria-haspopup="dialog" aria-label="View ${esc(p.name)} details"><div class="shop-product-image">${p.badge ? `<span class="product-badge">${esc(p.badge)}</span>` : ''}${image}<button class="quick-add" type="button">QUICK ADD</button></div><div class="shop-product-info"><div><p class="product-category">${cat}</p><h2>${esc(p.name)}</h2><p class="product-description">${esc(p.description || '')}</p></div><div class="shop-product-bottom"><span class="shop-price">${money(p.price)}</span><button class="quick-add quick-add-mobile" type="button" aria-label="Quick add product">QUICK ADD</button><button class="shop-add" type="button">ADD</button></div></div></article>`;
}
function occasionCard(p) {
  const image = p.imageUrl ? `<img src="${esc(p.imageUrl)}" alt="${esc(p.name)}" loading="lazy" decoding="async">` : `<div class="liwika-no-image">LIWI-KA</div>`;
  return `<article class="occasion-product" data-catalog-product="${esc(p.id)}" data-product="${esc(p.id)}"><div class="occasion-product-image">${image}${p.badge ? `<span class="product-badge">${esc(p.badge)}</span>` : ''}</div><div class="occasion-product-info"><p class="product-category">${esc(p.category || 'CHOCOLATE')}</p><h3>${esc(p.name)}</h3><p>${esc(p.description || '')}</p><div class="occasion-product-bottom"><strong>${money(p.price)}</strong><button type="button" class="add-button" data-catalog-view="${esc(p.id)}">EXPLORE</button></div></div></article>`;
}
function arrivalCard(p) {
  const image = p.imageUrl ? `<img class="product-image" src="${esc(p.imageUrl)}" alt="${esc(p.name)}" loading="lazy" decoding="async">` : `<div class="liwika-no-image">LIWI-KA</div>`;
  return `<article class="product-card" data-catalog-product="${esc(p.id)}" data-product="${esc(p.id)}"><div class="product-image-wrapper">${image}<div class="product-image-overlay"><button type="button" class="view-product-btn" data-catalog-view="${esc(p.id)}">VIEW</button></div></div><div class="product-info"><h3 class="product-name">${esc(p.name)}</h3><p class="product-category">${esc(p.category || 'CHOCOLATE')}</p><p class="product-price">${money(p.price)}</p></div></article>`;
}
function ensureNativeProductModal() {
  let modal = $('#productModal');
  if (modal) return modal;
  modal = document.createElement('div');
  modal.id = 'productModal'; modal.className = 'product-modal'; modal.setAttribute('aria-hidden','true'); modal.setAttribute('role','dialog');
  modal.innerHTML = `<div class="modal-content"><button id="closeModal" class="close-modal" type="button" aria-label="Close modal">&times;</button><div class="modal-body"><div class="modal-image-container"><img id="modalProductImage" alt="Selected product"></div><div class="modal-details"><p id="modalProductBadge" class="modal-badge"></p><h2 id="modalProductName">Product details</h2><p id="modalProductDescription" class="modal-description"></p><div class="modal-option-group"><label class="modal-option-label">CHOOSE FLAVOUR</label><div id="flavourOptions" class="flavour-options"></div></div><div class="modal-option-group"><label class="modal-option-label">QUANTITY</label><div class="quantity-control"><button id="decreaseQuantity" type="button" class="qty-btn">-</button><span id="quantity" class="qty-display">1</span><button id="increaseQuantity" type="button" class="qty-btn">+</button></div></div><div class="modal-footer-action"><div class="modal-price-container"><span class="modal-price-label">PRICE</span><span id="modalProductPrice" class="modal-price">₹0</span></div><button id="modalAddToCart" type="button" class="modal-add-btn">ADD TO CART</button></div></div></div></div>`;
  document.body.appendChild(modal);
  const close = () => { modal.classList.remove('active'); modal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; document.body.classList.remove('liwi-product-modal-open'); };
  $('#closeModal',modal).addEventListener('click',close);
  modal.addEventListener('click',e=>{if(e.target===modal)close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('active'))close();});
  return modal;
}
function openNativeProductModal(p) {
  const modal = ensureNativeProductModal();
  const product = normalizeProduct(p);
  window.LiwikaActiveProductData = product;
  // Every lookup is null-safe: each page's own modal markup differs slightly (some have no badge element).
  const setText = (selector, value) => { const el = $(selector, modal); if (el) el.textContent = value; return el; };
  const image = $('#modalProductImage',modal);
  setText('#modalProductName', product.name);
  const badge = setText('#modalProductBadge', product.badge || '');
  if (badge) badge.hidden = !product.badge;
  setText('#modalProductDescription', product.description || '');
  if (image) { image.src = product.imageUrl || ''; image.alt = product.name; }
  window.LiwikaRenderProductGallery?.(product, product.imageUrl);
  const options = $('#flavourOptions',modal);
  if (options) {
    options.innerHTML = '';
    product.flavours.forEach((flavour,index)=>{
      const button=document.createElement('button'); button.type='button'; button.className='flavour-button'+(index===0?' selected':''); button.textContent=flavour.name;
      button.addEventListener('click',()=>{ options.querySelectorAll('.flavour-button').forEach(x=>x.classList.remove('selected'));button.classList.add('selected');if(image)image.src=flavour.image||product.imageUrl||'';window.LiwikaSetProductGalleryImage?.(flavour.image||product.imageUrl||''); });
      options.appendChild(button);
    });
  }
  const qty = $('#quantity',modal); if (qty) qty.innerHTML='<span class="qty-digit current">1</span>';
  setText('#modalProductPrice', money(product.price ?? product.basePrice));
  modal.classList.add('active'); modal.setAttribute('aria-hidden','false'); document.body.classList.add('liwi-product-modal-open'); document.body.style.overflow='hidden';
  // Product UI reads this object to display admin-entered nutrition and attach the Firestore product ID to cart lines.
}
async function getProducts() {
  try {
    const response = await fetch(CATALOG_ENDPOINT, { method:'GET', cache:'no-store' });
    if (response.ok) {
      const payload = await response.json();
      if (payload.settings && typeof payload.settings === 'object') storeSettings = { storefrontOnline: payload.settings.storefrontOnline !== false, maintenanceMode: payload.settings.maintenanceMode === true };
      if (Array.isArray(payload.products)) return payload.products.map(normalizeProduct);
    }
  } catch (_) {}
  const q = query(collection(db,'products'), where('isPublished','==',true), where('isVisible','==',true), orderBy('sortOrder','asc'));
  try {
    const [snap, settingsSnap] = await Promise.all([getDocs(q), getDoc(doc(db,'settings','store'))]);
    if (settingsSnap.exists()) { const value=settingsSnap.data(); storeSettings={storefrontOnline:value.storefrontOnline!==false,maintenanceMode:value.maintenanceMode===true}; }
    return snap.docs.map(d=>normalizeProduct({id:d.id,...d.data()}));
  } catch (error) {
    if (!navigator.onLine) { try { const snap=await getDocsFromCache(q); return snap.docs.map(d=>normalizeProduct({id:d.id,...d.data()})); } catch (_) {} }
    throw error;
  }
}
function renderAll(products) {
  const targets=[...document.querySelectorAll('.product-grid.cine-items,.shop-products,.occasion-products,#newArrivalsProducts')];
  const pageProducts=productsForPlacement(products);
  const homeProducts=pageProducts;
  const shopProducts=products.filter(p=>(p.placements||[]).includes('shop'));
  const setHome=()=>window.LiwikaSetHomeProducts?.(homeProducts);
  if (document.readyState==='loading' && !window.LiwikaSetHomeProducts) document.addEventListener('DOMContentLoaded',setHome,{once:true}); else setHome();
  window.LiwikaSetShopProducts?.(file==='new-arrivals.html'?products.filter(p=>p.newArrival===true||(p.placements||[]).includes('new-arrivals')):shopProducts);
  const map=Object.fromEntries(products.map(p=>[p.id,p]));
  window.occasionProducts=map;
  targets.forEach(target=>{
    let list=pageProducts; let renderer=occasionCard;
    if(target.classList.contains('cine-items')) { list=homeProducts; renderer=homeCard; }
    else if(target.id==='newArrivalsProducts') { list=products.filter(p=>p.newArrival===true||(p.placements||[]).includes('new-arrivals')); renderer=shopCard; }
    else if(target.classList.contains('shop-products')) { list=shopProducts; renderer=shopCard; }
    if(!list.length){showState(target,'empty');return;}
    target.dataset.catalogState='ready'; target.innerHTML=list.map(renderer).join(''); syncArrivalsPage(target,'ready');
    if (target.classList.contains('cine-items')) bindDesktopBestsellerTilt(target);
  });
}
function bindCatalogInteractions() {
  document.addEventListener('click',event=>{
    const retry=event.target.closest('[data-catalog-retry]'); if(retry){firstLoadDone=false;loadCatalog();return;}
    const card=event.target.closest('[data-catalog-product]');
    const view=event.target.closest('[data-catalog-view]');
    if(!card&&!view)return;
    const id=(view?.dataset.catalogView)||(card?.dataset.catalogProduct);
    const product=catalogue.find(item=>item.id===id); if(!product)return;
    event.preventDefault();
    // The homepage keeps its original controller. Shop cards use their Shop modal;
    // this document-level route is a fallback if a page's grid listener is absent.
    if(document.body.classList.contains('home-page')) return;
    if(file==='new-arrivals.html') return; // shop.js owns the card + product window here
    if(file==='shop.html') {
      if(!event.__liwikaShopModalHandled) window.LiwikaOpenShopProductModal?.(id);
      return;
    }
    openNativeProductModal(product);
  });
  document.addEventListener('keydown',event=>{
    if(event.key!=='Enter'&&event.key!==' ')return;
    const card=event.target.closest('.product-grid.cine-items .product-card[data-product]');
    if(card){event.preventDefault();window.LiwikaOpenHomeProductModal?.(card.dataset.product);}
  });
}
/* ---- catalogue refresh -------------------------------------------------------
   Skeletons are shown ONLY for the very first load. Later refreshes (tab focus, coming
   back online, iframe focus on the phone shell) are silent: they never blank the grid,
   so a customer's tap is never lost and the page never jumps. The grid is re-rendered
   only when the catalogue actually changed. */
let firstLoadDone = false, loading = false, lastLoadAt = 0, lastSignature = '';
const REFRESH_AFTER_MS = 60000;
const gridTargets = () => [...document.querySelectorAll('.product-grid.cine-items,.shop-products,.occasion-products,#newArrivalsProducts')];
const signatureOf = list => JSON.stringify((list || []).map(p => [p.id, p.name, p.price ?? p.basePrice, p.imageUrl, p.updatedAt?.seconds ?? p.updatedAt ?? '', (p.placements || []).join(','), p.sortOrder, p.isPublished, p.isVisible, p.newArrival]));

async function loadCatalog({ silent = false } = {}) {
  if (loading) return;
  const targets = gridTargets();
  if (!targets.length) return;
  if (!silent) targets.forEach(target => showState(target, 'loading'));
  if (!navigator.onLine) { if (!silent || !firstLoadDone) targets.forEach(target => showState(target, 'offline')); return; }
  loading = true;
  try {
    const fresh = await getProducts();
    if (storeSettings.maintenanceMode || storeSettings.storefrontOnline === false) { targets.forEach(target => showState(target, 'maintenance')); firstLoadDone = false; return; }
    const sig = signatureOf(fresh);
    const needsRender = !silent || !firstLoadDone || sig !== lastSignature || targets.some(t => t.dataset.catalogState !== 'ready' && t.dataset.catalogState !== 'empty');
    catalogue = fresh;
    if (needsRender) { renderAll(catalogue); lastSignature = sig; }
    firstLoadDone = true; lastLoadAt = Date.now();
  } catch (error) {
    console.error('Liwi-Ka catalogue could not load', error);
    if (!silent || !firstLoadDone) targets.forEach(target => showState(target, 'offline', 'We could not reach the product catalogue. Check your connection and try again.'));
  } finally { loading = false; }
}
const refreshQuietly = () => { if (navigator.onLine && firstLoadDone && Date.now() - lastLoadAt > REFRESH_AFTER_MS) loadCatalog({ silent: true }); };
window.addEventListener('offline', () => { if (!firstLoadDone) gridTargets().forEach(target => showState(target, 'offline')); });
window.addEventListener('online', () => loadCatalog({ silent: true }));
window.addEventListener('focus', refreshQuietly);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refreshQuietly(); });
bindCatalogInteractions();
loadCatalog();

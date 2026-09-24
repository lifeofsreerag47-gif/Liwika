/* =========================================================
   LIWI-KA — GLOBAL FREE DELIVERY HUD
   One shared component for desktop + the persistent mobile shell.
   Cart state comes from localStorage, so page/section changes do not
   reset the progress.
========================================================= */
(function (window, document) {
  'use strict';

  const THRESHOLD = 150;
  const STORAGE_KEY = 'liwika_cart_items';
  const HIDE_DELAY = 520;
  const UNLOCK_DURATION = 1900;
  const TOAST_DURATION = 2600;

  // The mobile shell owns this UI. The iframe only owns the cart page/content.
  const isFrame = new URLSearchParams(window.location.search).get('liwiFrame') === '1';
  if (isFrame) return;

  let hideTimer = null;
  let unlockTimer = null;
  let previousTotal = null;
  let unlockActive = false;

  function money(value) {
    return '₹' + Math.max(0, Math.round(value)).toLocaleString('en-IN');
  }

  function getSubtotal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const items = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(items)) return 0;
      return items.reduce((sum, item) => {
        return sum + (Number(item.price) || 0) * (Number(item.quantity) || 0);
      }, 0);
    } catch (_) {
      return 0;
    }
  }

  function create() {
    let el = document.getElementById('liwika-free-delivery');
    if (el) return el;

    el = document.createElement('aside');
    el.id = 'liwika-free-delivery';
    el.className = 'liwika-free-delivery';
    el.setAttribute('aria-live', 'polite');
    el.innerHTML = `
      <div class="lfd-card">
        <div class="lfd-progress-state">
          <div class="lfd-copy">
            <span class="lfd-label">FREE DELIVERY</span>
            <span class="lfd-message">Shop for ₹149 to unlock free delivery</span>
          </div>
          <div class="lfd-track" aria-hidden="true">
            <span class="lfd-fill"></span>
          </div>
        </div>
        <div class="lfd-unlocked">FREE DELIVERY UNLOCKED</div>
      </div>`;

    document.body.appendChild(el);
    return el;
  }

  function hideImmediately(el) {
    clearTimeout(hideTimer);
    clearTimeout(unlockTimer);
    el.classList.remove('is-visible', 'is-unlocked', 'is-leaving');
    unlockActive = false;
  }

  function playUnlock(el) {
    clearTimeout(hideTimer);
    clearTimeout(unlockTimer);

    el.classList.remove('is-leaving');
    el.classList.add('is-visible');

    // Force a clean transition when the customer crosses ₹150.
    requestAnimationFrame(function () {
      el.classList.add('is-unlocked');
    });

    unlockActive = true;
    unlockTimer = setTimeout(function () {
      el.classList.remove('is-visible', 'is-unlocked');
      el.classList.add('is-leaving');
      hideTimer = setTimeout(function () {
        el.classList.remove('is-leaving');
        unlockActive = false;
      }, HIDE_DELAY);
    }, UNLOCK_DURATION);
  }

  function getCartCount() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const items = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(items)) return 0;
      return items.reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0);
    } catch (_) {
      return 0;
    }
  }

  function updateCartBadges() {
    const count = getCartCount();
    const hosts = [];

    document.querySelectorAll('.cart-nav-link, .mobile-bottom-item[aria-label="Shopping Cart"], .cart-icon-button').forEach(function (el) {
      // Desktop cart buttons are normally nested inside .cart-nav-link.
      // Put one badge on the outer clickable element only.
      if (el.classList.contains('cart-icon-button') && el.closest('.cart-nav-link')) return;
      if (hosts.indexOf(el) === -1) hosts.push(el);
    });

    hosts.forEach(function (host) {
      let badge = host.querySelector(':scope > .liwika-cart-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'liwika-cart-badge';
        badge.setAttribute('aria-hidden', 'true');
        host.appendChild(badge);
      }
      badge.textContent = count > 99 ? '99+' : String(count);
      badge.classList.toggle('is-visible', count > 0);
    });
  }

  function createToast() {
    let toast = document.getElementById('liwika-cart-toast');
    if (toast) return toast;
    toast = document.createElement('div');
    toast.id = 'liwika-cart-toast';
    toast.className = 'liwika-cart-toast';
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML = `
      <div class="lct-icon" aria-hidden="true"><span>✓</span></div>
      <span class="lct-text">Added to Cart</span>`;
    document.body.appendChild(toast);
    return toast;
  }

  function showCartToast(item) {
    if (!item || isFrame) return;
    const toast = createToast();
    clearTimeout(showCartToast.timer);
    toast.classList.remove('is-visible');
    requestAnimationFrame(function () { toast.classList.add('is-visible'); });
    showCartToast.timer = setTimeout(function () {
      toast.classList.remove('is-visible');
    }, TOAST_DURATION);
  }

  function syncBadges() {
    updateCartBadges();
    const bar = document.querySelector('.mobile-bottom-nav');
    if (bar && window.updateLiwikaMobileCartBadge) window.updateLiwikaMobileCartBadge();
  }

  function update(forceShow, forceUnlock) {
    const total = getSubtotal();
    const el = create();
    const message = el.querySelector('.lfd-message');
    const fill = el.querySelector('.lfd-fill');

    // Empty cart or already-unlocked cart: the HUD should not remain visible.
    if (total <= 0 || total >= THRESHOLD) {
      if (total >= THRESHOLD && unlockActive) {
        // Keep the unlock animation alive while the mobile iframe navigates/reloads.
        previousTotal = total;
        return;
      }
      if (total >= THRESHOLD && (forceUnlock || (previousTotal !== null && previousTotal < THRESHOLD))) {
        playUnlock(el);
      } else {
        hideImmediately(el);
        unlockActive = false;
      }
      previousTotal = total;
      return;
    }

    clearTimeout(hideTimer);
    clearTimeout(unlockTimer);

    el.classList.remove('is-leaving', 'is-unlocked');
    el.classList.add('is-visible');

    const ratio = Math.min(1, Math.max(0, total / THRESHOLD));
    requestAnimationFrame(function () {
      fill.style.width = (ratio * 100) + '%';
    });

    const remaining = Math.max(0, 149 - total);
    message.textContent = 'Shop for ' + money(remaining) + ' to unlock free delivery';
    previousTotal = total;
  }

  function sync(forceShow, forceUnlock) {
    update(Boolean(forceShow), Boolean(forceUnlock));
  }

  window.LiwikaUpdateFreeDeliveryHUD = sync;
  window.LiwikaShowCartToast = showCartToast;
  window.LiwikaUpdateCartBadges = syncBadges;
  window.LiwikaFreeDelivery = {
    update: sync,
    threshold: THRESHOLD
  };

  // Same-document cart updates (desktop).
  window.addEventListener('cartUpdated', function (event) {
    update(true, false);
    syncBadges();
    if (event && event.detail && event.detail.item) showCartToast(event.detail.item);
  });

  // The persistent mobile shell receives cart changes from its iframe.
  window.addEventListener('message', function (event) {
    if (event.data && event.data.type === 'LIWIKA_CART_UPDATED') {
      update(true, false);
      syncBadges();
      if (event.data.item) showCartToast(event.data.item);
    }
  });

  // Covers cart changes made in another tab/window.
  window.addEventListener('storage', function (event) {
    if (!event.key || event.key === STORAGE_KEY) { update(false); syncBadges(); }
  });

  function init() {
    previousTotal = null;
    update(false);
    syncBadges();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})(window, document);

/* =========================================================
   LIWI-KA — SHARED PRODUCT UI LAYER
   • Supplies nutrition/ingredient details everywhere.
   • Uses the proven Home quantity/amount animation everywhere.
   • Does NOT clone/replace page controls.
   • Leaves product/occasion controllers intact except for a
     capture-phase quantity handler that prevents animation clashes.
========================================================= */
(function (window, document) {
  'use strict';

  const FALLBACK = {
    'Dark Indulgence': {
      energy: '520 kcal', fat: '32 g', saturatedFat: '20 g', carbohydrates: '52 g', sugars: '38 g', protein: '7 g',
      ingredients: 'Cocoa solids, sugar, cocoa butter, milk solids, natural vanilla flavour'
    },
    'Golden Milk': {
      energy: '545 kcal', fat: '34 g', saturatedFat: '21 g', carbohydrates: '54 g', sugars: '45 g', protein: '8 g',
      ingredients: 'Sugar, milk solids, cocoa butter, cocoa solids, natural vanilla flavour'
    },
    'Hazelnut Bliss': {
      energy: '560 kcal', fat: '37 g', saturatedFat: '18 g', carbohydrates: '51 g', sugars: '39 g', protein: '8 g',
      ingredients: 'Cocoa solids, sugar, cocoa butter, milk solids, roasted hazelnuts, natural vanilla flavour'
    },
    'Midnight Cacao': {
      energy: '510 kcal', fat: '31 g', saturatedFat: '19 g', carbohydrates: '50 g', sugars: '32 g', protein: '8 g',
      ingredients: 'Cocoa solids, cocoa butter, sugar, natural vanilla flavour, espresso extract'
    },
    'Velvet Cream': {
      energy: '535 kcal', fat: '34 g', saturatedFat: '21 g', carbohydrates: '55 g', sugars: '46 g', protein: '8 g',
      ingredients: 'Milk solids, sugar, cocoa butter, cocoa solids, natural vanilla flavour'
    },
    'Roasted Hazelnut': {
      energy: '570 kcal', fat: '39 g', saturatedFat: '19 g', carbohydrates: '49 g', sugars: '35 g', protein: '9 g',
      ingredients: 'Cocoa solids, sugar, cocoa butter, milk solids, roasted hazelnuts, hazelnut praline, natural vanilla flavour'
    }
  };

  function resolveNutrition(name) {
    const pageProducts = window.occasionProducts || {};
    const match = Object.values(pageProducts).find(item => item && item.name === name);
    if (match?.nutrition) {
      return {
        ...match.nutrition,
        ingredients: match.ingredients || FALLBACK[name]?.ingredients || 'Cocoa solids, sugar, cocoa butter, milk solids, natural vanilla flavour'
      };
    }
    return FALLBACK[name] || null;
  }

  function ensureNutrition(modal) {
    if (!modal) return null;

    const existing = modal.querySelector('#modalProductNutrition');
    if (existing) return existing;

    let section = modal.querySelector('.universal-nutrition-section');
    if (section) return section;

    const details = modal.querySelector('.modal-details');
    if (!details) return null;

    section = document.createElement('div');
    section.className = 'modal-info-section universal-nutrition-section';
    section.innerHTML = `
      <div class="universal-info-heading">NUTRITION · PER 100 G</div>
      <div id="modalProductNutrition" class="nutrition-grid universal-nutrition-grid">
        <div class="nutrition-item"><span>Energy</span><strong data-nutrition="energy">—</strong></div>
        <div class="nutrition-item"><span>Fat</span><strong data-nutrition="fat">—</strong></div>
        <div class="nutrition-item"><span>Saturated fat</span><strong data-nutrition="saturatedFat">—</strong></div>
        <div class="nutrition-item"><span>Carbohydrates</span><strong data-nutrition="carbohydrates">—</strong></div>
        <div class="nutrition-item"><span>Sugars</span><strong data-nutrition="sugars">—</strong></div>
        <div class="nutrition-item"><span>Protein</span><strong data-nutrition="protein">—</strong></div>
      </div>
      <div class="universal-ingredients">
        <span>INGREDIENTS</span>
        <p data-nutrition="ingredients">—</p>
      </div>`;

    const flavourGroup = details.querySelector('.modal-option-group');
    if (flavourGroup) flavourGroup.insertAdjacentElement('afterend', section);
    else details.appendChild(section);
    return section;
  }

  function fillNutrition(modal) {
    if (!modal) return;
    const name = (modal.querySelector('#modalProductName')?.textContent || '').trim();
    const data = resolveNutrition(name);
    const section = ensureNutrition(modal);
    if (!section || !data) return;

    Object.entries(data).forEach(([key, value]) => {
      const el = section.querySelector(`[data-nutrition="${key}"]`);
      if (el) el.textContent = value || '—';
    });
  }

  /* =========================================================
     SHARED PRODUCT NUMBER MOTION
     One controller for every product window on the site.
     • Quantity rolls as two fixed layers.
     • Price rolls digit-by-digit.
     • Rapid taps collapse to the latest committed target first,
       so digits never stack, concatenate, or overlap.
     • The ₹ symbol is always fixed beside the amount.
  ========================================================= */
  function bindUniversalQuantity(modal) {
    if (!modal || modal.dataset.universalMotionBound === '1') return;

    const quantityElement = modal.querySelector('#quantity');
    const increaseButton = modal.querySelector('#increaseQuantity');
    const decreaseButton = modal.querySelector('#decreaseQuantity');
    const priceElement = modal.querySelector('#modalProductPrice');
    if (!quantityElement || !increaseButton || !decreaseButton || !priceElement) return;

    modal.dataset.universalMotionBound = '1';

    const clampQuantity = value => Math.max(1, Math.min(99, Number(value) || 1));
    const clampPrice = value => Math.max(0, Number(value) || 0);

    const readNumber = (el, fallback = 0) => {
      const raw = el?.dataset?.value ?? (el?.textContent || '');
      const parsed = Number(String(raw).replace(/[^0-9.]/g, ''));
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    const state = {
      quantity: clampQuantity(readNumber(quantityElement, 1)),
      unitPrice: 0,
      currentPrice: clampPrice(readNumber(priceElement, 0)),

      // These are the latest fully requested targets, not whatever frame
      // happens to be visible. Rapid clicks therefore always have a stable base.
      displayedQuantity: clampQuantity(readNumber(quantityElement, 1)),
      displayedPrice: clampPrice(readNumber(priceElement, 0)),

      productKey: '',

      qtyRevision: 0,
      qtyRaf: null,
      qtyTimer: null,
      lastQtyChangeTime: 0,

      priceRevision: 0,
      priceRafs: [],
      priceTimers: [],
      lastPriceChangeTime: 0
    };

    modal.__liwikaUniversalState = state;

    function stopQuantityAnimation() {
      state.qtyRevision++;
      if (state.qtyRaf !== null) {
        cancelAnimationFrame(state.qtyRaf);
        state.qtyRaf = null;
      }
      if (state.qtyTimer !== null) {
        clearTimeout(state.qtyTimer);
        state.qtyTimer = null;
      }
    }

    function stopPriceAnimation() {
      state.priceRevision++;
      state.priceRafs.forEach(raf => cancelAnimationFrame(raf));
      state.priceRafs = [];
      state.priceTimers.forEach(timer => clearTimeout(timer));
      state.priceTimers = [];
    }

    function quantityNodes() {
      let current = quantityElement.querySelector('.qty-digit.current');
      let incoming = quantityElement.querySelector('.qty-digit.incoming');

      if (!current || !incoming) {
        quantityElement.innerHTML =
          '<span class="qty-digit current"></span>' +
          '<span class="qty-digit incoming" aria-hidden="true"></span>';
        current = quantityElement.querySelector('.qty-digit.current');
        incoming = quantityElement.querySelector('.qty-digit.incoming');
      }

      return { current, incoming };
    }

    function renderQuantityStatic(value) {
      stopQuantityAnimation();

      const val = clampQuantity(value);
      const { current, incoming } = quantityNodes();

      quantityElement.dataset.value = String(val);
      quantityElement.setAttribute('aria-live', 'polite');
      quantityElement.setAttribute('aria-label', `Quantity ${val}`);

      current.textContent = String(val);
      incoming.textContent = '';

      current.style.transition = 'none';
      incoming.style.transition = 'none';

      current.style.transform = 'translate3d(0,0,0)';
      current.style.opacity = '1';

      incoming.style.transform = 'translate3d(0,100%,0)';
      incoming.style.opacity = '0';

      state.displayedQuantity = val;
      state.quantity = val;
    }

    function animateQuantity(value, direction = 'up') {
      const val = clampQuantity(value);
      const from = clampQuantity(state.displayedQuantity);

      if (from === val) {
        renderQuantityStatic(val);
        return;
      }

      stopQuantityAnimation();

      const revision = state.qtyRevision;
      const { current, incoming } = quantityNodes();

      const now = performance.now();
      const isRapid = (now - state.lastQtyChangeTime) < 220;
      state.lastQtyChangeTime = now;

      const travelOut = direction === 'up' ? '-100%' : '100%';
      const travelIn = direction === 'up' ? '100%' : '-100%';

      // Commit the newest requested target immediately. The DOM still animates,
      // but the logical starting point for the next tap is never a half-state.
      state.displayedQuantity = val;
      state.quantity = val;
      quantityElement.dataset.value = String(val);
      quantityElement.setAttribute('aria-label', `Quantity ${val}`);

      current.textContent = String(from);
      incoming.textContent = String(val);

      current.style.transition = 'none';
      incoming.style.transition = 'none';

      current.style.transform = 'translate3d(0,0,0)';
      current.style.opacity = '1';

      incoming.style.transform = `translate3d(0,${travelIn},0)`;
      incoming.style.opacity = '0';

      void incoming.offsetHeight;

      const duration = isRapid ? 160 : 280;
      const curve =
        `transform ${duration}ms cubic-bezier(.16,1,.3,1), ` +
        `opacity ${duration}ms ease`;

      current.style.transition = curve;
      incoming.style.transition = curve;

      state.qtyRaf = requestAnimationFrame(() => {
        if (state.qtyRevision !== revision || !quantityElement.isConnected) return;

        current.style.transform = `translate3d(0,${travelOut},0)`;
        current.style.opacity = '0';

        incoming.style.transform = 'translate3d(0,0,0)';
        incoming.style.opacity = '1';
      });

      state.qtyTimer = setTimeout(() => {
        if (state.qtyRevision !== revision || !quantityElement.isConnected) return;

        current.textContent = String(val);
        current.style.transition = 'none';
        current.style.transform = 'translate3d(0,0,0)';
        current.style.opacity = '1';

        incoming.textContent = '';
        incoming.style.transition = 'none';
        incoming.style.transform = `translate3d(0,${travelIn},0)`;
        incoming.style.opacity = '0';

        state.qtyTimer = null;
        state.qtyRaf = null;
      }, duration + 24);
    }

    function ensurePriceStructure() {
      let currency = priceElement.querySelector('.price-currency');
      let digitsContainer = priceElement.querySelector('.price-digits');

      if (!currency || !digitsContainer) {
        priceElement.innerHTML =
          '<span class="price-currency" aria-hidden="true">₹</span>' +
          '<span class="price-digits"></span>';
        currency = priceElement.querySelector('.price-currency');
        digitsContainer = priceElement.querySelector('.price-digits');
      }

      priceElement.setAttribute('role', 'status');
      return { currency, digitsContainer };
    }

    function buildPriceSlots(digitsContainer, valueString, seedString, direction) {
      let html = '';

      for (let i = 0; i < valueString.length; i++) {
        const placeFromRight = valueString.length - 1 - i;
        const seedIndex = seedString.length - 1 - placeFromRight;

        let existingVal;
        if (seedIndex >= 0) {
          existingVal = seedString[seedIndex];
        } else {
          existingVal = direction === 'up' ? '0' : valueString[i];
        }

        html +=
          `<span class="digit-slot" data-digit-index="${i}">` +
          `<span class="digit-val current">${existingVal}</span>` +
          '</span>';
      }

      digitsContainer.innerHTML = html;
      return Array.from(digitsContainer.querySelectorAll('.digit-slot'));
    }

    function renderPriceStatic(value) {
      stopPriceAnimation();

      const val = clampPrice(value);
      const newStr = String(Math.round(val));
      const { digitsContainer } = ensurePriceStructure();

      priceElement.dataset.value = String(val);
      priceElement.setAttribute('aria-label', `Price ₹${Math.round(val)}`);

      let slotsHtml = '';
      for (let i = 0; i < newStr.length; i++) {
        slotsHtml +=
          `<span class="digit-slot" data-digit-index="${i}">` +
          `<span class="digit-val current">${newStr[i]}</span>` +
          '</span>';
      }

      digitsContainer.innerHTML = slotsHtml;
      state.displayedPrice = val;
      state.currentPrice = val;
    }

    function animatePrice(value, direction = 'up') {
      const val = clampPrice(value);
      const from = clampPrice(state.displayedPrice);

      if (Math.round(from) === Math.round(val)) {
        renderPriceStatic(val);
        return;
      }

      stopPriceAnimation();

      const revision = state.priceRevision;
      const { digitsContainer } = ensurePriceStructure();

      const now = performance.now();
      const isRapid = (now - state.lastPriceChangeTime) < 220;
      state.lastPriceChangeTime = now;

      const oldStr = String(Math.round(from));
      const newStr = String(Math.round(val));

      // Always collapse the old DOM to the last committed target before starting
      // a new roll. This is the critical anti-overlap rule for rapid clicking.
      let slots = Array.from(digitsContainer.querySelectorAll('.digit-slot'));

      if (slots.length !== oldStr.length || slots.length !== newStr.length) {
        slots = buildPriceSlots(digitsContainer, newStr, oldStr, direction);
      } else {
        slots.forEach((slot, index) => {
          slot.innerHTML =
            `<span class="digit-val current">${oldStr[index]}</span>`;
        });
      }

      slots = Array.from(digitsContainer.querySelectorAll('.digit-slot'));

      const currentSlotsStr = slots.map(slot => {
        const current = slot.querySelector('.digit-val.current') || slot.querySelector('.digit-val');
        return current ? current.textContent : '';
      }).join('');

      let maxDelay = 0;
      let changedCount = 0;

      for (let place = 0; place < newStr.length; place++) {
        const slotIndex = newStr.length - 1 - place;
        const slot = slots[slotIndex];
        if (!slot) continue;

        const newDigitChar = newStr[slotIndex];
        const oldDigitChar = currentSlotsStr[slotIndex] || '';

        if (oldDigitChar === newDigitChar) continue;

        const delay = changedCount * (isRapid ? 0 : 35);
        changedCount++;
        if (delay > maxDelay) maxDelay = delay;

        const currentDigit =
          slot.querySelector('.digit-val.current') ||
          slot.querySelector('.digit-val');

        const incomingDigit = document.createElement('span');
        incomingDigit.className = 'digit-val incoming';
        incomingDigit.textContent = newDigitChar;

        incomingDigit.style.transform =
          direction === 'up' ? 'translateY(100%)' : 'translateY(-100%)';
        incomingDigit.style.opacity = '0';

        slot.appendChild(incomingDigit);

        void incomingDigit.offsetHeight;

        const duration = isRapid ? 160 : 280;
        const curve =
          `transform ${duration}ms cubic-bezier(.16,1,.3,1) ${delay}ms, ` +
          `opacity ${duration}ms ease ${delay}ms`;

        incomingDigit.style.transition = curve;
        if (currentDigit) currentDigit.style.transition = curve;

        const raf = requestAnimationFrame(() => {
          if (state.priceRevision !== revision || !priceElement.isConnected) return;

          incomingDigit.style.transform = 'translateY(0)';
          incomingDigit.style.opacity = '1';

          if (currentDigit) {
            currentDigit.style.transform =
              direction === 'up' ? 'translateY(-100%)' : 'translateY(100%)';
            currentDigit.style.opacity = '0';
          }
        });

        state.priceRafs.push(raf);
      }

      // Update the logical target immediately. The next rapid click starts here,
      // never from whatever frame is currently visible.
      state.displayedPrice = val;
      state.currentPrice = val;
      priceElement.dataset.value = String(val);
      priceElement.setAttribute('aria-label', `Price ₹${Math.round(val)}`);

      const cleanup = setTimeout(() => {
        if (state.priceRevision !== revision || !priceElement.isConnected) return;

        let finalHtml = '';
        for (let i = 0; i < newStr.length; i++) {
          finalHtml +=
            `<span class="digit-slot" data-digit-index="${i}">` +
            `<span class="digit-val current">${newStr[i]}</span>` +
            '</span>';
        }

        digitsContainer.innerHTML = finalHtml;
        state.priceRafs = [];
        state.priceTimers = [];
      }, maxDelay + (isRapid ? 184 : 304));

      state.priceTimers.push(cleanup);
    }

    function syncForCurrentProduct(force = false) {
      const productKey =
        (modal.querySelector('#modalProductName')?.textContent || '').trim();

      const displayedQty =
        clampQuantity(readNumber(quantityElement, state.quantity || 1));

      const displayedPrice =
        clampPrice(readNumber(priceElement, state.currentPrice || 0));

      let nextUnit =
        displayedQty > 0 ? displayedPrice / displayedQty : displayedPrice;

      if (!Number.isFinite(nextUnit) || nextUnit <= 0) {
        nextUnit = state.unitPrice;
      }

      if (
        force ||
        productKey !== state.productKey ||
        Math.abs(nextUnit - state.unitPrice) > 0.01
      ) {
        stopQuantityAnimation();
        stopPriceAnimation();

        state.productKey = productKey;
        state.quantity = displayedQty;
        state.unitPrice = nextUnit || displayedPrice || 0;
        state.currentPrice = state.unitPrice * state.quantity;

        renderQuantityStatic(state.quantity);
        renderPriceStatic(state.currentPrice);
      }
    }

    syncForCurrentProduct(true);

    const addButton = modal.querySelector('#modalAddToCart');
    if (addButton) {
      addButton.addEventListener('click', event => {
        if (!modal.classList.contains('active')) return;

        event.preventDefault();
        event.stopImmediatePropagation();

        const name =
          (modal.querySelector('#modalProductName')?.textContent || '').trim();
        const selected =
          modal.querySelector('.flavour-button.selected, #flavourOptions button.selected');
        const image =
          modal.querySelector('#modalProductImage')?.getAttribute('src') || '';

        if (!name ||
            !window.LiwikaCart ||
            typeof window.LiwikaCart.addItem !== 'function') {
          return;
        }

        const item = {
          id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          name,
          flavour: selected ? selected.textContent.trim() : 'Classic',
          quantity: state.quantity,
          price: state.unitPrice,
          image,
          occasion:
            window.occasionTitle ||
            (document.querySelector('.occasion-label')?.textContent || '').trim()
        };

        window.LiwikaCart.addItem(item);
        if (typeof window.LiwikaShowCartToast === 'function') {
          window.LiwikaShowCartToast(item);
        }

        const originalText = addButton.textContent;
        addButton.textContent = '✓ ADDED!';
        addButton.classList.add('is-added');

        setTimeout(() => {
          addButton.textContent = originalText || 'ADD TO CART';
          addButton.classList.remove('is-added');
          modal.querySelector('#closeModal')?.click();
        }, 600);
      }, true);
    }

    // Capture phase is intentional: page-specific legacy controllers are still
    // present, but this shared controller owns quantity/price motion everywhere.
    increaseButton.addEventListener('click', event => {
      if (!modal.classList.contains('active')) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      const nextQuantity = Math.min(99, state.quantity + 1);
      state.quantity = nextQuantity;
      state.currentPrice = state.unitPrice * nextQuantity;

      animateQuantity(nextQuantity, 'up');
      animatePrice(state.currentPrice, 'up');

      requestAnimationFrame(() => event.target?.blur?.());
    }, true);

    decreaseButton.addEventListener('click', event => {
      if (!modal.classList.contains('active')) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      if (state.quantity <= 1) {
        requestAnimationFrame(() => event.target?.blur?.());
        return;
      }

      const nextQuantity = Math.max(1, state.quantity - 1);
      state.quantity = nextQuantity;
      state.currentPrice = state.unitPrice * nextQuantity;

      animateQuantity(nextQuantity, 'down');
      animatePrice(state.currentPrice, 'down');

      requestAnimationFrame(() => event.target?.blur?.());
    }, true);

    state.syncForOpen = () => syncForCurrentProduct(true);
  }

  function addCornerNames() {
    document.querySelectorAll('.product-card').forEach(card => {
      const title = card.querySelector('h3');
      if (!title || card.querySelector('.card-corner-name')) return;
      const label = document.createElement('span');
      label.className = 'card-corner-name';
      label.textContent = title.textContent.trim();
      card.appendChild(label);
    });
  }

  function init() {
    document.querySelectorAll('.product-modal').forEach(modal => {
      ensureNutrition(modal);
      bindUniversalQuantity(modal);
      if (modal.classList.contains('active')) fillNutrition(modal);
    });
    relayModalState(!!document.querySelector('.product-modal.active'));
    addCornerNames();
  }

  function relayModalState(open) {
    if (window.parent === window) return;
    try {
      window.parent.postMessage({ type: 'LIWIKA_MODAL_STATE', open: !!open }, window.location.origin);
    } catch (e) {}
  }

  // React only when the modal element itself gains/loses .active.
  // Class changes on quantity buttons (including the mobile press state) must
  // never reset an in-flight number animation.
  const observer = new MutationObserver(mutations => {
    const modalClassChanged = mutations.some(record =>
      record.type === 'attributes' &&
      record.attributeName === 'class' &&
      record.target?.classList?.contains('product-modal')
    );

    if (!modalClassChanged) return;

    document.querySelectorAll('.product-modal').forEach(modal => {
      ensureNutrition(modal);
      bindUniversalQuantity(modal);
      const open = modal.classList.contains('active');

      if (open) {
        // Let the page controller finish writing product name/price before
        // taking the snapshot used to derive the unit price.
        requestAnimationFrame(() => {
          if (!modal.isConnected || !modal.classList.contains('active')) return;
          modal.__liwikaUniversalState?.syncForOpen?.();
          fillNutrition(modal);
        });
      }

      relayModalState(open);
    });
  });

  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['class'],
    subtree: true
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }


  /* =========================================================
     MOBILE QUANTITY BUTTON FEEDBACK
     Uses pointer events instead of relying on :active/:hover,
     because mobile browsers may paint those states inconsistently.
  ========================================================= */
  const touchPressTimers = new WeakMap();

  function getQuantityButton(target) {
    return target?.closest?.('.product-modal .qty-btn') || null;
  }

  function pressQuantityButton(button) {
    if (!button) return;

    const oldTimer = touchPressTimers.get(button);
    if (oldTimer) clearTimeout(oldTimer);

    button.classList.remove('liwika-touch-pressed');
    void button.offsetWidth;
    button.classList.add('liwika-touch-pressed');

    const timer = setTimeout(() => {
      button.classList.remove('liwika-touch-pressed');
      touchPressTimers.delete(button);
    }, 180);

    touchPressTimers.set(button, timer);
  }

  function releaseQuantityButton(event) {
    const button = getQuantityButton(event?.target);
    if (!button) return;

    const oldTimer = touchPressTimers.get(button);
    if (oldTimer) clearTimeout(oldTimer);

    const timer = setTimeout(() => {
      button.classList.remove('liwika-touch-pressed');
      button.blur?.();
      touchPressTimers.delete(button);
    }, 90);

    touchPressTimers.set(button, timer);
  }

  document.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    const button = getQuantityButton(event.target);
    if (button) pressQuantityButton(button);
  }, true);

  document.addEventListener('pointerup', releaseQuantityButton, true);
  document.addEventListener('pointercancel', releaseQuantityButton, true);
  document.addEventListener('touchend', releaseQuantityButton, {
    capture: true,
    passive: true
  });

  // Free-delivery HUD remains behind the modal; when visible and clicked,
  // it navigates to the correct cart for the current page.
  document.addEventListener('click', event => {
    const hud = event.target.closest('#liwika-free-delivery');
    if (!hud || document.querySelector('.product-modal.active')) return;
    const path = window.location.pathname;
    const cart = path.includes('/occassions/') ? '../cart.html' : (path.includes('/seasonals/') ? 'cart.html' : 'seasonals/cart.html');
    window.location.href = cart;
  });
})(window, document);

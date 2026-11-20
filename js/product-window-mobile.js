/* Mobile product window helpers: swipe-to-close, nutrition accordion, BUY NOW button. Safe no-op on pages without the modal. */
(function () {
  function init() {
    var modal = document.getElementById('productModal');
    if (!modal || modal.dataset.pwReady) return;
    modal.dataset.pwReady = '1';
    var content = modal.querySelector('.modal-content');
    var body = modal.querySelector('.modal-body');
    var add = document.getElementById('modalAddToCart');
    var bar = modal.querySelector('.modal-footer-action');
    var close = document.getElementById('closeModal');
    if (!content) return;

    var handle = document.createElement('span'); handle.className = 'pw-handle'; handle.setAttribute('aria-hidden', 'true'); content.prepend(handle);

    // BUY NOW: add the selected item, then go straight to the cart/checkout path
    if (bar && add) {
      var buy = document.createElement('button');
      buy.type = 'button'; buy.className = 'pw-buy'; buy.textContent = 'BUY NOW';
      add.insertAdjacentElement('afterend', buy);
      buy.addEventListener('click', function () {
        add.click();
        var p = location.pathname, dest;
        if (p.indexOf('/occasions/') > -1) dest = '../cart.html';
        else if (p.indexOf('/seasonals/') > -1) dest = 'cart.html';
        else dest = 'seasonals/cart.html';
        var url = new URL(dest, location.href).href;
        setTimeout(function () { if (typeof window.__liwiNavigate === 'function') window.__liwiNavigate(url, true); else location.href = url; }, 380);
      });
    }

    // Nutrition accordion
    modal.addEventListener('click', function (e) {
      var h = e.target.closest && e.target.closest('.universal-info-heading');
      if (h) h.parentElement.classList.toggle('pw-open');
    });

    // Swipe down to close (only when the sheet is scrolled to the top)
    var startY = 0, dy = 0, active = false;
    content.addEventListener('touchstart', function (e) {
      if (!window.matchMedia('(max-width:820px)').matches) return;
      if (body && body.scrollTop > 2) return;
      if (e.target.closest('.flavour-options,.liwika-gallery-thumbnails')) return;
      startY = e.touches[0].clientY; dy = 0; active = true;
    }, { passive: true });
    content.addEventListener('touchmove', function (e) {
      if (!active) return;
      dy = e.touches[0].clientY - startY;
      if (dy > 0) { content.classList.add('pw-dragging'); content.style.setProperty('transform', 'translate3d(0,' + dy + 'px,0)', 'important'); }
    }, { passive: true });
    function end() {
      if (!active) return; active = false;
      content.classList.remove('pw-dragging'); content.style.removeProperty('transform');
      if (dy > 110 && close) close.click();
    }
    content.addEventListener('touchend', end); content.addEventListener('touchcancel', end);

    // Collapse the nutrition panel whenever a new product opens
    new MutationObserver(function () { if (!modal.classList.contains('active')) { var n = modal.querySelector('.universal-nutrition-section'); if (n) n.classList.remove('pw-open'); if (body) body.scrollTop = 0; } })
      .observe(modal, { attributes: true, attributeFilter: ['class'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

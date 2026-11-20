/* LIWI-KA page loader — injects instantly, removes itself when the page has loaded. */
(function () {
  if (window.__lkLoader) return; window.__lkLoader = true;
  var doc = document, root = doc.documentElement;
  var src = (doc.currentScript && doc.currentScript.src) || '';
  var base = src.replace(/js\/[^\/]*$/, '');  // site root (this file lives in /js)
  var started = Date.now(), MIN = 900, MAX = 6500, gone = false;
  root.classList.add('lk-loading');
  var el = doc.createElement('div');
  el.id = 'lk-loader'; el.setAttribute('role', 'status'); el.setAttribute('aria-label', 'Loading Liwi-Ka');
  el.innerHTML =
    '<div class="lk-glow"></div><div class="lk-stack">' +
    '<div class="lk-emblem">' +
    '<svg class="lk-ring" viewBox="0 0 200 200" aria-hidden="true"><defs><linearGradient id="lkg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1bd"/><stop offset=".5" stop-color="#d9a441"/><stop offset="1" stop-color="#8e631c"/></linearGradient></defs>' +
    '<circle class="r3" cx="100" cy="100" r="92"/><circle class="r2" cx="100" cy="100" r="84"/><circle class="r1" cx="100" cy="100" r="92"/></svg>' +
    '<img class="lk-logo" alt="Liwi-Ka" src="' + base + 'images/liwi.png" decoding="async">' +
    '<span class="lk-logo-shine"></span>' +
    '<span class="lk-spark">✦</span><span class="lk-spark">✧</span><span class="lk-spark">✦</span><span class="lk-spark">✧</span></div>' +
    '<div class="lk-bar" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>' +
    '<div class="lk-word"><div class="lk-name">LIWI-KA</div><div class="lk-sub">PREPARING YOUR CHOCOLATE</div></div>' +
    '<div class="lk-line" aria-hidden="true"></div></div>';
  function mount() { if (!el.parentNode) (doc.body || root).appendChild(el); }
  if (doc.body) mount(); else { root.appendChild(el); }
  function hide() {
    if (gone) return; gone = true;
    var wait = Math.max(0, MIN - (Date.now() - started));
    setTimeout(function () {
      el.classList.add('lk-out'); root.classList.remove('lk-loading');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 950);
    }, wait);
  }
  if (doc.readyState === 'complete') hide(); else window.addEventListener('load', hide);
  setTimeout(hide, MAX);                      // never trap the visitor
  window.addEventListener('pageshow', function (e) { if (e.persisted) hide(); });
})();

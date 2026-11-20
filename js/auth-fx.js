/* LIWI-KA — sign-in page effects: aurora, gold dust, pointer parallax. Purely decorative. */
(function () {
  'use strict';
  var body = document.body;
  if (!body || document.querySelector('.lk-aurora')) return;
  var a = document.createElement('div'); a.className = 'lk-aurora'; a.setAttribute('aria-hidden', 'true'); a.innerHTML = '<i></i><i></i><i></i>';
  var d = document.createElement('div'); d.className = 'lk-dust'; d.setAttribute('aria-hidden', 'true');
  var mobile = window.matchMedia && window.matchMedia('(max-width: 820px)').matches;
  var n = mobile ? 10 : 22;
  for (var i = 0; i < n; i++) {
    var s = document.createElement('span');
    s.style.cssText = 'left:' + (Math.random() * 100).toFixed(1) + '%;--s:' + (2 + Math.random() * 4).toFixed(1) + 'px;--d:' + (11 + Math.random() * 12).toFixed(1) + 's;--t:-' + (Math.random() * 20).toFixed(1) + 's;--x:' + ((Math.random() - .5) * 120).toFixed(0) + 'px';
    d.appendChild(s);
  }
  body.insertBefore(d, body.firstChild); body.insertBefore(a, body.firstChild);

  var stage = document.querySelector('.chocolate-stage');
  if (!stage || mobile || !window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  var raf = 0, px = 0, py = 0;
  window.addEventListener('pointermove', function (e) {
    px = (e.clientX / window.innerWidth - .5) * 2; py = (e.clientY / window.innerHeight - .5) * 2;
    if (!raf) raf = requestAnimationFrame(function () { raf = 0; stage.style.setProperty('--px', px.toFixed(3)); stage.style.setProperty('--py', py.toFixed(3)); });
  }, { passive: true });
})();

/* Sign-in box accepts an email or a phone number: swap the little symbol + keyboard to match. */
(function () {
  var input = document.getElementById('phoneNumber'), sym = document.getElementById('identSymbol');
  if (!input || !sym) return;
  function sync() {
    var v = input.value.trim(), phone = /^[+\d]/.test(v);
    sym.textContent = phone ? '+' : '@';
    sym.style.transform = 'scale(1.15)'; setTimeout(function () { sym.style.transform = ''; }, 140);
    input.setAttribute('inputmode', phone ? 'tel' : 'email');
  }
  input.addEventListener('input', sync);
})();

/* LIWI-KA — six-box one-time-code input (accessible, paste-aware, autofill-friendly)
   createOtpField({ mount, length, label, onComplete }) -> controller */
export function createOtpField({ mount, length = 6, label = 'Verification code', onComplete } = {}) {
  const root = document.createElement('div');
  root.className = 'lk-otp';
  root.setAttribute('role', 'group');
  root.setAttribute('aria-label', label);
  const boxes = [];
  for (let i = 0; i < length; i++) {
    const input = document.createElement('input');
    input.type = 'text';
    input.inputMode = 'numeric';
    input.pattern = '[0-9]*';
    input.maxLength = 1;
    input.autocomplete = i === 0 ? 'one-time-code' : 'off';
    input.setAttribute('aria-label', `${label}, digit ${i + 1} of ${length}`);
    input.className = 'lk-otp-box';
    input.spellcheck = false;
    boxes.push(input);
    root.appendChild(input);
  }
  const msg = document.createElement('p');
  msg.className = 'lk-otp-msg';
  msg.setAttribute('role', 'status');
  msg.setAttribute('aria-live', 'polite');
  const wrap = document.createElement('div');
  wrap.className = 'lk-otp-wrap';
  wrap.append(root, msg);
  mount.appendChild(wrap);

  const value = () => boxes.map((b) => b.value).join('');
  const refresh = () => boxes.forEach((b) => b.classList.toggle('filled', b.value !== ''));
  const complete = () => { if (value().length === length && typeof onComplete === 'function') onComplete(value()); };
  const clearState = () => { root.classList.remove('is-error', 'is-success'); };

  boxes.forEach((box, i) => {
    box.addEventListener('input', () => {
      clearState();
      const digits = box.value.replace(/\D/g, '');
      if (digits.length > 1) { fill(digits, i); return; }   // autofill drops the whole code in one box
      box.value = digits;
      refresh();
      if (digits && i < length - 1) boxes[i + 1].focus();
      complete();
    });
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value && i > 0) { boxes[i - 1].value = ''; boxes[i - 1].focus(); refresh(); e.preventDefault(); }
      else if (e.key === 'ArrowLeft' && i > 0) { boxes[i - 1].focus(); e.preventDefault(); }
      else if (e.key === 'ArrowRight' && i < length - 1) { boxes[i + 1].focus(); e.preventDefault(); }
      else if (e.key === 'Enter') { root.dispatchEvent(new CustomEvent('otp-enter', { bubbles: true })); }
    });
    box.addEventListener('focus', () => box.select());
    box.addEventListener('paste', (e) => {
      const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
      if (!text) return;
      e.preventDefault();
      fill(text, i);
    });
  });

  function fill(digits, start = 0) {
    clearState();
    const chars = digits.slice(0, length - start).split('');
    chars.forEach((c, k) => { boxes[start + k].value = c; });
    refresh();
    const next = Math.min(start + chars.length, length - 1);
    boxes[next].focus();
    complete();
  }

  return {
    el: root,
    getValue: value,
    setValue(v) { boxes.forEach((b, i) => { b.value = String(v || '')[i] || ''; }); refresh(); },
    clear() { boxes.forEach((b) => { b.value = ''; }); refresh(); clearState(); msg.textContent = ''; },
    focus() { (boxes.find((b) => !b.value) || boxes[0]).focus(); },
    disable(state) { boxes.forEach((b) => { b.disabled = Boolean(state); }); },
    error(text) {
      msg.textContent = text || '';
      msg.dataset.type = 'error';
      root.classList.remove('is-error'); void root.offsetWidth; root.classList.add('is-error');
    },
    info(text) { msg.textContent = text || ''; msg.dataset.type = 'info'; },
    success(text) { clearState(); root.classList.add('is-success'); msg.textContent = text || ''; msg.dataset.type = 'success'; }
  };
}

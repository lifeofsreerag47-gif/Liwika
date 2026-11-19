/* LIWI-KA — email ownership check (6-digit code emailed by our server).
   mountEmailVerifier(container, { email, heading, sub, onVerified }) */
import { httpsCallable } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-functions.js';
import { functions } from './firebase-config.js';
import { createOtpField } from './otp-input.js';

const sendFn = httpsCallable(functions, 'sendEmailOtp');
const verifyFn = httpsCallable(functions, 'verifyEmailOtp');
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function friendlyError(error, fallback) {
  const code = String(error && error.code || '');
  const msg = String(error && error.message || '');
  if (code.endsWith('/internal') || msg.toLowerCase() === 'internal') return fallback || 'Something went wrong on our side. Please try again.';
  if (code.endsWith('/unauthenticated')) return 'Your session expired. Please sign in again.';
  return msg.replace(/^.*?:\s*/, '') || fallback || 'Something went wrong. Please try again.';
}

export function mountEmailVerifier(container, { email = '', heading = 'Verify your email', sub = 'We email you a 6-digit code. Your delivery OTP and order updates are sent here too.', onVerified } = {}) {
  container.classList.add('lk-verify');
  container.innerHTML = `
    <h3>${esc(heading)}</h3><p class="lk-sub">${esc(sub)}</p>
    <div class="lk-step" data-step="email">
      <label class="lk-label" for="lkEmail">EMAIL ADDRESS</label>
      <input id="lkEmail" type="email" autocomplete="email" inputmode="email" maxlength="254" placeholder="you@example.com" value="${esc(email)}">
      <button type="button" class="lk-btn" data-send><span>SEND VERIFICATION CODE</span></button>
    </div>
    <div class="lk-step" data-step="code" hidden>
      <p class="lk-sub" data-sentto style="margin-bottom:8px"></p>
      <div data-otp></div>
      <button type="button" class="lk-btn" data-verify><span>VERIFY EMAIL</span></button>
      <div class="lk-row"><button type="button" class="lk-link" data-resend disabled>Resend code</button><button type="button" class="lk-link" data-change>Change email</button></div>
    </div>
    <div class="lk-step" data-step="done" hidden></div>
    <p class="lk-status" role="status" aria-live="polite" data-status></p>`;
  const $ = (s) => container.querySelector(s);
  const steps = { email: $('[data-step=email]'), code: $('[data-step=code]'), done: $('[data-step=done]') };
  const input = $('#lkEmail'); const status = $('[data-status]');
  const sendBtn = $('[data-send]'); const verifyBtn = $('[data-verify]'); const resendBtn = $('[data-resend]');
  let currentEmail = ''; let timer = null; let busy = false;
  const show = (name) => { Object.entries(steps).forEach(([k, el]) => { el.hidden = k !== name; }); };
  const say = (t, kind) => { status.textContent = t || ''; status.className = 'lk-status' + (kind ? ' ' + kind : ''); };
  const otp = createOtpField({ mount: $('[data-otp]'), label: 'Email verification code', onComplete: () => verify() });
  container.addEventListener('otp-enter', () => verify());

  function countdown(seconds) {
    clearInterval(timer); let left = seconds; resendBtn.disabled = true;
    const tick = () => { resendBtn.textContent = left > 0 ? `Resend code in ${left}s` : 'Resend code'; if (left <= 0) { resendBtn.disabled = false; clearInterval(timer); } left -= 1; };
    tick(); timer = setInterval(tick, 1000);
  }

  async function send() {
    if (busy) return;
    const value = input.value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) { say('Please enter a valid email address.', 'err'); input.focus(); return; }
    busy = true; sendBtn.disabled = true; resendBtn.disabled = true; say('Sending your code…');
    try {
      const res = (await sendFn({ email: value })).data;
      if (res.alreadyVerified) { done(res.email); return; }
      currentEmail = res.email;
      $('[data-sentto]').innerHTML = `We sent a 6-digit code to <b style="color:#e2bf69">${esc(res.maskedEmail || res.email)}</b>. It expires in ${Math.round((res.expiresInSec || 600) / 60)} minutes.`;
      show('code'); otp.clear(); otp.focus(); say('Check your inbox (and spam folder).');
      countdown(res.resendInSec || 45);
    } catch (error) {
      say(friendlyError(error, 'We could not send the code. Please try again.'), 'err');
      if (!steps.code.hidden) resendBtn.disabled = false;
    } finally { busy = false; sendBtn.disabled = false; }
  }

  async function verify() {
    if (busy) return;
    const code = otp.getValue();
    if (code.length !== 6) { otp.error('Enter all 6 digits.'); return; }
    busy = true; verifyBtn.disabled = true; otp.disable(true); say('Verifying…');
    try {
      const res = (await verifyFn({ code })).data;
      if (res.verified) { otp.success('Verified'); setTimeout(() => done(res.email), 450); return; }
      otp.disable(false); otp.error(res.attemptsLeft > 0 ? `That code isn't right. ${res.attemptsLeft} attempt${res.attemptsLeft === 1 ? '' : 's'} left.` : 'Too many wrong attempts. Please request a new code.');
      otp.setValue(''); otp.focus();
    } catch (error) {
      otp.disable(false); say(friendlyError(error, 'We could not verify that code.'), 'err'); otp.setValue('');
    } finally { busy = false; verifyBtn.disabled = false; }
  }

  function done(verifiedEmail) {
    clearInterval(timer);
    steps.done.innerHTML = `<div class="lk-verified"><span class="tick">✓</span><div><b>Email verified</b><small>${esc(verifiedEmail)}</small></div></div>`;
    show('done'); say('');
    if (typeof onVerified === 'function') onVerified(verifiedEmail);
  }

  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } });
  verifyBtn.addEventListener('click', verify);
  resendBtn.addEventListener('click', send);
  $('[data-change]').addEventListener('click', () => { clearInterval(timer); otp.clear(); show('email'); say(''); input.focus(); });

  return { markVerified: done, focus: () => input.focus() };
}

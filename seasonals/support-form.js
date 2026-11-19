import { auth, functions, persistenceReady } from '../firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { httpsCallable } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-functions.js';
const submitSupportMessage = httpsCallable(functions, 'submitSupportMessage');

const form = document.getElementById('careForm');
const note = document.getElementById('formNote');
if (form && note) {
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const submit = form.querySelector('button[type="submit"]');
    const data = new FormData(form);
    const name = String(data.get('customerName') || '').trim();
    const email = String(data.get('customerEmail') || '').trim().toLowerCase();
    const orderNumber = String(data.get('orderNumber') || '').trim();
    const message = String(data.get('customerMessage') || '').trim();
    if (!name || !email || !message) { note.textContent = 'Please complete your name, email and message.'; return; }
    if (message.length < 10) { note.textContent = 'Please add a little more detail (at least 10 characters).'; return; }
    submit.disabled = true;
    submit.textContent = 'SENDING…';
    try {
      await persistenceReady;
      const user = await new Promise(resolve => {
        const unsubscribe = onAuthStateChanged(auth, current => { unsubscribe(); resolve(current); });
      });
      if (!user) {
        note.textContent = 'Please sign in to send a message. Your details are still here.';
        return;
      }
      await submitSupportMessage({ name, email, orderNumber, message, website: String(data.get('website') || '') });
      note.textContent = 'Thank you. Your message has been sent to the Liwi-Ka team.';
      note.style.color = '#d9a441';
      form.reset();
    } catch (error) {
      console.error('Customer Care message failed:', error);
      note.textContent = error?.code === 'functions/unauthenticated'
        ? 'Please sign in before sending a message.'
        : error?.code === 'functions/invalid-argument' || error?.code === 'functions/resource-exhausted' ? (error.message || 'Please check your details.')
        : 'We could not send your message. Please check your connection and try again.';
      note.style.color = '#e3a09a';
    } finally {
      submit.disabled = false;
      submit.innerHTML = 'SEND MESSAGE <span>↗</span>';
    }
  });
}

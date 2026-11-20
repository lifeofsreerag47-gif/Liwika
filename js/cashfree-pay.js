// Opens Cashfree's hosted UPI checkout for an order that our server already created and priced.
const SDK = 'https://sdk.cashfree.com/js/v3/cashfree.js';
let loading = null;
function loadSdk() {
  if (window.Cashfree) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SDK; s.async = true;
    s.onload = () => (window.Cashfree ? resolve() : reject(new Error('Cashfree failed to initialise')));
    s.onerror = () => { loading = null; reject(new Error('The secure payment window could not be loaded. Please check your connection and try again.')); };
    document.head.appendChild(s);
  });
  return loading;
}

/** Redirects the *top* window (works even inside the mobile app-shell iframe). */
export async function startCashfreeCheckout(paymentSessionId, mode) {
  await loadSdk();
  const cashfree = window.Cashfree({ mode: mode === 'production' ? 'production' : 'sandbox' });
  const result = await cashfree.checkout({ paymentSessionId, redirectTarget: '_top' });
  if (result && result.error) throw new Error(result.error.message || 'Payment could not be started.');
  return result;
}

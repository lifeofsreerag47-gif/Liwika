/* LIWI-KA — business details shown on the legal pages.
   >>> THE OWNER MUST FILL THESE IN BEFORE LAUNCH. <<<
   Indian law (Consumer Protection (E-Commerce) Rules 2020, FSSAI, GST, DPDP Act 2023) requires the
   seller's real identity, a grievance officer and licence numbers to be visible to customers.
   Leave a value as '' to show a bright "[to be added]" marker so nothing is forgotten.            */
window.LIWIKA_LEGAL = {
  businessName:   '',   // legal name of the proprietor / company, e.g. "Liwi-Ka Foods Pvt Ltd"
  address:        '',   // registered address of the business (Visakhapatnam)
  fssaiNumber:    '',   // 14-digit FSSAI licence / registration number
  gstin:          '',   // GSTIN (or write "Not registered" if below the GST threshold)
  contactEmail:   'care@liwika.com',
  contactPhone:   '',   // customer-care phone number
  grievanceName:  '',   // Grievance Officer's name (mandatory for e-commerce + DPDP)
  grievanceEmail: '',   // Grievance Officer's email
  grievancePhone: '',   // optional
  jurisdiction:   'Visakhapatnam, Andhra Pradesh'
};
(function () {
  function esc(v) { return String(v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function val(key) {
    var v = (window.LIWIKA_LEGAL || {})[key];
    return v ? esc(v) : '<span class="legal-todo" style="background:#5a1d17;color:#ffd9d4;padding:1px 7px;border-radius:5px;font-size:.85em">[' + key + ' — to be added]</span>';
  }
  function run() { document.querySelectorAll('[data-legal]').forEach(function (el) { el.innerHTML = val(el.getAttribute('data-legal')); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();

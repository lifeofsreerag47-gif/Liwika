/* LIWI-KA — quick browser-side check for temporary / disposable e-mail providers.
   This only gives instant feedback; the Cloud Function re-checks with a much larger list and a DNS test. */
const BLOCKED = new Set(('mailinator.com guerrillamail.com guerrillamail.net guerrillamail.org guerrillamail.biz guerrillamail.de sharklasers.com grr.la yopmail.com yopmail.fr yopmail.net 10minutemail.com 10minutemail.net 20minutemail.com tempmail.com temp-mail.org temp-mail.io tempmail.net tempmailo.com tempail.com throwawaymail.com trashmail.com trashmail.net trashmail.de dispostable.com getnada.com nada.email maildrop.cc mailnesia.com mintemail.com fakeinbox.com fakemailgenerator.com emailondeck.com getairmail.com mohmal.com moakt.com mailsac.com mail.tm burnermail.io discard.email spambox.us spamgourmet.com mytemp.email tmpmail.org tmpmail.net emailfake.com email-fake.com mailcatch.com inboxkitten.com dropmail.me fexbox.org 1secmail.com 1secmail.net 1secmail.org minutemail.cc linshiyouxiang.net tmail.io tmailor.com gmailnator.com mailpoof.com').split(' '));

export function isDisposableEmail(email) {
  const parts = String(email || '').toLowerCase().split('@').pop().trim().split('.');
  for (let i = 0; i < parts.length - 1; i += 1) if (BLOCKED.has(parts.slice(i).join('.'))) return true;
  return false;
}
export const DISPOSABLE_MESSAGE = 'Temporary or disposable email addresses are not accepted. Please use your personal email (Gmail, Outlook, Yahoo, etc.).';

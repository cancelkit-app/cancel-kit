// Kit Cancel (plan-013): the 3-step "lesson" form. Pure functions on top, browser wiring below.
const PAYMENT_LINK = 'https://buy.stripe.com/test_3cI9AU3pM5QhfKff5xgw000';
const STEPS = 3;

function looksLikeEmail(s) {
  const at = s.indexOf('@');
  const dot = s.lastIndexOf('.');
  return at > 0 && dot > at + 1 && dot < s.length - 1 && !s.includes(' ');
}

// "Other" payment method is free text: keep it short and plain (letters, numbers, basic punctuation only).
function cleanText(s, max) {
  return String(s || '').replace(/[^\p{L}\p{N} .,'&()\/+-]/gu, '').replace(/\s+/g, ' ').trim().replace(/^[+-]+\s*/, '').slice(0, max);
}

function validateStep(step, d) {
  if (step === 1 && (!d.company || d.company.trim().length < 2)) return 'Tell us which company to cancel.';
  if (step === 1 && d.paidVia === 'other' && cleanText(d.paidOther, 60).length < 2) return 'Tell us how you pay for it.';
  if (step === 2) {
    if (!d.name || d.name.trim().split(' ').length < 2) return 'Please enter your full name.';
    if (!looksLikeEmail(d.email || '')) return 'Please enter a valid email.';
    if (d.accountEmail && !looksLikeEmail(d.accountEmail)) return 'The account email does not look right.';
    if (!d.country) return 'Please choose your country.';
    if (d.country === 'United States' && !/^[A-Za-z]{2}$/.test((d.region || '').trim())) return 'Use the 2-letter state code, like CA.';
  }
  if (step === 3) {
    if (!d.agree) return 'Please tick the box to give us permission.';
    if ((d.signature || '').trim().toLowerCase() !== (d.name || '').trim().toLowerCase()) return 'Type your full name exactly as above to sign.';
  }
  return '';
}

// Apple and Google subscriptions can only be cancelled by the person in their phone settings.
function storeOnly(d) {
  return d.paidVia === 'apple' || d.paidVia === 'google';
}

function authorizationText(d) {
  const company = d.company || '[company]';
  return 'I, ' + (d.name || '[your name]') + ', authorize Kit Cancel to request the cancellation of my ' +
    company + ' subscription on my behalf, and to follow up with ' + company +
    ' until the cancellation is confirmed in writing.';
}

function caseId(now, rand) {
  const day = now.toISOString().slice(0, 10).split('-').join('');
  return 'CK-' + day + '-' + Math.floor(rand * 46656).toString(36).toUpperCase().padStart(3, '0');
}

function paymentUrl(link, id, email) {
  return link + '?client_reference_id=' + encodeURIComponent(id) + '&prefilled_email=' + encodeURIComponent(email);
}

function encode(d) {
  return Object.keys(d).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(d[k])).join('&');
}

if (typeof module !== 'undefined') module.exports = { cleanText, looksLikeEmail, validateStep, storeOnly, authorizationText, caseId, paymentUrl, encode, STEPS, PAYMENT_LINK };

if (typeof document !== 'undefined') {
  let step = 1;
  const form = document.getElementById('caseForm');
  const field = n => form.elements[n];
  const $ = id => document.getElementById(id);
  const read = () => ({
    company: field('company').value, cost: field('cost').value, paidVia: field('paidVia').value, paidOther: field('paidVia').value === 'other' ? cleanText(field('paidOther').value, 60) : '', nextBill: field('nextBill').value, name: field('fullName').value,
    email: field('email').value, accountEmail: field('accountEmail').value, country: field('country').value, region: field('region').value,
    agree: field('agree').checked, signature: field('signature').value
  });
  const show = () => {
    document.querySelectorAll('.step').forEach(s => s.classList.toggle('on', Number(s.dataset.step) === step));
    $('bar').style.width = Math.round((step - 1) / STEPS * 100) + '%';
    $('back').style.visibility = step === 1 ? 'hidden' : 'visible';
    $('next').textContent = step === STEPS ? 'Pay $5 and send' : 'Continue';
    $('auth').textContent = authorizationText(read());
    $('err').textContent = '';
  };
  const asked = new URLSearchParams(location.search).get('company');
  if (asked) field('company').value = asked;
  field('paidVia').onchange = () => { $('paidOtherBox').hidden = field('paidVia').value !== 'other'; };
  $('back').onclick = () => { if (step > 1) { step--; show(); } };
  form.onsubmit = async e => {
    e.preventDefault();
    const d = read();
    const problem = validateStep(step, d);
    if (problem) { $('err').textContent = problem; return; }
    if (step === 1 && storeOnly(d)) { window.location.href = 'cancel-app-store.html'; return; }
    if (step < STEPS) { step++; show(); return; }
    $('bar').style.width = '100%';
    const id = caseId(new Date(), Math.random());
    const payload = Object.assign({ 'form-name': 'case', caseId: id, authorization: authorizationText(d) }, d, { agree: 'yes', fullName: d.name });
    delete payload.name;
    try {
      await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: encode(payload) });
    } catch (err) {
      $('err').textContent = 'Could not save your case. Please try again.';
      return;
    }
    window.location.href = paymentUrl(PAYMENT_LINK, id, d.email);
  };
  show();
}

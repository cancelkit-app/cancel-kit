// Cancel Kit (plan-013): the Help button on every page, its quick answers, and the copy-letter button.
// Pure functions on top, browser wiring below.
const FAQ = [
  { words: ['password', 'login', 'log', 'sign'], text: 'Never. We need your name, the email on the account and your signed permission. We never ask for passwords or card numbers.' },
  { words: ['cost', 'price', 'much', 'fee', 'cheap', 'expensive'], text: 'It costs $5 per subscription. One case is one company that we cancel and chase for you.' },
  { words: ['refund', 'back', 'guarantee', 'promise'], text: 'If the company has not confirmed your cancellation in writing within 30 days, you get your $5 back. You can also ask for a refund before we send anything.' },
  { words: ['long', 'time', 'days', 'fast', 'quick', 'when'], text: 'We send your cancellation the same day. If the company does not answer, we follow up on day 3, 7 and 14.' },
  { words: ['country', 'countries', 'outside', 'global', 'uk', 'canada', 'europe', 'australia'], text: 'We help wherever the company accepts cancellations by email or online form. Choose your country on the form so we follow the right rules.' },
  { words: ['gym', 'mail', 'letter', 'certified', 'fitness'], text: 'Gyms that only accept a letter by mail are coming soon. Our free guides include a letter you can send yourself.' },
  { words: ['phone', 'call'], text: 'We do not make phone calls yet, so companies that only cancel by phone are not covered by the $5 service.' },
  { words: ['lawyer', 'legal', 'law', 'sue'], text: 'No, we are not lawyers. We do the sending and the chasing, and we do not give legal advice.' },
  { words: ['status', 'update', 'track', 'case', 'progress'], text: 'We email you at every step. Your case number starts with CK-. Send it to us below for an update.' },
  { words: ['apple', 'google', 'iphone', 'android', 'store'], text: "If you pay through Apple or Google, only you can cancel it, in your phone's subscription settings. Our guides show how." },
  { words: ['data', 'privacy', 'delete', 'safe'], text: 'We keep only what the cancellation needs and delete it 90 days after your case closes.' },
  { words: ['human', 'person', 'contact', 'email', 'support', 'talk'], text: 'Send us a message on the help page and a real person answers by email. It may take up to 30 minutes.' },
  { words: ['again', 'still', 'charged', 'billed', 'charge'], text: 'If you are charged again after we confirm your cancellation, we chase the refund for you at no extra cost.' }
];
const FALLBACK = "I don't know that one yet. Send us a message and a real person will answer.";

function words(q) {
  return (q || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(' ').filter(w => w.length > 1);
}

function answer(q) {
  const got = words(q);
  let best = null;
  let bestScore = 0;
  for (const f of FAQ) {
    const score = f.words.filter(w => got.includes(w)).length;
    if (score > bestScore) { best = f; bestScore = score; }
  }
  return best ? best.text : FALLBACK;
}

if (typeof module !== 'undefined') module.exports = { FAQ, FALLBACK, words, answer };

if (typeof document !== 'undefined') {
  const box = document.createElement('div');
  box.className = 'helper';
  box.innerHTML = '<div class="helper-panel" hidden><p class="helper-title">Hi! What do you need help with?</p>' +
    '<div class="helper-log"></div><form class="helper-ask"><input placeholder="Ask a question" aria-label="Ask a question">' +
    '<button class="btn" type="submit">Ask</button></form>' +
    '<p class="small"><a href="help.html#contact">Message a real person</a><br>It may take up to 30 minutes.</p></div>' +
    '<button class="helper-open btn" type="button" aria-expanded="false">? Help</button>';
  document.body.appendChild(box);
  const fee = document.createElement('p');
  fee.className = 'fee-note';
  fee.textContent = '$5 once. No subscription. No other fees.';
  const foot = document.querySelector('footer');
  if (foot) foot.before(fee); else document.body.appendChild(fee);
  const panel = box.querySelector('.helper-panel');
  const log = box.querySelector('.helper-log');
  const open = box.querySelector('.helper-open');
  const input = box.querySelector('input');
  const say = (who, text) => { const p = document.createElement('p'); p.className = who; p.textContent = text; log.appendChild(p); log.scrollTop = log.scrollHeight; };
  open.onclick = () => {
    panel.hidden = !panel.hidden;
    open.setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) input.focus();
  };
  box.querySelector('.helper-ask').onsubmit = e => {
    e.preventDefault();
    if (!input.value.trim()) return;
    say('me', input.value);
    say('bot', answer(input.value));
    input.value = '';
  };
  document.querySelectorAll('[data-copy]').forEach(b => {
    b.onclick = async () => {
      const text = document.getElementById(b.dataset.copy).innerText;
      try { await navigator.clipboard.writeText(text); b.textContent = 'Copied!'; } catch (err) { b.textContent = 'Select the letter and copy it'; }
    };
  });
  if (location.search.includes('sent=1')) {
    const note = document.getElementById('sent');
    if (note) note.hidden = false;
  }
}

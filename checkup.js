// Kit Cancel (plan-013): the free subscription check-up. Tick what you pay for, see how to leave each one.
// Pure functions on top, browser wiring below.
const SERVICES = [
  { name: 'Planet Fitness', guide: 'cancel-planet-fitness.html' },
  { name: 'LA Fitness', guide: 'cancel-la-fitness.html' },
  { name: 'Adobe', guide: 'cancel-adobe.html' },
  { name: 'Amazon Prime', guide: 'cancel-amazon-prime.html' },
  { name: 'HelloFresh', guide: 'cancel-hellofresh.html' },
  { name: 'SiriusXM', guide: 'cancel-siriusxm.html' },
  { name: 'The New York Times', guide: 'cancel-new-york-times.html' },
  { name: 'Audible', guide: 'cancel-audible.html' },
  { name: 'Peloton', guide: 'cancel-peloton.html' },
  { name: 'Ancestry', guide: 'cancel-ancestry.html' },
  { name: 'Netflix', guide: '' },
  { name: 'Hulu', guide: '' },
  { name: 'Disney+', guide: '' },
  { name: 'Spotify', guide: '' },
  { name: 'YouTube Premium', guide: '' },
  { name: 'Paramount+', guide: '' },
  { name: 'Microsoft 365', guide: '' },
  { name: 'Dropbox', guide: '' },
  { name: 'Duolingo Super', guide: '' },
  { name: 'A dating app', guide: '' },
  { name: 'A meal kit', guide: '' },
  { name: 'A news site', guide: '' }
];

function startLink(name) {
  return 'start.html?company=' + encodeURIComponent(name);
}

function money(n) {
  return '$' + (Math.round(n * 100) / 100).toFixed(2);
}

function results(ticked, costs) {
  const items = SERVICES.filter(s => ticked.includes(s.name)).map(s => ({
    name: s.name,
    guide: s.guide,
    start: startLink(s.name),
    monthly: Number(costs[s.name]) > 0 ? Number(costs[s.name]) : 0
  }));
  const monthly = items.reduce((sum, i) => sum + i.monthly, 0);
  return { items, monthly, yearly: monthly * 12 };
}

if (typeof module !== 'undefined') module.exports = { SERVICES, startLink, money, results };

if (typeof document !== 'undefined') {
  const list = document.getElementById('services');
  const out = document.getElementById('result');
  list.innerHTML = SERVICES.map((s, i) =>
    '<div class="tick"><label class="check"><input type="checkbox" data-name="' + s.name + '"> ' + s.name + '</label>' +
    '<input class="cost" data-cost="' + s.name + '" type="number" min="0" step="0.01" placeholder="$ a month" aria-label="' + s.name + ' cost a month"></div>').join('');
  document.getElementById('check').onclick = () => {
    const ticked = [...list.querySelectorAll('input[type=checkbox]:checked')].map(b => b.dataset.name);
    const costs = {};
    list.querySelectorAll('[data-cost]').forEach(c => { costs[c.dataset.cost] = c.value; });
    const r = results(ticked, costs);
    if (!r.items.length) { out.innerHTML = '<p class="error">Tick at least one subscription.</p>'; return; }
    out.innerHTML = '<div class="card"><h2>You pay for ' + r.items.length + ' subscription' + (r.items.length > 1 ? 's' : '') + '</h2>' +
      (r.monthly ? '<p class="big">' + money(r.monthly) + ' a month, ' + money(r.yearly) + ' a year</p>' : '') +
      '<p>Still using all of them? For any you want gone:</p><ul class="tips">' +
      r.items.map(i => '<li><b>' + i.name + '</b>: ' + (i.guide ? '<a href="' + i.guide + '">free guide</a> or ' : '') +
        '<a href="' + i.start + '">we cancel it for $5</a></li>').join('') + '</ul></div>';
    out.scrollIntoView({ behavior: 'smooth' });
  };
}

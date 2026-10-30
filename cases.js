// Cancel Kit (plan-013): the office's case tracker.
// Every case, its follow-ups on day 3, 7 and 14 after sending, a refund due on day 30 after payment,
// and a check the day after the customer's next bill date that they were not charged again.
//   node cases.js due [cases.json]
const fs = require('fs');

const FOLLOW_UPS = [3, 7, 14];
const REFUND_AFTER = 30;
const DAY = 24 * 60 * 60 * 1000;

function daysSince(iso, now) {
  return Math.floor((now.getTime() - Date.parse(iso)) / DAY);
}

function addCase(cases, c) {
  if (cases.some(x => x.id === c.id)) throw new Error('case ' + c.id + ' already exists');
  const added = Object.assign({}, c, { status: 'open', sentAt: null, followUps: [], confirmedAt: null, refundedAt: null, billCheckedAt: null });
  cases.push(added);
  return added;
}

function dueActions(cases, now) {
  const due = [];
  for (const c of cases) {
    if (c.status === 'confirmed' && c.nextBill && !c.billCheckedAt && now.getTime() >= Date.parse(c.nextBill) + DAY) { due.push({ id: c.id, action: 'check-bill' }); continue }
    if (c.status !== 'open') continue;
    if (daysSince(c.paidAt, now) >= REFUND_AFTER) { due.push({ id: c.id, action: 'refund' }); continue }
    if (!c.sentAt) { due.push({ id: c.id, action: 'send' }); continue }
    const age = daysSince(c.sentAt, now);
    const next = FOLLOW_UPS.find(d => age >= d && !c.followUps.includes(d));
    if (next) due.push({ id: c.id, action: 'follow-up', day: next });
  }
  return due;
}

function markSent(c, now) { c.sentAt = now.toISOString(); }
function markFollowUp(c, day) { if (!c.followUps.includes(day)) c.followUps.push(day); }
function markConfirmed(c, now) { c.status = 'confirmed'; c.confirmedAt = now.toISOString(); }
function markRefunded(c, now) { c.status = 'refunded'; c.refundedAt = now.toISOString(); }
function markBillChecked(c, now) { c.billCheckedAt = now.toISOString(); }

function load(file) {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function save(file, cases) {
  fs.writeFileSync(file, JSON.stringify(cases, null, 2));
}

module.exports = { FOLLOW_UPS, REFUND_AFTER, daysSince, addCase, dueActions, markSent, markFollowUp, markConfirmed, markRefunded, markBillChecked, load, save };

if (require.main === module) {
  const file = process.argv[3] || 'cases.json';
  if (process.argv[2] === 'due') {
    const due = dueActions(load(file), new Date());
    if (!due.length) console.log('nothing due');
    for (const a of due) console.log(a.id + ' ' + a.action + (a.day ? ' (day ' + a.day + ')' : ''));
  } else {
    console.log('usage: node cases.js due [cases.json]');
  }
}

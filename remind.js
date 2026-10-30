// Cancel Kit (plan-013): free-trial reminder. Makes a calendar file that reminds you 2 days before a trial turns paid.
// Pure functions on top, browser wiring below.
const CRLF = String.fromCharCode(13, 10);

function ymd(date) {
  return date.toISOString().slice(0, 10).split('-').join('');
}

function minusDays(date, n) {
  return new Date(date.getTime() - n * 86400000);
}

function ics(service, endDate, now) {
  const remind = minusDays(endDate, 2);
  const next = new Date(remind.getTime() + 86400000);
  const stamp = now.toISOString().split('-').join('').split(':').join('').slice(0, 15) + 'Z';
  const title = 'Cancel ' + service + ' before the free trial ends';
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Cancel Kit//Trial reminder//EN',
    'BEGIN:VEVENT',
    'UID:' + ymd(endDate) + '-' + service.toLowerCase().split(' ').join('-') + '@cancelkit',
    'DTSTAMP:' + stamp,
    'DTSTART;VALUE=DATE:' + ymd(remind),
    'DTEND;VALUE=DATE:' + ymd(next),
    'SUMMARY:' + title,
    'DESCRIPTION:Your ' + service + ' trial ends on ' + endDate.toISOString().slice(0, 10) + '. Cancel today if you do not want to pay.',
    'BEGIN:VALARM', 'TRIGGER:PT9H', 'ACTION:DISPLAY', 'DESCRIPTION:' + title, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR'
  ].join(CRLF) + CRLF;
}

function checkInput(service, dateText, now) {
  if (!service || service.trim().length < 2) return 'Tell us which service you are trying.';
  const end = new Date(dateText + 'T00:00:00Z');
  if (!dateText || isNaN(end.getTime())) return 'Pick the date your free trial ends.';
  if (minusDays(end, 2) < new Date(now.toISOString().slice(0, 10) + 'T00:00:00Z')) return 'That is less than 2 days away. Cancel today to be safe.';
  return '';
}

if (typeof module !== 'undefined') module.exports = { ymd, minusDays, ics, checkInput };

if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id);
  $('remindForm').onsubmit = e => {
    e.preventDefault();
    const service = $('service').value.trim();
    const problem = checkInput(service, $('trialEnd').value, new Date());
    $('err').textContent = problem;
    if (problem) return;
    const file = ics(service, new Date($('trialEnd').value + 'T00:00:00Z'), new Date());
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([file], { type: 'text/calendar' }));
    a.download = 'cancel-' + service.toLowerCase().split(' ').join('-') + '-reminder.ics';
    document.body.appendChild(a);
    a.click();
    a.remove();
    $('done').hidden = false;
  };
}

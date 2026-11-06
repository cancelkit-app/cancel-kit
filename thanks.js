// Kit Cancel: show the case number saved by start.js just before payment.
(function () {
  var id = null;
  try { id = sessionStorage.getItem('kcCase'); } catch (e) {}
  if (!id || !/^CK-[0-9]{8}-[A-Z0-9]{6}$/.test(id)) return;
  document.getElementById('caseNo').textContent = id;
  document.getElementById('caseLine').hidden = false;
})();

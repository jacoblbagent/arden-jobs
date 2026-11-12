/* Fold a listing's requirements away by clicking its row.
   The requirement sub-rows are always open as rendered (scripts/inject-requirements.py);
   this makes the listing row itself the toggle, so a reader can close the
   postings they have read. Plain DOM, no dependencies, injected after render by
   scripts/inject-collapse-requirements.py.

   The state is a set of closed listing ids in localStorage, and the id is the
   number at the end of the posting URL, the same key the requirements and
   favorites use. So a closed row stays closed through a reload, a sort, a
   filter, and a rebuild of the page. */

(function () {
  'use strict';

  var STORE = 'arden-jobs.collapsed';
  var PANEL_FOR = 'data-arden-jobs-req-for';

  // Clicking these inside a row has its own job; the row must not swallow it.
  var INTERACTIVE = 'a, button, input, label, select, textarea';

  var table = document.querySelector('table.astryx-table');
  if (!table) return;

  var body = table.querySelector('tbody');
  var titleHeader = table.querySelector('thead th[data-column-key="title"]');
  if (!body || !titleHeader) return;

  var titleIndex = titleHeader.cellIndex;

  function idOf(row) {
    var cell = row.cells[titleIndex];
    var link = cell && cell.querySelector('a');
    if (!link) return null;
    var found = /-(\d{5,})\/?(?:[?#].*)?$/.exec(link.getAttribute('href') || '');
    return found ? found[1] : null;
  }

  // inject-requirements.py writes the listing id on each sub-row, so the panel
  // is paired by data, not by position: sorting only moves rows, and this
  // pairing survives it.
  var panelFor = {};
  Array.prototype.forEach.call(body.rows, function (row) {
    var id = row.getAttribute(PANEL_FOR);
    if (id) panelFor[id] = row;
  });

  var entries = [];
  var entryOf = new WeakMap();
  Array.prototype.forEach.call(body.rows, function (row) {
    if (row.hasAttribute('data-expansion-panel')) return;
    var id = idOf(row);
    var panel = id ? panelFor[id] : null;
    if (!panel) return;
    var entry = {id: id, row: row, panel: panel};
    entries.push(entry);
    entryOf.set(row, entry);
  });
  if (!entries.length) return;

  // Inline SVG for the same reason the sort indicator is: the webfont is
  // stripped from the render and a glyph would land in a fallback face.
  var CHEVRON =
    '<svg viewBox="0 0 8 5" width="9" height="6" focusable="false">' +
    '<path d="M0 0h8L4 5Z"/>' +
    '</svg>';

  entries.forEach(function (entry) {
    // The chevron is placed by CSS at the right edge of the title cell, not
    // after the link: the link is a stretched inline-flex box, so a sibling
    // span would wrap onto its own line under a two-line title.
    var cell = entry.row.cells[titleIndex];
    var toggle = document.createElement('span');
    toggle.className = 'req-toggle';
    toggle.setAttribute('aria-hidden', 'true');
    toggle.innerHTML = CHEVRON;
    cell.appendChild(toggle);

    // The row is the control: it needs a target for the panel it opens, and a
    // tab stop so the keyboard can reach it without opening the posting.
    if (!entry.panel.id) entry.panel.id = 'req-panel-' + entry.id;
    entry.row.setAttribute('aria-controls', entry.panel.id);
    entry.row.tabIndex = 0;
  });

  function load() {
    try {
      var raw = window.localStorage.getItem(STORE);
      var list = raw ? JSON.parse(raw) : [];
      var saved = {};
      if (Array.isArray(list)) {
        list.forEach(function (id) {
          if (id) saved[String(id)] = true;
        });
      }
      return saved;
    } catch (error) {
      // Private mode or a corrupt value: the rows just open on every visit.
      return {};
    }
  }

  function save() {
    try {
      window.localStorage.setItem(STORE, JSON.stringify(Object.keys(closed)));
    } catch (error) {
      /* nothing else to do */
    }
  }

  var closed = load();

  // Closed is a class, not the hidden attribute: the location and favorites
  // filters already own hidden on these sub-rows, and two owners of one
  // attribute undo each other. The two states simply compose.
  function paint(entry) {
    var isClosed = !!closed[entry.id];
    entry.panel.classList.toggle('req-closed', isClosed);
    entry.row.classList.toggle('req-closed', isClosed);
    entry.row.setAttribute('aria-expanded', isClosed ? 'false' : 'true');
  }

  function toggle(entry) {
    if (closed[entry.id]) delete closed[entry.id];
    else closed[entry.id] = true;
    paint(entry);
    save();
  }

  body.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || !target.closest) return;
    var row = target.closest('tr.astryx-table-row');
    if (!row) return;
    var entry = entryOf.get(row);
    if (!entry) return;
    if (target.closest(INTERACTIVE)) return;
    // Letting go of a text selection inside the row is not a click on the row.
    var selection = window.getSelection && window.getSelection();
    if (selection && String(selection).length) return;
    toggle(entry);
  });

  body.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') return;
    var row = event.target;
    if (!row || !row.classList || !row.classList.contains('astryx-table-row')) return;
    var entry = entryOf.get(row);
    if (!entry) return;
    // Space would scroll the page otherwise.
    event.preventDefault();
    toggle(entry);
  });

  // A second tab on this page should follow along rather than overwrite.
  window.addEventListener('storage', function (event) {
    if (event.key !== null && event.key !== STORE) return;
    closed = load();
    entries.forEach(paint);
  });

  entries.forEach(paint);
})();

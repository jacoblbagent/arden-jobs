/* Favorites for the rendered jobs page.
   The Astryx renderer strips script, so this is injected after render by
   scripts/inject-favorites.py. Plain DOM, no dependencies: each listing gets a
   star button in its title cell, the filter row gets a "Favorites" checkbox,
   and the saved ids live in localStorage under STORE.

   Visibility is owned by the location filter, which already hides rows for the
   town selection. Rather than fight it for the hidden attribute, this script
   publishes the favorite state on window.__ardenJobs and asks that filter to
   re-apply; when the location filter is absent it hides rows itself. */

(function () {
  'use strict';

  var STORE = 'arden-jobs.favorites';

  var table = document.querySelector('table.astryx-table');
  if (!table) return;

  var body = table.querySelector('tbody');
  var titleHeader = table.querySelector('thead th[data-column-key="title"]');
  if (!body || !titleHeader) return;

  var titleIndex = titleHeader.cellIndex;

  // The listing id is the number at the end of the posting URL. It is the same
  // key inject-requirements.py uses, so a saved star survives a rebuild.
  function idOf(row) {
    var link = row.cells[titleIndex] && row.cells[titleIndex].querySelector('a');
    if (!link) return null;
    var found = /-(\d{5,})\/?(?:[?#].*)?$/.exec(link.getAttribute('href') || '');
    return found ? found[1] : null;
  }

  var entries = [];
  Array.prototype.forEach.call(body.rows, function (row) {
    if (row.hasAttribute('data-expansion-panel')) return;
    var id = idOf(row);
    if (id) entries.push({id: id, row: row});
  });
  if (!entries.length) return;

  function load() {
    try {
      var raw = window.localStorage.getItem(STORE);
      var list = raw ? JSON.parse(raw) : [];
      var saved = {};
      if (Array.isArray(list)) {
        list.forEach(function (id) {
          saved[String(id)] = true;
        });
      }
      return saved;
    } catch (error) {
      // Private mode or a corrupt value: favorites just do not persist.
      return {};
    }
  }

  function save(saved) {
    try {
      window.localStorage.setItem(STORE, JSON.stringify(Object.keys(saved)));
    } catch (error) {
      /* nothing else to do */
    }
  }

  var saved = load();

  var STAR =
    '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">' +
    '<path d="M8 1.8l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6z"/>' +
    '</svg>';

  // One star per listing, in front of the role link.
  var buttons = {};
  entries.forEach(function (entry) {
    var cell = entry.row.cells[titleIndex];
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'fav-btn';
    button.innerHTML = STAR;
    button.addEventListener('click', function () {
      if (saved[entry.id]) delete saved[entry.id];
      else saved[entry.id] = true;
      save(saved);
      sync();
    });
    cell.insertBefore(button, cell.firstChild);
    buttons[entry.id] = button;
  });

  // The checkbox rides in the location filter's row when that filter exists,
  // so the two filters read as one bar; otherwise it gets a row of its own
  // with the same flex styling.
  var bar = document.querySelector('.loc-filter');
  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'loc-filter';
    var tableBlock = table.closest('[role="group"]') || table;
    tableBlock.parentNode.insertBefore(bar, tableBlock);
  }

  var label = document.createElement('label');
  label.className = 'fav-filter';

  var box = document.createElement('input');
  box.type = 'checkbox';
  box.id = 'fav-filter-check';
  box.className = 'fav-filter-check';

  var text = document.createElement('span');
  text.className = 'fav-filter-label';
  text.textContent = 'Favorites';

  var count = document.createElement('span');
  count.className = 'fav-filter-num';

  label.appendChild(box);
  label.appendChild(text);
  label.appendChild(count);
  // In the shared bar the count reads last, so the checkbox goes before it.
  bar.insertBefore(label, bar.querySelector('.loc-filter-count'));

  var state = (window.__ardenJobs = window.__ardenJobs || {});
  state.favoritesOnly = false;
  state.isFavorite = function (row) {
    for (var i = 0; i < entries.length; i += 1) {
      if (entries[i].row === row) return !!saved[entries[i].id];
    }
    return false;
  };

  // Fallback for a page without the location filter: hide on our own.
  function applyOwn() {
    entries.forEach(function (entry) {
      entry.row.hidden = state.favoritesOnly && !saved[entry.id];
    });
  }

  function refresh() {
    if (typeof state.refresh === 'function') state.refresh();
    else applyOwn();
  }

  function sync() {
    entries.forEach(function (entry) {
      var button = buttons[entry.id];
      var on = !!saved[entry.id];
      button.setAttribute('aria-pressed', on ? 'true' : 'false');
      button.setAttribute('aria-label', on ? 'Remove from favorites' : 'Save to favorites');
      button.title = on ? 'Remove from favorites' : 'Save to favorites';
    });

    var total = Object.keys(saved).length;
    count.textContent = total ? total : 'none';
    count.setAttribute('data-zero', total ? 'false' : 'true');

    // Nothing saved means the filter can only empty the table, so the box
    // explains itself and stays off until a star is clicked.
    label.setAttribute('data-empty', total ? 'false' : 'true');
    box.disabled = !total;
    if (!total) {
      box.checked = false;
      state.favoritesOnly = false;
    }

    refresh();
  }

  box.addEventListener('change', function () {
    state.favoritesOnly = box.checked;
    refresh();
  });

  // A second tab on this page should follow along rather than overwrite.
  window.addEventListener('storage', function (event) {
    if (event.key !== null && event.key !== STORE) return;
    saved = load();
    sync();
  });

  sync();
})();

/* Sortable table headers for the rendered jobs pages.
   The Astryx renderer strips script, so this file is injected after render by
   scripts/inject-table-sort.py. Plain DOM, no dependencies: the published page
   stays one file with one inline script. */

(function () {
  'use strict';

  // Click cycles ascending, descending, then back to the order the page was
  // rendered in ("newest first"), so the default view is always reachable.
  var STATES = ['ascending', 'descending', 'none'];

  // Text columns compare case- and accent-insensitively with numbers in order
  // ("Site 2" before "Site 10"). Posted compares as a date. Both arguments are
  // cells, not the {cell} entries: sorting a whole row would read the text of
  // every column at once.
  function textValue(cell) {
    return cell ? (cell.textContent || '').trim() : '';
  }

  function compare(key, cellA, cellB) {
    if (key === 'posted') {
      var da = Date.parse(textValue(cellA));
      var db = Date.parse(textValue(cellB));
      return (isNaN(da) ? 0 : da) - (isNaN(db) ? 0 : db);
    }
    return textValue(cellA).localeCompare(textValue(cellB), 'en', {
      numeric: true,
      sensitivity: 'base',
    });
  }

  // The indicator is drawn as SVG rather than a glyph: the page falls back to a
  // system font (Figtree is stripped from the render), where U+2195 is often a
  // tofu box. Two triangles double as the "sortable" affordance when unsorted.
  var INDICATOR =
    '<svg viewBox="0 0 7 10" width="7" height="10" aria-hidden="true" focusable="false">' +
    '<path class="sort-up" d="M3.5 0 6.6 3.4H0.4Z"/>' +
    '<path class="sort-down" d="M3.5 10 0.4 6.6h6.2Z"/>' +
    '</svg>';

  function enhanceHeader(th, onSort) {
    var label = (th.textContent || '').trim();
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'sort-btn';

    var text = document.createElement('span');
    text.textContent = label;

    var indicator = document.createElement('span');
    indicator.className = 'sort-ind';
    indicator.innerHTML = INDICATOR;

    button.appendChild(text);
    button.appendChild(indicator);
    button.addEventListener('click', onSort);
    th.textContent = '';
    th.appendChild(button);
    th.setAttribute('aria-sort', 'none');
    th.classList.add('sortable');
  }

  function initTable(table) {
    var headers = Array.prototype.slice.call(table.querySelectorAll('thead th'));
    var body = table.querySelector('tbody');
    if (!headers.length || !body) return;

    // Rows move in groups: a requirements sub-row (data-expansion-panel) is its
    // listing's own continuation, so it travels with the row above it instead
    // of being sorted as a row of its own.
    function rowGroups() {
      var groups = [];
      Array.prototype.forEach.call(body.rows, function (row) {
        if (row.hasAttribute('data-expansion-panel') && groups.length) {
          groups[groups.length - 1].push(row);
        } else {
          groups.push([row]);
        }
      });
      return groups;
    }

    // Row order as rendered, kept for the unsorted state.
    var original = rowGroups();
    var sort = {key: null, direction: 'none'};

    function groupsWithCells() {
      return rowGroups().map(function (group, index) {
        return {group: group, index: index, cell: group[0].cells[sort.index]};
      });
    }

    function apply(index, direction) {
      sort.index = index;
      sort.direction = direction;

      headers.forEach(function (th) {
        th.setAttribute('aria-sort', th.cellIndex === index ? direction : 'none');
      });

      var entries = groupsWithCells();
      if (direction === 'none') {
        // Restore the order the page was rendered in, not just an equal sort:
        // the ids are already newest first, but replaying the captured rows is
        // what makes the unsorted state exactly the first-paint table.
        original.forEach(function (group) {
          group.forEach(function (row) {
            body.appendChild(row);
          });
        });
        return;
      }

      var sign = direction === 'ascending' ? 1 : -1;
      entries.sort(function (a, b) {
        var result = compare(sort.key, a.cell, b.cell);
        return result !== 0 ? result * sign : a.index - b.index;
      });

      var fragment = document.createDocumentFragment();
      entries.forEach(function (entry) {
        entry.group.forEach(function (row) {
          fragment.appendChild(row);
        });
      });
      body.appendChild(fragment);
    }

    headers.forEach(function (th) {
      var index = th.cellIndex;
      var key = th.getAttribute('data-column-key') || String(index);
      enhanceHeader(th, function () {
        var next =
          sort.index === index
            ? STATES[(STATES.indexOf(sort.direction) + 1) % STATES.length]
            : 'ascending';
        sort.key = key;
        apply(index, next);
      });
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll('table.astryx-table'), initTable);
})();

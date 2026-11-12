/* Location filter for the rendered jobs page.
   The Astryx renderer strips script, so this is injected after render by
   scripts/inject-location-filter.py. Plain DOM: build one <select> from the
   Location cells, hide rows whose town does not match, and report the visible
   count. Multi-town listings ("Asheville · Arden") match either town, so the
   per-town counts can add up to more than the page total. */

(function () {
  'use strict';

  // The source data joins several towns with a middot.
  var SEPARATOR = '\u00b7';

  var table = document.querySelector('table.astryx-table');
  if (!table) return;

  var header = table.querySelector('thead th[data-column-key="location"]');
  var body = table.querySelector('tbody');
  if (!header || !body) return;

  var column = header.cellIndex;
  var entries = Array.prototype.slice.call(body.rows).map(function (row) {
    var text = (row.cells[column].textContent || '').trim();
    var towns = text
      .split(SEPARATOR)
      .map(function (town) {
        return town.trim();
      })
      .filter(Boolean);
    return {row: row, towns: towns};
  });

  // Count each town once per listing, not once per label.
  var counts = {};
  entries.forEach(function (entry) {
    entry.towns.forEach(function (town) {
      counts[town] = (counts[town] || 0) + 1;
    });
  });

  var towns = Object.keys(counts).sort(function (a, b) {
    return counts[b] - counts[a] || a.localeCompare(b, 'en', {sensitivity: 'base'});
  });

  var wrapper = document.createElement('div');
  wrapper.className = 'loc-filter';

  var label = document.createElement('label');
  label.className = 'loc-filter-label';
  label.htmlFor = 'loc-filter-select';
  label.textContent = 'Location';

  var field = document.createElement('div');
  field.className = 'loc-filter-field';

  var select = document.createElement('select');
  select.id = 'loc-filter-select';
  select.className = 'loc-filter-select';

  function addOption(value, text) {
    var option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    select.appendChild(option);
  }

  addOption('', 'All locations (' + entries.length + ')');
  towns.forEach(function (town) {
    addOption(town, town + ' (' + counts[town] + ')');
  });

  var status = document.createElement('span');
  status.className = 'loc-filter-count';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');

  function apply(town) {
    var shown = 0;
    entries.forEach(function (entry) {
      var visible = !town || entry.towns.indexOf(town) !== -1;
      entry.row.hidden = !visible;
      if (visible) shown += 1;
    });
    status.textContent =
      shown === entries.length ? '' : 'Showing ' + shown + ' of ' + entries.length;
  }

  select.addEventListener('change', function () {
    apply(select.value);
  });

  // The chevron is inline SVG for the same reason the sort indicator is: the
  // webfont is stripped, and a native select arrow cannot be sized or coloured.
  var chevron = document.createElement('span');
  chevron.className = 'loc-filter-chevron';
  chevron.setAttribute('aria-hidden', 'true');
  chevron.innerHTML =
    '<svg viewBox="0 0 8 5" width="10" height="6" focusable="false">' +
    '<path d="M0 0h8L4 5Z"/>' +
    '</svg>';

  field.appendChild(select);
  field.appendChild(chevron);

  wrapper.appendChild(label);
  wrapper.appendChild(field);
  wrapper.appendChild(status);

  // Sit directly above the table: the table lives inside a scroll wrapper whose
  // parent is the page's vertical stack, so the injected row picks up the same
  // stack gap as the level filter above it.
  var tableBlock = table.closest('[role="group"]') || table;
  tableBlock.parentNode.insertBefore(wrapper, tableBlock);

  apply('');
})();

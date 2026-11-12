/* Location filter for the rendered jobs page.
   The Astryx renderer strips script, so this is injected after render by
   scripts/inject-location-filter.py. Plain DOM: build a multi-select from the
   Location cells, hide rows whose towns are all unchecked, and report the
   visible count. Multi-town listings ("Asheville · Arden") match any one of
   their towns, so the per-town counts can add up to more than the page total.

   Multi-select, not a single select: the page opens on the towns around the
   office (DEFAULT_TOWNS) and the reader adds or drops towns from the panel.
   Nothing checked, or everything checked, means no filter at all. */

(function () {
  'use strict';

  // The source data joins several towns with a middot.
  var SEPARATOR = '\u00b7';

  // Towns checked on first paint. Unchecked towns stay a click away; a town
  // that no listing names is ignored, so this keeps working as data changes.
  var DEFAULT_TOWNS = ['Arden', 'Fletcher', 'Mills River'];

  var table = document.querySelector('table.astryx-table');
  if (!table) return;

  var header = table.querySelector('thead th[data-column-key="location"]');
  var body = table.querySelector('tbody');
  if (!header || !body) return;

  var column = header.cellIndex;
  // A requirements sub-row (data-expansion-panel) has one full-width cell, so
  // it is not a listing: it is recorded as its listing's panel and follows that
  // row's visibility.
  var entries = [];
  Array.prototype.forEach.call(body.rows, function (row) {
    if (row.hasAttribute('data-expansion-panel')) {
      if (entries.length) entries[entries.length - 1].panels.push(row);
      return;
    }
    var text = (row.cells[column].textContent || '').trim();
    var towns = text
      .split(SEPARATOR)
      .map(function (town) {
        return town.trim();
      })
      .filter(Boolean);
    entries.push({row: row, towns: towns, panels: []});
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
  if (!towns.length) return;

  var selected = {};
  DEFAULT_TOWNS.forEach(function (town) {
    if (counts[town]) selected[town] = true;
  });

  var wrapper = document.createElement('div');
  wrapper.className = 'loc-filter';

  var label = document.createElement('span');
  label.className = 'loc-filter-label';
  label.id = 'loc-filter-label';
  label.textContent = 'Location';

  var field = document.createElement('div');
  field.className = 'loc-filter-field';

  var button = document.createElement('button');
  button.type = 'button';
  button.id = 'loc-filter-button';
  button.className = 'loc-filter-button';
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', 'loc-filter-panel');

  var value = document.createElement('span');
  value.className = 'loc-filter-value';

  // The chevron is inline SVG for the same reason the sort indicator is: the
  // webfont is stripped, and a glyph would land in a fallback face.
  var chevron = document.createElement('span');
  chevron.className = 'loc-filter-chevron';
  chevron.setAttribute('aria-hidden', 'true');
  chevron.innerHTML =
    '<svg viewBox="0 0 8 5" width="10" height="6" focusable="false">' +
    '<path d="M0 0h8L4 5Z"/>' +
    '</svg>';

  button.appendChild(value);
  button.appendChild(chevron);

  var panel = document.createElement('div');
  panel.className = 'loc-filter-panel';
  panel.id = 'loc-filter-panel';
  panel.hidden = true;
  panel.setAttribute('role', 'group');
  panel.setAttribute('aria-labelledby', 'loc-filter-label');

  var options = document.createElement('div');
  options.className = 'loc-filter-options';

  towns.forEach(function (town) {
    var option = document.createElement('label');
    option.className = 'loc-filter-option';

    var box = document.createElement('input');
    box.type = 'checkbox';
    box.className = 'loc-filter-check';
    box.value = town;
    box.checked = !!selected[town];

    var name = document.createElement('span');
    name.className = 'loc-filter-town';
    name.textContent = town;

    var count = document.createElement('span');
    count.className = 'loc-filter-num';
    count.textContent = counts[town];

    option.appendChild(box);
    option.appendChild(name);
    option.appendChild(count);
    options.appendChild(option);
  });

  // The default set is a decision worth keeping reachable; "All" is the way
  // back to the unfiltered page without unchecking fifteen boxes.
  var footer = document.createElement('div');
  footer.className = 'loc-filter-footer';

  var defaultButton = document.createElement('button');
  defaultButton.type = 'button';
  defaultButton.className = 'loc-filter-action';
  defaultButton.textContent = 'Default';

  var allButton = document.createElement('button');
  allButton.type = 'button';
  allButton.className = 'loc-filter-action';
  allButton.textContent = 'All';

  footer.appendChild(defaultButton);
  footer.appendChild(allButton);

  panel.appendChild(options);
  panel.appendChild(footer);

  var status = document.createElement('span');
  status.className = 'loc-filter-count';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');

  field.appendChild(button);
  field.appendChild(panel);

  wrapper.appendChild(label);
  wrapper.appendChild(field);
  wrapper.appendChild(status);

  function chosen() {
    return towns.filter(function (town) {
      return selected[town];
    });
  }

  function summary(names) {
    if (!names.length || names.length === towns.length) return 'All locations';
    if (names.length <= 3) return names.join(', ');
    return names[0] + ', ' + names[1] + ' +' + (names.length - 2) + ' more';
  }

  function apply() {
    var names = chosen();
    // An empty set would hide every row with no control left to explain it, so
    // it reads the same as "everything": no filter.
    var filtering = names.length > 0 && names.length < towns.length;
    var shown = 0;

    entries.forEach(function (entry) {
      var visible =
        !filtering ||
        entry.towns.some(function (town) {
          return selected[town];
        });
      entry.row.hidden = !visible;
      entry.panels.forEach(function (panel) {
        panel.hidden = !visible;
      });
      if (visible) shown += 1;
    });

    var text = summary(names);
    value.textContent = text;
    button.setAttribute('aria-label', 'Location: ' + text);
    status.textContent = filtering ? 'Showing ' + shown + ' of ' + entries.length : '';
  }

  // The panel is fixed to the button, not absolutely placed inside it: the
  // table sits in a scroll wrapper, and an absolute panel would be clipped by
  // it. It also has to survive a short window, so the option list is capped to
  // the room on the roomier side and the panel flips above the button when
  // there is more space up there.
  function place() {
    var rect = button.getBoundingClientRect();
    var width = 232;
    var margin = 6;
    var edge = 8;

    panel.style.left =
      Math.round(Math.max(edge, Math.min(rect.left, window.innerWidth - width - edge))) + 'px';

    var below = window.innerHeight - rect.bottom - margin - edge;
    var above = rect.top - margin - edge;
    var room = below >= above ? below : above;
    options.style.maxHeight = Math.max(96, Math.min(288, room - 56)) + 'px';

    var height = panel.offsetHeight;
    var top = below >= height || below >= above ? rect.bottom + margin : rect.top - margin - height;
    panel.style.top = Math.round(Math.max(edge, top)) + 'px';
  }

  function open() {
    panel.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    place();
    var checked = panel.querySelector('.loc-filter-check:checked');
    (checked || panel.querySelector('.loc-filter-check')).focus();
  }

  function close(returnFocus) {
    if (panel.hidden) return;
    panel.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    if (returnFocus) button.focus();
  }

  button.addEventListener('click', function () {
    if (panel.hidden) open();
    else close(true);
  });

  panel.addEventListener('change', function (event) {
    var box = event.target;
    if (!box.classList.contains('loc-filter-check')) return;
    selected[box.value] = box.checked;
    apply();
  });

  defaultButton.addEventListener('click', function () {
    towns.forEach(function (town) {
      var on = !!counts[town] && DEFAULT_TOWNS.indexOf(town) !== -1;
      selected[town] = on;
    });
    syncBoxes();
    apply();
    close(true);
  });

  allButton.addEventListener('click', function () {
    towns.forEach(function (town) {
      selected[town] = true;
    });
    syncBoxes();
    apply();
    close(true);
  });

  function syncBoxes() {
    Array.prototype.forEach.call(panel.querySelectorAll('.loc-filter-check'), function (box) {
      box.checked = !!selected[box.value];
    });
  }

  panel.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      close(true);
    }
  });

  document.addEventListener('pointerdown', function (event) {
    if (panel.hidden) return;
    if (panel.contains(event.target) || button.contains(event.target)) return;
    close(false);
  });

  window.addEventListener('resize', function () {
    if (!panel.hidden) place();
  });
  window.addEventListener(
    'scroll',
    function () {
      if (!panel.hidden) place();
    },
    {passive: true}
  );

  // Sit directly above the table: the table lives inside a scroll wrapper whose
  // parent is the page's vertical stack, so the injected row picks up the same
  // stack gap as the heading above it.
  var tableBlock = table.closest('[role="group"]') || table;
  tableBlock.parentNode.insertBefore(wrapper, tableBlock);

  apply();
})();

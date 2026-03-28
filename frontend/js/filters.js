// js/filters.js — Filter panel: cascading logic, active chips, tri-state UI

import {
  sel, data, maps, TRI, nextTriState,
  computeVisibleEvents, getAvailableInCategory,
  getDegreeSemesterModuleIds, saveState,
  TYPE_COLORS, STATUS_COLORS, STATUS_LABELS, TYPE_SHORT,
  WEEKDAY_SHORT,
} from './state.js';
import { fetchDegreeDetail } from './api.js';
import { refreshCalendarEvents } from './calendar.js';

// ===== Render all filter sections =====
export function renderFilters() {
  renderChips();
  renderDegreeDropdown();
  renderSemesterDropdown();
  renderModuleList();
  renderTypeList();
  renderStatusList();
  renderStaffList();
  renderLocationList();
  updateMobileFilterSummary();
}

// ===== Active Selection Chips =====
function renderChips() {
  const area = document.getElementById('chipArea');
  if (!area) return;
  area.innerHTML = '';

  // Pinned events
  for (const eid of sel.pinnedEventIds) {
    const ev = maps.eventById.get(eid);
    if (!ev) continue;
    const chip = createChip('chip-pin', `push_pin`, `${TYPE_SHORT[ev.type] || ''} ${ev.title} ${WEEKDAY_SHORT[ev.weekday] || ''}`.trim(), () => {
      sel.pinnedEventIds.delete(eid);
      onFilterChange();
    });
    area.appendChild(chip);
  }

  // Selected items
  appendTriChips(area, sel.modules, 'chip-sel', 'check', k => maps.moduleById.get(Number(k))?.name || k, sel.modules);
  appendTriChips(area, sel.types, 'chip-sel', 'check', k => TYPE_SHORT[k] || k, sel.types);
  appendTriChips(area, sel.statuses, 'chip-sel', 'check', k => STATUS_LABELS[k] || k, sel.statuses);
  appendTriChips(area, sel.staffs, 'chip-sel', 'person', k => maps.staffById.get(Number(k))?.name || k, sel.staffs);
  appendTriChips(area, sel.locations, 'chip-sel', 'check', k => maps.locationById.get(Number(k))?.name || k, sel.locations);

  // Hidden items
  appendTriChips(area, sel.modules, 'chip-hid', 'close', k => maps.moduleById.get(Number(k))?.name || k, sel.modules, TRI.HIDDEN);
  appendTriChips(area, sel.types, 'chip-hid', 'close', k => TYPE_SHORT[k] || k, sel.types, TRI.HIDDEN);
  appendTriChips(area, sel.statuses, 'chip-hid', 'close', k => STATUS_LABELS[k] || k, sel.statuses, TRI.HIDDEN);
  appendTriChips(area, sel.staffs, 'chip-hid', 'close', k => maps.staffById.get(Number(k))?.name || k, sel.staffs, TRI.HIDDEN);
  appendTriChips(area, sel.locations, 'chip-hid', 'close', k => maps.locationById.get(Number(k))?.name || k, sel.locations, TRI.HIDDEN);

  // Show/hide chip section
  const section = document.getElementById('chipsSection');
  if (section) {
    section.style.display = area.children.length > 0 ? '' : 'none';
  }
}

function appendTriChips(area, triMap, chipClass, icon, labelFn, targetMap, filterState = TRI.SELECTED) {
  for (const [k, v] of Object.entries(triMap)) {
    if (v !== filterState) continue;
    const chip = createChip(chipClass, icon, labelFn(k), () => {
      targetMap[k] = TRI.NEUTRAL;
      onFilterChange();
    });
    area.appendChild(chip);
  }
}

function createChip(cls, iconName, label, onRemove) {
  const chip = document.createElement('span');
  chip.className = `chip ${cls}`;

  const icon = document.createElement('span');
  icon.className = 'material-icons-round';
  icon.textContent = iconName;
  chip.appendChild(icon);

  chip.appendChild(document.createTextNode(` ${label} `));

  const close = document.createElement('i');
  close.className = 'chip-close';
  close.textContent = '×';
  close.addEventListener('click', (e) => {
    e.stopPropagation();
    onRemove();
  });
  chip.appendChild(close);
  return chip;
}

// ===== Degree Dropdown =====
function renderDegreeDropdown() {
  const select = document.getElementById('degreeSelect');
  if (!select) return;

  // Only rebuild options if empty
  if (select.options.length <= 1) {
    select.innerHTML = '<option value="">Alle Studiengänge</option>';
    for (const d of data.degrees) {
      const opt = document.createElement('option');
      opt.value = d.id;
      opt.textContent = d.name;
      select.appendChild(opt);
    }
  }

  select.value = sel.degreeId || '';
}

// ===== Semester Dropdown =====
function renderSemesterDropdown() {
  const select = document.getElementById('semesterSelect');
  if (!select) return;

  const semesters = data.degreeDetail?.semesters || [];
  select.innerHTML = '<option value="">Alle Semester</option>';
  for (const s of semesters) {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = `${s}. Semester`;
    select.appendChild(opt);
  }

  select.value = sel.semester || '';
  select.disabled = !sel.degreeId;
}

// ===== Module List =====
function renderModuleList() {
  const container = document.getElementById('moduleList');
  const weitereContainer = document.getElementById('weitereModuleList');
  if (!container) return;

  const dsModuleIds = getDegreeSemesterModuleIds();
  const available = getAvailableInCategory('modules');

  container.innerHTML = '';
  if (weitereContainer) weitereContainer.innerHTML = '';

  // Determine which modules are "primary" (in degree/semester) vs "weitere"
  const allModules = [...maps.moduleById.values()];
  const primary = [];
  const weitere = [];

  for (const m of allModules) {
    if (dsModuleIds && dsModuleIds.includes(m.id)) {
      primary.push(m);
    } else {
      weitere.push(m);
    }
  }

  // If no degree selected, all modules go to primary
  const listA = dsModuleIds ? primary : allModules;
  const listB = dsModuleIds ? weitere : [];

  for (const m of listA.sort((a, b) => a.name.localeCompare(b.name))) {
    const row = createFilterRow(String(m.id), m.name, sel.modules, available.get(String(m.id)) || 0);
    container.appendChild(row);
  }

  if (weitereContainer) {
    for (const m of listB.sort((a, b) => a.name.localeCompare(b.name))) {
      const row = createFilterRow(String(m.id), m.name, sel.modules, available.get(String(m.id)) || 0, true);
      weitereContainer.appendChild(row);
    }

    // Show/hide weitere section
    const weitereSection = document.getElementById('weitereSection');
    if (weitereSection) {
      weitereSection.style.display = listB.length > 0 ? '' : 'none';
    }
  }
}

// ===== Type List =====
function renderTypeList() {
  const container = document.getElementById('typeList');
  if (!container) return;

  const available = getAvailableInCategory('types');
  container.innerHTML = '';

  const allTypes = Object.keys(TYPE_COLORS);
  for (const t of allTypes) {
    const count = available.get(t) || 0;
    const row = createFilterRow(t, TYPE_SHORT[t] || t, sel.types, count, false, TYPE_COLORS[t]);
    container.appendChild(row);
  }
}

// ===== Status List =====
function renderStatusList() {
  const container = document.getElementById('statusList');
  if (!container) return;

  const available = getAvailableInCategory('statuses');
  container.innerHTML = '';

  const allStatuses = ['ok', 'pok', 'tok', 'alt', 'reserve'];
  for (const s of allStatuses) {
    const count = available.get(s) || 0;
    const row = createFilterRow(s, STATUS_LABELS[s] || s, sel.statuses, count, false, null, STATUS_COLORS[s]);
    container.appendChild(row);
  }
}

// ===== Staff List =====
function renderStaffList() {
  const container = document.getElementById('staffList');
  if (!container) return;

  const available = getAvailableInCategory('staffs');
  container.innerHTML = '';

  const allStaff = [...maps.staffById.values()].sort((a, b) => a.name.localeCompare(b.name));
  for (const s of allStaff) {
    const count = available.get(String(s.id)) || 0;
    const row = createFilterRow(String(s.id), s.name, sel.staffs, count);
    container.appendChild(row);
  }
}

// ===== Location List =====
function renderLocationList() {
  const container = document.getElementById('locationList');
  if (!container) return;

  const available = getAvailableInCategory('locations');
  container.innerHTML = '';

  const allLocs = [...maps.locationById.values()].sort((a, b) => a.name.localeCompare(b.name));
  for (const l of allLocs) {
    const count = available.get(String(l.id)) || 0;
    const row = createFilterRow(String(l.id), l.name, sel.locations, count);
    container.appendChild(row);
  }
}

// ===== Create a filter row with tri-state =====
function createFilterRow(key, label, triMap, count, isWeitere = false, typeColor = null, statusColor = null) {
  const state = triMap[key] || TRI.NEUTRAL;
  const isDimmed = count === 0 && state === TRI.NEUTRAL;

  const row = document.createElement('div');
  row.className = `frow${isDimmed ? ' dimmed' : ''}${isWeitere ? ' weitere-italic' : ''}`;
  row.setAttribute('data-s', state);
  row.setAttribute('data-key', key);

  // Tri-state toggle
  const tri = document.createElement('span');
  tri.className = `tri${isDimmed ? ' dimmed' : ''}`;
  tri.setAttribute('data-s', state);
  row.appendChild(tri);

  // Type color dot
  if (typeColor) {
    const dot = document.createElement('span');
    dot.className = 'type-dot';
    dot.style.background = typeColor;
    if (isDimmed) dot.style.opacity = '0.3';
    row.appendChild(dot);
  }

  // Status dot
  if (statusColor) {
    const dot = document.createElement('span');
    dot.className = 'status-dot';
    dot.style.background = statusColor;
    if (isDimmed) dot.style.opacity = '0.3';
    row.appendChild(dot);
  }

  // Label
  const lbl = document.createElement('span');
  lbl.className = 'lbl';
  lbl.style.flex = '1';
  lbl.textContent = label;
  row.appendChild(lbl);

  // Count
  const cnt = document.createElement('span');
  cnt.className = 'cnt';
  cnt.textContent = count;
  row.appendChild(cnt);

  // Click handler
  if (!isDimmed) {
    row.addEventListener('click', () => {
      const current = triMap[key] || TRI.NEUTRAL;
      const next = nextTriState(current);
      if (next === TRI.NEUTRAL) {
        delete triMap[key];
      } else {
        triMap[key] = next;
      }
      onFilterChange();
    });
  }

  return row;
}

// ===== Search filtering for filter lists =====
export function setupSearchInputs() {
  setupSearchFor('moduleSearch', 'moduleList');
  setupSearchFor('weitereModuleSearch', 'weitereModuleList');
  setupSearchFor('staffSearch', 'staffList');
  setupSearchFor('locationSearch', 'locationList');
}

function setupSearchFor(inputId, listId) {
  const input = document.getElementById(inputId);
  const list = document.getElementById(listId);
  if (!input || !list) return;

  input.addEventListener('input', () => {
    const query = input.value.toLowerCase().trim();
    for (const row of list.children) {
      const lbl = row.querySelector('.lbl');
      if (!lbl) continue;
      const match = !query || lbl.textContent.toLowerCase().includes(query);
      row.style.display = match ? '' : 'none';
    }
  });
}

// ===== Degree change handler =====
export async function onDegreeChange(degreeId) {
  sel.degreeId = degreeId ? Number(degreeId) : null;
  sel.semester = null;

  if (sel.degreeId) {
    try {
      data.degreeDetail = await fetchDegreeDetail(sel.degreeId);
    } catch {
      data.degreeDetail = null;
    }
  } else {
    data.degreeDetail = null;
  }

  onFilterChange();
}

export function onSemesterChange(semester) {
  sel.semester = semester ? Number(semester) : null;
  onFilterChange();
}

// ===== Central filter change handler =====
export function onFilterChange() {
  computeVisibleEvents();
  renderFilters();
  refreshCalendarEvents();
  saveState();
}

// ===== Reset all filters =====
export function resetAllFilters() {
  sel.modules = {};
  sel.types = {};
  sel.statuses = {};
  sel.staffs = {};
  sel.locations = {};
  sel.pinnedEventIds.clear();
  onFilterChange();
}

// ===== Mobile filter summary =====
function updateMobileFilterSummary() {
  const pinCount = document.getElementById('mobilePinCount');
  const selCount = document.getElementById('mobileSelCount');
  const hidCount = document.getElementById('mobileHidCount');
  if (!pinCount) return;

  pinCount.textContent = sel.pinnedEventIds.size;

  let totalSel = 0;
  let totalHid = 0;
  for (const m of [sel.modules, sel.types, sel.statuses, sel.staffs, sel.locations]) {
    for (const v of Object.values(m)) {
      if (v === TRI.SELECTED) totalSel++;
      if (v === TRI.HIDDEN) totalHid++;
    }
  }
  selCount.textContent = totalSel;
  hidCount.textContent = totalHid;
}

// js/state.js — Central state management with localStorage + URL param persistence

const STORAGE_KEY = 'uniPlaner';

// ===== Tri-state constants =====
export const TRI = { NEUTRAL: 'neutral', SELECTED: 'selected', HIDDEN: 'hidden' };
const TRI_CYCLE = [TRI.NEUTRAL, TRI.SELECTED, TRI.HIDDEN];

export function nextTriState(current) {
  const i = TRI_CYCLE.indexOf(current);
  return TRI_CYCLE[(i + 1) % 3];
}

// ===== Raw data from API =====
export const data = {
  degrees: [],
  modules: [],
  events: [],
  staff: [],
  locations: [],
  semesters: [],
  degreeDetail: null, // DegreeDetailResponse for selected degree
};

// ===== Lookup maps (built after fetch) =====
export const maps = {
  moduleById: new Map(),
  eventById: new Map(),
  staffById: new Map(),
  locationById: new Map(),
  degreeById: new Map(),
};

// ===== User selections =====
export const sel = {
  degreeId: null,
  semester: null,

  // Tri-state maps: id/key → 'neutral'|'selected'|'hidden'
  modules: {},    // moduleId → tri
  types: {},      // eventType string → tri
  statuses: {},   // status string → tri
  staffs: {},     // staffId → tri
  locations: {},  // locationId → tri

  pinnedEventIds: new Set(),

  colorMode: 'type', // 'type' | 'module' | 'status' | 'staff' | 'custom'
  customColors: {},   // key → hex color
  darkMode: true,
  currentView: 'timeGridWeek', // FullCalendar view name
};

// ===== Derived / computed =====
export let visibleEventIds = new Set();
export let excludedEventIds = new Set(); // auto-excluded by pin group logic

export function setVisibleEventIds(ids) { visibleEventIds = ids; }
export function setExcludedEventIds(ids) { excludedEventIds = ids; }

// ===== Build lookup maps =====
export function buildMaps() {
  maps.moduleById.clear();
  maps.eventById.clear();
  maps.staffById.clear();
  maps.locationById.clear();
  maps.degreeById.clear();

  for (const m of data.modules) maps.moduleById.set(m.id, m);
  for (const e of data.events) maps.eventById.set(e.id, e);
  for (const s of data.staff) maps.staffById.set(s.id, s);
  for (const l of data.locations) maps.locationById.set(l.id, l);
  for (const d of data.degrees) maps.degreeById.set(d.id, d);
}

// ===== Color scheme =====
export const TYPE_COLORS = {
  'Vorlesung': '#3B82F6',
  'Vorlesung mit integrierter Übung': '#3B82F6',
  'Vorlesung mit seminaristischem Anteil': '#3B82F6',
  'Seminar': '#10B981',
  'Seminar mit Übungsanteil': '#10B981',
  'Übung': '#F59E0B',
  'Praktikum': '#8B5CF6',
  'Projektseminar': '#EC4899',
  'Kolloquium': '#6366F1',
  'E-Learning-Veranstaltung': '#14B8A6',
  'Schulpraktische Studien': '#F97316',
  'Kein Typ angegeben': '#6B7280',
};

export const STATUS_COLORS = {
  ok: '#22c55e',
  pok: '#eab308',
  tok: '#f97316',
  alt: '#6b7280',
  reserve: '#ef4444',
};

export const STATUS_LABELS = {
  ok: 'Bestätigt',
  pok: 'VA offen',
  tok: 'Dozent offen',
  alt: 'Vorsemester',
  reserve: 'Entfällt',
};

// Distinct hue palette for module/staff color modes
const HUE_PALETTE = [
  '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899',
  '#6366F1', '#14B8A6', '#F97316', '#06B6D4', '#D946EF',
  '#84CC16', '#EF4444', '#0EA5E9', '#A855F7', '#F43F5E',
  '#22D3EE', '#FB923C', '#A3E635', '#C084FC', '#FDE047',
];

const moduleColorCache = new Map();
const staffColorCache = new Map();

export function getModuleColor(moduleId) {
  if (!moduleColorCache.has(moduleId)) {
    moduleColorCache.set(moduleId, HUE_PALETTE[moduleColorCache.size % HUE_PALETTE.length]);
  }
  return moduleColorCache.get(moduleId);
}

export function getStaffColor(staffId) {
  if (!staffColorCache.has(staffId)) {
    staffColorCache.set(staffId, HUE_PALETTE[staffColorCache.size % HUE_PALETTE.length]);
  }
  return staffColorCache.get(staffId);
}

export function getEventColor(event) {
  if (sel.colorMode === 'custom' && sel.customColors[event.id]) {
    return sel.customColors[event.id];
  }
  switch (sel.colorMode) {
    case 'type':
      return TYPE_COLORS[event.type] || '#6B7280';
    case 'module': {
      const mid = event.module_ids?.[0];
      return mid ? getModuleColor(mid) : '#6B7280';
    }
    case 'status':
      return STATUS_COLORS[event.status] || '#6B7280';
    case 'staff': {
      const sid = event.staff_ids?.[0];
      return sid ? getStaffColor(sid) : '#6B7280';
    }
    case 'custom': {
      // Fall back to type colors for custom mode without specific override
      return TYPE_COLORS[event.type] || '#6B7280';
    }
    default:
      return TYPE_COLORS[event.type] || '#6B7280';
  }
}

// ===== Weekday mapping =====
export const WEEKDAY_MAP = {
  1: 1, // Monday
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 0, // Sunday
};

export const WEEKDAY_LABELS = {
  1: 'Montag',
  2: 'Dienstag',
  3: 'Mittwoch',
  4: 'Donnerstag',
  5: 'Freitag',
  6: 'Samstag',
  7: 'Sonntag',
};

export const WEEKDAY_SHORT = {
  1: 'Mo',
  2: 'Di',
  3: 'Mi',
  4: 'Do',
  5: 'Fr',
  6: 'Sa',
  7: 'So',
};

// ===== localStorage =====
export function saveState() {
  const obj = {
    degreeId: sel.degreeId,
    semester: sel.semester,
    modules: sel.modules,
    types: sel.types,
    statuses: sel.statuses,
    staffs: sel.staffs,
    locations: sel.locations,
    pinnedEventIds: [...sel.pinnedEventIds],
    colorMode: sel.colorMode,
    customColors: sel.customColors,
    darkMode: sel.darkMode,
    currentView: sel.currentView,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch { /* quota exceeded — ignore */ }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const obj = JSON.parse(raw);
    if (obj.degreeId != null) sel.degreeId = obj.degreeId;
    if (obj.semester != null) sel.semester = obj.semester;
    if (obj.modules) sel.modules = obj.modules;
    if (obj.types) sel.types = obj.types;
    if (obj.statuses) sel.statuses = obj.statuses;
    if (obj.staffs) sel.staffs = obj.staffs;
    if (obj.locations) sel.locations = obj.locations;
    if (Array.isArray(obj.pinnedEventIds)) sel.pinnedEventIds = new Set(obj.pinnedEventIds);
    if (obj.colorMode) sel.colorMode = obj.colorMode;
    if (obj.customColors) sel.customColors = obj.customColors;
    if (obj.darkMode !== undefined) sel.darkMode = obj.darkMode;
    if (obj.currentView) sel.currentView = obj.currentView;
  } catch { /* corrupted data — ignore */ }
}

// ===== URL Params (share link) =====
export function stateToUrlParams() {
  const params = new URLSearchParams();
  if (sel.degreeId) params.set('degree', sel.degreeId);
  if (sel.semester) params.set('sem', sel.semester);
  if (sel.pinnedEventIds.size) params.set('pinned', [...sel.pinnedEventIds].join(','));

  const selMods = Object.entries(sel.modules).filter(([, v]) => v === TRI.SELECTED).map(([k]) => k);
  const hidMods = Object.entries(sel.modules).filter(([, v]) => v === TRI.HIDDEN).map(([k]) => k);
  if (selMods.length) params.set('mods_sel', selMods.join(','));
  if (hidMods.length) params.set('mods_hid', hidMods.join(','));

  const selTypes = Object.entries(sel.types).filter(([, v]) => v === TRI.SELECTED).map(([k]) => k);
  const hidTypes = Object.entries(sel.types).filter(([, v]) => v === TRI.HIDDEN).map(([k]) => k);
  if (selTypes.length) params.set('types_sel', selTypes.join(','));
  if (hidTypes.length) params.set('types_hid', hidTypes.join(','));

  const selStatus = Object.entries(sel.statuses).filter(([, v]) => v === TRI.SELECTED).map(([k]) => k);
  const hidStatus = Object.entries(sel.statuses).filter(([, v]) => v === TRI.HIDDEN).map(([k]) => k);
  if (selStatus.length) params.set('stat_sel', selStatus.join(','));
  if (hidStatus.length) params.set('stat_hid', hidStatus.join(','));

  const selStaff = Object.entries(sel.staffs).filter(([, v]) => v === TRI.SELECTED).map(([k]) => k);
  const hidStaff = Object.entries(sel.staffs).filter(([, v]) => v === TRI.HIDDEN).map(([k]) => k);
  if (selStaff.length) params.set('staff_sel', selStaff.join(','));
  if (hidStaff.length) params.set('staff_hid', hidStaff.join(','));

  const selLoc = Object.entries(sel.locations).filter(([, v]) => v === TRI.SELECTED).map(([k]) => k);
  const hidLoc = Object.entries(sel.locations).filter(([, v]) => v === TRI.HIDDEN).map(([k]) => k);
  if (selLoc.length) params.set('loc_sel', selLoc.join(','));
  if (hidLoc.length) params.set('loc_hid', hidLoc.join(','));

  if (sel.colorMode !== 'type') params.set('color', sel.colorMode);
  if (sel.darkMode) params.set('dark', '1');
  return params;
}

export function loadStateFromUrlParams() {
  const params = new URLSearchParams(window.location.search);
  if (!params.has('degree') && !params.has('pinned') && !params.has('sem')) return false;

  if (params.has('degree')) sel.degreeId = Number(params.get('degree'));
  if (params.has('sem')) sel.semester = Number(params.get('sem'));
  if (params.has('pinned')) {
    sel.pinnedEventIds = new Set(params.get('pinned').split(',').map(Number).filter(n => !isNaN(n)));
  }

  function loadTri(param, target) {
    if (params.has(param + '_sel')) {
      for (const k of params.get(param + '_sel').split(',')) target[k] = TRI.SELECTED;
    }
    if (params.has(param + '_hid')) {
      for (const k of params.get(param + '_hid').split(',')) target[k] = TRI.HIDDEN;
    }
  }

  loadTri('mods', sel.modules);
  loadTri('types', sel.types);
  loadTri('stat', sel.statuses);
  loadTri('staff', sel.staffs);
  loadTri('loc', sel.locations);

  if (params.has('color')) sel.colorMode = params.get('color');
  if (params.has('dark')) sel.darkMode = params.get('dark') === '1';
  return true;
}

// ===== Filtering logic =====
export function computeVisibleEvents() {
  const allEvents = data.events;

  // Compute excluded events (pin group exclusion)
  const newExcluded = new Set();
  for (const pinnedId of sel.pinnedEventIds) {
    const pinnedEv = maps.eventById.get(pinnedId);
    if (!pinnedEv) continue;
    // Find sibling events: same module_ids AND same type
    const siblings = allEvents.filter(e =>
      e.id !== pinnedId &&
      e.type === pinnedEv.type &&
      e.module_ids.some(mid => pinnedEv.module_ids.includes(mid))
    );
    // Only exclude if there are actual parallel groups (≥2 total including pinned)
    if (siblings.length >= 1) {
      for (const sib of siblings) {
        // Don't exclude if the sibling is also pinned
        if (!sel.pinnedEventIds.has(sib.id)) {
          newExcluded.add(sib.id);
        }
      }
    }
  }
  setExcludedEventIds(newExcluded);

  // Filter function per category
  function passesCategory(event, triMap, getKey) {
    const keys = getKey(event);
    const selected = [];
    const hidden = [];
    for (const [k, v] of Object.entries(triMap)) {
      if (v === TRI.SELECTED) selected.push(k);
      if (v === TRI.HIDDEN) hidden.push(k);
    }
    // Hidden takes precedence
    for (const key of keys) {
      if (hidden.includes(String(key))) return false;
    }
    // If any selected, event must match at least one
    if (selected.length > 0) {
      return keys.some(key => selected.includes(String(key)));
    }
    return true; // all neutral = pass
  }

  const visible = new Set();
  for (const ev of allEvents) {
    // Pinned events always visible (but not excluded ones)
    if (sel.pinnedEventIds.has(ev.id)) {
      visible.add(ev.id);
      continue;
    }

    // Excluded events never visible
    if (newExcluded.has(ev.id)) continue;

    // Check all categories
    const passModule = passesCategory(ev, sel.modules, e => e.module_ids.map(String));
    const passType = passesCategory(ev, sel.types, e => [e.type]);
    const passStatus = passesCategory(ev, sel.statuses, e => [e.status]);
    const passStaff = passesCategory(ev, sel.staffs, e => e.staff_ids.map(String));
    const passLocation = passesCategory(ev, sel.locations, e => [String(e.location_id)]);

    if (passModule && passType && passStatus && passStaff && passLocation) {
      visible.add(ev.id);
    }
  }

  setVisibleEventIds(visible);
  return visible;
}

// ===== Get modules for current degree/semester =====
export function getDegreeSemesterModuleIds() {
  if (!data.degreeDetail) return null;
  const modules = data.degreeDetail.modules || [];
  if (sel.semester == null) return modules.map(m => m.id);
  return modules
    .filter(m => m.semesters && m.semesters.includes(sel.semester))
    .map(m => m.id);
}

// ===== Cascading: get available items in a category based on visible events =====
export function getAvailableInCategory(category) {
  const available = new Map(); // key → count

  for (const ev of data.events) {
    // Skip excluded
    if (excludedEventIds.has(ev.id)) continue;

    // Check if event passes all OTHER categories (not this one)
    const passOther = passesAllExcept(ev, category);
    if (!passOther && !sel.pinnedEventIds.has(ev.id)) continue;

    switch (category) {
      case 'types':
        available.set(ev.type, (available.get(ev.type) || 0) + 1);
        break;
      case 'statuses':
        available.set(ev.status, (available.get(ev.status) || 0) + 1);
        break;
      case 'staffs':
        for (const sid of ev.staff_ids) {
          available.set(String(sid), (available.get(String(sid)) || 0) + 1);
        }
        break;
      case 'locations':
        available.set(String(ev.location_id), (available.get(String(ev.location_id)) || 0) + 1);
        break;
      case 'modules':
        for (const mid of ev.module_ids) {
          available.set(String(mid), (available.get(String(mid)) || 0) + 1);
        }
        break;
    }
  }
  return available;
}

function passesAllExcept(ev, exceptCategory) {
  function passesCategory(triMap, getKey) {
    const keys = getKey(ev);
    const selected = [];
    const hidden = [];
    for (const [k, v] of Object.entries(triMap)) {
      if (v === TRI.SELECTED) selected.push(k);
      if (v === TRI.HIDDEN) hidden.push(k);
    }
    for (const key of keys) {
      if (hidden.includes(String(key))) return false;
    }
    if (selected.length > 0) {
      return keys.some(key => selected.includes(String(key)));
    }
    return true;
  }

  if (exceptCategory !== 'modules') {
    if (!passesCategory(sel.modules, e => e.module_ids.map(String))) return false;
  }
  if (exceptCategory !== 'types') {
    if (!passesCategory(sel.types, e => [e.type])) return false;
  }
  if (exceptCategory !== 'statuses') {
    if (!passesCategory(sel.statuses, e => [e.status])) return false;
  }
  if (exceptCategory !== 'staffs') {
    if (!passesCategory(sel.staffs, e => e.staff_ids.map(String))) return false;
  }
  if (exceptCategory !== 'locations') {
    if (!passesCategory(sel.locations, e => [String(e.location_id)])) return false;
  }
  return true;
}

// ===== Event type short labels =====
export const TYPE_SHORT = {
  'Vorlesung': 'VL',
  'Vorlesung mit integrierter Übung': 'VL+Ü',
  'Vorlesung mit seminaristischem Anteil': 'VL+S',
  'Seminar': 'SE',
  'Seminar mit Übungsanteil': 'SE+Ü',
  'Übung': 'ÜB',
  'Praktikum': 'PR',
  'Projektseminar': 'PS',
  'Kolloquium': 'KO',
  'E-Learning-Veranstaltung': 'EL',
  'Schulpraktische Studien': 'SPS',
  'Kein Typ angegeben': '–',
};

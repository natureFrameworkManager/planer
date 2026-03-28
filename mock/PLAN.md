# Web GUI Plan — Uni Planer

## Goal
Build a standalone single-page web GUI that consumes the existing Uni Planer API and displays university schedule data in a timetable view with filtering capabilities.

---

## Architecture

```
Frontend (standalone, separately hosted)
├── index.html        ← Main SPA page
├── css/style.css     ← Custom styles
├── js/               ← Application JavaScript
└── assets/           ← Fonts, images

FastAPI (unchanged)
├── /modules           ← existing endpoints, no changes
├── /events
├── /staff
├── /locations
├── /degrees
└── /semesters
```

- **No build step** — plain HTML, CSS, JS (no framework, no bundler)
- **TailwindCSS** via CDN for styling (consistent with original project)
- **FullCalendar.io** via CDN for timetable rendering
- **Material Icons** via CDN
- **Hosted separately** — can be opened as local files or served by any web server
- **API URL is configurable** in `js/api.js` (defaults to `http://127.0.0.1:8000`)

---

## Backend Changes

**None.** The API code stays untouched. The frontend communicates with the API via its existing endpoints.

---

## Frontend Structure

### Files to Create

```
index.html          ← Main SPA page
css/style.css       ← Custom styles (dark mode, layout, filters panel, pin styling)
js/api.js           ← API client (configurable base URL, fetch wrappers)
js/state.js         ← Central state (selections, pins, localStorage, URL params)
js/app.js           ← Main app logic (init, dark mode, color mode, share link)
js/calendar.js      ← FullCalendar setup, event rendering, pin toggle
js/filters.js       ← Filter panel: cascading logic, active chips, disabled-but-checked
```

---

## Pages / Views

### 1. Timetable View (Main View)
- **Generic week** — no specific date, no date navigation controls
- **Week view** using FullCalendar `timeGridWeek` (default)
- **Day view** toggle (`timeGridDay`)
- **List view** toggle (`listWeek`)
- Events color-coded (see Color Modes below)
- Click event → popup with event details (module, staff, location, type, status)
- Time range: 07:00–21:00 (typical university hours)
- Monday–Friday (hiddenDays: [0, 6] by default)
- **Pin icon** on each event to pin/unpin it

### 2. Filter Sidebar / Panel

#### Tri-State Selection
All filter items (modules, types, statuses, staff, locations) use a **tri-state toggle**
instead of a simple checkbox. The three states cycle on click:

| State | Icon | Meaning | Effect |
|---|---|---|---|
| **Neutral** (default) | `—` (dash / empty) | No opinion | Event passes through, not filtered by this item |
| **Selected** ✅ | Green checkmark | Actively include | Only show events matching at least one selected item in this category |
| **Hidden** ❌ | Red X / strikethrough | Actively exclude | Hide events matching this item, even if they match other filters |

**Precedence:** Hidden > Selected > Neutral.
- If nothing in a category is Selected, all Neutral items pass through (no filtering in that category).
- If ≥1 item is Selected, only Selected items pass; Neutral items are excluded.
- Hidden items are always excluded regardless of other selections.
- Pinned events still bypass all filters.

**Interaction:** Single click cycles: Neutral → Selected → Hidden → Neutral.

#### 2a. Active Selection Summary (top of sidebar)
Displayed **above** all filter controls. Shows:
- **Pinned events** as removable chips (always visible regardless of filters)
- **Selected items** as green chips (e.g. "✅ Vorlesung", "✅ Prof. Müller")
- **Hidden items** as red/strikethrough chips (e.g. "❌ reserve", "❌ Kolloquium")
- Clicking the × on a chip resets that item to Neutral
- "Alle zurücksetzen" button to clear everything

#### 2b. Degree + Semester Selection
- **Degree** dropdown (fetched from `/degrees?include_relationships=true`)
- On degree select → show **Semester** dropdown populated from `DegreeDetailResponse.semesters`
  (the list of semester numbers available for that degree, from `ModuleDegreeLink.semester`)
- Selecting a semester narrows the module list to modules linked to that degree+semester
- Degree selection is optional — student can skip it and browse all modules

#### 2c. Module Selection
- **Tri-state** list with **search field** (filters list by typing module name)
- Each module shows: `[—]` neutral, `[✅]` selected, `[❌]` hidden
- Default: all modules are Neutral (all events shown)
- Selecting a module → only events from selected modules shown
- Hiding a module → its events are removed even if other filters would include them
- Default list: shows modules for selected degree+semester
- **"Weitere Module"** expandable section below → shows ALL modules (from any degree)
  so students can pick events from modules not in their degree
- "Weitere Module" also has its own **search field**
- Modules that don't match current degree/semester are visually distinguished (dimmed/italic)
- Selecting a module here adds it to active selection even if it's cross-degree

#### 2d. Cascading Filter Logic
All filter categories use tri-state. Available options dynamically narrow based on selections:
- **Event Type** tri-state → only show types that exist in currently visible events
- **Status** tri-state → only show statuses present in currently visible events
- **Staff** tri-state with search → only show staff linked to currently visible events
- **Location** tri-state with search → only show locations used by currently visible events

**Staff & Location as cross-filters:** Setting a staff member or location to Selected/Hidden
filters events AND cascades back to narrow the available modules, types, and statuses.
They act as bi-directional constraints — not just downstream-only.
Example: selecting "Prof. Müller" hides all events not taught by him, which narrows
the module list to only modules with his events, which narrows types/statuses accordingly.

**Critical rule:** When cascading narrows the available options, **do NOT auto-change
user-set tri-states**. Instead, mark impossible items as disabled/greyed out but keep
their state (Selected/Hidden). This preserves user intent — re-broadening a higher
filter restores them.

**Filtering formula:**
```
visible = (event matches ALL selected categories
           AND event matches NO hidden items)
          OR event is pinned

Per category:
  if any item is Selected → event must match ≥1 Selected item
  if no item is Selected  → event passes (Neutral = no filter)
  if event matches a Hidden item → event is excluded
```

#### 2d-ii. Event Group Exclusion (Übungen / Parallele Gruppen)
When a student **pins** a specific event of a type that has parallel groups within
the same module (e.g. "Algorithmen Übung Gruppe A" vs "Gruppe B"), the **other events
of the same module and same event type** are automatically hidden.

Logic:
- When an event is pinned, find all other events sharing the same `module_id` AND `type`
- Mark those sibling events as "excluded" (hidden from calendar, greyed in list view)
- Excluded events get a visual indicator: strikethrough + dimmed
- The exclusion is automatic but reversible — un-pinning restores siblings
- Exclusion only applies when there are ≥2 events of the same module+type
  (i.e. actual parallel groups, not just a single Übung)
- A small label "Gruppe ausgewählt" appears on excluded events in list view

#### 2e. Pin System
- Each event in the calendar has a pin/bookmark toggle (📌 icon)
- Pinned events **always show** regardless of active filters
- Pinned events appear in the Active Selection Summary as chips
- Pinned events are visually distinct in the calendar (e.g. pin badge)
- Un-pinning removes the event only if it doesn't match current filters

### 3. Event Detail Popup
- Shows on event click
- Displays: title, module name(s), type, weekday + time, location, staff, status badge, credits
- **Pin/unpin button** in the popup
- Shows degree + semester info for each linked module

### 4. Color Modes
Switchable via dropdown in header. Options:
- **Nach Typ** (default) — Vorlesung=blue, Seminar=green, Übung=amber, etc.
- **Nach Modul** — each module gets a distinct hue (auto-assigned from palette)
- **Nach Status** — ok=green, pok=yellow, tok=orange, alt=gray, reserve=red
- **Nach Dozent** — each staff member gets a distinct hue
- **Benutzerdefiniert** — opens a color config panel where the user can:
  - Pick a color for each event type, module, or individual event
  - Colors are assigned per category (type or module) via color pickers
  - Custom palette saved to `localStorage`
  - "Zurücksetzen" resets to the selected base mode defaults

### 5. Persistence
- **localStorage** saves: selected degree, semester, pinned events, active filters,
  color mode, dark/light theme
- On page reload, all selections are restored
- **Shareable link**: "Link teilen" button generates a URL with query params encoding
  the current degree, semester, pinned event IDs, and filter state
  (e.g. `?degree=3&sem=2&pinned=5,12,18&types=Vorlesung,Übung`)
- Opening a shared link restores that exact view

---

## Data Flow

1. **On page load:**
   - Check URL params → if shared link, parse and apply state
   - Else check `localStorage` → restore saved state
   - Fetch `/degrees?include_relationships=true` → populate degree dropdown
   - Fetch `/events?include_relationships=true` → load all events with module_ids, staff_ids
   - Fetch `/modules?include_relationships=true` → load all modules with degree_ids, event_ids
   - Fetch `/staff` → load staff (for name lookups)
   - Fetch `/locations` → load locations (for name lookups)
   - Fetch `/semesters` → show current semester name in header
   - Fetch `/degrees/{id}` for selected degree (if any) → get `modules` with `semesters` info
   - Build lookup maps: `moduleById`, `staffById`, `locationById`, `eventById`

2. **On degree+semester change:**
   - Fetch `/degrees/{id}` (detail) → get `ModuleInDegreeResponse` with `semesters` list
   - Filter modules to those linked to selected degree and matching semester number
   - Populate module checkboxes (primary list + "Weitere Module" section for all others)
   - Cascade: recompute available event types, statuses, staff, locations from visible events
   - Save to `localStorage`

3. **On any filter change (tri-state):**
   - Recompute visible events per category:
     - For each category: if any item is Selected, require match; exclude Hidden items
     - Formula: `(match selected modules ∩ match selected types ∩ match selected statuses ∩ match selected staff ∩ match selected locations) \ hidden items ∪ pinned events`
   - Cascade filters: recompute available options in other categories from visible events
   - Mark impossible-but-set options as disabled (keep their tri-state)
   - Update Active Selection Summary chips (green=selected, red=hidden)
   - Re-render FullCalendar
   - Save to `localStorage`

4. **On pin toggle:**
   - Add/remove event ID from `pinnedEventIds` set
   - Pinned events bypass all filters
   - Update Active Selection Summary
   - Re-render calendar
   - Save to `localStorage`

5. **API Base URL:**
   - Configurable constant in `js/api.js` (default: `http://127.0.0.1:8000`)

6. **FullCalendar event mapping:**
   ```
   API Event → FullCalendar Event
   title     → title (prepend type icon/badge)
   weekday   → daysOfWeek: [weekday]  (recurring weekly, generic week)
   start_time → startTime
   end_time   → endTime
   type       → className / color (depends on color mode)
   status     → border style or badge
   pinned     → gold border + pin icon overlay
   ```

---

## Color Scheme (Event Types)

| Event Type | Color |
|---|---|
| Vorlesung / Vorlesung mit... | `#3B82F6` (blue) |
| Seminar / Seminar mit... | `#10B981` (green) |
| Übung | `#F59E0B` (amber) |
| Praktikum | `#8B5CF6` (purple) |
| Projektseminar | `#EC4899` (pink) |
| Kolloquium | `#6366F1` (indigo) |
| E-Learning | `#14B8A6` (teal) |
| Schulpraktische Studien | `#F97316` (orange) |
| Kein Typ angegeben | `#6B7280` (gray) |

---

## Status Indicators

| Status | Meaning | Badge |
|---|---|---|
| `ok` | Confirmed | Green dot |
| `pok` | Event not confirmed | Yellow dot |
| `tok` | Instructor not confirmed | Orange dot |
| `alt` | From last semester | Gray dot |
| `reserve` | No longer offered | Red dot / strikethrough |

---

## UI Color Palette (CSS Custom Properties)

Defined as CSS variables on `:root` (light) and `html.dark` (dark). No Tailwind dependency — pure custom CSS with `Inter` font.

### Light Theme

| Variable | Value | Usage |
|---|---|---|
| `--bg-page` | `#f5f0eb` | Page / outermost background (warm cream) |
| `--bg-surface` | `#ffffff` | Cards, sidebar, calendar |
| `--bg-surface-alt` | `#faf7f4` | Alternate surface (filter lists, config bar) |
| `--bg-elevated` | `#ffffff` | Popups, dropdowns |
| `--bg-input` | `#f0ece7` | Inputs, selects, neutral buttons |
| `--bg-hover` | `#ece6df` | Hover state for rows and buttons |
| `--border` | `#e0d8cf` | Main borders |
| `--border-light` | `#ede7df` | Subtle cell separators |
| `--text-primary` | `#1a1a2e` | Main text |
| `--text-secondary` | `#6b6580` | Labels, metadata |
| `--text-muted` | `#9e95a9` | Placeholders, counts, timestamps |
| `--accent` | `#e06c5d` | Primary accent (coral) — active buttons, links, reset |
| `--accent-light` | `rgba(224,108,93,.12)` | Tinted accent backgrounds |
| `--accent2` | `#3a8a7c` | Secondary accent (teal) — share button, links |
| `--accent2-light` | `rgba(58,138,124,.10)` | Tinted secondary backgrounds |
| `--selected-bg` | `rgba(58,138,124,.10)` | Tri-state "selected" background |
| `--selected-border` | `#3a8a7c` | Tri-state "selected" border |
| `--selected-text` | `#2a7a6c` | Tri-state "selected" text / chip text |
| `--hidden-bg` | `rgba(224,108,93,.08)` | Tri-state "hidden" background |
| `--hidden-border` | `#e06c5d` | Tri-state "hidden" border |
| `--hidden-text` | `#c0524a` | Tri-state "hidden" text / chip text |
| `--pin-color` | `#d4a017` | Pin/bookmark gold color |
| `--pin-bg` | `rgba(212,160,23,.10)` | Pin chip / pin icon background |

### Dark Theme

| Variable | Value | Usage |
|---|---|---|
| `--bg-page` | `#0f0e17` | Page background (deep indigo-black) |
| `--bg-surface` | `#1a1928` | Cards, sidebar, calendar |
| `--bg-surface-alt` | `#15142a` | Alternate surface |
| `--bg-elevated` | `#211f36` | Popups, dropdowns |
| `--bg-input` | `#252340` | Inputs, selects, neutral buttons |
| `--bg-hover` | `#2a284a` | Hover state |
| `--border` | `#2e2c4a` | Main borders |
| `--border-light` | `#242240` | Subtle cell separators |
| `--text-primary` | `#eae6ff` | Main text |
| `--text-secondary` | `#a8a0c0` | Labels, metadata |
| `--text-muted` | `#6b6590` | Placeholders, counts |
| `--accent` | `#ff7a6b` | Primary accent (bright coral) |
| `--accent-light` | `rgba(255,122,107,.10)` | Tinted accent backgrounds |
| `--accent2` | `#5cf0d8` | Secondary accent (bright teal) |
| `--accent2-light` | `rgba(92,240,216,.08)` | Tinted secondary backgrounds |
| `--selected-bg` | `rgba(92,240,216,.08)` | Tri-state "selected" background |
| `--selected-border` | `#5cf0d8` | Tri-state "selected" border |
| `--selected-text` | `#5cf0d8` | Tri-state "selected" text / chip text |
| `--hidden-bg` | `rgba(255,122,107,.08)` | Tri-state "hidden" background |
| `--hidden-border` | `#ff7a6b` | Tri-state "hidden" border |
| `--hidden-text` | `#ff7a6b` | Tri-state "hidden" text / chip text |
| `--pin-color` | `#ffd166` | Pin/bookmark gold color |
| `--pin-bg` | `rgba(255,209,102,.10)` | Pin chip / pin icon background |

### Filter & Chip State Colors Summary

| State | Light bg | Light border/text | Dark bg | Dark border/text |
|---|---|---|---|---|
| **Selected** ✅ | `rgba(58,138,124,.10)` | `#3a8a7c` / `#2a7a6c` | `rgba(92,240,216,.08)` | `#5cf0d8` |
| **Hidden** ❌ | `rgba(224,108,93,.08)` | `#e06c5d` / `#c0524a` | `rgba(255,122,107,.08)` | `#ff7a6b` |
| **Pinned** 📌 | `rgba(212,160,23,.10)` | `#d4a017` | `rgba(255,209,102,.10)` | `#ffd166` |

### Other Design Tokens

| Token | Value | Notes |
|---|---|---|
| `--radius` | `14px` | Default border radius (cards, panels) |
| `--radius-sm` | `8px` | Smaller radius (inputs, rows, event blocks) |
| `--radius-xs` | `5px` | Tiny radius (filter rows) |
| `--shadow-sm` | `0 1px 3px rgba(26,26,46,.06)` | Light card shadow |
| `--shadow-md` | `0 4px 16px rgba(26,26,46,.08)` | Hover / elevated shadow |
| `--shadow-lg` | `0 12px 40px rgba(26,26,46,.12)` | Popup / modal shadow |
| `--glass` | `rgba(255,255,255,.75)` | Header glassmorphism fill |
| `--glass-border` | `rgba(255,255,255,.40)` | Header glassmorphism border |
| Font | `Inter` (Google Fonts) | 400 / 500 / 600 / 700 / 800 weights |

---

## UI Layout

```
┌─────────────────────────────────────────────────────────┐
│  🎓 Uni Planer  [SoSe 2026]  [🎨 Farbe ▼] [🌙 Theme] │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  ACTIVE      │       FULLCALENDAR TIMETABLE             │
│  ┌────────┐  │       (generic week, no dates)           │
│  │ B.Sc.× │  │                                          │
│  │ 2.Sem× │  │   Mo    Di    Mi    Do    Fr             │
│  │ VL ×   │  │  ┌─────┬─────┬─────┬─────┬─────┐       │
│  │📌Algo× │  │  │     │     │     │     │     │ 08:00 │
│  └────────┘  │  │ VL📌│     │ ÜB  │     │     │ 09:00 │
│              │  │     │ SE  │     │ PR  │     │ 10:00 │
│  Studiengang │  │     │     │     │     │     │ ...   │
│  [Degree  ▼] │  └─────┴─────┴─────┴─────┴─────┘       │
│  Semester    │                                          │
│  [Sem.   ▼]  │  [Woche] [Tag] [Liste]                  │
│              │                                          │
│  Module      │                                          │
│  [🔍 suchen] │                                          │
│  ☑ Mod A     │                                          │
│  ☑ Mod B     │                                          │
│  ▸ Weitere   │  (has its own search too)                │
│              │                                          │
│  Typ         │                                          │
│  ☑ VL        │                                          │
│  ☐̲ SE (0)    │  ← disabled, user-checked but no match  │
│  ☑ ÜB        │                                          │
│              │                                          │
│  Status      │                                          │
│  ☑ ok        │                                          │
│              │                                          │
│  Dozent      │  ← cross-filter (narrows all above)     │
│  [🔍 suchen] │                                          │
│  ☑ Prof. X   │                                          │
│              │                                          │
│  Ort         │  ← cross-filter (narrows all above)     │
│  [🔍 suchen] │                                          │
│  ☑ SG 3-10   │                                          │
│              │                                          │
│  [Zurücksetzen] [🔗 Link teilen]                       │
│              │                                          │
├──────────────┴──────────────────────────────────────────┤
│  Footer: Daten von informatik.uni-leipzig.de            │
└─────────────────────────────────────────────────────────┘
```

---

## Responsive Design

### Breakpoints & Layout Modes

| Device | Breakpoint | Layout | Sidebar | Calendar |
|---|---|---|---|---|
| **Mobile** | < 640px (sm) | Single column, stacked | Hidden by default, slide-out drawer on hamburger | Simplified, scrollable |
| **Tablet** | 640px–1024px (md–lg) | Two column or flexible | Always visible, takes 30–40% width | Main view adjusts |
| **Desktop** | > 1024px (lg) | Full layout | Sidebar 280px fixed, collapsible toggle | Full timetable with all features |

### Mobile (< 640px)

**Layout:**
- Full-screen single column: header → main area (calendar or list)
- Sidebar is **off-canvas** (hidden by default)
- Hamburger menu (☰) in header to toggle sidebar in/out
- Sidebar slides in from left, overlays calendar (z-index: 50)
- Overlay backdrop (semi-transparent) behind sidebar, closes sidebar on tap

**Header:**
- Compact: logo + app name (text only, no icon if space tight)
- Hamburger menu on left
- Dark/light mode toggle and color mode dropdown on right (may stack vertically)
- Semester badge hidden or moved to sidebar

**Calendar:**
- **Week view** disabled by default; show **day view** or **list view** as default for mobile
- Day view: Single weekday column, 1–2 hour slots visible at a time, scrollable vertically
- List view: Events as scrollable list with time + title + location, click to expand details
- Horizontal scroll for multiple days (if week view enabled)
- Touch-friendly: larger tap targets (min 44×44px for event blocks, buttons)
- Time column width reduced to fit screen

**Filter Sidebar (Drawer):**
- Full-screen width (minus safe area margins)
- Scrollable vertical list within drawer
- Active selection chips at top, visible even in collapsed state (smaller version)
- Search fields use soft keyboard
- "Zurücksetzen" and "Link teilen" buttons stay at bottom as fixed footer within drawer
- Close button (✕) in top-right of drawer

**Popup & Modals:**
- Event detail popup full-screen or near-full (max-width: 95vw)
- Larger touch targets on pin button, close button
- Text sizes increased for readability

### Tablet (640px–1024px)

**Layout:**
- Two-column layout: sidebar left (30–35% width), calendar right (65–70% width)
- Sidebar always visible but narrower than desktop
- Hamburger menu still present for quick hide/show toggle (optional)
- No full-screen drawer overlay

**Header:**
- Normal size, all elements visible
- Semester badge visible
- Color mode and theme toggles both visible

**Calendar:**
- **Week view** becomes primary (tabbed switcher with day/list alternatives)
- Time grid adjusts to available width
- Sidebar scrolls independently of calendar

**Filter Sidebar:**
- Fixed visible panel, narrower (~240–260px)
- Search fields and dropdowns slightly condensed
- Scroll within sidebar if content overflows

**Mobile Landscape (< 640px wide, > 600px tall):**
- Treat as tablet layout (two column if width > 640px)
- Or: keep as drawer but allow side-by-side if screen is wide enough
- Watch for safe areas (notches, home indicator)

### Desktop (> 1024px)

**Layout:**
- Standard two-column: sidebar (~280px) + calendar (~responsive stretch)
- Sidebar can be toggled hidden (icon in top-left)
- Sticky sidebar (stays visible during scroll)

**Header:**
- Full layout: logo, title, semester badge, view toggles, color mode, theme, search (optional)
- All controls visible and well-spaced

**Calendar:**
- Week view default, full timetable visible
- All 7 days possible (if configured), or Mon–Fri standard
- 8am–9pm time range visible with scroll
- Smooth animations and hover effects

**Filter Sidebar:**
- Always visible, full height, scrollable content
- Active selection chips section at top (multi-line, full width)
- Degree/semester dropdowns, module search, cascading filters all visible
- Pin controls and link sharing at bottom

---

### Cross-Device Considerations

**Header Adjustments:**
- Logo and app name: stack vertically on very small screens, inline on larger
- Button icons without text on mobile (space saver), with text on desktop
- Semester badge: hidden on mobile, visible on tablet+

**Fonts & Spacing:**
- **Mobile:** base font 14–16px (events, labels), header 18–20px
- **Tablet:** base font 14–15px, header 20–22px
- **Desktop:** base font 13–14px, header 22–24px
- Padding/margins scale: `1rem` on mobile, `1.5–2rem` on desktop
- Line-height slightly increased on mobile (readability)

**Touch vs. Click:**
- All interactive elements ≥ 44×44px on mobile (buttons, event blocks, toggles)
- Hover states not visible on touch; use active/focus states instead
- Long-press for context menus (future enhancement)

**Safe Areas:**
- Account for notches and home indicators (iPhone, etc.)
- `env(safe-area-inset-*)` CSS for padding on mobile
- Drawer overlays don't hide critical UI (header always accessible)

**Performance:**
- Lazy-load filters and "Weitere Module" expandable on mobile
- Reduce animation frame rate on low-end devices (detect via `prefers-reduced-motion`)
- Optimize image assets (favicons, badges) for mobile (WebP with PNG fallback)
- CSS media queries to hide non-essential UI elements on small screens

### Orientation Handling

**Portrait (Primary):**
- Standard vertical layout
- Sidebar drawer on mobile
- Calendar scrolls vertically

**Landscape:**
- If width > 640px: switch to two-column layout even on mobile
- If width < 640px: rotate calendar to show more hours at once
- Hide non-essential UI (semester badge, some filter sections) to save vertical space

---

## Dark Mode
- Toggle button in header
- Preference saved in `localStorage`
- Respects `prefers-color-scheme` system preference on first visit
- TailwindCSS `dark:` classes + CSS custom properties for FullCalendar theming

---

## Implementation Order

### Phase 1 — HTML Shell & Styles
1. [ ] Create `index.html` with layout structure, CDN links (Tailwind, FullCalendar, Material Icons)
2. [ ] Create `css/style.css` with custom styles, dark mode variables, filter panel, pin styling

### Phase 2 — JavaScript Core
3. [ ] Create `js/api.js` — configurable base URL, fetch wrappers for all endpoints
4. [ ] Create `js/state.js` — central state: selections, pins, localStorage save/restore, URL param encode/decode
5. [ ] Create `js/app.js` — app initialization, dark mode toggle, color mode toggle, share link generation
6. [ ] Create `js/calendar.js` — FullCalendar init (generic week, no date nav), event mapping, pin toggle on click, color mode rendering
7. [ ] Create `js/filters.js` — degree+semester cascade, module list with "Weitere Module", cascading filter options, active selection chips, disabled-but-checked logic

### Phase 3 — Polish
8. [ ] **Responsive design implementation:**
   - [ ] Mobile-first CSS structure (base styles for < 640px, then breakpoint overrides)
   - [ ] Hamburger menu and off-canvas drawer for filters (mobile < 640px)
   - [ ] Flexible two-column layout for tablet (640px–1024px)
   - [ ] Full layout restoration for desktop (> 1024px)
   - [ ] Calendar view switching: day/list default on mobile, week on tablet+
   - [ ] Touch-friendly tap targets (min 44×44px)
   - [ ] Test on multiple devices: iPhone SE, iPhone 12, iPad, MacBook
   - [ ] Test orientations: portrait & landscape (especially tablet)
   - [ ] Safe area padding for notched devices
9. [ ] Event detail popup with pin button (mobile modal, desktop centered)
10. [ ] Loading states and error handling (spinner, toast notifications)
11. [ ] Test end-to-end with running API (all breakpoints)
12. [ ] Performance optimization: lazy-load, reduce animations on low-end devices

---

## Dependencies (CDN)

| Library | Version | Purpose |
|---|---|---|
| TailwindCSS | 3.x (CDN script) | Styling |
| FullCalendar | 6.x | Calendar/timetable |
| Material Icons | latest | Icons |

No npm, no build step. All via CDN `<script>` / `<link>` tags.

---

## German Localization

- FullCalendar locale: `de` (German weekday/month names)
- Weekday mapping already exists in backend (Montag, Dienstag, etc.)
- UI labels in German:
  - "Studiengang" (Degree), "Module" (Modules), "Veranstaltungstyp" (Event Type)
  - "Status", "Dozent" (Staff), "Ort" (Location)
  - "Filter zurücksetzen" (Reset Filters)
  - "Woche" / "Tag" / "Liste" (Week / Day / List)

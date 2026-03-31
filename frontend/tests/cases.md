# Frontend Test Cases

## 1. Unit Tests

### 1.1 state.js

#### nextTriState
- [x] cycles neutral → selected → hidden → neutral (existing)
- [x] returns neutral for unknown/invalid input (existing)
- [ ] returns neutral for empty string
- [ ] returns neutral for undefined

#### WEEKDAY_LABELS
- [x] maps numbers 1–7 to German weekday names (existing)
- [ ] does not have keys outside 1–7
- [ ] has exactly 7 entries

#### TRI constants
- [ ] TRI.NEUTRAL is "neutral"
- [ ] TRI.SELECTED is "selected"
- [ ] TRI.HIDDEN is "hidden"

#### fetchedData defaults
- [ ] all arrays start empty
- [ ] states has 5 predefined entries with correct keys (ok, tok, pok, alt, reserve)

#### filterState defaults
- [ ] degree and semester are null by default
- [ ] all Sets are empty
- [ ] all status values are null

#### pinnedEvents
- [ ] is an empty Set initially

#### view / colorMode / darkMode
- [ ] view defaults to "timeGridWeek"
- [ ] colorMode defaults to "type"
- [ ] darkMode defaults based on matchMedia (or true if unavailable)

---

### 1.2 color.js

#### generatePalette
- [x] returns requested number of colors (existing)
- [x] supports deterministic overrides (existing)
- [ ] returns empty array for count 0
- [ ] single color uses t=0.5 midpoint values
- [ ] all colors are unique for small palette (e.g. 10)
- [ ] uses golden angle spacing – hue increases by 137.508 per step
- [ ] respects custom hueOffset
- [ ] negative count returns empty array (edge case)
- [ ] large palette (100+ colors) returns correct length

#### getEventColor
- [ ] returns color from type palette when colorMode is "type"
- [ ] returns color from module palette when colorMode is "module"
- [ ] returns color from status palette when colorMode is "status"
- [ ] returns color from staff palette when colorMode is "staff"
- [ ] returns fallback color for "custom" mode (currently unimplemented)
- [ ] returns fallback color for unknown color mode

#### getContrastTextColor
- [ ] returns "#000000" when canvas context is unavailable
- [ ] returns black or white based on luminance of background

#### setColorUpdateCallback
- [ ] stores the callback function

---

### 1.3 api.js

#### apiFetch (via public wrappers)
- [x] fetchDegrees calls correct endpoint (existing)
- [x] throws on non-ok responses (existing)
- [x] fetchAll calls all endpoints (existing)
- [x] individual wrappers delegate to correct paths (existing)
- [ ] fetchDegreeDetail includes id in URL path
- [ ] fetchDegreeDetail throws on non-ok response
- [ ] fetchAll rejects if any single fetch fails
- [ ] fetch with network error (fetch rejects, not just non-ok)

---

### 1.4 filters.js

#### getEvents
- [x] returns all events with no filters (existing)
- [x] limits to selected modules (existing)
- [x] applies hidden + selected tri-state (existing)
- [x] filters by degree (existing)
- [ ] filters by degree AND semester combined
- [ ] hidden modules excludes their events
- [ ] hidden staff excludes events with that staff
- [ ] hidden locations excludes events at that location
- [ ] selected types only shows matching types
- [ ] selected staff only shows events with matching staff
- [ ] selected locations only shows events at matching location
- [ ] selected status only shows events with matching status
- [ ] combined selected modules from degree + "more" modules
- [ ] returns empty when all modules hidden
- [ ] event with multiple module_ids: included if any module matches

#### getHiddenEvents
- [ ] returns empty when no events are pinned
- [ ] hides similar events (same module + type) when one is pinned
- [ ] does not hide the pinned event itself
- [ ] does not hide events with different type even if same module
- [ ] handles pinned event ID not found in events gracefully
- [ ] multiple pinned events accumulate hidden events

#### clearFilters
- [ ] resets degree and semester to null
- [ ] clears all Sets (selectedModules, hiddenModules, etc.)
- [ ] resets all status values to null
- [ ] clears pinnedEvents
- [ ] calls update callback if set

#### createFilterRow (indirectly via DOM)
- [ ] creates row with correct data-key attribute
- [ ] creates row with correct data-state attribute
- [ ] click toggles tri-state via nextTriState
- [ ] disabled row has "dimmed" class

---

### 1.5 sharing_storage.js

#### saveState / restoreState (localStorage)
- [ ] saveState writes serialized state to localStorage
- [ ] restoreState reads and applies state from localStorage
- [ ] returns true on successful save
- [ ] returns false if localStorage throws

#### getShareLink
- [ ] includes degree param when set
- [ ] includes semester param when set
- [ ] includes selected modules as comma-separated
- [ ] includes pin param with pinned event IDs
- [ ] includes view and colorMode params
- [ ] includes darkMode param
- [ ] encodes status params with "status_" prefix
- [ ] does not include empty arrays/null values
- [ ] includes customMap entries when present

#### clearStateStorage
- [ ] removes the storage key from localStorage

#### restoreState priority
- [ ] URL params take precedence over localStorage
- [ ] falls back to localStorage if no URL params

---

### 1.6 popup.js

#### openPopup
- [ ] populates title from event data
- [ ] populates time with weekday, start and end
- [ ] populates location name from fetched locations
- [ ] shows "–" when location not found
- [ ] populates staff names joined by comma
- [ ] shows "–" when no staff found
- [ ] populates module names
- [ ] shows credits as single value or range
- [ ] shows "-" for credits when none available
- [ ] shows degree names from module→degree lookup
- [ ] hides degrees section when no degrees found
- [ ] sets pin button state based on pinnedEvents
- [ ] adds "show" class to popup element

#### initPopup
- [ ] close button removes "show" class
- [ ] clicking outside popup box removes "show" class

#### handleEventPin (via openPopup pin button)
- [ ] toggles pin state for event
- [ ] calls updatePopupCallback after toggle

---

### 1.7 calendar.js

#### buildCalendarEvents (indirectly via updateCalendar)
- [ ] maps event weekday to FullCalendar daysOfWeek (weekday % 7)
- [ ] adds "pinned" class for pinned events
- [ ] includes module names in extendedProps
- [ ] sets color from getEventColor

#### getFixedMonday
- [ ] returns a Monday (day of week = 1)

#### changeCalendarView
- [ ] updates view.value state
- [ ] does nothing if calendarInstance is null

---

## 2. Integration Tests

### 2.1 filters + state integration
- [ ] changing filterState.degree and calling getEvents reflects new filter
- [ ] adding to filterState.selectedModules and hiddenModules together works correctly
- [ ] pinning an event causes getHiddenEvents to exclude similar events from getEvents
- [ ] multiple filter dimensions combined: degree + type + staff

### 2.2 color + state integration
- [ ] changing colorMode.value and calling getEventColor returns different palettes
- [ ] getEventColor uses fetchedData.events for type-based coloring
- [ ] getEventColor with empty fetchedData returns fallback

### 2.3 sharing_storage + state integration
- [ ] saveState → restoreState round-trip preserves filterState
- [ ] saveState → restoreState preserves pinnedEvents
- [ ] saveState → restoreState preserves view, colorMode, darkMode
- [ ] getShareLink → applyParams round-trip preserves state
- [ ] saveFetchedData → loadFetchedDataAsync round-trip preserves data (localStorage fallback)

### 2.4 popup + state integration
- [ ] openPopup reads correct data from fetchedData
- [ ] pin toggle in popup updates pinnedEvents and re-renders

---

## 3. Functional Tests

### 3.1 Filter workflow
- [ ] selecting a degree shows only its modules' events, then selecting a module narrows further
- [ ] hiding a type removes those events, then un-hiding restores them
- [ ] selecting a status filters accordingly, disabling it shows all again
- [ ] clearFilters restores all events after complex filtering

### 3.2 Popup workflow
- [ ] opening popup → pinning event → closing → getEvents excludes similar events
- [ ] opening popup for non-existent event does nothing (no crash)

### 3.3 Color mode workflow
- [ ] switching color modes produces different colors for same event
- [ ] setColorUpdateCallback fires when mode changes via initColorEvents

### 3.4 Share link workflow
- [ ] applying filters → getShareLink → new page restoreState → same events visible
- [ ] share link with all filter types populated restores correctly

---

## 4. End-to-End Tests

### 4.1 Full app data flow
- [ ] fetch data → populate state → getEvents returns correct events → buildCalendarEvents maps them
- [ ] fetch data → apply filters → getEvents → updateCalendar cycle
- [ ] fetch fails → error propagation (no state corruption)

### 4.2 State persistence flow
- [ ] set filters → saveState → clear filters → restoreState → filters restored → getEvents matches
- [ ] URL params override localStorage: set different filters in both, URL wins

### 4.3 Pin + filter combined flow
- [ ] pin event → filter by degree → pinned event still affects hidden calculation
- [ ] pin event from one module → events of same module+type hidden → change degree → verify consistency

# 5. Additional Unit & Edge Case Tests (2026)

## 5.1 app.js

### initApp
- [ ] semesterBadge: handles missing #semesterBadge element gracefully
- [ ] semesterBadge: handles empty fetchedData.semesters array (no error, fallback to "Semester")
- [ ] semesterBadge: handles missing .name property on semester (fallback to "Semester")
- [ ] calls all init/update functions even if some DOM elements are missing
- [ ] does not throw if set*Callback functions are undefined
- [ ] loading overlay: handles missing #loadingOverlay element

### globalEventListeners
- [ ] resetAllBtn: does nothing if button missing
- [ ] shareLinkBtn: does nothing if button missing
- [ ] shareLinkBtn: handles clipboard writeText rejection (shows error message)
- [ ] shareLinkBtn: handles missing #shareLinkSuccessMSg element
- [ ] shareLinkBtn: handles missing #shareLink element
- [ ] shareLinkBtn: handles missing #share-link-popup element
- [ ] shareLinkCloseBtn: does nothing if button missing
- [ ] shareLinkPopup: does nothing if popup missing
- [ ] shareLinkPopup: clicking outside popup box with no .popup-box element does not throw
- [ ] weitereToggle: does nothing if button missing
- [ ] weitereExp: does nothing if #weitereExp missing

### update
- [ ] calls updateFilters, updateCalendar, and saveState in order

## 5.2 calendar.js

### initCalendar
- [ ] does nothing if #calendar element is missing
- [ ] creates calendarInstance with correct initial view from view.value
- [ ] sets up .vbtn click handlers for all present buttons
- [ ] handles missing .vbtn elements gracefully
- [ ] does not throw if FullCalendar is undefined (simulate missing import)

### buildCalendarEvents
- [ ] returns empty array if input events is empty
- [ ] handles events with missing/empty module_ids array
- [ ] handles events with module_ids referencing non-existent modules (moduleNames empty)
- [ ] sets fallback color if getEventColor returns falsy
- [ ] sets pinned class only for pinned events
- [ ] event id is always stringified
- [ ] typeShort is always "?" (hardcoded)
- [ ] statusColor is always "#6b7280" (hardcoded)

### getFixedMonday
- [ ] returns a Date object
- [ ] always returns a Monday (getDay() === 1)
- [ ] edge case: when today is Sunday (getDay()===0), returns previous Monday

### changeCalendarView
- [ ] does nothing if calendarInstance is null
- [ ] updates view.value to new viewName

### updateCalendar
- [ ] exits early if calendarInstance is null
- [ ] removes all events before adding new ones
- [ ] adds correct number of events from buildCalendarEvents

### renderEventContent
- [ ] sets CSS variables for color and contrast
- [ ] creates title, meta, dot, and pin elements
- [ ] attaches pin click handler
- [ ] handles missing/empty moduleNames array
- [ ] handles missing getContrastTextColor function (simulate error)

## 5.3 filters.js

### getEvents
- [ ] returns [] if fetchedData.events is empty
- [ ] returns [] if fetchedData.modules is empty
- [ ] returns only events matching selectedModules, hiddenModules, selectedTypes, hiddenTypes, selectedStaff, hiddenStaff, selectedLocations, hiddenLocations, and status filters
- [ ] returns [] if all modules are hidden
- [ ] returns [] if event.module_ids is empty
- [ ] returns [] if event's module_ids do not match any selected or degree modules
- [ ] returns [] if event is hidden by getHiddenEvents
- [ ] returns all events if no filters are set and nothing is hidden
- [ ] supports selecting modules outside current degree ("more modules")
- [ ] supports combining hidden and selected on same dimension (e.g. selected + hidden types)
- [ ] supports all filter dimensions simultaneously

### getHiddenEvents
- [ ] returns [] if no events are pinned
- [ ] does not hide the pinned event itself
- [ ] hides events sharing ANY module with same type as pinned event
- [ ] handles multiple pinned events (accumulates hidden events)
- [ ] does not deduplicate hidden events (BUG: duplicates possible)
- [ ] handles pinned event ID not found in events gracefully

### clearFilters
- [ ] resets all filterState properties to default
- [ ] clears pinnedEvents
- [ ] calls updateCallback if set
- [ ] does not throw if updateCallback is null

### createFilterRow
- [ ] creates row with correct data-key and data-state attributes
- [ ] click toggles tri-state via nextTriState
- [ ] disabled row has "dimmed" class
- [ ] always attaches click handler even when disabled (BUG: `if (true)` dead branch)
- [ ] count label reflects event count

### fillDegreesSemesters
- [ ] handles missing degreeEl, semesterEl, or semFilterSec elements
- [ ] handles empty fetchedData.degrees array
- [ ] handles degree with no semesters

### fillModules
- [ ] handles missing moduleCon or moreModuleCon elements
- [ ] handles empty fetchedData.modules array
- [ ] handles modules with no events

### fillTypes, fillStates, fillStaff, fillLocations
- [ ] handle missing container elements
- [ ] handle empty fetchedData.events, states, staff, or locations arrays
- [ ] skip types/staff/locations with no events unless selected
# Frontend Test Cases

## 1. Unit Tests

### 1.1 state.js

#### nextTriState
- [x] cycles neutral → selected → hidden → neutral (existing)
- [x] returns neutral for unknown/invalid input (existing)
- [x] returns neutral for empty string (existing)
- [x] returns neutral for undefined (existing)

#### WEEKDAY_LABELS
- [x] maps numbers 1–7 to German weekday names (existing)
- [x] does not have keys outside 1–7 (existing)
- [x] has exactly 7 entries (existing)

#### TRI constants
- [x] TRI.NEUTRAL is "neutral" (existing)
- [x] TRI.SELECTED is "selected" (existing)
- [x] TRI.HIDDEN is "hidden" (existing)

#### fetchedData defaults
- [x] all arrays start empty (existing)
- [x] states has 5 predefined entries with correct keys (ok, tok, pok, alt, reserve) (existing)

#### filterState defaults
- [x] degree and semester are null by default (existing)
- [x] all Sets are empty (existing)
- [x] all status values are null (existing)

#### pinnedEvents
- [x] is an empty Set initially (existing)

#### view / colorMode / darkMode
- [x] view defaults to "timeGridWeek" (existing)
- [x] colorMode defaults to "type" (existing)
- [x] darkMode defaults based on matchMedia (or true if unavailable) (existing)

---

### 1.2 color.js

#### generatePalette
- [x] returns requested number of colors (existing)
- [x] supports deterministic overrides (existing)
- [x] returns empty array for count 0 (existing)
- [x] single color uses t=0.5 midpoint values (existing)
- [x] all colors are unique for small palette (e.g. 10) (existing)
- [x] uses golden angle spacing – hue increases by 137.508 per step (existing)
- [x] respects custom hueOffset (existing)
- [ ] negative count returns empty array (edge case / BUG: negative count causes loop issue)
- [x] large palette (100+ colors) returns correct length (existing)

#### getEventColor
- [x] returns color from type palette when colorMode is "type" (existing)
- [x] returns color from module palette when colorMode is "module" (existing)
- [x] returns color from status palette when colorMode is "status" (existing)
- [x] returns color from staff palette when colorMode is "staff" (existing)
- [x] returns fallback color for "custom" mode (currently unimplemented) (existing)
- [x] returns fallback color for unknown color mode (existing)
- [x] different events get different colors in type mode when types differ (existing)
- [ ] returns undefined for module mode when event has no module_ids (BUG: module_ids[0] undefined)
- [ ] returns undefined for staff mode when event has no staff_ids (BUG: staff_ids[0] undefined)
- [ ] type mode with single unique type gives all events the same color
- [ ] module mode returns undefined when event's module not in fetchedData.modules (BUG)

#### getContrastTextColor
- [x] returns "#000000" when canvas context is unavailable (existing)

#### setColorUpdateCallback
- [x] stores the callback function (existing)

---

### 1.3 api.js

#### apiFetch (via public wrappers)
- [x] fetchDegrees calls correct endpoint (existing)
- [x] throws on non-ok responses (existing)
- [x] fetchAll calls all endpoints (existing)
- [x] individual wrappers delegate to correct paths (existing)
- [x] fetchDegreeDetail includes id in URL path (existing)
- [x] fetchDegreeDetail throws on non-ok response (existing)
- [x] fetchAll rejects if any single fetch fails (existing)
- [x] fetch with network error (fetch rejects, not just non-ok) (existing)

---

### 1.4 filters.js

#### getEvents
- [x] returns all events with no filters (existing)
- [x] limits to selected modules (existing)
- [x] applies hidden + selected tri-state (existing)
- [x] filters by degree (existing)
- [x] filters by degree AND semester combined (existing)
- [x] hidden modules excludes their events (existing)
- [x] hidden staff excludes events with that staff (existing)
- [x] hidden locations excludes events at that location (existing)
- [x] selected types only shows matching types (existing)
- [x] selected staff only shows events with matching staff (existing)
- [x] selected locations only shows events at matching location (existing)
- [x] selected status only shows events with matching status (existing)
- [x] combined selected modules from degree + "more" modules (existing)
- [x] returns empty when all modules hidden (existing)
- [x] event with multiple module_ids: included if any module matches (existing)
- [x] hidden status excludes events with that status (existing)
- [x] hidden types excludes events of that type (existing)
- [ ] degree filter uses `in` operator on degree_ids (checks string key existence)
- [ ] selecting a module outside current degree ("more modules") includes its events
- [ ] combining hidden and selected on same dimension (e.g. selected + hidden types)
- [ ] event with empty module_ids never matches any module filter
- [ ] all filter dimensions simultaneously: degree + semester + module + type + status + staff + location
- [ ] hidden events from pinned are excluded even when they match all filters
- [ ] getEvents with entirely empty fetchedData.events returns []
- [ ] getEvents with empty fetchedData.modules returns []

#### getHiddenEvents
- [x] returns empty when no events are pinned (existing)
- [x] hides similar events (same module + type) when one is pinned (existing)
- [x] does not hide the pinned event itself (existing)
- [x] does not hide events with different type even if same module (existing)
- [x] handles pinned event ID not found in events gracefully (existing)
- [x] multiple pinned events accumulate hidden events (existing)
- [ ] pinning two events of same module+type: both stay visible, no duplicates in hidden
- [ ] hidden events may contain duplicates when multiple pins overlap (BUG: no dedup)
- [ ] event with multiple module_ids: pinning hides events sharing ANY module with same type

#### clearFilters
- [x] resets degree and semester to null (existing)
- [x] clears all Sets (selectedModules, hiddenModules, etc.) (existing)
- [x] resets all status values to null (existing)
- [x] clears pinnedEvents (existing)
- [x] calls update callback if set (existing)
- [ ] does not throw if callback is null

#### createFilterRow (internal, tested via updateFilters DOM)
- [ ] creates row with correct data-key attribute
- [ ] creates row with correct data-state attribute
- [ ] click toggles tri-state via nextTriState
- [ ] disabled row has "dimmed" class
- [ ] always attaches click handler even when disabled (BUG: `if (true)` dead branch)
- [ ] count label reflects event count

---

### 1.5 sharing_storage.js

#### saveState / restoreState
- [x] saveState writes serialized state to localStorage (existing)
- [x] restoreState reads and applies state from localStorage (existing)
- [x] returns true on successful save (existing)
- [ ] returns false if localStorage throws

#### getShareLink
- [x] includes degree param when set (existing)
- [x] includes semester param when set (existing)
- [x] includes selected modules as comma-separated (existing)
- [x] includes pin param with pinned event IDs (existing)
- [x] includes view and colorMode params (existing)
- [x] includes darkMode param (existing)
- [x] encodes status params with "status_" prefix (existing)
- [x] does not include null degree (existing)
- [x] includes customMap entries when present (existing)
- [ ] does not include empty Sets (no sm/hm/st/ht/ss/hs/sl/hl when empty)
- [ ] round-trips share link via URL params restoreState

#### clearStateStorage
- [x] removes the storage key from localStorage (existing)

#### restoreState priority
- [x] URL params take precedence over localStorage (existing)
- [x] falls back to localStorage if no URL params (existing)
- [x] restoreState does nothing when localStorage is empty and no URL params (existing)
- [ ] handles malformed JSON in localStorage gracefully
- [ ] ignores unknown status values in URL params

#### saveFetchedData / loadFetchedDataAsync
- [x] saveFetchedData returns true (existing)
- [x] loadFetchedDataAsync returns data from localStorage fallback (existing)
- [x] loadFetchedDataAsync returns null when nothing stored (existing)

---

### 1.6 popup.js

#### openPopup
- [x] populates title from event data (existing)
- [x] populates type from event data (existing)
- [x] populates time with weekday, start and end (existing)
- [x] populates location name from fetched locations (existing)
- [x] shows dash when location not found (existing)
- [x] populates staff names joined by comma (existing)
- [x] shows dash when no staff found (existing)
- [x] populates module names (existing)
- [x] shows credits as single value or range (existing)
- [x] shows dash for credits when none available (existing)
- [x] shows degree names from module to degree lookup (existing)
- [x] hides degrees section when no degrees found (existing)
- [x] sets pin button state based on pinnedEvents (existing)
- [x] adds "show" class to popup element (existing)
- [x] does nothing for non-existent event (existing)
- [ ] shows single credit value with "LP" when all modules have same credits
- [ ] deduplicates staff names
- [ ] deduplicates degree names
- [ ] popup with event weekday 0 or >7 shows empty weekday label (BUG: WEEKDAY_LABELS undefined)
- [ ] re-opening popup for different event replaces old data
- [ ] pin button accumulates event listeners on repeated openPopup calls (BUG: no removeEventListener)

#### initPopup
- [x] close button removes "show" class (existing)
- [x] clicking outside popup box removes "show" class (existing)
- [x] clicking inside popup box does NOT remove "show" class (existing)

#### handleEventPin
- [x] toggles pin state for event (existing)
- [x] calls updatePopupCallback after toggle (existing)
- [ ] does nothing when eventId is NaN

---

### 1.7 calendar.js (NEW — no existing tests)

#### buildCalendarEvents (tested indirectly)
- [ ] maps weekday 1 (Monday) to fcDay 1
- [ ] maps weekday 7 (Sunday) to fcDay 0
- [ ] maps weekday 6 (Saturday) to fcDay 6
- [ ] adds "pinned" class for pinned events
- [ ] empty class list for unpinned events
- [ ] includes module names in extendedProps
- [ ] sets fallback color "#3B82F6" when getEventColor returns falsy
- [ ] typeShort is always "?" (hardcoded, maps commented out)
- [ ] statusColor is always "#6b7280" (hardcoded)
- [ ] event id is stringified in fc event
- [ ] empty events array produces empty fc events
- [ ] event with module_ids referencing non-existent modules: empty moduleNames

#### getFixedMonday
- [ ] returns a date that is a Monday (getDay() === 1)
- [ ] BUG edge case: when today is Sunday, getDay()===0 path may produce wrong week

#### changeCalendarView
- [ ] updates view.value state
- [ ] does nothing if calendarInstance is null

#### setCalendarUpdateCallback / setOpenPopupCallback
- [ ] stores callback without error

#### updateCalendar
- [ ] exits early if calendarInstance is null

#### onPinToggle (internal via rendered event pin click)
- [ ] adds event to pinnedEvents if not present
- [ ] removes event from pinnedEvents if present
- [ ] calls updateCalendarCallback after toggle

#### initCalendar
- [ ] creates FullCalendar instance and renders
- [ ] does nothing if #calendar element is missing
- [ ] sets up view toggle buttons (.vbtn)

---

### 1.8 app.js (NEW — no existing tests)

#### initApp (tested via DOMContentLoaded simulation)
- [ ] sets semester badge text from fetchedData.semesters[0].name
- [ ] falls back to "Semester" when name is nullish
- [ ] calls updateFilters, initCalendar, updateCalendar, initColorEvents, initPopup
- [ ] hides loading overlay by adding "hidden" class
- [ ] sets up filter/calendar/color/popup callbacks

#### globalEventListeners
- [ ] resetAllBtn click clears state storage and filters
- [ ] shareLinkBtn click copies share link to clipboard
- [ ] shareLinkCloseBtn closes share link popup
- [ ] clicking outside share link popup box closes it
- [ ] weitereToggle toggles "open" class on #weitereExp

#### update
- [ ] calls updateFilters, updateCalendar, and saveState

---

## 2. Integration Tests (existing)

### 2.1 Filters + State
- [x] changing filterState.degree and calling getEvents reflects new filter
- [x] pinning an event causes getHiddenEvents to exclude similar events from getEvents
- [x] multiple filter dimensions combined: degree + type + staff

### 2.2 Color + State
- [x] changing colorMode.value and calling getEventColor returns different palettes
- [x] getEventColor with empty fetchedData returns fallback

### 2.3 Storage + State
- [x] saveState/restoreState round-trip preserves filterState
- [x] getShareLink/applyParams round-trip preserves state
- [x] saveFetchedData/loadFetchedDataAsync round-trip (localStorage fallback)

### 2.4 Popup + State
- [x] openPopup reads correct data from fetchedData
- [x] pin toggle in popup updates pinnedEvents and re-renders

---

## 3. Functional Tests (existing)

- [x] selecting a degree shows only its modules events, then selecting module narrows further
- [x] hiding a type removes events, un-hiding restores them
- [x] selecting a status filters accordingly, disabling shows all again
- [x] clearFilters restores all events after complex filtering
- [x] opening popup, pinning event, closing: getEvents excludes similar events
- [x] switching color modes produces different colors for same event
- [x] applying filters then getShareLink then restoreState: same events visible

---

## 4. End-to-End Tests (existing)

- [x] fetch data, populate state, getEvents, buildCalendarEvents flow
- [x] fetch data, apply filters, getEvents, updateCalendar cycle
- [x] fetch fails: error propagation, no state corruption
- [x] set filters, saveState, clear, restoreState, filters restored
- [x] URL params override localStorage
- [x] pin event, filter by degree, pinned event still affects hidden calculation

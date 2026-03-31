# Frontend Test Cases — Pfadüberdeckung (Path Coverage)

Legend: `[x]` = existing test, `[ ]` = new test to add, `(BUG)` = documents a potential bug

---

## 1. Unit Tests

### 1.1 state.js

#### nextTriState
Paths: TRI_CYCLE indexOf returns 0/1/2 or -1 (unknown input)
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
Paths: count=0 (empty loop), count=1 (t=0.5), count>1 (full loop), opts provided/absent
- [x] returns requested number of colors (existing)
- [x] supports deterministic overrides (existing)
- [x] returns empty array for count 0 (existing)
- [x] single color uses t=0.5 midpoint values (existing)
- [x] all colors are unique for small palette (e.g. 10) (existing)
- [x] uses golden angle spacing – hue increases by ~137.508 per step (existing)
- [x] respects custom hueOffset (existing)
- [x] large palette (100+) returns correct length (existing)
- [ ] negative count returns empty array (loop never executes)
- [ ] count=2: t goes from 0 to 1, covers both ends of lightness/chroma sine curves
- [ ] hue wraps around 360° for large index (e.g. hueOffset=350, i=1 → 350+137.508 mod 360)

#### getEventColor
Paths per switch case: type / module / status / staff / custom / default fallback
Sub-paths: colorMap.get() returns a value vs undefined (event property not in map)
- [x] returns color from type palette when colorMode is "type" (existing)
- [x] returns color from module palette when colorMode is "module" (existing)
- [x] returns color from status palette when colorMode is "status" (existing)
- [x] returns color from staff palette when colorMode is "staff" (existing)
- [x] returns fallback color for "custom" mode (existing)
- [x] returns fallback color for unknown color mode (existing)
- [x] different events get different colors in type mode when types differ (existing)
- [ ] type mode: event.type not in fetchedData.events types → returns undefined (BUG: no fallback inside switch)
- [ ] module mode: event.module_ids is empty → event.module_ids[0] is undefined → colorMap.get(undefined) → returns undefined (BUG)
- [ ] staff mode: event.staff_ids is empty → event.staff_ids[0] is undefined → colorMap.get(undefined) → returns undefined (BUG)
- [ ] module mode: event.module_ids[0] references an id in fetchedData.modules → returns valid color from palette
- [ ] status mode: event.status is not in fetchedData.states keys → colorMap.get() returns undefined (BUG)
- [ ] type mode: all events have the same type → palette has length 1 → all events get same color
- [ ] staff mode: event with multiple staff_ids only uses staff_ids[0] for color lookup
- [ ] returns undefined for staff mode when event has no staff_ids (BUG: staff_ids[0] undefined)
- [ ] type mode with single unique type gives all events the same color
- [ ] module mode returns undefined when event's module not in fetchedData.modules (BUG)

#### getContrastTextColor
Paths: ctx is null (return "#000000"), resolvedBg empty → fallback "#ffffff", high luminance → "#000000", low luminance → "#ffffff"
- [x] returns "#000000" when canvas context is unavailable (existing)
- [ ] returns "#ffffff" for very dark background color
- [ ] returns "#000000" for very light background color
- [ ] uses fallback "#ffffff" as bg when resolvedBg and bgColor are both empty

#### setColorUpdateCallback
- [x] stores the callback function (existing)

#### initColorEvents (DOM-dependent)
Paths: #colorDropBtn exists/missing, .color-menu-item click, #themeToggle click, updateColorCallback null/set
- [ ] clicking colorDropBtn toggles "open" class on #colorDrop
- [ ] clicking outside #colorDrop removes "open" class
- [ ] clicking a color-menu-item updates colorMode.value and calls updateColorCallback
- [ ] clicking a color-menu-item when updateColorCallback is null does not throw
- [ ] clicking #themeToggle toggles darkMode.value and calls updateColorCallback
- [ ] clicking #themeToggle when updateColorCallback is null does not throw
- [ ] applyColorModeUI sets active class only on matching mode item
- [ ] applyColorModeUI sets label text from COLOR_MODE_LABELS or falls back to mode string itself

---

### 1.3 api.js

#### apiFetch (via public wrappers)
Paths: res.ok=true → json(), res.ok=false → throw, fetch rejects (network error)
- [x] fetchDegrees calls correct endpoint (existing)
- [x] throws on non-ok responses (existing)
- [x] fetchAll calls all endpoints (existing)
- [x] individual wrappers delegate to correct paths (existing)
- [x] fetchDegreeDetail includes id in URL path (existing)
- [x] fetchDegreeDetail throws on non-ok response (existing)
- [x] fetchAll rejects if any single fetch fails (existing)
- [x] fetch with network error (fetch rejects, not just non-ok) (existing)
- [ ] fetchModules calls /modules?include_relationships=true
- [ ] fetchEvents calls /events?include_relationships=true
- [ ] fetchStaff calls /staff
- [ ] fetchLocations calls /locations
- [ ] fetchSemesters calls /semesters
- [ ] fetchAll returns results in correct order [degrees, modules, events, staff, locations, semesters]

---

### 1.4 filters.js

#### getEvents
Major branch tree:
1. filterState.degree !== null → yes / no
2. filterState.semester !== null → yes / no (only when degree set)
3. selectedDegreeModules.length > 0 → yes / no
4. moreSelectedModules present → yes / no
5. hiddenModules filtering
6. For each event: module match, status hidden, staff hidden, location hidden, type hidden
7. Status selected filter path (Object.values(...).filter(el => el === SELECTED).length > 0)
8. Type selected path
9. Staff selected path
10. Location selected path
11. getHiddenEvents() exclusion at the end

- [x] returns all events when no filters are active (existing)
- [x] limits to selected module ids (existing)
- [x] applies hidden and selected tri-state filters (existing)
- [x] filters by degree modules when degree is selected (existing)
- [x] filters by degree AND semester combined (existing)
- [x] hidden modules excludes their events (existing)
- [x] hidden staff excludes events with that staff (existing)
- [x] hidden locations excludes events at that location (existing)
- [x] selected types only shows matching types (existing)
- [x] selected staff only shows events with matching staff (existing)
- [x] selected locations only shows events at matching location (existing)
- [x] selected status only shows events with matching status (existing)
- [x] returns empty when all modules hidden (existing)
- [x] event with multiple module_ids: included if any module matches (existing)
- [x] combined selected modules from degree + more modules (existing)
- [x] hidden status excludes events with that status (existing)
- [x] hidden types excludes events of that type (existing)
- [ ] degree set + no semester + no selected modules → all degree modules pass through (branch: selectedDegreeModules.length === 0)
- [ ] degree set + semester set + no modules match semester → events list is empty
- [ ] degree set + selectedModules includes a degree module AND a non-degree module → both paths merge
- [ ] all filter dimensions active simultaneously: degree + semester + selectedModule + hiddenModule + selectedType + hiddenType + selectedStatus + hiddenStatus + selectedStaff + hiddenStaff + selectedLocation + hiddenLocation
- [ ] event with empty module_ids → el.module_ids.some(...) returns false → event excluded
- [ ] all filter dimensions simultaneously: degree + semester + module + type + status + staff + location
- [ ] hidden events from pinned are excluded even when they match all filters
- [ ] getEvents with entirely empty fetchedData.events returns []
- [ ] getEvents with empty fetchedData.modules returns []
- [ ] event hidden by getHiddenEvents (pinned event) is excluded even though it passes all filters
- [ ] selected staff with event having multiple staff_ids: passes if ANY staff matches (.some())
- [ ] hidden staff with event having multiple staff_ids: excluded if ANY staff matches (.some())
- [ ] degree filter uses in operator on degree_ids object — checks string key existence (potential type coercion BUG)
- [ ] completely empty fetchedData.events → returns []
- [ ] completely empty fetchedData.modules → returns [] (no module ids match anything)
- [ ] selected modules that don't exist in fetchedData.modules still form the module list but no events match them
- [ ] hiddenModules filters out modules even when selectedDegreeModules selected them
- [ ] one status SELECTED + another status HIDDEN: only selected status events shown, hidden ones also excluded

#### getHiddenEvents
Paths: no pinned events, pinned event not found, pinned found + similar events exist, multiple pins
- [x] returns empty when no events are pinned (existing)
- [x] hides similar events (same module + type) when one is pinned (existing)
- [x] does not hide the pinned event itself (existing)
- [x] does not hide events with different type even if same module (existing)
- [x] handles pinned event ID not found in events gracefully (existing)
- [x] multiple pinned events accumulate hidden events (existing)
- [ ] pinning two events of same module+type: both stay visible, hidden accumulates non-pinned events of that type+module
- [ ] hidden list may contain duplicates when two pinned events overlap on hidden targets (BUG: no dedup in hidden.concat)
- [ ] event with multiple module_ids: pinning it hides events sharing ANY module_id with same type (.some() path)
- [ ] pinned event whose module_ids is empty: pinnedEvent.module_ids.includes(id) never true → no events hidden

#### clearFilters
Paths: updateCallback is null vs set
- [x] resets degree and semester to null (existing)
- [x] clears all Sets (existing)
- [x] resets all status values to null (existing)
- [x] clears pinnedEvents (existing)
- [x] calls update callback if set (existing)
- [ ] does not throw if updateCallback is null

#### createFilterRow (internal, tested via updateFilters DOM)
- [ ] creates row with correct data-key attribute
- [ ] creates row with correct data-state attribute
- [ ] click toggles tri-state via nextTriState
- [ ] disabled row has "dimmed" class
- [ ] always attaches click handler even when disabled (BUG: `if (true)` dead branch)
- [ ] count label reflects event count

#### updateFilters (DOM-dependent)
Paths: degreeEl/semesterEl missing (early return), degree selected vs not, semester display toggle, module list generation, weitere section toggle
- [ ] with no DOM elements: returns without error (all querySelector return null)
- [ ] with DOM: fills degree dropdown with sorted degree names
- [ ] degree selected: shows semester filter section, fills semester options
- [ ] degree not selected: hides semester filter section
- [ ] degree selected + semester selected: modules filtered by both
- [ ] module list shows count of matching events for each module
- [ ] module with 0 events and NEUTRAL state gets dimmed class
- [ ] weitere section visible when moreModules.length > 0, hidden when 0
- [ ] type list shows all unique types from fetchedData.events, sorted
- [ ] state list shows all states from fetchedData.states with correct counts
- [ ] staff list hides staff with 0 events and NEUTRAL state (continue path)
- [ ] staff list shows staff with 0 events if they are SELECTED or HIDDEN
- [ ] location list hides locations with 0 events and NEUTRAL state (continue path)
- [ ] location list shows locations with 0 events if they are SELECTED or HIDDEN

#### createFilterRow (internal helper, tested via DOM)
Paths: disabled=true vs false, click handler toggles tri-state, if (true) always-true branch
- [ ] creates row div with class frow and correct data-key and data-state
- [ ] disabled=true adds dimmed class to row and tri span
- [ ] disabled=false: no dimmed class
- [ ] clicking row toggles tri-state: neutral→selected→hidden→neutral cycle
- [ ] click handler calls provided handler function with event
- [ ] count span shows the count number as text
- [ ] if (true) always attaches click handler even when disabled (BUG: dead code branch)

#### handleDegreeSelect (internal, tested via DOM event)
Paths: selected value is numeric string → parseInt, selected value is "" → degree=null, updateCallback null vs set
- [ ] selecting a degree option sets filterState.degree to the parsed integer
- [ ] selecting "Alle" (empty value) sets filterState.degree to null
- [ ] always resets filterState.semester to null
- [ ] calls updateCallback when set
- [ ] does not throw when updateCallback is null

#### handleSemesterSelect (internal, tested via DOM event)
Paths: selected value is numeric string, selected value is "" → semester=null, updateCallback
- [ ] selecting a semester option sets filterState.semester to the parsed integer
- [ ] selecting "Alle" (empty value) sets filterState.semester to null
- [ ] calls updateCallback when set

#### handleModuleSelect (internal, tested via DOM event)
Paths: newState is SELECTED/HIDDEN/NEUTRAL, moduleId is valid number vs NaN
- [ ] SELECTED: adds to selectedModules, removes from hiddenModules
- [ ] HIDDEN: adds to hiddenModules, removes from selectedModules
- [ ] NEUTRAL: removes from both sets
- [ ] NaN moduleId: does not modify any sets, still calls updateCallback
- [ ] calls updateCallback when set

#### handleTypeSelect (internal, tested via DOM event)
Paths: newState is SELECTED/HIDDEN/NEUTRAL (no NaN check on typeId, it is a string)
- [ ] SELECTED: adds to selectedTypes, removes from hiddenTypes
- [ ] HIDDEN: adds to hiddenTypes, removes from selectedTypes
- [ ] NEUTRAL: removes from both sets
- [ ] calls updateCallback when set

#### handleStateSelect (internal, tested via DOM event)
Paths: sets filterState.status[key] to the new state value
- [ ] sets filterState.status[stateKey] to the provided newState
- [ ] calls updateCallback when set
- [ ] stateKey that is not a valid StatusKey: sets arbitrary key on status object (BUG: no validation)

#### handleStaffSelect (internal, tested via DOM event)
Paths: SELECTED/HIDDEN/NEUTRAL branches, staffId NaN (no-op + no callback call)
- [ ] SELECTED: adds to selectedStaff, removes from hiddenStaff
- [ ] HIDDEN: adds to hiddenStaff, removes from selectedStaff
- [ ] NEUTRAL: removes from both sets
- [ ] NaN staffId: does not modify any sets AND does not call updateCallback (callback is inside the if block)
- [ ] calls updateCallback only when staffId is valid

#### handleLocationSelect (internal, tested via DOM event)
Paths: SELECTED/HIDDEN/NEUTRAL branches, locationId NaN (no-op + no callback call)
- [ ] SELECTED: adds to selectedLocations, removes from hiddenLocations
- [ ] HIDDEN: adds to hiddenLocations, removes from selectedLocations
- [ ] NEUTRAL: removes from both sets
- [ ] NaN locationId: does not modify any sets AND does not call updateCallback
- [ ] calls updateCallback only when locationId is valid

---

### 1.5 sharing_storage.js

#### serializeState / applyState (internal helpers, tested via save/restore)
Paths in applyState: o is null/non-object (early return), each field present vs absent, type guards for each field
- [x] saveState writes serialized state to localStorage (existing)
- [x] restoreState reads and applies state from localStorage (existing)
- [x] returns true on successful save (existing)
- [ ] saveState returns false if localStorage throws (e.g. quota exceeded)
- [ ] applyState with null input: does nothing (early return path)
- [ ] applyState with non-object input (e.g. string): does nothing
- [ ] applyState with partial object: only applies present fields, leaves others unchanged
- [ ] applyState with o.d as string (not number): degree stays unchanged (typeof check fails)
- [ ] applyState with o.d as null: sets degree to null explicitly
- [ ] applyState with o.s as string: semester stays unchanged
- [ ] applyState with invalid status value (not null, not in VALID_TRI): sets to null
- [ ] applyState with valid status values (null, neutral, selected, hidden): applies correctly
- [ ] applyState with o.pin as non-array: pinnedEvents stays unchanged
- [ ] applyState with o.v as non-string: view stays unchanged
- [ ] applyState with o.dm as non-boolean: darkMode stays unchanged

#### setParam (internal helper)
Paths: value is null/undefined/"" → skip, value is array with length 0 → skip, array with items → join, scalar → set
- [ ] null value: param not set
- [ ] undefined value: param not set
- [ ] empty string: param not set
- [ ] empty array: param not set
- [ ] non-empty array: param set as comma-joined encoded values
- [ ] scalar value: param set as encoded string

#### getShareLink
- [x] includes degree param when set (existing)
- [x] includes semester param when set (existing)
- [x] includes selected modules as comma-separated (existing)
- [x] includes pin param with pinned event IDs (existing)
- [x] includes view and colorMode params (existing)
- [x] includes darkMode param (existing)
- [x] encodes status params with status_ prefix (existing)
- [x] does not include null degree (existing)
- [x] includes customMap entries when present (existing)
- [ ] does not include empty Sets in URL (sm/hm/st/ht/ss/hs/sl/hl omitted when empty)
- [ ] customMap with size 0: no cmap param in URL
- [ ] status entries with null value: no status_ param for that key
- [ ] all params present simultaneously: URL contains all expected keys
- [ ] special characters in type strings are properly encoded

#### clearStateStorage
- [x] removes the storage key from localStorage (existing)

#### restoreState
Paths: URL has state params → applyParams, URL has status_ params → recognized, no URL params → try localStorage, localStorage empty → no-op, localStorage has data → applyState, malformed JSON → catch
- [x] URL params take precedence over localStorage (existing)
- [x] falls back to localStorage if no URL params (existing)
- [x] restoreState does nothing when localStorage is empty and no URL params (existing)
- [ ] URL has only a status_ param (no standard keys): still detected as hasUrlState → applyParams path taken
- [ ] malformed JSON in localStorage: caught silently, state unchanged
- [ ] ignores unknown status values in URL params
- [ ] URL has d param with non-numeric value: filterState.degree set to null (parseInt → NaN → null)
- [ ] URL has s param with non-numeric value: filterState.semester set to null
- [ ] URL dm param with value false: darkMode.value set to false
- [ ] URL dm param with value true: darkMode.value set to true
- [ ] URL dm param with any other value: darkMode.value set to false (not === true)

#### applyParams (internal)
Paths per param: param present → parse and apply, param absent → skip. cmap parsing: entry with idx<1 skipped, k is NaN skipped, v is empty skipped
- [ ] sm with comma-separated numeric values: selectedModules populated correctly
- [ ] sm with non-numeric values: filtered out by !isNaN check
- [ ] st with comma-separated strings: selectedTypes populated correctly
- [ ] cmap with valid entries: customMap populated
- [ ] cmap entry with no colon (idx<1): entry skipped
- [ ] cmap entry with NaN key: entry skipped
- [ ] cmap entry with empty value after colon: entry skipped
- [ ] v param present: view.value updated, decoded
- [ ] cm param present: colorMode.value updated, decoded
- [ ] status_ok param with invalid value (not in VALID_TRI): ignored (VALID_TRI.has check)
- [ ] status_ok param with valid value (selected): applied

#### getNumArray / getStrArray (internal helpers)
Paths: param missing → [], param empty string → [], param with valid values → parsed array, non-numeric entries filtered
- [ ] missing param returns []
- [ ] param with 1,2,3 returns [1, 2, 3]
- [ ] param with a,b,c returns [] for getNumArray (all NaN)
- [ ] param with 1,,3 filters empty strings, returns [1, 3]
- [ ] getStrArray with encoded values decodes them correctly

#### saveFetchedData / loadFetchedDataAsync
Paths: indexedDB available → openDB → put, indexedDB open fails → fallback to localStorage, no indexedDB → localStorage, localStorage throws → return false, loadFetchedDataAsync: IDB available + data → return, IDB available + no data → fallback, no IDB → loadFetchedData (localStorage)
- [x] saveFetchedData returns true (existing)
- [x] loadFetchedDataAsync returns data from localStorage fallback (existing)
- [x] loadFetchedDataAsync returns null when nothing stored (existing)
- [ ] saveFetchedData with no IDB and localStorage throwing: returns false
- [ ] loadFetchedDataAsync with IDB returning data: returns IDB data (not localStorage)
- [ ] loadFetchedDataAsync with IDB empty: falls through to localStorage
- [ ] loadFetchedDataAsync with IDB throwing: falls through to localStorage
- [ ] loadFetchedData (localStorage) with malformed JSON: returns null (catch path)

#### showShareLinkSuccessMsg
Paths: #shareLinkSuccessMSg element exists vs missing
- [ ] sets textContent on #shareLinkSuccessMSg when element exists
- [ ] does nothing when element is missing (early return)

---

### 1.6 popup.js

#### openPopup
Paths: event not found → return, popupEl missing → return, event found → all fields populated, isPinned true/false, credits 0/1/multiple, degreeTexts empty (parent hidden) vs non-empty
- [x] populates title from event data (existing)
- [x] populates type from event data (existing)
- [x] populates time with weekday, start and end (existing)
- [x] populates location name from fetched locations (existing)
- [x] shows dash when location not found (existing)
- [x] populates staff names joined by comma (existing)
- [x] shows dash when no staff found (existing)
- [x] populates module names (existing)
- [x] shows credits as range when multiple different credits (existing)
- [x] shows dash for credits when no modules (existing)
- [x] shows degree names from module to degree lookup (existing)
- [x] hides degrees section when no degrees found (existing)
- [x] sets pin button state based on pinnedEvents — not pinned (existing)
- [x] sets pin button state based on pinnedEvents — pinned (existing)
- [x] adds show class to popup element (existing)
- [x] does nothing for non-existent event (existing)
- [ ] shows single credit value with "LP" when all modules have same credits
- [ ] deduplicates staff names
- [ ] deduplicates degree names
- [ ] popup with event weekday 0 or >7 shows empty weekday label (BUG: WEEKDAY_LABELS undefined)
- [ ] re-opening popup for different event replaces old data
- [ ] pin button accumulates event listeners on repeated openPopup calls (BUG: no removeEventListener)
- [ ] event not in fetchedData.events: no popup shown (return path)
- [ ] popup element missing from DOM: no error (return path)
- [ ] event.weekday outside 1-7 (e.g. 0 or 8): WEEKDAY_LABELS[weekday] is undefined → displays empty string via || "" (BUG)
- [ ] credits: single module → credits.length == 1 path → shows X LP
- [ ] credits: two modules with same credits → deduplicated by Set → credits.length == 1 path
- [ ] credits: module with credits=undefined → filtered out by x !== undefined → may reduce to 0
- [ ] staff names deduplicated by new Set(...) — duplicate staff_ids produce single name
- [ ] degree names deduplicated by new Set(degreeTexts) — no duplicates in display
- [ ] module not found in fetchedData.modules: .find() returns undefined → degree_ids loop skips it via if (!module) continue
- [ ] pin button listener: repeated openPopup calls accumulate addEventListener listeners (BUG: no removeEventListener before adding)
- [ ] statusState not found in fetchedData.states: shows empty string via ?? ""
- [ ] re-opening popup for different event: old data replaced by new data

#### initPopup
Paths: closeBtn missing, popup missing, click inside vs outside .popup-box
- [x] close button removes show class (existing)
- [x] clicking outside popup box removes show class (existing)
- [x] clicking inside popup box does NOT remove show class (existing)
- [ ] closeBtn missing from DOM: no event listener attached, no error
- [ ] popup element missing from DOM: no event listener attached, no error

#### handleEventPin (internal, via pin button click)
Paths: eventId is NaN → return, pinnedEvents.has(eventId) → delete, !has → add, updatePopupCallback null vs set, then openPopup re-called
- [x] toggles pin state for event (existing)
- [x] calls updatePopupCallback after toggle (existing)
- [ ] does nothing when eventId is NaN
- [ ] eventId is NaN (btn.dataset.eventId is non-numeric or empty): early return, no state change
- [ ] updatePopupCallback is null: does not throw after toggle
- [ ] after toggle, openPopup(eventId) is called to refresh pin button UI

---

### 1.7 calendar.js

#### setCalendarUpdateCallback / setOpenPopupCallback / getCalendar
- [ ] setCalendarUpdateCallback stores callback without error
- [ ] setOpenPopupCallback stores callback without error
- [ ] getCalendar returns null when initCalendar has not been called

#### initCalendar
Paths: #calendar element missing → return, element present → create FullCalendar, .vbtn click handlers, viewType week/day/list/other
- [ ] creates FullCalendar instance and renders
- [ ] does nothing if #calendar element is missing
- [ ] sets up view toggle buttons (.vbtn)
- [ ] #calendar element missing: returns without creating instance
- [ ] #calendar element present: creates FullCalendar instance (calendarInstance not null)
- [ ] .vbtn with data-view=week: calls changeCalendarView(timeGridWeek)
- [ ] .vbtn with data-view=day: calls changeCalendarView(timeGridDay)
- [ ] .vbtn with data-view=list: calls changeCalendarView(listWeek)
- [ ] .vbtn with data-view=unknown: no changeCalendar call (falls through switch default)
- [ ] .vbtn click: sets active class on clicked button, removes from siblings

#### changeCalendarView
Paths: calendarInstance is null → return, calendarInstance exists → changeView + update view.value
- [ ] calendarInstance is null: returns without error
- [ ] calendarInstance exists: calls changeView and updates view.value
- [ ] updates view.value state
- [ ] does nothing if calendarInstance is null

#### getFixedMonday
Paths: today is Monday (day=1), Tuesday-Saturday (day=2-6), Sunday (day=0 → special -6 path)
- [ ] returns a Date that is a Monday (getDay() === 1)
- [ ] when today is Monday: returns today
- [ ] when today is Wednesday: returns previous Monday
- [ ] when today is Sunday: day===0 → diff = date - 0 + (-6) → check correct Monday (BUG potential)
- [ ] when today is Saturday: day===6 → diff = date - 6 + 1 → returns previous Monday
- [ ] BUG edge case: when today is Sunday, getDay()===0 path may produce wrong week

#### buildCalendarEvents
Paths per event: pinned vs not, getEventColor returns falsy → fallback #3B82F6, moduleNames array has entries vs empty, weekday mapping (1-6 → same, 7 → 0)
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
- [ ] empty events array → returns []
- [ ] event with weekday=1 (Monday): fcDay = 1 % 7 = 1
- [ ] event with weekday=7 (Sunday): fcDay = 7 % 7 = 0
- [ ] event with weekday=6 (Saturday): fcDay = 6 % 7 = 6
- [ ] event with weekday=5 (Friday): fcDay = 5 % 7 = 5
- [ ] pinned event: classNames includes pinned
- [ ] unpinned event: classNames filtered to empty array
- [ ] getEventColor returns falsy/undefined: color falls back to #3B82F6
- [ ] getEventColor returns valid color: that color is used
- [ ] module_ids reference existing modules: moduleNames populated with names
- [ ] module_ids reference non-existent modules: .find() returns undefined → filtered out by .filter(Boolean) → empty moduleNames
- [ ] event id is stringified in FullCalendar event (id: String(ev.id))
- [ ] typeShort is always ? (commented-out map)
- [ ] statusColor is always #6b7280 (commented-out status colors)
- [ ] all fc event fields present: daysOfWeek, startTime, endTime, extendedProps, display, classNames

#### renderEventContent (internal, DOM-dependent)
Paths: props.moduleNames.length > 0 → meta element, length === 0 → no meta element, pin click handler
- [ ] creates div with ev-title containing typeShort + title
- [ ] moduleNames length > 0: creates ev-meta div with first module name
- [ ] moduleNames length === 0: no ev-meta div created
- [ ] creates sdot span with statusColor background
- [ ] creates ev-pin-icon span with click handler
- [ ] pin icon click calls onPinToggle with numeric event id
- [ ] pin icon click stopPropagation prevents event click handler

#### handleEventClick (internal)
Paths: openEventPopupCallback is null vs set
- [ ] calls openEventPopupCallback with numeric event id when set
- [ ] does nothing when openEventPopupCallback is null (no error)
- [ ] preventDefault is called on jsEvent

#### setCalendarUpdateCallback / setOpenPopupCallback
- [ ] stores callback without error

#### updateCalendar
Paths: calendarInstance is null → return early, calendarInstance exists → removeAllEvents + addEventSource
- [ ] calendarInstance is null: no error, returns early
- [ ] calendarInstance exists: removes old events and adds new source from getEvents + buildCalendarEvents

#### onPinToggle (internal)
Paths: event already pinned → delete, not pinned → add, updateCalendarCallback null vs set
- [ ] not pinned: adds to pinnedEvents
- [ ] already pinned: removes from pinnedEvents
- [ ] calls updateCalendarCallback when set
- [ ] does not throw when updateCalendarCallback is null

---

### 1.8 app.js

#### DOMContentLoaded handler
Paths: cachedData available → populate state + skip fetch, cachedData null → fetchAll + saveFetchedData, restoreState always called before data population
- [ ] cachedData available: populates fetchedData from cache, does not call fetchAll
- [ ] cachedData null: calls fetchAll, assigns results to fetchedData, calls saveFetchedData
- [ ] restoreState is called before data population
- [ ] initApp is called after data is ready

#### initApp
Paths: semesterBadge exists vs null, semesters[0].name truthy vs nullish
- [ ] sets semester badge text from fetchedData.semesters[0].name
- [ ] falls back to "Semester" when name is nullish
- [ ] semesterBadge element exists + semesters[0].name is truthy: sets textContent to name
- [ ] semesterBadge element exists + semesters[0].name is null: falls back to Semester
- [ ] semesterBadge element missing: no error (null check)
- [ ] calls updateFilters, initCalendar, updateCalendar, initColorEvents, initPopup in order
- [ ] sets filter/calendar/color/popup callbacks via setter functions
- [ ] hides loadingOverlay by adding hidden class
- [ ] loadingOverlay missing: no error (optional chaining)
- [ ] calls globalEventListeners at the end

#### update (internal)
- [ ] calls updateFilters, updateCalendar, saveState in sequence

#### globalEventListeners (internal)
Paths per button: element exists vs missing (optional chaining)

##### resetAllBtn
- [ ] #resetAllBtn click calls clearStateStorage and clearFilters
- [ ] #resetAllBtn missing: no error

##### shareLinkBtn click
Paths: clipboard.writeText succeeds vs fails, #shareLinkSuccessMSg exists vs missing, #shareLink exists vs missing, #share-link-popup exists vs missing
- [ ] click: generates share link, writes to clipboard
- [ ] clipboard success: shows Link wurde kopiert! message
- [ ] clipboard failure: shows Link konnte nicht kopiert werden! message
- [ ] #shareLinkSuccessMSg missing: no error on success/failure path
- [ ] #shareLink element: shows generated link text
- [ ] #share-link-popup: adds show class
- [ ] shareLinkCloseBtn closes share link popup
- [ ] clicking outside share link popup box closes it
- [ ] weitereToggle toggles "open" class on #weitereExp

##### shareLinkCloseBtn / shareLinkPopup
- [ ] #shareLinkCloseBtn click: removes show from #share-link-popup
- [ ] #share-link-popup click outside .popup-box: removes show
- [ ] #share-link-popup click inside .popup-box: does not remove show
- [ ] #shareLinkCloseBtn missing: no event listener, no error
- [ ] #share-link-popup missing: no event listener, no error

##### weitereToggle
- [ ] #weitereToggle click: toggles open class on #weitereExp
- [ ] #weitereToggle missing: no error
- [ ] #weitereExp missing: no error (optional chaining)

---

## 2. Integration Tests (existing)

### 2.1 Filters + State
- [x] changing filterState.degree and calling getEvents reflects new filter
- [x] pinning an event causes getHiddenEvents to exclude similar events from getEvents
- [x] multiple filter dimensions combined: degree + type + staff
- [x] adding to selectedModules and hiddenModules together works correctly

### 2.2 Color + State
- [x] changing colorMode.value and calling getEventColor returns different palettes
- [x] getEventColor with empty fetchedData returns undefined (no matching entry)
- [x] getEventColor uses fetchedData.events for type-based coloring

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

- [x] fetch data, populate state, getEvents, getEventColor, buildCalendarEvents flow
- [x] fetch data, apply filters, getEvents, updateCalendar cycle
- [x] fetch fails: error propagation, no state corruption
- [x] set filters, saveState, clear, restoreState, filters restored
- [x] URL params override localStorage
- [x] pin event, filter by degree, pinned event still affects hidden calculation

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
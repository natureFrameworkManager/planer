# Frontend Test Cases — Pfadüberdeckung (Path Coverage)

Legend: `[x]` = existing test, `[ ]` = new test to add, `(BUG)` = documents a potential bug

---

## 1. Unit Tests

### 1.1 state.js

#### nextTriState
Paths: TRI_CYCLE indexOf returns 0/1/2 or -1 (unknown input)
- [x] cycles neutral → selected → hidden → neutral
- [x] returns neutral for unknown/invalid input
- [x] returns neutral for empty string
- [x] returns neutral for undefined

#### WEEKDAY_LABELS
- [x] maps numbers 1–7 to German weekday names
- [x] does not have keys outside 1–7
- [x] has exactly 7 entries

#### TRI constants
- [x] TRI.NEUTRAL is "neutral"
- [x] TRI.SELECTED is "selected"
- [x] TRI.HIDDEN is "hidden"
- [ ] TRI values are unique (no duplicates)
- [ ] TRI values are not empty strings
- [ ] TRI only has the expected keys (NEUTRAL, SELECTED, HIDDEN)

#### fetchedData defaults
- [x] all arrays start empty
- [x] states has 5 predefined entries with correct keys (ok, tok, pok, alt, reserve)
- [ ] fetchedData has the keys degrees, modules, events, staff, locations, semesters (no extra keys)

#### filterState defaults
- [x] degree and semester are null by default
- [x] all Sets are empty
- [x] all status values are null
- [ ] filterState only has the expected keys (degree, semester, status, selectedModules, hiddenModules, selectedTypes, hiddenTypes, selectedStaff, hiddenStaff, selectedLocations, hiddenLocations)

#### pinnedEvents
- [x] is an empty Set initially

#### view / colorMode / darkMode
- [x] view defaults to "timeGridWeek"
- [x] colorMode defaults to "type"
- [x] darkMode defaults based on matchMedia (or true if unavailable)

---

### 1.2 color.js

#### generatePalette
Paths: count=0 (empty loop), count=1 (t=0.5), count>1 (full loop), opts provided/absent
- [x] returns requested number of colors
- [x] supports deterministic overrides
- [x] returns empty array for count 0
- [x] single color uses t=0.5 midpoint values
- [x] all colors are unique for small palette (e.g. 10)
- [x] uses golden angle spacing – hue increases by ~137.508 per step
- [x] respects custom hueOffset
- [x] large palette (100+) returns correct length
- [x] negative count returns empty array (loop never executes)
- [x] count=2: t goes from 0 to 1, covers both ends of lightness/chroma sine curves
- [x] hue wraps around 360° for large index (e.g. hueOffset=350, i=1 → 350+137.508 mod 360)
- [ ] implements caching for repeated calls with same count and options (not just a cache object, but actually returns cached result)
- [ ] handles non-integer count by flooring or throwing
- [ ] handles non-numeric count by throwing or returning empty array
- [ ] handles negative hueOffset by correctly applying modulo to wrap into 0-360 range
- [ ] handles non-numeric hueOffset by throwing or defaulting to 0
- [ ] handles non-integer hueOffset by flooring or throwing
- [ ] handles options object with extra keys without affecting output
- [ ] handles options object with values for the other parameters (e.g. saturation, lightness) by clamping to valid ranges
- [ ] handles options object with missing keys by using default values
- [ ] handles invalid options object (e.g. not an object) by using defaults
- [ ] handles very large count (e.g. 1000) without performance issues

#### getEventColor
Paths per switch case: type / module / status / staff / custom / default fallback
Sub-paths: colorMap.get() returns a value vs undefined (event property not in map)
- [x] returns color from type palette when colorMode is "type"
- [x] returns color from module palette when colorMode is "module"
- [x] returns color from status palette when colorMode is "status"
- [x] returns color from staff palette when colorMode is "staff"
- [x] returns fallback color for "custom" mode
- [x] returns fallback color for unknown color mode
- [x] different events get different colors in type mode when types differ
- [x] type mode: event.type not in fetchedData.events types → returns undefined (BUG: no fallback inside switch)
- [x] module mode: event.module_ids is empty → event.module_ids[0] is undefined → colorMap.get(undefined) → returns undefined (BUG)
- [x] staff mode: event.staff_ids is empty → event.staff_ids[0] is undefined → colorMap.get(undefined) → returns undefined (BUG)
- [x] module mode: event.module_ids[0] references an id in fetchedData.modules → returns valid color from palette
- [x] status mode: event.status is not in fetchedData.states keys → colorMap.get() returns undefined (BUG)
- [x] type mode: all events have the same type → palette has length 1 → all events get same color
- [x] staff mode: event with multiple staff_ids only uses staff_ids[0] for color lookup
- [x] returns undefined for staff mode when event has no staff_ids (BUG: staff_ids[0] undefined)
- [x] type mode with single unique type gives all events the same color
- [x] module mode returns undefined when event's module not in fetchedData.modules (BUG)

#### getContrastTextColor
Paths: ctx is null (return "#000000"), resolvedBg empty → fallback "#ffffff", high luminance → "#000000", low luminance → "#ffffff"
- [x] returns "#000000" when canvas context is unavailable
- [x] returns "#ffffff" for very dark background color
- [x] returns "#000000" for very light background color
- [x] uses fallback "#ffffff" as bg when resolvedBg and bgColor are both empty

#### setColorUpdateCallback
- [x] stores the callback function

#### initColorEvents (DOM-dependent)
Paths: #colorDropBtn exists/missing, .color-menu-item click, #themeToggle click, updateColorCallback null/set
- [x] clicking colorDropBtn toggles "open" class on #colorDrop
- [x] clicking outside #colorDrop removes "open" class
- [x] clicking a color-menu-item updates colorMode.value and calls updateColorCallback
- [x] clicking a color-menu-item when updateColorCallback is null does not throw
- [x] clicking #themeToggle toggles darkMode.value and calls updateColorCallback
- [x] clicking #themeToggle when updateColorCallback is null does not throw
- [x] applyColorModeUI sets active class only on matching mode item
- [x] applyColorModeUI sets label text from COLOR_MODE_LABELS or falls back to mode string itself

---

### 1.3 api.js

#### apiFetch (via public wrappers)
Paths: res.ok=true → json(), res.ok=false → throw, fetch rejects (network error)
- [x] fetchDegrees calls correct endpoint
- [x] throws on non-ok responses
- [x] fetchAll calls all endpoints
- [x] individual wrappers delegate to correct paths
- [x] fetchDegreeDetail includes id in URL path
- [x] fetchDegreeDetail throws on non-ok response
- [x] fetchAll rejects if any single fetch fails
- [x] fetch with network error (fetch rejects, not just non-ok)
- [x] fetchModules calls /modules?include_relationships=true
- [x] fetchEvents calls /events?include_relationships=true
- [x] fetchStaff calls /staff
- [x] fetchLocations calls /locations
- [x] fetchSemesters calls /semesters
- [x] fetchAll returns results in correct order [degrees, modules, events, staff, locations, semesters]

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

- [x] returns all events when no filters are active
- [x] limits to selected module ids
- [x] applies hidden and selected tri-state filters
- [x] filters by degree modules when degree is selected
- [x] filters by degree AND semester combined
- [x] hidden modules excludes their events
- [x] hidden staff excludes events with that staff
- [x] hidden locations excludes events at that location
- [x] selected types only shows matching types
- [x] selected staff only shows events with matching staff
- [x] selected locations only shows events at matching location
- [x] selected status only shows events with matching status
- [x] returns empty when all modules hidden
- [x] event with multiple module_ids: included if any module matches
- [x] combined selected modules from degree + more modules
- [x] hidden status excludes events with that status
- [x] hidden types excludes events of that type
- [x] degree set + no semester + no selected modules → all degree modules pass through (branch: selectedDegreeModules.length === 0)
- [x] degree set + semester set + no modules match semester → events list is empty
- [x] degree set + selectedModules includes a degree module AND a non-degree module → both paths merge
- [x] all filter dimensions active simultaneously: degree + semester + selectedModule + hiddenModule + selectedType + hiddenType + selectedStatus + hiddenStatus + selectedStaff + hiddenStaff + selectedLocation + hiddenLocation
- [x] event with empty module_ids → el.module_ids.some(...) returns false → event excluded
- [x] all filter dimensions simultaneously: degree + semester + module + type + status + staff + location
- [x] hidden events from pinned are excluded even when they match all filters
- [x] getEvents with entirely empty fetchedData.events returns []
- [x] getEvents with empty fetchedData.modules returns []
- [x] event hidden by getHiddenEvents (pinned event) is excluded even though it passes all filters
- [x] selected staff with event having multiple staff_ids: passes if ANY staff matches (.some())
- [x] hidden staff with event having multiple staff_ids: excluded if ANY staff matches (.some())
- [x] degree filter uses in operator on degree_ids object — checks string key existence (potential type coercion BUG)
- [x] completely empty fetchedData.events → returns []
- [x] completely empty fetchedData.modules → returns [] (no module ids match anything)
- [x] selected modules that don't exist in fetchedData.modules still form the module list but no events match them
- [x] hiddenModules filters out modules even when selectedDegreeModules selected them
- [x] one status SELECTED + another status HIDDEN: only selected status events shown, hidden ones also excluded

#### getHiddenEvents
Paths: no pinned events, pinned event not found, pinned found + similar events exist, multiple pins
- [x] returns empty when no events are pinned
- [x] hides similar events (same module + type) when one is pinned
- [x] does not hide the pinned event itself
- [x] does not hide events with different type even if same module
- [x] handles pinned event ID not found in events gracefully
- [x] multiple pinned events accumulate hidden events
- [x] pinning two events of same module+type: each pin only excludes itself, not other pins (BUG: cross-pin hiding)
- [x] hidden list may contain duplicates when two pinned events overlap on hidden targets (BUG: no dedup in hidden.concat)
- [x] event with multiple module_ids: pinning it hides events sharing ANY module_id with same type (.some() path)
- [x] pinned event whose module_ids is empty: pinnedEvent.module_ids.includes(id) never true → no events hidden

#### clearFilters
Paths: updateCallback is null vs set
- [x] resets degree and semester to null
- [x] clears all Sets
- [x] resets all status values to null
- [x] clears pinnedEvents
- [x] calls update callback if set
- [x] does not throw if updateCallback is null

#### createFilterRow (internal, tested via updateFilters DOM)
- [x] creates row with correct data-key attribute
- [x] creates row with correct data-state attribute
- [x] click toggles tri-state via nextTriState
- [x] disabled row has "dimmed" class
- [x] always attaches click handler even when disabled (BUG: `if (true)` dead branch)
- [x] count label reflects event count

#### updateFilters (DOM-dependent)
Paths: degreeEl/semesterEl missing (early return), degree selected vs not, semester display toggle, module list generation, weitere section toggle
- [x] with no DOM elements: returns without error (all querySelector return null)
- [x] with DOM: fills degree dropdown with sorted degree names
- [x] degree selected: shows semester filter section, fills semester options
- [x] degree not selected: hides semester filter section
- [x] degree selected + semester selected: modules filtered by both
- [x] module list shows count of matching events for each module
- [x] module with 0 events and NEUTRAL state gets dimmed class
- [x] weitere section visible when moreModules.length > 0, hidden when 0
- [x] type list shows all unique types from fetchedData.events, sorted
- [x] state list shows all states from fetchedData.states with correct counts
- [x] staff list hides staff with 0 events and NEUTRAL state (continue path)
- [x] staff list shows staff with 0 events if they are SELECTED or HIDDEN
- [x] location list hides locations with 0 events and NEUTRAL state (continue path)
- [x] location list shows locations with 0 events if they are SELECTED or HIDDEN

#### createFilterRow (internal helper, tested via DOM)
Paths: disabled=true vs false, click handler toggles tri-state, if (true) always-true branch
- [x] creates row div with class frow and correct data-key and data-state
- [x] disabled=true adds dimmed class to row and tri span
- [x] disabled=false: no dimmed class
- [x] clicking row toggles tri-state: neutral→selected→hidden→neutral cycle
- [x] click handler calls provided handler function with event
- [x] count span shows the count number as text
- [x] if (true) always attaches click handler even when disabled (BUG: dead code branch)

#### handleDegreeSelect (internal, tested via DOM event)
Paths: selected value is numeric string → parseInt, selected value is "" → degree=null, updateCallback null vs set
- [x] selecting a degree option sets filterState.degree to the parsed integer
- [x] selecting "Alle" (empty value) sets filterState.degree to null
- [x] always resets filterState.semester to null
- [x] calls updateCallback when set
- [x] does not throw when updateCallback is null

#### handleSemesterSelect (internal, tested via DOM event)
Paths: selected value is numeric string, selected value is "" → semester=null, updateCallback
- [x] selecting a semester option sets filterState.semester to the parsed integer
- [x] selecting "Alle" (empty value) sets filterState.semester to null
- [x] calls updateCallback when set

#### handleModuleSelect (internal, tested via DOM event)
Paths: newState is SELECTED/HIDDEN/NEUTRAL, moduleId is valid number vs NaN
- [x] SELECTED: adds to selectedModules, removes from hiddenModules
- [x] HIDDEN: adds to hiddenModules, removes from selectedModules
- [x] NEUTRAL: removes from both sets
- [x] NaN moduleId: does not modify any sets, still calls updateCallback
- [x] calls updateCallback when set

#### handleTypeSelect (internal, tested via DOM event)
Paths: newState is SELECTED/HIDDEN/NEUTRAL (no NaN check on typeId, it is a string)
- [x] SELECTED: adds to selectedTypes, removes from hiddenTypes
- [x] HIDDEN: adds to hiddenTypes, removes from selectedTypes
- [x] NEUTRAL: removes from both sets
- [x] calls updateCallback when set

#### handleStateSelect (internal, tested via DOM event)
Paths: sets filterState.status[key] to the new state value
- [x] sets filterState.status[stateKey] to the provided newState
- [x] calls updateCallback when set
- [x] stateKey that is not a valid StatusKey: sets arbitrary key on status object (BUG: no validation)

#### handleStaffSelect (internal, tested via DOM event)
Paths: SELECTED/HIDDEN/NEUTRAL branches, staffId NaN (no-op + no callback call)
- [x] SELECTED: adds to selectedStaff, removes from hiddenStaff
- [x] HIDDEN: adds to hiddenStaff, removes from selectedStaff
- [x] NEUTRAL: removes from both sets
- [x] NaN staffId: does not modify any sets AND does not call updateCallback (callback is inside the if block)
- [x] calls updateCallback only when staffId is valid

#### handleLocationSelect (internal, tested via DOM event)
Paths: SELECTED/HIDDEN/NEUTRAL branches, locationId NaN (no-op + no callback call)
- [x] SELECTED: adds to selectedLocations, removes from hiddenLocations
- [x] HIDDEN: adds to hiddenLocations, removes from selectedLocations
- [x] NEUTRAL: removes from both sets
- [x] NaN locationId: does not modify any sets AND does not call updateCallback
- [x] calls updateCallback only when locationId is valid

---

### 1.5 sharing_storage.js

#### serializeState / applyState (internal helpers, tested via save/restore)
Paths in applyState: o is null/non-object (early return), each field present vs absent, type guards for each field
- [x] saveState writes serialized state to localStorage
- [x] restoreState reads and applies state from localStorage
- [x] returns true on successful save
- [x] saveState returns false if localStorage throws (e.g. quota exceeded)
- [x] applyState with null input: does nothing (early return path)
- [x] applyState with non-object input (e.g. string): does nothing
- [x] applyState with partial object: only applies present fields, leaves others unchanged
- [x] applyState with o.d as string (not number): degree stays unchanged (typeof check fails)
- [x] applyState with o.d as null: sets degree to null explicitly
- [x] applyState with o.s as string: semester stays unchanged
- [x] applyState with invalid status value (not null, not in VALID_TRI): sets to null
- [x] applyState with valid status values (null, neutral, selected, hidden): applies correctly
- [x] applyState with o.pin as non-array: pinnedEvents stays unchanged
- [x] applyState with o.v as non-string: view stays unchanged
- [x] applyState with o.dm as non-boolean: darkMode stays unchanged

#### setParam (internal helper)
Paths: value is null/undefined/"" → skip, value is array with length 0 → skip, array with items → join, scalar → set
- [ ] null value: param not set
- [ ] undefined value: param not set
- [ ] empty string: param not set
- [ ] empty array: param not set
- [ ] non-empty array: param set as comma-joined encoded values
- [ ] scalar value: param set as encoded string

#### getShareLink
- [x] includes degree param when set
- [x] includes semester param when set
- [x] includes selected modules as comma-separated
- [x] includes pin param with pinned event IDs
- [x] includes view and colorMode params
- [x] includes darkMode param
- [x] encodes status params with status_ prefix
- [x] does not include null degree
- [x] includes customMap entries when present
- [x] does not include empty Sets in URL (sm/hm/st/ht/ss/hs/sl/hl omitted when empty)
- [x] customMap with size 0: no cmap param in URL
- [x] status entries with null value: no status_ param for that key
- [x] all params present simultaneously: URL contains all expected keys
- [x] special characters in type strings are properly encoded

#### clearStateStorage
- [x] removes the storage key from localStorage

#### restoreState
Paths: URL has state params → applyParams, URL has status_ params → recognized, no URL params → try localStorage, localStorage empty → no-op, localStorage has data → applyState, malformed JSON → catch
- [x] URL params take precedence over localStorage
- [x] falls back to localStorage if no URL params
- [x] restoreState does nothing when localStorage is empty and no URL params
- [x] URL has only a status_ param (no standard keys): still detected as hasUrlState → applyParams path taken
- [x] malformed JSON in localStorage: caught silently, state unchanged
- [x] ignores unknown status values in URL params
- [x] URL has d param with non-numeric value: filterState.degree set to null (parseInt → NaN → null)
- [x] URL has s param with non-numeric value: filterState.semester set to null
- [x] URL dm param with value false: darkMode.value set to false
- [x] URL dm param with value true: darkMode.value set to true
- [x] URL dm param with any other value: darkMode.value set to false (not === true)

#### applyParams (internal)
Paths per param: param present → parse and apply, param absent → skip. cmap parsing: entry with idx<1 skipped, k is NaN skipped, v is empty skipped
- [x] sm with comma-separated numeric values: selectedModules populated correctly
- [x] sm with non-numeric values: filtered out by !isNaN check
- [x] st with comma-separated strings: selectedTypes populated correctly
- [x] cmap with valid entries: customMap populated
- [x] cmap entry with no colon (idx<1): entry skipped
- [x] cmap entry with NaN key: entry skipped
- [x] cmap entry with empty value after colon: entry skipped
- [x] v param present: view.value updated, decoded
- [x] cm param present: colorMode.value updated, decoded
- [x] status_ok param with invalid value (not in VALID_TRI): ignored (VALID_TRI.has check)
- [x] status_ok param with valid value (selected): applied

#### getNumArray / getStrArray (internal helpers)
Paths: param missing → [], param empty string → [], param with valid values → parsed array, non-numeric entries filtered
- [ ] missing param returns []
- [ ] param with 1,2,3 returns [1, 2, 3]
- [ ] param with a,b,c returns [] for getNumArray (all NaN)
- [ ] param with 1,,3 filters empty strings, returns [1, 3]
- [ ] getStrArray with encoded values decodes them correctly

#### saveFetchedData / loadFetchedDataAsync
Paths: indexedDB available → openDB → put, indexedDB open fails → fallback to localStorage, no indexedDB → localStorage, localStorage throws → return false, loadFetchedDataAsync: IDB available + data → return, IDB available + no data → fallback, no IDB → loadFetchedData (localStorage)
- [x] saveFetchedData returns true
- [x] loadFetchedDataAsync returns data from localStorage fallback
- [x] loadFetchedDataAsync returns null when nothing stored
- [ ] saveFetchedData with no IDB and localStorage throwing: returns false
- [ ] loadFetchedDataAsync with IDB returning data: returns IDB data (not localStorage)
- [ ] loadFetchedDataAsync with IDB empty: falls through to localStorage
- [ ] loadFetchedDataAsync with IDB throwing: falls through to localStorage
- [x] loadFetchedData (localStorage) with malformed JSON: returns null (catch path)

#### showShareLinkSuccessMsg
Paths: #shareLinkSuccessMSg element exists vs missing
- [x] sets textContent on #shareLinkSuccessMSg when element exists
- [x] does nothing when element is missing (early return)

---

### 1.6 popup.js

#### openPopup
Paths: event not found → return, popupEl missing → return, event found → all fields populated, isPinned true/false, credits 0/1/multiple, degreeTexts empty (parent hidden) vs non-empty
- [x] populates title from event data
- [x] populates type from event data
- [x] populates time with weekday, start and end
- [x] populates location name from fetched locations
- [x] shows dash when location not found
- [x] populates staff names joined by comma
- [x] shows dash when no staff found
- [x] populates module names
- [x] shows credits as range when multiple different credits
- [x] shows dash for credits when no modules
- [x] shows degree names from module to degree lookup
- [x] hides degrees section when no degrees found
- [x] sets pin button state based on pinnedEvents — not pinned
- [x] sets pin button state based on pinnedEvents — pinned
- [x] adds show class to popup element
- [x] does nothing for non-existent event
- [x] shows single credit value with "LP" when all modules have same credits
- [x] deduplicates staff names
- [x] deduplicates degree names
- [x] popup with event weekday 0 or >7 shows empty weekday label (BUG: WEEKDAY_LABELS undefined)
- [x] re-opening popup for different event replaces old data
- [x] pin button does NOT accumulate event listeners despite no removeEventListener (DOM deduplicates same function ref)
- [x] event not in fetchedData.events: no popup shown (return path)
- [x] popup element missing from DOM: no error (return path)
- [x] event.weekday outside 1-7 (e.g. 0 or 8): WEEKDAY_LABELS[weekday] is undefined → displays empty string via || "" (BUG)
- [x] credits: single module → credits.length == 1 path → shows X LP
- [x] credits: two modules with same credits → deduplicated by Set → credits.length == 1 path
- [x] credits: module with credits=undefined → filtered out by x !== undefined → may reduce to 0
- [x] staff names deduplicated by new Set(...) — duplicate staff_ids produce single name
- [x] degree names deduplicated by new Set(degreeTexts) — no duplicates in display
- [x] module not found in fetchedData.modules: .find() returns undefined → degree_ids loop skips it via if (!module) continue
- [x] pin button listener: pin button does NOT accumulate addEventListener listeners (DOM deduplicates same function ref)
- [x] statusState not found in fetchedData.states: shows empty string via ?? ""
- [x] re-opening popup for different event: old data replaced by new data

#### initPopup
Paths: closeBtn missing, popup missing, click inside vs outside .popup-box
- [x] close button removes show class
- [x] clicking outside popup box removes show class
- [x] clicking inside popup box does NOT remove show class
- [x] closeBtn missing from DOM: no event listener attached, no error
- [x] popup element missing from DOM: no event listener attached, no error

#### handleEventPin (internal, via pin button click)
Paths: eventId is NaN → return, pinnedEvents.has(eventId) → delete, !has → add, updatePopupCallback null vs set, then openPopup re-called
- [x] toggles pin state for event
- [x] calls updatePopupCallback after toggle
- [x] does nothing when eventId is NaN
- [x] eventId is NaN (btn.dataset.eventId is non-numeric or empty): early return, no state change
- [x] updatePopupCallback is null: does not throw after toggle
- [x] after toggle, openPopup(eventId) is called to refresh pin button UI

---

### 1.7 calendar.js

#### setCalendarUpdateCallback / setOpenPopupCallback / getCalendar
- [x] setCalendarUpdateCallback stores callback without error
- [x] setOpenPopupCallback stores callback without error
- [x] getCalendar returns null when initCalendar has not been called

#### initCalendar
Paths: #calendar element missing → return, element present → create FullCalendar, .vbtn click handlers, viewType week/day/list/other
- [x] creates FullCalendar instance and renders
- [x] does nothing if #calendar element is missing
- [x] sets up view toggle buttons (.vbtn)
- [x] #calendar element missing: returns without creating instance
- [x] #calendar element present: creates FullCalendar instance (calendarInstance not null)
- [x] .vbtn with data-view=week: calls changeCalendarView(timeGridWeek)
- [x] .vbtn with data-view=day: calls changeCalendarView(timeGridDay)
- [x] .vbtn with data-view=list: calls changeCalendarView(listWeek)
- [x] .vbtn with data-view=unknown: no changeCalendar call (falls through switch default)
- [x] .vbtn click: sets active class on clicked button, removes from siblings

#### changeCalendarView
Paths: calendarInstance is null → return, calendarInstance exists → changeView + update view.value
- [x] calendarInstance is null: returns without error
- [x] calendarInstance exists: calls changeView and updates view.value
- [x] updates view.value state
- [x] does nothing if calendarInstance is null

#### getFixedMonday
Paths: today is Monday (day=1), Tuesday-Saturday (day=2-6), Sunday (day=0 → special -6 path)
- [x] returns a Date that is a Monday (getDay() === 1)
- [x] when today is Monday: returns today
- [x] when today is Wednesday: returns previous Monday
- [x] when today is Sunday: day===0 → diff = date - 0 + (-6) → check correct Monday (BUG potential)
- [x] when today is Saturday: day===6 → diff = date - 6 + 1 → returns previous Monday
- [x] BUG edge case: when today is Sunday, getDay()===0 path may produce wrong week

#### buildCalendarEvents
Paths per event: pinned vs not, getEventColor returns falsy → fallback #3B82F6, moduleNames array has entries vs empty, weekday mapping (1-6 → same, 7 → 0)
- [x] maps weekday 1 (Monday) to fcDay 1
- [x] maps weekday 7 (Sunday) to fcDay 0
- [x] maps weekday 6 (Saturday) to fcDay 6
- [x] adds "pinned" class for pinned events
- [x] empty class list for unpinned events
- [x] includes module names in extendedProps
- [ ] sets fallback color "#3B82F6" when getEventColor returns falsy
- [x] typeShort is always "?" (hardcoded, maps commented out)
- [x] statusColor is always "#6b7280" (hardcoded)
- [x] event id is stringified in fc event
- [x] empty events array produces empty fc events
- [ ] event with module_ids referencing non-existent modules: empty moduleNames
- [x] empty events array → returns []
- [x] event with weekday=1 (Monday): fcDay = 1 % 7 = 1
- [x] event with weekday=7 (Sunday): fcDay = 7 % 7 = 0
- [x] event with weekday=6 (Saturday): fcDay = 6 % 7 = 6
- [x] event with weekday=5 (Friday): fcDay = 5 % 7 = 5
- [x] pinned event: classNames includes pinned
- [x] unpinned event: classNames filtered to empty array
- [ ] getEventColor returns falsy/undefined: color falls back to #3B82F6
- [x] getEventColor returns valid color: that color is used
- [x] module_ids reference existing modules: moduleNames populated with names
- [ ] module_ids reference non-existent modules: .find() returns undefined → filtered out by .filter(Boolean) → empty moduleNames
- [x] event id is stringified in FullCalendar event (id: String(ev.id))
- [x] typeShort is always ? (commented-out map)
- [x] statusColor is always #6b7280 (commented-out status colors)
- [x] all fc event fields present: daysOfWeek, startTime, endTime, extendedProps, display, classNames

#### renderEventContent (internal, DOM-dependent)
Paths: props.moduleNames.length > 0 → meta element, length === 0 → no meta element, pin click handler
- [ ] creates div with ev-title containing typeShort + title
- [x] moduleNames length > 0: creates ev-meta div with first module name
- [x] moduleNames length === 0: no ev-meta div created
- [x] creates sdot span with statusColor background
- [x] creates ev-pin-icon span with click handler
- [x] pin icon click calls onPinToggle with numeric event id
- [x] pin icon click stopPropagation prevents event click handler

#### handleEventClick (internal)
Paths: openEventPopupCallback is null vs set
- [x] calls openEventPopupCallback with numeric event id when set
- [x] does nothing when openEventPopupCallback is null (no error)
- [x] preventDefault is called on jsEvent

#### setCalendarUpdateCallback / setOpenPopupCallback
- [x] stores callback without error

#### updateCalendar
Paths: calendarInstance is null → return early, calendarInstance exists → removeAllEvents + addEventSource
- [x] calendarInstance is null: no error, returns early
- [x] calendarInstance exists: removes old events and adds new source from getEvents + buildCalendarEvents

#### onPinToggle (internal)
Paths: event already pinned → delete, not pinned → add, updateCalendarCallback null vs set
- [x] not pinned: adds to pinnedEvents
- [x] already pinned: removes from pinnedEvents
- [x] calls updateCalendarCallback when set
- [x] does not throw when updateCalendarCallback is null

---

### 1.8 app.js

#### DOMContentLoaded handler
Paths: cachedData available → populate state + skip fetch, cachedData null → fetchAll + saveFetchedData, restoreState always called before data population
- [x] cachedData available: populates fetchedData from cache, does not call fetchAll
- [x] cachedData null: calls fetchAll, assigns results to fetchedData, calls saveFetchedData
- [ ] restoreState is called before data population
- [ ] initApp is called after data is ready

#### initApp
Paths: semesterBadge exists vs null, semesters[0].name truthy vs nullish
- [x] sets semester badge text from fetchedData.semesters[0].name
- [x] falls back to "Semester" when name is nullish
- [x] semesterBadge element exists + semesters[0].name is truthy: sets textContent to name
- [x] semesterBadge element exists + semesters[0].name is null: falls back to Semester
- [x] semesterBadge element missing: no error (null check)
- [ ] calls updateFilters, initCalendar, updateCalendar, initColorEvents, initPopup in order
- [x] sets filter/calendar/color/popup callbacks via setter functions
- [x] hides loadingOverlay by adding hidden class
- [x] loadingOverlay missing: no error (optional chaining)
- [ ] calls globalEventListeners at the end

#### update (internal)
- [ ] calls updateFilters, updateCalendar, saveState in sequence

#### globalEventListeners (internal)
Paths per button: element exists vs missing (optional chaining)

##### resetAllBtn
- [x] #resetAllBtn click calls clearStateStorage and clearFilters
- [x] #resetAllBtn missing: no error

##### shareLinkBtn click
Paths: clipboard.writeText succeeds vs fails, #shareLinkSuccessMSg exists vs missing, #shareLink exists vs missing, #share-link-popup exists vs missing
- [x] click: generates share link, writes to clipboard
- [x] clipboard success: shows Link wurde kopiert! message
- [x] clipboard failure: shows Link konnte nicht kopiert werden! message
- [x] #shareLinkSuccessMSg missing: no error on success/failure path
- [x] #shareLink element: shows generated link text
- [x] #share-link-popup: adds show class
- [x] shareLinkCloseBtn closes share link popup
- [x] clicking outside share link popup box closes it
- [x] weitereToggle toggles "open" class on #weitereExp

##### shareLinkCloseBtn / shareLinkPopup
- [x] #shareLinkCloseBtn click: removes show from #share-link-popup
- [x] #share-link-popup click outside .popup-box: removes show
- [x] #share-link-popup click inside .popup-box: does not remove show
- [x] #shareLinkCloseBtn missing: no event listener, no error
- [x] #share-link-popup missing: no event listener, no error

##### weitereToggle
- [x] #weitereToggle click: toggles open class on #weitereExp
- [x] #weitereToggle missing: no error
- [x] #weitereExp missing: no error (optional chaining)

---

## 2. Integration Tests

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

## 3. Functional Tests

- [x] selecting a degree shows only its modules events, then selecting module narrows further
- [x] hiding a type removes events, un-hiding restores them
- [x] selecting a status filters accordingly, disabling shows all again
- [x] clearFilters restores all events after complex filtering
- [x] opening popup, pinning event, closing: getEvents excludes similar events
- [x] switching color modes produces different colors for same event
- [x] applying filters then getShareLink then restoreState: same events visible

---

## 4. End-to-End Tests

- [x] fetch data, populate state, getEvents, getEventColor, buildCalendarEvents flow
- [x] fetch data, apply filters, getEvents, updateCalendar cycle
- [x] fetch fails: error propagation, no state corruption
- [x] set filters, saveState, clear, restoreState, filters restored
- [x] URL params override localStorage
- [x] pin event, filter by degree, pinned event still affects hidden calculation

# 5. Additional Unit & Edge Case Tests (2026)

## 5.1 app.js

### initApp
- [x] semesterBadge: handles missing #semesterBadge element gracefully
- [ ] semesterBadge: handles empty fetchedData.semesters array (no error, fallback to "Semester")
- [x] semesterBadge: handles missing .name property on semester (fallback to "Semester")
- [ ] calls all init/update functions even if some DOM elements are missing
- [ ] does not throw if set*Callback functions are undefined
- [x] loading overlay: handles missing #loadingOverlay element

### globalEventListeners
- [x] resetAllBtn: does nothing if button missing
- [x] shareLinkBtn: does nothing if button missing
- [x] shareLinkBtn: handles clipboard writeText rejection (shows error message)
- [x] shareLinkBtn: handles missing #shareLinkSuccessMSg element
- [ ] shareLinkBtn: handles missing #shareLink element
- [x] shareLinkBtn: handles missing #share-link-popup element
- [x] shareLinkCloseBtn: does nothing if button missing
- [x] shareLinkPopup: does nothing if popup missing
- [ ] shareLinkPopup: clicking outside popup box with no .popup-box element does not throw
- [x] weitereToggle: does nothing if button missing
- [x] weitereExp: does nothing if #weitereExp missing

### update
- [ ] calls updateFilters, updateCalendar, and saveState in order

## 5.2 calendar.js

### initCalendar
- [x] does nothing if #calendar element is missing
- [ ] creates calendarInstance with correct initial view from view.value
- [x] sets up .vbtn click handlers for all present buttons
- [ ] handles missing .vbtn elements gracefully
- [ ] does not throw if FullCalendar is undefined (simulate missing import)

### buildCalendarEvents
- [x] returns empty array if input events is empty
- [ ] handles events with missing/empty module_ids array
- [ ] handles events with module_ids referencing non-existent modules (moduleNames empty)
- [ ] sets fallback color if getEventColor returns falsy
- [x] sets pinned class only for pinned events
- [x] event id is always stringified
- [x] typeShort is always "?" (hardcoded)
- [x] statusColor is always "#6b7280" (hardcoded)

### getFixedMonday
- [x] returns a Date object
- [x] always returns a Monday (getDay() === 1)
- [x] edge case: when today is Sunday (getDay()===0), returns previous Monday

### changeCalendarView
- [x] does nothing if calendarInstance is null
- [x] updates view.value to new viewName

### updateCalendar
- [x] exits early if calendarInstance is null
- [x] removes all events before adding new ones
- [x] adds correct number of events from buildCalendarEvents

### renderEventContent
- [ ] sets CSS variables for color and contrast
- [x] creates title, meta, dot, and pin elements
- [x] attaches pin click handler
- [x] handles missing/empty moduleNames array
- [ ] handles missing getContrastTextColor function (simulate error)

## 5.3 filters.js

### getEvents
- [x] returns [] if fetchedData.events is empty
- [x] returns [] if fetchedData.modules is empty
- [x] returns only events matching selectedModules, hiddenModules, selectedTypes, hiddenTypes, selectedStaff, hiddenStaff, selectedLocations, hiddenLocations, and status filters
- [x] returns [] if all modules are hidden
- [x] returns [] if event.module_ids is empty
- [x] returns [] if event's module_ids do not match any selected or degree modules
- [x] returns [] if event is hidden by getHiddenEvents
- [x] returns all events if no filters are set and nothing is hidden
- [x] supports selecting modules outside current degree ("more modules")
- [x] supports combining hidden and selected on same dimension (e.g. selected + hidden types)
- [x] supports all filter dimensions simultaneously

### getHiddenEvents
- [x] returns [] if no events are pinned
- [x] does not hide the pinned event itself
- [x] hides events sharing ANY module with same type as pinned event
- [x] handles multiple pinned events (accumulates hidden events)
- [x] does not deduplicate hidden events (BUG: duplicates possible)
- [x] handles pinned event ID not found in events gracefully

### clearFilters
- [x] resets all filterState properties to default
- [x] clears pinnedEvents
- [x] calls updateCallback if set
- [x] does not throw if updateCallback is null

### createFilterRow
- [x] creates row with correct data-key and data-state attributes
- [x] click toggles tri-state via nextTriState
- [x] disabled row has "dimmed" class
- [x] always attaches click handler even when disabled (BUG: `if (true)` dead branch)
- [x] count label reflects event count

### fillDegreesSemesters
- [x] handles missing degreeEl, semesterEl, or semFilterSec elements
- [ ] handles empty fetchedData.degrees array
- [ ] handles degree with no semesters

### fillModules
- [x] handles missing moduleCon or moreModuleCon elements
- [ ] handles empty fetchedData.modules array
- [x] handles modules with no events

### fillTypes, fillStates, fillStaff, fillLocations
- [x] handle missing container elements
- [ ] handle empty fetchedData.events, states, staff, or locations arrays
- [ ] skip types/staff/locations with no events unless selected
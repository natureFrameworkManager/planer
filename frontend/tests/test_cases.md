# Frontend Test Cases

This checklist summarizes the tests currently performed in `frontend/tests`.

## API wrappers (`api.test.js`)

- [x] fetches degrees from the expected endpoint - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] throws when the API response is not OK - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] fetchAll calls all endpoints in the expected order - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] individual fetch helpers call the correct endpoint URLs - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] degree detail fetch includes degree id in the URL path - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] degree detail fetch throws on non-OK responses - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] fetchAll rejects when any single fetch fails - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] network errors are propagated as rejected promises - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] module, event, staff, location, and semester fetchers hit correct paths - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] fetchAll returns tuple-like results in stable order - checks the expected output, side effects, and edge-case behavior for this scenario.

## App bootstrap and global listeners (`app.test.js`)

### Global event listeners
- [x] reset button clears persisted state and active filters - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] missing reset button does not throw - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] share button generates share link and writes to clipboard - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] clipboard write failure shows an error message path - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] missing share button and related DOM nodes are handled safely - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] share popup displays generated link text - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] share popup opens by applying show class - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] share popup closes via close button - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] clicking outside popup closes it - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] clicking inside popup does not close it - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] weitere toggle opens and closes the expandable sidebar section - checks the expected output, side effects, and edge-case behavior for this scenario.

### Initialization behavior
- [x] semester badge handles missing semester data safely - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] loading overlay path handles missing element and hides overlay when present - checks the expected output, side effects, and edge-case behavior for this scenario.

### Bootstrap integration
- [x] uses cached payload when available and initializes UI from cache - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] fetches payload when cache is missing and stores it - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] restores state before initialization sequence runs - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] startup order is color then filters then calendar then popup - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] update callback runs filters then calendar then state save in order - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] initialization is resilient to missing optional DOM elements - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] global listeners are wired across sidebar reset and sharing actions - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] bootstrap throws when required callback setters are undefined - checks the expected output, side effects, and edge-case behavior for this scenario.

## Calendar module (`calendar.test.js`)

### Callback and instance access
- [x] calendar update callback can be stored and used - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] popup open callback can be stored and used - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] getCalendar returns null before initialization - checks the expected output, side effects, and edge-case behavior for this scenario.

### Calendar initialization
- [x] missing calendar container exits without throwing - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] FullCalendar instance is created and rendered - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] initial view uses current state value - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] view buttons map week/day/list values correctly - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] unknown view button values do not change the view - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] active view button class updates on click - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] missing view buttons are handled gracefully - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] missing FullCalendar global throws explicit error - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] fixed Monday helper returns current Monday for Monday date - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] fixed Monday helper returns previous Monday for non-Monday dates - checks the expected output, side effects, and edge-case behavior for this scenario.

### View updates and event rendering
- [x] changeCalendarView is a no-op when instance is absent - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] changeCalendarView updates state and calls FullCalendar changeView - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] updateCalendar is a safe no-op when instance is absent - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] updateCalendar removes old sources and adds rebuilt source - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] event mapping includes weekdays classes and module name formatting - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] event mapping uses getEventColor output when available - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] empty event list results in empty FullCalendar source - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] events with empty module ids produce empty module names - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] unknown module ids are filtered out of module names - checks the expected output, side effects, and edge-case behavior for this scenario.

### Event content and click behavior
- [x] custom render creates title meta dot and pin controls - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] event CSS variables are set for visual theming - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] meta row is omitted when no module names exist - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] pin click stops propagation to parent click handler - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] event click calls popup callback with numeric event id - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] event click still prevents default when popup callback is missing - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] pin toggle path is safe when update callback is not configured - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] rendered title always contains event title text - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] falsy event color falls back to default blue - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] missing contrast color helper throws explicit error - checks the expected output, side effects, and edge-case behavior for this scenario.

## Color module (`color.test.js`)

### Palette generation
- [x] generates requested number of colors in oklch format - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] supports deterministic overrides for lightness chroma and hue offset - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] returns empty array for zero and negative counts - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] single-color palette uses midpoint interpolation values - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] small palettes contain unique colors - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] golden-angle hue stepping is applied consistently - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] custom hue offset is respected - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] large palettes still return correct length - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] non-integer count is handled predictably - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] non-numeric count is handled predictably - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] non-numeric and non-integer hue offsets are handled - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] hue wrapping remains valid for large indices - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] repeated calls with identical input are deterministic - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] unknown extra options do not break generation - checks the expected output, side effects, and edge-case behavior for this scenario.

### Event color selection and contrast
- [x] returns palette colors for type module status and staff modes - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] returns fallback color for unknown mode - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] different event categories map to different colors where expected - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] missing type values still produce safe output - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] empty module id arrays are handled in module mode - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] empty staff id arrays are handled in staff mode - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] unknown modules and statuses are handled safely - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] single-type datasets map all events consistently - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] staff mode uses first staff id when multiple ids exist - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] contrast text helper returns black or white appropriately - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] contrast helper handles unavailable canvas context - checks the expected output, side effects, and edge-case behavior for this scenario.

### DOM interactions
- [x] color dropdown button toggles open class - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] outside click closes color dropdown - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] selecting a color mode updates state and invokes callback - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] selecting mode with null callback does not throw - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] theme toggle flips dark mode and invokes callback - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] theme toggle with null callback does not throw - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] active menu item reflects current color mode - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] mode label uses known labels and falls back to raw mode text - checks the expected output, side effects, and edge-case behavior for this scenario.

## Filters module (`filters.test.js`)

### Filter row creation and UI updates
- [x] filter row includes expected key and tri-state attributes - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] filter row click cycles through tri-state values - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] disabled rows render with dimmed style while keeping handler attached - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] count labels render event counts - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] updateFilters is safe when expected DOM nodes are missing - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] degree dropdown is populated in sorted order - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] semester section is shown when degree is selected - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] semester section is hidden when degree is not selected - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] empty source arrays and edge combinations are handled safely - checks the expected output, side effects, and edge-case behavior for this scenario.

### Individual handlers
- [x] degree selection updates state and triggers callback - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] semester selection updates state and triggers callback - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] module tri-state selection manages selected and hidden sets correctly - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] type tri-state selection manages selected and hidden sets correctly - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] status tri-state transitions update status map correctly - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] staff tri-state selection manages selected and hidden sets correctly - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] location tri-state selection manages selected and hidden sets correctly - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] NaN and invalid input values are safely ignored where applicable - checks the expected output, side effects, and edge-case behavior for this scenario.

### Core event filtering
- [x] returns all events when no filters are active - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] limits to selected module ids - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] applies hidden and selected tri-state filters - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] filters by degree modules when degree is selected - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] filters by selected semester when semester is selected - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] hidden modules exclude matching events - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] hidden staff exclude matching events - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] hidden locations exclude matching events - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] hidden types exclude matching events - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] selected modules include only matching events - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] selected staff include only matching events - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] selected locations include only matching events - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] selected types include only matching events - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] status selected limits to matching status - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] status hidden excludes matching status - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] combined multidimensional filters compose correctly - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] events with empty module ids are handled predictably - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] pinned-event hiding logic is integrated into visible results - checks the expected output, side effects, and edge-case behavior for this scenario.

### Hidden-event derivation and reset
- [x] hidden events are empty when nothing is pinned - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] pinned event hides events with same module and type - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] pinned event never hides itself - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] missing pinned event ids are ignored safely - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] multiple pinned events accumulate hidden set - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] overlapping pins expose duplicate and overlap edge behavior - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] clearFilters resets all sets scalar filters and pinned events - checks the expected output, side effects, and edge-case behavior for this scenario.

## Popup module (`popup.test.js`)

### Opening and rendering popup
- [x] popup renders title type time location staff modules credits and degrees - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] missing lookup data falls back to placeholder dash values - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] credit display shows single value or range depending on modules - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] pin button visual state reflects whether event is pinned - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] popup show class is applied on open - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] opening popup for unknown event is a safe no-op - checks the expected output, side effects, and edge-case behavior for this scenario.

### Popup close interactions
- [x] close button removes show class - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] outside click closes popup - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] inside click does not close popup - checks the expected output, side effects, and edge-case behavior for this scenario.

### Pin interactions and edge cases
- [x] pin toggle updates pinned state for current event - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] pin toggle invokes update callback - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] invalid event id on pin toggle is ignored safely - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] null update callback does not throw during pin toggle - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] pin toggle refreshes popup by re-opening active event - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] duplicate staff and degree names are deduplicated in display - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] weekday out-of-range values are handled safely - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] opening different events replaces previous popup data - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] pin button listeners do not accumulate across re-opens - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] missing popup DOM element is handled safely - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] undefined credits and missing modules are handled in formatting - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] unknown status codes are handled without crashing UI - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] initPopup handles missing close button and popup element safely - checks the expected output, side effects, and edge-case behavior for this scenario.

## Sharing and persistence (`sharing_storage.test.js`)

### Local storage round-trip
- [x] saveState writes serialized state object to localStorage - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] restoreState reads and applies localStorage state - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] saveState reports success on happy path - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] clearStateStorage removes persisted state key - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] restoreState is a safe no-op when no saved and no URL state exists - checks the expected output, side effects, and edge-case behavior for this scenario.

### Serialization fidelity
- [x] save and restore preserve sets and complex fields - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] save and restore preserve pinned events view color mode and dark mode - checks the expected output, side effects, and edge-case behavior for this scenario.

### Share link generation
- [x] share link includes active degree and semester - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] share link includes selected and hidden module and type filters - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] share link includes pinned events and pin aliases - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] share link includes view color mode dark mode and custom map - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] share link omits null empty and default-like values where intended - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] status values are encoded with status prefix keys - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] special characters are correctly URL encoded - checks the expected output, side effects, and edge-case behavior for this scenario.

### Restore precedence and fetched-data cache
- [x] URL params take precedence over localStorage values - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] localStorage is used when URL params are absent - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] saveFetchedData returns success status - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] loadFetchedDataAsync returns cached payload when present - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] loadFetchedDataAsync returns null when cache is empty - checks the expected output, side effects, and edge-case behavior for this scenario.

### Error and edge handling
- [x] saveState returns false when localStorage throws - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] applyState ignores null and non-object input - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] applyState partially applies valid fields from partial objects - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] invalid field types are rejected safely during applyState - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] empty sets and empty custom maps are not emitted into share URLs - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] full-parameter share links encode all supported state dimensions - checks the expected output, side effects, and edge-case behavior for this scenario.

## State module (`state.test.js`)

### Tri-state helpers and constants
- [x] tri-state cycles neutral to selected to hidden to neutral - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] unknown tri-state input falls back to neutral - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] empty and undefined tri-state values resolve to neutral - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] weekday labels contain expected German values - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] weekday labels include exactly keys 1 through 7 - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] TRI constants expose expected values and keys only - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] TRI constant values are unique and non-empty - checks the expected output, side effects, and edge-case behavior for this scenario.

### Default state objects
- [x] fetchedData defaults to empty arrays - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] fetchedData includes expected default state entries - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] fetchedData contains only expected top-level keys - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] filterState defaults degree and semester to null - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] filterState default sets are empty - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] filterState contains only expected top-level keys - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] pinnedEvents initializes as an empty Set - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] view default is timeGridWeek - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] colorMode default is type - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] darkMode default is boolean - checks the expected output, side effects, and edge-case behavior for this scenario.

## Functional workflows (`functional.test.js`)

- [x] degree selection narrows visible events to degree modules - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] module selection further narrows degree-filtered results - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] hiding a type removes matching events from results - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] un-hiding a type restores previously hidden results - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] selected status filters visible events correctly - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] clearFilters restores all events after complex workflow - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] popup open pin close workflow changes hidden-event behavior - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] popup open on unknown event id is safe - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] switching color modes changes resulting event color mapping - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] share-link round-trip restores equivalent visible event results - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] share-link with all filter dimensions restores full state correctly - checks the expected output, side effects, and edge-case behavior for this scenario.

## Integration workflows (`integration.test.js`)

- [x] filters and state integration reflects direct state changes in getEvents - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] selected and hidden module sets interact correctly together - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] pinned events affect hidden-event computation through integration path - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] multi-dimensional filter combinations work across modules - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] color mode changes alter getEventColor behavior for same events - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] type-based coloring uses fetchedData events as source of uniqueness - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] empty fetchedData path for coloring is handled safely - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] saveState and restoreState round-trip preserves filter state - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] persistence round-trip preserves pins view color mode and theme mode - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] share-link and restore flow round-trips app state - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] popup opening resolves event data from shared state model - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] popup pin toggles update state and trigger re-render path - checks the expected output, side effects, and edge-case behavior for this scenario.

## End-to-end scenarios (`e2e.test.js`)

- [x] full flow from fetch to state to filtered event retrieval to color mapping works - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] full flow with applied filters returns expected constrained results - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] fetch failure propagates error without corrupting state - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] save restore flow returns equivalent filtered results after reload - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] URL parameters override local storage during restore flow - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] pinning plus degree filtering keeps hidden-event behavior consistent - checks the expected output, side effects, and edge-case behavior for this scenario.
- [x] pinning in one module hides matching module-type events across updates - checks the expected output, side effects, and edge-case behavior for this scenario.

## Unmarked Missing Cases (from cases.md)

Note for future fixes:
- Goal gap: cases.md is path-coverage oriented (explicit branch/path tracking), while this file is still primarily scenario/checklist oriented.
- To fully meet that goal, add path IDs/branch labels per case and map each entry to concrete code paths and expected outcomes.
- Keep (BUG)-style tracking and add owner/priority for unresolved unchecked items.

### 1. Unit Tests

#### 1.1 state.js
- [ ] cycles neutral â†’ selected â†’ hidden â†’ neutral
- [ ] returns neutral for unknown/invalid input
- [ ] returns neutral for empty string
- [ ] returns neutral for undefined
- [ ] maps numbers 1â€“7 to German weekday names
- [ ] does not have keys outside 1â€“7
- [ ] has exactly 7 entries
- [ ] TRI.NEUTRAL is "neutral"
- [ ] TRI.SELECTED is "selected"
- [ ] TRI.HIDDEN is "hidden"
- [ ] TRI values are unique (no duplicates)
- [ ] TRI values are not empty strings
- [ ] TRI only has the expected keys (NEUTRAL, SELECTED, HIDDEN)
- [ ] all arrays start empty
- [ ] states has 5 predefined entries with correct keys (ok, tok, pok, alt, reserve)
- [ ] fetchedData has the keys degrees, modules, events, staff, locations, semesters (no extra keys)
- [ ] degree and semester are null by default
- [ ] all Sets are empty
- [ ] all status values are null
- [ ] filterState only has the expected keys (degree, semester, status, selectedModules, hiddenModules, selectedTypes, hiddenTypes, selectedStaff, hiddenStaff, selectedLocations, hiddenLocations)
- [ ] is an empty Set initially
- [ ] view defaults to "timeGridWeek"
- [ ] colorMode defaults to "type"
- [ ] darkMode defaults based on matchMedia (or true if unavailable)

#### 1.2 color.js
- [ ] returns requested number of colors
- [ ] supports deterministic overrides
- [ ] returns empty array for count 0
- [ ] single color uses t=0.5 midpoint values
- [ ] all colors are unique for small palette (e.g. 10)
- [ ] uses golden angle spacing â€“ hue increases by ~137.508 per step
- [ ] respects custom hueOffset
- [ ] large palette (100+) returns correct length
- [ ] negative count returns empty array (loop never executes)
- [ ] count=2: t goes from 0 to 1, covers both ends of lightness/chroma sine curves
- [ ] hue wraps around 360Â° for large index (e.g. hueOffset=350, i=1 â†’ 350+137.508 mod 360)
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
- [ ] returns color from type palette when colorMode is "type"
- [ ] returns color from module palette when colorMode is "module"
- [ ] returns color from status palette when colorMode is "status"
- [ ] returns color from staff palette when colorMode is "staff"
- [ ] returns fallback color for "custom" mode
- [ ] returns fallback color for unknown color mode
- [ ] different events get different colors in type mode when types differ
- [ ] type mode: event.type not in fetchedData.events types â†’ returns undefined (BUG: no fallback inside switch)
- [ ] module mode: event.module_ids is empty â†’ event.module_ids[0] is undefined â†’ colorMap.get(undefined) â†’ returns undefined (BUG)
- [ ] staff mode: event.staff_ids is empty â†’ event.staff_ids[0] is undefined â†’ colorMap.get(undefined) â†’ returns undefined (BUG)
- [ ] module mode: event.module_ids[0] references an id in fetchedData.modules â†’ returns valid color from palette
- [ ] status mode: event.status is not in fetchedData.states keys â†’ colorMap.get() returns undefined (BUG)
- [ ] type mode: all events have the same type â†’ palette has length 1 â†’ all events get same color
- [ ] staff mode: event with multiple staff_ids only uses staff_ids[0] for color lookup
- [ ] returns undefined for staff mode when event has no staff_ids (BUG: staff_ids[0] undefined)
- [ ] type mode with single unique type gives all events the same color
- [ ] module mode returns undefined when event's module not in fetchedData.modules (BUG)
- [ ] returns "#000000" when canvas context is unavailable
- [ ] returns "#ffffff" for very dark background color
- [ ] returns "#000000" for very light background color
- [ ] uses fallback "#ffffff" as bg when resolvedBg and bgColor are both empty
- [ ] stores the callback function
- [ ] clicking colorDropBtn toggles "open" class on #colorDrop
- [ ] clicking outside #colorDrop removes "open" class
- [ ] clicking a color-menu-item updates colorMode.value and calls updateColorCallback
- [ ] clicking a color-menu-item when updateColorCallback is null does not throw
- [ ] clicking #themeToggle toggles darkMode.value and calls updateColorCallback
- [ ] clicking #themeToggle when updateColorCallback is null does not throw
- [ ] applyColorModeUI sets active class only on matching mode item
- [ ] applyColorModeUI sets label text from COLOR_MODE_LABELS or falls back to mode string itself

#### 1.3 api.js
- [ ] fetchDegrees calls correct endpoint
- [ ] throws on non-ok responses
- [ ] fetchAll calls all endpoints
- [ ] individual wrappers delegate to correct paths
- [ ] fetchDegreeDetail includes id in URL path
- [ ] fetchDegreeDetail throws on non-ok response
- [ ] fetchAll rejects if any single fetch fails
- [ ] fetch with network error (fetch rejects, not just non-ok)
- [ ] fetchModules calls /modules?include_relationships=true
- [ ] fetchEvents calls /events?include_relationships=true
- [ ] fetchStaff calls /staff
- [ ] fetchLocations calls /locations
- [ ] fetchSemesters calls /semesters
- [ ] fetchAll returns results in correct order [degrees, modules, events, staff, locations, semesters]

#### 1.4 filters.js
- [ ] filters by degree AND semester combined
- [ ] hidden modules excludes their events
- [ ] hidden staff excludes events with that staff
- [ ] hidden locations excludes events at that location
- [ ] selected types only shows matching types
- [ ] selected staff only shows events with matching staff
- [ ] selected locations only shows events at matching location
- [ ] selected status only shows events with matching status
- [ ] returns empty when all modules hidden
- [ ] event with multiple module_ids: included if any module matches
- [ ] combined selected modules from degree + more modules
- [ ] hidden status excludes events with that status
- [ ] hidden types excludes events of that type
- [ ] degree set + no semester + no selected modules â†’ all degree modules pass through (branch: selectedDegreeModules.length === 0)
- [ ] degree set + semester set + no modules match semester â†’ events list is empty
- [ ] degree set + selectedModules includes a degree module AND a non-degree module â†’ both paths merge
- [ ] all filter dimensions active simultaneously: degree + semester + selectedModule + hiddenModule + selectedType + hiddenType + selectedStatus + hiddenStatus + selectedStaff + hiddenStaff + selectedLocation + hiddenLocation
- [ ] event with empty module_ids â†’ el.module_ids.some(...) returns false â†’ event excluded
- [ ] all filter dimensions simultaneously: degree + semester + module + type + status + staff + location
- [ ] hidden events from pinned are excluded even when they match all filters
- [ ] getEvents with entirely empty fetchedData.events returns []
- [ ] getEvents with empty fetchedData.modules returns []
- [ ] event hidden by getHiddenEvents (pinned event) is excluded even though it passes all filters
- [ ] selected staff with event having multiple staff_ids: passes if ANY staff matches (.some())
- [ ] hidden staff with event having multiple staff_ids: excluded if ANY staff matches (.some())
- [ ] degree filter uses in operator on degree_ids object â€” checks string key existence (potential type coercion BUG)
- [ ] completely empty fetchedData.events â†’ returns []
- [ ] completely empty fetchedData.modules â†’ returns [] (no module ids match anything)
- [ ] selected modules that don't exist in fetchedData.modules still form the module list but no events match them
- [ ] hiddenModules filters out modules even when selectedDegreeModules selected them
- [ ] one status SELECTED + another status HIDDEN: only selected status events shown, hidden ones also excluded
- [ ] returns empty when no events are pinned
- [ ] hides similar events (same module + type) when one is pinned
- [ ] does not hide the pinned event itself
- [ ] does not hide events with different type even if same module
- [ ] handles pinned event ID not found in events gracefully
- [ ] multiple pinned events accumulate hidden events
- [ ] pinning two events of same module+type: each pin only excludes itself, not other pins (BUG: cross-pin hiding)
- [ ] hidden list may contain duplicates when two pinned events overlap on hidden targets (BUG: no dedup in hidden.concat)
- [ ] event with multiple module_ids: pinning it hides events sharing ANY module_id with same type (.some() path)
- [ ] pinned event whose module_ids is empty: pinnedEvent.module_ids.includes(id) never true â†’ no events hidden
- [ ] resets degree and semester to null
- [ ] clears all Sets
- [ ] resets all status values to null
- [ ] clears pinnedEvents
- [ ] calls update callback if set
- [ ] does not throw if updateCallback is null
- [ ] creates row with correct data-key attribute
- [ ] creates row with correct data-state attribute
- [ ] click toggles tri-state via nextTriState
- [ ] disabled row has "dimmed" class
- [ ] always attaches click handler even when disabled (BUG: `if (true)` dead branch)
- [ ] count label reflects event count
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
- [ ] creates row div with class frow and correct data-key and data-state
- [ ] disabled=true adds dimmed class to row and tri span
- [ ] disabled=false: no dimmed class
- [ ] clicking row toggles tri-state: neutralâ†’selectedâ†’hiddenâ†’neutral cycle
- [ ] click handler calls provided handler function with event
- [ ] count span shows the count number as text
- [ ] if (true) always attaches click handler even when disabled (BUG: dead code branch)
- [ ] selecting a degree option sets filterState.degree to the parsed integer
- [ ] selecting "Alle" (empty value) sets filterState.degree to null
- [ ] always resets filterState.semester to null
- [ ] calls updateCallback when set
- [ ] does not throw when updateCallback is null
- [ ] selecting a semester option sets filterState.semester to the parsed integer
- [ ] selecting "Alle" (empty value) sets filterState.semester to null
- [ ] SELECTED: adds to selectedModules, removes from hiddenModules
- [ ] HIDDEN: adds to hiddenModules, removes from selectedModules
- [ ] NEUTRAL: removes from both sets
- [ ] NaN moduleId: does not modify any sets, still calls updateCallback
- [ ] SELECTED: adds to selectedTypes, removes from hiddenTypes
- [ ] HIDDEN: adds to hiddenTypes, removes from selectedTypes
- [ ] sets filterState.status[stateKey] to the provided newState
- [ ] stateKey that is not a valid StatusKey: sets arbitrary key on status object (BUG: no validation)
- [ ] SELECTED: adds to selectedStaff, removes from hiddenStaff
- [ ] HIDDEN: adds to hiddenStaff, removes from selectedStaff
- [ ] NaN staffId: does not modify any sets AND does not call updateCallback (callback is inside the if block)
- [ ] calls updateCallback only when staffId is valid
- [ ] SELECTED: adds to selectedLocations, removes from hiddenLocations
- [ ] HIDDEN: adds to hiddenLocations, removes from selectedLocations
- [ ] NaN locationId: does not modify any sets AND does not call updateCallback
- [ ] calls updateCallback only when locationId is valid

#### 1.5 sharing_storage.js
- [ ] saveState writes serialized state to localStorage
- [ ] restoreState reads and applies state from localStorage
- [ ] returns true on successful save
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
- [ ] null value: param not set
- [ ] undefined value: param not set
- [ ] empty string: param not set
- [ ] empty array: param not set
- [ ] non-empty array: param set as comma-joined encoded values
- [ ] scalar value: param set as encoded string
- [ ] includes degree param when set
- [ ] includes semester param when set
- [ ] includes selected modules as comma-separated
- [ ] includes pin param with pinned event IDs
- [ ] includes view and colorMode params
- [ ] includes darkMode param
- [ ] encodes status params with status_ prefix
- [ ] does not include null degree
- [ ] includes customMap entries when present
- [ ] does not include empty Sets in URL (sm/hm/st/ht/ss/hs/sl/hl omitted when empty)
- [ ] customMap with size 0: no cmap param in URL
- [ ] status entries with null value: no status_ param for that key
- [ ] all params present simultaneously: URL contains all expected keys
- [ ] special characters in type strings are properly encoded
- [ ] removes the storage key from localStorage
- [ ] URL params take precedence over localStorage
- [ ] falls back to localStorage if no URL params
- [ ] restoreState does nothing when localStorage is empty and no URL params
- [ ] URL has only a status_ param (no standard keys): still detected as hasUrlState â†’ applyParams path taken
- [ ] malformed JSON in localStorage: caught silently, state unchanged
- [ ] ignores unknown status values in URL params
- [ ] URL has d param with non-numeric value: filterState.degree set to null (parseInt â†’ NaN â†’ null)
- [ ] URL has s param with non-numeric value: filterState.semester set to null
- [ ] URL dm param with value false: darkMode.value set to false
- [ ] URL dm param with value true: darkMode.value set to true
- [ ] URL dm param with any other value: darkMode.value set to false (not === true)
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
- [ ] missing param returns []
- [ ] param with 1,2,3 returns [1, 2, 3]
- [ ] param with a,b,c returns [] for getNumArray (all NaN)
- [ ] param with 1,,3 filters empty strings, returns [1, 3]
- [ ] getStrArray with encoded values decodes them correctly
- [ ] saveFetchedData returns true
- [ ] loadFetchedDataAsync returns data from localStorage fallback
- [ ] loadFetchedDataAsync returns null when nothing stored
- [ ] saveFetchedData with no IDB and localStorage throwing: returns false
- [ ] loadFetchedDataAsync with IDB returning data: returns IDB data (not localStorage)
- [ ] loadFetchedDataAsync with IDB empty: falls through to localStorage
- [ ] loadFetchedDataAsync with IDB throwing: falls through to localStorage
- [ ] loadFetchedData (localStorage) with malformed JSON: returns null (catch path)
- [ ] sets textContent on #shareLinkSuccessMSg when element exists
- [ ] does nothing when element is missing (early return)

#### 1.6 popup.js
- [ ] populates title from event data
- [ ] populates type from event data
- [ ] populates time with weekday, start and end
- [ ] populates location name from fetched locations
- [ ] shows dash when location not found
- [ ] populates staff names joined by comma
- [ ] shows dash when no staff found
- [ ] populates module names
- [ ] shows credits as range when multiple different credits
- [ ] shows dash for credits when no modules
- [ ] shows degree names from module to degree lookup
- [ ] hides degrees section when no degrees found
- [ ] sets pin button state based on pinnedEvents â€” not pinned
- [ ] sets pin button state based on pinnedEvents â€” pinned
- [ ] adds show class to popup element
- [ ] does nothing for non-existent event
- [ ] shows single credit value with "LP" when all modules have same credits
- [ ] deduplicates staff names
- [ ] deduplicates degree names
- [ ] popup with event weekday 0 or >7 shows empty weekday label (BUG: WEEKDAY_LABELS undefined)
- [ ] re-opening popup for different event replaces old data
- [ ] pin button does NOT accumulate event listeners despite no removeEventListener (DOM deduplicates same function ref)
- [ ] event not in fetchedData.events: no popup shown (return path)
- [ ] popup element missing from DOM: no error (return path)
- [ ] event.weekday outside 1-7 (e.g. 0 or 8): WEEKDAY_LABELS[weekday] is undefined â†’ displays empty string via || "" (BUG)
- [ ] credits: single module â†’ credits.length == 1 path â†’ shows X LP
- [ ] credits: two modules with same credits â†’ deduplicated by Set â†’ credits.length == 1 path
- [ ] credits: module with credits=undefined â†’ filtered out by x !== undefined â†’ may reduce to 0
- [ ] staff names deduplicated by new Set(...) â€” duplicate staff_ids produce single name
- [ ] degree names deduplicated by new Set(degreeTexts) â€” no duplicates in display
- [ ] module not found in fetchedData.modules: .find() returns undefined â†’ degree_ids loop skips it via if (!module) continue
- [ ] pin button listener: pin button does NOT accumulate addEventListener listeners (DOM deduplicates same function ref)
- [ ] statusState not found in fetchedData.states: shows empty string via ?? ""
- [ ] re-opening popup for different event: old data replaced by new data
- [ ] clicking outside popup box removes show class
- [ ] clicking inside popup box does NOT remove show class
- [ ] closeBtn missing from DOM: no event listener attached, no error
- [ ] popup element missing from DOM: no event listener attached, no error
- [ ] toggles pin state for event
- [ ] calls updatePopupCallback after toggle
- [ ] does nothing when eventId is NaN
- [ ] eventId is NaN (btn.dataset.eventId is non-numeric or empty): early return, no state change
- [ ] updatePopupCallback is null: does not throw after toggle
- [ ] after toggle, openPopup(eventId) is called to refresh pin button UI

#### 1.7 calendar.js
- [ ] setCalendarUpdateCallback stores callback without error
- [ ] setOpenPopupCallback stores callback without error
- [ ] getCalendar returns null when initCalendar has not been called
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
- [ ] calendarInstance is null: returns without error
- [ ] calendarInstance exists: calls changeView and updates view.value
- [ ] updates view.value state
- [ ] does nothing if calendarInstance is null
- [ ] returns a Date that is a Monday (getDay() === 1)
- [ ] when today is Monday: returns today
- [ ] when today is Wednesday: returns previous Monday
- [ ] when today is Sunday: day===0 â†’ diff = date - 0 + (-6) â†’ check correct Monday (BUG potential)
- [ ] when today is Saturday: day===6 â†’ diff = date - 6 + 1 â†’ returns previous Monday
- [ ] BUG edge case: when today is Sunday, getDay()===0 path may produce wrong week
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
- [ ] empty events array â†’ returns []
- [ ] event with weekday=1 (Monday): fcDay = 1 % 7 = 1
- [ ] event with weekday=7 (Sunday): fcDay = 7 % 7 = 0
- [ ] event with weekday=6 (Saturday): fcDay = 6 % 7 = 6
- [ ] event with weekday=5 (Friday): fcDay = 5 % 7 = 5
- [ ] pinned event: classNames includes pinned
- [ ] unpinned event: classNames filtered to empty array
- [ ] getEventColor returns falsy/undefined: color falls back to #3B82F6
- [ ] getEventColor returns valid color: that color is used
- [ ] module_ids reference existing modules: moduleNames populated with names
- [ ] module_ids reference non-existent modules: .find() returns undefined â†’ filtered out by .filter(Boolean) â†’ empty moduleNames
- [ ] event id is stringified in FullCalendar event (id: String(ev.id))
- [ ] typeShort is always ? (commented-out map)
- [ ] statusColor is always #6b7280 (commented-out status colors)
- [ ] all fc event fields present: daysOfWeek, startTime, endTime, extendedProps, display, classNames
- [ ] creates div with ev-title containing typeShort + title
- [ ] moduleNames length > 0: creates ev-meta div with first module name
- [ ] moduleNames length === 0: no ev-meta div created
- [ ] creates sdot span with statusColor background
- [ ] creates ev-pin-icon span with click handler
- [ ] pin icon click calls onPinToggle with numeric event id
- [ ] pin icon click stopPropagation prevents event click handler
- [ ] calls openEventPopupCallback with numeric event id when set
- [ ] does nothing when openEventPopupCallback is null (no error)
- [ ] preventDefault is called on jsEvent
- [ ] stores callback without error
- [ ] calendarInstance is null: no error, returns early
- [ ] calendarInstance exists: removes old events and adds new source from getEvents + buildCalendarEvents
- [ ] not pinned: adds to pinnedEvents
- [ ] already pinned: removes from pinnedEvents
- [ ] calls updateCalendarCallback when set
- [ ] does not throw when updateCalendarCallback is null

#### 1.8 app.js
- [ ] cachedData available: populates fetchedData from cache, does not call fetchAll
- [ ] cachedData null: calls fetchAll, assigns results to fetchedData, calls saveFetchedData
- [ ] restoreState is called before data population
- [ ] initApp is called after data is ready
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
- [ ] calls updateFilters, updateCalendar, saveState in sequence
- [ ] #resetAllBtn click calls clearStateStorage and clearFilters
- [ ] #resetAllBtn missing: no error
- [ ] click: generates share link, writes to clipboard
- [ ] clipboard success: shows Link wurde kopiert! message
- [ ] clipboard failure: shows Link konnte nicht kopiert werden! message
- [ ] #shareLinkSuccessMSg missing: no error on success/failure path
- [ ] #shareLink element: shows generated link text
- [ ] #share-link-popup: adds show class
- [ ] shareLinkCloseBtn closes share link popup
- [ ] clicking outside share link popup box closes it
- [ ] weitereToggle toggles "open" class on #weitereExp
- [ ] #shareLinkCloseBtn click: removes show from #share-link-popup
- [ ] #share-link-popup click outside .popup-box: removes show
- [ ] #share-link-popup click inside .popup-box: does not remove show
- [ ] #shareLinkCloseBtn missing: no event listener, no error
- [ ] #share-link-popup missing: no event listener, no error
- [ ] #weitereToggle click: toggles open class on #weitereExp
- [ ] #weitereToggle missing: no error
- [ ] #weitereExp missing: no error (optional chaining)

### 2. Integration Tests

#### 2.1 Filters + State
- [ ] changing filterState.degree and calling getEvents reflects new filter
- [ ] pinning an event causes getHiddenEvents to exclude similar events from getEvents
- [ ] multiple filter dimensions combined: degree + type + staff
- [ ] adding to selectedModules and hiddenModules together works correctly

#### 2.2 Color + State
- [ ] changing colorMode.value and calling getEventColor returns different palettes
- [ ] getEventColor with empty fetchedData returns undefined (no matching entry)
- [ ] getEventColor uses fetchedData.events for type-based coloring

#### 2.3 Storage + State
- [ ] saveState/restoreState round-trip preserves filterState
- [ ] getShareLink/applyParams round-trip preserves state
- [ ] saveFetchedData/loadFetchedDataAsync round-trip (localStorage fallback)

#### 2.4 Popup + State
- [ ] openPopup reads correct data from fetchedData
- [ ] pin toggle in popup updates pinnedEvents and re-renders

### 3. Functional Tests
- [ ] selecting a degree shows only its modules events, then selecting module narrows further
- [ ] hiding a type removes events, un-hiding restores them
- [ ] selecting a status filters accordingly, disabling shows all again
- [ ] clearFilters restores all events after complex filtering
- [ ] opening popup, pinning event, closing: getEvents excludes similar events
- [ ] switching color modes produces different colors for same event
- [ ] applying filters then getShareLink then restoreState: same events visible

### 4. End-to-End Tests
- [ ] fetch data, populate state, getEvents, getEventColor, buildCalendarEvents flow
- [ ] fetch data, apply filters, getEvents, updateCalendar cycle
- [ ] fetch fails: error propagation, no state corruption
- [ ] set filters, saveState, clear, restoreState, filters restored
- [ ] URL params override localStorage
- [ ] pin event, filter by degree, pinned event still affects hidden calculation

### 5.1 app.js

#### initApp
- [ ] semesterBadge: handles missing #semesterBadge element gracefully
- [ ] semesterBadge: handles empty fetchedData.semesters array (no error, fallback to "Semester")
- [ ] semesterBadge: handles missing .name property on semester (fallback to "Semester")
- [ ] calls all init/update functions even if some DOM elements are missing
- [ ] does not throw if set*Callback functions are undefined
- [ ] loading overlay: handles missing #loadingOverlay element

#### globalEventListeners
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

#### update
- [ ] calls updateFilters, updateCalendar, and saveState in order

### 5.2 calendar.js

#### initCalendar
- [ ] creates calendarInstance with correct initial view from view.value
- [ ] sets up .vbtn click handlers for all present buttons
- [ ] handles missing .vbtn elements gracefully
- [ ] does not throw if FullCalendar is undefined (simulate missing import)

#### buildCalendarEvents
- [ ] returns empty array if input events is empty
- [ ] handles events with missing/empty module_ids array
- [ ] handles events with module_ids referencing non-existent modules (moduleNames empty)
- [ ] sets fallback color if getEventColor returns falsy
- [ ] sets pinned class only for pinned events
- [ ] event id is always stringified
- [ ] typeShort is always "?" (hardcoded)

#### getFixedMonday
- [ ] returns a Date object
- [ ] always returns a Monday (getDay() === 1)
- [ ] edge case: when today is Sunday (getDay()===0), returns previous Monday

#### changeCalendarView
- [ ] updates view.value to new viewName

#### updateCalendar
- [ ] exits early if calendarInstance is null
- [ ] removes all events before adding new ones
- [ ] adds correct number of events from buildCalendarEvents

#### renderEventContent
- [ ] sets CSS variables for color and contrast
- [ ] creates title, meta, dot, and pin elements
- [ ] attaches pin click handler
- [ ] handles missing/empty moduleNames array
- [ ] handles missing getContrastTextColor function (simulate error)

### 5.3 filters.js

#### getEvents
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

#### getHiddenEvents
- [ ] returns [] if no events are pinned
- [ ] hides events sharing ANY module with same type as pinned event
- [ ] handles multiple pinned events (accumulates hidden events)
- [ ] does not deduplicate hidden events (BUG: duplicates possible)

#### clearFilters
- [ ] resets all filterState properties to default
- [ ] calls updateCallback if set

#### createFilterRow
- [ ] creates row with correct data-key and data-state attributes

#### fillDegreesSemesters
- [ ] handles missing degreeEl, semesterEl, or semFilterSec elements
- [ ] handles empty fetchedData.degrees array
- [ ] handles degree with no semesters

#### fillModules
- [ ] handles missing moduleCon or moreModuleCon elements
- [ ] handles empty fetchedData.modules array
- [ ] handles modules with no events

#### fillTypes, fillStates, fillStaff, fillLocations
- [ ] handle missing container elements
- [ ] handle empty fetchedData.events, states, staff, or locations arrays
- [ ] skip types/staff/locations with no events unless selected


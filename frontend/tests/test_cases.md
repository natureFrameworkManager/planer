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

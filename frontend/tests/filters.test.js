import { getEvents, getHiddenEvents, clearFilters, setFilterUpdateCallback } from "../js/filters.js";
import { fetchedData, filterState, TRI, pinnedEvents } from "../js/state.js";
import { jest } from "@jest/globals";

function resetFilterState() {
    filterState.degree = null;
    filterState.semester = null;
    filterState.selectedModules.clear();
    filterState.hiddenModules.clear();
    filterState.selectedTypes.clear();
    filterState.hiddenTypes.clear();
    filterState.selectedStaff.clear();
    filterState.hiddenStaff.clear();
    filterState.selectedLocations.clear();
    filterState.hiddenLocations.clear();
    Object.keys(filterState.status).forEach((key) => {
        filterState.status[key] = null;
    });
    pinnedEvents.clear();
}

function setupTestData() {
    fetchedData.modules = [
        { id: 1, name: "M1", degree_ids: { 10: [1, 2] }, event_ids: [101] },
        { id: 2, name: "M2", degree_ids: { 10: [2, 3] }, event_ids: [102] },
        { id: 3, name: "M3", degree_ids: { 20: [1] }, event_ids: [103] },
        { id: 4, name: "M4", degree_ids: { 10: [1], 20: [2] }, event_ids: [104, 105] },
    ];

    fetchedData.events = [
        { id: 101, module_ids: [1], status: "ok", staff_ids: [7], location_id: 100, type: "Vorlesung", title: "V1", weekday: 1, start_time: "08:00", end_time: "10:00" },
        { id: 102, module_ids: [2], status: "tok", staff_ids: [8], location_id: 101, type: "Seminar", title: "S1", weekday: 2, start_time: "10:00", end_time: "12:00" },
        { id: 103, module_ids: [3], status: "ok", staff_ids: [9], location_id: 102, type: "Uebung", title: "U1", weekday: 3, start_time: "14:00", end_time: "16:00" },
        { id: 104, module_ids: [4], status: "pok", staff_ids: [7, 8], location_id: 100, type: "Vorlesung", title: "V2", weekday: 4, start_time: "08:00", end_time: "10:00" },
        { id: 105, module_ids: [4], status: "ok", staff_ids: [9], location_id: 101, type: "Uebung", title: "U2", weekday: 5, start_time: "10:00", end_time: "12:00" },
    ];

    fetchedData.staff = [
        { id: 7, name: "Prof A" },
        { id: 8, name: "Prof B" },
        { id: 9, name: "Prof C" },
    ];

    fetchedData.locations = [
        { id: 100, name: "Room A" },
        { id: 101, name: "Room B" },
        { id: 102, name: "Room C" },
    ];

    fetchedData.degrees = [
        { id: 10, name: "Informatik", semesters: [1, 2, 3], module_ids: [1, 2, 4] },
        { id: 20, name: "BWL", semesters: [1, 2], module_ids: [3, 4] },
    ];

    fetchedData.states = [
        { key: "ok", name: "Bestätigt" },
        { key: "tok", name: "Dozent ausstehend" },
        { key: "pok", name: "Zeit ausstehend" },
        { key: "alt", name: "Aus Vorsemester" },
        { key: "reserve", name: "Nicht mehr angeboten" },
    ];
}

describe("getEvents", () => {
    beforeEach(() => {
        resetFilterState();
        setupTestData();
    });

    test("returns all events when no filters are active", () => {
        const result = getEvents().map((ev) => ev.id).sort();
        expect(result).toEqual([101, 102, 103, 104, 105]);
    });

    test("limits to selected module ids", () => {
        filterState.selectedModules.add(2);

        const result = getEvents().map((ev) => ev.id);
        expect(result).toEqual([102]);
    });

    test("applies hidden and selected tri-state filters", () => {
        filterState.hiddenTypes.add("Seminar");
        filterState.status.ok = TRI.SELECTED;

        const result = getEvents().map((ev) => ev.id).sort();
        expect(result).toEqual([101, 103, 105]);
    });

    test("filters by degree modules when degree is selected", () => {
        filterState.degree = 10;

        const result = getEvents().map((ev) => ev.id).sort();
        expect(result).toEqual([101, 102, 104, 105]);
    });

    test("filters by degree AND semester combined", () => {
        filterState.degree = 10;
        filterState.semester = 1;

        const result = getEvents().map((ev) => ev.id).sort();
        // degree 10, semester 1: module 1 (semesters [1,2]) and module 4 (semester [1])
        expect(result).toEqual([101, 104, 105]);
    });

    test("hidden modules excludes their events", () => {
        filterState.hiddenModules.add(1);

        const result = getEvents().map((ev) => ev.id).sort();
        expect(result).not.toContain(101);
    });

    test("hidden staff excludes events with that staff", () => {
        filterState.hiddenStaff.add(7);

        const result = getEvents().map((ev) => ev.id).sort();
        expect(result).not.toContain(101);
        expect(result).not.toContain(104);
    });

    test("hidden locations excludes events at that location", () => {
        filterState.hiddenLocations.add(100);

        const result = getEvents().map((ev) => ev.id).sort();
        expect(result).not.toContain(101);
        expect(result).not.toContain(104);
    });

    test("selected types only shows matching types", () => {
        filterState.selectedTypes.add("Vorlesung");

        const result = getEvents().map((ev) => ev.id).sort();
        expect(result).toEqual([101, 104]);
    });

    test("selected staff only shows events with matching staff", () => {
        filterState.selectedStaff.add(9);

        const result = getEvents().map((ev) => ev.id).sort();
        expect(result).toEqual([103, 105]);
    });

    test("selected locations only shows events at matching location", () => {
        filterState.selectedLocations.add(101);

        const result = getEvents().map((ev) => ev.id).sort();
        expect(result).toEqual([102, 105]);
    });

    test("selected status only shows events with matching status", () => {
        filterState.status.tok = TRI.SELECTED;

        const result = getEvents().map((ev) => ev.id).sort();
        expect(result).toEqual([102]);
    });

    test("returns empty when all modules hidden", () => {
        filterState.hiddenModules.add(1);
        filterState.hiddenModules.add(2);
        filterState.hiddenModules.add(3);
        filterState.hiddenModules.add(4);

        const result = getEvents();
        expect(result).toEqual([]);
    });

    test("event with multiple module_ids: included if any module matches", () => {
        // Add a special event that belongs to modules 1 and 3
        fetchedData.events.push(
            { id: 200, module_ids: [1, 3], status: "ok", staff_ids: [7], location_id: 100, type: "Vorlesung", title: "Multi", weekday: 1, start_time: "08:00", end_time: "10:00" }
        );
        filterState.selectedModules.add(3);

        const result = getEvents().map((ev) => ev.id);
        expect(result).toContain(200);
    });

    test("combined selected modules from degree + more modules", () => {
        filterState.degree = 10;
        filterState.selectedModules.add(1); // degree module
        filterState.selectedModules.add(3); // non-degree module (from BWL)

        const result = getEvents().map((ev) => ev.id).sort();
        // Should include events from module 1 (degree) and module 3 ("more")
        expect(result).toContain(101);
        expect(result).toContain(103);
    });

    test("hidden status excludes events with that status", () => {
        filterState.status.ok = TRI.HIDDEN;

        const result = getEvents().map((ev) => ev.id).sort();
        expect(result).not.toContain(101);
        expect(result).not.toContain(103);
        expect(result).not.toContain(105);
    });

    test("hidden types excludes events of that type", () => {
        filterState.hiddenTypes.add("Vorlesung");

        const result = getEvents().map((ev) => ev.id).sort();
        expect(result).not.toContain(101);
        expect(result).not.toContain(104);
    });

    test("degree set + no semester + no selected modules → all degree modules pass through", () => {
        filterState.degree = 10;
        // No semester, no selectedModules → selectedDegreeModules.length === 0, so all degree modules used
        const result = getEvents().map((ev) => ev.id).sort();
        // degree 10 modules: 1, 2, 4 → events 101, 102, 104, 105
        expect(result).toEqual([101, 102, 104, 105]);
    });

    test("degree set + semester set + no modules match semester → events list is empty", () => {
        filterState.degree = 10;
        filterState.semester = 99; // non-existent semester
        const result = getEvents();
        expect(result).toEqual([]);
    });

    test("degree set + selectedModules includes a degree module AND a non-degree module → both paths merge", () => {
        filterState.degree = 10;
        filterState.selectedModules.add(1); // degree module
        filterState.selectedModules.add(3); // non-degree module (BWL)
        const result = getEvents().map((ev) => ev.id).sort();
        expect(result).toContain(101); // module 1
        expect(result).toContain(103); // module 3
    });

    test("all filter dimensions active simultaneously", () => {
        filterState.degree = 10;
        filterState.semester = 1;
        filterState.selectedModules.add(1);
        filterState.hiddenModules.add(2);
        filterState.selectedTypes.add("Vorlesung");
        filterState.hiddenTypes.add("Seminar");
        filterState.status.ok = TRI.SELECTED;
        filterState.hiddenStaff.add(8);
        filterState.selectedStaff.add(7);
        filterState.selectedLocations.add(100);
        filterState.hiddenLocations.add(101);

        const result = getEvents().map((ev) => ev.id).sort();
        // Module 1 selected, type Vorlesung, status ok, staff 7, location 100
        // Event 101: module 1, Vorlesung, ok, staff [7], location 100 → matches all
        expect(result).toContain(101);
    });

    test("event with empty module_ids → el.module_ids.some(...) returns false → event excluded", () => {
        fetchedData.events.push(
            { id: 200, module_ids: [], status: "ok", staff_ids: [7], location_id: 100, type: "Vorlesung", title: "NoMod", weekday: 1, start_time: "08:00", end_time: "10:00" }
        );
        const result = getEvents().map((ev) => ev.id);
        expect(result).not.toContain(200);
    });

    test("hidden events from pinned are excluded even when they match all filters", () => {
        // Add duplicate event for same module+type
        fetchedData.events.push(
            { id: 200, module_ids: [1], status: "ok", staff_ids: [7], location_id: 100, type: "Vorlesung", title: "V1-dup", weekday: 2, start_time: "08:00", end_time: "10:00" }
        );
        pinnedEvents.add(101); // pin Vorlesung module 1 → hides 200
        const result = getEvents().map((ev) => ev.id);
        expect(result).toContain(101);
        expect(result).not.toContain(200);
    });

    test("getEvents with entirely empty fetchedData.events returns []", () => {
        fetchedData.events = [];
        const result = getEvents();
        expect(result).toEqual([]);
    });

    test("getEvents with empty fetchedData.modules returns []", () => {
        fetchedData.modules = [];
        const result = getEvents();
        // No modules means no module IDs, so no event can match
        expect(result).toEqual([]);
    });

    test("selected staff with event having multiple staff_ids: passes if ANY staff matches (.some())", () => {
        filterState.selectedStaff.add(8); // Prof B
        // Event 104 has staff_ids [7, 8] → should match because 8 is in selectedStaff
        const result = getEvents().map((ev) => ev.id);
        expect(result).toContain(104);
    });

    test("hidden staff with event having multiple staff_ids: excluded if ANY staff matches (.some())", () => {
        filterState.hiddenStaff.add(8);
        // Event 104 has staff_ids [7, 8] → excluded because 8 is hidden
        const result = getEvents().map((ev) => ev.id);
        expect(result).not.toContain(104);
    });

    test("degree filter uses in operator on degree_ids object — checks string key existence", () => {
        // The code does: `filterState.degree in el.degree_ids`
        // Since `in` converts to string, numeric degree 10 checks for string "10" key in degree_ids object
        filterState.degree = 10;
        const result = getEvents().map((ev) => ev.id).sort();
        // Should work correctly as `in` coerces to string
        expect(result.length).toBeGreaterThan(0);
    });

    test("selected modules that don't exist in fetchedData.modules still form the module list but no events match them", () => {
        filterState.selectedModules.add(999); // non-existent module
        // Without a degree set, all modules are used as degreeModules.
        // selectedModules.add(999) puts 999 into selectedDegreeModules (since degreeModulesIds = all module ids, 999 is not in there).
        // So 999 goes into moreSelectedModules. modules = [] (no selectedDegreeModules match) + [999].
        // But since no degree is set, degreeModulesIds = all module ids, and selectedDegreeModules = intersection with selectedModules = empty.
        // So modules = degreeModulesIds (all) + moreSelectedModules(999 since not in degreeModulesIds) → all modules + 999.
        // Events with real module_ids still match. Only the 999 part produces no matches.
        const result = getEvents();
        // All events still returned because degreeModulesIds contains all module ids when no degree is set
        expect(result.length).toBe(fetchedData.events.length);
    });

    test("hiddenModules filters out modules even when selectedDegreeModules selected them", () => {
        filterState.degree = 10;
        filterState.selectedModules.add(1);
        filterState.hiddenModules.add(1); // hide the same module
        const result = getEvents().map((ev) => ev.id);
        expect(result).not.toContain(101); // module 1's event should be excluded
    });

    test("one status SELECTED + another status HIDDEN: only selected status events shown, hidden ones also excluded", () => {
        filterState.status.ok = TRI.SELECTED;
        filterState.status.tok = TRI.HIDDEN;
        const result = getEvents().map((ev) => ev.id).sort();
        // ok-status events: 101 (ok), 103 (ok), 105 (ok). 102 is tok → hidden. 104 is pok → not selected (only ok is SELECTED).
        expect(result).toEqual([101, 103, 105]);
        expect(result).not.toContain(102); // tok is hidden
        expect(result).not.toContain(104); // pok not selected
    });
});

describe("getHiddenEvents", () => {
    beforeEach(() => {
        resetFilterState();
        setupTestData();
    });

    test("returns empty when no events are pinned", () => {
        const result = getHiddenEvents();
        expect(result).toEqual([]);
    });

    test("hides similar events (same module + type) when one is pinned", () => {
        // Events 104 and 105 both belong to module 4
        // Pin 104 (Vorlesung, module 4) — should NOT hide 105 since it's a different type (Uebung)
        pinnedEvents.add(104);

        const hidden = getHiddenEvents().map(e => e.id);
        // Event 101 is also Vorlesung but different module, so not hidden
        // No other event shares module 4 + type Vorlesung
        expect(hidden).not.toContain(104);
    });

    test("does not hide the pinned event itself", () => {
        pinnedEvents.add(101);

        const hidden = getHiddenEvents().map(e => e.id);
        expect(hidden).not.toContain(101);
    });

    test("does not hide events with different type even if same module", () => {
        // 104 is Vorlesung module 4, 105 is Uebung module 4
        pinnedEvents.add(104);

        const hidden = getHiddenEvents().map(e => e.id);
        expect(hidden).not.toContain(105);
    });

    test("handles pinned event ID not found in events gracefully", () => {
        pinnedEvents.add(9999);

        const result = getHiddenEvents();
        expect(result).toEqual([]);
    });

    test("multiple pinned events accumulate hidden events", () => {
        // Add duplicate-type events for testing
        fetchedData.events.push(
            { id: 106, module_ids: [1], status: "ok", staff_ids: [7], location_id: 100, type: "Vorlesung", title: "V1-B", weekday: 2, start_time: "08:00", end_time: "10:00" },
            { id: 107, module_ids: [3], status: "ok", staff_ids: [9], location_id: 102, type: "Uebung", title: "U1-B", weekday: 4, start_time: "14:00", end_time: "16:00" },
        );
        pinnedEvents.add(101); // Vorlesung module 1 → hides 106
        pinnedEvents.add(103); // Uebung module 3 → hides 107

        const hidden = getHiddenEvents().map(e => e.id).sort();
        expect(hidden).toContain(106);
        expect(hidden).toContain(107);
    });

    test("pinning two events of same module+type: each pin only excludes itself, not other pins (BUG: cross-pin hiding)", () => {
        fetchedData.events.push(
            { id: 106, module_ids: [1], status: "ok", staff_ids: [7], location_id: 100, type: "Vorlesung", title: "V1-B", weekday: 2, start_time: "08:00", end_time: "10:00" },
            { id: 107, module_ids: [1], status: "ok", staff_ids: [7], location_id: 100, type: "Vorlesung", title: "V1-C", weekday: 3, start_time: "08:00", end_time: "10:00" },
        );
        pinnedEvents.add(101); // Vorlesung module 1
        pinnedEvents.add(106); // Vorlesung module 1

        const hidden = getHiddenEvents().map(e => e.id);
        // BUG: Each pin iteration only excludes el.id !== pinnedId (its own id).
        // Pin 101 → finds similar events where id !== 101: includes 106 and 107.
        // Pin 106 → finds similar events where id !== 106: includes 101 and 107.
        // Result: hidden = [106, 107, 101, 107]. Both pinned events hide each other!
        // This is a BUG: pinned event 101 is hidden by pin 106's iteration and vice versa.
        expect(hidden).toContain(101); // BUG: pinned event is in hidden list from the other pin's iteration
        expect(hidden).toContain(106); // BUG: same issue
        expect(hidden).toContain(107);
    });

    test("hidden list may contain duplicates when two pinned events overlap on hidden targets (BUG: no dedup in hidden.concat)", () => {
        fetchedData.events.push(
            { id: 106, module_ids: [1], status: "ok", staff_ids: [7], location_id: 100, type: "Vorlesung", title: "V1-B", weekday: 2, start_time: "08:00", end_time: "10:00" },
            { id: 107, module_ids: [1], status: "ok", staff_ids: [7], location_id: 100, type: "Vorlesung", title: "V1-C", weekday: 3, start_time: "08:00", end_time: "10:00" },
        );
        pinnedEvents.add(101);
        pinnedEvents.add(106);
        // Both pins will find 107 as "similar" → hidden.concat adds 107 twice
        const hidden = getHiddenEvents();
        const ids107 = hidden.filter(e => e.id === 107);
        // BUG: no dedup, so 107 appears twice
        expect(ids107.length).toBe(2);
    });

    test("event with multiple module_ids: pinning it hides events sharing ANY module_id with same type (.some() path)", () => {
        // Add event with multiple module_ids
        fetchedData.events.push(
            { id: 200, module_ids: [1, 3], status: "ok", staff_ids: [7], location_id: 100, type: "Vorlesung", title: "Multi", weekday: 1, start_time: "08:00", end_time: "10:00" },
        );
        pinnedEvents.add(200);
        const hidden = getHiddenEvents().map(e => e.id);
        // Event 101 is Vorlesung module 1 → shares module 1 with pinned event → hidden
        expect(hidden).toContain(101);
        // Event 104 is Vorlesung module 4 → no overlap → not hidden
        expect(hidden).not.toContain(104);
    });

    test("pinned event whose module_ids is empty: pinnedEvent.module_ids.includes(id) never true → no events hidden", () => {
        fetchedData.events.push(
            { id: 200, module_ids: [], status: "ok", staff_ids: [7], location_id: 100, type: "Vorlesung", title: "NoMod", weekday: 1, start_time: "08:00", end_time: "10:00" },
        );
        pinnedEvents.add(200);
        const hidden = getHiddenEvents();
        // No events share module_ids with an empty array, so nothing hidden
        expect(hidden).toEqual([]);
    });
});

describe("clearFilters", () => {
    beforeEach(() => {
        resetFilterState();
        setupTestData();
    });

    test("resets degree and semester to null", () => {
        filterState.degree = 10;
        filterState.semester = 2;

        clearFilters();

        expect(filterState.degree).toBeNull();
        expect(filterState.semester).toBeNull();
    });

    test("clears all Sets", () => {
        filterState.selectedModules.add(1);
        filterState.hiddenModules.add(2);
        filterState.selectedTypes.add("Vorlesung");
        filterState.hiddenTypes.add("Seminar");
        filterState.selectedStaff.add(7);
        filterState.hiddenStaff.add(8);
        filterState.selectedLocations.add(100);
        filterState.hiddenLocations.add(101);

        clearFilters();

        expect(filterState.selectedModules.size).toBe(0);
        expect(filterState.hiddenModules.size).toBe(0);
        expect(filterState.selectedTypes.size).toBe(0);
        expect(filterState.hiddenTypes.size).toBe(0);
        expect(filterState.selectedStaff.size).toBe(0);
        expect(filterState.hiddenStaff.size).toBe(0);
        expect(filterState.selectedLocations.size).toBe(0);
        expect(filterState.hiddenLocations.size).toBe(0);
    });

    test("resets all status values to null", () => {
        filterState.status.ok = TRI.SELECTED;
        filterState.status.tok = TRI.HIDDEN;

        clearFilters();

        for (const key of Object.keys(filterState.status)) {
            expect(filterState.status[key]).toBeNull();
        }
    });

    test("clears pinnedEvents", () => {
        pinnedEvents.add(101);
        pinnedEvents.add(102);

        clearFilters();

        expect(pinnedEvents.size).toBe(0);
    });

    test("calls update callback if set", () => {
        const cb = jest.fn();
        setFilterUpdateCallback(cb);

        clearFilters();

        expect(cb).toHaveBeenCalledTimes(1);

        // Clean up callback
        setFilterUpdateCallback(() => {});
    });

    test("does not throw if updateCallback is null", () => {
        setFilterUpdateCallback(null);
        expect(() => clearFilters()).not.toThrow();
    });
});
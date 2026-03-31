/**
 * End-to-End tests — test complete data flows from fetch through rendering
 */
import { fetchAll } from "../js/api.js";
import { getEvents, getHiddenEvents, clearFilters } from "../js/filters.js";
import { getEventColor } from "../js/color.js";
import { saveState, restoreState, clearStateStorage, getShareLink } from "../js/sharing_storage.js";
import { fetchedData, filterState, pinnedEvents, view, colorMode, darkMode, customMap, TRI } from "../js/state.js";
import { jest } from "@jest/globals";

function resetAll() {
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
    view.value = "timeGridWeek";
    colorMode.value = "type";
    darkMode.value = false;
    customMap.clear();
    localStorage.clear();
}

const MOCK_DEGREES = [
    { id: 10, name: "Informatik", semesters: [1, 2], module_ids: [1, 2] },
];
const MOCK_MODULES = [
    { id: 1, name: "Datenbanken", degree_ids: { 10: [1] }, event_ids: [101] },
    { id: 2, name: "Algorithmen", degree_ids: { 10: [2] }, event_ids: [102, 103] },
];
const MOCK_EVENTS = [
    { id: 101, module_ids: [1], status: "ok", staff_ids: [7], location_id: 100, type: "Vorlesung", title: "DB V", weekday: 1, start_time: "08:00:00", end_time: "10:00:00" },
    { id: 102, module_ids: [2], status: "tok", staff_ids: [8], location_id: 101, type: "Vorlesung", title: "Algo V A", weekday: 3, start_time: "08:00:00", end_time: "10:00:00" },
    { id: 103, module_ids: [2], status: "tok", staff_ids: [8], location_id: 101, type: "Vorlesung", title: "Algo V B", weekday: 3, start_time: "12:00:00", end_time: "14:00:00" },
];
const MOCK_STAFF = [
    { id: 7, name: "Prof. A" },
    { id: 8, name: "Prof. B" },
];
const MOCK_LOCATIONS = [
    { id: 100, name: "Room 1" },
    { id: 101, name: "Room 2" },
];
const MOCK_SEMESTERS = [{ id: 1, name: "SoSe 2026" }];

function populateState() {
    fetchedData.degrees = MOCK_DEGREES;
    fetchedData.modules = MOCK_MODULES;
    fetchedData.events = MOCK_EVENTS;
    fetchedData.staff = MOCK_STAFF;
    fetchedData.locations = MOCK_LOCATIONS;
    fetchedData.semesters = MOCK_SEMESTERS;
    fetchedData.states = [
        { key: "ok", name: "Bestätigt" },
        { key: "tok", name: "Dozent ausstehend" },
        { key: "pok", name: "Zeit ausstehend" },
        { key: "alt", name: "Aus Vorsemester" },
        { key: "reserve", name: "Nicht mehr angeboten" },
    ];
}

describe("E2E: Full app data flow", () => {
    beforeEach(() => {
        resetAll();
        global.fetch = jest.fn();
    });

    test("fetch data → populate state → getEvents returns correct events → getEventColor maps them", async () => {
        // Mock all API responses
        const responses = [MOCK_DEGREES, MOCK_MODULES, MOCK_EVENTS, MOCK_STAFF, MOCK_LOCATIONS, MOCK_SEMESTERS];
        let callIdx = 0;
        global.fetch.mockImplementation(() => {
            const body = responses[callIdx++];
            return Promise.resolve({ ok: true, json: async () => body });
        });

        // Fetch all data
        const [degrees, modules, events, staff, locations, semesters] = await fetchAll();

        // Populate state (simulating what app.js does)
        fetchedData.degrees = degrees;
        fetchedData.modules = modules;
        fetchedData.events = events;
        fetchedData.staff = staff;
        fetchedData.locations = locations;
        fetchedData.semesters = semesters;

        // Verify getEvents returns all events
        const visibleEvents = getEvents().map(e => e.id).sort();
        expect(visibleEvents).toEqual([101, 102, 103]);

        // Verify getEventColor works for each event
        colorMode.value = "type";
        for (const ev of fetchedData.events) {
            const color = getEventColor(ev);
            expect(color).toBeTruthy();
            expect(typeof color).toBe("string");
        }
    });

    test("fetch data → apply filters → getEvents → filtered results", async () => {
        const responses = [MOCK_DEGREES, MOCK_MODULES, MOCK_EVENTS, MOCK_STAFF, MOCK_LOCATIONS, MOCK_SEMESTERS];
        let callIdx = 0;
        global.fetch.mockImplementation(() => {
            const body = responses[callIdx++];
            return Promise.resolve({ ok: true, json: async () => body });
        });

        const [degrees, modules, events, staff, locations, semesters] = await fetchAll();
        fetchedData.degrees = degrees;
        fetchedData.modules = modules;
        fetchedData.events = events;
        fetchedData.staff = staff;
        fetchedData.locations = locations;
        fetchedData.semesters = semesters;

        // Apply degree filter
        filterState.degree = 10;
        filterState.semester = 1;
        // Only module 1 is in semester 1
        let events2 = getEvents().map(e => e.id).sort();
        expect(events2).toEqual([101]);

        // Add selected module from semester 2
        filterState.selectedModules.add(2);
        events2 = getEvents().map(e => e.id).sort();
        // Module 1 (semester match) + module 2 (explicitly selected)
        expect(events2).toEqual([101, 102, 103]);
    });

    test("fetch fails → error propagation (no state corruption)", async () => {
        global.fetch.mockRejectedValue(new Error("Network error"));

        const degreesBefore = [...fetchedData.degrees];
        const modulesBefore = [...fetchedData.modules];

        await expect(fetchAll()).rejects.toThrow("Network error");

        // State should not be corrupted
        expect(fetchedData.degrees).toEqual(degreesBefore);
        expect(fetchedData.modules).toEqual(modulesBefore);
    });
});

describe("E2E: State persistence flow", () => {
    beforeEach(() => {
        resetAll();
        populateState();
        window.history.pushState({}, '', 'http://localhost/app');
    });

    test("set filters → saveState → clear filters → restoreState → filters restored → getEvents matches", () => {
        // Set complex filters
        filterState.degree = 10;
        filterState.selectedModules.add(1);
        filterState.status.ok = TRI.SELECTED;
        pinnedEvents.add(101);

        const originalEvents = getEvents().map(e => e.id).sort();

        // Save state
        saveState();

        // Clear everything
        clearFilters();
        expect(getEvents().map(e => e.id).sort()).not.toEqual(originalEvents);

        // Restore
        restoreState();

        // Note: clearFilters clears pinnedEvents too, and restoreState should restore them
        const restoredEvents = getEvents().map(e => e.id).sort();
        expect(restoredEvents).toEqual(originalEvents);
    });

    test("URL params override localStorage: set different filters in both, URL wins", () => {
        // Save state with degree=10
        filterState.degree = 10;
        saveState();

        // Navigate to URL with degree=20 (which doesn't exist but that's fine for state)
        resetAll();
        populateState();
        window.history.pushState({}, '', 'http://localhost/app?d=20');

        restoreState();

        // URL param should win
        expect(filterState.degree).toBe(20);
    });
});

describe("E2E: Pin + filter combined flow", () => {
    beforeEach(() => {
        resetAll();
        populateState();
    });

    test("pin event → filter by degree → pinned event still affects hidden calculation", () => {
        // Pin event 102 (Algo V A, Vorlesung, module 2) → hides 103 (same module+type)
        pinnedEvents.add(102);

        const hidden = getHiddenEvents().map(e => e.id);
        expect(hidden).toContain(103);

        // Now filter by degree 10
        filterState.degree = 10;
        const events = getEvents().map(e => e.id).sort();

        // 103 should still be hidden due to pin
        expect(events).toContain(102);
        expect(events).not.toContain(103);
    });

    test("pin event from one module → events of same module+type hidden → change degree → verify consistency", () => {
        // Pin event 102 (Vorlesung, module 2)
        pinnedEvents.add(102);

        // All events visible minus hidden
        let events = getEvents().map(e => e.id).sort();
        expect(events).toContain(101);
        expect(events).toContain(102);
        expect(events).not.toContain(103); // hidden: same module+type as pinned 102

        // Change degree filter — should not affect pin logic
        filterState.degree = 10;
        events = getEvents().map(e => e.id).sort();
        expect(events).toContain(102);
        expect(events).not.toContain(103); // still hidden
        expect(events).toContain(101); // different module, still visible
    });
});

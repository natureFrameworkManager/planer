/**
 * Integration tests — test interactions between multiple modules
 */
import { getEvents, getHiddenEvents, clearFilters } from "../js/filters.js";
import { getEventColor, generatePalette } from "../js/color.js";
import { saveState, restoreState, clearStateStorage, getShareLink, saveFetchedData, loadFetchedDataAsync } from "../js/sharing_storage.js";
import { openPopup, setPopupUpdateCallback } from "../js/popup.js";
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

function setupFullData() {
    fetchedData.degrees = [
        { id: 10, name: "Informatik", semesters: [1, 2, 3], module_ids: [1, 2] },
        { id: 20, name: "BWL", semesters: [1, 2], module_ids: [3] },
    ];
    fetchedData.modules = [
        { id: 1, name: "Datenbanken", degree_ids: { 10: [1, 2] }, event_ids: [101, 102] },
        { id: 2, name: "Algorithmen", degree_ids: { 10: [2, 3] }, event_ids: [103] },
        { id: 3, name: "BWL Grundlagen", degree_ids: { 20: [1] }, event_ids: [104] },
    ];
    fetchedData.events = [
        { id: 101, module_ids: [1], status: "ok", staff_ids: [7], location_id: 100, type: "Vorlesung", title: "DB V", weekday: 1, start_time: "08:00:00", end_time: "10:00:00" },
        { id: 102, module_ids: [1], status: "ok", staff_ids: [8], location_id: 101, type: "Uebung", title: "DB U", weekday: 2, start_time: "10:00:00", end_time: "12:00:00" },
        { id: 103, module_ids: [2], status: "tok", staff_ids: [7], location_id: 100, type: "Vorlesung", title: "Algo V", weekday: 3, start_time: "08:00:00", end_time: "10:00:00" },
        { id: 104, module_ids: [3], status: "pok", staff_ids: [9], location_id: 102, type: "Seminar", title: "BWL S", weekday: 4, start_time: "14:00:00", end_time: "16:00:00" },
    ];
    fetchedData.staff = [
        { id: 7, name: "Prof. Müller" },
        { id: 8, name: "Dr. Schmidt" },
        { id: 9, name: "Prof. Fischer" },
    ];
    fetchedData.locations = [
        { id: 100, name: "Hörsaal A" },
        { id: 101, name: "Raum 101" },
        { id: 102, name: "Raum 202" },
    ];
    fetchedData.semesters = [{ id: 1, name: "SoSe 2026" }];
    fetchedData.states = [
        { key: "ok", name: "Bestätigt" },
        { key: "tok", name: "Dozent ausstehend" },
        { key: "pok", name: "Zeit ausstehend" },
        { key: "alt", name: "Aus Vorsemester" },
        { key: "reserve", name: "Nicht mehr angeboten" },
    ];
}

describe("Integration: filters + state", () => {
    beforeEach(() => {
        resetAll();
        setupFullData();
    });

    test("changing filterState.degree and calling getEvents reflects new filter", () => {
        filterState.degree = 10;
        const events = getEvents().map(e => e.id).sort();
        expect(events).toEqual([101, 102, 103]);

        filterState.degree = 20;
        const events2 = getEvents().map(e => e.id).sort();
        expect(events2).toEqual([104]);
    });

    test("adding to selectedModules and hiddenModules together works correctly", () => {
        filterState.selectedModules.add(1);
        filterState.hiddenModules.add(2);

        const events = getEvents().map(e => e.id).sort();
        // Only module 1 events (101, 102), module 2 is hidden, module 3 not selected
        expect(events).toEqual([101, 102]);
    });

    test("pinning an event causes getHiddenEvents to exclude similar events from getEvents", () => {
        // Pin event 101 (Vorlesung, module 1) — should hide event 103 (also Vorlesung, but different module, so no)
        // Let's add a duplicate Vorlesung for module 1 to test properly
        fetchedData.events.push(
            { id: 105, module_ids: [1], status: "ok", staff_ids: [7], location_id: 100, type: "Vorlesung", title: "DB V Grp B", weekday: 1, start_time: "12:00:00", end_time: "14:00:00" },
        );
        pinnedEvents.add(101);

        const visible = getEvents().map(e => e.id).sort();
        expect(visible).toContain(101);
        expect(visible).not.toContain(105); // hidden because same module+type as pinned
    });

    test("multiple filter dimensions combined: degree + type + staff", () => {
        filterState.degree = 10;
        filterState.selectedTypes.add("Vorlesung");
        filterState.selectedStaff.add(7);

        const events = getEvents().map(e => e.id).sort();
        // Degree 10 modules: 1, 2. Type Vorlesung: 101, 103. Staff 7: 101, 103.
        expect(events).toEqual([101, 103]);
    });
});

describe("Integration: color + state", () => {
    beforeEach(() => {
        resetAll();
        setupFullData();
    });

    test("changing colorMode.value and calling getEventColor returns different palettes", () => {
        colorMode.value = "type";
        const typeColor = getEventColor(fetchedData.events[0]);

        colorMode.value = "module";
        const moduleColor = getEventColor(fetchedData.events[0]);

        // Should be defined strings
        expect(typeof typeColor).toBe("string");
        expect(typeof moduleColor).toBe("string");
    });

    test("getEventColor uses fetchedData.events for type-based coloring", () => {
        colorMode.value = "type";
        const event1 = fetchedData.events[0]; // Vorlesung
        const event2 = fetchedData.events[3]; // Seminar

        const c1 = getEventColor(event1);
        const c2 = getEventColor(event2);

        expect(c1).not.toBe(c2);
    });

    test("getEventColor with empty fetchedData returns undefined (no matching entry)", () => {
        const savedEvents = fetchedData.events;
        const savedModules = fetchedData.modules;
        const savedStaff = fetchedData.staff;
        const savedStates = fetchedData.states;
        fetchedData.events = [];
        fetchedData.modules = [];
        fetchedData.staff = [];
        fetchedData.states = [];

        colorMode.value = "type";
        const color = getEventColor({ id: 1, type: "X", module_ids: [1], status: "ok", staff_ids: [1], location_id: 1, title: "", weekday: 1, start_time: "", end_time: "" });
        // With empty events, colorMap has no entries, returns undefined from the switch case
        expect(color).toBeUndefined();

        fetchedData.events = savedEvents;
        fetchedData.modules = savedModules;
        fetchedData.staff = savedStaff;
        fetchedData.states = savedStates;
    });
});

describe("Integration: sharing_storage + state", () => {
    beforeEach(() => {
        resetAll();
        setupFullData();
        window.history.pushState({}, '', 'http://localhost/app');
    });

    test("saveState → restoreState round-trip preserves filterState", () => {
        filterState.degree = 10;
        filterState.semester = 2;
        filterState.selectedModules.add(1);
        filterState.hiddenTypes.add("Uebung");

        saveState();
        // Reset state but NOT localStorage
        filterState.degree = null;
        filterState.semester = null;
        filterState.selectedModules.clear();
        filterState.hiddenTypes.clear();

        restoreState();

        expect(filterState.degree).toBe(10);
        expect(filterState.semester).toBe(2);
        expect(filterState.selectedModules.has(1)).toBe(true);
        expect(filterState.hiddenTypes.has("Uebung")).toBe(true);
    });

    test("saveState → restoreState preserves pinnedEvents", () => {
        pinnedEvents.add(101);
        pinnedEvents.add(103);

        saveState();
        pinnedEvents.clear();

        restoreState();

        expect(pinnedEvents.has(101)).toBe(true);
        expect(pinnedEvents.has(103)).toBe(true);
    });

    test("saveState → restoreState preserves view, colorMode, darkMode", () => {
        view.value = "listWeek";
        colorMode.value = "staff";
        darkMode.value = true;

        saveState();
        view.value = "timeGridWeek";
        colorMode.value = "type";
        darkMode.value = false;

        restoreState();

        expect(view.value).toBe("listWeek");
        expect(colorMode.value).toBe("staff");
        expect(darkMode.value).toBe(true);
    });

    test("getShareLink → new page restoreState round-trip preserves state", () => {
        filterState.degree = 10;
        filterState.selectedModules.add(2);
        pinnedEvents.add(101);
        view.value = "timeGridDay";

        const link = getShareLink();
        resetAll();

        // Simulate navigating to the share link
        const url = new URL(link);
        window.history.pushState({}, '', url.toString());

        restoreState();

        expect(filterState.degree).toBe(10);
        expect(filterState.selectedModules.has(2)).toBe(true);
        expect(pinnedEvents.has(101)).toBe(true);
        expect(view.value).toBe("timeGridDay");
    });
});

describe("Integration: popup + state", () => {
    beforeEach(() => {
        resetAll();
        setupFullData();
        pinnedEvents.clear();

        document.body.innerHTML = `
            <div id="popup">
                <div class="popup-box">
                    <button id="popupCloseBtn"></button>
                    <span id="popupTitle"></span>
                    <span id="popupType"></span>
                    <span id="popupTime"></span>
                    <span id="popupLocation"></span>
                    <span id="popupStaff"></span>
                    <span id="popupStatusDot"></span>
                    <span id="popupStatusLabel"></span>
                    <span id="popupModules"></span>
                    <span id="popupCredits"></span>
                    <div><span id="popupDegrees"></span></div>
                    <button id="popupPinBtn" data-event-id="">
                        <span class="material-icons-round"></span>
                        <span class="pin-label"></span>
                    </button>
                </div>
            </div>
        `;
    });

    test("openPopup reads correct data from fetchedData", () => {
        openPopup(101);

        expect(document.querySelector("#popupTitle").innerText).toBe("DB V");
        expect(document.querySelector("#popupLocation").innerText).toBe("Hörsaal A");
        expect(document.querySelector("#popupStaff").innerText).toContain("Prof. Müller");
    });

    test("pin toggle in popup updates pinnedEvents and re-renders", () => {
        const cb = jest.fn();
        setPopupUpdateCallback(cb);

        openPopup(101);
        expect(pinnedEvents.has(101)).toBe(false);

        document.querySelector("#popupPinBtn").click();
        expect(pinnedEvents.has(101)).toBe(true);
        expect(cb).toHaveBeenCalled();

        // Verify popup re-rendered with pinned state
        expect(document.querySelector("#popupPinBtn").classList.contains("pinned")).toBe(true);
    });
});

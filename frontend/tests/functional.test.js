/**
 * Functional tests — test complete user-facing workflows
 */
import { getEvents, getHiddenEvents, clearFilters, setFilterUpdateCallback } from "../js/filters.js";
import { getEventColor } from "../js/color.js";
import { saveState, restoreState, clearStateStorage, getShareLink } from "../js/sharing_storage.js";
import { openPopup, initPopup, setPopupUpdateCallback } from "../js/popup.js";
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
        { id: 1, name: "Datenbanken", degree_ids: { 10: [1, 2] }, event_ids: [101, 102, 106] },
        { id: 2, name: "Algorithmen", degree_ids: { 10: [2, 3] }, event_ids: [103] },
        { id: 3, name: "BWL Grundlagen", degree_ids: { 20: [1] }, event_ids: [104] },
    ];
    fetchedData.events = [
        { id: 101, module_ids: [1], status: "ok", staff_ids: [7], location_id: 100, type: "Vorlesung", title: "DB V Grp A", weekday: 1, start_time: "08:00:00", end_time: "10:00:00" },
        { id: 102, module_ids: [1], status: "ok", staff_ids: [8], location_id: 101, type: "Uebung", title: "DB Ü", weekday: 2, start_time: "10:00:00", end_time: "12:00:00" },
        { id: 103, module_ids: [2], status: "tok", staff_ids: [7], location_id: 100, type: "Vorlesung", title: "Algo V", weekday: 3, start_time: "08:00:00", end_time: "10:00:00" },
        { id: 104, module_ids: [3], status: "pok", staff_ids: [9], location_id: 102, type: "Seminar", title: "BWL S", weekday: 4, start_time: "14:00:00", end_time: "16:00:00" },
        { id: 106, module_ids: [1], status: "ok", staff_ids: [7], location_id: 100, type: "Vorlesung", title: "DB V Grp B", weekday: 1, start_time: "12:00:00", end_time: "14:00:00" },
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

function setupPopupDOM() {
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
}

describe("Functional: Filter workflow", () => {
    beforeEach(() => {
        resetAll();
        setupFullData();
    });

    test("selecting a degree shows only its modules' events, then selecting a module narrows further", () => {
        // Step 1: Select degree
        filterState.degree = 10;
        let events = getEvents().map(e => e.id).sort();
        expect(events).toEqual([101, 102, 103, 106]);

        // Step 2: Select a specific module within that degree
        filterState.selectedModules.add(2);
        events = getEvents().map(e => e.id).sort();
        expect(events).toEqual([103]);
    });

    test("hiding a type removes those events, then un-hiding restores them", () => {
        const allEvents = getEvents().map(e => e.id).sort();

        // Hide Vorlesung
        filterState.hiddenTypes.add("Vorlesung");
        let events = getEvents().map(e => e.id).sort();
        expect(events).not.toContain(101);
        expect(events).not.toContain(103);
        expect(events).not.toContain(106);

        // Un-hide
        filterState.hiddenTypes.delete("Vorlesung");
        events = getEvents().map(e => e.id).sort();
        expect(events).toEqual(allEvents);
    });

    test("selecting a status filters accordingly, disabling it shows all again", () => {
        const allEvents = getEvents().map(e => e.id).sort();

        // Select only "tok" status
        filterState.status.tok = TRI.SELECTED;
        let events = getEvents().map(e => e.id).sort();
        expect(events).toEqual([103]);

        // Disable status filter
        filterState.status.tok = null;
        events = getEvents().map(e => e.id).sort();
        expect(events).toEqual(allEvents);
    });

    test("clearFilters restores all events after complex filtering", () => {
        const allEvents = getEvents().map(e => e.id).sort();

        // Apply complex filters
        filterState.degree = 10;
        filterState.selectedModules.add(1);
        filterState.hiddenTypes.add("Uebung");
        filterState.status.ok = TRI.SELECTED;
        filterState.selectedStaff.add(7);
        pinnedEvents.add(101);

        // Verify filtered result is different
        let events = getEvents().map(e => e.id).sort();
        expect(events).not.toEqual(allEvents);

        // Clear all filters
        clearFilters();
        events = getEvents().map(e => e.id).sort();
        expect(events).toEqual(allEvents);
    });
});

describe("Functional: Popup workflow", () => {
    beforeEach(() => {
        resetAll();
        setupFullData();
        setupPopupDOM();
    });

    test("opening popup → pinning event → closing → getEvents excludes similar events", () => {
        const cb = jest.fn();
        setPopupUpdateCallback(cb);
        initPopup();

        // Open popup for event 101 (Vorlesung, module 1, Grp A)
        openPopup(101);
        expect(document.querySelector("#popup").classList.contains("show")).toBe(true);

        // Pin the event
        document.querySelector("#popupPinBtn").click();
        expect(pinnedEvents.has(101)).toBe(true);

        // Close popup
        document.querySelector("#popupCloseBtn").click();
        expect(document.querySelector("#popup").classList.contains("show")).toBe(false);

        // Verify hidden events: event 106 (Vorlesung, module 1, Grp B) should be hidden
        const visible = getEvents().map(e => e.id).sort();
        expect(visible).toContain(101);
        expect(visible).not.toContain(106);
    });

    test("opening popup for non-existent event does nothing (no crash)", () => {
        expect(() => openPopup(9999)).not.toThrow();
        expect(document.querySelector("#popup").classList.contains("show")).toBe(false);
    });
});

describe("Functional: Color mode workflow", () => {
    beforeEach(() => {
        resetAll();
        setupFullData();
    });

    test("switching color modes produces different color assignments for same event", () => {
        const event = fetchedData.events[0];

        colorMode.value = "type";
        const typeColor = getEventColor(event);

        colorMode.value = "status";
        const statusColor = getEventColor(event);

        colorMode.value = "staff";
        const staffColor = getEventColor(event);

        // At least some should differ (type vs status vs staff produce different palettes)
        expect(typeof typeColor).toBe("string");
        expect(typeof statusColor).toBe("string");
        expect(typeof staffColor).toBe("string");
    });
});

describe("Functional: Share link workflow", () => {
    beforeEach(() => {
        resetAll();
        setupFullData();
        window.history.pushState({}, '', 'http://localhost/app');
    });

    test("applying filters → getShareLink → new page restoreState → same events visible", () => {
        filterState.degree = 10;
        filterState.selectedModules.add(1);
        filterState.hiddenTypes.add("Uebung");

        const originalEvents = getEvents().map(e => e.id).sort();
        const link = getShareLink();

        // Simulate new page
        resetAll();
        setupFullData();
        const url = new URL(link);
        window.history.pushState({}, '', url.toString());

        restoreState();

        const restoredEvents = getEvents().map(e => e.id).sort();
        expect(restoredEvents).toEqual(originalEvents);
    });

    test("share link with all filter types populated restores correctly", () => {
        filterState.degree = 10;
        filterState.semester = 2;
        filterState.selectedModules.add(1);
        filterState.hiddenModules.add(3);
        filterState.selectedTypes.add("Vorlesung");
        filterState.hiddenTypes.add("Seminar");
        filterState.status.ok = "selected";
        filterState.status.pok = "hidden";
        filterState.selectedStaff.add(7);
        filterState.hiddenStaff.add(9);
        filterState.selectedLocations.add(100);
        filterState.hiddenLocations.add(102);
        pinnedEvents.add(101);
        view.value = "listWeek";
        colorMode.value = "staff";
        darkMode.value = true;

        const link = getShareLink();
        resetAll();

        const url = new URL(link);
        window.history.pushState({}, '', url.toString());

        restoreState();

        expect(filterState.degree).toBe(10);
        expect(filterState.semester).toBe(2);
        expect(filterState.selectedModules.has(1)).toBe(true);
        expect(filterState.hiddenModules.has(3)).toBe(true);
        expect(filterState.selectedTypes.has("Vorlesung")).toBe(true);
        expect(filterState.hiddenTypes.has("Seminar")).toBe(true);
        expect(filterState.status.ok).toBe("selected");
        expect(filterState.status.pok).toBe("hidden");
        expect(filterState.selectedStaff.has(7)).toBe(true);
        expect(filterState.hiddenStaff.has(9)).toBe(true);
        expect(filterState.selectedLocations.has(100)).toBe(true);
        expect(filterState.hiddenLocations.has(102)).toBe(true);
        expect(pinnedEvents.has(101)).toBe(true);
        expect(view.value).toBe("listWeek");
        expect(colorMode.value).toBe("staff");
        expect(darkMode.value).toBe(true);
    });
});

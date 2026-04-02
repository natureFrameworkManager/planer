import { openPopup, initPopup, setPopupUpdateCallback } from "../js/popup.js";
import { fetchedData, pinnedEvents, WEEKDAY_LABELS } from "../js/state.js";
import { jest } from "@jest/globals";

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

function setupTestData() {
    fetchedData.events = [
        { id: 1, title: "Datenbanken", type: "Vorlesung", weekday: 1, start_time: "08:00:00", end_time: "10:00:00", location_id: 100, status: "ok", module_ids: [10, 11], staff_ids: [200, 201] },
        { id: 2, title: "Algorithmen", type: "Seminar", weekday: 3, start_time: "14:00:00", end_time: "16:00:00", location_id: 999, status: "tok", module_ids: [], staff_ids: [] },
    ];
    fetchedData.locations = [
        { id: 100, name: "Hörsaal A" },
    ];
    fetchedData.staff = [
        { id: 200, name: "Prof. Müller" },
        { id: 201, name: "Dr. Schmidt" },
    ];
    fetchedData.modules = [
        { id: 10, name: "Datenbanken I", credits: 5, degree_ids: { 1: [1] } },
        { id: 11, name: "Datenbanken II", credits: 10, degree_ids: { 1: [2], 2: [1] } },
    ];
    fetchedData.degrees = [
        { id: 1, name: "Informatik", semesters: [1, 2], module_ids: [10, 11] },
        { id: 2, name: "BWL", semesters: [1], module_ids: [11] },
    ];
    fetchedData.states = [
        { key: "ok", name: "Bestätigt" },
        { key: "tok", name: "Dozent ausstehend" },
    ];
}

describe("openPopup", () => {
    beforeEach(() => {
        setupPopupDOM();
        setupTestData();
        pinnedEvents.clear();
    });

    test("populates title from event data", () => {
        openPopup(1);
        expect(document.querySelector("#popupTitle").innerText).toBe("Datenbanken");
    });

    test("populates type from event data", () => {
        openPopup(1);
        expect(document.querySelector("#popupType").innerText).toBe("Vorlesung");
    });

    test("populates time with weekday, start and end", () => {
        openPopup(1);
        const time = document.querySelector("#popupTime").innerText;
        expect(time).toContain("Montag");
        expect(time).toContain("08:00");
        expect(time).toContain("10:00");
    });

    test("populates location name from fetched locations", () => {
        openPopup(1);
        expect(document.querySelector("#popupLocation").innerText).toBe("Hörsaal A");
    });

    test("shows '–' when location not found", () => {
        openPopup(2); // location_id 999 not in fetchedData
        expect(document.querySelector("#popupLocation").innerText).toBe("–");
    });

    test("populates staff names joined by comma", () => {
        openPopup(1);
        const staff = document.querySelector("#popupStaff").innerText;
        expect(staff).toContain("Prof. Müller");
        expect(staff).toContain("Dr. Schmidt");
    });

    test("shows '–' when no staff found", () => {
        openPopup(2); // no staff_ids
        expect(document.querySelector("#popupStaff").innerText).toBe("–");
    });

    test("populates module names", () => {
        openPopup(1);
        const modules = document.querySelector("#popupModules").innerText;
        expect(modules).toContain("Datenbanken I");
        expect(modules).toContain("Datenbanken II");
    });

    test("shows credits as range when multiple different credits", () => {
        openPopup(1); // modules 10 (5 LP) and 11 (10 LP)
        const credits = document.querySelector("#popupCredits").innerText;
        expect(credits).toContain("5");
        expect(credits).toContain("10");
        expect(credits).toContain("LP");
    });

    test("shows '-' for credits when no modules", () => {
        openPopup(2); // no module_ids
        expect(document.querySelector("#popupCredits").innerText).toBe("-");
    });

    test("shows degree names from module→degree lookup", () => {
        openPopup(1);
        const degrees = document.querySelector("#popupDegrees").innerText;
        expect(degrees).toContain("Informatik");
        expect(degrees).toContain("BWL");
    });

    test("hides degrees section when no degrees found", () => {
        // Event 2 has no modules, so no degrees
        openPopup(2);
        const degreesEl = document.querySelector("#popupDegrees");
        expect(degreesEl.parentElement.style.display).toBe("none");
    });

    test("sets pin button state based on pinnedEvents — not pinned", () => {
        openPopup(1);
        const pinBtn = document.querySelector("#popupPinBtn");
        expect(pinBtn.classList.contains("pinned")).toBe(false);
        expect(document.querySelector("#popupPinBtn .pin-label").innerText).toBe("Anheften");
    });

    test("sets pin button state based on pinnedEvents — pinned", () => {
        pinnedEvents.add(1);
        openPopup(1);
        const pinBtn = document.querySelector("#popupPinBtn");
        expect(pinBtn.classList.contains("pinned")).toBe(true);
        expect(document.querySelector("#popupPinBtn .pin-label").innerText).toBe("Angeheftet");
    });

    test("adds 'show' class to popup element", () => {
        openPopup(1);
        expect(document.querySelector("#popup").classList.contains("show")).toBe(true);
    });

    test("does nothing for non-existent event", () => {
        openPopup(9999);
        expect(document.querySelector("#popup").classList.contains("show")).toBe(false);
    });
});

describe("initPopup", () => {
    beforeEach(() => {
        setupPopupDOM();
        setupTestData();
        pinnedEvents.clear();
    });

    test("close button removes 'show' class", () => {
        initPopup();
        document.querySelector("#popup").classList.add("show");

        document.querySelector("#popupCloseBtn").click();

        expect(document.querySelector("#popup").classList.contains("show")).toBe(false);
    });

    test("clicking outside popup box removes 'show' class", () => {
        initPopup();
        document.querySelector("#popup").classList.add("show");

        // Click on the popup overlay (outside .popup-box)
        const clickEvent = new MouseEvent("click", { bubbles: true });
        document.querySelector("#popup").dispatchEvent(clickEvent);

        expect(document.querySelector("#popup").classList.contains("show")).toBe(false);
    });

    test("clicking inside popup box does NOT remove 'show' class", () => {
        initPopup();
        document.querySelector("#popup").classList.add("show");

        const clickEvent = new MouseEvent("click", { bubbles: true });
        document.querySelector("#popup .popup-box").dispatchEvent(clickEvent);

        expect(document.querySelector("#popup").classList.contains("show")).toBe(true);
    });
});

describe("handleEventPin via popup", () => {
    beforeEach(() => {
        setupPopupDOM();
        setupTestData();
        pinnedEvents.clear();
    });

    test("toggles pin state for event", () => {
        openPopup(1);
        expect(pinnedEvents.has(1)).toBe(false);

        // Click pin button
        document.querySelector("#popupPinBtn").click();
        expect(pinnedEvents.has(1)).toBe(true);

        // Click again to unpin
        document.querySelector("#popupPinBtn").click();
        expect(pinnedEvents.has(1)).toBe(false);
    });

    test("calls updatePopupCallback after toggle", () => {
        const cb = jest.fn();
        setPopupUpdateCallback(cb);
        openPopup(1);

        document.querySelector("#popupPinBtn").click();

        expect(cb).toHaveBeenCalled();
    });

    test("does nothing when eventId is NaN", () => {
        openPopup(1);
        const pinBtn = document.querySelector("#popupPinBtn");
        pinBtn.dataset.eventId = "notanumber";
        pinBtn.click();
        // pinnedEvents should remain unchanged
        expect(pinnedEvents.size).toBe(0);
    });

    test("updatePopupCallback is null: does not throw after toggle", () => {
        setPopupUpdateCallback(null);
        openPopup(1);
        expect(() => document.querySelector("#popupPinBtn").click()).not.toThrow();
    });

    test("after toggle, openPopup(eventId) is called to refresh pin button UI", () => {
        openPopup(1);
        document.querySelector("#popupPinBtn").click();
        // After toggling, the popup should re-render with updated pin state
        expect(pinnedEvents.has(1)).toBe(true);
        const pinLabel = document.querySelector("#popupPinBtn .pin-label");
        expect(pinLabel.innerText).toBe("Angeheftet");
    });
});

describe("openPopup edge cases", () => {
    beforeEach(() => {
        setupPopupDOM();
        setupTestData();
        pinnedEvents.clear();
    });

    test("shows single credit value with 'LP' when all modules have same credits", () => {
        // Modify both modules to have same credits
        fetchedData.modules[0].credits = 5;
        fetchedData.modules[1].credits = 5;
        openPopup(1); // event has module_ids [10, 11]
        const credits = document.querySelector("#popupCredits").innerText;
        expect(credits).toBe("5 LP");
    });

    test("deduplicates staff names", () => {
        // Add duplicate staff id
        fetchedData.events[0].staff_ids = [200, 200];
        openPopup(1);
        const staff = document.querySelector("#popupStaff").innerText;
        // Should not contain duplicate names
        const names = staff.split(", ");
        const unique = new Set(names);
        expect(unique.size).toBe(names.length);
    });

    test("deduplicates degree names", () => {
        // Both modules point to degree 1 (Informatik) — should appear once
        openPopup(1);
        const degrees = document.querySelector("#popupDegrees").innerText;
        const names = degrees.split(", ");
        const unique = new Set(names);
        expect(unique.size).toBe(names.length);
    });

    test("event.weekday outside 1-7 (e.g. 0): WEEKDAY_LABELS[weekday] is undefined → displays empty string via || ''", () => {
        fetchedData.events.push(
            { id: 99, title: "BadDay", type: "Vorlesung", weekday: 0, start_time: "08:00:00", end_time: "10:00:00", location_id: 100, status: "ok", module_ids: [10], staff_ids: [200] }
        );
        openPopup(99);
        const time = document.querySelector("#popupTime").innerText;
        // WEEKDAY_LABELS[0] is undefined, so || "" produces empty string before comma
        expect(time).toContain("08:00");
        expect(time).not.toContain("Montag");
    });

    test("re-opening popup for different event replaces old data", () => {
        openPopup(1);
        expect(document.querySelector("#popupTitle").innerText).toBe("Datenbanken");
        openPopup(2);
        expect(document.querySelector("#popupTitle").innerText).toBe("Algorithmen");
    });

    test("pin button does NOT accumulate event listeners despite no removeEventListener (DOM deduplicates same function ref)", () => {
        const cb = jest.fn();
        setPopupUpdateCallback(cb);
        // Open popup multiple times – each call does pinBtn.addEventListener("click", handleEventPin)
        openPopup(1);
        openPopup(1);
        openPopup(1);
        // DOM spec: adding the same function reference as listener multiple times is a no-op.
        // handleEventPin is always the same function, so only one listener is active.
        document.querySelector("#popupPinBtn").click();
        expect(cb.mock.calls.length).toBe(1);
    });

    test("event not in fetchedData.events: no popup shown (return path)", () => {
        openPopup(9999);
        expect(document.querySelector("#popup").classList.contains("show")).toBe(false);
    });

    test("popup element missing from DOM: no error (return path)", () => {
        document.body.innerHTML = ''; // Remove all DOM
        expect(() => openPopup(1)).not.toThrow();
    });

    test("credits: module with credits=undefined → filtered out by x !== undefined → may reduce to 0", () => {
        fetchedData.modules.push(
            { id: 99, name: "NoCred", credits: undefined, degree_ids: {} }
        );
        fetchedData.events.push(
            { id: 99, title: "NoCredEvent", type: "Vorlesung", weekday: 1, start_time: "08:00:00", end_time: "10:00:00", location_id: 100, status: "ok", module_ids: [99], staff_ids: [200] }
        );
        openPopup(99);
        expect(document.querySelector("#popupCredits").innerText).toBe("-");
    });

    test("module not found in fetchedData.modules: .find() returns undefined → degree_ids loop skips it via if (!module) continue", () => {
        fetchedData.events.push(
            { id: 99, title: "NoMod", type: "Vorlesung", weekday: 1, start_time: "08:00:00", end_time: "10:00:00", location_id: 100, status: "ok", module_ids: [999], staff_ids: [200] }
        );
        openPopup(99);
        // Should not crash, degrees area should be empty (hidden)
        expect(document.querySelector("#popupDegrees").parentElement.style.display).toBe("none");
    });

    test("non-existent module references result in empty popupModules display", () => {
        fetchedData.events.push(
            { id: 100, title: "NoModuleNames", type: "Vorlesung", weekday: 1, start_time: "08:00:00", end_time: "10:00:00", location_id: 100, status: "ok", module_ids: [999, 998], staff_ids: [200] }
        );
        openPopup(100);
        expect(document.querySelector("#popupModules").innerText).toBe("-");
    });

    test("statusState not found in fetchedData.states: shows empty string via ?? ''", () => {
        fetchedData.events.push(
            { id: 99, title: "UnknownStatus", type: "Vorlesung", weekday: 1, start_time: "08:00:00", end_time: "10:00:00", location_id: 100, status: "unknown_status", module_ids: [10], staff_ids: [200] }
        );
        openPopup(99);
        expect(document.querySelector("#popupStatusLabel").innerText).toBe("");
    });
});

describe("initPopup edge cases", () => {
    test("closeBtn missing from DOM: no event listener attached, no error", () => {
        document.body.innerHTML = '<div id="popup"><div class="popup-box"></div></div>';
        expect(() => initPopup()).not.toThrow();
    });

    test("popup element missing from DOM: no event listener attached, no error", () => {
        document.body.innerHTML = '<button id="popupCloseBtn"></button>';
        expect(() => initPopup()).not.toThrow();
    });
});

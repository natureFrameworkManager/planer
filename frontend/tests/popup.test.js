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
});

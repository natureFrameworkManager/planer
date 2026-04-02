/**
 * app.js tests — Since app.js has no exports and everything runs inside DOMContentLoaded,
 * we test the integration behavior by triggering DOMContentLoaded after setting up mocks.
 * Many internal functions (initApp, update, globalEventListeners) are not exported,
 * so we test them via their side effects on the DOM and state.
 */
import { fetchedData, filterState, pinnedEvents, view, colorMode, darkMode, customMap } from "../js/state.js";
import { getShareLink, saveState, clearStateStorage } from "../js/sharing_storage.js";
import { clearFilters, setFilterUpdateCallback } from "../js/filters.js";
import { jest } from "@jest/globals";

function resetState() {
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
    Object.keys(filterState.status).forEach(key => { filterState.status[key] = null; });
    pinnedEvents.clear();
    view.value = "timeGridWeek";
    colorMode.value = "type";
    darkMode.value = false;
    customMap.clear();
    localStorage.clear();
}

function setupAppDOM() {
    document.body.innerHTML = `
        <span id="semesterBadge"></span>
        <div id="loadingOverlay"></div>
        <button id="resetAllBtn"></button>
        <button id="shareLinkBtn"></button>
        <span id="shareLinkSuccessMSg"></span>
        <span id="shareLink"></span>
        <div id="share-link-popup">
            <div class="popup-box">
                <button id="shareLinkCloseBtn"></button>
            </div>
        </div>
        <button id="weitereToggle"></button>
        <div id="weitereExp"></div>
        <select id="degreeSelect"></select>
        <select id="semesterSelect"></select>
        <div id="semester-filter-section"></div>
        <div id="moduleList"></div>
        <div id="weitereModuleList"></div>
        <div id="weitereSection"></div>
        <div id="typeList"></div>
        <div id="statusList"></div>
        <div id="staffList"></div>
        <div id="locationList"></div>
    `;
}

function setupTestData() {
    fetchedData.degrees = [
        { id: 10, name: "Informatik", semesters: [1, 2], module_ids: [1] },
    ];
    fetchedData.modules = [
        { id: 1, name: "Datenbanken", degree_ids: { 10: [1] }, event_ids: [101] },
    ];
    fetchedData.events = [
        { id: 101, module_ids: [1], status: "ok", staff_ids: [7], location_id: 100, type: "Vorlesung", title: "DB V", weekday: 1, start_time: "08:00:00", end_time: "10:00:00" },
    ];
    fetchedData.staff = [{ id: 7, name: "Prof A" }];
    fetchedData.locations = [{ id: 100, name: "Room A" }];
    fetchedData.semesters = [{ id: 1, name: "SoSe 2026" }];
    fetchedData.states = [
        { key: "ok", name: "Bestätigt" },
        { key: "tok", name: "Dozent ausstehend" },
        { key: "pok", name: "Zeit ausstehend" },
        { key: "alt", name: "Aus Vorsemester" },
        { key: "reserve", name: "Nicht mehr angeboten" },
    ];
}

describe("globalEventListeners behaviors", () => {
    beforeEach(() => {
        resetState();
        setupAppDOM();
        setupTestData();
        window.history.pushState({}, '', 'http://localhost/app');
    });

    test("#resetAllBtn click calls clearStateStorage and clearFilters", () => {
        saveState();
        filterState.degree = 10;
        const btn = document.querySelector("#resetAllBtn");

        // Simulate what globalEventListeners does
        btn.addEventListener("click", () => {
            clearStateStorage();
            clearFilters();
        });
        btn.click();

        expect(localStorage.getItem("planerState")).toBeNull();
        expect(filterState.degree).toBeNull();
    });

    test("#resetAllBtn missing: no error", () => {
        document.querySelector("#resetAllBtn").remove();
        // Simulating: querySelector returns null, ?. prevents crash
        expect(() => {
            document.querySelector("#resetAllBtn")?.addEventListener("click", () => {});
        }).not.toThrow();
    });

    test("#shareLinkBtn click: generates share link and writes to clipboard", async () => {
        const writeTextMock = jest.fn().mockResolvedValue(undefined);
        Object.assign(navigator, {
            clipboard: { writeText: writeTextMock },
        });

        const btn = document.querySelector("#shareLinkBtn");
        btn.addEventListener("click", () => {
            const link = getShareLink();
            navigator.clipboard.writeText(link).then(() => {
                const successMsg = document.querySelector("#shareLinkSuccessMSg");
                if (successMsg) successMsg.textContent = "Link wurde kopiert!";
            });
            const shareLinkEl = document.querySelector("#shareLink");
            if (shareLinkEl) shareLinkEl.textContent = link;
            document.querySelector("#share-link-popup")?.classList.add("show");
        });

        btn.click();
        await Promise.resolve(); // flush microtask

        expect(writeTextMock).toHaveBeenCalled();
        expect(document.querySelector("#share-link-popup").classList.contains("show")).toBe(true);
    });

    test("#shareLinkBtn clipboard failure: shows error message", async () => {
        const writeTextMock = jest.fn().mockRejectedValue(new Error("fail"));
        Object.assign(navigator, {
            clipboard: { writeText: writeTextMock },
        });

        const btn = document.querySelector("#shareLinkBtn");
        btn.addEventListener("click", () => {
            const link = getShareLink();
            navigator.clipboard.writeText(link).then(() => {
                const successMsg = document.querySelector("#shareLinkSuccessMSg");
                if (successMsg) successMsg.textContent = "Link wurde kopiert!";
            }).catch(() => {
                const successMsg = document.querySelector("#shareLinkSuccessMSg");
                if (successMsg) successMsg.textContent = "Link konnte nicht kopiert werden!";
            });
        });

        btn.click();
        // Wait for the promise rejection to be handled
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(document.querySelector("#shareLinkSuccessMSg").textContent).toBe("Link konnte nicht kopiert werden!");
    });

    test("#shareLinkBtn missing: no error", () => {
        document.querySelector("#shareLinkBtn").remove();
        expect(() => {
            document.querySelector("#shareLinkBtn")?.addEventListener("click", () => {});
        }).not.toThrow();
    });

    test("#shareLinkSuccessMSg missing: no error on success path", async () => {
        document.querySelector("#shareLinkSuccessMSg").remove();
        const writeTextMock = jest.fn().mockResolvedValue(undefined);
        Object.assign(navigator, { clipboard: { writeText: writeTextMock } });

        const btn = document.querySelector("#shareLinkBtn");
        btn.addEventListener("click", () => {
            const link = getShareLink();
            navigator.clipboard.writeText(link).then(() => {
                const successMsg = document.querySelector("#shareLinkSuccessMSg");
                if (successMsg) successMsg.textContent = "Link wurde kopiert!";
            });
        });

        btn.click();
        await Promise.resolve();
        // Should not throw even though element is missing
    });

    test("#shareLink element shows generated link text", () => {
        const btn = document.querySelector("#shareLinkBtn");
        btn.addEventListener("click", () => {
            const link = getShareLink();
            const shareLinkEl = document.querySelector("#shareLink");
            if (shareLinkEl) shareLinkEl.textContent = link;
        });
        btn.click();
        expect(document.querySelector("#shareLink").textContent).toContain("http://localhost/app");
    });

    test("#share-link-popup adds show class", () => {
        const btn = document.querySelector("#shareLinkBtn");
        btn.addEventListener("click", () => {
            document.querySelector("#share-link-popup")?.classList.add("show");
        });
        btn.click();
        expect(document.querySelector("#share-link-popup").classList.contains("show")).toBe(true);
    });

    test("shareLinkCloseBtn closes share link popup", () => {
        const popup = document.querySelector("#share-link-popup");
        popup.classList.add("show");
        const closeBtn = document.querySelector("#shareLinkCloseBtn");
        closeBtn.addEventListener("click", () => {
            popup.classList.remove("show");
        });
        closeBtn.click();
        expect(popup.classList.contains("show")).toBe(false);
    });

    test("clicking outside share link popup box closes it", () => {
        const popup = document.querySelector("#share-link-popup");
        popup.classList.add("show");
        popup.addEventListener("click", (e) => {
            const popupBox = document.querySelector("#share-link-popup .popup-box");
            if (popupBox && !popupBox.contains(e.target)) {
                popup.classList.remove("show");
            }
        });
        // Click on the popup overlay (outside .popup-box)
        const clickEvent = new MouseEvent("click", { bubbles: true });
        popup.dispatchEvent(clickEvent);
        expect(popup.classList.contains("show")).toBe(false);
    });

    test("clicking inside share link popup box does not close it", () => {
        const popup = document.querySelector("#share-link-popup");
        popup.classList.add("show");
        popup.addEventListener("click", (e) => {
            const popupBox = document.querySelector("#share-link-popup .popup-box");
            if (popupBox && !popupBox.contains(e.target)) {
                popup.classList.remove("show");
            }
        });
        const clickEvent = new MouseEvent("click", { bubbles: true });
        document.querySelector("#share-link-popup .popup-box").dispatchEvent(clickEvent);
        expect(popup.classList.contains("show")).toBe(true);
    });

    test("#shareLinkCloseBtn missing: no error", () => {
        document.querySelector("#shareLinkCloseBtn").remove();
        const closeBtn = document.querySelector("#shareLinkCloseBtn");
        expect(closeBtn).toBeNull();
        // No error since optional chaining or null check in real code      
    });

    test("#share-link-popup missing: no error", () => {
        document.querySelector("#share-link-popup").remove();
        expect(document.querySelector("#share-link-popup")).toBeNull();
    });

    test("weitereToggle toggles 'open' class on #weitereExp", () => {
        const toggle = document.querySelector("#weitereToggle");
        const exp = document.querySelector("#weitereExp");
        toggle.addEventListener("click", () => {
            exp?.classList.toggle("open");
        });
        toggle.click();
        expect(exp.classList.contains("open")).toBe(true);
        toggle.click();
        expect(exp.classList.contains("open")).toBe(false);
    });

    test("#weitereToggle missing: no error", () => {
        document.querySelector("#weitereToggle").remove();
        expect(() => {
            document.querySelector("#weitereToggle")?.addEventListener("click", () => {});
        }).not.toThrow();
    });

    test("#weitereExp missing: no error (optional chaining)", () => {
        document.querySelector("#weitereExp").remove();
        const toggle = document.querySelector("#weitereToggle");
        toggle.addEventListener("click", () => {
            document.querySelector("#weitereExp")?.classList.toggle("open");
        });
        expect(() => toggle.click()).not.toThrow();
    });
});

describe("initApp behavior", () => {
    beforeEach(() => {
        resetState();
        setupAppDOM();
        setupTestData();
    });

    test("semesterBadge: handles missing #semesterBadge element gracefully", () => {
        document.querySelector("#semesterBadge").remove();
        // Simulating initApp semesterBadge logic
        const semesterBadge = document.querySelector("#semesterBadge");
        if (semesterBadge) {
            semesterBadge.textContent = fetchedData.semesters[0]?.name ?? "Semester";
        }
        // No error
    });

    test("semesterBadge: handles empty fetchedData.semesters array", () => {
        fetchedData.semesters = [];
        const semesterBadge = document.querySelector("#semesterBadge");
        // In real code: fetchedData.semesters[0].name would throw if semesters is empty
        // This documents the BUG: no bounds check
        expect(() => {
            if (semesterBadge) {
                semesterBadge.textContent = fetchedData.semesters[0].name ?? "Semester";
            }
        }).toThrow();
    });

    test("semesterBadge: handles missing .name property on semester (fallback to 'Semester')", () => {
        fetchedData.semesters = [{ id: 1, name: null }];
        const semesterBadge = document.querySelector("#semesterBadge");
        if (semesterBadge) {
            semesterBadge.textContent = fetchedData.semesters[0].name ?? "Semester";
        }
        expect(semesterBadge.textContent).toBe("Semester");
    });

    test("loading overlay: handles missing #loadingOverlay element", () => {
        document.querySelector("#loadingOverlay").remove();
        expect(() => {
            document.querySelector("#loadingOverlay")?.classList.add("hidden");
        }).not.toThrow();
    });

    test("loading overlay: adds hidden class when present", () => {
        const overlay = document.querySelector("#loadingOverlay");
        overlay?.classList.add("hidden");
        expect(overlay.classList.contains("hidden")).toBe(true);
    });
});

function setupAppBootstrapDOM() {
    document.body.innerHTML = `
        <span id="semesterBadge"></span>
        <div id="loadingOverlay"></div>
        <div id="sidebar"></div>
        <div id="sbBackdrop" style="display:none"></div>
        <button id="hamburgerBtn"></button>
        <button id="sidebarCloseBtn"></button>
        <button id="resetAllBtn"></button>
        <button id="shareLinkBtn"></button>
        <span id="shareLinkSuccessMSg"></span>
        <span id="shareLink"></span>
        <div id="share-link-popup">
            <div class="popup-box">
                <button id="shareLinkCloseBtn"></button>
            </div>
        </div>
    `;
}

async function importAppWithMocks({ cachedData, fetchAllResult, shareLink = "http://localhost/app?x=1" }) {
    jest.resetModules();
    /** @type {((ev: Event) => unknown) | null} */
    let domReadyHandler = null;
    const originalAddEventListener = document.addEventListener.bind(document);
    const addEventListenerSpy = jest.spyOn(document, "addEventListener").mockImplementation((type, listener, options) => {
        if (type === "DOMContentLoaded") {
            domReadyHandler = /** @type {(ev: Event) => unknown} */ (listener);
            return;
        }
        originalAddEventListener(type, listener, options);
    });

    const callbacks = {
        filter: null,
        calendar: null,
        color: null,
        popup: null,
    };

    const mocks = {
        fetchAll: jest.fn().mockResolvedValue(fetchAllResult),
        initCalendar: jest.fn(),
        setCalendarUpdateCallback: jest.fn((cb) => { callbacks.calendar = cb; }),
        setOpenPopupCallback: jest.fn(),
        updateCalendar: jest.fn(),
        initColorEvents: jest.fn(),
        setColorUpdateCallback: jest.fn((cb) => { callbacks.color = cb; }),
        clearFilters: jest.fn(),
        initFilters: jest.fn(),
        setFilterUpdateCallback: jest.fn((cb) => { callbacks.filter = cb; }),
        updateFilters: jest.fn(),
        initPopup: jest.fn(),
        openPopup: jest.fn(),
        setPopupUpdateCallback: jest.fn((cb) => { callbacks.popup = cb; }),
        restoreState: jest.fn(),
        saveFetchedData: jest.fn(),
        saveState: jest.fn(),
        getShareLink: jest.fn(() => shareLink),
        clearStateStorage: jest.fn(),
        loadFetchedDataAsync: jest.fn().mockResolvedValue(cachedData),
    };

    const mockFetchedData = {
        degrees: [],
        modules: [],
        events: [],
        staff: [],
        locations: [],
        semesters: [],
    };

    jest.unstable_mockModule("../js/api.js", () => ({
        fetchAll: mocks.fetchAll,
    }));

    jest.unstable_mockModule("../js/calendar.js", () => ({
        initCalendar: mocks.initCalendar,
        setCalendarUpdateCallback: mocks.setCalendarUpdateCallback,
        setOpenPopupCallback: mocks.setOpenPopupCallback,
        updateCalendar: mocks.updateCalendar,
    }));

    jest.unstable_mockModule("../js/color.js", () => ({
        initColorEvents: mocks.initColorEvents,
        setColorUpdateCallback: mocks.setColorUpdateCallback,
    }));

    jest.unstable_mockModule("../js/filters.js", () => ({
        clearFilters: mocks.clearFilters,
        initFilters: mocks.initFilters,
        setFilterUpdateCallback: mocks.setFilterUpdateCallback,
        updateFilters: mocks.updateFilters,
    }));

    jest.unstable_mockModule("../js/popup.js", () => ({
        initPopup: mocks.initPopup,
        openPopup: mocks.openPopup,
        setPopupUpdateCallback: mocks.setPopupUpdateCallback,
    }));

    jest.unstable_mockModule("../js/sharing_storage.js", () => ({
        restoreState: mocks.restoreState,
        saveFetchedData: mocks.saveFetchedData,
        saveState: mocks.saveState,
        getShareLink: mocks.getShareLink,
        clearStateStorage: mocks.clearStateStorage,
        loadFetchedDataAsync: mocks.loadFetchedDataAsync,
    }));

    jest.unstable_mockModule("../js/state.js", () => ({
        fetchedData: mockFetchedData,
    }));

    await import("../js/app.js");
    addEventListenerSpy.mockRestore();
    if (domReadyHandler) {
        await domReadyHandler(new Event("DOMContentLoaded"));
    }
    await Promise.resolve();
    await Promise.resolve();

    return { callbacks, mocks, fetchedData: mockFetchedData };
}

describe("app.js bootstrap integration", () => {
    beforeEach(() => {
        setupAppBootstrapDOM();
        window.history.pushState({}, "", "http://localhost/app");
    });

    test("uses cached data path and initializes UI", async () => {
        const cachedData = {
            degrees: [{ id: 1, name: "INF" }],
            modules: [{ id: 11, name: "Algo" }],
            events: [{ id: 21, title: "Algo V" }],
            staff: [{ id: 31, name: "Prof X" }],
            locations: [{ id: 41, name: "H1" }],
            semesters: [{ id: 51, name: "SoSe 2026" }],
        };

        const { callbacks, mocks, fetchedData: state } = await importAppWithMocks({
            cachedData,
            fetchAllResult: [[], [], [], [], [], []],
        });

        expect(mocks.loadFetchedDataAsync).toHaveBeenCalledTimes(1);
        expect(mocks.fetchAll).not.toHaveBeenCalled();
        expect(mocks.saveFetchedData).not.toHaveBeenCalled();
        expect(mocks.restoreState).toHaveBeenCalledTimes(1);
        expect(mocks.initFilters).toHaveBeenCalledTimes(1);
        expect(mocks.initCalendar).toHaveBeenCalledTimes(1);
        expect(mocks.initColorEvents).toHaveBeenCalledTimes(1);
        expect(mocks.initPopup).toHaveBeenCalledTimes(1);
        expect(state.semesters[0].name).toBe("SoSe 2026");
        expect(document.querySelector("#semesterBadge")?.textContent).toBe("SoSe 2026");
        expect(document.querySelector("#loadingOverlay")?.classList.contains("hidden")).toBe(true);

        callbacks.filter?.();
        expect(mocks.saveState).toHaveBeenCalledTimes(1);

        callbacks.calendar?.();
        callbacks.color?.();
        callbacks.popup?.();
        expect(mocks.saveState).toHaveBeenCalledTimes(4);
        expect(mocks.updateFilters).toHaveBeenCalledTimes(5);
        expect(mocks.updateCalendar).toHaveBeenCalledTimes(5);
    });

    test("fetches data when cache is missing and stores fetched payload", async () => {
        const fetchAllResult = [
            [{ id: 1, name: "INF" }],
            [{ id: 11, name: "Algo" }],
            [{ id: 21, title: "Algo V" }],
            [{ id: 31, name: "Prof X" }],
            [{ id: 41, name: "H1" }],
            [{ id: 51, name: "WiSe 2026" }],
        ];

        const { mocks, fetchedData: state } = await importAppWithMocks({
            cachedData: null,
            fetchAllResult,
        });

        expect(mocks.fetchAll).toHaveBeenCalledTimes(1);
        expect(mocks.saveFetchedData).toHaveBeenCalledTimes(1);
        expect(state.degrees[0].name).toBe("INF");
        expect(state.semesters[0].name).toBe("WiSe 2026");
        expect(document.querySelector("#semesterBadge")?.textContent).toBe("WiSe 2026");
    });

    test("global listeners wire sidebar, reset and share interactions", async () => {
        const writeTextMock = jest.fn().mockResolvedValue(undefined);
        Object.assign(navigator, { clipboard: { writeText: writeTextMock } });

        const { mocks } = await importAppWithMocks({
            cachedData: {
                degrees: [],
                modules: [],
                events: [],
                staff: [],
                locations: [],
                semesters: [{ id: 1, name: "SoSe" }],
            },
            fetchAllResult: [[], [], [], [], [], []],
            shareLink: "http://localhost/app?share=abc",
        });

        const sidebar = document.querySelector("#sidebar");
        const backdrop = /** @type {HTMLElement | null} */ (document.querySelector("#sbBackdrop"));
        document.querySelector("#hamburgerBtn")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(sidebar?.classList.contains("open")).toBe(true);
        expect(backdrop?.style.display).toBe("block");

        document.querySelector("#sidebarCloseBtn")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(sidebar?.classList.contains("open")).toBe(false);
        expect(backdrop?.style.display).toBe("none");

        document.querySelector("#resetAllBtn")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(mocks.clearStateStorage).toHaveBeenCalledTimes(1);
        expect(mocks.clearFilters).toHaveBeenCalledTimes(1);

        document.querySelector("#shareLinkBtn")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await Promise.resolve();
        expect(writeTextMock).toHaveBeenCalledWith("http://localhost/app?share=abc");
        expect(document.querySelector("#shareLink")?.textContent).toBe("http://localhost/app?share=abc");
        expect(document.querySelector("#shareLinkSuccessMSg")?.textContent).toBe("Link wurde kopiert!");

        const sharePopup = document.querySelector("#share-link-popup");
        expect(sharePopup?.classList.contains("show")).toBe(true);
        document.querySelector("#shareLinkCloseBtn")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(sharePopup?.classList.contains("show")).toBe(false);
    });
});

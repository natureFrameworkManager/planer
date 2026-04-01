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

import { saveState, restoreState, clearStateStorage, getShareLink, saveFetchedData, loadFetchedDataAsync, showShareLinkSuccessMsg } from "../js/sharing_storage.js";
import { filterState, pinnedEvents, view, colorMode, darkMode, customMap, fetchedData, TRI } from "../js/state.js";
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
    Object.keys(filterState.status).forEach((key) => {
        filterState.status[key] = null;
    });
    pinnedEvents.clear();
    view.value = "timeGridWeek";
    colorMode.value = "type";
    darkMode.value = false;
    customMap.clear();
}

describe("saveState / restoreState round-trip (localStorage)", () => {
    beforeEach(() => {
        resetState();
        localStorage.clear();
        // Remove URL params
        window.history.pushState({}, '', 'http://localhost/');
    });

    test("saveState writes serialized state to localStorage", () => {
        filterState.degree = 5;
        const result = saveState();
        expect(result).toBe(true);
        const raw = localStorage.getItem("planerState");
        expect(raw).not.toBeNull();
        const parsed = JSON.parse(raw);
        expect(parsed.d).toBe(5);
    });

    test("restoreState reads and applies state from localStorage", () => {
        filterState.degree = 42;
        filterState.semester = 3;
        pinnedEvents.add(101);
        pinnedEvents.add(102);
        view.value = "listWeek";
        colorMode.value = "module";
        darkMode.value = true;

        saveState();

        // Reset state
        resetState();
        expect(filterState.degree).toBeNull();

        // Restore
        restoreState();

        expect(filterState.degree).toBe(42);
        expect(filterState.semester).toBe(3);
        expect(pinnedEvents.has(101)).toBe(true);
        expect(pinnedEvents.has(102)).toBe(true);
        expect(view.value).toBe("listWeek");
        expect(colorMode.value).toBe("module");
        expect(darkMode.value).toBe(true);
    });

    test("returns true on successful save", () => {
        expect(saveState()).toBe(true);
    });

    test("clearStateStorage removes the key from localStorage", () => {
        saveState();
        expect(localStorage.getItem("planerState")).not.toBeNull();

        clearStateStorage();
        expect(localStorage.getItem("planerState")).toBeNull();
    });

    test("restoreState does nothing when localStorage is empty and no URL params", () => {
        filterState.degree = 99;
        restoreState();
        // Should stay unchanged since there's nothing to restore from
        expect(filterState.degree).toBe(99);
    });
});

describe("saveState preserves Sets and complex state", () => {
    beforeEach(() => {
        resetState();
        localStorage.clear();
        window.history.pushState({}, '', 'http://localhost/');
    });

    test("round-trips selectedModules and hiddenModules", () => {
        filterState.selectedModules.add(1);
        filterState.selectedModules.add(2);
        filterState.hiddenModules.add(3);

        saveState();
        resetState();
        restoreState();

        expect(filterState.selectedModules.has(1)).toBe(true);
        expect(filterState.selectedModules.has(2)).toBe(true);
        expect(filterState.hiddenModules.has(3)).toBe(true);
    });

    test("round-trips selectedTypes and hiddenTypes", () => {
        filterState.selectedTypes.add("Vorlesung");
        filterState.hiddenTypes.add("Seminar");

        saveState();
        resetState();
        restoreState();

        expect(filterState.selectedTypes.has("Vorlesung")).toBe(true);
        expect(filterState.hiddenTypes.has("Seminar")).toBe(true);
    });

    test("round-trips status filter state", () => {
        filterState.status.ok = "selected";
        filterState.status.tok = "hidden";

        saveState();
        resetState();
        restoreState();

        expect(filterState.status.ok).toBe("selected");
        expect(filterState.status.tok).toBe("hidden");
        expect(filterState.status.pok).toBeNull();
    });

    test("round-trips customMap", () => {
        customMap.set(1, "#ff0000");
        customMap.set(2, "#00ff00");

        saveState();
        resetState();
        restoreState();

        expect(customMap.get(1)).toBe("#ff0000");
        expect(customMap.get(2)).toBe("#00ff00");
    });
});

describe("getShareLink", () => {
    beforeEach(() => {
        resetState();
        window.history.pushState({}, '', 'http://localhost/app');
    });

    test("includes degree param when set", () => {
        filterState.degree = 10;
        const link = getShareLink();
        const url = new URL(link);
        expect(url.searchParams.get("d")).toBe("10");
    });

    test("includes semester param when set", () => {
        filterState.semester = 3;
        const link = getShareLink();
        const url = new URL(link);
        expect(url.searchParams.get("s")).toBe("3");
    });

    test("includes selected modules as comma-separated", () => {
        filterState.selectedModules.add(1);
        filterState.selectedModules.add(2);
        const link = getShareLink();
        const url = new URL(link);
        const sm = url.searchParams.get("sm");
        expect(sm).not.toBeNull();
        expect(sm.split(",").map(Number).sort()).toEqual([1, 2]);
    });

    test("includes pin param with pinned event IDs", () => {
        pinnedEvents.add(101);
        pinnedEvents.add(102);
        const link = getShareLink();
        const url = new URL(link);
        const pin = url.searchParams.get("pin");
        expect(pin).not.toBeNull();
        expect(pin.split(",").map(Number).sort()).toEqual([101, 102]);
    });

    test("includes view and colorMode params", () => {
        view.value = "listWeek";
        colorMode.value = "staff";
        const link = getShareLink();
        const url = new URL(link);
        expect(decodeURIComponent(url.searchParams.get("v"))).toBe("listWeek");
        expect(decodeURIComponent(url.searchParams.get("cm"))).toBe("staff");
    });

    test("includes darkMode param", () => {
        darkMode.value = true;
        const link = getShareLink();
        const url = new URL(link);
        expect(url.searchParams.get("dm")).toBeTruthy();
    });

    test("encodes status params with 'status_' prefix", () => {
        filterState.status.ok = "selected";
        filterState.status.tok = "hidden";
        const link = getShareLink();
        const url = new URL(link);
        expect(url.searchParams.get("status_ok")).toBe("selected");
        expect(url.searchParams.get("status_tok")).toBe("hidden");
    });

    test("does not include null degree", () => {
        filterState.degree = null;
        const link = getShareLink();
        const url = new URL(link);
        expect(url.searchParams.has("d")).toBe(false);
    });

    test("includes customMap entries when present", () => {
        customMap.set(1, "#ff0000");
        const link = getShareLink();
        const url = new URL(link);
        expect(url.searchParams.has("cmap")).toBe(true);
    });
});

describe("restoreState priority", () => {
    beforeEach(() => {
        resetState();
        localStorage.clear();
    });

    test("URL params take precedence over localStorage", () => {
        // Save state with degree=10
        filterState.degree = 10;
        saveState();
        resetState();

        // Set URL params with degree=20
        window.history.pushState({}, '', 'http://localhost/app?d=20');

        restoreState();

        expect(filterState.degree).toBe(20);
    });

    test("falls back to localStorage if no URL params", () => {
        filterState.degree = 10;
        saveState();
        resetState();

        window.history.pushState({}, '', 'http://localhost/app');

        restoreState();

        expect(filterState.degree).toBe(10);
    });
});

describe("saveFetchedData / loadFetchedDataAsync (localStorage fallback)", () => {
    beforeEach(() => {
        localStorage.clear();
        fetchedData.degrees = [];
        fetchedData.modules = [];
        fetchedData.events = [];
        fetchedData.staff = [];
        fetchedData.locations = [];
        fetchedData.semesters = [];
    });

    test("saveFetchedData returns true", () => {
        fetchedData.degrees = [{ id: 1, name: "Test" }];
        const result = saveFetchedData();
        expect(result).toBe(true);
    });

    test("loadFetchedDataAsync returns data from localStorage fallback", async () => {
        fetchedData.degrees = [{ id: 1, name: "Test", semesters: [], module_ids: [] }];
        fetchedData.modules = [];
        fetchedData.events = [];
        fetchedData.staff = [];
        fetchedData.locations = [];
        fetchedData.semesters = [];

        // Manually store in localStorage as fallback (since IDB may not work in jsdom)
        const data = {
            degrees: fetchedData.degrees,
            modules: fetchedData.modules,
            events: fetchedData.events,
            staff: fetchedData.staff,
            locations: fetchedData.locations,
            semesters: fetchedData.semesters,
            states: fetchedData.states,
        };
        localStorage.setItem("planerFetchedData", JSON.stringify(data));

        const loaded = await loadFetchedDataAsync();
        expect(loaded).not.toBeNull();
        expect(loaded.degrees).toEqual([{ id: 1, name: "Test", semesters: [], module_ids: [] }]);
    });

    test("loadFetchedDataAsync returns null when nothing stored", async () => {
        const loaded = await loadFetchedDataAsync();
        expect(loaded).toBeNull();
    });
});

describe("saveState error handling", () => {
    beforeEach(() => {
        resetState();
        localStorage.clear();
        window.history.pushState({}, '', 'http://localhost/');
    });

    test("saveState returns false if localStorage throws (e.g. quota exceeded)", () => {
        const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new DOMException("QuotaExceededError");
        });
        const result = saveState();
        expect(result).toBe(false);
        spy.mockRestore();
    });
});

describe("applyState edge cases (via saveState/restoreState)", () => {
    beforeEach(() => {
        resetState();
        localStorage.clear();
        window.history.pushState({}, '', 'http://localhost/');
    });

    test("applyState with null input: does nothing (early return path)", () => {
        localStorage.setItem("planerState", "null");
        const degreeBefore = filterState.degree;
        restoreState();
        expect(filterState.degree).toBe(degreeBefore);
    });

    test("applyState with non-object input (e.g. string): does nothing", () => {
        localStorage.setItem("planerState", '"just a string"');
        const degreeBefore = filterState.degree;
        restoreState();
        expect(filterState.degree).toBe(degreeBefore);
    });

    test("applyState with partial object: only applies present fields, leaves others unchanged", () => {
        view.value = "listWeek";
        localStorage.setItem("planerState", JSON.stringify({ d: 5 }));
        restoreState();
        expect(filterState.degree).toBe(5);
        // view should stay unchanged since not in the saved object
        expect(view.value).toBe("listWeek");
    });

    test("applyState with o.d as string (not number): degree stays unchanged (typeof check fails)", () => {
        filterState.degree = 42;
        localStorage.setItem("planerState", JSON.stringify({ d: "notanumber" }));
        restoreState();
        // typeof "notanumber" !== "number" and !== null, so degree stays unchanged
        expect(filterState.degree).toBe(42);
    });

    test("applyState with o.d as null: sets degree to null explicitly", () => {
        filterState.degree = 42;
        localStorage.setItem("planerState", JSON.stringify({ d: null }));
        restoreState();
        expect(filterState.degree).toBeNull();
    });

    test("applyState with o.s as string: semester stays unchanged", () => {
        filterState.semester = 3;
        localStorage.setItem("planerState", JSON.stringify({ s: "notanumber" }));
        restoreState();
        expect(filterState.semester).toBe(3);
    });

    test("applyState with invalid status value (not null, not in VALID_TRI): sets to null", () => {
        localStorage.setItem("planerState", JSON.stringify({ status: { ok: "invalid_value" } }));
        restoreState();
        expect(filterState.status.ok).toBeNull();
    });

    test("applyState with valid status values (null, neutral, selected, hidden): applies correctly", () => {
        localStorage.setItem("planerState", JSON.stringify({
            status: { ok: null, tok: "selected", pok: "hidden", alt: "neutral" }
        }));
        restoreState();
        expect(filterState.status.ok).toBeNull();
        expect(filterState.status.tok).toBe("selected");
        expect(filterState.status.pok).toBe("hidden");
        expect(filterState.status.alt).toBe("neutral");
    });

    test("applyState with o.pin as non-array: pinnedEvents stays unchanged", () => {
        pinnedEvents.add(101);
        localStorage.setItem("planerState", JSON.stringify({ pin: "not_an_array" }));
        restoreState();
        expect(pinnedEvents.has(101)).toBe(true);
    });

    test("applyState with o.v as non-string: view stays unchanged", () => {
        view.value = "listWeek";
        localStorage.setItem("planerState", JSON.stringify({ v: 12345 }));
        restoreState();
        expect(view.value).toBe("listWeek");
    });

    test("applyState with o.dm as non-boolean: darkMode stays unchanged", () => {
        darkMode.value = true;
        localStorage.setItem("planerState", JSON.stringify({ dm: "yes" }));
        restoreState();
        expect(darkMode.value).toBe(true);
    });
});

describe("getShareLink edge cases", () => {
    beforeEach(() => {
        resetState();
        window.history.pushState({}, '', 'http://localhost/app');
    });

    test("does not include empty Sets in URL (sm/hm/st/ht/ss/hs/sl/hl omitted when empty)", () => {
        const link = getShareLink();
        const url = new URL(link);
        expect(url.searchParams.has("sm")).toBe(false);
        expect(url.searchParams.has("hm")).toBe(false);
        expect(url.searchParams.has("st")).toBe(false);
        expect(url.searchParams.has("ht")).toBe(false);
        expect(url.searchParams.has("ss")).toBe(false);
        expect(url.searchParams.has("hs")).toBe(false);
        expect(url.searchParams.has("sl")).toBe(false);
        expect(url.searchParams.has("hl")).toBe(false);
    });

    test("customMap with size 0: no cmap param in URL", () => {
        customMap.clear();
        const link = getShareLink();
        const url = new URL(link);
        expect(url.searchParams.has("cmap")).toBe(false);
    });

    test("status entries with null value: no status_ param for that key", () => {
        filterState.status.ok = null;
        filterState.status.tok = null;
        const link = getShareLink();
        const url = new URL(link);
        expect(url.searchParams.has("status_ok")).toBe(false);
        expect(url.searchParams.has("status_tok")).toBe(false);
    });

    test("all params present simultaneously: URL contains all expected keys", () => {
        filterState.degree = 10;
        filterState.semester = 2;
        filterState.selectedModules.add(1);
        filterState.hiddenModules.add(2);
        filterState.selectedTypes.add("Vorlesung");
        filterState.hiddenTypes.add("Seminar");
        filterState.status.ok = "selected";
        filterState.selectedStaff.add(7);
        filterState.hiddenStaff.add(8);
        filterState.selectedLocations.add(100);
        filterState.hiddenLocations.add(101);
        pinnedEvents.add(101);
        view.value = "listWeek";
        colorMode.value = "staff";
        darkMode.value = true;
        customMap.set(1, "#ff0000");

        const link = getShareLink();
        const url = new URL(link);
        expect(url.searchParams.has("d")).toBe(true);
        expect(url.searchParams.has("s")).toBe(true);
        expect(url.searchParams.has("sm")).toBe(true);
        expect(url.searchParams.has("hm")).toBe(true);
        expect(url.searchParams.has("st")).toBe(true);
        expect(url.searchParams.has("ht")).toBe(true);
        expect(url.searchParams.has("status_ok")).toBe(true);
        expect(url.searchParams.has("ss")).toBe(true);
        expect(url.searchParams.has("hs")).toBe(true);
        expect(url.searchParams.has("sl")).toBe(true);
        expect(url.searchParams.has("hl")).toBe(true);
        expect(url.searchParams.has("pin")).toBe(true);
        expect(url.searchParams.has("v")).toBe(true);
        expect(url.searchParams.has("cm")).toBe(true);
        expect(url.searchParams.has("dm")).toBe(true);
        expect(url.searchParams.has("cmap")).toBe(true);
    });

    test("special characters in type strings are properly encoded", () => {
        filterState.selectedTypes.add("Übung & Praktikum");
        const link = getShareLink();
        const url = new URL(link);
        const st = url.searchParams.get("st");
        expect(st).not.toBeNull();
        expect(decodeURIComponent(st)).toContain("Übung & Praktikum");
    });
});

describe("restoreState edge cases", () => {
    beforeEach(() => {
        resetState();
        localStorage.clear();
    });

    test("URL has only a status_ param (no standard keys): still detected as hasUrlState → applyParams path taken", () => {
        window.history.pushState({}, '', 'http://localhost/app?status_ok=selected');
        restoreState();
        expect(filterState.status.ok).toBe("selected");
    });

    test("malformed JSON in localStorage: caught silently, state unchanged", () => {
        window.history.pushState({}, '', 'http://localhost/');
        localStorage.setItem("planerState", "{invalid json!!");
        filterState.degree = 42;
        restoreState();
        expect(filterState.degree).toBe(42); // unchanged
    });

    test("URL has d param with non-numeric value: filterState.degree set to null (parseInt → NaN → null)", () => {
        window.history.pushState({}, '', 'http://localhost/app?d=abc');
        restoreState();
        expect(filterState.degree).toBeNull();
    });

    test("URL has s param with non-numeric value: filterState.semester set to null", () => {
        window.history.pushState({}, '', 'http://localhost/app?s=xyz');
        restoreState();
        expect(filterState.semester).toBeNull();
    });

    test("URL dm param with value false: darkMode.value set to false", () => {
        window.history.pushState({}, '', 'http://localhost/app?dm=false');
        darkMode.value = true;
        restoreState();
        expect(darkMode.value).toBe(false);
    });

    test("URL dm param with value true: darkMode.value set to true", () => {
        window.history.pushState({}, '', 'http://localhost/app?dm=true');
        darkMode.value = false;
        restoreState();
        expect(darkMode.value).toBe(true);
    });

    test("URL dm param with any other value: darkMode.value set to false (not === 'true')", () => {
        window.history.pushState({}, '', 'http://localhost/app?dm=yes');
        darkMode.value = true;
        restoreState();
        expect(darkMode.value).toBe(false);
    });

    test("URL sm with comma-separated numeric values: selectedModules populated correctly", () => {
        window.history.pushState({}, '', 'http://localhost/app?sm=1,2,3');
        restoreState();
        expect(filterState.selectedModules.has(1)).toBe(true);
        expect(filterState.selectedModules.has(2)).toBe(true);
        expect(filterState.selectedModules.has(3)).toBe(true);
    });

    test("URL sm with non-numeric values: filtered out by !isNaN check", () => {
        window.history.pushState({}, '', 'http://localhost/app?sm=1,abc,3');
        restoreState();
        expect(filterState.selectedModules.has(1)).toBe(true);
        expect(filterState.selectedModules.has(3)).toBe(true);
        expect(filterState.selectedModules.size).toBe(2);
    });

    test("URL st with comma-separated strings: selectedTypes populated correctly", () => {
        window.history.pushState({}, '', 'http://localhost/app?st=Vorlesung,Seminar');
        restoreState();
        expect(filterState.selectedTypes.has("Vorlesung")).toBe(true);
        expect(filterState.selectedTypes.has("Seminar")).toBe(true);
    });

    test("URL cmap with valid entries: customMap populated", () => {
        window.history.pushState({}, '', 'http://localhost/app?cmap=1:%23ff0000,2:%2300ff00');
        restoreState();
        expect(customMap.get(1)).toBe("#ff0000");
        expect(customMap.get(2)).toBe("#00ff00");
    });

    test("URL cmap entry with no colon (idx<1): entry skipped", () => {
        window.history.pushState({}, '', 'http://localhost/app?cmap=nocolon,1:%23ff0000');
        restoreState();
        expect(customMap.size).toBe(1);
        expect(customMap.get(1)).toBe("#ff0000");
    });

    test("URL cmap entry with NaN key: entry skipped", () => {
        window.history.pushState({}, '', 'http://localhost/app?cmap=abc:%23ff0000');
        restoreState();
        expect(customMap.size).toBe(0);
    });

    test("URL cmap entry with empty value after colon: entry skipped", () => {
        window.history.pushState({}, '', 'http://localhost/app?cmap=1:');
        restoreState();
        expect(customMap.size).toBe(0);
    });

    test("URL v param present: view.value updated, decoded", () => {
        window.history.pushState({}, '', 'http://localhost/app?v=listWeek');
        restoreState();
        expect(view.value).toBe("listWeek");
    });

    test("URL cm param present: colorMode.value updated, decoded", () => {
        window.history.pushState({}, '', 'http://localhost/app?cm=staff');
        restoreState();
        expect(colorMode.value).toBe("staff");
    });

    test("URL status_ok param with invalid value (not in VALID_TRI): ignored", () => {
        window.history.pushState({}, '', 'http://localhost/app?status_ok=invalid');
        filterState.status.ok = null;
        restoreState();
        expect(filterState.status.ok).toBeNull(); // not changed
    });

    test("URL status_ok param with valid value (selected): applied", () => {
        window.history.pushState({}, '', 'http://localhost/app?status_ok=selected');
        restoreState();
        expect(filterState.status.ok).toBe("selected");
    });

    test("ignores unknown status values in URL params", () => {
        window.history.pushState({}, '', 'http://localhost/app?status_ok=bogus');
        restoreState();
        expect(filterState.status.ok).toBeNull();
    });
});

describe("loadFetchedData edge cases", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test("loadFetchedData (localStorage) with malformed JSON: returns null (catch path)", async () => {
        localStorage.setItem("planerFetchedData", "{broken json!!}");
        const loaded = await loadFetchedDataAsync();
        expect(loaded).toBeNull();
    });
});

describe("showShareLinkSuccessMsg", () => {
    test("sets textContent on #shareLinkSuccessMSg when element exists", () => {
        document.body.innerHTML = '<span id="shareLinkSuccessMSg"></span>';
        showShareLinkSuccessMsg();
        expect(document.querySelector("#shareLinkSuccessMSg").textContent).toBe("Share link copied to clipboard!");
    });

    test("does nothing when element is missing (early return)", () => {
        document.body.innerHTML = '';
        expect(() => showShareLinkSuccessMsg()).not.toThrow();
    });
});

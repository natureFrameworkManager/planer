import { saveState, restoreState, clearStateStorage, getShareLink, saveFetchedData, loadFetchedDataAsync } from "../js/sharing_storage.js";
import { filterState, pinnedEvents, view, colorMode, darkMode, customMap, fetchedData } from "../js/state.js";

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

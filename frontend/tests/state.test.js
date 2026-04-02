import { TRI, WEEKDAY_LABELS, nextTriState, fetchedData, filterState, pinnedEvents, view, colorMode, darkMode, customMap } from "../js/state.js";

describe("nextTriState", () => {
    test("cycles through neutral -> selected -> hidden -> neutral", () => {
        expect(nextTriState(TRI.NEUTRAL)).toBe(TRI.SELECTED);
        expect(nextTriState(TRI.SELECTED)).toBe(TRI.HIDDEN);
        expect(nextTriState(TRI.HIDDEN)).toBe(TRI.NEUTRAL);
    });

    test("falls back to neutral for unknown state", () => {
        expect(nextTriState("unknown")).toBe(TRI.NEUTRAL);
    });

    test("returns neutral for empty string", () => {
        expect(nextTriState("")).toBe(TRI.NEUTRAL);
    });

    test("returns neutral for undefined", () => {
        expect(nextTriState(undefined)).toBe(TRI.NEUTRAL);
    });
});

describe("WEEKDAY_LABELS", () => {
    test("contains expected German labels", () => {
        expect(WEEKDAY_LABELS[1]).toBe("Montag");
        expect(WEEKDAY_LABELS[5]).toBe("Freitag");
        expect(WEEKDAY_LABELS[7]).toBe("Sonntag");
    });

    test("has exactly 7 entries", () => {
        expect(Object.keys(WEEKDAY_LABELS)).toHaveLength(7);
    });

    test("does not have keys outside 1-7", () => {
        const keys = Object.keys(WEEKDAY_LABELS).map(Number);
        keys.forEach(k => {
            expect(k).toBeGreaterThanOrEqual(1);
            expect(k).toBeLessThanOrEqual(7);
        });
    });
});

describe("TRI constants", () => {
    test("TRI.NEUTRAL is 'neutral'", () => {
        expect(TRI.NEUTRAL).toBe("neutral");
    });

    test("TRI.SELECTED is 'selected'", () => {
        expect(TRI.SELECTED).toBe("selected");
    });

    test("TRI.HIDDEN is 'hidden'", () => {
        expect(TRI.HIDDEN).toBe("hidden");
    });

    test("TRI values are unique (no duplicates)", () => {
        const values = Object.values(TRI);
        expect(new Set(values).size).toBe(values.length);
    });

    test("TRI values are not empty strings", () => {
        Object.values(TRI).forEach((value) => {
            expect(value).not.toBe("");
        });
    });

    test("TRI only has the expected keys (NEUTRAL, SELECTED, HIDDEN)", () => {
        expect(Object.keys(TRI).sort()).toEqual(["HIDDEN", "NEUTRAL", "SELECTED"]);
    });
});

describe("fetchedData defaults", () => {
    test("all arrays start empty", () => {
        expect(fetchedData.degrees).toEqual([]);
        expect(fetchedData.modules).toEqual([]);
        expect(fetchedData.events).toEqual([]);
        expect(fetchedData.staff).toEqual([]);
        expect(fetchedData.locations).toEqual([]);
        expect(fetchedData.semesters).toEqual([]);
    });

    test("states has 5 predefined entries with correct keys", () => {
        expect(fetchedData.states).toHaveLength(5);
        const keys = fetchedData.states.map(s => s.key);
        expect(keys).toEqual(["ok", "tok", "pok", "alt", "reserve"]);
    });

    test("fetchedData has only expected keys", () => {
        expect(Object.keys(fetchedData).sort()).toEqual([
            "degrees",
            "events",
            "locations",
            "modules",
            "semesters",
            "staff",
            "states",
        ]);
    });
});

describe("filterState defaults", () => {
    test("degree and semester are null by default", () => {
        expect(filterState.degree).toBeNull();
        expect(filterState.semester).toBeNull();
    });

    test("all Sets are empty", () => {
        expect(filterState.selectedModules.size).toBe(0);
        expect(filterState.hiddenModules.size).toBe(0);
        expect(filterState.selectedTypes.size).toBe(0);
        expect(filterState.hiddenTypes.size).toBe(0);
        expect(filterState.selectedStaff.size).toBe(0);
        expect(filterState.hiddenStaff.size).toBe(0);
        expect(filterState.selectedLocations.size).toBe(0);
        expect(filterState.hiddenLocations.size).toBe(0);
    });

    test("all status values are null", () => {
        for (const key of Object.keys(filterState.status)) {
            expect(filterState.status[key]).toBeNull();
        }
    });

    test("filterState only has the expected keys", () => {
        expect(Object.keys(filterState).sort()).toEqual([
            "degree",
            "hiddenLocations",
            "hiddenModules",
            "hiddenStaff",
            "hiddenTypes",
            "selectedLocations",
            "selectedModules",
            "selectedStaff",
            "selectedTypes",
            "semester",
            "status",
        ]);
    });
});

describe("pinnedEvents", () => {
    test("is a Set", () => {
        expect(pinnedEvents).toBeInstanceOf(Set);
    });

    test("is an empty Set initially", () => {
        expect(pinnedEvents.size).toBe(0);
    });
});

describe("view / colorMode / darkMode defaults", () => {
    test("view defaults to 'timeGridWeek'", () => {
        expect(view.value).toBe("timeGridWeek");
    });

    test("colorMode defaults to 'type'", () => {
        expect(colorMode.value).toBe("type");
    });

    test("darkMode value is a boolean", () => {
        expect(typeof darkMode.value).toBe("boolean");
    });
});
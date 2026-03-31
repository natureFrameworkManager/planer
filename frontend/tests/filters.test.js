import { getEvents } from "../js/filters.js";
import { fetchedData, filterState, TRI } from "../js/state.js";

function resetFilterState() {
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
}

describe("getEvents", () => {
    beforeEach(() => {
        resetFilterState();

        fetchedData.modules = [
            { id: 1, name: "M1", degree_ids: [10] },
            { id: 2, name: "M2", degree_ids: [10] },
            { id: 3, name: "M3", degree_ids: [20] },
        ];

        fetchedData.events = [
            { id: 101, module_ids: [1], status: "ok", staff_ids: [7], location_id: 100, type: "Vorlesung" },
            { id: 102, module_ids: [2], status: "tok", staff_ids: [8], location_id: 101, type: "Seminar" },
            { id: 103, module_ids: [3], status: "ok", staff_ids: [9], location_id: 102, type: "Uebung" },
        ];
    });

    test("returns all events when no filters are active", () => {
        const result = getEvents().map((ev) => ev.id).sort();
        expect(result).toEqual([101, 102, 103]);
    });

    test("limits to selected module ids", () => {
        filterState.selectedModules.add(2);

        const result = getEvents().map((ev) => ev.id);
        expect(result).toEqual([102]);
    });

    test("applies hidden and selected tri-state filters", () => {
        filterState.hiddenTypes.add("Seminar");
        filterState.status.ok = TRI.SELECTED;

        const result = getEvents().map((ev) => ev.id).sort();
        expect(result).toEqual([101, 103]);
    });

    test("filters by degree modules when degree is selected", () => {
        filterState.degree = 10;

        const result = getEvents().map((ev) => ev.id).sort();
        expect(result).toEqual([101, 102]);
    });
});
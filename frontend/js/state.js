// tri-state
export const TRI = {
    NEUTRAL: "neutral",
    SELECTED: "selected",
    HIDDEN: "hidden",
};
const TRI_CYCLE = [TRI.NEUTRAL, TRI.SELECTED, TRI.HIDDEN];

export function nextTriState(current) {
    const i = TRI_CYCLE.indexOf(current);
    return TRI_CYCLE[(i + 1) % 3];
}

// save last fetched data
export const fetchedData = {
    degrees: [],
    modules: [],
    events: [],
    staff: [],
    locations: [],
    semesters: [],
    states: [
        {
            "key": "ok",
            "name": "Bestätigt"
        },
        {
            "key": "tok",
            "name": "Dozent ausstehend"
        },
        {
            "key": "pok",
            "name": "Zeit ausstehend"
        },
        {
            "key": "alt",
            "name": "Aus Vorsemester"
        },
        {
            "key": "reserve",
            "name": "Nicht mehr angeboten"
        }
    ] 
}

// save filter selection
export const filterState = {
    degree: null,
    semester: null,
    selectedModules: new Set(), // module ids
    hiddenModules: new Set(), // module ids
    selectedTypes: new Set(),
    hiddenTypes: new Set(),
    status: {
        "ok": null,
        "tok": null,
        "pok": null,
        "alt": null,
        "reserve": null
    },
    selectedStaff: new Set(),
    hiddenStaff: new Set(),
    selectedLocations: new Set(),
    hiddenLocations: new Set()
}

// save pinned events
export const pinnedEvents = new Set(); // event ids

// save selected view
export const view = "timeGridWeek";

// save color mode
export const colorMode = "type";
export const customMap = new Map();

// save dark mode
export const darkMode = {value: true};
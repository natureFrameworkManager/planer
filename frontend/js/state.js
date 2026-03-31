// @ts-check
/** @typedef {'neutral' | 'selected' | 'hidden'} TriState */
/** @typedef {'ok' | 'tok' | 'pok' | 'alt' | 'reserve'} StatusKey */
/** @typedef {{ key: StatusKey, name: string }} EventStateOption */
/** @typedef {{ [key in StatusKey]: TriState | null }} StatusFilterState */
/** @typedef {{ degrees: import("./api").Degree[], modules: import("./api").Module[], events: import("./api").Event[], staff: import("./api").Staff[], locations: import("./api").Location[], semesters: import("./api").Semester[], states: EventStateOption[] }} FetchedDataState */
/** @typedef {{ degree: number | null, semester: number | null, selectedModules: Set<number>, hiddenModules: Set<number>, selectedTypes: Set<string>, hiddenTypes: Set<string>, status: StatusFilterState, selectedStaff: Set<number>, hiddenStaff: Set<number>, selectedLocations: Set<number>, hiddenLocations: Set<number> }} FilterState */

/** 
 * TriState enum for filter states, with a helper function to cycle through states.
 * @type {{ NEUTRAL: TriState, SELECTED: TriState, HIDDEN: TriState }} 
 */
export const TRI = {
    NEUTRAL: "neutral",
    SELECTED: "selected",
    HIDDEN: "hidden",
};
const TRI_CYCLE = [TRI.NEUTRAL, TRI.SELECTED, TRI.HIDDEN];

/**
 * Cycle through neutral -> selected -> hidden.
 * @param {TriState} current
 * @returns {TriState}
 */
export function nextTriState(current) {
    const i = TRI_CYCLE.indexOf(current);
    return TRI_CYCLE[(i + 1) % 3];
}

/** @type {{ [day: number]: string }} */
export const WEEKDAY_LABELS = {
    1: "Montag",
    2: "Dienstag",
    3: "Mittwoch",
    4: "Donnerstag",
    5: "Freitag",
    6: "Samstag",
    7: "Sonntag",
}

/** 
 * Save the fetched data from the API for use across the application. This is populated on initial load and can be updated when needed.
 * @type {FetchedDataState} 
 */
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

/** 
 * Save the current filter state for use across the application. This is updated when the user changes filter settings.
 * @type {FilterState} 
 */
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

/** 
 * Save the IDs of pinned events for use across the application. This is updated when the user pins or unpins events.
 * @type {Set<number>} 
 */
export const pinnedEvents = new Set(); // event ids

/** 
 * Save the currently selected view for the calendar. This is updated when the user changes the view.
 * @type {{ value: string }} 
 */
export const view = { value: "timeGridWeek" };

/** 
 * Save the current color mode for the calendar. This is updated when the user changes the color mode.
 * @type {{ value: string }} 
 */
export const colorMode = { value: "type" };
/** 
 * Save custom mappings for color mode. 
 * This is updated when the user sets custom colors.
 * @type {Map<number, string>} 
 */
export const customMap = new Map();

/** 
 * Save the current dark mode setting for the calendar. This is updated when the user toggles dark mode.
 * It should be set based on the user's system preference on initial load, and can be toggled by the user.
 * @type {{ value: boolean }} 
 */
export const darkMode = { value: globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true };
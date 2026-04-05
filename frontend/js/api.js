import { saveFetchedData } from "./sharing_storage.js";
import { fetchedData } from "./state.js";

// @ts-check
const API_BASE = "http://127.0.0.1:8000/api";

/**
 * Helper function to fetch from API and "handle" errors
 * @param {string} path
 * @returns {Promise<unknown>}
 */
async function apiFetch(path) {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) throw new Error(`API ${path}: ${res.status}`);
    return res.json();
}

/**
 * @typedef {Object} ModuleSimple
 * @property {number} id
 * @property {string} name
 * @property {string} module_number
 * @property {number} credits
 * @property {string} planung
 * @property {string} language
 */
/**
 * @typedef {Object} ModuleInDegree
 * @property {number} id
 * @property {string} name
 * @property {string} module_number
 * @property {number} credits
 * @property {string} planung
 * @property {string} language
 * @property {number[]} semesters
 * @property {string | null} note
 */
/**
 * @typedef {Object} Module
 * @property {number} id
 * @property {string} name
 * @property {string} module_number
 * @property {number} credits
 * @property {string} planung
 * @property {string} language
 * @property {Object.<number, number[]>} degree_ids
 * @property {number[]} event_ids
 */
/**
 * @typedef {Object} Degree
 * @property {number} id
 * @property {string} name
 * @property {number[]} semesters
 * @property {number[]} module_ids
 */
/**
 * @typedef {Object} DegreeDetail
 * @property {number} id
 * @property {string} name
 * @property {number[]} semesters
 * @property {ModuleInDegree[]} modules
 */
/**
 * @typedef {Object} Event
 * @property {number} id
 * @property {string} type
 * @property {string} title
 * @property {number} weekday
 * @property {string} start_time
 * @property {string} end_time
 * @property {number} location_id
 * @property {string} status
 * @property {number[]} module_ids
 * @property {number[]} staff_ids
 */
/**
 * @typedef {Object} Staff
 * @property {number} id
 * @property {string} name
 */
/**
 * @typedef {Object} Location
 * @property {number} id
 * @property {string} name
 */
/**
 * @typedef {Object} Semester
 * @property {number} id
 * @property {string} name
 */

/**
 * Query API for degrees with relationships and semesters included
 * @returns {Promise<Degree[]>}
 */
export async function fetchDegrees() {
    return /** @type {Promise<Degree[]>} */ (
        apiFetch(
            "/degrees?include_relationships=true&include_semesters=true",
        )
    );
}

/**
 * Query API for degree details with relationships and semesters included
 * @param {number} id 
 * @returns {Promise<DegreeDetail>}
 */
export async function fetchDegreeDetail(id) {
    return /** @type {Promise<DegreeDetail>} */ (
        apiFetch(
            `/degrees/${id}?include_relationships=true&include_semesters=true`,
        )
    );
}

/**
 * Query API for modules with relationships included (degrees with semesters and events)
 * @returns {Promise<Module[]>}
 */
export async function fetchModules() {
    return /** @type {Promise<Module[]>} */ (
        apiFetch("/modules?include_relationships=true")
    );
}

/**
 * Query API for events with relationships included (modules, staff, locations)
 * @returns {Promise<Event[]>}
 */
export async function fetchEvents() {
    return /** @type {Promise<Event[]>} */ (
        apiFetch("/events?include_relationships=true")
    );
}

/**
 * Query API for staff
 * @returns {Promise<Staff[]>}
 */
export async function fetchStaff() {
    return /** @type {Promise<Staff[]>} */ (apiFetch("/staff"));
}

/**
 * Query API for locations
 * @returns {Promise<Location[]>}
 */
export async function fetchLocations() {
    return /** @type {Promise<Location[]>} */ (apiFetch("/locations"));
}

/**
 * Query API for semesters
 * @returns {Promise<Semester[]>}
 */
export async function fetchSemesters() {
    return /** @type {Promise<Semester[]>} */ (apiFetch("/semesters"));
}

// request all initial data
/**
 * Bundle function to fetch all data in parallel
 * @returns {Promise<[Degree[], Module[], Event[], Staff[], Location[], Semester[]]>}
 */
export async function fetchAll() {
    return Promise.all([
        fetchDegrees(),
        fetchModules(),
        fetchEvents(),
        fetchStaff(),
        fetchLocations(),
        fetchSemesters()
    ])
}

/**
 * Sync data by fetching all data from the API and updating the global state, then calling the provided callback to update the UI if needed.
 * @param {() => void} updateCallback 
 */
export async function syncData(updateCallback) {
    [fetchedData.degrees, fetchedData.modules, fetchedData.events, fetchedData.staff, fetchedData.locations, fetchedData.semesters] = await fetchAll();
    console.log("Data synced with API");
    saveFetchedData();
    if (updateCallback) updateCallback();
}
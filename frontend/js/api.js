const API_BASE = "http://127.0.0.1:8000/api";

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
 * @typedef {Object} Module
 * @property {number} id
 * @property {string} name
 * @property {string} module_number
 * @property {number} credits
 * @property {string} planung
 * @property {string} language
 * @property {number[]} degrees
 * @property {number[]} events
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
 * @property {ModuleSimple[]} modules
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
 * 
 * @returns {Promise<Degree[]>}
 */
export async function fetchDegrees() {
    return apiFetch(
        "/degrees?include_relationships=true&include_semesters=true",
    );
}

/**
 * 
 * @param {number} id 
 * @returns {Promise<DegreeDetail>}
 */
export async function fetchDegreeDetail(id) {
    return apiFetch(
        `/degrees/${id}?include_relationships=true&include_semesters=true`,
    );
}

/**
 * 
 * @returns {Promise<Module[]>}
 */
export async function fetchModules() {
    return apiFetch("/modules?include_relationships=true");
}

/**
 * 
 * @returns {Promise<Event[]>}
 */
export async function fetchEvents() {
    return apiFetch("/events?include_relationships=true");
}

/**
 * 
 * @returns {Promise<{id: number, name: string}[]>}
 */
export async function fetchStaff() {
    return apiFetch("/staff");
}

/**
 * 
 * @returns {Promise<{id: number, name: string}[]>}
 */
export async function fetchLocations() {
    return apiFetch("/locations");
}

/**
 * 
 * @returns {Promise<{id: number, name: string}[]>}
 */
export async function fetchSemesters() {
    return apiFetch("/semesters");
}

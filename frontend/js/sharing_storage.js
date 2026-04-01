// @ts-check
import { filterState, pinnedEvents, view, colorMode, customMap, darkMode, fetchedData } from "./state.js";

const VALID_TRI = /** @type {Set<string>} */ (new Set(["neutral", "selected", "hidden"]));
const STORAGE_KEY = "planerState";
const IDB_NAME = "planerDB";
const IDB_STORE = "cache";
const IDB_KEY = "fetchedData";
const LS_FETCHED_KEY = "planerFetchedData";

/**
 * Serialize current app state into a plain object suitable for JSON/URL encoding.
 * @returns {Object}
 */
function serializeState() {
    return {
        d: filterState.degree,
        s: filterState.semester,
        sm: [...filterState.selectedModules],
        hm: [...filterState.hiddenModules],
        st: [...filterState.selectedTypes],
        ht: [...filterState.hiddenTypes],
        status: filterState.status,
        ss: [...filterState.selectedStaff],
        hs: [...filterState.hiddenStaff],
        sl: [...filterState.selectedLocations],
        hl: [...filterState.hiddenLocations],
        pin: [...pinnedEvents],
        v: view.value,
        cm: colorMode.value,
        cmap: [...customMap.entries()],
        dm: darkMode.value,
    };
}

/**
 * Apply a deserialized state object to the app's live state.
 * @param {any} o
 */
function applyState(o) {
    if (!o || typeof o !== "object") return;

    if (typeof o.d === "number") filterState.degree = o.d;
    else if (o.d === null) filterState.degree = null;

    if (typeof o.s === "number") filterState.semester = o.s;
    else if (o.s === null) filterState.semester = null;

    if (Array.isArray(o.sm)) { filterState.selectedModules.clear(); o.sm.forEach(/** @param {number} id */ id => filterState.selectedModules.add(id)); }
    if (Array.isArray(o.hm)) { filterState.hiddenModules.clear(); o.hm.forEach(/** @param {number} id */ id => filterState.hiddenModules.add(id)); }
    if (Array.isArray(o.st)) { filterState.selectedTypes.clear(); o.st.forEach(/** @param {string} t */ t => filterState.selectedTypes.add(t)); }
    if (Array.isArray(o.ht)) { filterState.hiddenTypes.clear(); o.ht.forEach(/** @param {string} t */ t => filterState.hiddenTypes.add(t)); }

    if (o.status && typeof o.status === "object") {
        for (const key of /** @type {(import("./state.js").StatusKey)[]} */ (Object.keys(filterState.status))) {
            if (key in o.status) {
                var sv = o.status[key];
                filterState.status[key] = (sv === null || VALID_TRI.has(sv)) ? sv : null;
            }
        }
    }

    if (Array.isArray(o.ss)) { filterState.selectedStaff.clear(); o.ss.forEach(/** @param {number} id */ id => filterState.selectedStaff.add(id)); }
    if (Array.isArray(o.hs)) { filterState.hiddenStaff.clear(); o.hs.forEach(/** @param {number} id */ id => filterState.hiddenStaff.add(id)); }
    if (Array.isArray(o.sl)) { filterState.selectedLocations.clear(); o.sl.forEach(/** @param {number} id */ id => filterState.selectedLocations.add(id)); }
    if (Array.isArray(o.hl)) { filterState.hiddenLocations.clear(); o.hl.forEach(/** @param {number} id */ id => filterState.hiddenLocations.add(id)); }

    if (Array.isArray(o.pin)) { pinnedEvents.clear(); o.pin.forEach(/** @param {number} id */ id => pinnedEvents.add(id)); }
    if (typeof o.v === "string") view.value = o.v;
    if (typeof o.cm === "string") colorMode.value = o.cm;
    if (Array.isArray(o.cmap)) { customMap.clear(); o.cmap.forEach(/** @param {[number, string]} entry */([k, v]) => customMap.set(k, v)); }
    if (typeof o.dm === "boolean") darkMode.value = o.dm;
}

/**
 * Set a URL param only if the value is non-empty. Arrays/Sets are joined with commas.
 * @param {URLSearchParams} params
 * @param {string} key
 * @param {any} value
 */
function setParam(params, key, value) {
    if (value === null || value === undefined || value === "") return;
    if (Array.isArray(value)) {
        if (value.length > 0) params.set(key, value.map(v => encodeURIComponent(v)).join(","));
    } else {
        params.set(key, encodeURIComponent(String(value)));
    }
}

// TODO: create a not so cryptic looking share link
// Currently looks with escaping like a tracking link with random parameters, which might be off-putting for users to click on or share.
/**
 * Generate a shareable link that encodes the current state of the app (e.g. filters, calendar view, etc.) in the URL parameters. 
 * This allows users to share specific views or configurations of the app with others. 
 * The function should serialize the relevant state into a query string format and return the full URL that can be shared.
 * The app should be able to parse these parameters on load and restore the corresponding state.
 * @returns {string} The generated shareable link with encoded state in URL parameters.
 */
export function getShareLink() {
    var url = new URL(window.location.href);
    url.search = "";
    var p = url.searchParams;
    setParam(p, "d", filterState.degree);
    setParam(p, "s", filterState.semester);
    setParam(p, "sm", [...filterState.selectedModules]);
    setParam(p, "hm", [...filterState.hiddenModules]);
    setParam(p, "st", [...filterState.selectedTypes]);
    setParam(p, "ht", [...filterState.hiddenTypes]);
    // status: only include non-null entries
    for (const [key, val] of /** @type {[import("./state.js").StatusKey, import("./state.js").TriState | null][]} */ (Object.entries(filterState.status))) {
        if (val !== null) p.set("status_" + key, val);
    }
    setParam(p, "ss", [...filterState.selectedStaff]);
    setParam(p, "hs", [...filterState.hiddenStaff]);
    setParam(p, "sl", [...filterState.selectedLocations]);
    setParam(p, "hl", [...filterState.hiddenLocations]);
    setParam(p, "pin", [...pinnedEvents]);
    setParam(p, "v", view.value);
    setParam(p, "cm", colorMode.value);
    if (customMap.size > 0) {
        p.set("cmap", [...customMap.entries()].map(([k, v]) => encodeURIComponent(k) + ":" + encodeURIComponent(v)).join(","));
    }
    setParam(p, "dm", darkMode.value);
    return url.toString();
}

/**
 * Save current state to local storage.
 * This should include any filter states, view settings, or other user preferences that should persist across sessions.
 * This function is called whenever the user changes a setting that should be saved, and it should serialize the relevant state and store it in local storage under a specific key (e.g. "planerState").
 * The app should also call this function before the user leaves the page (e.g. on "beforeunload" event) to ensure that the latest state is saved.
 * @returns {Boolean} Returns true if the state was successfully saved, or false if there was an error (e.g. local storage is not available).
 */
export function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState()));
        return true;
    } catch {
        return false;
    }
}

/**
 * Clear saved state from local storage.
 * @returns {void}
 */
export function clearStateStorage() {
    localStorage.removeItem(STORAGE_KEY);
}

/**
 * Open the IndexedDB database, creating the object store if needed.
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
    return new Promise((resolve, reject) => {
        var req = indexedDB.open(IDB_NAME, 1);
        req.onupgradeneeded = () => {
            var db = req.result;
            if (!db.objectStoreNames.contains(IDB_STORE)) {
                db.createObjectStore(IDB_STORE);
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

/**
 * Save fetched data to IndexedDB (or a fallback to local storage if IndexedDB is not available). 
 * This allows the app to cache data locally and reduce the need for repeated API calls, improving performance and enabling offline access to previously fetched data.
 * If using IndexedDB, this function should open a transaction and store the fetched data in an object store. If IndexedDB is not available, it should serialize the data and save it in local storage under a specific key (e.g. "fetchedData").
 * This function should be called after successfully initially fetching data from the API or syncing with the API to ensure that the latest data is cached for future use.
 * @returns {Boolean} Returns true if the data was successfully saved, or false if there was an error (e.g. storage is not available).
 */
export function saveFetchedData() {
    var data = {
        degrees: fetchedData.degrees,
        modules: fetchedData.modules,
        events: fetchedData.events,
        staff: fetchedData.staff,
        locations: fetchedData.locations,
        semesters: fetchedData.semesters,
        states: fetchedData.states,
    };

    if (typeof indexedDB !== "undefined") {
        openDB().then(db => {
            var tx = db.transaction(IDB_STORE, "readwrite");
            tx.objectStore(IDB_STORE).put(data, IDB_KEY);
        }).catch(() => {
            // IndexedDB open failed — fall back to localStorage
            try { localStorage.setItem(LS_FETCHED_KEY, JSON.stringify(data)); } catch { /* ignore */ }
        });
        return true;
    }

    // No IndexedDB — use localStorage
    try {
        localStorage.setItem(LS_FETCHED_KEY, JSON.stringify(data));
        return true;
    } catch {
        return false;
    }
}

/**
 * Load fetched data from IndexedDB (or local storage if IndexedDB is not available) and return it. 
 * This function should be called during app initialization to populate the app's state with any cached data before making API calls, allowing for faster load times and offline access to previously fetched data.
 * If no cached data is available, this function should return null, prompting the app to fetch fresh data from the API.
 * @returns {import("./state.js").FetchedDataState | null} The loaded data from storage, or null if no data is available.
 */
function loadFetchedData() {
    try {
        var raw = localStorage.getItem(LS_FETCHED_KEY);
        if (raw) return /** @type {import("./state.js").FetchedDataState} */ (JSON.parse(raw));
    } catch { /* ignore */ }
    return null;
}

/**
 * Load fetched data from IndexedDB asynchronously.
 * Falls back to localStorage if IndexedDB is unavailable or empty.
 * @returns {Promise<import("./state.js").FetchedDataState | null>}
 */
export async function loadFetchedDataAsync() {
    if (typeof indexedDB !== "undefined") {
        try {
            var db = await openDB();
            var result = await new Promise((resolve, reject) => {
                var tx = db.transaction(IDB_STORE, "readonly");
                var req = tx.objectStore(IDB_STORE).get(IDB_KEY);
                req.onsuccess = () => resolve(req.result ?? null);
                req.onerror = () => reject(req.error);
            });
            if (result) return /** @type {import("./state.js").FetchedDataState} */ (result);
        } catch { /* fall through to localStorage */ }
    }
    return loadFetchedData();
}

/**
 * Parse a comma-separated param into an array of numbers. Returns empty array if missing.
 * @param {URLSearchParams} params
 * @param {string} key
 * @returns {number[]}
 */
function getNumArray(params, key) {
    var val = params.get(key);
    if (!val) return [];
    return val.split(",").filter(s => s !== "").map(s => Number(decodeURIComponent(s))).filter(n => !isNaN(n));
}

/**
 * Parse a comma-separated param into an array of strings. Returns empty array if missing.
 * @param {URLSearchParams} params
 * @param {string} key
 * @returns {string[]}
 */
function getStrArray(params, key) {
    var val = params.get(key);
    if (!val) return [];
    return val.split(",").filter(s => s !== "").map(s => decodeURIComponent(s));
}

/**
 * Apply URL search params to the app's live state.
 * @param {URLSearchParams} params
 */
function applyParams(params) {
    if (params.has("d")) { var dv = parseInt(params.get("d") ?? ""); filterState.degree = isNaN(dv) ? null : dv; }
    if (params.has("s")) { var sv = parseInt(params.get("s") ?? ""); filterState.semester = isNaN(sv) ? null : sv; }

    if (params.has("sm")) { filterState.selectedModules.clear(); getNumArray(params, "sm").forEach(id => filterState.selectedModules.add(id)); }
    if (params.has("hm")) { filterState.hiddenModules.clear(); getNumArray(params, "hm").forEach(id => filterState.hiddenModules.add(id)); }
    if (params.has("st")) { filterState.selectedTypes.clear(); getStrArray(params, "st").forEach(t => filterState.selectedTypes.add(t)); }
    if (params.has("ht")) { filterState.hiddenTypes.clear(); getStrArray(params, "ht").forEach(t => filterState.hiddenTypes.add(t)); }

    for (const key of /** @type {(import("./state.js").StatusKey)[]} */ (Object.keys(filterState.status))) {
        var statusVal = params.get("status_" + key);
        if (statusVal !== null && VALID_TRI.has(statusVal)) filterState.status[key] = /** @type {import("./state.js").TriState} */ (statusVal);
    }

    if (params.has("ss")) { filterState.selectedStaff.clear(); getNumArray(params, "ss").forEach(id => filterState.selectedStaff.add(id)); }
    if (params.has("hs")) { filterState.hiddenStaff.clear(); getNumArray(params, "hs").forEach(id => filterState.hiddenStaff.add(id)); }
    if (params.has("sl")) { filterState.selectedLocations.clear(); getNumArray(params, "sl").forEach(id => filterState.selectedLocations.add(id)); }
    if (params.has("hl")) { filterState.hiddenLocations.clear(); getNumArray(params, "hl").forEach(id => filterState.hiddenLocations.add(id)); }

    if (params.has("pin")) { pinnedEvents.clear(); getNumArray(params, "pin").forEach(id => pinnedEvents.add(id)); }
    if (params.has("v")) view.value = decodeURIComponent(params.get("v") ?? view.value);
    if (params.has("cm")) colorMode.value = decodeURIComponent(params.get("cm") ?? colorMode.value);
    if (params.has("cmap")) {
        customMap.clear();
        (params.get("cmap") ?? "").split(",").forEach(entry => {
            var idx = entry.indexOf(":");
            if (idx < 1) return;
            var k = Number(decodeURIComponent(entry.slice(0, idx)));
            var v = decodeURIComponent(entry.slice(idx + 1));
            if (!isNaN(k) && v) customMap.set(k, v);
        });
    }
    if (params.has("dm")) darkMode.value = decodeURIComponent(params.get("dm") ?? "") === "true";
}

/**
 * Restore state from URL parameters or local storage. This function should be called on app initialization to apply any saved filters, calendar settings, or other user preferences.  
 * It should parse the URL for any relevant parameters and apply them to the app's state, as well as check local storage for any saved settings and apply those as well.
 * URL parameters should take precedence over local storage, allowing users to share specific views or configurations via links. 
 * If parameters are missing or invalid, the app should fall back to local storage or don't apply any changes to keep the app in the default state.
 * @returns {void}
 */
export function restoreState() {
    var params = new URLSearchParams(window.location.search);

    // If URL has any recognized state params, use them
    var stateKeys = ["d", "s", "sm", "hm", "st", "ht", "ss", "hs", "sl", "hl", "pin", "v", "cm", "cmap", "dm"];
    var hasUrlState = stateKeys.some(k => params.has(k)) || [...params.keys()].some(k => k.startsWith("status_"));

    if (hasUrlState) {
        applyParams(params);
        return;
    }

    // Fall back to localStorage
    try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (raw) applyState(JSON.parse(raw));
    } catch { /* ignore */ }
}

export function showShareLinkSuccessMsg() {
    const msgEl = document.querySelector("#shareLinkSuccessMSg");
    if (!msgEl) return;
    msgEl.textContent = "Share link copied to clipboard!";
    setTimeout(() => {
        msgEl.textContent = "";
    }, 3000);
}
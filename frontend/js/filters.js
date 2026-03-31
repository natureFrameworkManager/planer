// @ts-check
import { fetchedData, filterState, nextTriState, pinnedEvents, TRI } from "./state.js"

/** @type {(() => void) | null} */
let updateCallback = null;

/**
 * Set callback for when filters are updated (e.g. after select change)
 * @param {() => void} func
 */
export function setFilterUpdateCallback(func) {
    updateCallback = func;
}

/**
 * Update all filter sections based on fetched data and filter state. This should be called after fetching data and whenever filter state changes.
 */
export function updateFilters() {
    fillDegreesSemesters();
    fillModules();
    fillTypes();
    fillStates();
    fillStaff();
    fillLocations();
}
/**
 * Fill the degree and semester filter sections with degrees and semesters from fetched data. Show semesters based on selected degree. If no degree is selected, hide semester filter.
 */
function fillDegreesSemesters() {
    var degrees = fetchedData.degrees.sort((a, b) => a.name.localeCompare(b.name));

    var degreeEl = /** @type {HTMLSelectElement | null} */ (document.querySelector("#degreeSelect"));
    var semesterEl = /** @type {HTMLSelectElement | null} */ (document.querySelector("#semesterSelect"));
    var semFilterSec = /** @type {HTMLElement | null} */ (document.querySelector("#semester-filter-section"));

    if (!degreeEl || !semesterEl) return;

    var degreeHtml = "<option value=''>Alle Studiengänge</option>";
    for (const degree of degrees) {
        degreeHtml += '<option value="' + degree.id + '"' + (filterState.degree === degree.id ? " selected" : "") + '>' + degree.name + "</option>";
    }
    degreeEl.innerHTML = degreeHtml;
    degreeEl.addEventListener("change", handleDegreeSelect);

    if (filterState.degree !== null) {
        if (semFilterSec) semFilterSec.style.display = "";
        var semesters = (degrees.find(el => el.id === filterState.degree)?.semesters ?? []).sort();
        var semHtml = "<option value=''>Alle Semester</option>";
        for (const semester of semesters) {
            semHtml += '<option value="' + semester + '"' + (filterState.semester === semester ? " selected" : "") + '>' + semester + "</option>";
        }
        semesterEl.innerHTML = semHtml;
        semesterEl.addEventListener("change", handleSemesterSelect);
    } else {
        if (semFilterSec) semFilterSec.style.display = "none";
        semesterEl.innerHTML = "<option value=''>Alle Semester</option>";
    }
}
/**
 * Fill the module filter section with modules from fetched data based on selected degree and semester. Show event count for each module and disable modules with no events.
 * Also separate modules of selected degree and semester from other modules and show them in different sections. If no degree is selected, show all modules in the first section.
 */
function fillModules() {
    var currentDegree = /** @type {HTMLOptionElement | null} */ (document.querySelector("#degreeSelect option:checked"))?.value ?? "";
    if (!isNaN(parseInt(currentDegree))) {
        var degreeId = parseInt(currentDegree);
        var modules = fetchedData.modules.filter(el => degreeId in el.degree_ids);
        if (filterState.semester !== null) {
            const semesterNum = /** @type {number} */ (filterState.semester);
            modules = modules.filter(el => el.degree_ids[degreeId]?.includes(semesterNum));
        }
        var moreModules = fetchedData.modules.filter(el => !modules.includes(el));
    } else {
        var modules = fetchedData.modules;
        /** @type {import('./api.js').Module[]} */
        var moreModules = [];
    }

    var moduleCon = /** @type {HTMLElement | null} */ (document.querySelector("#moduleList"));
    if (!moduleCon) return;
    moduleCon.innerHTML = "";
    var moreModuleCon = /** @type {HTMLElement | null} */ (document.querySelector("#weitereModuleList"));
    if (!moreModuleCon) return;
    moreModuleCon.innerHTML = "";

    for (const module of modules) {
        if (filterState.selectedModules.has(module.id)) {
            var state = TRI.SELECTED;
        } else if (filterState.hiddenModules.has(module.id)) {
            var state = TRI.HIDDEN;
        } else {
            var state = TRI.NEUTRAL;
        }
        var count = getEvents().filter(el => el.module_ids.some(id => module.id == id)).length
        moduleCon.appendChild(createFilterRow(module.id, module.name, state, count, handleModuleSelect, count == 0 && state == TRI.NEUTRAL));
    }
    for (const module of moreModules) {
        if (filterState.selectedModules.has(module.id)) {
            var state = TRI.SELECTED;
        } else if (filterState.hiddenModules.has(module.id)) {
            var state = TRI.HIDDEN;
        } else {
            var state = TRI.NEUTRAL;
        }
        var count = getEvents().filter(el => el.module_ids.some(id => module.id == id)).length
        moreModuleCon.appendChild(createFilterRow(module.id, module.name, state, count, handleModuleSelect));
    }
    const weitereSection = /** @type {HTMLElement | null} */ (document.querySelector("#weitereSection"));
    if (moreModules.length > 0) {
        if (weitereSection) weitereSection.style.display = "";
    } else {
        if (weitereSection) weitereSection.style.display = "none";
    }
}
/**
 * Fill the type filter section with types from fetched data. Show event count for each type and disable types with no events.
 */
function fillTypes() {
    var types = new Set(fetchedData.events.map(el => el.type));

    var typeCon = /** @type {HTMLElement | null} */ (document.querySelector("#typeList"));
    if (!typeCon) return;
    typeCon.innerHTML = "";

    for (const type of [...types].sort()) {
        if (filterState.selectedTypes.has(type)) {
            var state = TRI.SELECTED;
        } else if (filterState.hiddenTypes.has(type)) {
            var state = TRI.HIDDEN;
        } else {
            var state = TRI.NEUTRAL;
        }
        var count = getEvents().filter(el => el.type == type).length
        typeCon.appendChild(createFilterRow(type, type, state, count, handleTypeSelect, count == 0 && state == TRI.NEUTRAL));
    }

}
/**
 * Fill the state filter section with states from fetched data. Show event count for each state and disable states with no events.
 */
function fillStates() {
    var states = fetchedData.states;

    var stateCon = /** @type {HTMLElement | null} */ (document.querySelector("#statusList"));
    if (!stateCon) return;
    stateCon.innerHTML = "";

    for (const state of states) {
        var rowState = filterState.status[state.key] ?? TRI.NEUTRAL;
        var count = getEvents().filter(el => el.status == state.key).length
        stateCon.appendChild(createFilterRow(state.key, state.name, rowState, count, handleStateSelect, count == 0 && rowState == TRI.NEUTRAL));
    }
}
/**
 * Fill the staff filter section with staff from fetched data. Show event count for each staff and disable staff with no events. Hide staff with no events if they are not selected.
 */
function fillStaff() {
    var staff = fetchedData.staff;

    var staffCon = /** @type {HTMLElement | null} */ (document.querySelector("#staffList"));
    if (!staffCon) return;
    staffCon.innerHTML = "";

    for (const staffMember of staff.sort((a, b) => a.name.localeCompare(b.name))) {
        if (filterState.selectedStaff.has(staffMember.id)) {
            var state = TRI.SELECTED;
        } else if (filterState.hiddenStaff.has(staffMember.id)) {
            var state = TRI.HIDDEN;
        } else {
            var state = TRI.NEUTRAL;
        }
        var count = getEvents().filter(el => el.staff_ids.some(id => staffMember.id == id)).length
        if (count == 0 && state == TRI.NEUTRAL) {
            continue;
        }
        staffCon.appendChild(createFilterRow(staffMember.id, staffMember.name, state, count, handleStaffSelect));
    }
}
/**
 * Fill the location filter section with locations from fetched data. Show event count for each location and disable locations with no events. Hide locations with no events if they are not selected.
 */
function fillLocations() {
    var locations = fetchedData.locations;

    var locationCon = /** @type {HTMLElement | null} */ (document.querySelector("#locationList"));
    if (!locationCon) return;
    locationCon.innerHTML = "";

    for (const location of locations.sort((a, b) => a.name.localeCompare(b.name))) {
        if (filterState.selectedLocations.has(location.id)) {
            var state = TRI.SELECTED;
        } else if (filterState.hiddenLocations.has(location.id)) {
            var state = TRI.HIDDEN;
        } else {
            var state = TRI.NEUTRAL;
        }
        var count = getEvents().filter(el => el.location_id == location.id).length
        if (count == 0 && state == TRI.NEUTRAL) {
            continue;
        }
        locationCon.appendChild(createFilterRow(location.id, location.name, state, count, handleLocationSelect));
    }
}

// search modules

// search more modules

// search staff

// search locations

/**
 * Handle degree select change, update filter state and trigger update callback.
 * @param {Event} ev 
 */
function handleDegreeSelect(ev) {
    var selected = /** @type {HTMLOptionElement | null} */ (/** @type {HTMLSelectElement} */ (ev.target).querySelector("option:checked"))?.value ?? "";
    if (!isNaN(parseInt(selected))) {
        filterState.degree = parseInt(selected);
    } else {
        filterState.degree = null;
    }
    filterState.semester = null;

    if (updateCallback !== null) {
        updateCallback();
    };
}
/**
 * Handle semester select change, update filter state and trigger update callback.
 * @param {Event} ev 
 */
function handleSemesterSelect(ev) {
    var selected = /** @type {HTMLOptionElement | null} */ (/** @type {HTMLSelectElement} */ (ev.target).querySelector("option:checked"))?.value ?? "";
    if (!isNaN(parseInt(selected))) {
        filterState.semester = parseInt(selected);
    } else {
        filterState.semester = null;
    }

    if (updateCallback !== null) {
        updateCallback();
    }
}
/**
 * Handle module select change, update filter state and trigger update callback.
 * @param {Event} ev 
 */
function handleModuleSelect(ev) {
    var filterRowEl = /** @type {HTMLElement | null} */ (/** @type {Element} */ (ev.target).closest("div.frow"));
    var triStateEl = /** @type {HTMLElement | null} */ (filterRowEl?.querySelector("span.tri"));
    var newState = triStateEl?.dataset['state'];
    var moduleId = parseInt(filterRowEl?.dataset['key'] ?? "");
    if (!isNaN(moduleId)) {
        switch (newState) {
            case TRI.SELECTED:
                filterState.selectedModules.add(moduleId);
                filterState.hiddenModules.delete(moduleId);
                break;
            case TRI.HIDDEN:
                filterState.hiddenModules.add(moduleId);
                filterState.selectedModules.delete(moduleId);
                break;
            case TRI.NEUTRAL:
                filterState.hiddenModules.delete(moduleId);
                filterState.selectedModules.delete(moduleId);
                break;
        }
    }

    if (updateCallback !== null) {
        updateCallback();
    }
}
/**
 * Handle type select change, update filter state and trigger update callback.
 * @param {Event} ev 
 */
function handleTypeSelect(ev) {
    var filterRowEl = /** @type {HTMLElement | null} */ (/** @type {Element} */ (ev.target).closest("div.frow"));
    var triStateEl = /** @type {HTMLElement | null} */ (filterRowEl?.querySelector("span.tri"));
    var newState = triStateEl?.dataset['state'];
    var typeId = filterRowEl?.dataset['key'] ?? "";

    switch (newState) {
        case TRI.SELECTED:
            filterState.selectedTypes.add(typeId);
            filterState.hiddenTypes.delete(typeId);
            break;
        case TRI.HIDDEN:
            filterState.hiddenTypes.add(typeId);
            filterState.selectedTypes.delete(typeId);
            break;
        case TRI.NEUTRAL:
            filterState.hiddenTypes.delete(typeId);
            filterState.selectedTypes.delete(typeId);
            break;
    }
    if (updateCallback !== null) {
        updateCallback();
    }
}
/**
 * Handle state select change, update filter state and trigger update callback.
 * @param {Event} ev 
 */
function handleStateSelect(ev) {
    var filterRowEl = /** @type {HTMLElement | null} */ (/** @type {Element} */ (ev.target).closest("div.frow"));
    var triStateEl = /** @type {HTMLElement | null} */ (filterRowEl?.querySelector("span.tri"));
    var newState = triStateEl?.dataset['state'];
    var stateKey = filterRowEl?.dataset['key'];

    filterState.status[/** @type {import('./state.js').StatusKey} */ (stateKey ?? "")] = /** @type {import('./state.js').TriState | null} */ (newState ?? null);
    if (updateCallback !== null) {
        updateCallback();
    }
}
/**
 * Handle staff select change, update filter state and trigger update callback.
 * @param {Event} ev 
 */
function handleStaffSelect(ev) {
    var filterRowEl = /** @type {HTMLElement | null} */ (/** @type {Element} */ (ev.target).closest("div.frow"));
    var triStateEl = /** @type {HTMLElement | null} */ (filterRowEl?.querySelector("span.tri"));
    var newState = triStateEl?.dataset['state'];
    var staffId = parseInt(filterRowEl?.dataset['key'] ?? "");
    if (!isNaN(staffId)) {
        switch (newState) {
            case TRI.SELECTED:
                filterState.selectedStaff.add(staffId);
                filterState.hiddenStaff.delete(staffId);
                break;
            case TRI.HIDDEN:
                filterState.hiddenStaff.add(staffId);
                filterState.selectedStaff.delete(staffId);
                break;
            case TRI.NEUTRAL:
                filterState.hiddenStaff.delete(staffId);
                filterState.selectedStaff.delete(staffId);
                break;
        }
        if (updateCallback !== null) {
            updateCallback();
        }
    }
}
/**
 * Handle location select change, update filter state and trigger update callback.
 * @param {Event} ev 
 */
function handleLocationSelect(ev) {
    var filterRowEl = /** @type {HTMLElement | null} */ (/** @type {Element} */ (ev.target).closest("div.frow"));
    var triStateEl = /** @type {HTMLElement | null} */ (filterRowEl?.querySelector("span.tri"));
    var newState = triStateEl?.dataset['state'];
    var locationId = parseInt(filterRowEl?.dataset['key'] ?? "");
    if (!isNaN(locationId)) {
        switch (newState) {
            case TRI.SELECTED:
                filterState.selectedLocations.add(locationId);
                filterState.hiddenLocations.delete(locationId);
                break;
            case TRI.HIDDEN:
                filterState.hiddenLocations.add(locationId);
                filterState.selectedLocations.delete(locationId);
                break;
            case TRI.NEUTRAL:
                filterState.hiddenLocations.delete(locationId);
                filterState.selectedLocations.delete(locationId);
                break;
        }
        if (updateCallback !== null) {
            updateCallback();
        }
    }
}

/**
 * Compute events based on selected degree, semester, modules, types, staff, locations and states.
 * Also consider hidden modules, types, staff, locations and states.
 * If there are selected states, only show events with these states.
 * @returns {import('./api.js').Event[]}
 */
export function getEvents() {
    // modules
    if (filterState.degree !== null) {
        var degreeModules = fetchedData.modules.filter(el => /** @type {number} */(filterState.degree) in el.degree_ids);
        if (filterState.semester !== null) {
            const degreeId = /** @type {number} */ (filterState.degree);
            const semesterNumber = /** @type {number} */ (filterState.semester);
            degreeModules = degreeModules.filter(el => el.degree_ids[degreeId]?.includes(semesterNumber));
        }
    } else {
        var degreeModules = fetchedData.modules;
    }
    var degreeModulesIds = degreeModules.map(el => el.id);
    var selectedDegreeModules = [...filterState.selectedModules].filter(el => degreeModulesIds.includes(el));
    var moreSelectedModules = [...filterState.selectedModules].filter(el => !degreeModulesIds.includes(el));
    /** @type {number[]} */
    var modules = [];
    if (selectedDegreeModules.length > 0) {
        modules = modules.concat(selectedDegreeModules);
    } else {
        modules = modules.concat(degreeModulesIds);
    }
    modules = modules.concat(moreSelectedModules);
    modules = modules.filter(el => !filterState.hiddenModules.has(el));

    return fetchedData.events.filter(el =>
        el.module_ids.some(id => modules.includes(id)) &&
        filterState.status[/** @type {import('./state.js').StatusKey} */ (el.status)] !== TRI.HIDDEN &&
        !el.staff_ids.some(id => filterState.hiddenStaff.has(id)) &&
        !filterState.hiddenLocations.has(el.location_id) &&
        !filterState.hiddenTypes.has(el.type) &&

        (Object.values(filterState.status).filter(el => el == TRI.SELECTED).length > 0 ? filterState.status[/** @type {import('./state.js').StatusKey} */ (el.status)] == TRI.SELECTED : true) &&
        (filterState.selectedTypes.size > 0 ? filterState.selectedTypes.has(el.type) : true) &&
        (filterState.selectedStaff.size > 0 ? el.staff_ids.some(id => filterState.selectedStaff.has(id)) : true) &&
        (filterState.selectedLocations.size > 0 ? filterState.selectedLocations.has(el.location_id) : true)
    ).filter(el => !getHiddenEvents().some(he => he.id == el.id));
}

/**
 * Compute hidden events based on pinned events, when they share the same module and type.
 * For example a pinned exercise would have a group name, so all events with the same module and type "exercise" would be hidden, except the pinned one.
 * @returns {import('./api.js').Event[]}
 */
export function getHiddenEvents() {
    /** @type {import('./api.js').Event[]} */
    var hidden = [];
    var eventsPinned = [...pinnedEvents];
    for (const pinnedId of eventsPinned) {
        var pinnedEvent = fetchedData.events.find(el => el.id == pinnedId);
        if (!pinnedEvent || pinnedEvent === undefined) continue;
        var similar = fetchedData.events.filter(el =>
            el.id !== pinnedId &&
            el.module_ids.some(id => pinnedEvent?.module_ids.includes(id)) &&
            el.type == pinnedEvent?.type
        );
        hidden = hidden.concat(similar);
    }
    return hidden;
}

/**
 * Reset all filters and pinned events to default state and trigger update callback.
 */
export function clearFilters() {
    filterState.degree = null;
    filterState.semester = null;
    filterState.selectedModules.clear();
    filterState.hiddenModules.clear();
    filterState.selectedTypes.clear();
    filterState.hiddenTypes.clear();
    for (const key of /** @type {(import('./state.js').StatusKey)[]} */ (Object.keys(filterState.status))) {
        filterState.status[key] = null;
    }
    filterState.selectedStaff.clear();
    filterState.hiddenStaff.clear();
    filterState.selectedLocations.clear();
    filterState.hiddenLocations.clear();
    pinnedEvents.clear();

    if (updateCallback !== null) {
        updateCallback();
    }
}

/**
 * Create a filter row element with tri-state toggle, label and count. Attach click handler to toggle tri-state and trigger filter update.
 * @param {string | number} key 
 * @param {string} content displayed content 
 * @param {string} state element of TRI 
 * @param {number} count event count of row 
 * @param {Function} handler
 * @param {boolean} disabled mark row as disabled 
 * @returns {HTMLDivElement}
 */
function createFilterRow(
    key,
    content,
    state,
    count,
    handler,
    disabled = false,
) {
    const row = document.createElement("div");
    row.className = `frow${disabled ? " dimmed" : ""}`;
    row.setAttribute("data-state", state);
    row.setAttribute("data-key", String(key));

    // Tri-state toggle
    const tri = document.createElement("span");
    tri.className = `tri${disabled ? " dimmed" : ""}`;
    tri.setAttribute("data-state", state);
    row.appendChild(tri);

    // Label
    const lbl = document.createElement("span");
    lbl.className = "lbl";
    lbl.style.flex = "1";
    lbl.textContent = content;
    row.appendChild(lbl);

    // Count
    const cnt = document.createElement("span");
    cnt.className = "cnt";
    cnt.textContent = String(count);
    row.appendChild(cnt);

    // Click handler
    if (true) {
        row.addEventListener("click", (ev) => {
            const triEl = /** @type {HTMLElement | null} */ (row.querySelector("span.tri"));
            const current = /** @type {import('./state.js').TriState} */ (triEl?.dataset['state'] ?? TRI.NEUTRAL);
            const next = nextTriState(current);
            if (triEl) triEl.dataset['state'] = next;
            handler(ev);
        });
    }

    return row;
}
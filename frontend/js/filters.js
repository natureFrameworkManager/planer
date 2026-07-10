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

export function initFilters() {
    // Toogle "weitere Module" in filter section
    document.querySelector("#weitereToggle")?.addEventListener("click", () => {
        document.querySelector("#weitereExp")?.classList.toggle("open");
    })

    document.querySelector("#moduleSearch")?.addEventListener("input", handleModuleSearch);
    
    document.querySelector("#weitereModuleSearch")?.addEventListener("input", handleMoreModuleSearch);

    document.querySelector("#staffSearch")?.addEventListener("input", handleStaffSearch);

    document.querySelector("#locationSearch")?.addEventListener("input", handleLocationSearch);
}

/**
 * Update all filter sections based on fetched data and filter state. This should be called after fetching data and whenever filter state changes.
 */
export function updateFilters() {
    fillSemesterSelect();
    fillDegreesSemesters();
    fillModules();
    fillTypes();
    fillStates();
    fillStaff();
    fillLocations();
}
export function fillSemesterSelect() {
    var semesterSelect = /** @type {HTMLSelectElement | null} */ (document.querySelector("#semesterSelectHeader"));
    if (!semesterSelect) return;

    var semesters = fetchedData.semesters.sort((a, b) => {
        // Names: WiSe 2026/27, SoSe 2027, s24 - Stundenplan Sommersemester 2024, w23 - Stundenplan Wintersemester 2023
        // Sort by year and then by semester type (WiSe before SoSe)
        const getYear = (/** @type {string} */ name) => {
            const match = name.match(/(\d{4})/);
            return match ? parseInt(match[1]) : 0;
        };
        const getSemesterType = (/** @type {string} */ name) => {
            if (name.toLowerCase().includes("wise")) return 0; // Wintersemester
            if (name.toLowerCase().includes("sose")) return 1; // Sommersemester
            if (name.toLowerCase().includes("winter")) return 0; // Wintersemester
            if (name.toLowerCase().includes("sommer")) return 1; // Sommersemester
            return 2; // Unknown type
        };
        const yearA = getYear(a.name);
        const yearB = getYear(b.name);
        if (yearA !== yearB) return yearB - yearA; // Descending order by year
        const typeA = getSemesterType(a.name);
        const typeB = getSemesterType(b.name);
        return typeA - typeB; // Wintersemester before Sommersemester
    });
    
    var semesterHtml = "<option value=''>Alle Semester</option>";
    var i = 0;
    for (const semester of semesters) {
        if (i === 0 && filterState.semester_id === null) {
            filterState.semester_id = semester.id;
        }
        semesterHtml += '<option value="' + semester.id + '"' + (filterState.semester_id === semester.id ? " selected" : "") + '>' + semester.name + "</option>";
        i++;
    }
    semesterSelect.innerHTML = semesterHtml;

    semesterSelect.addEventListener("change", handleSemesterIdSelect);
}
/**
 * Fill the degree and semester filter sections with degrees and semesters from fetched data. Show semesters based on selected degree. If no degree is selected, hide semester filter.
 */
export function fillDegreesSemesters() {
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
export function fillModules() {
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

    const eventsForModules = getEvents();
    const moduleCountMap = new Map();
    for (const ev of eventsForModules) {
        for (const id of ev.module_ids) {
            moduleCountMap.set(id, (moduleCountMap.get(id) ?? 0) + 1);
        }
    }

    for (const module of modules) {
        if (filterState.selectedModules.has(module.id)) {
            var state = TRI.SELECTED;
        } else if (filterState.hiddenModules.has(module.id)) {
            var state = TRI.HIDDEN;
        } else {
            var state = TRI.NEUTRAL;
        }
        var count = moduleCountMap.get(module.id) ?? 0;
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
        var count = moduleCountMap.get(module.id) ?? 0;
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
export function fillTypes() {
    var types = new Set(fetchedData.events.map(el => el.type));

    var typeCon = /** @type {HTMLElement | null} */ (document.querySelector("#typeList"));
    if (!typeCon) return;
    typeCon.innerHTML = "";

    const eventsForTypes = getEvents();
    const typeCountMap = new Map();
    for (const ev of eventsForTypes) {
        typeCountMap.set(ev.type, (typeCountMap.get(ev.type) ?? 0) + 1);
    }

    for (const type of [...types].sort()) {
        if (filterState.selectedTypes.has(type)) {
            var state = TRI.SELECTED;
        } else if (filterState.hiddenTypes.has(type)) {
            var state = TRI.HIDDEN;
        } else {
            var state = TRI.NEUTRAL;
        }
        var count = typeCountMap.get(type) ?? 0;
        typeCon.appendChild(createFilterRow(type, type, state, count, handleTypeSelect, count == 0 && state == TRI.NEUTRAL));
    }

}
/**
 * Fill the state filter section with states from fetched data. Show event count for each state and disable states with no events.
 */
export function fillStates() {
    var states = fetchedData.states;

    var stateCon = /** @type {HTMLElement | null} */ (document.querySelector("#statusList"));
    if (!stateCon) return;
    stateCon.innerHTML = "";

    const eventsForStates = getEvents();
    const statusCountMap = new Map();
    for (const ev of eventsForStates) {
        statusCountMap.set(ev.status, (statusCountMap.get(ev.status) ?? 0) + 1);
    }

    for (const state of states) {
        var rowState = filterState.status[state.key] ?? TRI.NEUTRAL;
        var count = statusCountMap.get(state.key) ?? 0;
        stateCon.appendChild(createFilterRow(state.key, state.name, rowState, count, handleStateSelect, count == 0 && rowState == TRI.NEUTRAL));
    }
}
/**
 * Fill the staff filter section with staff from fetched data. Show event count for each staff and disable staff with no events. Hide staff with no events if they are not selected.
 */
export function fillStaff() {
    var staff = fetchedData.staff;

    var staffCon = /** @type {HTMLElement | null} */ (document.querySelector("#staffList"));
    if (!staffCon) return;
    staffCon.innerHTML = "";

    const eventsForStaff = getEvents();
    const staffCountMap = new Map();
    for (const ev of eventsForStaff) {
        for (const id of ev.staff_ids) {
            staffCountMap.set(id, (staffCountMap.get(id) ?? 0) + 1);
        }
    }

    for (const staffMember of staff.sort((a, b) => a.name.localeCompare(b.name))) {
        if (filterState.selectedStaff.has(staffMember.id)) {
            var state = TRI.SELECTED;
        } else if (filterState.hiddenStaff.has(staffMember.id)) {
            var state = TRI.HIDDEN;
        } else {
            var state = TRI.NEUTRAL;
        }
        var count = staffCountMap.get(staffMember.id) ?? 0;
        if (count == 0 && state == TRI.NEUTRAL) {
            continue;
        }
        staffCon.appendChild(createFilterRow(staffMember.id, staffMember.name, state, count, handleStaffSelect));
    }
}
/**
 * Fill the location filter section with locations from fetched data. Show event count for each location and disable locations with no events. Hide locations with no events if they are not selected.
 */
export function fillLocations() {
    var locations = fetchedData.locations;

    var locationCon = /** @type {HTMLElement | null} */ (document.querySelector("#locationList"));
    if (!locationCon) return;
    locationCon.innerHTML = "";

    const eventsForLocations = getEvents();
    const locationCountMap = new Map();
    for (const ev of eventsForLocations) {
        locationCountMap.set(ev.location_id, (locationCountMap.get(ev.location_id) ?? 0) + 1);
    }

    for (const location of locations.sort((a, b) => a.name.localeCompare(b.name))) {
        if (filterState.selectedLocations.has(location.id)) {
            var state = TRI.SELECTED;
        } else if (filterState.hiddenLocations.has(location.id)) {
            var state = TRI.HIDDEN;
        } else {
            var state = TRI.NEUTRAL;
        }
        var count = locationCountMap.get(location.id) ?? 0;
        if (count == 0 && state == TRI.NEUTRAL) {
            continue;
        }
        locationCon.appendChild(createFilterRow(location.id, location.name, state, count, handleLocationSelect));
    }
}

// TODO: possibly search across modules and moreModules simultaneously.
// Possible problem is the collapsed moreModules section.
/**
 * Handle module search input, filter modules based on search query and update module filter sections.
 * @param {Event} ev 
 */
export function handleModuleSearch(ev) {
    const filterList = document.querySelector("#moduleList");
    if (!filterList) return;
    const searchTerm = /** @type {HTMLInputElement} */ (ev.target).value.toLowerCase();
    const rows = filterList.querySelectorAll("div.frow");
    rows.forEach(row => {
        var filterRow = /** @type {HTMLElement | null} */ (row);
        if (!filterRow) return;
        const moduleId = parseInt(filterRow.dataset['key'] ?? "");
        if (isNaN(moduleId)) return;
        const module = fetchedData.modules.find(el => el.id == moduleId);
        if (!module) return;
        const moduleName = module.name.toLowerCase();
        const moduleNumber = module.module_number.toLowerCase();
        if (moduleName.includes(searchTerm) || moduleNumber.includes(searchTerm)) {
            filterRow.style.display = "";
        } else {
            filterRow.style.display = "none";
        }
    });
}

/**
 * Handle more module search input, filter more modules based on search query and update more module filter section.
 * @param {Event} ev 
 */
export function handleMoreModuleSearch(ev) {
    const filterList = document.querySelector("#weitereModuleList");
    if (!filterList) return;
    const searchTerm = /** @type {HTMLInputElement} */ (ev.target).value.toLowerCase();
    const rows = filterList.querySelectorAll("div.frow");
    rows.forEach(row => {
        var filterRow = /** @type {HTMLElement | null} */ (row);
        if (!filterRow) return;
        const moduleId = parseInt(filterRow.dataset['key'] ?? "");
        if (isNaN(moduleId)) return;
        const module = fetchedData.modules.find(el => el.id == moduleId);
        if (!module) return;
        const moduleName = module.name.toLowerCase();
        const moduleNumber = module.module_number.toLowerCase();
        if (moduleName.includes(searchTerm) || moduleNumber.includes(searchTerm)) {
            filterRow.style.display = "";
        } else {
            filterRow.style.display = "none";
        }
    });
}

/**
 * Handle staff search input, filter staff based on search query and update staff filter section.
 * Search over the full staff array from fetched data, not just the currently shown staff in the filter section, to also show hidden staff that match the search query.
 * Then fill the staff filter section newly based on the search query only, not based on the selected degree and semester, to also show staff that are not in the selected degree and semester but match the search query.
 * @param {Event} ev 
 */
export function handleStaffSearch(ev) {
    const staffCon = /** @type {HTMLElement | null} */ (document.querySelector("#staffList"));
    if (!staffCon) return;
    const searchTerm = /** @type {HTMLInputElement} */ (ev.target).value.toLowerCase();

    if (!searchTerm) {
        fillStaff();
        return;
    }

    staffCon.innerHTML = "";
    for (const staffMember of fetchedData.staff.sort((a, b) => a.name.localeCompare(b.name))) {
        if (!staffMember.name.toLowerCase().includes(searchTerm)) continue;
        if (filterState.selectedStaff.has(staffMember.id)) {
            var state = TRI.SELECTED;
        } else if (filterState.hiddenStaff.has(staffMember.id)) {
            var state = TRI.HIDDEN;
        } else {
            var state = TRI.NEUTRAL;
        }
        var count = getEvents().filter(el => el.staff_ids.some(id => staffMember.id == id)).length;
        staffCon.appendChild(createFilterRow(staffMember.id, staffMember.name, state, count, handleStaffSelect));
    }
}

/**
 * Handle location search input, filter locations based on search query and update location filter section.
 * Search over the full location array from fetched data, not just the currently shown locations in the filter section, to also show hidden locations that match the search query.
 * Then fill the location filter section newly based on the search query only, not based on the selected degree and semester, to also show locations that are not in the selected degree and semester but match the search query.
 * @param {Event} ev
 */
export function handleLocationSearch(ev) {
    const locationCon = /** @type {HTMLElement | null} */ (document.querySelector("#locationList"));
    if (!locationCon) return;
    const searchTerm = /** @type {HTMLInputElement} */ (ev.target).value.toLowerCase();

    if (!searchTerm) {
        fillLocations();
        return;
    }

    locationCon.innerHTML = "";
    for (const location of fetchedData.locations.sort((a, b) => a.name.localeCompare(b.name))) {
        if (!location.name.toLowerCase().includes(searchTerm)) continue;
        if (filterState.selectedLocations.has(location.id)) {
            var state = TRI.SELECTED;
        } else if (filterState.hiddenLocations.has(location.id)) {
            var state = TRI.HIDDEN;
        } else {
            var state = TRI.NEUTRAL;
        }
        var count = getEvents().filter(el => el.location_id == location.id).length;
        locationCon.appendChild(createFilterRow(location.id, location.name, state, count, handleLocationSelect));
    }
}

/**
 * Handle semester select change, update filter state and trigger update callback.
 * @param {Event} ev
 */
export function handleSemesterIdSelect(ev) {
    console.log("handleSemesterIdSelect called");
    var selected = /** @type {HTMLOptionElement | null} */ (/** @type {HTMLSelectElement} */ (ev.target).querySelector("option:checked"))?.value ?? "";
    if (!isNaN(parseInt(selected))) {
        filterState.semester_id = parseInt(selected);
    } else {
        filterState.semester_id = null;
    }

    if (updateCallback !== null) {
        updateCallback();
    }
}

/**
 * Handle degree select change, update filter state and trigger update callback.
 * @param {Event} ev 
 */
export function handleDegreeSelect(ev) {
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
export function handleSemesterSelect(ev) {
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
export function handleModuleSelect(ev) {
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
export function handleTypeSelect(ev) {
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
export function handleStateSelect(ev) {
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
export function handleStaffSelect(ev) {
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
export function handleLocationSelect(ev) {
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

/** @type {{ cacheKey: string, events: import('./api.js').Event[] | null }} */
var cachedEvents = {
    cacheKey: "",
    events: null
};

/**
 * Compute events based on selected degree, semester, modules, types, staff, locations and states.
 * Also consider hidden modules, types, staff, locations and states.
 * If there are selected states, only show events with these states.
 * @returns {import('./api.js').Event[]}
 */
export function getEvents() {
    var currentDegree = filterState.degree;
    var currentSemester = filterState.semester;
    var currentSelectedModules = [...filterState.selectedModules].sort().join(",");
    var currentHiddenModules = [...filterState.hiddenModules].sort().join(",");
    var currentSelectedTypes = [...filterState.selectedTypes].sort().join(",");
    var currentHiddenTypes = [...filterState.hiddenTypes].sort().join(",");
    var currentSelectedStaff = [...filterState.selectedStaff].sort().join(",");
    var currentHiddenStaff = [...filterState.hiddenStaff].sort().join(",");
    var currentSelectedLocations = [...filterState.selectedLocations].sort().join(",");
    var currentHiddenLocations = [...filterState.hiddenLocations].sort().join(",");
    var currentStatus = Object.entries(filterState.status).map(([key, value]) => `${key}:${value}`).sort().join(",");
    var currentPinned = [...pinnedEvents].sort().join(",");
    var cacheKey = `${currentDegree}|${currentSemester}|${currentSelectedModules}|${currentHiddenModules}|${currentSelectedTypes}|${currentHiddenTypes}|${currentSelectedStaff}|${currentHiddenStaff}|${currentSelectedLocations}|${currentHiddenLocations}|${currentStatus}|${currentPinned}`;
    
    // Check if filter has changed in a way that requires recomputing events, if not return cached events
    if (cachedEvents) {
        if (cachedEvents.cacheKey === cacheKey && cachedEvents.events !== null) {
            return cachedEvents.events;
        }
    }
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

    const modulesSet = new Set(modules);
    var result = fetchedData.events.filter(el =>
        el.module_ids.some(id => modulesSet.has(id)) &&
        filterState.status[/** @type {import('./state.js').StatusKey} */ (el.status)] !== TRI.HIDDEN &&
        !el.staff_ids.some(id => filterState.hiddenStaff.has(id)) &&
        !filterState.hiddenLocations.has(el.location_id) &&
        !filterState.hiddenTypes.has(el.type) &&

        (Object.values(filterState.status).filter(el => el == TRI.SELECTED).length > 0 ? filterState.status[/** @type {import('./state.js').StatusKey} */ (el.status)] == TRI.SELECTED : true) &&
        (filterState.selectedTypes.size > 0 ? filterState.selectedTypes.has(el.type) : true) &&
        (filterState.selectedStaff.size > 0 ? el.staff_ids.some(id => filterState.selectedStaff.has(id)) : true) &&
        (filterState.selectedLocations.size > 0 ? filterState.selectedLocations.has(el.location_id) : true)
    ).filter(el => !getHiddenEvents().some(he => he.id == el.id));
    cachedEvents = {
        cacheKey: cacheKey,
        events: result
    };
    return result;
}

/** @type {{ cacheKey: string, events: import('./api.js').Event[] | null }} */
var hiddenEventsCache = {
    cacheKey: "",
    events: null
};

/**
 * Compute hidden events based on pinned events, when they share the same module and type.
 * For example a pinned exercise would have a group name, so all events with the same module and type "exercise" would be hidden, except the pinned one.
 * @returns {import('./api.js').Event[]}
 */
export function getHiddenEvents() {
    var currentPinned = [...pinnedEvents].sort().join(",");
    var cacheKey = `${currentPinned}`;
    if (hiddenEventsCache) {
        if (hiddenEventsCache.cacheKey === cacheKey && hiddenEventsCache.events !== null) {
            return hiddenEventsCache.events;
        }
    }
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
    hiddenEventsCache = {
        cacheKey: cacheKey,
        events: hidden
    };
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
export function createFilterRow(
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
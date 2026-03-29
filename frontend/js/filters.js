import { fetchedData, filterState, nextTriState, TRI } from "./state.js"

// display filter section
export function updateFilters() {
    fillDegreesSemesters();
    fillModules();
    fillTypes();
    fillStates();
    fillStaff();
    fillLocations();
}
// fill degree and semester select
function fillDegreesSemesters() {
    var degrees = fetchedData.degrees;

    var degreeEl = document.querySelector("#degreeSelect");
    var semesterEl = document.querySelector("#semesterSelect");
    
    if (degreeEl.children.length > 1) {
        var selected = document.querySelector("#degreeSelect option:checked").value;
        if (!isNaN(parseInt(selected))) {
            // else fill with correct semesters 
            document.querySelector("#semester-filter-section").style.display = "";

            var semesters = degrees.find(el => el.id == parseInt(selected)).semesters;

            var html = "<option value=''>Alle Semester</option>";
            for (const semester of semesters) {
                html += '<option value="' + semester + '">' + semester + "</option>";
            }
            semesterEl.innerHTML = html;
            semesterEl.addEventListener("change", handleSemesterSelect);
        } else {
            // if selected el is first dont fill semesters
            document.querySelector("#semester-filter-section").style.display = "none";

            semesterEl.innerHTML = "<option value=''>Alle Semester</option>";
        }
    } else {
        // if selected el is first dont fill semesters
        document.querySelector("#semester-filter-section").style.display = "none";

        semesterEl.innerHTML = "<option value=''>Alle Semester</option>";
    }
    var html = "<option value=''>Alle Studiengänge</option>";
    for (const degree of degrees) {
        var selected = degreeEl.children.length > 1 && parseInt(document.querySelector("#degreeSelect option:checked").value) == degree.id;
        html += '<option value="' + degree.id + '"' + (selected ? " selected" : "")+ '>' + degree.name + "</option>";
    }
    degreeEl.innerHTML = html;
    degreeEl.addEventListener("change", handleDegreeSelect);
}
// fill module select based on degree
// show and fill more module select based on remaining modules
function fillModules() {
    var currentDegree = document.querySelector("#degreeSelect option:checked").value;
    console.log(parseInt(currentDegree))
    if (!isNaN(parseInt(currentDegree))) {
        var modules = fetchedData.modules.filter(el => el.degree_ids.includes(parseInt(currentDegree)));
        var moreModules = fetchedData.modules.filter(el => !modules.includes(el));;
    } else {
        var modules = fetchedData.modules;
        var moreModules = [];
    }
    console.log(modules, moreModules)

    var moduleCon = document.querySelector("#moduleList");
    moduleCon.innerHTML = "";
    var moreModuleCon = document.querySelector("#weitereModuleList");
    moreModuleCon.innerHTML = "";

    for (const module of modules) {
        moduleCon.appendChild(createFilterRow(module.id, module.name, TRI.NEUTRAL, 0, handleModuleSelect));
    }
    for (const module of moreModules) {
        moreModuleCon.appendChild(createFilterRow(module.id, module.name, TRI.NEUTRAL, 0, handleModuleSelect));
    }
    if (moreModules.length > 0) {
        document.querySelector("#weitereSection").style.display = "";
    } else {
        document.querySelector("#weitereSection").style.display = "none";
    }
}
// fill event types (+ count), disable types with count == 0
function fillTypes() {
    var types = new Set(fetchedData.events.map(el => el.type));

    var typeCon = document.querySelector("#typeList");
    typeCon.innerHTML = "";

    for (const type of [...types].sort()) {
        typeCon.appendChild(createFilterRow(type, type, TRI.NEUTRAL, 0, handleTypeSelect));
    }

}
// fill states
function fillStates() {
    var states = fetchedData.states;

    var stateCon = document.querySelector("#statusList");
    stateCon.innerHTML = "";

    for (const state of states) {
        stateCon.appendChild(createFilterRow(state.key, state.name, TRI.NEUTRAL, 0, handleStateSelect));
    }
}

// fill staff
function fillStaff() {
    var staff = fetchedData.staff;

    var staffCon = document.querySelector("#staffList");
    staffCon.innerHTML = "";

    for (const staffMember of staff.sort((a,b) => a.name.localeCompare(b.name))) {
        staffCon.appendChild(createFilterRow(staffMember.id, staffMember.name, TRI.NEUTRAL, 0, handleStaffSelect));
    }

}
// fill locations
function fillLocations() {
    var locations = fetchedData.locations;

    var locationCon = document.querySelector("#locationList");
    locationCon.innerHTML = "";

    for (const location of locations.sort((a,b) => a.name.localeCompare(b.name))) {
        locationCon.appendChild(createFilterRow(location.id, location.name, TRI.NEUTRAL, 0, handleLocationSelect));
    }

}

// search modules

// search more modules

// search staff

// search locations

// handle select of filter element (degree, semester, module, more module, type, status, staff, location)
function handleDegreeSelect(ev) {
    var selected = ev.target.querySelector("option:checked").value;
    if (!isNaN(parseInt(selected))) {
        filterState.degree = parseInt(selected);
    } else {
        filterState.degree = null;
    }
    filterState.semester = null;

    updateFilters();
}
function handleSemesterSelect(ev) {
    var selected = ev.target.querySelector("option:checked").value;
    if (!isNaN(parseInt(selected))) {
        filterState.semester = parseInt(selected);
    } else {
        filterState.semester = null;
    }

    updateFilters()
}
function handleModuleSelect(ev) {
    var filterRowEl = ev.target.closest("div.frow");
    var triStateEl = filterRowEl.querySelector("span.tri");
    var newState = triStateEl.dataset.state;
    var moduleId = filterRowEl.dataset.key;

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
    updateFilters()
}
// TODO: test with full type name or introduce seperate id for types
function handleTypeSelect(ev) {
    var filterRowEl = ev.target.closest("div.frow");
    var triStateEl = filterRowEl.querySelector("span.tri");
    var newState = triStateEl.dataset.state;
    var typeId = filterRowEl.dataset.key;

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
    updateFilters()
}
function handleStateSelect(ev) {
    console.log(ev)
}
function handleStaffSelect(ev) {
    var filterRowEl = ev.target.closest("div.frow");
    var triStateEl = filterRowEl.querySelector("span.tri");
    var newState = triStateEl.dataset.state;
    var staffId = filterRowEl.dataset.key;

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
    updateFilters()
}
function handleLocationSelect(ev) {
    var filterRowEl = ev.target.closest("div.frow");
    var triStateEl = filterRowEl.querySelector("span.tri");
    var newState = triStateEl.dataset.state;
    var locationId = filterRowEl.dataset.key;

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
    updateFilters()
}

// handle event pin

// hide unpinned events

// give events based on filters
export function getEvents() {
    return fetchedData.events;
}

// compute hidden events based on pinned events

/**
 * 
 * @param {string} key 
 * @param {string|HTMLElement} content displayed content 
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
    row.setAttribute("data-key", key);

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
    cnt.textContent = count;
    row.appendChild(cnt);

    // Click handler
    if (!disabled) {
        row.addEventListener("click", (ev) => {
            const current = row.querySelector("span.tri").dataset.state;
            const next = nextTriState(current);
            row.querySelector("span.tri").dataset.state = next;
            handler(ev);
        });
    }

    return row;
}
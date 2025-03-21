const parser = new DOMParser();
const eventTypeColor = {
    "Vorlesung": {
        "background": "#C10007",
        "text": "#fff"
    },
    "Seminar": {
        "background": "#CA3500",
        "text": "#fff"
    },
    "Übung": {
        "background": "#155DFC",
        "text": "#fff"
    },
    "Hörsaalübung": {
        "background": "#155DFC",
        "text": "fff"
    },
    "Praktikum": {
        "background": "#FDC700",
        "text": "#000"
    },
};

let modules = [
    {
        "ID": "studium/ScaDS.ADL",
        "info": {
            "ModulNr": "n.a.",
            "Planung": "fmi",
            "Umfang": [
                "Seminar 2SWS [Advanced Deep Learning]",
                "Vorlesung 2SWS [Advanced Deep Learning]"
            ],
            "Ø/max": "-/30",
            "Potentiel": "0-33",
            "Tags": null,
            "Credits": "5",
            "Sprache": "Deutsch (default)",
            "Studiengang": [
                "M.Sc. Bioinformatik 1., 3. Semester [Wahlpflichtbereich Informatik]",
                "M.Sc. Data Science 1., 3. Semester [Wahlpflichtbereich Datenanalyse]",
                "M.Sc. Informatik 1., 3. Semester [Vertiefungsmodul]"
            ],
            "cleanStudiengang": [
                "M.Sc. Bioinformatik 1., 3. Semester [Wahlpflichtbereich Informatik]",
                "M.Sc. Data Science 1., 3. Semester [Wahlpflichtbereich Datenanalyse]",
                "M.Sc. Informatik 1., 3. Semester [Vertiefungsmodul]"
            ],
            "Titel": "Advanced Deep Learning",
            "ID": "studium/ScaDS.ADL"
        },
        "events": [
            {
                "Unit": "Advanced Deep Learning",
                "Lehrkraft": "Scherf, Nico",
                "Titel": "Advanced Deep Learning - Vorlesung",
                "Zeit": {
                    "dayIndex": 1,
                    "startTime": "1899-11-28T10:15:00.000Z",
                    "endTime": "1899-11-28T11:45:00.000Z",
                    "day": "dienstags",
                    "fullDay": "dienstags",
                    "time": "11:15 - 12:45"
                },
                "Ort": "MPI für Kognitions- und Neurowissenschaften, Stephanstraße 1a, gr. Hs",
                "vorjahr/Ø/max": "- / - / 30",
                "Status": "ok",
                "LV-Typ": "praesenz",
                "Typ": "Vorlesung",
                "ID": "studium/ScaDS.ADL",
                "eventID": "studium/ScaDS.ADL#1"
            },
            {
                "Unit": "Advanced Deep Learning",
                "Lehrkraft": "Scherf, Nico",
                "Titel": "Advanced Deep Learning - Seminar",
                "Zeit": {
                    "dayIndex": 1,
                    "startTime": "1899-11-28T12:15:00.000Z",
                    "endTime": "1899-11-28T13:45:00.000Z",
                    "day": "dienstags",
                    "fullDay": "dienstags",
                    "time": "13:15 - 14:45"
                },
                "Ort": "MPI für Kognitions- und Neurowissenschaften, Stephanstraße 1a, gr. Hs",
                "vorjahr/Ø/max": "- / - / 30",
                "Status": "ok",
                "LV-Typ": "praesenz",
                "Typ": "Seminar",
                "ID": "studium/ScaDS.ADL",
                "eventID": "studium/ScaDS.ADL#2"
            }
        ]
    }
];
let events = [
    {
        "Unit": "Advanced Deep Learning",
        "Lehrkraft": "Scherf, Nico",
        "Titel": "Advanced Deep Learning - Vorlesung",
        "Zeit": {
            "dayIndex": 1,
            "startTime": "1899-11-28T10:15:00.000Z",
            "endTime": "1899-11-28T11:45:00.000Z",
            "day": "dienstags",
            "fullDay": "dienstags",
            "time": "11:15 - 12:45"
        },
        "Ort": "MPI für Kognitions- und Neurowissenschaften, Stephanstraße 1a, gr. Hs",
        "vorjahr/Ø/max": "- / - / 30",
        "Status": "ok",
        "LV-Typ": "praesenz",
        "Typ": "Vorlesung",
        "ID": "studium/ScaDS.ADL",
        "eventID": "studium/ScaDS.ADL#1"
    }
];
let selectedEvents = [];
let deselectedEvents = [];

// Service Worker
const registerServiceWorker = async () => {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("/planer/service-worker.js", {
          scope: "/planer/",
        });
        if (registration.installing) {
          console.log("Service worker installing");
        } else if (registration.waiting) {
          console.log("Service worker installed");
        } else if (registration.active) {
          console.log("Service worker active");
        }
      } catch (error) {
        console.error(`Registration failed with ${error}`);
      }
    }
  };

/**
 * Request HTML Document from Proxy Server and parse to Document Object
 * @returns {Document} Parsed HTML Document
 */
async function getHtml() {
    var html = (await (await fetch("https://casparkroll.de/planer/getHtml.php")).text());
    return parser.parseFromString(html, "text/html");
}

/**
 * Parse String of a Date to JS Date Object
 * @param {String} dateString String of Date in format: month/day/year hour:minute:second 
 * @returns {Date} Parsed Date
 */
function parseUpdateDate(dateString) {
    var [date, time] = dateString.split(" ");
    var [month, day, year] = date.split("/");
    var [hour, minute, second] = time.slice(0, -2).split(":");
    if (time.match("PM")) {
        hour += 12;
    }
    return new Date([year, month.padStart(2, "0"), day.padStart(2, "0")].join("-") + "T" + [hour.padStart(2, "0"), minute.padStart(2, "0"), second.padStart(2, "0")].join(":"));
}

/**
 * Split whole parsed HTML to useable HTML subgroups of Module data
 * @param {HTMLCollection} collection Parsed HTML from source
 * @returns {Element[][]} HTML subgroups of Module data
 */
function splitHtmlModule(collection) {
    var array = [...collection];
    var returnData = [];
    var splitIndex = -1;
    var prev = null;
    for (let index = 0; index < array.length; index++) {
        if (index == 0) {
            prev = array[index];
            continue;
        }
        if (array[index].tagName == "H2" && prev.tagName == "HR") {
            splitIndex = index;
        }
        if (array[index].tagName == "H2" && prev.tagName != "HR") {
            break;
        }
        prev = array[index];
    }
    array = array.slice(splitIndex);
    var splitIndizes = [];
    for (let i = 0; i < array.length; i++) {
        if (array[i].tagName == "A") {
            splitIndizes.push(i);
        }
    }
    var prevIndex = null;
    for (const index of splitIndizes) {
        returnData.push(array.slice(prevIndex == null ? 0 : prevIndex+2, index))
        prevIndex = index;
    }
    return returnData.map(group => group.filter(el => el.innerText.trim().length != 0));
}

/**
 * Extract and structure data from HTML subgroup of source file to a useable Module data structure
 * @param {Element[]} htmlGroup 
 * @returns {{"ID": String, "info": {"Titel": String, "ID": String, "Studiengang": String | String[]}, "events": [{"ID": String, "eventID": String, "Titel": String, "Typ": String, "Zeit": { "dayIndex": number, "startTime": Date, "endTime": Date, "day": String, "fullDay": String, "time": String}}]}} Module data structure
 */
function getModuleData(htmlGroup) {
    var ID = htmlGroup[0].querySelector("a").getAttribute("name");

    // Information
    var informationElements = htmlGroup[1].querySelectorAll("tr.row-module-info");
    var info = {};
    for (const pair of informationElements) {
        if (pair.children.length == 1) {
            info[pair.children[0].textContent.trim().slice(0,-1)] = null;
        } else {
            if (pair.children[1].innerHTML.trim().includes("<br>")) {
                info[pair.children[0].textContent.trim().slice(0,-1)] = pair.children[1].innerHTML.trim().split("<br>").map(el => parser.parseFromString(el, "text/html").body.textContent.trim());
            } else {
                info[pair.children[0].textContent.trim().slice(0,-1)] = pair.children[1].textContent.trim();
            }
        }
    }
    if (Array.isArray(info["Studiengang"])) {
        info["cleanStudiengang"] = info["Studiengang"].map(el => el.replaceAll(/\([0-9]*[0-9] Plätze\)/g, "").trim());
    } else {
        info["cleanStudiengang"] = info["Studiengang"].replaceAll(/\([0-9]*[0-9] Plätze\)/g, "").trim();
    }
    info["Titel"] = htmlGroup[0].innerText;
    info["ID"] = ID;
    // console.log(info);

    // Events
    var events = [];
    var rows = htmlGroup[2].querySelectorAll("tr[align=center]")
    var headers = [...rows[0].querySelectorAll("th")].map(el => el.textContent);
    for (let i = 1; i < rows.length; i++) {
        var row = rows[i];
        var cols = row.querySelectorAll("td");
        var data = {};
        for (let j = 0; j < headers.length; j++) {
            if (cols[j].innerHTML.includes("<br>") && cols[j].innerHTML.split("<br>").filter(el => el.trim().length != 0).length > 1) {
                data[headers[j]] = cols[j].innerHTML.split("<br>").map(el => parser.parseFromString(el, "text/html").body.textContent).filter(el => el.trim().length != 0);
            } else {
                data[headers[j]] = cols[j].textContent;
            }
        }
        if (Array.isArray(data["Zeit"]) && data["Zeit"].length >= 2) {
            var startTime = data["Zeit"][1].split(" - ")[0];
            var endTime = data["Zeit"][1].split(" - ")[1];
            data["Zeit"] = {
                dayIndex: ["montags", "dienstags", "mittwochs", "donnerstags", "freitags", "samstags", "sonntags"].indexOf(data["Zeit"][0].split(" ")[0]),
                startTime: new Date(0,0,0, startTime.split(":")[0], startTime.split(":")[1]),
                endTime: new Date(0,0,0, endTime.split(":")[0], endTime.split(":")[1]),
                day: data["Zeit"][0].split(" ")[0],
                fullDay: data["Zeit"][0],
                time: data["Zeit"][1]
            };
            if (["montags", "dienstags", "mittwochs", "donnerstags", "freitags", "samstags", "sonntags"].includes(data["Zeit"]["day"])) {
                data["Zeit"]["startTime"].setDate((["montags", "dienstags", "mittwochs", "donnerstags", "freitags", "samstags", "sonntags"].indexOf(data["Zeit"]["day"]) - 3));
                data["Zeit"]["endTime"].setDate((["montags", "dienstags", "mittwochs", "donnerstags", "freitags", "samstags", "sonntags"].indexOf(data["Zeit"]["day"]) - 3));
            }
        }
        data["Typ"] = data["Titel"].split(",")[0].split(" - ")[1];
        data["Typ"] = (data["Typ"] === undefined ? "" : data["Typ"]);
        data["ID"] = ID;
        data["eventID"] = ID + "#" + i;
        events.push(data);
    }
    // console.log(events);

    return {
        "ID": ID,
        "info": info,
        "events": events
    };
}

/**
 * Convert the event data structure to be useable by FullCalender.io
 * @param {[{"ID": String, "eventID": String, "Titel": String, "Typ": String, "Zeit": { "dayIndex": number, "startTime": Date, "endTime": Date, "day": String, "fullDay": String, "time": String}}]} events Array of source events
 * @returns {{
 *       "title": String,
 *       "start": Date,
 *       "end": Date,
 *       "url": String,
 *       "backgroundColor": String,
 *       "borderColor": String,
 *       "textColor": String,
 *       "extendedProps": {}
 *   }} Converted data structure 
 */
function parseEvents(events) {
    return events.map(el => {return {
        title: el["Titel"],
        start: el["Zeit"].startTime,
        end: el["Zeit"].endTime,
        // url: el["Typ"],
        backgroundColor: (eventTypeColor[el["Typ"]] === undefined ? "#EC003F" : eventTypeColor[el["Typ"]]["background"]),
        borderColor: (eventTypeColor[el["Typ"]] === undefined ? "#EC003F" : eventTypeColor[el["Typ"]]["background"]),
        textColor: (eventTypeColor[el["Typ"]] === undefined ? "#fff" : eventTypeColor[el["Typ"]]["text"]),
        extendedProps: el
    }})
}

/**
 * Filter a List of Modules based on Course Name and Semester selection and return filtered IDs.
 * A empty parameter returns all Courses or Semester IDs
 * @param {*} modules All Modules with IDs
 * @param {String} course Name of Course
 * @param {String} option Semester selection
 * @returns {String[]} Filtered IDs of Modules
 */
function filterEventsByCourse(modules, course, option) {
    var IDs = modules.map(el => el.info).filter(el => {
        if (Array.isArray(el.Studiengang)) {
            return el.Studiengang.filter(el => el.includes(course) && el.includes(option)).length > 0;
        } else {
            return el.Studiengang.includes(course) && el.Studiengang.includes(option);
        }
    }).map(el => el.ID);
    console.log(IDs);

    return IDs;
}

/**
 * Get intersection of two arrays
 * @param {*[]} array1 
 * @param {*[]} array2 
 * @returns {*[]}
 */
function intersection(array1, array2) {
    return array1.filter(value => array2.includes(value));
}

function filterIDsHTML() {
    // Type
    var typeIDs = [];
    for (const element of document.querySelectorAll("#typeoptions input")) {
        if (element.checked) {
            typeIDs = typeIDs.concat(events.filter(el => el["Typ"] == element.value).map(el => el.eventID));
        }
    }

    // State
    var stateIDs = [];
    for (const element of document.querySelectorAll("#stateoptions input")) {
        if (element.checked) {
            stateIDs = stateIDs.concat(events.filter(el => el["Status"] == element.value).map(el => el.eventID));
        }
    }

    // Person
    var personIDs = [];
    for (const element of document.querySelectorAll("#personoptions input")) {
        if (element.checked) {
            personIDs = personIDs.concat(events.filter(el => {
                if (Array.isArray(el["Lehrkraft"])) {
                    return el["Lehrkraft"].filter(el2 => el2 == element.value).length > 0
                } else {
                    return el["Lehrkraft"] == element.value
                }
            }).map(el => el.eventID));
        }
    }

    // Modules
    var modulesIDs = [];
    for (const element of document.querySelectorAll("#moduleoptions input")) {
        if (element.checked) {
            modulesIDs = modulesIDs.concat(events.filter(el => el["ID"] == element.value).map(el => el.eventID));
        }
    }

    // Course
    var courseIDs = [];
    var courseOptions = [];
    for (const element of document.querySelectorAll("#courseoptions input.topCourse")) {
        if (element.checked) {
            courseOptions.push(element.value.split("-"))
        } else {
            for (const input of document.getElementsByClassName(element.value + "option")) {
                if (input.checked) {
                    courseOptions.push(input.value.split("-"))
                }
            }
        }
    }
    var moduleIDs = courseOptions.map(([course, option]) =>
        modules.map(module => module.info).filter(el => {
            if (Array.isArray(el.cleanStudiengang)) {
                return el.cleanStudiengang.filter(el2 => (el2.includes(course) && el2.includes(option))).length > 0;
            } else {
                return el.cleanStudiengang.includes(course) && el.cleanStudiengang.includes(option);
            }
        }).map(el => el.ID)
    ).flat();
    moduleIDs = [...new Set(moduleIDs)];
    courseIDs = events.filter(el => moduleIDs.includes(el.ID)).map(el => el.eventID);

    // console.log([...new Set(typeIDs)], [...new Set(stateIDs)], [...new Set(personIDs)], [...new Set(courseIDs)])
    // console.log([...new Set(typeIDs)].length, [...new Set(stateIDs)].length, [...new Set(personIDs)].length, [...new Set(courseIDs)].length)
    return intersection([...new Set(typeIDs)], intersection([...new Set(stateIDs)], intersection([...new Set(personIDs)], intersection([...new Set(modulesIDs)], [...new Set(courseIDs)]))));
}

function filterIDsSelected(filteredIDs) {
    var results = events.filter(el => filteredIDs.includes(el.eventID));
    for (const event of selectedEvents) {
        results = results.filter(el => !(el.ID == event.ID && el.Typ == event.Typ) || el.eventID == event.eventID);
    }
    for (const event of deselectedEvents) {
        results = results.filter(el => el.eventID !== event.eventID);
    }
    return results.map(el => el.eventID);
}

function displayEventDetails(event) {
    document.querySelector("#info_con").classList.replace("hidden", "shown");
    document.querySelector("#info_con .event #title").innerHTML = event.Titel;
    document.querySelector("#info_con .event #state").innerHTML = event.Status;
    document.querySelector("#info_con .event #location").innerHTML = "Ort: " + event.Ort;
    document.querySelector("#info_con .event #location-type").innerHTML = event["LV-Typ"];
    document.querySelector("#info_con .event#time").innerHTML = "Tag: " + event.Zeit.fullDay;
    document.querySelector("#info_con .event#day").innerHTML = "Uhrzet: " + event.Zeit.time;
    document.querySelector("#info_con .event#person").innerHTML = "Lehrkraft: " + (Array.isArray(event.Lehrkraft) ? event.Lehrkraft.join("; ") : event.Lehrkraft);
    var module = modules.filter(el => el.info.ID == event.ID)[0].info;
    document.querySelector("#info_con .module#title").innerHTML = "Titel: " + module.Titel;
    document.querySelector("#info_con .module#id").innerHTML = "ModulNr: " + module.ModulNr;
    document.querySelector("#info_con .module#credits").innerHTML = module.Credits + " Credits";
    document.querySelector("#info_con .module#language").innerHTML = "Sprache: " + module.Sprache;
    document.querySelector("#info_con .module#courses").innerHTML = "<li>" + (Array.isArray(module.Studiengang) ? module.Studiengang.join("</li><li>") : module.Studiengang) + "</li>";
    document.querySelector("#info_con .module#requirements").innerHTML = "<li>" + (Array.isArray(module.Umfang) ? module.Umfang.join("</li><li>") : module.Umfang) + "</li>";
    var events = modules.filter(el => el.info.ID == event.ID)[0].events;
    console.log(events);
    document.querySelector("#info_con table.events tbody").innerHTML = "";
    for (const even of events) {
        document.querySelector("#info_con table.events tbody").innerHTML += '<tr>' +
            '<td>' + even.Titel + ' <span class="rounded p-1 bg-accent2 text-black text-[10px] ms-2">' + even.Status + '</span></td>' +
            '<td>' + even.Zeit.fullDay + '</td>' +
            '<td>' + even.Zeit.time + '</td>' +
            '<td>' + even.Ort + '</td>' +
            '<td>' + (Array.isArray(even.Lehrkraft) ? even.Lehrkraft.join("; ") : even.Lehrkraft) + '</td>'+
        '</tr>';
    }
    document.querySelector("#info_con button#select-btn").dataset.id = event.eventID;
}

/**
 * 
 * @param {{"Unit": String, "Lehrkraft": String, "Titel": String, "Zeit": { "dayIndex": Number, "startTime": Date, "endTime": Date, "day": String "fullDay": String, "time": String }, "Ort": String, "vorjahr/Ø/max": String, "Status": String, "LV-Typ": String, "Typ": String, "ID": String, "eventID": String }} event 
 */
function selectEvent(event) {
    console.log(event);
    console.log(events.filter(el => el.ID == event.ID && el.Typ == event.Typ));
}

/**
 * Render to Timetable to HTML using FullCalendar.io
 * @param {[{"ID": String, "eventID": String, "Titel": String, "Typ": String, "Zeit": { "dayIndex": number, "startTime": Date, "endTime": Date, "day": String, "fullDay": String, "time": String}}]} events All Events
 * @param {String[]} IDs List of Event/Module IDs to filter by
 */
function renderCal(events, IDs) {
    var calendar = new FullCalendar.Calendar(document.querySelector("#calendar"), {
        dayHeaderFormat: { weekday: 'short' },
        firstDay: 1,
        weekends: false,
        slotMinTime: "07:00:00",
        slotMaxTime: "21:00:00",
        expandRows: true,
        slotEventOverlap: false,
        allDaySlot: false,
        nowIndicator: false,
        initialView: 'timeGridWeek',
        locale: "de",
        initialDate: "1899-11-31",
        weekNumbers: false,
        headerToolbar: {
            left: 'prev,next',
            center: '',
            right: 'timeGridWeek,timeGridDay,listWeek'
        },
        navLinks: false, // can click day/week names to navigate views
        editable: false,
        dayMaxEvents: true, // allow "more" link when too many events
        events: parseEvents(events.filter(el => IDs.includes(el.eventID))),
        // eventContent: "Test",
        eventClick: (args) => displayEventDetails(args.event.extendedProps)
    });
    calendar.render();
}

registerServiceWorker();

getHtml().then((html) => {
    document.querySelector("#title").innerText = html.querySelector("h1").innerText;
    document.querySelector("#updateTimestamp").innerText = "Letzte Aktualisierung durch Fakultät: " + parseUpdateDate(html.querySelector("p").innerText.split("Aktualisierung")[1].trim()).toLocaleString("de-DE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });

    var splitHtml = splitHtmlModule(html.body.children);
    modules = splitHtml.map(el => getModuleData(el));
    events = modules.map(el => el.events).flat();
    console.log(modules);
    console.log(events);

    // var dayEvents = [];
    // for (const event of events) {
    //     if (dayEvents[event.Zeit.dayIndex] === undefined) {
    //         dayEvents[event.Zeit.dayIndex] = [];
    //     }
    //     dayEvents[event.Zeit.dayIndex].push(event);
    // } 
    // console.log(dayEvents.slice(0,5))

    // Starting time
    // console.log([...new Set(dayEvents.slice(0,5).flat().map(el => el["Zeit"].startTime.toLocaleTimeString("de-DE")))].sort())
    
    // document.querySelector("#debug").innerHTML = splitHtml[0].map(el => el.outerHTML).join("");

    renderCal(events, events.map(el => el.eventID));
    
    // Event Types
    var allEventTypes = [...new Set(events.map(el => el["Typ"]))].filter(el => el.trim().length != 0);
    for (const type of allEventTypes.sort()) {
        document.querySelector("#typeoptions").innerHTML += '<div><input type="checkbox" name="type" value="' + type + '" id="' + type + '" checked><label for="' + type + '">' + type + '</label></div>';
    }
    document.querySelector("#typeoptions").innerHTML += '<div><input type="checkbox" name="type" value="" id="noState" checked><label for="noState">Kein Typ angegeben</label></div>';
    
    // Event State
    var allEventStates = {
        "ok": "Veranstaltung wurde bestätigt, Termin und Dozent steht fest.",
        "pok": "Veranstaltung wurde bestätigt, Dozent steht fest, Termin nicht.",
        "tok": "Veranstaltung wurde bestätigt, Termin steht fest, Dozent nicht.",
        "alt": "Veranstaltung wurde aus dem letzten Semester übernommen und noch nicht bestätigt.",
        "reserve": "Veranstaltung wird in diesem Semester <strong>nicht</strong> angeboten"
    };
    for (const state of Object.keys(allEventStates)) {
        document.querySelector("#stateoptions").innerHTML += '<div><input type="checkbox" name="state" value="' + state + '" id="' + state + '" checked><label for="' + state + '">(' + state + ") " + allEventStates[state] + '</label></div>';
    }
    
    // Event Person
    var allEventPersons = [...new Set(events.map(el => el["Lehrkraft"]).flat())].filter(el => el.trim().length != 0);
    for (const person of allEventPersons.sort()) {
        document.querySelector("#personoptions").innerHTML += '<div><input type="checkbox" name="person" value="' + person + '" id="' + person + '" checked><label for="' + person + '">' + person + '</label></div>';
    }
    document.querySelector("#personoptions").innerHTML += '<div><input type="checkbox" name="person" value="" id="noPerson" checked><label for="noPerson">Keine Lehrkraft angegeben</label></div>';
    
    // Modules
    var allModules = modules.map(el => el.info).filter((el, i, arr) => i === arr.findIndex((el2) => el2["ID"] == el["ID"])).filter(el => el["Titel"].trim().length > 0);
    for (const module of allModules.sort((a,b) => a["Titel"].localeCompare(b["Titel"]))) {
        document.querySelector("#moduleoptions").innerHTML += '<div><input type="checkbox" name="module" value="' + module["ID"] + '" id="' + module["ID"] + '" checked><label for="' + module["ID"] + '">' + module["Titel"] + " (" + module["ModulNr"] + ')</label></div>';
    }

    // Courses and Course Options
    var allCoursesOptions = [...new Set(modules.map(el => el.info.Studiengang).flat().map(el => el.replace(/Semester.*/, "Semester").replace(/\s*\(?[0-9]?[0-9]\sPlätze\)?/, "").replace(/\[.*\]:.*/, "")).filter(el => el.trim().length != 0))];
    var allCourses = [...new Set(allCoursesOptions.map(el => el.slice(0, (el.search(/[0-9]\./) != -1 ? el.search(/[0-9]\./) : el.length)).trim()))];
    var structuredAllCoursesOptions = {};
    for (const course of allCourses) {
        structuredAllCoursesOptions[course] = [... new Set(allCoursesOptions.filter(el => el.includes(course)).map(el => el.replace(course, "")).map(el => [...el.matchAll(/[0-9]/g)].map(el => el[0])).flat())];
    }

    for (const course of allCourses.sort()) {
        var html = '<div class="topCourse-con"><div><input type="checkbox" class="topCourse" name="course" value="' + course + '-" id="' + course + '" checked><label for="' + course + '">' + course + '</label></div><div>';
        for (const option of structuredAllCoursesOptions[course].sort()) {
            html += '<div><input type="checkbox" class="' + course + '-option courseOption" name="course" value="' + course + "-" + option + '" id="' + course + "-" + option + '" checked><label for="' + course + "-" + option + '">' + option + '. Semester</label></div>';
        }
        document.querySelector("#courseoptions").innerHTML += html + '</div></div>'
    }
    document.querySelector("#courseoptions").innerHTML += '<div><input type="checkbox" name="course" value="" id="noCourse" disabled><label for="noCourse">Kein Studiengang angegeben (nicht auswählbar)</label></div>';
    // for (const element of document.querySelectorAll("input")) {
    //     element.addEventListener("change", () => {
    //         var [course, option] = document.querySelector("input:checked").value.split("-");
    //         renderCal(events, filterEventsByCourse(modules, course, option));
    //     })
    // }

    for (const element of document.querySelectorAll("input")) {
        element.addEventListener("change", () => {
            if (element.classList.contains("topCourse")) {
                for (const input of document.getElementsByClassName(element.value + "option")) {
                    input.checked = element.checked;
                }
            }
            if (element.classList.contains("courseOption")) {
                if (!element.checked) {
                    document.getElementById(element.value.split("-")[0]).checked = false;
                } else if ([...document.getElementsByClassName(element.value.split("-")[0] + "-option")].filter(el => el.checked).length == [...document.getElementsByClassName(element.value.split("-")[0] + "-option")].length) {
                    document.getElementById(element.value.split("-")[0]).checked = true;
                }
            }
            renderCal(events, filterIDsSelected(filterIDsHTML()));
        })
    }

    for (const element of document.querySelectorAll("button.btnAll")) {
        element.addEventListener("click", () => {
            for (const input of document.querySelectorAll("#" + element.dataset.conId + " input:not([disabled])")) {
                input.checked = true;
            }
            renderCal(events, filterIDsSelected(filterIDsHTML()));
        }) 
    }
    for (const element of document.querySelectorAll("button.btnNone")) {
        element.addEventListener("click", () => {
            for (const input of document.querySelectorAll("#" + element.dataset.conId + " input:not([disabled])")) {
                input.checked = false;
            }
            renderCal(events, filterIDsSelected(filterIDsHTML()));
        }) 
    }

    document.querySelector("#info_con button#select-btn").addEventListener("click", () => {
        selectedEvents.push(events.filter(el => el.eventID == document.querySelector("#info_con button#select-btn").dataset.id)[0]);
        renderCal(events, filterIDsSelected(filterIDsHTML()));
        document.querySelector("#info_con").classList.add("hidden");
    })
    document.querySelector("#info_con button#deselect-btn").addEventListener("click", () => {
        deselectedEvents.push(events.filter(el => el.eventID == document.querySelector("#info_con button#select-btn").dataset.id)[0]);
        renderCal(events, filterIDsSelected(filterIDsHTML()));
        document.querySelector("#info_con").classList.add("hidden");
    })
})
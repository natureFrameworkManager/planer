import { getContrastTextColor, getEventColor } from "./color.js";
import { getEvents } from "./filters.js";
import { fetchedData, pinnedEvents, view } from "./state.js";

// render cal
let calendarInstance = null;
let updateCalendarCallback = null;
let openEventPopupCallback = null;

export function setCalendarUpdateCallback(func) {
    updateCalendarCallback = func;
}
export function setOpenPopupCallback(func) {
    openEventPopupCallback = func;
}

function getCalendar() {
    return calendarInstance;
}

export function initCalendar() {
    const calEl = document.getElementById("calendar");
    if (!calEl) return;

    calendarInstance = new FullCalendar.Calendar(calEl, {
        initialView: view.value || "timeGridWeek",
        locale: "de",
        headerToolbar: false, // We use our own header controls
        allDaySlot: false,
        slotMinTime: "07:00:00",
        slotMaxTime: "21:00:00",
        slotDuration: "00:30:00",
        slotLabelInterval: "01:00:00",
        expandRows: true,
        slotEventOverlap: false,
        hiddenDays: [0, 6], // hide Sun/Sat
        dayHeaderFormat: { weekday: "short" },
        // Generic week: use a fixed Monday. Events use daysOfWeek for recurring.
        initialDate: getFixedMonday(),
        navLinks: false,
        weekNumbers: false,
        nowIndicator: false,
        events: buildCalendarEvents(getEvents()),
        eventContent: renderEventContent,
        eventClick: handleEventClick,
        height: "100%",
        stickyHeaderDates: true,
        // List view settings
        listDayFormat: { weekday: "long" },
        listDaySideFormat: false,
        noEventsContent: "Keine Veranstaltungen sichtbar",
    });

    calendarInstance.render();

    document.querySelectorAll(".vbtn").forEach(el => el.addEventListener("click", () => {
        var viewType = el.dataset.view;
        document.querySelectorAll(".vbtn").forEach(el => el.classList.remove("active"));
        el.classList.add("active");
        switch (viewType) {
            case "week":
                changeCalendarView("timeGridWeek");
                break;
            case "day":
                changeCalendarView("timeGridDay");
                break;
            case "list":
                changeCalendarView("listWeek");
                break;
        }
    }));
}

// render events
/**
 * @param {Object} arg - FullCalendar event render argument
 * @param {Object} arg.event - FullCalendar event object
 * @param {string} arg.event.id - String event ID
 * @param {string} arg.event.title - Event title
 * @param {Object} arg.event.extendedProps - Custom event properties
 * @param {Object} arg.event.extendedProps.eventData - Event
 * @param {boolean} arg.event.extendedProps.isPinned - Event
 * @param {boolean} arg.event.extendedProps.isExcluded - Event
 * @param {string} arg.event.extendedProps.color - Event color
 * @param {string} arg.event.extendedProps.statusColor - Event status color
 * @param {string[]} arg.event.extendedProps.moduleNames - Event modules
 * @param {string} arg.event.extendedProps.typeShort - Event short type
 * @returns {{ domNodes: HTMLElement[] }}
 */
function renderEventContent(arg) {
    const props = arg.event.extendedProps;
    const color = props.color;

    // Set CSS variable for color on the element
    const el = document.createElement("div");
    el.style.setProperty("--ev-background", color);
    el.style.setProperty("--ev-color", getContrastTextColor(color));
    el.className = "fc-event-main-frame";

    // Title
    const titleEl = document.createElement("div");
    titleEl.className = "ev-title";
    titleEl.textContent = `${props.typeShort} ${arg.event.title}`;
    el.appendChild(titleEl);

    // Module name
    if (props.moduleNames.length > 0) {
        const metaEl = document.createElement("div");
        metaEl.className = "ev-meta";
        metaEl.textContent = props.moduleNames[0];
        el.appendChild(metaEl);
    }

    // Status dot
    const dotEl = document.createElement("span");
    dotEl.className = "sdot";
    dotEl.style.background = props.statusColor;
    el.appendChild(dotEl);

    // Pin icon
    const pinEl = document.createElement("span");
    pinEl.className = "ev-pin-icon material-icons-round";
    pinEl.textContent = "push_pin";
    pinEl.addEventListener("click", (e) => {
        e.stopPropagation();
        const evId = Number(arg.event.id);
        if (onPinToggle) onPinToggle(evId);
    });
    el.appendChild(pinEl);

    // Apply color to parent event element
    requestAnimationFrame(() => {
        const fcEl = el.closest(".fc-event");
        if (fcEl) {
            fcEl.style.setProperty("--ev-background", color);
            fcEl.style.setProperty("--ev-color", getContrastTextColor(color));
        }
    });

    return { domNodes: [el] };
}

// forward event click
function handleEventClick(info) {
    info.jsEvent.preventDefault();
    const evId = Number(info.event.id);
    if (openEventPopupCallback) openEventPopupCallback(evId);
}

// handle view change
export function changeCalendarView(viewName) {
    if (!calendarInstance) return;
    calendarInstance.changeView(viewName);
    view.value = viewName;
}

// handle day view day change


// Get a non-date-specific Monday for the generic week
function getFixedMonday() {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

// display
function buildCalendarEvents(events) {
    const fcEvents = [];

    for (const ev of events) {
        const color = getEventColor(ev) || "#3B82F6";
        const fcDay = ev.weekday % 7; //1: 1 [Monday], 2: 2 [Tuesday], ..., 6: 6 [Saturday], 7: 0 [Sunday] 

        var isPinned = pinnedEvents.has(ev.id);

        // Get module names for display
        const moduleNames = ev.module_ids
            .map((moduleId) => fetchedData.modules.find(el => el.id == moduleId).name)
            .filter(Boolean);

        // Status color
        const statusColor = /* STATUS_COLORS[ev.status] || */ "#6b7280";

        fcEvents.push({
            id: String(ev.id),
            title: ev.title,
            daysOfWeek: [fcDay],
            startTime: ev.start_time,
            endTime: ev.end_time,
            extendedProps: {
                eventData: ev,
                color,
                statusColor,
                moduleNames,
                typeShort: /* TYPE_SHORT[ev.type] || */ "?",
            },
            display: "auto",
            classNames: [
                isPinned ? "pinned" : "",
                /* isExcluded ? "excluded" : "", */
            ].filter(Boolean),
        });
    }

    return fcEvents;
}

// refresh calendar
export function updateCalendar() {
    var events = getEvents();
    if (!calendarInstance) return;
    calendarInstance.removeAllEvents();
    console.log(events);
    const calEvents = buildCalendarEvents(events);
    calendarInstance.addEventSource(calEvents);
}

function onPinToggle(eventId) {
    if (pinnedEvents.has(eventId)) {
        pinnedEvents.delete(eventId)
    } else {
        pinnedEvents.add(eventId);
    }
    if (updateCalendarCallback !== null) {
        updateCalendarCallback();
    }
}
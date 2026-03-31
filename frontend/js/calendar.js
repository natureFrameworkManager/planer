// @ts-check
import { getContrastTextColor, getEventColor } from "./color.js";
import { getEvents } from "./filters.js";
import { fetchedData, pinnedEvents, view } from "./state.js";

/** @typedef {import('@fullcalendar/core').Calendar} fullCalendar */

// render cal
let calendarInstance = /** @type {fullCalendar | null} */ (null);
let updateCalendarCallback = /** @type {(() => void) | null} */ (null);
let openEventPopupCallback = /** @type {((eventId: number) => void) | null} */ (null);

/**
 * Set callback for when calendar needs to be updated (e.g. after pin toggle)
 * @param {(() => void)} func 
 */
export function setCalendarUpdateCallback(func) {
    updateCalendarCallback = func;
}
/**
 * Set callback for when an event is clicked to open the popup
 * @param {(eventId: number) => void} func 
 */
export function setOpenPopupCallback(func) {
    openEventPopupCallback = func;
}

/**
 * Get the FullCalendar instance
 * @returns {fullCalendar | null}
 */
export function getCalendar() {
    return calendarInstance;
}

/**
 * Initialize the FullCalendar instance
 * @returns {void}
 */
export function initCalendar() {
    const calEl = document.getElementById("calendar");
    if (!calEl) return;

    calendarInstance = new FullCalendar.Calendar(calEl, {
        initialView: view.value || "timeGridWeek", // Initial view
        locale: "de", // German locale
        headerToolbar: false, // We use our own header controls
        allDaySlot: false, // No all-day events
        slotMinTime: "07:00:00", // Start time for calendar (7am)
        slotMaxTime: "21:00:00", // End time for calendar (9pm)
        slotDuration: "00:30:00", // Duration of each time slot
        slotLabelInterval: "01:00:00", // Interval for time labels
        expandRows: true, // Expand rows to fill available height
        slotEventOverlap: false, // Prevent events from overlapping
        hiddenDays: [0, 6], // hide Sun/Sat
        dayHeaderFormat: { weekday: "short" }, // e.g. "Mo", "Di", etc.
        initialDate: getFixedMonday(), // Generic week: use a fixed Monday. Events use daysOfWeek for recurring.
        navLinks: false, // Disable built-in navigation (we have our own controls)
        weekNumbers: false, // No week numbers
        nowIndicator: false, // No current time indicator
        events: buildCalendarEvents(getEvents()), // Initial events based on current filters
        eventContent: renderEventContent, // Custom render function for events
        eventClick: handleEventClick, // Handle event clicks to open popup
        height: "100%", // Make calendar take full height of container
        stickyHeaderDates: true, // Keep day headers visible when scrolling
        listDayFormat: { weekday: "long" }, // Format for list view day headers
        listDaySideFormat: false, // No side format for list view days
        noEventsContent: "Keine Veranstaltungen sichtbar", // Message when no events are visible
    });

    calendarInstance?.render();

    // Set up view toggle buttons
    document.querySelectorAll(".vbtn").forEach((el) => el.addEventListener("click", () => {
        var viewType = ( /** @type {HTMLElement} */(el)).dataset["view"];
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

/**
 * Custom render function for calendar events
 * @param {Object} arg - FullCalendar event render argument
 * @param {Object} arg.event - FullCalendar event object
 * @param {string} arg.event.id - String event ID
 * @param {string} arg.event.title - Event title
 * @param {Object} arg.event.extendedProps - Custom event properties
 * @param {Object} arg.event.extendedProps.eventData - Event data from API
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
        const fcEl = /** @type {HTMLElement | null} */ (el.closest(".fc-event"));
        if (fcEl) {
            fcEl.style.setProperty("--ev-background", color);
            fcEl.style.setProperty("--ev-color", getContrastTextColor(color));
        }
    });

    return { domNodes: [el] };
}

/**
 * Handle event click to open popup
 * @param {Object} info - FullCalendar event click info
 * @param {Object} info.event - Clicked event object
 * @param {string} info.event.id - String event ID
 * @param {MouseEvent} info.jsEvent - Original click event
 */
function handleEventClick(info) {
    info.jsEvent.preventDefault();
    const evId = Number(info.event.id);
    if (openEventPopupCallback) openEventPopupCallback(evId);
}

/**
 * Handle calendar view change
 * @param {string} viewName 
 * @returns {void}
 */
export function changeCalendarView(viewName) {
    if (!calendarInstance) return;
    calendarInstance.changeView(viewName);
    view.value = viewName;
}

// TODO: handle day view day change


/** 
 * Get a fixed Monday date for consistent calendar rendering
 * @returns {Date}
 */
function getFixedMonday() {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

/**
 * Build FullCalendar event objects from our event data
 * @param {import("./api").Event[]} events 
 * @returns {Object[]}
 */
function buildCalendarEvents(events) {
    const fcEvents = [];

    for (const ev of events) {
        const color = getEventColor(ev) || "#3B82F6";
        const fcDay = ev.weekday % 7; //1: 1 [Monday], 2: 2 [Tuesday], ..., 6: 6 [Saturday], 7: 0 [Sunday] 

        var isPinned = pinnedEvents.has(ev.id);

        // Get module names for display
        const moduleNames = ev.module_ids
            .map((moduleId) => fetchedData.modules.find(el => el.id == moduleId)?.name)
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

/** 
 * Update calendar events based on current filters and pinned status
 * @returns {void}
 */
export function updateCalendar() {
    // Query filtered events
    var events = getEvents();
    // Exit early if calendar is not initialized
    if (!calendarInstance) return;
    // Remove all existing events and add updated events
    calendarInstance.removeAllEvents();
    const calEvents = buildCalendarEvents(events);
    calendarInstance.addEventSource(calEvents);
}

/**
 * Handle pin toggle for an event
 * @param {number} eventId 
 */
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
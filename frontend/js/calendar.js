// js/calendar.js — FullCalendar setup + event rendering

import {
    sel, data, maps, visibleEventIds, excludedEventIds,
    getEventColor, WEEKDAY_MAP, WEEKDAY_SHORT,
    TYPE_SHORT, STATUS_COLORS, saveState,
} from './state.js';

// Callbacks set by app.js to avoid circular imports
let _onPinToggle = null;
let _openEventPopup = null;

export function setCalendarCallbacks(onPin, openPopup) {
    _onPinToggle = onPin;
    _openEventPopup = openPopup;
}

let calendarInstance = null;

export function getCalendar() {
    return calendarInstance;
}

export function initCalendar() {
    const calEl = document.getElementById('calendar');
    if (!calEl) return;

    calendarInstance = new FullCalendar.Calendar(calEl, {
        initialView: sel.currentView || 'timeGridWeek',
        locale: 'de',
        headerToolbar: false, // We use our own header controls
        allDaySlot: false,
        slotMinTime: '07:00:00',
        slotMaxTime: '21:00:00',
        slotDuration: '00:30:00',
        slotLabelInterval: '01:00:00',
        expandRows: true,
        hiddenDays: [0, 6], // hide Sun/Sat
        dayHeaderFormat: { weekday: 'short' },
        // Generic week: use a fixed Monday. Events use daysOfWeek for recurring.
        initialDate: getFixedMonday(),
        navLinks: false,
        weekNumbers: false,
        nowIndicator: false,
        events: buildCalendarEvents(),
        eventContent: renderEventContent,
        eventClick: handleEventClick,
        height: '100%',
        stickyHeaderDates: true,
        // List view settings
        listDayFormat: { weekday: 'long' },
        listDaySideFormat: false,
        noEventsContent: 'Keine Veranstaltungen sichtbar',
    });

    calendarInstance.render();
}

// Get a non-date-specific Monday for the generic week
function getFixedMonday() {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

export function buildCalendarEvents() {
    const fcEvents = [];

    for (const ev of data.events) {
        const isVisible = visibleEventIds.has(ev.id);
        const isPinned = sel.pinnedEventIds.has(ev.id);
        const isExcluded = excludedEventIds.has(ev.id);

        if (!isVisible && !isExcluded) continue;

        const color = getEventColor(ev);
        const fcDay = WEEKDAY_MAP[ev.weekday];
        if (fcDay === undefined) continue;

        // Get module names for display
        const moduleNames = ev.module_ids
            .map(mid => maps.moduleById.get(mid)?.name)
            .filter(Boolean);

        // Status color
        const statusColor = STATUS_COLORS[ev.status] || '#6b7280';

        fcEvents.push({
            id: String(ev.id),
            title: ev.title,
            daysOfWeek: [fcDay],
            startTime: ev.start_time,
            endTime: ev.end_time,
            extendedProps: {
                eventData: ev,
                isPinned,
                isExcluded,
                color,
                statusColor,
                moduleNames,
                typeShort: TYPE_SHORT[ev.type] || '?',
            },
            display: isExcluded ? 'auto' : 'auto',
            classNames: [
                isPinned ? 'pinned' : '',
                isExcluded ? 'excluded' : '',
            ].filter(Boolean),
        });
    }

    return fcEvents;
}

function renderEventContent(arg) {
    const props = arg.event.extendedProps;
    const color = props.color;

    // Set CSS variable for color on the element
    const el = document.createElement('div');
    el.style.setProperty('--ev-color', color);
    el.className = 'fc-event-main-frame';
    el.style.position = 'relative';
    el.style.height = '100%';
    el.style.overflow = 'hidden';

    // Title
    const titleEl = document.createElement('div');
    titleEl.className = 'ev-title';
    titleEl.textContent = `${props.typeShort} ${arg.event.title}`;
    el.appendChild(titleEl);

    // Module name
    if (props.moduleNames.length > 0) {
        const metaEl = document.createElement('div');
        metaEl.className = 'ev-meta';
        metaEl.textContent = props.moduleNames[0];
        el.appendChild(metaEl);
    }

    // Status dot
    const dotEl = document.createElement('span');
    dotEl.className = 'sdot';
    dotEl.style.background = props.statusColor;
    dotEl.style.position = 'absolute';
    dotEl.style.bottom = '3px';
    dotEl.style.right = '3px';
    el.appendChild(dotEl);

    // Pin icon
    const pinEl = document.createElement('span');
    pinEl.className = 'ev-pin-icon material-icons-round';
    pinEl.textContent = 'push_pin';
    pinEl.addEventListener('click', (e) => {
        e.stopPropagation();
        const evId = Number(arg.event.id);
        if (_onPinToggle) _onPinToggle(evId);
    });
    el.appendChild(pinEl);

    // Apply color to parent event element
    requestAnimationFrame(() => {
        const fcEl = el.closest(".fc-event");
        if (fcEl) {
            fcEl.style.setProperty('--ev-color', color);
        }
    });

    return { domNodes: [el] };
}

function handleEventClick(info) {
    info.jsEvent.preventDefault();
    const evId = Number(info.event.id);
    if (_openEventPopup) _openEventPopup(evId);
}

export function refreshCalendarEvents() {
    if (!calendarInstance) return;
    calendarInstance.removeAllEvents();
    const events = buildCalendarEvents();
    calendarInstance.addEventSource(events)
}

export function changeCalendarView(viewName) {
    if (!calendarInstance) return;
    sel.currentView = viewName;
    calendarInstance.changeView(viewName);
    saveState();
}

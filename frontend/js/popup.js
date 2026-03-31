// @ts-check
import { fetchedData, pinnedEvents, WEEKDAY_LABELS } from "./state.js"

/** @type {(() => void) | null} */
let updatePopupCallback = null;

/**
 * Set callback for when popup data changes (e.g. event is pinned/unpinned), so popup can initiate a re-render with updated data
 * @param {() => void} func
 */
export function setPopupUpdateCallback(func) {
    updatePopupCallback = func;
}

/**
 * Open the event detail popup for the given event ID, populating it with the event's information from the global state.
 * @param {number} eventId
 */
export function openPopup(eventId) {
    const event = fetchedData.events.find(el => el.id == eventId);
    const popupEl = /** @type {HTMLElement | null} */ (document.querySelector("#popup"));
    if (!event || !popupEl) return;

    /** 
     * Helper function to query elements within the popup, with proper typing.
     * @param {string} selector
     * @returns {HTMLElement}
     */
    const querySelector = (selector) => /** @type {HTMLElement} */ (popupEl.querySelector(selector));

    /** Determine if the event is currently pinned, to set the initial state of the pin button in the popup. */
    const isPinned = pinnedEvents.has(event.id);

    // Title
    querySelector("#popupTitle").innerText = event.title;
    querySelector("#popupType").innerText = event.type;

    // Time
    querySelector("#popupTime").innerText = `${WEEKDAY_LABELS[event.weekday] || ""}, ${event.start_time.slice(0,5)}–${event.end_time.slice(0,5)}`;

    // Location
    const location = fetchedData.locations.find(el => el.id == event.location_id);
    querySelector("#popupLocation").innerText = location?.name || "–";

    // Staff
    const staffNames = [...new Set(event.staff_ids
        .map((staff_id) => fetchedData.staff.find(el => el.id == staff_id)?.name)
        .filter(Boolean))];
    querySelector("#popupStaff").innerText =
        staffNames.join(", ") || "–";

    // Status
    querySelector("#popupStatusDot").style.background = /* STATUS_COLORS[ev.status] || */ "#6b7280";
    const statusState = fetchedData.states.find(el => el.key == event.status);
    querySelector("#popupStatusLabel").innerText = statusState?.name ?? "";

    // Modules
    const moduleNames = event.module_ids
        .map((module_id) => fetchedData.modules.find(el => el.id == module_id)?.name)
        .filter(Boolean);
    querySelector("#popupModules").innerText = moduleNames.join(", ") || "-";

    // Credits
    const credits = /** @type {number[]} */ ([...new Set(event.module_ids
        .map((module_id) => fetchedData.modules.find(el => el.id == module_id)?.credits)
        .filter((x) => x !== undefined))]);
    if (credits.length == 0) {
        querySelector("#popupCredits").innerText = "-";
    } else if (credits.length == 1) {
        querySelector("#popupCredits").innerText = `${credits[0]} LP`;
    } else {
        querySelector("#popupCredits").innerText = Math.min(...credits) + "-" + Math.max(...credits) + " LP";
    }

    // Degrees info
    const degreesArea = querySelector("#popupDegrees");
    const degreeTexts = [];
    for (const module_id of event.module_ids) {
        const module = fetchedData.modules.find(el => el.id == module_id);
        if (!module) continue;
        for (const degree_id of Object.keys(module.degree_ids || {})) {
            const degree = fetchedData.degrees.find(el => el.id == Number(degree_id));
            if (degree) degreeTexts.push(degree.name);
        }
    }
    degreesArea.innerText = [...new Set(degreeTexts)].join(", ") || "";
    if (degreesArea.parentElement) {
        degreesArea.parentElement.style.display =
            degreeTexts.length > 0 ? "" : "none";
    }

    // Pin button
    const pinBtn = querySelector("#popupPinBtn");
    pinBtn.classList.toggle("pinned", isPinned);
    querySelector("#popupPinBtn .material-icons-round").innerText = isPinned
        ? "push_pin"
        : "push_pin";
    querySelector("#popupPinBtn .pin-label").innerText = isPinned
        ? "Angeheftet"
        : "Anheften";
    pinBtn.dataset["eventId"] = String(event.id);
    // Event listener for pin button
    pinBtn.addEventListener("click", handleEventPin);

    // Finally, show the popup
    popupEl.classList.add("show");
}

/**
 * Set eventlistener to close the popup when clicking outside the popup box or on the close button.
 */
export function initPopup() {
    const closeBtn = document.querySelector("#popupCloseBtn");
    const popup = document.querySelector("#popup");
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            popup?.classList.remove("show");
        });
    }
    if (popup) {
        popup.addEventListener("click", (e) => {
            const popupBox = document.querySelector("#popup .popup-box");
            if (popupBox && !popupBox.contains(/** @type {Node} */ (e.target))) {
                popup.classList.remove("show");
            }
        });
    }
}

/**
 * Handle pin button click in the popup to toggle the pinned state of the event, update the popup UI, and trigger a popup update callback to refresh any other components that depend on the pinned state.
 * @param {MouseEvent} event
 */
function handleEventPin(event) {
    const btn = /** @type {HTMLElement | null} */ (/** @type {Element | null} */ (event.target)?.closest("#popupPinBtn"));
    var eventId = parseInt(btn?.dataset["eventId"] ?? "");
    if (isNaN(eventId)) return;

    if (pinnedEvents.has(eventId)) {
        pinnedEvents.delete(eventId)
    } else {
        pinnedEvents.add(eventId);
    }
    if (updatePopupCallback !== null) {
        updatePopupCallback();
    }
    openPopup(eventId);
}
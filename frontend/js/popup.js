// @ts-check
import { fetchedData, pinnedEvents, WEEKDAY_LABELS } from "./state.js"

/** @type {(() => void) | null} */
let updatePopupCallback = null;

/**
 * @param {() => void} func
 */
export function setPopupUpdateCallback(func) {
    updatePopupCallback = func;
}

/**
 * @param {number} eventId
 */
export function openPopup(eventId) {
    const event = fetchedData.events.find(el => el.id == eventId);
    const popupEl = /** @type {HTMLElement | null} */ (document.querySelector("#popup"));
    if (!event || !popupEl) return;

    /** @type {(sel: string) => HTMLElement} */
    const querySelector = (selector) => /** @type {HTMLElement} */ (popupEl.querySelector(selector));

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

    // Modules + Credits
    const moduleNames = event.module_ids
        .map((module_id) => fetchedData.modules.find(el => el.id == module_id)?.name)
        .filter(Boolean);
    const credits = /** @type {number[]} */ ([...new Set(event.module_ids
        .map((module_id) => fetchedData.modules.find(el => el.id == module_id)?.credits)
        .filter((x) => x !== undefined))]);
    querySelector("#popupModules").innerText =
        moduleNames.join(", ") || "-";
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
    pinBtn.addEventListener("click", handleEventPin);
    // Pin event functionality

    popupEl.classList.add("show");
}

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
 * @param {MouseEvent} e
 */
function handleEventPin(e) {
    const btn = /** @type {HTMLElement | null} */ (/** @type {Element | null} */ (e.target)?.closest("#popupPinBtn"));
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
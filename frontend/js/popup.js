import { fetchedData, pinnedEvents, WEEKDAY_LABELS } from "./state.js"

var popupShown = false;

export function openPopup(eventId) {
    var event = fetchedData.events.find(el => el.id == eventId)
    var popupEl = document.querySelector("#popup");

    const isPinned = pinnedEvents.has(event.id);

    // Title
    popupEl.querySelector("#popupTitle").innerText = event.title;
    popupEl.querySelector("#popupType").innerText = event.type;

    // Time
    popupEl.querySelector("#popupTime").innerText = `${WEEKDAY_LABELS[event.weekday] || ""}, ${event.start_time.slice(0,5)}–${event.end_time.slice(0,5)}`;

    // Location
    const location = fetchedData.locations.find(el => el.id == event.location_id);
    popupEl.querySelector("#popupLocation").innerText = location?.name || "–";

    // Staff
    const staffNames = [...new Set(event.staff_ids
        .map((staff_id) => fetchedData.staff.find(el => el.id == staff_id)?.name)
        .filter(Boolean))];
    popupEl.querySelector("#popupStaff").innerText =
        staffNames.join(", ") || "–";

    // Status
    const statusDot = popupEl.querySelector("#popupStatusDot");
    statusDot.style.background = /* STATUS_COLORS[ev.status] || */ "#6b7280";
    popupEl.querySelector("#popupStatusLabel").innerText = fetchedData.states.find(el => el.key == event.status).name;

    // Modules + Credits
    const moduleNames = event.module_ids
        .map((module_id) => fetchedData.modules.find(el => el.id == module_id)?.name)
        .filter(Boolean);
    const credits = [...new Set(event.module_ids
        .map((module_id) => fetchedData.modules.find(el => el.id == module_id)?.credits)
        .filter(Boolean))];
    popupEl.querySelector("#popupModules").innerText =
        moduleNames.join(", ") || "–";
    if (credits.length == 0) {
        popupEl.querySelector("#popupCredits").innerText = "–";
    } else if (credits.length == 1) {
        popupEl.querySelector("#popupCredits").innerText = `${credits[0]} LP`;
    } else {
        popupEl.querySelector("#popupCredits").innerText = Math.min(credits) + "-" + Math.max(credits) + " LP";
    }

    // Degrees info
    const degreesArea = popupEl.querySelector("#popupDegrees");
    const degreeTexts = [];
    for (const module_id of event.module_ids) {
        const module = fetchedData.modules.find(el => el.id == module_id);
        if (!module) continue;
        for (const degree_id of module.degree_ids || []) {
            const degree = fetchedData.degrees.find(el => el.id == degree_id);
            if (degree) degreeTexts.push(degree.name);
        }
    }
    degreesArea.innerText = [...new Set(degreeTexts)].join(", ") || "";
    degreesArea.parentElement.style.display =
        degreeTexts.length > 0 ? "" : "none";

    // Pin button
    const pinBtn = popupEl.querySelector("#popupPinBtn");
    pinBtn.classList.toggle("pinned", isPinned);
    pinBtn.querySelector(".material-icons-round").innerText = isPinned
        ? "push_pin"
        : "push_pin";
    pinBtn.querySelector(".pin-label").innerText = isPinned
        ? "Angeheftet"
        : "Anheften";
    pinBtn.dataset.eventId = event.id;
    pinBtn.addEventListener("click", handleEventPin);
    // Pin event functionality

    popupEl.classList.add("show");
}

export function initPopup() {
    document.querySelector("#popupCloseBtn").addEventListener("click", () => {
        document.querySelector("#popup").classList.remove("show");
    })
    document.querySelector("#popup").addEventListener("click", (e) => {
        const popupEl = document.querySelector("#popup .popup-box");
        if (popupEl && !popupEl.contains(e.target)) document.querySelector("#popup").classList.remove("show");
    });
}

function handleEventPin(e) {
    var eventId = parseInt(e.target.closest("#popupPinBtn").dataset.eventId);
    if (isNaN(eventId)) return;

    if (pinnedEvents.has(eventId)) {
        pinnedEvents.delete(eventId)
    } else {
        pinnedEvents.add(eventId);
    }
    openPopup(eventId);
}
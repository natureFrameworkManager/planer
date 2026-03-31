// @ts-check
import { fetchAll } from "./api.js";
import { initCalendar, setCalendarUpdateCallback, setOpenPopupCallback, updateCalendar } from "./calendar.js";
import { initColorEvents, setColorUpdateCallback } from "./color.js";
import { setFilterUpdateCallback, updateFilters } from "./filters.js";
import { initPopup, openPopup, setPopupUpdateCallback } from "./popup.js";
import { fetchedData } from "./state.js";

// glue 

// 
document.addEventListener("DOMContentLoaded", async () => {
    [fetchedData.degrees, fetchedData.modules, fetchedData.events, fetchedData.staff, fetchedData.locations, fetchedData.semesters] = await fetchAll();
    console.log(fetchedData)

    const semesterBadge = document.querySelector("#semesterBadge");
    if (semesterBadge) {
        semesterBadge.textContent = fetchedData.semesters[0].name ?? "Semester";
    }

    updateFilters();
    initCalendar();
    updateCalendar();
    initColorEvents();
    initPopup();

    setFilterUpdateCallback(update);
    setCalendarUpdateCallback(update);
    setOpenPopupCallback(openPopup)
    setColorUpdateCallback(update);
    setPopupUpdateCallback(update)

    document.querySelector("#loadingOverlay")?.classList.add("hidden");
    globalEventListeners()
});

function update() {
    updateFilters();
    updateCalendar();
}

function globalEventListeners() {
    document.querySelector("#weitereToggle")?.addEventListener("click", () => {
        document.querySelector("#weitereExp")?.classList.toggle("open");
    })
}
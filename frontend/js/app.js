// @ts-check
import { fetchAll } from "./api.js";
import { initCalendar, setCalendarUpdateCallback, setOpenPopupCallback, updateCalendar } from "./calendar.js";
import { initColorEvents, setColorUpdateCallback } from "./color.js";
import { setFilterUpdateCallback, updateFilters } from "./filters.js";
import { initPopup, openPopup, setPopupUpdateCallback } from "./popup.js";
import { fetchedData } from "./state.js";

// glue 

// Wait for DOM content to load before initializing app
document.addEventListener("DOMContentLoaded", async () => {
    // Fetch all data in parallel and store in global state
    [fetchedData.degrees, fetchedData.modules, fetchedData.events, fetchedData.staff, fetchedData.locations, fetchedData.semesters] = await fetchAll();
    console.log(fetchedData)

    // Set semester badge to current semester
    const semesterBadge = document.querySelector("#semesterBadge");
    if (semesterBadge) {
        semesterBadge.textContent = fetchedData.semesters[0].name ?? "Semester";
    }

    // Initialize filters, calendar, colors, and popup, then update calendar with fetched data
    updateFilters();
    initCalendar();
    updateCalendar();
    initColorEvents();
    initPopup();

    // Set callbacks for when filters, calendar, colors, or popup need to trigger a calendar update
    setFilterUpdateCallback(update);
    setCalendarUpdateCallback(update);
    setOpenPopupCallback(openPopup)
    setColorUpdateCallback(update);
    setPopupUpdateCallback(update)

    // Hide loading overlay after everything is set up
    document.querySelector("#loadingOverlay")?.classList.add("hidden");

    // Set up any additional global event listeners (e.g. for UI controls)
    globalEventListeners()
});

/**
 * Update function to refresh filters and calendar when data or state changes
 * @returns {void}
 */
function update() {
    updateFilters();
    updateCalendar();
}

/**
 * Set up global event listeners for UI controls (e.g. toggle buttons)
 */
function globalEventListeners() {
    document.querySelector("#weitereToggle")?.addEventListener("click", () => {
        document.querySelector("#weitereExp")?.classList.toggle("open");
    })
}
import { fetchAll } from "./api.js";
import { initCalendar, setCalendarUpdateCallback, updateCalendar } from "./calendar.js";
import { initColorEvents, setColorUpdateCallback } from "./color.js";
import { setFilterUpdateCallback, updateFilters } from "./filters.js";
import { fetchedData } from "./state.js";

// glue 

// 
document.addEventListener("DOMContentLoaded", async () => {
    [fetchedData.degrees, fetchedData.modules, fetchedData.events, fetchedData.staff, fetchedData.locations, fetchedData.semesters] = await fetchAll();
    console.log(fetchedData )

    updateFilters();
    initCalendar();
    updateCalendar();
    initColorEvents();

    setFilterUpdateCallback(update);
    setCalendarUpdateCallback(update);
    setColorUpdateCallback(update);

    document.querySelector("#loadingOverlay").classList.add("hidden");
    globalEventListeners()
});

function update() {
    updateFilters();
    updateCalendar();
}

function globalEventListeners() {
    document.querySelector("#weitereToggle").addEventListener("click", () => {
        document.querySelector("#weitereExp").classList.toggle("open");
    })
}
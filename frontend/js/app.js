import { fetchAll } from "./api.js";
import { initCalendar, updateCalendar } from "./calendar.js";
import { updateFilters } from "./filters.js";
import { fetchedData } from "./state.js";

// glue 

// 
document.addEventListener("DOMContentLoaded", async () => {
    [fetchedData.degrees, fetchedData.modules, fetchedData.events, fetchedData.staff, fetchedData.locations, fetchedData.semesters] = await fetchAll();
    console.log(fetchedData )

    updateFilters();
    initCalendar();
    updateCalendar();

    document.querySelector("#loadingOverlay").classList.add("hidden");
    globalEventListeners()
});

function globalEventListeners() {
    document.querySelector("#weitereToggle").addEventListener("click", () => {
        document.querySelector("#weitereExp").classList.toggle("open");
    })
}
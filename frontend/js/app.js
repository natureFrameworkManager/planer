// @ts-check
import { fetchAll } from "./api.js";
import { initCalendar, setCalendarUpdateCallback, setOpenPopupCallback, updateCalendar } from "./calendar.js";
import { initColorEvents, setColorUpdateCallback } from "./color.js";
import { clearFilters, initFilters, setFilterUpdateCallback, updateFilters } from "./filters.js";
import { initPopup, openPopup, setPopupUpdateCallback } from "./popup.js";
import { restoreState, saveFetchedData, saveState, getShareLink, clearStateStorage, loadFetchedDataAsync } from "./sharing_storage.js";
import { fetchedData } from "./state.js";

// Wait for DOM content to load before initializing app
document.addEventListener("DOMContentLoaded", async () => {
    // Try to load cached data from local storage first to speed up initial load
    const cachedData = await loadFetchedDataAsync();
    if (cachedData) {
        fetchedData.degrees = cachedData.degrees;
        fetchedData.modules = cachedData.modules;
        fetchedData.events = cachedData.events;
        fetchedData.staff = cachedData.staff;
        fetchedData.locations = cachedData.locations;
        fetchedData.semesters = cachedData.semesters;
        console.log("Loaded cached data:", fetchedData);
    } else {
        console.log("No cached data available, will fetch fresh data from API.");
    }

    // Restore state from local storage or URL parameters
    restoreState();

    // If no cached data was available, trigger a f fetch fresh data from the API and update the calendar once it's loaded
    if (!cachedData) {
        // Fetch all data in parallel and store in global state
        [fetchedData.degrees, fetchedData.modules, fetchedData.events, fetchedData.staff, fetchedData.locations, fetchedData.semesters] = await fetchAll();
        console.log(fetchedData)
        saveFetchedData();
    }

    // Setup background sync to periodically refresh data in the background
    /* setInterval(() => {
        sync();
    }, 10000); */

    // Initialize the app after data is loaded and state is restored
    initApp();
});

/**
 * Initialize the application by setting up the calendar, filters, colors, and popup components,
 * and then updating the calendar with the fetched data. Also sets up global event listeners for UI controls.
 * @returns {void}
 */
function initApp() {
    // Set semester badge to current semester
    const semesterBadge = document.querySelector("#semesterBadge");
    if (semesterBadge) {
        semesterBadge.textContent = fetchedData.semesters[0].name ?? "Semester";
    }

    // Initialize filters, calendar, colors, and popup, then update calendar with fetched data
    initFilters();
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
};

/**
 * Update function to refresh filters and calendar when data or state changes
 * @returns {void}
 */
function update() {
    updateFilters();
    updateCalendar();
    saveState();
}

/**
 * Set up global event listeners for UI controls (e.g. toggle buttons)
 */
function globalEventListeners() {
    document.querySelector("#hamburgerBtn")?.addEventListener("click", () => {
        document.querySelector("#sidebar")?.classList.toggle("open");
        var backdropEl = /** @type {HTMLElement | null} */ (document.querySelector("#sbBackdrop"));
        if (backdropEl) {
            backdropEl.style.display = document.querySelector("#sidebar")?.classList.contains("open") ? "block" : "none";
        }
    });

    document.querySelector("#sbBackdrop")?.addEventListener("click", () => {
        document.querySelector("#sidebar")?.classList.remove("open");
        var backdropEl = /** @type {HTMLElement | null} */ (document.querySelector("#sbBackdrop"));
        if (backdropEl) {
            backdropEl.style.display = "none";
        }
    });

    document.querySelector("#sidebarCloseBtn")?.addEventListener("click", () => {
        document.querySelector("#sidebar")?.classList.remove("open");
        var backdropEl = /** @type {HTMLElement | null} */ (document.querySelector("#sbBackdrop"));
        if (backdropEl) {
            backdropEl.style.display = "none";
        }
    });


    // Reset filters button
    document.querySelector("#resetAllBtn")?.addEventListener("click", () => {
        clearStateStorage();
        clearFilters();
    });

    // Share link button
    document.querySelector("#shareLinkBtn")?.addEventListener("click", () => {
        const link = getShareLink();
        navigator.clipboard.writeText(link).then(() => {
            const successMsg = document.querySelector("#shareLinkSuccessMSg");
            if (successMsg) successMsg.textContent = "Link wurde kopiert!";
        }).catch(err => {
            const successMsg = document.querySelector("#shareLinkSuccessMSg");
            if (successMsg) successMsg.textContent = "Link konnte nicht kopiert werden!";
        });
        const shareLinkEl = document.querySelector("#shareLink");
        if (shareLinkEl) shareLinkEl.textContent = link;
        document.querySelector("#share-link-popup")?.classList.add("show");
    });
    const shareLinkCloseBtn = document.querySelector("#shareLinkCloseBtn");
    const shareLinkPopup = document.querySelector("#share-link-popup");
    if (shareLinkCloseBtn) {
        shareLinkCloseBtn.addEventListener("click", () => {
            shareLinkPopup?.classList.remove("show");
        });
    }
    if (shareLinkPopup) {
        shareLinkPopup.addEventListener("click", (e) => {
            const popupBox = document.querySelector("#share-link-popup .popup-box");
            if (popupBox && !popupBox.contains(/** @type {Node} */ (e.target))) {
                shareLinkPopup.classList.remove("show");
            }
        });
    }
}
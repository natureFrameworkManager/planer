// js/app.js — Main application logic, init, dark mode, color mode, share link, popup

import {
    sel,
    data,
    maps,
    buildMaps,
    computeVisibleEvents,
    loadState,
    saveState,
    loadStateFromUrlParams,
    stateToUrlParams,
    getEventColor,
    TYPE_SHORT,
    STATUS_COLORS,
    STATUS_LABELS,
    WEEKDAY_LABELS,
    TYPE_COLORS,
} from "./state.js";
import {
    fetchDegrees,
    fetchModules,
    fetchEvents,
    fetchStaff,
    fetchLocations,
    fetchSemesters,
    fetchDegreeDetail,
} from "./api.js";
import {
    initCalendar,
    refreshCalendarEvents,
    changeCalendarView,
    setCalendarCallbacks,
} from "./calendar.js";
import {
    renderFilters,
    setupSearchInputs,
    onDegreeChange,
    onSemesterChange,
    onFilterChange,
    resetAllFilters,
} from "./filters.js";

// ===== Init =====
document.addEventListener("DOMContentLoaded", async () => {
    // Load state: URL params take priority, then localStorage
    const fromUrl = loadStateFromUrlParams();
    if (!fromUrl) loadState();

    // Apply dark mode
    applyDarkMode();

    // Register calendar callbacks
    setCalendarCallbacks(onPinToggle, openEventPopup);

    // Show loading
    const loader = document.getElementById("loadingOverlay");

    try {
        // Fetch all data in parallel
        const [degrees, modules, events, staff, locations, semesters] =
            await Promise.all([
                fetchDegrees(),
                fetchModules(),
                fetchEvents(),
                fetchStaff(),
                fetchLocations(),
                fetchSemesters(),
            ]);

        data.degrees = degrees;
        data.modules = modules;
        data.events = events;
        data.staff = staff;
        data.locations = locations;
        data.semesters = semesters;

        buildMaps();

        // Fetch degree detail if degree was selected
        if (sel.degreeId) {
            try {
                data.degreeDetail = await fetchDegreeDetail(sel.degreeId);
            } catch {
                /* ignore */
            }
        }

        // Show semester name in header
        updateSemesterBadge();

        // Compute initial visible events
        computeVisibleEvents();

        // Render filters
        renderFilters();
        setupSearchInputs();

        // Init calendar
        initCalendar();

        // Apply saved view
        applyCurrentView();

        // Setup event listeners
        setupEventListeners();
    } catch (err) {
        console.error("Failed to initialize:", err);
        const mainArea = document.getElementById("mainArea");
        if (mainArea) {
            mainArea.innerHTML = `
        <div class="empty-state">
          <span class="material-icons-round">error_outline</span>
          <p>Fehler beim Laden der Daten.<br>Ist der API-Server erreichbar?</p>
          <p style="font-size:0.65rem;margin-top:8px;color:var(--text-muted)">${escapeHtml(err.message)}</p>
        </div>`;
        }
    } finally {
        if (loader) {
            loader.classList.add("hidden");
            setTimeout(() => loader.remove(), 300);
        }
    }

    // Clear URL params after loading (so refreshing uses localStorage)
    if (fromUrl) {
        window.history.replaceState({}, "", window.location.pathname);
    }
});

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

// ===== Semester badge =====
function updateSemesterBadge() {
    const badge = document.getElementById("semesterBadge");
    const badgeMobile = document.getElementById("semesterBadgeMobile");
    if (data.semesters.length > 0) {
        const name = data.semesters[data.semesters.length - 1].name;
        if (badge) badge.textContent = name;
        if (badgeMobile) badgeMobile.textContent = name;
    }
}

// ===== Dark mode =====
function applyDarkMode() {
    document.documentElement.classList.toggle("dark", sel.darkMode);
}

export function toggleDarkMode() {
    sel.darkMode = !sel.darkMode;
    applyDarkMode();
    saveState();

    // Update icon
    const icon = document.getElementById("themeIcon");
    if (icon) icon.textContent = sel.darkMode ? "light_mode" : "dark_mode";
}

// ===== View switching =====
function applyCurrentView() {
    updateViewButtons(sel.currentView);
}

function updateViewButtons(view) {
    document.querySelectorAll("[data-view]").forEach((btn) => {
        btn.classList.toggle(
            "active",
            btn.dataset.view === viewNameToShort(view),
        );
    });
}

function viewNameToShort(fc) {
    if (fc === "timeGridWeek") return "week";
    if (fc === "timeGridDay") return "day";
    if (fc === "listWeek") return "list";
    return "week";
}

function shortToViewName(short) {
    if (short === "week") return "timeGridWeek";
    if (short === "day") return "timeGridDay";
    if (short === "list") return "listWeek";
    return "timeGridWeek";
}

export function switchView(name) {
    const fcView = shortToViewName(name);
    changeCalendarView(fcView);
    updateViewButtons(fcView);
}

// ===== Sidebar (mobile) =====
export function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sbBackdrop");
    sidebar.classList.toggle("open");
    backdrop.style.display = sidebar.classList.contains("open")
        ? "block"
        : "none";
}

export function closeSidebar() {
    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sbBackdrop");
    sidebar.classList.remove("open");
    backdrop.style.display = "none";
}

// ===== Pin toggle =====
export function onPinToggle(eventId) {
    if (sel.pinnedEventIds.has(eventId)) {
        sel.pinnedEventIds.delete(eventId);
    } else {
        sel.pinnedEventIds.add(eventId);
    }
    onFilterChange();
}

// ===== Event Detail Popup =====
export function openEventPopup(eventId) {
    const ev = maps.eventById.get(eventId);
    if (!ev) return;

    const popup = document.getElementById("popup");
    if (!popup) return;

    const color = getEventColor(ev);
    const isPinned = sel.pinnedEventIds.has(eventId);

    // Title
    document.getElementById("popupTitle").textContent = ev.title;
    document.getElementById("popupType").textContent = ev.type;
    document.getElementById("popupType").style.color = color;

    // Time
    document.getElementById("popupTime").textContent =
        `${WEEKDAY_LABELS[ev.weekday] || ""}, ${ev.start_time}–${ev.end_time}`;

    // Location
    const loc = maps.locationById.get(ev.location_id);
    document.getElementById("popupLocation").textContent = loc?.name || "–";

    // Staff
    const staffNames = ev.staff_ids
        .map((sid) => maps.staffById.get(sid)?.name)
        .filter(Boolean);
    document.getElementById("popupStaff").textContent =
        staffNames.join(", ") || "–";

    // Status
    const statusDot = document.getElementById("popupStatusDot");
    statusDot.style.background = STATUS_COLORS[ev.status] || "#6b7280";
    document.getElementById("popupStatusLabel").textContent =
        STATUS_LABELS[ev.status] || ev.status;

    // Modules + Credits
    const modNames = ev.module_ids
        .map((mid) => maps.moduleById.get(mid)?.name)
        .filter(Boolean);
    const credits = ev.module_ids
        .map((mid) => maps.moduleById.get(mid)?.credits)
        .filter(Boolean);
    document.getElementById("popupModules").textContent =
        modNames.join(", ") || "–";
    document.getElementById("popupCredits").textContent =
        credits.length > 0 ? `${credits[0]} LP` : "–";

    // Degrees info
    const degreesArea = document.getElementById("popupDegrees");
    const degreeTexts = [];
    for (const mid of ev.module_ids) {
        const mod = maps.moduleById.get(mid);
        if (!mod) continue;
        for (const did of mod.degree_ids || []) {
            const deg = maps.degreeById.get(did);
            if (deg) degreeTexts.push(deg.name);
        }
    }
    degreesArea.textContent = [...new Set(degreeTexts)].join(", ") || "";
    degreesArea.parentElement.style.display =
        degreeTexts.length > 0 ? "" : "none";

    // Pin button
    const pinBtn = document.getElementById("popupPinBtn");
    pinBtn.classList.toggle("pinned", isPinned);
    pinBtn.querySelector(".material-icons-round").textContent = isPinned
        ? "push_pin"
        : "push_pin";
    pinBtn.querySelector(".pin-label").textContent = isPinned
        ? "Angeheftet"
        : "Anheften";
    pinBtn.onclick = () => {
        onPinToggle(eventId);
        openEventPopup(eventId); // refresh popup
    };

    // Exclusion note
    const exNote = document.getElementById("popupExclusionNote");
    if (isPinned) {
        // Check if this pin causes exclusions
        const siblings = data.events.filter(
            (e) =>
                e.id !== eventId &&
                e.type === ev.type &&
                e.module_ids.some((mid) => ev.module_ids.includes(mid)) &&
                !sel.pinnedEventIds.has(e.id),
        );
        if (siblings.length >= 1) {
            exNote.style.display = "";
            exNote.querySelector(".ex-text").textContent =
                `${TYPE_SHORT[ev.type] || ev.type} angeheftet → ${siblings.length} Parallelgruppe(n) ausgeblendet`;
        } else {
            exNote.style.display = "none";
        }
    } else {
        exNote.style.display = "none";
    }

    popup.classList.add("show");
}

export function closePopup() {
    const popup = document.getElementById("popup");
    if (popup) popup.classList.remove("show");
}

// ===== Color Mode =====
function setColorMode(mode) {
    sel.colorMode = mode;
    saveState();
    refreshCalendarEvents();
    updateColorModeUI();
}

function updateColorModeUI() {
    const label = document.getElementById("colorModeLabel");
    const labels = {
        type: "Typ",
        module: "Modul",
        status: "Status",
        staff: "Dozent",
        custom: "Custom",
    };
    if (label) label.textContent = labels[sel.colorMode] || "Typ";

    // Update menu active states
    document.querySelectorAll(".color-menu-item").forEach((btn) => {
        const mode = btn.dataset.mode;
        btn.classList.toggle("active", mode === sel.colorMode);
        const checkIcon = btn.querySelector(".check-icon");
        if (checkIcon) {
            checkIcon.textContent = mode === sel.colorMode ? "check" : "";
        }
    });
}

// ===== Custom Color Config =====
function renderCustomColorConfig() {
    const grid = document.getElementById("colorConfigGrid");
    if (!grid) return;
    grid.innerHTML = "";

    const SWATCH_COLORS = [
        "#3B82F6",
        "#10B981",
        "#F59E0B",
        "#8B5CF6",
        "#EC4899",
        "#6366F1",
        "#14B8A6",
        "#F97316",
        "#06B6D4",
        "#EF4444",
        "#84CC16",
        "#D946EF",
    ];

    // Show color pickers grouped by type
    for (const [typeName, defaultColor] of Object.entries(TYPE_COLORS)) {
        const item = document.createElement("div");
        item.className = "color-config-item";

        const lbl = document.createElement("span");
        lbl.className = "label";
        lbl.textContent = TYPE_SHORT[typeName] || typeName;
        item.appendChild(lbl);

        const swatches = document.createElement("div");
        swatches.style.display = "flex";
        swatches.style.gap = "3px";

        for (const color of SWATCH_COLORS) {
            const sw = document.createElement("div");
            sw.className = "cswatch";
            sw.style.background = color;
            const currentCustom =
                sel.customColors[`type:${typeName}`] || defaultColor;
            if (color === currentCustom) sw.classList.add("active");
            sw.addEventListener("click", () => {
                sel.customColors[`type:${typeName}`] = color;
                // Update TYPE_COLORS override for this session
                TYPE_COLORS[typeName] = color;
                saveState();
                refreshCalendarEvents();
                renderCustomColorConfig();
            });
            swatches.appendChild(sw);
        }

        item.appendChild(swatches);
        grid.appendChild(item);
    }
}

// ===== Share Link =====
function generateShareLink() {
    const params = stateToUrlParams();
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;

    navigator.clipboard
        .writeText(url)
        .then(() => {
            showToast("Link kopiert!");
        })
        .catch(() => {
            // Fallback
            prompt("Link teilen:", url);
        });
}

function showToast(msg) {
    const toast = document.createElement("div");
    toast.textContent = msg;
    toast.style.cssText = `
    position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
    background:var(--bg-elevated);color:var(--text-primary);
    padding:8px 16px;border-radius:var(--radius-sm);
    box-shadow:var(--shadow-lg);font-size:0.75rem;z-index:200;
    border:1px solid var(--border);
    animation:fadeIn 0.2s ease;
  `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

// ===== Expand toggle =====
function toggleExpand(bodyId, toggleEl) {
    const body = document.getElementById(bodyId);
    if (!body) return;
    body.classList.toggle("open");
    toggleEl.classList.toggle("open");
}

// ===== Setup all event listeners =====
function setupEventListeners() {
    // Hamburger
    document
        .getElementById("hamburgerBtn")
        ?.addEventListener("click", toggleSidebar);
    document
        .getElementById("sbBackdrop")
        ?.addEventListener("click", closeSidebar);
    document
        .getElementById("sidebarCloseBtn")
        ?.addEventListener("click", closeSidebar);

    // View buttons
    document.querySelectorAll("[data-view]").forEach((btn) => {
        btn.addEventListener("click", () => switchView(btn.dataset.view));
    });

    // Theme toggle
    document
        .getElementById("themeToggle")
        ?.addEventListener("click", toggleDarkMode);

    // Degree change
    document.getElementById("degreeSelect")?.addEventListener("change", (e) => {
        onDegreeChange(e.target.value);
    });

    // Semester change
    document
        .getElementById("semesterSelect")
        ?.addEventListener("change", (e) => {
            onSemesterChange(e.target.value);
        });

    // Reset all
    document
        .getElementById("resetAllBtn")
        ?.addEventListener("click", resetAllFilters);
    document
        .getElementById("chipsResetBtn")
        ?.addEventListener("click", resetAllFilters);

    // Share link
    document
        .getElementById("shareLinkBtn")
        ?.addEventListener("click", generateShareLink);

    // Popup close
    document.getElementById("popup")?.addEventListener("click", (e) => {
        if (e.target === document.getElementById("popup")) closePopup();
    });
    document
        .getElementById("popupCloseBtn")
        ?.addEventListener("click", closePopup);

    // Color mode dropdown
    document.getElementById("colorDropBtn")?.addEventListener("click", () => {
        document.getElementById("colorDrop")?.classList.toggle("open");
    });

    // Close color dropdown on outside click
    document.addEventListener("click", (e) => {
        const cd = document.getElementById("colorDrop");
        if (cd && !cd.contains(e.target)) cd.classList.remove("open");
    });

    // Color mode menu items
    document.querySelectorAll(".color-menu-item").forEach((btn) => {
        btn.addEventListener("click", () => {
            const mode = btn.dataset.mode;
            if (mode === "custom") {
                const config = document.getElementById("colorConfig");
                config?.classList.toggle("open");
                renderCustomColorConfig();
            } else {
                setColorMode(mode);
            }
            document.getElementById("colorDrop")?.classList.remove("open");
        });
    });

    // Close custom color config
    document
        .getElementById("colorConfigCloseBtn")
        ?.addEventListener("click", () => {
            document.getElementById("colorConfig")?.classList.remove("open");
        });

    // Expand toggles
    document
        .getElementById("weitereToggle")
        ?.addEventListener("click", function () {
            toggleExpand("weitereExp", this);
        });

    // Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closePopup();
            closeSidebar();
        }
    });

    // Apply initial color mode UI
    updateColorModeUI();
}

// @ts-check
import { colorMode, darkMode, fetchedData } from "./state.js";

/** @type {(() => void) | null} */
let updateColorCallback = null;

/**
 * Set callback for when color mode or dark mode changes, so dependent components (e.g. calendar) can update their colors.
 * @param {() => void} func 
 */
export function setColorUpdateCallback(func) {
    updateColorCallback = func;
}

/**
 * Get the color for an event based on the currently selected color mode and the event's properties.
 * Falls back to a default color if the event's relevant property is not found in the data.
 * @param {import('./api.js').Event} event 
 * @returns {string}
 */
export function getEventColor(event) {
    var colorMode = (/** @type {HTMLElement|null} */ (document.querySelector("#colorDrop .color-menu .color-menu-item.active")))?.["dataset"]["mode"];
    switch (colorMode) {
        case "type":
            var types = [...new Set(fetchedData.events.map(el => el.type))];
            var palette = generatePalette(types.length);
            var colorMap = new Map();
            for (let index = 0; index < types.length; index++) {
                colorMap.set(types[index], palette[index]);
            }
            return colorMap.get(event.type);
        case "module":
            var modules = fetchedData.modules.map(el => el.id);
            var palette = generatePalette(modules.length);
            var colorMap = new Map();
            for (let index = 0; index < modules.length; index++) {
                colorMap.set(modules[index], palette[index]);
            }
            return colorMap.get(event.module_ids[0]);
        case "status":
            var states = fetchedData.states.map(el => el.key);
            var palette = generatePalette(states.length);
            var colorMap = new Map();
            for (let index = 0; index < states.length; index++) {
                colorMap.set(states[index], palette[index]);
            }
            return colorMap.get(event.status);
        case "staff":
            var staff = fetchedData.staff.map(el => el.id);
            var palette = generatePalette(staff.length);
            var colorMap = new Map();
            for (let index = 0; index < staff.length; index++) {
                colorMap.set(staff[index], palette[index]);
            }
            return colorMap.get(event.staff_ids[0]);
        case "custom":
            // TODO: implement custom color picker and return selected color for event
            break;
    }

    return generatePalette(10)[7];
}

// Labels for color modes in the dropdown menu
const COLOR_MODE_LABELS = /** @type {Record<string, string>} */ ({
    type: "Typ",
    module: "Modul",
    status: "Status",
    staff: "Dozent",
    custom: "Benutzerdefiniert",
});

/**
 * Update UI to reflect current color mode selection, and update the label of the color mode dropdown button.
 * @param {string} mode 
 */
function applyColorModeUI(mode) {
    document.querySelectorAll("#colorDrop .color-menu .color-menu-item").forEach((el) => {
        const htmlEl = /** @type {HTMLElement} */ (el);
        const active = htmlEl.dataset['mode'] === mode;
        htmlEl.classList.toggle("active", active);
        const span = /** @type {HTMLElement|null} */ (htmlEl.querySelector("span"));
        if (span) span.innerText = active ? "check" : "";
    });
    const labelEl = /** @type {HTMLElement|null} */ (document.querySelector("#colorDrop #colorDropBtn span#colorModeLabel"));
    if (labelEl) labelEl.innerText = COLOR_MODE_LABELS[mode] ?? mode;
}

/**
 * Initialize event listeners for color mode dropdown and theme toggle, and apply initial color mode UI state.
 * Also triggers the color update callback when the color mode or theme changes, so dependent components can refresh their colors.
 * @returns {void}
 */
export function initColorEvents() {
    document.querySelector("#colorDrop #colorDropBtn")?.addEventListener("click", () => {
        document.querySelector("#colorDrop")?.classList.toggle("open")
    })
    document.addEventListener("click", (e) => {
        const colorDropEl = document.querySelector("#colorDrop");
        if (colorDropEl && !colorDropEl.contains(/** @type {Node|null} */ (e.target))) colorDropEl.classList.remove("open");
    });

    // Apply initial active state from saved colorMode
    applyColorModeUI(colorMode.value);

    document.querySelectorAll("#colorDrop .color-menu .color-menu-item").forEach(el => el.addEventListener("click", () => {
        const htmlEl = /** @type {HTMLElement} */ (el);
        colorMode.value = htmlEl.dataset['mode'] ?? "";
        applyColorModeUI(htmlEl.dataset['mode'] ?? "");
        document.querySelector("#colorDrop")?.classList.remove("open");

        if (updateColorCallback !== null) {
            updateColorCallback();
        }
    }));

    document.querySelector("#themeToggle")?.addEventListener("click", () => {
        darkMode.value = !darkMode.value;
        document.querySelector("html")?.classList.toggle("dark", darkMode.value);
        const themeIcon = /** @type {HTMLElement|null} */ (document.querySelector("#themeToggle #themeIcon"));
        if (themeIcon) themeIcon.innerText = (darkMode.value ? "dark_mode" : "light_mode");

        if (updateColorCallback !== null) {
            updateColorCallback();
        }
    });
    const themeIconEl = /** @type {HTMLElement|null} */ (document.querySelector("#themeToggle #themeIcon"));
    if (themeIconEl) themeIconEl.innerText = (darkMode.value ? "dark_mode" : "light_mode");
} 

// TODO: handle color mode change
// TODO: respect dark mode


const GOLDEN_ANGLE = 137.508;

/**
 * Generate a palette of `count` visually distinct colors in OKLCH.
 * Uses the golden angle to spread hues and varies lightness/chroma
 * so neighbouring indices stay easy to tell apart.
 *
 * @param {number} count        Number of colors to generate (≥ 1)
 * @param {object} [opts]       Optional overrides
 * @param {[number, number]} [opts.lightness=[0.60, 0.82]]  Min/max lightness
 * @param {[number, number]} [opts.chroma=[0.13, 0.24]]     Min/max chroma
 * @param {number} [opts.hueOffset=0]             Starting hue offset (°)
 * @returns {string[]}          Array of "oklch(L C H)" strings
 */
export function generatePalette(count, opts = {}) {
    const [lMin, lMax] = opts.lightness ?? [0.60, 0.82];
    const [cMin, cMax] = opts.chroma ?? [0.13, 0.24];
    const hueOffset = opts.hueOffset ?? 0;

    const colors = [];
    for (let i = 0; i < count; i++) {
        const hue = (hueOffset + i * GOLDEN_ANGLE) % 360;

        // Vary lightness & chroma in a staggered pattern so adjacent
        // colours differ on more than just hue.
        const t = count > 1 ? i / (count - 1) : 0.5;
        const lightness = lMin + (lMax - lMin) * ((Math.sin(t * Math.PI * 4) + 1) / 2);
        const chroma = cMin + (cMax - cMin) * ((Math.cos(t * Math.PI * 3 + 1) + 1) / 2);

        colors.push(
            `oklch(${lightness.toFixed(3)} ${chroma.toFixed(3)} ${hue.toFixed(3)})`,
        );
    }
    return colors;
}

/**
 * Give a text color with maximum contrast given a background color.  
 * Composites `color` over `bgColor` (defaults to --color-background)
 * so semi-transparent event backgrounds are resolved correctly.
 * @param {string} color       CSS color string (may be semi-transparent)
 * @param {string} [bgColor]   Opaque background to composite against. Defaults to the current --color-background variable.
 * @returns {"#ffffff"|"#000000"}
 */
export function getContrastTextColor(color, bgColor) {
    const resolvedBg = bgColor
        ?? getComputedStyle(document.documentElement)
               .getPropertyValue("--color-background").trim();

    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "#000000";

    // Paint the opaque background first, then composite the event color on top.
    ctx.fillStyle = resolvedBg || "#ffffff";
    ctx.fillRect(0, 0, 1, 1);
    ctx.fillStyle = "color-mix(in srgb, " + color + ", transparent 82%)";
    ctx.fillRect(0, 0, 1, 1);

    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;

    // Relative luminance per WCAG 2.1
    const toLinear = (/** @type {number} */ c) => {
        const s = c / 255;
        return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    const L = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

    // Pick whichever of white/black yields higher contrast ratio
    const contrastWithWhite = 1.05 / (L + 0.05);
    const contrastWithBlack = (L + 0.05) / 0.05;

    return contrastWithWhite >= contrastWithBlack ? "#ffffff" : "#000000";
}

// TODO: implement custom color picker and save selected colors in state
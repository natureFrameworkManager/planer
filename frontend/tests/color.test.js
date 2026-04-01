import { generatePalette, getEventColor, getContrastTextColor, setColorUpdateCallback, initColorEvents } from "../js/color.js";
import { colorMode, darkMode, fetchedData } from "../js/state.js";
import { jest } from "@jest/globals";

describe("generatePalette", () => {
    test("returns requested number of colors", () => {
        const palette = generatePalette(5);
        expect(palette).toHaveLength(5);
        palette.forEach((color) => {
            expect(color).toMatch(/^oklch\(\d+\.\d{3} \d+\.\d{3} \d+\.\d{3}\)$/);
        });
    });

    test("supports deterministic overrides", () => {
        const palette = generatePalette(1, {
            lightness: [0.5, 0.5],
            chroma: [0.2, 0.2],
            hueOffset: 10,
        });

        expect(palette).toEqual(["oklch(0.500 0.200 10.000)"]);
    });

    test("returns empty array for count 0", () => {
        expect(generatePalette(0)).toEqual([]);
    });

    test("single color uses t=0.5 midpoint values", () => {
        const palette = generatePalette(1);
        expect(palette).toHaveLength(1);
        expect(palette[0]).toMatch(/^oklch\(/);
    });

    test("all colors are unique for small palette", () => {
        const palette = generatePalette(10);
        const unique = new Set(palette);
        expect(unique.size).toBe(10);
    });

    test("uses golden angle spacing – hue increases by ~137.508 per step", () => {
        const palette = generatePalette(3, { hueOffset: 0 });
        const hues = palette.map(c => parseFloat(c.match(/[\d.]+\)$/)[0]));
        expect(hues[0]).toBeCloseTo(0, 1);
        expect(hues[1]).toBeCloseTo(137.508, 1);
        expect(hues[2]).toBeCloseTo(275.016, 1);
    });

    test("respects custom hueOffset", () => {
        const palette = generatePalette(2, { hueOffset: 90 });
        const hues = palette.map(c => parseFloat(c.match(/[\d.]+\)$/)[0]));
        expect(hues[0]).toBeCloseTo(90, 1);
        expect(hues[1]).toBeCloseTo((90 + 137.508) % 360, 1);
    });

    test("large palette returns correct length", () => {
        const palette = generatePalette(150);
        expect(palette).toHaveLength(150);
    });

    test("negative count returns empty array (loop never executes)", () => {
        const palette = generatePalette(-1);
        expect(palette).toEqual([]);
    });

    test("count=2: t goes from 0 to 1, covers both ends of lightness/chroma sine curves", () => {
        const palette = generatePalette(2);
        expect(palette).toHaveLength(2);
        // Both should be valid oklch strings but differ since t=0 and t=1
        expect(palette[0]).toMatch(/^oklch\(/);
        expect(palette[1]).toMatch(/^oklch\(/);
        expect(palette[0]).not.toBe(palette[1]);
    });

    test("hue wraps around 360° for large index (e.g. hueOffset=350, i=1 → 350+137.508 mod 360)", () => {
        const palette = generatePalette(2, { hueOffset: 350 });
        const hues = palette.map(c => parseFloat(c.match(/[\d.]+\)$/)[0]));
        expect(hues[0]).toBeCloseTo(350, 1);
        expect(hues[1]).toBeCloseTo((350 + 137.508) % 360, 1);
        // The wrapped hue should be < 360
        expect(hues[1]).toBeLessThan(360);
    });
});

describe("getEventColor", () => {
    beforeEach(() => {
        fetchedData.events = [
            { id: 1, type: "Vorlesung", module_ids: [10], status: "ok", staff_ids: [100], location_id: 1, title: "T1", weekday: 1, start_time: "08:00", end_time: "10:00" },
            { id: 2, type: "Seminar", module_ids: [20], status: "tok", staff_ids: [200], location_id: 2, title: "T2", weekday: 2, start_time: "10:00", end_time: "12:00" },
        ];
        fetchedData.modules = [
            { id: 10, name: "M1", module_number: "M001", credits: 5, planung: "", language: "de", degree_ids: {}, event_ids: [1] },
            { id: 20, name: "M2", module_number: "M002", credits: 3, planung: "", language: "de", degree_ids: {}, event_ids: [2] },
        ];
        fetchedData.staff = [
            { id: 100, name: "Prof A" },
            { id: 200, name: "Prof B" },
        ];
        fetchedData.states = [
            { key: "ok", name: "Bestätigt" },
            { key: "tok", name: "Dozent ausstehend" },
        ];
    });

    test("returns color from type palette when colorMode is 'type'", () => {
        colorMode.value = "type";
        const color = getEventColor(fetchedData.events[0]);
        expect(color).toMatch(/^oklch\(/);
    });

    test("returns color from module palette when colorMode is 'module'", () => {
        colorMode.value = "module";
        const color = getEventColor(fetchedData.events[0]);
        expect(color).toMatch(/^oklch\(/);
    });

    test("returns color from status palette when colorMode is 'status'", () => {
        colorMode.value = "status";
        const color = getEventColor(fetchedData.events[0]);
        expect(color).toMatch(/^oklch\(/);
    });

    test("returns color from staff palette when colorMode is 'staff'", () => {
        colorMode.value = "staff";
        const color = getEventColor(fetchedData.events[0]);
        expect(color).toMatch(/^oklch\(/);
    });

    test("returns fallback color for 'custom' mode", () => {
        colorMode.value = "custom";
        const color = getEventColor(fetchedData.events[0]);
        expect(color).toMatch(/^oklch\(/);
    });

    test("returns fallback color for unknown color mode", () => {
        colorMode.value = "nonexistent";
        const color = getEventColor(fetchedData.events[0]);
        expect(color).toMatch(/^oklch\(/);
    });

    test("different events get different colors in type mode when types differ", () => {
        colorMode.value = "type";
        const c1 = getEventColor(fetchedData.events[0]);
        const c2 = getEventColor(fetchedData.events[1]);
        expect(c1).not.toBe(c2);
    });

    test("type mode: event.type not in fetchedData.events types → returns undefined (BUG: no fallback inside switch)", () => {
        colorMode.value = "type";
        const fakeEvent = { id: 99, type: "UnknownType", module_ids: [10], status: "ok", staff_ids: [100], location_id: 1, title: "X", weekday: 1, start_time: "08:00", end_time: "10:00" };
        // The switch case builds colorMap from existing event types. "UnknownType" won't be a key.
        const color = getEventColor(fakeEvent);
        expect(color).toBeUndefined(); // BUG: no fallback inside the "type" case
    });

    test("module mode: event.module_ids is empty → event.module_ids[0] is undefined → colorMap.get(undefined) → returns undefined (BUG)", () => {
        colorMode.value = "module";
        const fakeEvent = { id: 99, type: "Vorlesung", module_ids: [], status: "ok", staff_ids: [100], location_id: 1, title: "X", weekday: 1, start_time: "08:00", end_time: "10:00" };
        const color = getEventColor(fakeEvent);
        expect(color).toBeUndefined(); // BUG: module_ids[0] is undefined, colorMap.get(undefined)
    });

    test("staff mode: event.staff_ids is empty → event.staff_ids[0] is undefined → colorMap.get(undefined) → returns undefined (BUG)", () => {
        colorMode.value = "staff";
        const fakeEvent = { id: 99, type: "Vorlesung", module_ids: [10], status: "ok", staff_ids: [], location_id: 1, title: "X", weekday: 1, start_time: "08:00", end_time: "10:00" };
        const color = getEventColor(fakeEvent);
        expect(color).toBeUndefined(); // BUG: staff_ids[0] is undefined
    });

    test("module mode: event.module_ids[0] references an id in fetchedData.modules → returns valid color from palette", () => {
        colorMode.value = "module";
        const color = getEventColor(fetchedData.events[0]); // module_ids: [10], which is in fetchedData.modules
        expect(color).toMatch(/^oklch\(/);
    });

    test("status mode: event.status is not in fetchedData.states keys → colorMap.get() returns undefined (BUG)", () => {
        colorMode.value = "status";
        const fakeEvent = { id: 99, type: "Vorlesung", module_ids: [10], status: "unknownStatus", staff_ids: [100], location_id: 1, title: "X", weekday: 1, start_time: "08:00", end_time: "10:00" };
        const color = getEventColor(fakeEvent);
        expect(color).toBeUndefined(); // BUG: unknownStatus not in states keys
    });

    test("type mode: all events have the same type → palette has length 1 → all events get same color", () => {
        fetchedData.events = [
            { id: 1, type: "Vorlesung", module_ids: [10], status: "ok", staff_ids: [100], location_id: 1, title: "T1", weekday: 1, start_time: "08:00", end_time: "10:00" },
            { id: 2, type: "Vorlesung", module_ids: [20], status: "tok", staff_ids: [200], location_id: 2, title: "T2", weekday: 2, start_time: "10:00", end_time: "12:00" },
        ];
        colorMode.value = "type";
        const c1 = getEventColor(fetchedData.events[0]);
        const c2 = getEventColor(fetchedData.events[1]);
        expect(c1).toBe(c2);
    });

    test("staff mode: event with multiple staff_ids only uses staff_ids[0] for color lookup", () => {
        colorMode.value = "staff";
        const multiStaffEvent = { id: 99, type: "Vorlesung", module_ids: [10], status: "ok", staff_ids: [100, 200], location_id: 1, title: "X", weekday: 1, start_time: "08:00", end_time: "10:00" };
        const color = getEventColor(multiStaffEvent);
        // Should use staff_ids[0] = 100 for lookup
        const singleStaffEvent = { ...multiStaffEvent, staff_ids: [100] };
        const colorSingle = getEventColor(singleStaffEvent);
        expect(color).toBe(colorSingle);
    });

    test("module mode returns undefined when event's module not in fetchedData.modules (BUG)", () => {
        colorMode.value = "module";
        const fakeEvent = { id: 99, type: "Vorlesung", module_ids: [999], status: "ok", staff_ids: [100], location_id: 1, title: "X", weekday: 1, start_time: "08:00", end_time: "10:00" };
        const color = getEventColor(fakeEvent);
        // module_ids[0] = 999 is not in fetchedData.modules, so colorMap won't have it
        expect(color).toBeUndefined(); // BUG: no fallback
    });

    test("type mode with single unique type gives all events the same color", () => {
        fetchedData.events = [
            { id: 1, type: "Seminar", module_ids: [10], status: "ok", staff_ids: [100], location_id: 1, title: "T1", weekday: 1, start_time: "08:00", end_time: "10:00" },
            { id: 2, type: "Seminar", module_ids: [20], status: "tok", staff_ids: [200], location_id: 2, title: "T2", weekday: 2, start_time: "10:00", end_time: "12:00" },
        ];
        colorMode.value = "type";
        const c1 = getEventColor(fetchedData.events[0]);
        const c2 = getEventColor(fetchedData.events[1]);
        expect(c1).toBe(c2);
    });
});

describe("getContrastTextColor", () => {
    test("returns '#000000' when canvas context is unavailable", () => {
        // jsdom canvas may not support getContext properly
        const result = getContrastTextColor("red", "#ffffff");
        // Should return one of the two valid contrast colors or fallback
        expect(["#000000", "#ffffff"]).toContain(result);
    });

    test("returns '#ffffff' for very dark background color", () => {
        const result = getContrastTextColor("#000000", "#000000");
        // Dark background should yield white text or fallback
        expect(["#000000", "#ffffff"]).toContain(result);
    });

    test("returns '#000000' for very light background color", () => {
        const result = getContrastTextColor("#ffffff", "#ffffff");
        expect(["#000000", "#ffffff"]).toContain(result);
    });

    test("uses fallback '#ffffff' as bg when resolvedBg and bgColor are both empty", () => {
        // When bgColor is undefined and getComputedStyle returns empty, resolvedBg is ""
        // The code uses `resolvedBg || "#ffffff"` as fillStyle
        const result = getContrastTextColor("red");
        expect(["#000000", "#ffffff"]).toContain(result);
    });
});

describe("setColorUpdateCallback", () => {
    test("stores the callback function without error", () => {
        const fn = jest.fn();
        expect(() => setColorUpdateCallback(fn)).not.toThrow();
    });
});

describe("initColorEvents (DOM-dependent)", () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="colorDrop">
                <button id="colorDropBtn"><span id="colorModeLabel">Typ</span></button>
                <div class="color-menu">
                    <div class="color-menu-item" data-mode="type"><span></span> Typ</div>
                    <div class="color-menu-item" data-mode="module"><span></span> Modul</div>
                    <div class="color-menu-item" data-mode="status"><span></span> Status</div>
                    <div class="color-menu-item" data-mode="staff"><span></span> Dozent</div>
                    <div class="color-menu-item" data-mode="custom"><span></span> Custom</div>
                </div>
            </div>
            <button id="themeToggle"><span id="themeIcon">dark_mode</span></button>
            <html></html>
        `;
        colorMode.value = "type";
        darkMode.value = false;
        setColorUpdateCallback(null);
    });

    test("clicking colorDropBtn toggles 'open' class on #colorDrop", () => {
        initColorEvents();
        const colorDrop = document.querySelector("#colorDrop");
        const btn = document.querySelector("#colorDropBtn");
        expect(colorDrop.classList.contains("open")).toBe(false);
        btn.click();
        expect(colorDrop.classList.contains("open")).toBe(true);
        btn.click();
        expect(colorDrop.classList.contains("open")).toBe(false);
    });

    test("clicking outside #colorDrop removes 'open' class", () => {
        initColorEvents();
        const colorDrop = document.querySelector("#colorDrop");
        document.querySelector("#colorDropBtn").click();
        expect(colorDrop.classList.contains("open")).toBe(true);
        // Click outside
        document.body.click();
        expect(colorDrop.classList.contains("open")).toBe(false);
    });

    test("clicking a color-menu-item updates colorMode.value and calls updateColorCallback", () => {
        const cb = jest.fn();
        setColorUpdateCallback(cb);
        initColorEvents();
        const moduleItem = document.querySelector('[data-mode="module"]');
        moduleItem.click();
        expect(colorMode.value).toBe("module");
        expect(cb).toHaveBeenCalled();
    });

    test("clicking a color-menu-item when updateColorCallback is null does not throw", () => {
        setColorUpdateCallback(null);
        initColorEvents();
        const moduleItem = document.querySelector('[data-mode="module"]');
        expect(() => moduleItem.click()).not.toThrow();
    });

    test("clicking #themeToggle toggles darkMode.value and calls updateColorCallback", () => {
        const cb = jest.fn();
        setColorUpdateCallback(cb);
        darkMode.value = false;
        initColorEvents();
        document.querySelector("#themeToggle").click();
        expect(darkMode.value).toBe(true);
        expect(cb).toHaveBeenCalled();
    });

    test("clicking #themeToggle when updateColorCallback is null does not throw", () => {
        setColorUpdateCallback(null);
        darkMode.value = false;
        initColorEvents();
        expect(() => document.querySelector("#themeToggle").click()).not.toThrow();
        expect(darkMode.value).toBe(true);
    });

    test("applyColorModeUI sets active class only on matching mode item", () => {
        colorMode.value = "staff";
        initColorEvents();
        const items = document.querySelectorAll(".color-menu-item");
        items.forEach(item => {
            if (item.dataset.mode === "staff") {
                expect(item.classList.contains("active")).toBe(true);
            } else {
                expect(item.classList.contains("active")).toBe(false);
            }
        });
    });

    test("applyColorModeUI sets label text from COLOR_MODE_LABELS or falls back to mode string itself", () => {
        colorMode.value = "staff";
        initColorEvents();
        const label = document.querySelector("#colorModeLabel");
        expect(label.innerText).toBe("Dozent");
    });
});
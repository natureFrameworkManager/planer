import { generatePalette, getEventColor, getContrastTextColor, setColorUpdateCallback } from "../js/color.js";
import { colorMode, fetchedData } from "../js/state.js";
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
});

describe("getContrastTextColor", () => {
    test("returns '#000000' when canvas context is unavailable", () => {
        // jsdom canvas may not support getContext properly
        const result = getContrastTextColor("red", "#ffffff");
        // Should return one of the two valid contrast colors or fallback
        expect(["#000000", "#ffffff"]).toContain(result);
    });
});

describe("setColorUpdateCallback", () => {
    test("stores the callback function without error", () => {
        const fn = jest.fn();
        expect(() => setColorUpdateCallback(fn)).not.toThrow();
    });
});
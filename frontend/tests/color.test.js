import { generatePalette } from "../js/color.js";

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
});
import { TRI, WEEKDAY_LABELS, nextTriState } from "../js/state.js";

describe("nextTriState", () => {
    test("cycles through neutral -> selected -> hidden -> neutral", () => {
        expect(nextTriState(TRI.NEUTRAL)).toBe(TRI.SELECTED);
        expect(nextTriState(TRI.SELECTED)).toBe(TRI.HIDDEN);
        expect(nextTriState(TRI.HIDDEN)).toBe(TRI.NEUTRAL);
    });

    test("falls back to neutral for unknown state", () => {
        expect(nextTriState("unknown")).toBe(TRI.NEUTRAL);
    });
});

describe("WEEKDAY_LABELS", () => {
    test("contains expected German labels", () => {
        expect(WEEKDAY_LABELS[1]).toBe("Montag");
        expect(WEEKDAY_LABELS[5]).toBe("Freitag");
        expect(WEEKDAY_LABELS[7]).toBe("Sonntag");
    });
});
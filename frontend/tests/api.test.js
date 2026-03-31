import {
    fetchAll,
    fetchDegrees,
    fetchEvents,
    fetchLocations,
    fetchModules,
    fetchSemesters,
    fetchStaff,
} from "../js/api.js";
import { jest } from "@jest/globals";

describe("api fetch wrappers", () => {
    beforeEach(() => {
        global.fetch = jest.fn();
    });

    test("fetchDegrees requests expected endpoint", async () => {
        const payload = [{ id: 1, name: "Informatik" }];
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => payload,
        });

        const result = await fetchDegrees();

        expect(global.fetch).toHaveBeenCalledWith(
            "http://127.0.0.1:8000/api/degrees?include_relationships=true&include_semesters=true",
        );
        expect(result).toEqual(payload);
    });

    test("throws on non-ok responses", async () => {
        global.fetch.mockResolvedValue({
            ok: false,
            status: 500,
        });

        await expect(fetchEvents()).rejects.toThrow("API /events?include_relationships=true: 500");
    });

    test("fetchAll calls all API endpoints in order", async () => {
        const responses = [
            [{ id: 1 }],
            [{ id: 2 }],
            [{ id: 3 }],
            [{ id: 4 }],
            [{ id: 5 }],
            [{ id: 6 }],
        ];

        global.fetch.mockImplementation(() => {
            const body = responses.shift();
            return Promise.resolve({ ok: true, json: async () => body });
        });

        const result = await fetchAll();

        expect(result).toEqual([
            [{ id: 1 }],
            [{ id: 2 }],
            [{ id: 3 }],
            [{ id: 4 }],
            [{ id: 5 }],
            [{ id: 6 }],
        ]);

        expect(global.fetch).toHaveBeenNthCalledWith(
            1,
            "http://127.0.0.1:8000/api/degrees?include_relationships=true&include_semesters=true",
        );
        expect(global.fetch).toHaveBeenNthCalledWith(
            2,
            "http://127.0.0.1:8000/api/modules?include_relationships=true",
        );
        expect(global.fetch).toHaveBeenNthCalledWith(
            3,
            "http://127.0.0.1:8000/api/events?include_relationships=true",
        );
        expect(global.fetch).toHaveBeenNthCalledWith(4, "http://127.0.0.1:8000/api/staff");
        expect(global.fetch).toHaveBeenNthCalledWith(5, "http://127.0.0.1:8000/api/locations");
        expect(global.fetch).toHaveBeenNthCalledWith(6, "http://127.0.0.1:8000/api/semesters");
    });

    test("individual fetch helpers delegate correctly", async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => [],
        });

        await fetchModules();
        await fetchStaff();
        await fetchLocations();
        await fetchSemesters();

        expect(global.fetch).toHaveBeenCalledWith("http://127.0.0.1:8000/api/modules?include_relationships=true");
        expect(global.fetch).toHaveBeenCalledWith("http://127.0.0.1:8000/api/staff");
        expect(global.fetch).toHaveBeenCalledWith("http://127.0.0.1:8000/api/locations");
        expect(global.fetch).toHaveBeenCalledWith("http://127.0.0.1:8000/api/semesters");
    });
});
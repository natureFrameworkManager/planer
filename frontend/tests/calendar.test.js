import {
    setCalendarUpdateCallback,
    setOpenPopupCallback,
    getCalendar,
    initCalendar,
    changeCalendarView,
    updateCalendar,
} from "../js/calendar.js";
import { fetchedData, pinnedEvents, view, colorMode, filterState } from "../js/state.js";
import { jest } from "@jest/globals";

function resetState() {
    fetchedData.degrees = [];
    fetchedData.modules = [];
    fetchedData.events = [];
    fetchedData.staff = [];
    fetchedData.locations = [];
    fetchedData.semesters = [];
    fetchedData.states = [
        { key: "ok", name: "Bestätigt" },
        { key: "tok", name: "Dozent ausstehend" },
        { key: "pok", name: "Zeit ausstehend" },
        { key: "alt", name: "Aus Vorsemester" },
        { key: "reserve", name: "Nicht mehr angeboten" },
    ];
    pinnedEvents.clear();
    filterState.degree = null;
    filterState.semester = null;
    filterState.selectedModules.clear();
    filterState.hiddenModules.clear();
    filterState.selectedTypes.clear();
    filterState.hiddenTypes.clear();
    filterState.selectedStaff.clear();
    filterState.hiddenStaff.clear();
    filterState.selectedLocations.clear();
    filterState.hiddenLocations.clear();
    Object.keys(filterState.status).forEach((key) => {
        filterState.status[key] = null;
    });
    view.value = "timeGridWeek";
    colorMode.value = "type";
}

function setupCalendarDOM(withUnknown = false) {
    document.body.innerHTML = `
        <div id="calendar"></div>
        <button class="vbtn" data-view="week">Week</button>
        <button class="vbtn" data-view="day">Day</button>
        <button class="vbtn" data-view="list">List</button>
        ${withUnknown ? '<button class="vbtn" data-view="unknown">Unknown</button>' : ""}
    `;
}

function installFullCalendarMock() {
    const instances = [];
    const Calendar = jest.fn((el, options) => {
        const instance = {
            el,
            options,
            render: jest.fn(),
            changeView: jest.fn(),
            setOption: jest.fn(),
            removeAllEvents: jest.fn(),
            addEventSource: jest.fn(),
        };
        instances.push(instance);
        return instance;
    });

    globalThis.FullCalendar = { Calendar };
    return { Calendar, instances };
}

function seedCalendarData() {
    fetchedData.modules = [
        { id: 10, name: "M1", module_number: "M001", credits: 5, planung: "", language: "de", degree_ids: {}, event_ids: [1, 2] },
        { id: 11, name: "M2", module_number: "M002", credits: 5, planung: "", language: "de", degree_ids: {}, event_ids: [3] },
    ];
    fetchedData.events = [
        {
            id: 1,
            title: "E1",
            type: "Vorlesung",
            weekday: 1,
            start_time: "08:00:00",
            end_time: "10:00:00",
            status: "ok",
            module_ids: [10],
            staff_ids: [],
            location_id: 1,
        },
        {
            id: 2,
            title: "E2",
            type: "Praktikum",
            weekday: 7,
            start_time: "10:00:00",
            end_time: "12:00:00",
            status: "tok",
            module_ids: [10],
            staff_ids: [],
            location_id: 1,
        },
        {
            id: 3,
            title: "E3",
            type: "Seminar",
            weekday: 6,
            start_time: "12:00:00",
            end_time: "14:00:00",
            status: "pok",
            module_ids: [11],
            staff_ids: [],
            location_id: 2,
        },
        {
            id: 4,
            title: "E4",
            type: "Uebung",
            weekday: 5,
            start_time: "14:00:00",
            end_time: "16:00:00",
            status: "alt",
            module_ids: [11],
            staff_ids: [],
            location_id: 3,
        },
    ];
}

describe("setCalendarUpdateCallback / setOpenPopupCallback / getCalendar", () => {
    beforeEach(() => {
        resetState();
        document.body.innerHTML = "";
    });

    test("setCalendarUpdateCallback stores callback without error", () => {
        const cb = jest.fn();
        expect(() => setCalendarUpdateCallback(cb)).not.toThrow();
    });

    test("setOpenPopupCallback stores callback without error", () => {
        const cb = jest.fn();
        expect(() => setOpenPopupCallback(cb)).not.toThrow();
    });

    test("getCalendar returns null when initCalendar has not been called", () => {
        const cal = getCalendar();
        expect(cal).toBeNull();
    });
});

describe("initCalendar", () => {
    let fullCalendarMock;

    beforeEach(() => {
        resetState();
        document.body.innerHTML = "";
        fullCalendarMock = installFullCalendarMock();
    });

    test("does nothing if #calendar element is missing", () => {
        expect(() => initCalendar()).not.toThrow();
        expect(fullCalendarMock.Calendar).not.toHaveBeenCalled();
    });

    test("creates FullCalendar instance and renders", () => {
        setupCalendarDOM();
        initCalendar();

        expect(fullCalendarMock.Calendar).toHaveBeenCalledTimes(1);
        expect(fullCalendarMock.instances[0].render).toHaveBeenCalledTimes(1);
        expect(getCalendar()).toBe(fullCalendarMock.instances[0]);
    });

    test("creates calendar with initial view from view.value", () => {
        view.value = "listWeek";
        setupCalendarDOM();
        initCalendar();

        const options = fullCalendarMock.Calendar.mock.calls[0][1];
        expect(options.initialView).toBe("listWeek");
    });

    test("sets up view toggle buttons and maps week/day/list correctly", () => {
        setupCalendarDOM();
        initCalendar();

        const weekBtn = document.querySelector('.vbtn[data-view="week"]');
        const dayBtn = document.querySelector('.vbtn[data-view="day"]');
        const listBtn = document.querySelector('.vbtn[data-view="list"]');

        dayBtn.click();
        expect(fullCalendarMock.instances[0].changeView).toHaveBeenLastCalledWith("timeGridDay");

        listBtn.click();
        expect(fullCalendarMock.instances[0].changeView).toHaveBeenLastCalledWith("listWeek");

        weekBtn.click();
        expect(fullCalendarMock.instances[0].changeView).toHaveBeenLastCalledWith("timeGridWeek");
    });

    test(".vbtn with unknown data-view does not change calendar view", () => {
        setupCalendarDOM(true);
        initCalendar();

        const unknownBtn = document.querySelector('.vbtn[data-view="unknown"]');
        unknownBtn.click();

        expect(fullCalendarMock.instances[0].changeView).not.toHaveBeenCalled();
    });

    test(".vbtn click sets active class on clicked button and removes from siblings", () => {
        setupCalendarDOM();
        initCalendar();

        const weekBtn = document.querySelector('.vbtn[data-view="week"]');
        const dayBtn = document.querySelector('.vbtn[data-view="day"]');
        const listBtn = document.querySelector('.vbtn[data-view="list"]');

        dayBtn.click();
        expect(dayBtn.classList.contains("active")).toBe(true);
        expect(weekBtn.classList.contains("active")).toBe(false);
        expect(listBtn.classList.contains("active")).toBe(false);
    });

    test("handles missing .vbtn elements gracefully", () => {
        document.body.innerHTML = '<div id="calendar"></div>';
        expect(() => initCalendar()).not.toThrow();
    });

    test("throws when FullCalendar is undefined", () => {
        // @ts-ignore
        globalThis.FullCalendar = undefined;
        setupCalendarDOM();
        expect(() => initCalendar()).toThrow();
    });

    test("getFixedMonday path: Monday returns Monday", () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2026-04-06T12:00:00"));
        setupCalendarDOM();
        initCalendar();

        const initialDate = fullCalendarMock.Calendar.mock.calls[0][1].initialDate;
        expect(initialDate).toBeInstanceOf(Date);
        expect(initialDate.getDay()).toBe(1);
        expect(initialDate.getDate()).toBe(6);
        jest.useRealTimers();
    });

    test("getFixedMonday path: Wednesday returns previous Monday", () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2026-04-08T12:00:00"));
        setupCalendarDOM();
        initCalendar();

        const initialDate = fullCalendarMock.Calendar.mock.calls[0][1].initialDate;
        expect(initialDate.getDay()).toBe(1);
        expect(initialDate.getDate()).toBe(6);
        jest.useRealTimers();
    });

    test("getFixedMonday path: Sunday returns previous Monday", () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2026-04-12T12:00:00"));
        setupCalendarDOM();
        initCalendar();

        const initialDate = fullCalendarMock.Calendar.mock.calls[0][1].initialDate;
        expect(initialDate.getDay()).toBe(1);
        expect(initialDate.getDate()).toBe(6);
        jest.useRealTimers();
    });

    test("getFixedMonday path: Saturday returns previous Monday", () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2026-04-11T12:00:00"));
        setupCalendarDOM();
        initCalendar();

        const initialDate = fullCalendarMock.Calendar.mock.calls[0][1].initialDate;
        expect(initialDate.getDay()).toBe(1);
        expect(initialDate.getDate()).toBe(6);
        jest.useRealTimers();
    });
});

describe("changeCalendarView", () => {
    beforeEach(() => {
        resetState();
        document.body.innerHTML = "";
    });

    test("does nothing if calendarInstance is null (no #calendar element)", () => {
        expect(() => changeCalendarView("listWeek")).not.toThrow();
    });

    test("calendarInstance exists: calls changeView and updates view.value", () => {
        const fullCalendarMock = installFullCalendarMock();
        setupCalendarDOM();
        initCalendar();

        view.value = "timeGridWeek";
        changeCalendarView("listWeek");

        expect(fullCalendarMock.instances[0].changeView).toHaveBeenCalledWith("listWeek");
        expect(view.value).toBe("listWeek");
    });
});

describe("updateCalendar", () => {
    let fullCalendarMock;

    beforeEach(() => {
        resetState();
        document.body.innerHTML = "";
        fullCalendarMock = installFullCalendarMock();
    });

    test("calendarInstance is null: no error, returns early", () => {
        expect(() => updateCalendar()).not.toThrow();
    });

    test("calendarInstance exists: removes old events and adds new source", () => {
        setupCalendarDOM();
        seedCalendarData();
        initCalendar();

        updateCalendar();

        const instance = fullCalendarMock.instances[0];
        expect(instance.removeAllEvents).toHaveBeenCalledTimes(1);
        expect(instance.addEventSource).toHaveBeenCalledTimes(1);
        expect(instance.removeAllEvents.mock.invocationCallOrder[0]).toBeLessThan(
            instance.addEventSource.mock.invocationCallOrder[0]
        );
    });

    test("buildCalendarEvents maps weekdays, classes, fields, and module names", () => {
        setupCalendarDOM();
        seedCalendarData();
        pinnedEvents.add(999999);
        pinnedEvents.add(1);
        initCalendar();

        updateCalendar();

        const source = fullCalendarMock.instances[0].addEventSource.mock.calls[0][0];
        expect(source).toHaveLength(4);

        expect(source[0].id).toBe("1");
        expect(source[0].daysOfWeek).toEqual([1]);
        expect(source[0].classNames).toContain("pinned");
        expect(source[0].extendedProps.moduleNames).toEqual(["M1"]);

        expect(source[1].daysOfWeek).toEqual([0]);
        expect(source[1].extendedProps.moduleNames).toEqual(["M1"]);
        expect(source[1].classNames).toEqual([]);

        expect(source[2].daysOfWeek).toEqual([6]);
        expect(source[3].daysOfWeek).toEqual([5]);

        source.forEach((ev) => {
            expect(ev.extendedProps.typeShort).toBe("?");
            expect(ev.extendedProps.statusColor).toBe("#6b7280");
            expect(ev).toEqual(
                expect.objectContaining({
                    daysOfWeek: expect.any(Array),
                    startTime: expect.any(String),
                    endTime: expect.any(String),
                    extendedProps: expect.any(Object),
                    display: "auto",
                    classNames: expect.any(Array),
                })
            );
        });
    });

    test("buildCalendarEvents uses event color from getEventColor", () => {
        setupCalendarDOM();
        seedCalendarData();
        pinnedEvents.add(999998);
        colorMode.value = "type";
        initCalendar();

        updateCalendar();

        const source = fullCalendarMock.instances[0].addEventSource.mock.calls[0][0];
        expect(source[0].extendedProps.color).toMatch(/^oklch\(/);
    });

    test("empty events array produces empty FullCalendar source", () => {
        setupCalendarDOM();
        pinnedEvents.add(999997);
        fetchedData.modules = [];
        fetchedData.events = [];
        initCalendar();

        updateCalendar();

        const source = fullCalendarMock.instances[0].addEventSource.mock.calls[0][0];
        expect(source).toEqual([]);
    });

    test("event with empty module_ids produces empty moduleNames", () => {
        setupCalendarDOM();
        fetchedData.modules = [{ id: 10, name: "M1", degree_ids: {}, event_ids: [1] }];
        fetchedData.events = [{
            id: 1,
            title: "No Modules",
            type: "Vorlesung",
            weekday: 1,
            start_time: "08:00:00",
            end_time: "10:00:00",
            status: "ok",
            module_ids: [],
            staff_ids: [],
            location_id: 1,
        }];

        initCalendar();
        updateCalendar();

        const source = fullCalendarMock.instances[0].addEventSource.mock.calls[0][0];
        expect(source[0].extendedProps.moduleNames).toEqual([]);
    });

    test("non-existent module ids are filtered out from moduleNames", () => {
        setupCalendarDOM();
        fetchedData.modules = [{ id: 10, name: "M1", degree_ids: {}, event_ids: [1] }];
        fetchedData.events = [{
            id: 1,
            title: "Unknown Module",
            type: "Vorlesung",
            weekday: 1,
            start_time: "08:00:00",
            end_time: "10:00:00",
            status: "ok",
            module_ids: [999],
            staff_ids: [],
            location_id: 1,
        }];

        initCalendar();
        updateCalendar();

        const source = fullCalendarMock.instances[0].addEventSource.mock.calls[0][0];
        expect(source[0].extendedProps.moduleNames).toEqual([]);
    });
});

describe("renderEventContent and eventClick via calendar options", () => {
    let fullCalendarMock;

    beforeEach(() => {
        resetState();
        document.body.innerHTML = "";
        fullCalendarMock = installFullCalendarMock();
        setupCalendarDOM();
        initCalendar();
    });

    test("renderEventContent creates title/meta/dot/pin and pin click toggles pinned with callback", () => {
        const updateCb = jest.fn();
        setCalendarUpdateCallback(updateCb);

        const eventContent = fullCalendarMock.Calendar.mock.calls[0][1].eventContent;
        const rendered = eventContent({
            event: {
                id: "99",
                title: "Test Event",
                extendedProps: {
                    color: "#123456",
                    statusColor: "#abcdef",
                    moduleNames: ["Module A"],
                    typeShort: "?",
                },
            },
        });

        const root = rendered.domNodes[0];
        expect(root.querySelector(".ev-title").textContent).toContain("Test Event");
        expect(root.querySelector(".ev-meta").textContent).toBe("Module A");
        expect(root.querySelector(".sdot").style.background).toBe("rgb(171, 205, 239)");
        expect(root.querySelector(".ev-pin-icon")).toBeTruthy();

        root.querySelector(".ev-pin-icon").dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(pinnedEvents.has(99)).toBe(true);
        expect(updateCb).toHaveBeenCalledTimes(1);

        root.querySelector(".ev-pin-icon").dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(pinnedEvents.has(99)).toBe(false);
        expect(updateCb).toHaveBeenCalledTimes(2);
    });

    test("renderEventContent sets CSS variables for color and contrast", () => {
        const eventContent = fullCalendarMock.Calendar.mock.calls[0][1].eventContent;
        const rendered = eventContent({
            event: {
                id: "77",
                title: "Color Test",
                extendedProps: {
                    color: "#112233",
                    statusColor: "#6b7280",
                    moduleNames: ["M"],
                    typeShort: "VL",
                },
            },
        });

        const root = rendered.domNodes[0];
        expect(root.style.getPropertyValue("--ev-background")).toBe("#112233");
        expect(root.style.getPropertyValue("--ev-color")).toBeTruthy();
    });

    test("renderEventContent with empty moduleNames omits ev-meta", () => {
        const eventContent = fullCalendarMock.Calendar.mock.calls[0][1].eventContent;
        const rendered = eventContent({
            event: {
                id: "10",
                title: "No Module",
                extendedProps: {
                    color: "#333333",
                    statusColor: "#6b7280",
                    moduleNames: [],
                    typeShort: "?",
                },
            },
        });

        const root = rendered.domNodes[0];
        expect(root.querySelector(".ev-meta")).toBeNull();
    });

    test("pin click stopPropagation prevents parent click handler", () => {
        const eventContent = fullCalendarMock.Calendar.mock.calls[0][1].eventContent;
        const rendered = eventContent({
            event: {
                id: "101",
                title: "Stop Prop",
                extendedProps: {
                    color: "#111111",
                    statusColor: "#6b7280",
                    moduleNames: ["M"],
                    typeShort: "?",
                },
            },
        });

        const root = rendered.domNodes[0];
        const parentClick = jest.fn();
        root.addEventListener("click", parentClick);
        root.querySelector(".ev-pin-icon").dispatchEvent(new MouseEvent("click", { bubbles: true }));

        expect(parentClick).not.toHaveBeenCalled();
    });

    test("handleEventClick calls popup callback with numeric id and preventDefault", () => {
        const openCb = jest.fn();
        setOpenPopupCallback(openCb);
        const eventClick = fullCalendarMock.Calendar.mock.calls[0][1].eventClick;
        const preventDefault = jest.fn();

        eventClick({ event: { id: "42" }, jsEvent: { preventDefault } });

        expect(preventDefault).toHaveBeenCalledTimes(1);
        expect(openCb).toHaveBeenCalledWith(42);
    });

    test("handleEventClick with null callback does nothing but still preventDefault", () => {
        setOpenPopupCallback(null);
        const eventClick = fullCalendarMock.Calendar.mock.calls[0][1].eventClick;
        const preventDefault = jest.fn();

        expect(() => eventClick({ event: { id: "7" }, jsEvent: { preventDefault } })).not.toThrow();
        expect(preventDefault).toHaveBeenCalledTimes(1);
    });

    test("onPinToggle with null update callback does not throw", () => {
        setCalendarUpdateCallback(null);
        const eventContent = fullCalendarMock.Calendar.mock.calls[0][1].eventContent;
        const rendered = eventContent({
            event: {
                id: "300",
                title: "No callback",
                extendedProps: {
                    color: "#101010",
                    statusColor: "#6b7280",
                    moduleNames: ["M"],
                    typeShort: "?",
                },
            },
        });

        expect(() => {
            rendered.domNodes[0]
                .querySelector(".ev-pin-icon")
                .dispatchEvent(new MouseEvent("click", { bubbles: true }));
        }).not.toThrow();
    });

    test("rendered title contains event title", () => {
        const eventContent = fullCalendarMock.Calendar.mock.calls[0][1].eventContent;
        const rendered = eventContent({
            event: {
                id: "88",
                title: "Rendered Title",
                extendedProps: {
                    color: "#000000",
                    statusColor: "#6b7280",
                    moduleNames: ["M"],
                    typeShort: "VL",
                },
            },
        });

        expect(rendered.domNodes[0].querySelector(".ev-title")?.textContent).toContain("Rendered Title");
    });
});

describe("calendar.js with mocked color module", () => {
    test("falls back to #3B82F6 when getEventColor returns falsy", async () => {
        jest.resetModules();
        document.body.innerHTML = `
            <div id="calendar"></div>
            <button class="vbtn" data-view="week">Week</button>
        `;

        const instances = [];
        globalThis.FullCalendar = {
            Calendar: jest.fn((el, options) => {
                const instance = {
                    el,
                    options,
                    render: jest.fn(),
                    changeView: jest.fn(),
                    setOption: jest.fn(),
                    removeAllEvents: jest.fn(),
                    addEventSource: jest.fn(),
                };
                instances.push(instance);
                return instance;
            }),
        };

        const localFetchedData = {
            degrees: [],
            modules: [],
            events: [
                {
                    id: 1,
                    title: "E1",
                    type: "Vorlesung",
                    weekday: 1,
                    start_time: "08:00:00",
                    end_time: "10:00:00",
                    status: "ok",
                    module_ids: [999],
                    staff_ids: [],
                    location_id: 1,
                },
            ],
            staff: [],
            locations: [],
            semesters: [],
            states: [{ key: "ok", name: "OK" }],
        };

        jest.unstable_mockModule("../js/color.js", () => ({
            getContrastTextColor: jest.fn(() => "#ffffff"),
            getEventColor: jest.fn(() => undefined),
        }));
        jest.unstable_mockModule("../js/filters.js", () => ({
            getEvents: jest.fn(() => localFetchedData.events),
        }));
        jest.unstable_mockModule("../js/sharing_storage.js", () => ({
            saveState: jest.fn(),
        }));
        jest.unstable_mockModule("../js/state.js", () => ({
            fetchedData: localFetchedData,
            pinnedEvents: new Set(),
            view: { value: "timeGridWeek" },
        }));

        const mod = await import("../js/calendar.js");
        mod.initCalendar();
        mod.updateCalendar();

        const source = instances[0].addEventSource.mock.calls[0][0];
        expect(source[0].extendedProps.color).toBe("#3B82F6");
        expect(source[0].extendedProps.moduleNames).toEqual([]);
    });

    test("throws when getContrastTextColor is missing", async () => {
        jest.resetModules();
        document.body.innerHTML = `
            <div id="calendar"></div>
            <button class="vbtn" data-view="week">Week</button>
        `;

        globalThis.FullCalendar = {
            Calendar: jest.fn((el, options) => ({
                el,
                options,
                render: jest.fn(),
                changeView: jest.fn(),
                setOption: jest.fn(),
                removeAllEvents: jest.fn(),
                addEventSource: jest.fn(),
            })),
        };

        jest.unstable_mockModule("../js/color.js", () => ({
            getContrastTextColor: undefined,
            getEventColor: jest.fn(() => "#123456"),
        }));
        jest.unstable_mockModule("../js/filters.js", () => ({
            getEvents: jest.fn(() => []),
        }));
        jest.unstable_mockModule("../js/sharing_storage.js", () => ({
            saveState: jest.fn(),
        }));
        jest.unstable_mockModule("../js/state.js", () => ({
            fetchedData: { modules: [] },
            pinnedEvents: new Set(),
            view: { value: "timeGridWeek" },
        }));

        const mod = await import("../js/calendar.js");
        mod.initCalendar();
        const options = globalThis.FullCalendar.Calendar.mock.calls[0][1];
        expect(() => {
            options.eventContent({
                event: {
                    id: "1",
                    title: "E",
                    extendedProps: { color: "#123456", statusColor: "#6b7280", moduleNames: [], typeShort: "?" },
                },
            });
        }).toThrow();
    });
});

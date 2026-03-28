from collections import defaultdict
from datetime import time

from fastapi import FastAPI, HTTPException, Query
from sqlmodel import select
from sqlalchemy.orm import selectinload, aliased
from contextlib import asynccontextmanager

from database.database import create_db_and_tables, SessionDep
from database.models import (
    Module, Event, Staff, Location, Degree, Semester,
    ModuleDegreeLink, ModuleEventLink, EventStaffLink,
    Weekday, EventType, Status,
)
from database.parse import parse_and_populate
from database.schemas import (
    ModuleResponse, ModuleWithRelationshipsResponse, ModuleDetailResponse,
    StaffResponse, StaffWithRelationshipsResponse, StaffDetailResponse,
    EventResponse, EventWithRelationshipsResponse, EventDetailResponse,
    LocationResponse, LocationWithRelationshipsResponse, LocationDetailResponse,
    DegreeResponse, DegreeWithRelationshipsResponse, DegreeDetailResponse,
    DegreeInModuleResponse, ModuleInDegreeResponse,
    SemesterResponse,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    parse_and_populate()
    yield

app = FastAPI(
    lifespan=lifespan,
    title="Uni Planer API",
    summary="University Schedule API",
    description="API for accessing university schedule data including modules, events, staff, locations, degrees, and semesters.",
    version="1.0.0",
)


# --- Modules ---

@app.get("/modules", response_model=list[ModuleWithRelationshipsResponse] | list[ModuleResponse], summary="List all modules")
def get_modules(
    session: SessionDep,
    include_relationships: bool = False,
    name: str | None = Query(None, description="Filter by module name (case-insensitive substring match)"),
    module_number: str | None = Query(None, description="Filter by module number (case-insensitive substring match)"),
    language: str | None = Query(None, description="Filter by language (case-insensitive substring match)"),
    planung: str | None = Query(None, description="Filter by planning department (case-insensitive substring match)"),
    credits_min: int | None = Query(None, description="Filter by minimum credits (inclusive)"),
    credits_max: int | None = Query(None, description="Filter by maximum credits (inclusive)"),
    degree_id: int | None = Query(None, description="Filter by associated degree ID"),
    semester: int | None = Query(None, description="Filter by semester number (used with degree_id)"),
):
    """
    Retrieve a list of all modules with optional filtering.

    All filters are combined with **AND**.

    - **include_relationships=false** (default): Returns flat module data only.
    - **include_relationships=true**: Each module also includes `degree_ids` and `event_ids`.
    """
    query = select(Module)
    if name is not None:
        query = query.where(Module.name.ilike(f"%{name}%"))  # type: ignore[union-attr]
    if module_number is not None:
        query = query.where(Module.module_number.ilike(f"%{module_number}%"))  # type: ignore[union-attr]
    if language is not None:
        query = query.where(Module.language.ilike(f"%{language}%"))  # type: ignore[union-attr]
    if planung is not None:
        query = query.where(Module.planung.ilike(f"%{planung}%"))  # type: ignore[union-attr]
    if credits_min is not None:
        query = query.where(Module.credits >= credits_min)
    if credits_max is not None:
        query = query.where(Module.credits <= credits_max)
    if degree_id is not None:
        query = query.join(ModuleDegreeLink).where(ModuleDegreeLink.degree_id == degree_id)
        if semester is not None:
            query = query.where(ModuleDegreeLink.semester == semester)
    elif semester is not None:
        query = query.join(ModuleDegreeLink).where(ModuleDegreeLink.semester == semester)

    if include_relationships:
        modules = session.exec(
            query.options(selectinload(Module.degrees), selectinload(Module.events))
        ).all()
        return [
            ModuleWithRelationshipsResponse(
                **m.model_dump(),
                degree_ids=list({d.id for d in m.degrees if d.id is not None}),
                event_ids=[e.id for e in m.events if e.id is not None],
            )
            for m in modules
        ]
    return [ModuleResponse.model_validate(m) for m in session.exec(query).all()]


@app.get("/modules/{module_id}", response_model=ModuleDetailResponse | ModuleResponse, summary="Get a module by ID")
def get_module(module_id: int, session: SessionDep, include_relationships: bool = False):
    """
    Retrieve a single module by its ID.

    - **include_relationships=false** (default): Returns flat module data only.
    - **include_relationships=true**: Also includes full `degrees` and `events` objects.

    Returns **404** if the module does not exist.
    """
    if include_relationships:
        module = session.exec(
            select(Module).where(Module.id == module_id)
            .options(selectinload(Module.degrees), selectinload(Module.events))
        ).first()
    else:
        module = session.get(Module, module_id)

    if module is None:
        raise HTTPException(status_code=404, detail="Module not found")

    if include_relationships:
        links = session.exec(
            select(ModuleDegreeLink).where(ModuleDegreeLink.module_id == module.id)
        ).all()
        degree_links: dict[int, list[ModuleDegreeLink]] = defaultdict(list)
        for link in links:
            degree_links[link.degree_id].append(link)
        seen_degree_ids: set[int] = set()
        unique_degrees = []
        for d in module.degrees:
            if d.id not in seen_degree_ids:
                seen_degree_ids.add(d.id)
                unique_degrees.append(d)
        return ModuleDetailResponse(
            **module.model_dump(),
            degrees=[
                DegreeInModuleResponse(
                    **d.model_dump(),
                    semesters=sorted(lnk.semester for lnk in degree_links.get(d.id, []) if lnk.semester is not None),
                    note=next((lnk.note for lnk in degree_links.get(d.id, []) if lnk.note is not None), None),
                )
                for d in unique_degrees
            ],
            events=[EventResponse.model_validate(e) for e in module.events],
        )
    return ModuleResponse.model_validate(module)


# --- Events ---

@app.get("/events", response_model=list[EventWithRelationshipsResponse] | list[EventResponse], summary="List all events")
def get_events(
    session: SessionDep,
    include_relationships: bool = False,
    title: str | None = Query(None, description="Filter by event title (case-insensitive substring match)"),
    weekday: list[Weekday] | None = Query(None, description="Filter by weekday(s) (1=Monday .. 7=Sunday). Multiple values combined with OR."),
    event_type: list[EventType] | None = Query(None, alias="type", description="Filter by event type(s). Multiple values combined with OR."),
    status: list[Status] | None = Query(None, description="Filter by event status(es). Multiple values combined with OR."),
    location_id: int | None = Query(None, description="Filter by location ID"),
    start_time_min: time | None = Query(None, description="Filter events starting at or after this time (HH:MM)"),
    start_time_max: time | None = Query(None, description="Filter events starting at or before this time (HH:MM)"),
    end_time_min: time | None = Query(None, description="Filter events ending at or after this time (HH:MM)"),
    end_time_max: time | None = Query(None, description="Filter events ending at or before this time (HH:MM)"),
    module_id: list[int] | None = Query(None, description="Filter by associated module ID(s). Multiple values combined with OR."),
    staff_id: list[int] | None = Query(None, description="Filter by associated staff ID(s). Multiple values combined with OR."),
    degree_id: list[int] | None = Query(None, description="Filter by associated degree ID(s) (via modules). Multiple values combined with OR."),
    semester: int | None = Query(None, description="Filter by semester number (used with degree_id filter)"),
):
    """
    Retrieve a list of all scheduled events with optional filtering.

    All filters are combined with **AND**. List parameters (weekday, type, status, module_id, staff_id, degree_id) match if any value matches (OR within the list).

    - **include_relationships=false** (default): Returns flat event data only.
    - **include_relationships=true**: Each event also includes `module_ids` and `staff_ids`.
    """
    query = select(Event)
    if title is not None:
        query = query.where(Event.title.ilike(f"%{title}%"))  # type: ignore[union-attr]
    if weekday is not None:
        query = query.where(Event.weekday.in_(weekday))  # type: ignore[union-attr]
    if event_type is not None:
        query = query.where(Event.type.in_(event_type))  # type: ignore[union-attr]
    if status is not None:
        query = query.where(Event.status.in_(status))  # type: ignore[union-attr]
    if location_id is not None:
        query = query.where(Event.location_id == location_id)
    if start_time_min is not None:
        query = query.where(Event.start_time >= start_time_min)
    if start_time_max is not None:
        query = query.where(Event.start_time <= start_time_max)
    if end_time_min is not None:
        query = query.where(Event.end_time >= end_time_min)
    if end_time_max is not None:
        query = query.where(Event.end_time <= end_time_max)
    if module_id is not None:
        query = query.join(ModuleEventLink).where(ModuleEventLink.module_id.in_(module_id))  # type: ignore[union-attr]
    if staff_id is not None:
        query = query.join(EventStaffLink).where(EventStaffLink.staff_id.in_(staff_id))  # type: ignore[union-attr]
    if degree_id is not None:
        mel_alias = aliased(ModuleEventLink)
        query = (
            query
            .join(mel_alias, mel_alias.event_id == Event.id)
            .join(ModuleDegreeLink, ModuleDegreeLink.module_id == mel_alias.module_id)
            .where(ModuleDegreeLink.degree_id.in_(degree_id))  # type: ignore[union-attr]
        )
        if semester is not None:
            query = query.where(ModuleDegreeLink.semester == semester)
    elif semester is not None:
        mel_alias = aliased(ModuleEventLink)
        query = (
            query
            .join(mel_alias, mel_alias.event_id == Event.id)
            .join(ModuleDegreeLink, ModuleDegreeLink.module_id == mel_alias.module_id)
            .where(ModuleDegreeLink.semester == semester)
        )
    query = query.distinct()

    if include_relationships:
        events = session.exec(
            query.options(selectinload(Event.module), selectinload(Event.staff))
        ).all()
        return [
            EventWithRelationshipsResponse(
                **e.model_dump(),
                module_ids=[m.id for m in e.module if m.id is not None],
                staff_ids=[s.id for s in e.staff if s.id is not None],
            )
            for e in events
        ]
    return [EventResponse.model_validate(e) for e in session.exec(query).all()]


@app.get("/events/{event_id}", response_model=EventDetailResponse | EventResponse, summary="Get an event by ID")
def get_event(event_id: int, session: SessionDep, include_relationships: bool = False):
    """
    Retrieve a single event by its ID.

    - **include_relationships=false** (default): Returns flat event data only.
    - **include_relationships=true**: Also includes full `module` and `staff` objects.

    Returns **404** if the event does not exist.
    """
    if include_relationships:
        event = session.exec(
            select(Event).where(Event.id == event_id)
            .options(selectinload(Event.module), selectinload(Event.staff))
        ).first()
    else:
        event = session.get(Event, event_id)

    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")

    if include_relationships:
        return EventDetailResponse(
            **event.model_dump(),
            module=[ModuleResponse.model_validate(m) for m in event.module],
            staff=[StaffResponse.model_validate(s) for s in event.staff],
        )
    return EventResponse.model_validate(event)


# --- Staff ---

@app.get("/staff", response_model=list[StaffWithRelationshipsResponse] | list[StaffResponse], summary="List all staff members")
def get_staff(
    session: SessionDep,
    include_relationships: bool = False,
    name: str | None = Query(None, description="Filter by staff name (case-insensitive substring match)"),
    event_id: int | None = Query(None, description="Filter by associated event ID"),
):
    """
    Retrieve a list of all staff members with optional filtering.

    All filters are combined with **AND**.

    - **include_relationships=false** (default): Returns flat staff data only.
    - **include_relationships=true**: Each staff member also includes `event_ids`.
    """
    query = select(Staff)
    if name is not None:
        query = query.where(Staff.name.ilike(f"%{name}%"))  # type: ignore[union-attr]
    if event_id is not None:
        query = query.join(EventStaffLink).where(EventStaffLink.event_id == event_id)

    if include_relationships:
        staff = session.exec(
            query.options(selectinload(Staff.events))
        ).all()
        return [
            StaffWithRelationshipsResponse(
                **s.model_dump(),
                event_ids=[e.id for e in s.events if e.id is not None],
            )
            for s in staff
        ]
    return [StaffResponse.model_validate(s) for s in session.exec(query).all()]


@app.get("/staff/{staff_id}", response_model=StaffDetailResponse | StaffResponse, summary="Get a staff member by ID")
def get_staff_member(staff_id: int, session: SessionDep, include_relationships: bool = False):
    """
    Retrieve a single staff member by their ID.

    - **include_relationships=false** (default): Returns flat staff data only.
    - **include_relationships=true**: Also includes full `events` objects.

    Returns **404** if the staff member does not exist.
    """
    if include_relationships:
        staff_member = session.exec(
            select(Staff).where(Staff.id == staff_id)
            .options(selectinload(Staff.events))
        ).first()
    else:
        staff_member = session.get(Staff, staff_id)

    if staff_member is None:
        raise HTTPException(status_code=404, detail="Staff member not found")

    if include_relationships:
        return StaffDetailResponse(
            **staff_member.model_dump(),
            events=[EventResponse.model_validate(e) for e in staff_member.events],
        )
    return StaffResponse.model_validate(staff_member)


# --- Locations ---

@app.get("/locations", response_model=list[LocationWithRelationshipsResponse] | list[LocationResponse], summary="List all locations")
def get_locations(
    session: SessionDep,
    include_relationships: bool = False,
    name: str | None = Query(None, description="Filter by location name (case-insensitive substring match)"),
):
    """
    Retrieve a list of all locations (rooms/buildings) with optional filtering.

    All filters are combined with **AND**.

    - **include_relationships=false** (default): Returns flat location data only.
    - **include_relationships=true**: Each location also includes `event_ids`.
    """
    query = select(Location)
    if name is not None:
        query = query.where(Location.name.ilike(f"%{name}%"))  # type: ignore[union-attr]

    if include_relationships:
        locations = session.exec(
            query.options(selectinload(Location.events))
        ).all()
        return [
            LocationWithRelationshipsResponse(
                **l.model_dump(),
                event_ids=[e.id for e in l.events if e.id is not None],
            )
            for l in locations
        ]
    return [LocationResponse.model_validate(l) for l in session.exec(query).all()]


@app.get("/locations/{location_id}", response_model=LocationDetailResponse | LocationResponse, summary="Get a location by ID")
def get_location(location_id: int, session: SessionDep, include_relationships: bool = False):
    """
    Retrieve a single location by its ID.

    - **include_relationships=false** (default): Returns flat location data only.
    - **include_relationships=true**: Also includes full `events` objects.

    Returns **404** if the location does not exist.
    """
    if include_relationships:
        location = session.exec(
            select(Location).where(Location.id == location_id)
            .options(selectinload(Location.events))
        ).first()
    else:
        location = session.get(Location, location_id)

    if location is None:
        raise HTTPException(status_code=404, detail="Location not found")

    if include_relationships:
        return LocationDetailResponse(
            **location.model_dump(),
            events=[EventResponse.model_validate(e) for e in location.events],
        )
    return LocationResponse.model_validate(location)


# --- Degrees ---

@app.get("/degrees", response_model=list[DegreeWithRelationshipsResponse] | list[DegreeResponse], summary="List all degrees")
def get_degrees(
    session: SessionDep,
    include_relationships: bool = False,
    include_semesters: bool = False,
    name: str | None = Query(None, description="Filter by degree name (case-insensitive substring match)"),
    module_id: int | None = Query(None, description="Filter by associated module ID"),
):
    """
    Retrieve a list of all degree programs with optional filtering.

    All filters are combined with **AND**.

    - **include_relationships=false** (default): Returns flat degree data only.
    - **include_relationships=true**: Each degree also includes `module_ids`.
    - **include_semesters=true**: Includes `semesters` (list of all semesters for the degree).
    """
    query = select(Degree)
    if name is not None:
        query = query.where(Degree.name.ilike(f"%{name}%"))  # type: ignore[union-attr]
    if module_id is not None:
        query = query.join(ModuleDegreeLink).where(ModuleDegreeLink.module_id == module_id)

    if include_relationships or include_semesters:
        degrees = session.exec(
            query.options(selectinload(Degree.modules))
        ).all()
        return [
            DegreeWithRelationshipsResponse(
                **d.model_dump(),
                module_ids=list({m.id for m in d.modules if m.id is not None}) if include_relationships else [],
                semesters=sorted(set(
                    lnk.semester for lnk in session.exec(
                        select(ModuleDegreeLink).where(ModuleDegreeLink.degree_id == d.id)
                    ).all()
                    if lnk.semester is not None and isinstance(lnk.semester, int)
                )) if include_semesters else [],
            )
            for d in degrees
        ]
    return [DegreeResponse.model_validate(d) for d in session.exec(query).all()]


@app.get("/degrees/{degree_id}", response_model=DegreeDetailResponse | DegreeResponse, summary="Get a degree by ID")
def get_degree(degree_id: int, session: SessionDep, include_relationships: bool = False, include_semesters: bool = False):
    """
    Retrieve a single degree program by its ID.

    - **include_relationships=false** (default): Returns flat degree data only.
    - **include_relationships=true**: Also includes full `modules` objects.
    - **include_semesters=true**: Includes `semesters` (list of all semesters for the degree).

    Returns **404** if the degree does not exist.
    """
    if include_relationships or include_semesters:
        degree = session.exec(
            select(Degree).where(Degree.id == degree_id)
            .options(selectinload(Degree.modules))
        ).first()
    else:
        degree = session.get(Degree, degree_id)

    if degree is None:
        raise HTTPException(status_code=404, detail="Degree not found")

    if include_relationships or include_semesters:
        links = session.exec(
            select(ModuleDegreeLink).where(ModuleDegreeLink.degree_id == degree.id)
        ).all()
        module_links: dict[int, list[ModuleDegreeLink]] = defaultdict(list)
        for link in links:
            module_links[link.module_id].append(link)
        seen_module_ids: set[int] = set()
        unique_modules = []
        for m in degree.modules:
            if m.id not in seen_module_ids:
                seen_module_ids.add(m.id)
                unique_modules.append(m)
        return DegreeDetailResponse(
            **degree.model_dump(),
            modules=[
                ModuleInDegreeResponse(
                    **m.model_dump(),
                    semesters=sorted(lnk.semester for lnk in module_links.get(m.id, []) if lnk.semester is not None),
                    note=next((lnk.note for lnk in module_links.get(m.id, []) if lnk.note is not None), None),
                )
                for m in unique_modules
            ] if include_relationships else [],
            semesters=sorted(set(
                lnk.semester for lnk in links
                if lnk.semester is not None and isinstance(lnk.semester, int)
            )) if include_semesters else [],
        )
    return DegreeResponse.model_validate(degree)


# --- Semesters (no relationships) ---

@app.get("/semesters", response_model=list[SemesterResponse], summary="List all semesters")
def get_semesters(
    session: SessionDep,
    name: str | None = Query(None, description="Filter by semester name (case-insensitive substring match)"),
):
    """Retrieve a list of all semesters with optional filtering. All filters are combined with **AND**."""
    query = select(Semester)
    if name is not None:
        query = query.where(Semester.name.ilike(f"%{name}%"))  # type: ignore[union-attr]
    return [SemesterResponse.model_validate(s) for s in session.exec(query).all()]


@app.get("/semesters/{semester_id}", response_model=SemesterResponse, summary="Get a semester by ID")
def get_semester(semester_id: int, session: SessionDep):
    """
    Retrieve a single semester by its ID.

    Returns **404** if the semester does not exist.
    """
    semester = session.get(Semester, semester_id)
    if semester is None:
        raise HTTPException(status_code=404, detail="Semester not found")
    return SemesterResponse.model_validate(semester)
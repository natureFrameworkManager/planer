from collections import defaultdict
from datetime import time
from pathlib import Path

from fastapi import APIRouter, FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlmodel import select
from sqlalchemy.orm import aliased
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

prefix_router = APIRouter(prefix="/api")


# --- Modules ---

@prefix_router.get("/modules", response_model=list[ModuleWithRelationshipsResponse] | list[ModuleResponse], summary="List all modules")
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
    semester: int | None = Query(None, description="Filter by degree semester number"),
):
    """
    Retrieve a list of all modules with optional filtering.

    All filters are combined with **AND**.

    - **include_relationships=false** (default): Returns flat module data only.
    - **include_relationships=true**: Each module also includes `degree_ids` (with semester numbers or empty arrays) and `event_ids`.
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
        modules = session.exec(query.distinct()).all()
        module_ids = [m.id for m in modules]
        degree_rows = session.exec(
            select(ModuleDegreeLink.module_id, ModuleDegreeLink.degree_id, ModuleDegreeLink.semester, ModuleDegreeLink.note)
            .where(ModuleDegreeLink.module_id.in_(module_ids)) # type: ignore
            .where(ModuleDegreeLink.degree_id.is_not(None)) # type: ignore
        ).all()
        event_rows = session.exec(
            select(ModuleEventLink.module_id, ModuleEventLink.event_id)
            .where(ModuleEventLink.module_id.in_(module_ids)) # type: ignore
            .where(ModuleEventLink.event_id.is_not(None)) # type: ignore
        ).all()
        degree_map: dict[int, dict[int, list[int]]] = defaultdict(lambda: defaultdict(list))
        for module_id, degree_id, semester_num, note in degree_rows:
            if degree_id not in degree_map[module_id]:
                degree_map[module_id][degree_id] = []
            if semester_num is not None:
                degree_map[module_id][degree_id].append(semester_num)
        event_map: dict[int, list[int]] = defaultdict(list)
        for module_id, event_id in event_rows:
            if module_id is not None and event_id is not None:
                event_map[module_id].append(event_id)
        return [
            ModuleWithRelationshipsResponse(
                **module.model_dump(),
                degree_ids=degree_map.get(module.id, {}),
                event_ids=event_map.get(module.id, []),
            )
            for module in modules
            if module.id is not None
        ]
    return [ModuleResponse.model_validate(module) for module in session.exec(query).all()]


@prefix_router.get("/modules/{module_id}", response_model=ModuleDetailResponse | ModuleResponse, summary="Get a module by ID")
def get_module(module_id: int, session: SessionDep, include_relationships: bool = False):
    """
    Retrieve a single module by its ID.

    - **include_relationships=false** (default): Returns flat module data only.
    - **include_relationships=true**: Also includes full `degrees` and `events` objects.

    Returns **404** if the module does not exist.
    """
    module = session.get(Module, module_id)

    if module is None:
        raise HTTPException(status_code=404, detail="Module not found")

    if include_relationships:
        links = session.exec(
            select(ModuleDegreeLink).where(ModuleDegreeLink.module_id == module_id)
        ).all()
        degree_links: dict[int, list[ModuleDegreeLink]] = defaultdict(list)
        for link in links:
            degree_links[link.degree_id].append(link)
        degrees = session.exec(
            select(Degree).where(Degree.id.in_(degree_links.keys()))  # type: ignore[union-attr]
        ).all()
        events = session.exec(
            select(Event).join(ModuleEventLink).where(ModuleEventLink.module_id == module_id)
        ).all()
        return ModuleDetailResponse(
            **module.model_dump(),
            degrees=[
                DegreeInModuleResponse(
                    **d.model_dump(),
                    semesters=sorted(lnk.semester for lnk in degree_links.get(d.id, []) if lnk.semester is not None),
                    note=next((lnk.note for lnk in degree_links.get(d.id, []) if lnk.note is not None), None),
                )
                for d in degrees 
                if d.id is not None
            ],
            events=[EventResponse.model_validate(e) for e in events],
        )
    return ModuleResponse.model_validate(module)


# --- Events ---

@prefix_router.get("/events", response_model=list[EventWithRelationshipsResponse] | list[EventResponse], summary="List all events")
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
            .join(mel_alias, mel_alias.event_id == Event.id)  # type: ignore[arg-type]
            .join(ModuleDegreeLink, ModuleDegreeLink.module_id == mel_alias.module_id)  # type: ignore[arg-type]
            .where(ModuleDegreeLink.degree_id.in_(degree_id))  # type: ignore[union-attr]
        )
        if semester is not None:
            query = query.where(ModuleDegreeLink.semester == semester)
    elif semester is not None:
        mel_alias = aliased(ModuleEventLink)
        query = (
            query
            .join(mel_alias, mel_alias.event_id == Event.id)  # type: ignore[arg-type]
            .join(ModuleDegreeLink, ModuleDegreeLink.module_id == mel_alias.module_id)  # type: ignore[arg-type]
            .where(ModuleDegreeLink.semester == semester)
        )
    query = query.distinct()

    if include_relationships:
        events = session.exec(query).all()
        event_ids = [e.id for e in events]
        module_rows = session.exec(
            select(ModuleEventLink.event_id, ModuleEventLink.module_id)
            .where(ModuleEventLink.event_id.in_(event_ids))  # type: ignore
        ).all()
        staff_rows = session.exec(
            select(EventStaffLink.event_id, EventStaffLink.staff_id)
            .where(EventStaffLink.event_id.in_(event_ids))  # type: ignore
        ).all()
        module_map: dict[int, list[int]] = defaultdict(list)
        for eid, mid in module_rows:
            if eid is not None and mid is not None:
                module_map[eid].append(mid)
        staff_map: dict[int, list[int]] = defaultdict(list)
        for eid, sid in staff_rows:
            if eid is not None and sid is not None:
                staff_map[eid].append(sid)
        return [
            EventWithRelationshipsResponse(
                **e.model_dump(),
                module_ids=module_map.get(e.id, []),
                staff_ids=staff_map.get(e.id, []),
            )
            for e in events
            if e.id is not None
        ]
    return [EventResponse.model_validate(e) for e in session.exec(query).all()]


@prefix_router.get("/events/{event_id}", response_model=EventDetailResponse | EventResponse, summary="Get an event by ID")
def get_event(event_id: int, session: SessionDep, include_relationships: bool = False):
    """
    Retrieve a single event by its ID.

    - **include_relationships=false** (default): Returns flat event data only.
    - **include_relationships=true**: Also includes full `module` and `staff` objects.

    Returns **404** if the event does not exist.
    """
    event = session.get(Event, event_id)

    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")

    if include_relationships:
        modules = session.exec(
            select(Module).join(ModuleEventLink).where(ModuleEventLink.event_id == event_id)
        ).all()
        staff = session.exec(
            select(Staff).join(EventStaffLink).where(EventStaffLink.event_id == event_id)
        ).all()
        return EventDetailResponse(
            **event.model_dump(),
            module=[ModuleResponse.model_validate(m) for m in modules],
            staff=[StaffResponse.model_validate(s) for s in staff],
        )
    return EventResponse.model_validate(event)


# --- Staff ---

@prefix_router.get("/staff", response_model=list[StaffWithRelationshipsResponse] | list[StaffResponse], summary="List all staff members")
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
        staff_list = session.exec(query).all()
        staff_ids = [s.id for s in staff_list]
        event_rows = session.exec(
            select(EventStaffLink.staff_id, EventStaffLink.event_id)
            .where(EventStaffLink.staff_id.in_(staff_ids))  # type: ignore
        ).all()
        event_map: dict[int, list[int]] = defaultdict(list)
        for sid, eid in event_rows:
            if sid is not None and eid is not None:
                event_map[sid].append(eid)
        return [
            StaffWithRelationshipsResponse(
                **s.model_dump(),
                event_ids=event_map.get(s.id, []),
            )
            for s in staff_list
            if s.id is not None
        ]
    return [StaffResponse.model_validate(s) for s in session.exec(query).all()]


@prefix_router.get("/staff/{staff_id}", response_model=StaffDetailResponse | StaffResponse, summary="Get a staff member by ID")
def get_staff_member(staff_id: int, session: SessionDep, include_relationships: bool = False):
    """
    Retrieve a single staff member by their ID.

    - **include_relationships=false** (default): Returns flat staff data only.
    - **include_relationships=true**: Also includes full `events` objects.

    Returns **404** if the staff member does not exist.
    """
    staff_member = session.get(Staff, staff_id)

    if staff_member is None:
        raise HTTPException(status_code=404, detail="Staff member not found")

    if include_relationships:
        events = session.exec(
            select(Event).join(EventStaffLink).where(EventStaffLink.staff_id == staff_id)
        ).all()
        return StaffDetailResponse(
            **staff_member.model_dump(),
            events=[EventResponse.model_validate(e) for e in events],
        )
    return StaffResponse.model_validate(staff_member)


# --- Locations ---

@prefix_router.get("/locations", response_model=list[LocationWithRelationshipsResponse] | list[LocationResponse], summary="List all locations")
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
        locations = session.exec(query).all()
        location_ids = [l.id for l in locations]
        event_rows = session.exec(
            select(Event.location_id, Event.id)
            .where(Event.location_id.in_(location_ids))  # type: ignore
        ).all()
        event_map: dict[int, list[int]] = defaultdict(list)
        for lid, eid in event_rows:
            if lid is not None and eid is not None:
                event_map[lid].append(eid)
        return [
            LocationWithRelationshipsResponse(
                **l.model_dump(),
                event_ids=event_map.get(l.id, []),
            )
            for l in locations
            if l.id is not None
        ]
    return [LocationResponse.model_validate(l) for l in session.exec(query).all()]


@prefix_router.get("/locations/{location_id}", response_model=LocationDetailResponse | LocationResponse, summary="Get a location by ID")
def get_location(location_id: int, session: SessionDep, include_relationships: bool = False):
    """
    Retrieve a single location by its ID.

    - **include_relationships=false** (default): Returns flat location data only.
    - **include_relationships=true**: Also includes full `events` objects.

    Returns **404** if the location does not exist.
    """
    location = session.get(Location, location_id)

    if location is None:
        raise HTTPException(status_code=404, detail="Location not found")

    if include_relationships:
        events = session.exec(
            select(Event).where(Event.location_id == location_id)
        ).all()
        return LocationDetailResponse(
            **location.model_dump(),
            events=[EventResponse.model_validate(e) for e in events],
        )
    return LocationResponse.model_validate(location)


# --- Degrees ---

@prefix_router.get("/degrees", response_model=list[DegreeWithRelationshipsResponse] | list[DegreeResponse], summary="List all degrees")
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
        degrees = session.exec(query).all()
        degree_ids = [d.id for d in degrees]
        link_rows = session.exec(
            select(ModuleDegreeLink.degree_id, ModuleDegreeLink.module_id, ModuleDegreeLink.semester)
            .where(ModuleDegreeLink.degree_id.in_(degree_ids))  # type: ignore
        ).all()
        module_map: dict[int, set[int]] = defaultdict(set)
        semester_map: dict[int, set[int]] = defaultdict(set)
        for did, mid, sem in link_rows:
            if did is not None and mid is not None:
                module_map[did].add(mid)
            if did is not None and sem is not None and isinstance(sem, int):
                semester_map[did].add(sem)
        return [
            DegreeWithRelationshipsResponse(
                **d.model_dump(),
                module_ids=list(module_map.get(d.id, set())) if include_relationships else [],
                semesters=sorted(semester_map.get(d.id, set())) if include_semesters else [],
            )
            for d in degrees
            if d.id is not None
        ]
    return [DegreeResponse.model_validate(d) for d in session.exec(query).all()]


@prefix_router.get("/degrees/{degree_id}", response_model=DegreeDetailResponse | DegreeResponse, summary="Get a degree by ID")
def get_degree(degree_id: int, session: SessionDep, include_relationships: bool = False, include_semesters: bool = False):
    """
    Retrieve a single degree program by its ID.

    - **include_relationships=false** (default): Returns flat degree data only.
    - **include_relationships=true**: Also includes full `modules` objects.
    - **include_semesters=true**: Includes `semesters` (list of all semesters for the degree).

    Returns **404** if the degree does not exist.
    """
    degree = session.get(Degree, degree_id)

    if degree is None:
        raise HTTPException(status_code=404, detail="Degree not found")

    if include_relationships or include_semesters:
        links = session.exec(
            select(ModuleDegreeLink).where(ModuleDegreeLink.degree_id == degree_id)
        ).all()
        module_links: dict[int, list[ModuleDegreeLink]] = defaultdict(list)
        for link in links:
            module_links[link.module_id].append(link)
        modules = session.exec(
            select(Module).where(Module.id.in_(module_links.keys()))  # type: ignore[union-attr]
        ).all() if include_relationships else []
        return DegreeDetailResponse(
            **degree.model_dump(),
            modules=[
                ModuleInDegreeResponse(
                    **m.model_dump(),
                    semesters=sorted(int(lnk.semester) for lnk in module_links.get(m.id, []) if lnk.semester is not None),
                    note=next((lnk.note for lnk in module_links.get(m.id, []) if lnk.note is not None), None),
                )
                for m in modules
                if m.id is not None
            ],
            semesters=sorted(set(
                lnk.semester for lnk in links
                if lnk.semester is not None and isinstance(lnk.semester, int)
            )) if include_semesters else [],
        )
    return DegreeResponse.model_validate(degree)


# --- Semesters (no relationships) ---

@prefix_router.get("/semesters", response_model=list[SemesterResponse], summary="List all semesters")
def get_semesters(
    session: SessionDep,
    name: str | None = Query(None, description="Filter by semester name (case-insensitive substring match)"),
):
    """Retrieve a list of all semesters with optional filtering. All filters are combined with **AND**."""
    query = select(Semester)
    if name is not None:
        query = query.where(Semester.name.ilike(f"%{name}%"))  # type: ignore[union-attr]
    return [SemesterResponse.model_validate(s) for s in session.exec(query).all()]


@prefix_router.get("/semesters/{semester_id}", response_model=SemesterResponse, summary="Get a semester by ID")
def get_semester(semester_id: int, session: SessionDep):
    """
    Retrieve a single semester by its ID.

    Returns **404** if the semester does not exist.
    """
    semester = session.get(Semester, semester_id)
    if semester is None:
        raise HTTPException(status_code=404, detail="Semester not found")
    return SemesterResponse.model_validate(semester)


app.include_router(prefix_router)

# --- Frontend Static Files ---

frontend_dir = Path(__file__).parent.parent / "frontend"

# Mount assets directory
app.mount("/assets", StaticFiles(directory=frontend_dir / "assets"), name="assets")
app.mount("/css", StaticFiles(directory=frontend_dir / "css"), name="css")
app.mount("/js", StaticFiles(directory=frontend_dir / "js"), name="js")


@app.get("/{full_path:path}", include_in_schema=False)
async def serve_spa(full_path: str):
    """
    Serve frontend files. For any path that doesn't match /api/...,
    try to serve the file. If it doesn't exist, serve index.html (SPA routing).
    """
    # Try to serve the requested file
    file_path = frontend_dir / full_path
    if file_path.is_file():
        return FileResponse(file_path)
    
    # Fallback to index.html for SPA routing
    return FileResponse(frontend_dir / "index.html")
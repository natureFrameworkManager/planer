from fastapi import FastAPI, HTTPException
from sqlmodel import select
from sqlalchemy.orm import selectinload
from contextlib import asynccontextmanager

from database.database import create_db_and_tables, SessionDep
from database.models import Module, Event, Staff, Location, Degree, Semester
from database.parse import parse_and_populate
from database.schemas import (
    ModuleResponse, ModuleWithRelationshipsResponse, ModuleDetailResponse,
    StaffResponse, StaffWithRelationshipsResponse, StaffDetailResponse,
    EventResponse, EventWithRelationshipsResponse, EventDetailResponse,
    LocationResponse, LocationWithRelationshipsResponse, LocationDetailResponse,
    DegreeResponse, DegreeWithRelationshipsResponse, DegreeDetailResponse,
    SemesterResponse,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    parse_and_populate()
    yield

app = FastAPI(lifespan=lifespan)


# --- Modules ---

@app.get("/modules", response_model=list[ModuleWithRelationshipsResponse] | list[ModuleResponse])
def get_modules(session: SessionDep, include_relationships: bool = False):
    if include_relationships:
        modules = session.exec(
            select(Module).options(selectinload(Module.degrees), selectinload(Module.events))
        ).all()
        return [
            ModuleWithRelationshipsResponse(
                **m.model_dump(),
                degree_ids=[d.id for d in m.degrees if d.id is not None],
                event_ids=[e.id for e in m.events if e.id is not None],
            )
            for m in modules
        ]
    return [ModuleResponse.model_validate(m) for m in session.exec(select(Module)).all()]


@app.get("/modules/{module_id}", response_model=ModuleDetailResponse | ModuleResponse)
def get_module(module_id: int, session: SessionDep, include_relationships: bool = False):
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
        return ModuleDetailResponse(
            **module.model_dump(),
            degrees=[DegreeResponse.model_validate(d) for d in module.degrees],
            events=[EventResponse.model_validate(e) for e in module.events],
        )
    return ModuleResponse.model_validate(module)


# --- Events ---

@app.get("/events", response_model=list[EventWithRelationshipsResponse] | list[EventResponse])
def get_events(session: SessionDep, include_relationships: bool = False):
    if include_relationships:
        events = session.exec(
            select(Event).options(selectinload(Event.module), selectinload(Event.staff))
        ).all()
        return [
            EventWithRelationshipsResponse(
                **e.model_dump(),
                module_ids=[m.id for m in e.module if m.id is not None],
                staff_ids=[s.id for s in e.staff if s.id is not None],
            )
            for e in events
        ]
    return [EventResponse.model_validate(e) for e in session.exec(select(Event)).all()]


@app.get("/events/{event_id}", response_model=EventDetailResponse | EventResponse)
def get_event(event_id: int, session: SessionDep, include_relationships: bool = False):
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

@app.get("/staff", response_model=list[StaffWithRelationshipsResponse] | list[StaffResponse])
def get_staff(session: SessionDep, include_relationships: bool = False):
    if include_relationships:
        staff = session.exec(
            select(Staff).options(selectinload(Staff.events))
        ).all()
        return [
            StaffWithRelationshipsResponse(
                **s.model_dump(),
                event_ids=[e.id for e in s.events if e.id is not None],
            )
            for s in staff
        ]
    return [StaffResponse.model_validate(s) for s in session.exec(select(Staff)).all()]


@app.get("/staff/{staff_id}", response_model=StaffDetailResponse | StaffResponse)
def get_staff_member(staff_id: int, session: SessionDep, include_relationships: bool = False):
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

@app.get("/locations", response_model=list[LocationWithRelationshipsResponse] | list[LocationResponse])
def get_locations(session: SessionDep, include_relationships: bool = False):
    if include_relationships:
        locations = session.exec(
            select(Location).options(selectinload(Location.events))
        ).all()
        return [
            LocationWithRelationshipsResponse(
                **l.model_dump(),
                event_ids=[e.id for e in l.events if e.id is not None],
            )
            for l in locations
        ]
    return [LocationResponse.model_validate(l) for l in session.exec(select(Location)).all()]


@app.get("/locations/{location_id}", response_model=LocationDetailResponse | LocationResponse)
def get_location(location_id: int, session: SessionDep, include_relationships: bool = False):
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

@app.get("/degrees", response_model=list[DegreeWithRelationshipsResponse] | list[DegreeResponse])
def get_degrees(session: SessionDep, include_relationships: bool = False):
    if include_relationships:
        degrees = session.exec(
            select(Degree).options(selectinload(Degree.modules))
        ).all()
        return [
            DegreeWithRelationshipsResponse(
                **d.model_dump(),
                module_ids=[m.id for m in d.modules if m.id is not None],
            )
            for d in degrees
        ]
    return [DegreeResponse.model_validate(d) for d in session.exec(select(Degree)).all()]


@app.get("/degrees/{degree_id}", response_model=DegreeDetailResponse | DegreeResponse)
def get_degree(degree_id: int, session: SessionDep, include_relationships: bool = False):
    if include_relationships:
        degree = session.exec(
            select(Degree).where(Degree.id == degree_id)
            .options(selectinload(Degree.modules))
        ).first()
    else:
        degree = session.get(Degree, degree_id)

    if degree is None:
        raise HTTPException(status_code=404, detail="Degree not found")

    if include_relationships:
        return DegreeDetailResponse(
            **degree.model_dump(),
            modules=[ModuleResponse.model_validate(m) for m in degree.modules],
        )
    return DegreeResponse.model_validate(degree)


# --- Semesters (no relationships) ---

@app.get("/semesters", response_model=list[SemesterResponse])
def get_semesters(session: SessionDep):
    return [SemesterResponse.model_validate(s) for s in session.exec(select(Semester)).all()]


@app.get("/semesters/{semester_id}", response_model=SemesterResponse)
def get_semester(semester_id: int, session: SessionDep):
    semester = session.get(Semester, semester_id)
    if semester is None:
        raise HTTPException(status_code=404, detail="Semester not found")
    return SemesterResponse.model_validate(semester)
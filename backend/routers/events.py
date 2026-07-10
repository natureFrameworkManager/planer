from collections import defaultdict
from datetime import time

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import select
from sqlalchemy.orm import aliased

from database.database import SessionDep
from database.models import (
    Module, Event, Staff,
    ModuleDegreeLink, ModuleEventLink, EventStaffLink,
    Semester, EventSemesterLink,
    Weekday, EventType, Status,
)
from database.schemas import (
    ModuleResponse, SemesterResponse, StaffResponse,
    EventResponse, EventWithRelationshipsResponse, EventDetailResponse,
)

router = APIRouter(prefix="/events", tags=["Events"])


@router.get("", response_model=list[EventWithRelationshipsResponse] | list[EventResponse], summary="List all events")
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
    semester_id: list[int] | None = Query(None, description="Filter by associated semester ID. Multiple values combined with OR."),
    degree_id: list[int] | None = Query(None, description="Filter by associated degree ID(s) (via modules). Multiple values combined with OR."),
    semester: int | None = Query(None, description="Filter by semester number (used with degree_id filter)"),
):
    """
    Retrieve a list of all scheduled events with optional filtering.

    All filters are combined with **AND**.
    List parameters (weekday, type, status, module_id, staff_id, degree_id) match if any value matches (OR within the list).

    - **include_relationships=false** (default): Returns flat event data only.
    - **include_relationships=true**: Each event also includes `module_ids` and `staff_ids`.
    """
    # Base query: select only Event rows
    query = select(Event)

    # Text filter
    if title is not None:
        query = query.where(Event.title.ilike(f"%{title}%"))  # type: ignore[union-attr]

    # Enum list filters (OR within each list)
    if weekday is not None:
        query = query.where(Event.weekday.in_(weekday))  # type: ignore[union-attr]
    if event_type is not None:
        query = query.where(Event.type.in_(event_type))  # type: ignore[union-attr]
    if status is not None:
        query = query.where(Event.status.in_(status))  # type: ignore[union-attr]

    # Direct column filters
    if location_id is not None:
        query = query.where(Event.location_id == location_id)

    # Time range filters
    if start_time_min is not None:
        query = query.where(Event.start_time >= start_time_min)
    if start_time_max is not None:
        query = query.where(Event.start_time <= start_time_max)
    if end_time_min is not None:
        query = query.where(Event.end_time >= end_time_min)
    if end_time_max is not None:
        query = query.where(Event.end_time <= end_time_max)

    # Relationship filters via link tables
    if module_id is not None:
        query = query.join(ModuleEventLink).where(ModuleEventLink.module_id.in_(module_id))  # type: ignore[union-attr]
    if staff_id is not None:
        query = query.join(EventStaffLink).where(EventStaffLink.staff_id.in_(staff_id))  # type: ignore[union-attr]
    if semester_id is not None:
        query = query.join(EventSemesterLink).where(EventSemesterLink.semester_id.in_(semester_id))  # type: ignore[union-attr]

    # Filter by degree: Event -> ModuleEventLink -> ModuleDegreeLink
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

    # Joins can produce duplicate Event rows
    query = query.distinct()

    if not include_relationships:
        return [EventResponse.model_validate(e) for e in session.exec(query).all()]

    events = session.exec(query).all()
    event_ids = [e.id for e in events]

    # Batch-fetch module links: (event_id, module_id)
    module_rows = session.exec(
        select(ModuleEventLink.event_id, ModuleEventLink.module_id)
        .where(ModuleEventLink.event_id.in_(event_ids))  # type: ignore
    ).all()

    # Batch-fetch staff links: (event_id, staff_id)
    staff_rows = session.exec(
        select(EventStaffLink.event_id, EventStaffLink.staff_id)
        .where(EventStaffLink.event_id.in_(event_ids))  # type: ignore
    ).all()

    # Batch-fetch semester links: (event_id, semester_id)
    semester_rows = session.exec(
        select(EventSemesterLink.event_id, EventSemesterLink.semester_id)
        .where(EventSemesterLink.event_id.in_(event_ids))  # type: ignore
    ).all()

    # module_map: event_id -> [module_ids]
    module_map: dict[int, list[int]] = defaultdict(list)
    for eid, mid in module_rows:
        if eid is not None and mid is not None:
            module_map[eid].append(mid)

    # staff_map: event_id -> [staff_ids]
    staff_map: dict[int, list[int]] = defaultdict(list)
    for eid, sid in staff_rows:
        if eid is not None and sid is not None:
            staff_map[eid].append(sid)

    # semester_map: event_id -> [semester_ids]
    semester_map: dict[int, list[int]] = defaultdict(list)
    for eid, sid in semester_rows:
        if eid is not None and sid is not None:
            semester_map[eid].append(sid)

    return [
        EventWithRelationshipsResponse(
            **e.model_dump(),
            module_ids=module_map.get(e.id, []),
            staff_ids=staff_map.get(e.id, []),
            semester_ids=semester_map.get(e.id, []),
        )
        for e in events
        if e.id is not None
    ]


@router.get("/{event_id}", response_model=EventDetailResponse | EventResponse, summary="Get an event by ID")
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

    if not include_relationships:
        return EventResponse.model_validate(event)

    # Fetch full Module objects linked to this event
    modules = session.exec(
        select(Module).join(ModuleEventLink).where(ModuleEventLink.event_id == event_id)
    ).all()

    # Fetch full Staff objects linked to this event
    staff = session.exec(
        select(Staff).join(EventStaffLink).where(EventStaffLink.event_id == event_id)
    ).all()

    # Fetch full Semester objects linked to this event
    semesters = session.exec(
        select(Semester).join(EventSemesterLink).where(EventSemesterLink.event_id == event_id)
    ).all()

    return EventDetailResponse(
        **event.model_dump(),
        module=[ModuleResponse.model_validate(m) for m in modules],
        staff=[StaffResponse.model_validate(s) for s in staff],
        semester=[SemesterResponse.model_validate(s) for s in semesters],
    )

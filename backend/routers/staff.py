from collections import defaultdict

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import select

from database.database import SessionDep
from database.models import Event, Staff, EventStaffLink
from database.schemas import (
    StaffResponse, StaffWithRelationshipsResponse, StaffDetailResponse,
    EventResponse,
)

router = APIRouter(prefix="/staff", tags=["Staff"])


@router.get("", response_model=list[StaffWithRelationshipsResponse] | list[StaffResponse], summary="List all staff members")
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
    # Base query: select only Staff rows
    query = select(Staff)

    # Text filter
    if name is not None:
        query = query.where(Staff.name.ilike(f"%{name}%"))  # type: ignore[union-attr]

    # Filter by associated event via link table
    if event_id is not None:
        query = query.join(EventStaffLink).where(EventStaffLink.event_id == event_id)

    if not include_relationships:
        return [StaffResponse.model_validate(s) for s in session.exec(query).all()]

    staff_list = session.exec(query).all()
    staff_ids = [s.id for s in staff_list]

    # Batch-fetch event links: (staff_id, event_id)
    event_rows = session.exec(
        select(EventStaffLink.staff_id, EventStaffLink.event_id)
        .where(EventStaffLink.staff_id.in_(staff_ids))  # type: ignore
    ).all()

    # event_map: staff_id -> [event_ids]
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


@router.get("/{staff_id}", response_model=StaffDetailResponse | StaffResponse, summary="Get a staff member by ID")
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

    if not include_relationships:
        return StaffResponse.model_validate(staff_member)

    # Fetch full Event objects linked to this staff member
    events = session.exec(
        select(Event).join(EventStaffLink).where(EventStaffLink.staff_id == staff_id)
    ).all()

    return StaffDetailResponse(
        **staff_member.model_dump(),
        events=[EventResponse.model_validate(e) for e in events],
    )

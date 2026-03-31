from collections import defaultdict

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import select

from database.database import SessionDep
from database.models import Event, Location
from database.schemas import (
    LocationResponse, LocationWithRelationshipsResponse, LocationDetailResponse,
    EventResponse,
)

router = APIRouter(prefix="/locations", tags=["Locations"])


@router.get("", response_model=list[LocationWithRelationshipsResponse] | list[LocationResponse], summary="List all locations")
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
    # Base query: select only Location rows
    query = select(Location)

    # Text filter
    if name is not None:
        query = query.where(Location.name.ilike(f"%{name}%"))  # type: ignore[union-attr]

    if not include_relationships:
        return [LocationResponse.model_validate(loc) for loc in session.exec(query).all()]

    locations = session.exec(query).all()
    location_ids = [loc.id for loc in locations]

    # Batch-fetch event IDs directly from Event table (location_id is a FK column, no link table needed)
    # Returns: (location_id, event_id)
    event_rows = session.exec(
        select(Event.location_id, Event.id)
        .where(Event.location_id.in_(location_ids))  # type: ignore
    ).all()

    # event_map: location_id -> [event_ids]
    event_map: dict[int, list[int]] = defaultdict(list)
    for lid, eid in event_rows:
        if lid is not None and eid is not None:
            event_map[lid].append(eid)

    return [
        LocationWithRelationshipsResponse(
            **loc.model_dump(),
            event_ids=event_map.get(loc.id, []),
        )
        for loc in locations
        if loc.id is not None
    ]


@router.get("/{location_id}", response_model=LocationDetailResponse | LocationResponse, summary="Get a location by ID")
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

    if not include_relationships:
        return LocationResponse.model_validate(location)

    # Fetch full Event objects at this location (direct FK, no link table)
    events = session.exec(
        select(Event).where(Event.location_id == location_id)
    ).all()

    return LocationDetailResponse(
        **location.model_dump(),
        events=[EventResponse.model_validate(e) for e in events],
    )

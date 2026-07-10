from collections import defaultdict

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import select

from database.database import SessionDep
from database.models import (
    Module, Event, Degree,
    ModuleDegreeLink, ModuleEventLink, 
    Semester, ModuleSemesterLink,
)
from database.schemas import (
    ModuleResponse, ModuleWithRelationshipsResponse, ModuleDetailResponse,
    EventResponse, DegreeInModuleResponse, SemesterResponse,
)

router = APIRouter(prefix="/modules", tags=["Modules"])


@router.get("", response_model=list[ModuleWithRelationshipsResponse] | list[ModuleResponse], summary="List all modules")
def get_modules(
    session: SessionDep,
    include_relationships: bool = False,
    name: str | None = Query(None, description="Filter by module name (case-insensitive substring match)"),
    module_number: str | None = Query(None, description="Filter by module number (case-insensitive substring match)"),
    language: str | None = Query(None, description="Filter by language (case-insensitive substring match)"),
    planung: str | None = Query(None, description="Filter by planning department (case-insensitive substring match)"),
    credits_min: int | None = Query(None, description="Filter by minimum credits (inclusive)"),
    credits_max: int | None = Query(None, description="Filter by maximum credits (inclusive)"),
    semester_id: list[int] | None = Query(None, description="Filter by associated semester ID. Multiple values combined with OR."),
    degree_id: int | None = Query(None, description="Filter by associated degree ID"),
    semester: int | None = Query(None, description="Filter by degree semester number"),
):
    """
    Retrieve a list of all modules with optional filtering.

    All filters are combined with **AND**.

    - **include_relationships=false** (default): Returns flat module data only.
    - **include_relationships=true**: Each module also includes `degree_ids` and `event_ids`.
    """
    # Base query: select only Module rows
    query = select(Module)

    # Apply text filters (case-insensitive substring)
    if name is not None:
        query = query.where(Module.name.ilike(f"%{name}%"))  # type: ignore[union-attr]
    if module_number is not None:
        query = query.where(Module.module_number.ilike(f"%{module_number}%"))  # type: ignore[union-attr]
    if language is not None:
        query = query.where(Module.language.ilike(f"%{language}%"))  # type: ignore[union-attr]
    if planung is not None:
        query = query.where(Module.planung.ilike(f"%{planung}%"))  # type: ignore[union-attr]

    # Apply numeric range filters
    if credits_min is not None:
        query = query.where(Module.credits >= credits_min)
    if credits_max is not None:
        query = query.where(Module.credits <= credits_max)

    # Relationship filters via link tables
    if semester_id is not None:
        query = query.join(ModuleSemesterLink).where(ModuleSemesterLink.semester_id.in_(semester_id))  # type: ignore[union-attr]

    # Filter by degree/semester via the link table
    if degree_id is not None:
        query = query.join(ModuleDegreeLink).where(ModuleDegreeLink.degree_id == degree_id)
        if semester is not None:
            query = query.where(ModuleDegreeLink.semester == semester)
    elif semester is not None:
        query = query.join(ModuleDegreeLink).where(ModuleDegreeLink.semester == semester)

    if not include_relationships:
        return [ModuleResponse.model_validate(m) for m in session.exec(query).all()]

    # Fetch distinct modules (join filters can produce duplicates)
    modules = session.exec(query.distinct()).all()
    module_ids = [m.id for m in modules]

    # Batch-fetch degree links: (module_id, degree_id, semester, note)
    degree_rows = session.exec(
        select(ModuleDegreeLink.module_id, ModuleDegreeLink.degree_id, ModuleDegreeLink.semester, ModuleDegreeLink.note)
        .where(ModuleDegreeLink.module_id.in_(module_ids))  # type: ignore
        .where(ModuleDegreeLink.degree_id.is_not(None))  # type: ignore
    ).all()

    # Batch-fetch event links: (module_id, event_id)
    event_rows = session.exec(
        select(ModuleEventLink.module_id, ModuleEventLink.event_id)
        .where(ModuleEventLink.module_id.in_(module_ids))  # type: ignore
        .where(ModuleEventLink.event_id.is_not(None))  # type: ignore
    ).all()

    # Batch-fetch semester links: (module_id, semester_id)
    semester_rows = session.exec(
        select(ModuleSemesterLink.module_id, ModuleSemesterLink.semester_id)
        .where(ModuleSemesterLink.module_id.in_(module_ids))  # type: ignore
    ).all()

    # degree_map: module_id -> { degree_id -> [semester numbers] }
    degree_map: dict[int, dict[int, list[int]]] = defaultdict(lambda: defaultdict(list))
    for mid, did, semester_num, _note in degree_rows:
        if did not in degree_map[mid]:
            degree_map[mid][did] = []
        if semester_num is not None:
            degree_map[mid][did].append(semester_num)

    # event_map: module_id -> [event_ids]
    event_map: dict[int, list[int]] = defaultdict(list)
    for mid, eid in event_rows:
        if mid is not None and eid is not None:
            event_map[mid].append(eid)

    # semester_map: event_id -> [semester_ids]
    semester_map: dict[int, list[int]] = defaultdict(list)
    for eid, sid in semester_rows:
        if eid is not None and sid is not None:
            semester_map[eid].append(sid)

    return [
        ModuleWithRelationshipsResponse(
            **module.model_dump(),
            degree_ids=degree_map.get(module.id, {}),
            event_ids=event_map.get(module.id, []),
            semester_ids=semester_map.get(module.id, []),
        )
        for module in modules
        if module.id is not None
    ]


@router.get("/{module_id}", response_model=ModuleDetailResponse | ModuleResponse, summary="Get a module by ID")
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

    if not include_relationships:
        return ModuleResponse.model_validate(module)

    # Fetch all degree links for this module: full ModuleDegreeLink rows (need semester + note)
    links = session.exec(
        select(ModuleDegreeLink).where(ModuleDegreeLink.module_id == module_id)
    ).all()

    # degree_links: degree_id -> [ModuleDegreeLink rows] (for semester/note extraction)
    degree_links: dict[int, list[ModuleDegreeLink]] = defaultdict(list)
    for link in links:
        degree_links[link.degree_id].append(link)

    # Fetch full Degree objects only for degrees linked to this module
    degrees = session.exec(
        select(Degree).where(Degree.id.in_(degree_links.keys()))  # type: ignore[union-attr]
    ).all()

    # Fetch full Semester objects linked to this module
    semesters = session.exec(
        select(Semester).join(ModuleSemesterLink).where(ModuleSemesterLink.module_id == module_id)
    ).all()

    # Fetch full Event objects linked to this module via the event link table
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
        semester=[SemesterResponse.model_validate(s) for s in semesters],
    )

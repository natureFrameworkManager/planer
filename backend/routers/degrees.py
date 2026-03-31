from collections import defaultdict

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import select

from database.database import SessionDep
from database.models import Module, Degree, ModuleDegreeLink
from database.schemas import (
    ModuleResponse, ModuleInDegreeResponse,
    DegreeResponse, DegreeWithRelationshipsResponse, DegreeDetailResponse,
)

router = APIRouter(prefix="/degrees", tags=["Degrees"])


@router.get("", response_model=list[DegreeWithRelationshipsResponse] | list[DegreeResponse], summary="List all degrees")
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
    # Base query: select only Degree rows
    query = select(Degree)

    # Text filter
    if name is not None:
        query = query.where(Degree.name.ilike(f"%{name}%"))  # type: ignore[union-attr]

    # Filter by associated module via link table
    if module_id is not None:
        query = query.join(ModuleDegreeLink).where(ModuleDegreeLink.module_id == module_id)

    if not (include_relationships or include_semesters):
        return [DegreeResponse.model_validate(d) for d in session.exec(query).all()]

    degrees = session.exec(query).all()
    degree_ids = [d.id for d in degrees]

    # Batch-fetch all degree-module links: (degree_id, module_id, semester)
    link_rows = session.exec(
        select(ModuleDegreeLink.degree_id, ModuleDegreeLink.module_id, ModuleDegreeLink.semester)
        .where(ModuleDegreeLink.degree_id.in_(degree_ids))  # type: ignore
    ).all()

    # module_map: degree_id -> {unique module_ids}
    module_map: dict[int, set[int]] = defaultdict(set)
    # semester_map: degree_id -> {unique semester numbers}
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


@router.get("/{degree_id}", response_model=DegreeDetailResponse | DegreeResponse, summary="Get a degree by ID")
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

    if not (include_relationships or include_semesters):
        return DegreeResponse.model_validate(degree)

    # Fetch all links for this degree: full ModuleDegreeLink rows (need semester + note)
    links = session.exec(
        select(ModuleDegreeLink).where(ModuleDegreeLink.degree_id == degree_id)
    ).all()

    # module_links: module_id -> [ModuleDegreeLink rows] (for semester/note extraction per module)
    module_links: dict[int, list[ModuleDegreeLink]] = defaultdict(list)
    for link in links:
        module_links[link.module_id].append(link)

    # Fetch full Module objects only for modules linked to this degree
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

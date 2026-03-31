from fastapi import APIRouter, HTTPException, Query
from sqlmodel import select

from database.database import SessionDep
from database.models import Semester
from database.schemas import SemesterResponse

router = APIRouter(prefix="/semesters", tags=["Semesters"])


@router.get("", response_model=list[SemesterResponse], summary="List all semesters")
def get_semesters(
    session: SessionDep,
    name: str | None = Query(None, description="Filter by semester name (case-insensitive substring match)"),
):
    """Retrieve a list of all semesters with optional filtering. All filters are combined with **AND**."""
    query = select(Semester)
    if name is not None:
        query = query.where(Semester.name.ilike(f"%{name}%"))  # type: ignore[union-attr]
    return [SemesterResponse.model_validate(s) for s in session.exec(query).all()]


@router.get("/{semester_id}", response_model=SemesterResponse, summary="Get a semester by ID")
def get_semester(semester_id: int, session: SessionDep):
    """
    Retrieve a single semester by its ID.

    Returns **404** if the semester does not exist.
    """
    semester = session.get(Semester, semester_id)
    if semester is None:
        raise HTTPException(status_code=404, detail="Semester not found")
    return SemesterResponse.model_validate(semester)

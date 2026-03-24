from fastapi import FastAPI
from fastapi import HTTPException
from sqlmodel import select
from contextlib import asynccontextmanager

from database.database import create_db_and_tables, SessionDep
from database.models import *
from database.parse import parse_and_populate

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    parse_and_populate()
    yield

app = FastAPI(lifespan=lifespan)

@app.get("/modules")
def get_modules(session: SessionDep):
    modules = session.exec(select(Module)).all()
    return modules


@app.get("/modules/{module_id}")
def get_module(module_id: int, session: SessionDep):
    module = session.get(Module, module_id)
    if module is None:
        raise HTTPException(status_code=404, detail="Module not found")
    return module


@app.get("/events")
def get_events(session: SessionDep):
    events = session.exec(select(Event)).all()
    return events


@app.get("/events/{event_id}")
def get_event(event_id: int, session: SessionDep):
    event = session.get(Event, event_id)
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@app.get("/staff")
def get_staff(session: SessionDep):
    staff = session.exec(select(Staff)).all()
    return staff


@app.get("/staff/{staff_id}")
def get_staff_member(staff_id: int, session: SessionDep):
    staff_member = session.get(Staff, staff_id)
    if staff_member is None:
        raise HTTPException(status_code=404, detail="Staff member not found")
    return staff_member


@app.get("/locations")
def get_locations(session: SessionDep):
    locations = session.exec(select(Location)).all()
    return locations


@app.get("/locations/{location_id}")
def get_location(location_id: int, session: SessionDep):
    location = session.get(Location, location_id)
    if location is None:
        raise HTTPException(status_code=404, detail="Location not found")
    return location


@app.get("/degrees")
def get_degrees(session: SessionDep):
    degrees = session.exec(select(Degree)).all()
    return degrees


@app.get("/degrees/{degree_id}")
def get_degree(degree_id: int, session: SessionDep):
    degree = session.get(Degree, degree_id)
    if degree is None:
        raise HTTPException(status_code=404, detail="Degree not found")
    return degree


@app.get("/semesters")
def get_semesters(session: SessionDep):
    semesters = session.exec(select(Semester)).all()
    return semesters


@app.get("/semesters/{semester_id}")
def get_semester(semester_id: int, session: SessionDep):
    semester = session.get(Semester, semester_id)
    if semester is None:
        raise HTTPException(status_code=404, detail="Semester not found")
    return semester


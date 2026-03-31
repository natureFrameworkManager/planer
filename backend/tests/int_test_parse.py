"""Integration tests — parsing modules interact correctly with the database layer."""

from datetime import time

import pytest
from sqlmodel import Session, SQLModel, create_engine, select

from database.models import (
    Module, Event, Staff, Location, Degree, Semester,
    ModuleDegreeLink, ModuleEventLink, EventStaffLink,
    EventType, Weekday, Status,
)
from database.parse import (
    _get_or_create_location,
    _get_or_create_staff,
    _get_or_create_degree,
    _get_or_create_module,
    _link_module_degree,
    _find_existing_event,
)


# ---------------------------------------------------------------------------
# Fixtures — in-memory SQLite per test
# ---------------------------------------------------------------------------

@pytest.fixture()
def db_session():
    """Yield a SQLModel Session backed by an in-memory SQLite database."""
    engine = create_engine("sqlite://", echo=False)
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


# ===================================================================
# _get_or_create_location
# ===================================================================

class TestGetOrCreateLocation:
    def test_creates_new_location(self, db_session: Session):
        loc = _get_or_create_location(db_session, "Raum A-101")
        assert loc.id is not None
        assert loc.name == "Raum A-101"

    def test_returns_existing_location(self, db_session: Session):
        loc1 = _get_or_create_location(db_session, "Raum A-101")
        loc2 = _get_or_create_location(db_session, "Raum A-101")
        assert loc1.id == loc2.id

    def test_different_names_create_different_rows(self, db_session: Session):
        a = _get_or_create_location(db_session, "A")
        b = _get_or_create_location(db_session, "B")
        assert a.id != b.id


# ===================================================================
# _get_or_create_staff
# ===================================================================

class TestGetOrCreateStaff:
    def test_creates_new_staff(self, db_session: Session):
        s = _get_or_create_staff(db_session, "Prof. Müller")
        assert s.id is not None
        assert s.name == "Prof. Müller"

    def test_returns_existing_staff(self, db_session: Session):
        s1 = _get_or_create_staff(db_session, "Prof. Müller")
        s2 = _get_or_create_staff(db_session, "Prof. Müller")
        assert s1.id == s2.id


# ===================================================================
# _get_or_create_degree
# ===================================================================

class TestGetOrCreateDegree:
    def test_creates_new_degree(self, db_session: Session):
        d = _get_or_create_degree(db_session, "B.Sc. Informatik")
        assert d.id is not None
        assert d.name == "B.Sc. Informatik"

    def test_returns_existing_degree(self, db_session: Session):
        d1 = _get_or_create_degree(db_session, "B.Sc. Informatik")
        d2 = _get_or_create_degree(db_session, "B.Sc. Informatik")
        assert d1.id == d2.id


# ===================================================================
# _get_or_create_module
# ===================================================================

class TestGetOrCreateModule:
    def test_creates_new_module(self, db_session: Session):
        m = _get_or_create_module(
            db_session, "101-001",
            name="Mathe I", credits=6, planung="FB Math", language="Deutsch",
        )
        assert m.id is not None
        assert m.module_number == "101-001"

    def test_returns_existing_module_by_number(self, db_session: Session):
        m1 = _get_or_create_module(
            db_session, "101-001",
            name="Mathe I", credits=6, planung="FB Math", language="Deutsch",
        )
        m2 = _get_or_create_module(db_session, "101-001")
        assert m1.id == m2.id


# ===================================================================
# _link_module_degree
# ===================================================================

class TestLinkModuleDegree:
    def _make_module_and_degree(self, session: Session):
        m = _get_or_create_module(
            session, "200-001",
            name="Algo", credits=9, planung="FB Info", language="Englisch",
        )
        d = _get_or_create_degree(session, "M.Sc. Informatik")
        return m, d

    def test_link_with_semesters(self, db_session: Session):
        m, d = self._make_module_and_degree(db_session)
        _link_module_degree(db_session, m, d, [1, 2], "Pflichtmodul")
        links = db_session.exec(select(ModuleDegreeLink)).all()
        assert len(links) == 2
        assert {lnk.semester for lnk in links} == {1, 2}
        assert all(lnk.note == "Pflichtmodul" for lnk in links)

    def test_link_without_semesters(self, db_session: Session):
        m, d = self._make_module_and_degree(db_session)
        _link_module_degree(db_session, m, d, [], None)
        links = db_session.exec(select(ModuleDegreeLink)).all()
        assert len(links) == 1
        assert links[0].semester is None

    def test_no_duplicate_links(self, db_session: Session):
        m, d = self._make_module_and_degree(db_session)
        _link_module_degree(db_session, m, d, [3], "note")
        _link_module_degree(db_session, m, d, [3], "note")
        links = db_session.exec(select(ModuleDegreeLink)).all()
        assert len(links) == 1


# ===================================================================
# _find_existing_event
# ===================================================================

class TestFindExistingEvent:
    def test_finds_matching_event(self, db_session: Session):
        loc = _get_or_create_location(db_session, "Room 1")
        event = Event(
            title="Lecture",
            type=EventType.LECTURE,
            weekday=Weekday.MONDAY,
            start_time=time(8, 0),
            end_time=time(9, 30),
            location_id=loc.id,  # type: ignore[arg-type]
            status=Status.OK,
        )
        db_session.add(event)
        db_session.flush()

        found = _find_existing_event(
            db_session, "Lecture", Weekday.MONDAY,
            time(8, 0), time(9, 30), loc.id,  # type: ignore[arg-type]
        )
        assert found is not None
        assert found.id == event.id

    def test_returns_none_when_no_match(self, db_session: Session):
        loc = _get_or_create_location(db_session, "Room 1")
        found = _find_existing_event(
            db_session, "Nonexistent", Weekday.MONDAY,
            time(8, 0), time(9, 30), loc.id,  # type: ignore[arg-type]
        )
        assert found is None

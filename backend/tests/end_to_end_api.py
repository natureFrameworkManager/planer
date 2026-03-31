"""End-to-end API tests — full request/response cycles against all endpoints."""

from datetime import time
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine

from database.models import (
    Module, Event, Staff, Location, Degree, Semester,
    ModuleDegreeLink, ModuleEventLink, EventStaffLink,
    EventType, Weekday, Status,
)
import database.database as db_mod
from main import app


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture()
def client():
    """
    Provide a TestClient whose DB is an isolated in-memory SQLite instance,
    pre-populated with a small but realistic data set.
    """
    test_engine = create_engine("sqlite://", echo=False)
    SQLModel.metadata.create_all(test_engine)

    # Seed data
    with Session(test_engine) as s:
        sem = Semester(name="SoSe 2026")
        s.add(sem)

        loc1 = Location(name="Raum A-101")
        loc2 = Location(name="Hörsaal 1")
        s.add_all([loc1, loc2])
        s.flush()

        deg_bsc = Degree(name="B.Sc. Informatik")
        deg_msc = Degree(name="M.Sc. Informatik")
        s.add_all([deg_bsc, deg_msc])
        s.flush()

        mod1 = Module(
            name="Mathematik I", module_number="101-001",
            credits=6, planung="FB Mathematik", language="Deutsch",
        )
        mod2 = Module(
            name="Algorithmen", module_number="200-001",
            credits=9, planung="FB Info", language="Englisch",
        )
        s.add_all([mod1, mod2])
        s.flush()
        assert mod1.id is not None
        assert mod2.id is not None
        assert deg_bsc.id is not None
        assert deg_msc.id is not None

        s.add(ModuleDegreeLink(module_id=mod1.id, degree_id=deg_bsc.id, semester=2, note="Pflichtmodul"))
        s.add(ModuleDegreeLink(module_id=mod2.id, degree_id=deg_bsc.id, semester=3, note="Pflichtmodul"))
        s.add(ModuleDegreeLink(module_id=mod2.id, degree_id=deg_msc.id, semester=1, note="Wahlpflicht"))

        staff1 = Staff(name="Prof. Schmidt")
        staff2 = Staff(name="Dr. Weber")
        s.add_all([staff1, staff2])
        s.flush()
        assert loc1.id is not None
        assert loc2.id is not None

        ev1 = Event(
            title="Mathematik I - Vorlesung", type=EventType.LECTURE,
            weekday=Weekday.MONDAY, start_time=time(8, 0), end_time=time(9, 30),
            location_id=loc1.id, status=Status.OK,
        )
        ev2 = Event(
            title="Algorithmen - Vorlesung", type=EventType.LECTURE,
            weekday=Weekday.TUESDAY, start_time=time(10, 0), end_time=time(11, 30),
            location_id=loc2.id, status=Status.OK,
        )
        ev3 = Event(
            title="Algorithmen - Übung", type=EventType.EXERCISE,
            weekday=Weekday.WEDNESDAY, start_time=time(14, 0), end_time=time(15, 30),
            location_id=loc1.id, status=Status.POK,
        )
        s.add_all([ev1, ev2, ev3])
        s.flush()

        s.add_all([
            ModuleEventLink(module_id=mod1.id, event_id=ev1.id),
            ModuleEventLink(module_id=mod2.id, event_id=ev2.id),
            ModuleEventLink(module_id=mod2.id, event_id=ev3.id),
        ])
        s.add_all([
            EventStaffLink(event_id=ev1.id, staff_id=staff1.id),
            EventStaffLink(event_id=ev2.id, staff_id=staff1.id),
            EventStaffLink(event_id=ev3.id, staff_id=staff2.id),
        ])
        s.commit()

    # Swap the module-level engine so get_session yields sessions on our test DB
    original_engine = db_mod.engine
    db_mod.engine = test_engine

    with patch("main.create_db_and_tables"), \
         patch("main.parse_and_populate"):
        with TestClient(app, raise_server_exceptions=True) as tc:
            yield tc

    db_mod.engine = original_engine


# ===================================================================
# Modules
# ===================================================================

class TestModulesEndpoint:
    def test_list_modules(self, client: TestClient):
        r = client.get("/api/modules")
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 2

    def test_list_modules_with_relationships(self, client: TestClient):
        r = client.get("/api/modules?include_relationships=true")
        assert r.status_code == 200
        data = r.json()
        assert all("degree_ids" in m and "event_ids" in m for m in data)

    def test_filter_modules_by_name(self, client: TestClient):
        r = client.get("/api/modules?name=Mathe")
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 1
        assert data[0]["name"] == "Mathematik I"

    def test_filter_modules_by_language(self, client: TestClient):
        r = client.get("/api/modules?language=Englisch")
        data = r.json()
        assert len(data) == 1
        assert data[0]["module_number"] == "200-001"

    def test_filter_modules_by_credits_range(self, client: TestClient):
        r = client.get("/api/modules?credits_min=7&credits_max=10")
        data = r.json()
        assert len(data) == 1
        assert data[0]["credits"] == 9

    def test_get_module_by_id(self, client: TestClient):
        r = client.get("/api/modules/1")
        assert r.status_code == 200
        assert r.json()["module_number"] == "101-001"

    def test_get_module_with_relationships(self, client: TestClient):
        r = client.get("/api/modules/1?include_relationships=true")
        data = r.json()
        assert "degrees" in data
        assert "events" in data

    def test_get_module_not_found(self, client: TestClient):
        r = client.get("/api/modules/9999")
        assert r.status_code == 404


# ===================================================================
# Events
# ===================================================================

class TestEventsEndpoint:
    def test_list_events(self, client: TestClient):
        r = client.get("/api/events")
        assert r.status_code == 200
        assert len(r.json()) == 3

    def test_filter_events_by_weekday(self, client: TestClient):
        r = client.get("/api/events?weekday=1")
        data = r.json()
        assert len(data) == 1
        assert data[0]["weekday"] == 1

    def test_filter_events_by_type(self, client: TestClient):
        r = client.get(f"/api/events?type={EventType.EXERCISE.value}")
        data = r.json()
        assert all(e["type"] == EventType.EXERCISE.value for e in data)

    def test_filter_events_by_status(self, client: TestClient):
        r = client.get("/api/events?status=pok")
        data = r.json()
        assert len(data) == 1
        assert data[0]["status"] == "pok"

    def test_filter_events_by_time_range(self, client: TestClient):
        r = client.get("/api/events?start_time_min=09:00&start_time_max=11:00")
        data = r.json()
        assert len(data) == 1
        assert data[0]["title"] == "Algorithmen - Vorlesung"

    def test_list_events_with_relationships(self, client: TestClient):
        r = client.get("/api/events?include_relationships=true")
        data = r.json()
        assert all("module_ids" in e and "staff_ids" in e for e in data)

    def test_get_event_by_id(self, client: TestClient):
        r = client.get("/api/events/1")
        assert r.status_code == 200

    def test_get_event_with_relationships(self, client: TestClient):
        r = client.get("/api/events/1?include_relationships=true")
        data = r.json()
        assert "module" in data
        assert "staff" in data

    def test_get_event_not_found(self, client: TestClient):
        r = client.get("/api/events/9999")
        assert r.status_code == 404


# ===================================================================
# Staff
# ===================================================================

class TestStaffEndpoint:
    def test_list_staff(self, client: TestClient):
        r = client.get("/api/staff")
        assert r.status_code == 200
        assert len(r.json()) == 2

    def test_filter_staff_by_name(self, client: TestClient):
        r = client.get("/api/staff?name=Weber")
        data = r.json()
        assert len(data) == 1
        assert data[0]["name"] == "Dr. Weber"

    def test_list_staff_with_relationships(self, client: TestClient):
        r = client.get("/api/staff?include_relationships=true")
        data = r.json()
        assert all("event_ids" in s for s in data)

    def test_get_staff_by_id(self, client: TestClient):
        r = client.get("/api/staff/1")
        assert r.status_code == 200

    def test_get_staff_not_found(self, client: TestClient):
        r = client.get("/api/staff/9999")
        assert r.status_code == 404

    def test_get_staff_with_relationships(self, client: TestClient):
        r = client.get("/api/staff/1?include_relationships=true")
        data = r.json()
        assert "events" in data


# ===================================================================
# Locations
# ===================================================================

class TestLocationsEndpoint:
    def test_list_locations(self, client: TestClient):
        r = client.get("/api/locations")
        assert r.status_code == 200
        assert len(r.json()) == 2

    def test_filter_locations_by_name(self, client: TestClient):
        r = client.get("/api/locations?name=Hörsaal")
        data = r.json()
        assert len(data) == 1

    def test_list_locations_with_relationships(self, client: TestClient):
        r = client.get("/api/locations?include_relationships=true")
        data = r.json()
        assert all("event_ids" in loc for loc in data)

    def test_get_location_by_id(self, client: TestClient):
        r = client.get("/api/locations/1")
        assert r.status_code == 200

    def test_get_location_not_found(self, client: TestClient):
        r = client.get("/api/locations/9999")
        assert r.status_code == 404

    def test_get_location_with_relationships(self, client: TestClient):
        r = client.get("/api/locations/1?include_relationships=true")
        data = r.json()
        assert "events" in data


# ===================================================================
# Degrees
# ===================================================================

class TestDegreesEndpoint:
    def test_list_degrees(self, client: TestClient):
        r = client.get("/api/degrees")
        assert r.status_code == 200
        assert len(r.json()) == 2

    def test_filter_degrees_by_name(self, client: TestClient):
        r = client.get("/api/degrees?name=B.Sc")
        data = r.json()
        assert len(data) == 1
        assert data[0]["name"] == "B.Sc. Informatik"

    def test_list_degrees_with_relationships(self, client: TestClient):
        r = client.get("/api/degrees?include_relationships=true")
        data = r.json()
        assert all("module_ids" in d for d in data)

    def test_list_degrees_with_semesters(self, client: TestClient):
        r = client.get("/api/degrees?include_semesters=true")
        data = r.json()
        bsc = next(d for d in data if d["name"] == "B.Sc. Informatik")
        assert 2 in bsc["semesters"]
        assert 3 in bsc["semesters"]

    def test_get_degree_by_id(self, client: TestClient):
        r = client.get("/api/degrees/1")
        assert r.status_code == 200

    def test_get_degree_not_found(self, client: TestClient):
        r = client.get("/api/degrees/9999")
        assert r.status_code == 404

    def test_get_degree_with_relationships(self, client: TestClient):
        r = client.get("/api/degrees/1?include_relationships=true")
        data = r.json()
        assert "modules" in data


# ===================================================================
# Semesters
# ===================================================================

class TestSemestersEndpoint:
    def test_list_semesters(self, client: TestClient):
        r = client.get("/api/semesters")
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 1
        assert data[0]["name"] == "SoSe 2026"

    def test_filter_semesters_by_name(self, client: TestClient):
        r = client.get("/api/semesters?name=SoSe")
        assert len(r.json()) == 1

    def test_filter_semesters_no_match(self, client: TestClient):
        r = client.get("/api/semesters?name=WiSe")
        assert len(r.json()) == 0

    def test_get_semester_by_id(self, client: TestClient):
        r = client.get("/api/semesters/1")
        assert r.status_code == 200
        assert r.json()["name"] == "SoSe 2026"

    def test_get_semester_not_found(self, client: TestClient):
        r = client.get("/api/semesters/9999")
        assert r.status_code == 404


# ===================================================================
# Cross-cutting: SPA fallback, CORS, response format
# ===================================================================

class TestCrossCutting:
    def test_cors_headers_present(self, client: TestClient):
        r = client.get("/api/modules", headers={"Origin": "http://localhost:3000"})
        assert r.headers.get("access-control-allow-origin") == "*"

    def test_json_content_type(self, client: TestClient):
        r = client.get("/api/modules")
        assert "application/json" in r.headers["content-type"]

    def test_unknown_api_path_returns_404_or_spa(self, client: TestClient):
        r = client.get("/nonexistent")
        # The SPA fallback serves index.html for unknown paths
        assert r.status_code == 200 or r.status_code == 404

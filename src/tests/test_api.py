"""
Test suite for the FastAPI timetable application.
Uses the existing database.db (populated via parse_and_populate).
Run with: pytest test_api.py -v
"""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select, create_engine
from sqlalchemy.orm import selectinload

# Override the DB to use the existing populated one
from database import database as db_module
db_module.DATABASE_URL = "sqlite:///database.db"
db_module.engine = create_engine(db_module.DATABASE_URL, echo=False)

from main import app
from database.models import Module, Event, Staff, Location, Degree, Semester

client = TestClient(app, raise_server_exceptions=True)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_first_id(model):
    with Session(db_module.engine) as s:
        obj = s.exec(select(model)).first()
        return obj.id


def get_last_id(model):
    with Session(db_module.engine) as s:
        obj = s.exec(select(model).order_by(model.id.desc())).first()
        return obj.id


# ---------------------------------------------------------------------------
# /modules
# ---------------------------------------------------------------------------

class TestModulesList:
    def test_returns_200(self):
        r = client.get("/modules")
        assert r.status_code == 200

    def test_returns_list(self):
        r = client.get("/modules")
        data = r.json()
        assert isinstance(data, list)
        assert len(data) > 0

    def test_flat_schema_has_no_relationship_fields(self):
        r = client.get("/modules")
        item = r.json()[0]
        assert "degree_ids" not in item
        assert "event_ids" not in item
        assert "degrees" not in item
        assert "events" not in item

    def test_flat_schema_fields_present(self):
        r = client.get("/modules")
        item = r.json()[0]
        for field in ("id", "name", "module_number", "credits", "planung", "language"):
            assert field in item, f"Missing field: {field}"

    def test_include_relationships_returns_ids(self):
        r = client.get("/modules?include_relationships=true")
        assert r.status_code == 200
        item = r.json()[0]
        assert "degree_ids" in item
        assert "event_ids" in item
        assert isinstance(item["degree_ids"], list)
        assert isinstance(item["event_ids"], list)

    def test_include_relationships_ids_are_ints(self):
        r = client.get("/modules?include_relationships=true")
        item = r.json()[0]
        for did in item["degree_ids"]:
            assert isinstance(did, int)
        for eid in item["event_ids"]:
            assert isinstance(eid, int)

    def test_include_relationships_false_is_default(self):
        r_default = client.get("/modules")
        r_false = client.get("/modules?include_relationships=false")
        assert r_default.json() == r_false.json()

    def test_module_count_matches_db(self):
        with Session(db_module.engine) as s:
            count = len(s.exec(select(Module)).all())
        r = client.get("/modules")
        assert len(r.json()) == count


class TestModuleDetail:
    def test_existing_module_returns_200(self):
        mid = get_first_id(Module)
        r = client.get(f"/modules/{mid}")
        assert r.status_code == 200

    def test_nonexistent_module_returns_404(self):
        r = client.get(f"/modules/{get_last_id(Module) + 9999}")
        assert r.status_code == 404
        assert r.json()["detail"] == "Module not found"

    def test_flat_response_fields(self):
        mid = get_first_id(Module)
        r = client.get(f"/modules/{mid}")
        data = r.json()
        for field in ("id", "name", "module_number", "credits", "planung", "language"):
            assert field in data

    def test_flat_response_has_no_relationship_fields(self):
        mid = get_first_id(Module)
        r = client.get(f"/modules/{mid}")
        data = r.json()
        assert "degrees" not in data
        assert "events" not in data
        assert "degree_ids" not in data
        assert "event_ids" not in data

    def test_detail_with_relationships_returns_full_objects(self):
        mid = get_first_id(Module)
        r = client.get(f"/modules/{mid}?include_relationships=true")
        assert r.status_code == 200
        data = r.json()
        assert "degrees" in data
        assert "events" in data

    def test_detail_degrees_are_objects_not_ids(self):
        mid = get_first_id(Module)
        r = client.get(f"/modules/{mid}?include_relationships=true")
        data = r.json()
        if data["degrees"]:
            deg = data["degrees"][0]
            assert "id" in deg
            assert "name" in deg

    def test_detail_events_are_objects_not_ids(self):
        mid = get_first_id(Module)
        r = client.get(f"/modules/{mid}?include_relationships=true")
        data = r.json()
        if data["events"]:
            ev = data["events"][0]
            assert "id" in ev
            assert "title" in ev
            assert "type" in ev

    def test_detail_does_not_nest_further(self):
        """Events inside a Module detail must NOT recursively include their own relationships."""
        mid = get_first_id(Module)
        r = client.get(f"/modules/{mid}?include_relationships=true")
        data = r.json()
        if data["events"]:
            ev = data["events"][0]
            assert "module" not in ev
            assert "staff" not in ev

    def test_id_matches_requested(self):
        mid = get_first_id(Module)
        r = client.get(f"/modules/{mid}")
        assert r.json()["id"] == mid


# ---------------------------------------------------------------------------
# /events
# ---------------------------------------------------------------------------

class TestEventsList:
    def test_returns_200(self):
        assert client.get("/events").status_code == 200

    def test_flat_schema_no_relationships(self):
        item = client.get("/events").json()[0]
        assert "module_ids" not in item
        assert "staff_ids" not in item

    def test_flat_schema_fields(self):
        item = client.get("/events").json()[0]
        for field in ("id", "title", "type", "weekday", "start_time", "end_time",
                      "location_id", "status"):
            assert field in item, f"Missing field: {field}"

    def test_include_relationships_has_id_lists(self):
        item = client.get("/events?include_relationships=true").json()[0]
        assert "module_ids" in item
        assert "staff_ids" in item

    def test_time_format(self):
        """start_time and end_time must be valid HH:MM:SS strings."""
        item = client.get("/events").json()[0]
        import re
        pattern = r"^\d{2}:\d{2}(:\d{2})?$"
        assert re.match(pattern, item["start_time"]), f"Bad start_time: {item['start_time']}"
        assert re.match(pattern, item["end_time"]), f"Bad end_time: {item['end_time']}"

    def test_weekday_is_valid_int(self):
        item = client.get("/events").json()[0]
        assert item["weekday"] in range(1, 8)

    def test_count_matches_db(self):
        with Session(db_module.engine) as s:
            count = len(s.exec(select(Event)).all())
        assert len(client.get("/events").json()) == count


class TestEventDetail:
    def test_existing_returns_200(self):
        assert client.get(f"/events/{get_first_id(Event)}").status_code == 200

    def test_missing_returns_404(self):
        r = client.get(f"/events/{get_last_id(Event) + 9999}")
        assert r.status_code == 404
        assert r.json()["detail"] == "Event not found"

    def test_detail_has_full_module_objects(self):
        eid = get_first_id(Event)
        r = client.get(f"/events/{eid}?include_relationships=true")
        data = r.json()
        assert "module" in data
        assert "staff" in data
        if data["module"]:
            mod = data["module"][0]
            assert "name" in mod
            assert "module_number" in mod

    def test_detail_no_relationships_has_no_module_field(self):
        eid = get_first_id(Event)
        data = client.get(f"/events/{eid}").json()
        assert "module" not in data
        assert "staff" not in data


# ---------------------------------------------------------------------------
# /staff
# ---------------------------------------------------------------------------

class TestStaffList:
    def test_returns_200(self):
        assert client.get("/staff").status_code == 200

    def test_flat_schema(self):
        item = client.get("/staff").json()[0]
        assert "id" in item
        assert "name" in item
        assert "event_ids" not in item

    def test_include_relationships_has_event_ids(self):
        item = client.get("/staff?include_relationships=true").json()[0]
        assert "event_ids" in item
        assert isinstance(item["event_ids"], list)

    def test_count_matches_db(self):
        with Session(db_module.engine) as s:
            count = len(s.exec(select(Staff)).all())
        assert len(client.get("/staff").json()) == count


class TestStaffDetail:
    def test_existing_returns_200(self):
        assert client.get(f"/staff/{get_first_id(Staff)}").status_code == 200

    def test_missing_returns_404(self):
        r = client.get(f"/staff/{get_last_id(Staff) + 9999}")
        assert r.status_code == 404
        assert r.json()["detail"] == "Staff member not found"

    def test_detail_has_full_events(self):
        sid = get_first_id(Staff)
        data = client.get(f"/staff/{sid}?include_relationships=true").json()
        assert "events" in data
        if data["events"]:
            ev = data["events"][0]
            assert "title" in ev
            assert "type" in ev

    def test_detail_events_not_nested_further(self):
        sid = get_first_id(Staff)
        data = client.get(f"/staff/{sid}?include_relationships=true").json()
        if data["events"]:
            assert "staff" not in data["events"][0]
            assert "module" not in data["events"][0]


# ---------------------------------------------------------------------------
# /locations
# ---------------------------------------------------------------------------

class TestLocationsList:
    def test_returns_200(self):
        assert client.get("/locations").status_code == 200

    def test_flat_schema(self):
        item = client.get("/locations").json()[0]
        assert "id" in item
        assert "name" in item
        assert "event_ids" not in item

    def test_include_relationships_has_event_ids(self):
        item = client.get("/locations?include_relationships=true").json()[0]
        assert "event_ids" in item

    def test_count_matches_db(self):
        with Session(db_module.engine) as s:
            count = len(s.exec(select(Location)).all())
        assert len(client.get("/locations").json()) == count


class TestLocationDetail:
    def test_existing_returns_200(self):
        assert client.get(f"/locations/{get_first_id(Location)}").status_code == 200

    def test_missing_returns_404(self):
        r = client.get(f"/locations/{get_last_id(Location) + 9999}")
        assert r.status_code == 404

    def test_detail_has_full_events(self):
        lid = get_first_id(Location)
        data = client.get(f"/locations/{lid}?include_relationships=true").json()
        assert "events" in data
        if data["events"]:
            ev = data["events"][0]
            assert "title" in ev
            assert "location_id" in ev

    def test_location_id_in_events_matches_parent(self):
        """Every event nested in a location detail must reference that location."""
        lid = get_first_id(Location)
        data = client.get(f"/locations/{lid}?include_relationships=true").json()
        for ev in data.get("events", []):
            assert ev["location_id"] == lid


# ---------------------------------------------------------------------------
# /degrees
# ---------------------------------------------------------------------------

class TestDegreesList:
    def test_returns_200(self):
        assert client.get("/degrees").status_code == 200

    def test_flat_schema(self):
        item = client.get("/degrees").json()[0]
        assert "id" in item
        assert "name" in item
        assert "module_ids" not in item

    def test_include_relationships_has_module_ids(self):
        item = client.get("/degrees?include_relationships=true").json()[0]
        assert "module_ids" in item

    def test_count_matches_db(self):
        with Session(db_module.engine) as s:
            count = len(s.exec(select(Degree)).all())
        assert len(client.get("/degrees").json()) == count


class TestDegreeDetail:
    def test_existing_returns_200(self):
        assert client.get(f"/degrees/{get_first_id(Degree)}").status_code == 200

    def test_missing_returns_404(self):
        r = client.get(f"/degrees/{get_last_id(Degree) + 9999}")
        assert r.status_code == 404

    def test_detail_has_full_modules(self):
        did = get_first_id(Degree)
        data = client.get(f"/degrees/{did}?include_relationships=true").json()
        assert "modules" in data
        if data["modules"]:
            mod = data["modules"][0]
            assert "name" in mod
            assert "module_number" in mod
            assert "credits" in mod

    def test_detail_modules_not_nested_further(self):
        did = get_first_id(Degree)
        data = client.get(f"/degrees/{did}?include_relationships=true").json()
        if data["modules"]:
            mod = data["modules"][0]
            assert "degrees" not in mod
            assert "events" not in mod


# ---------------------------------------------------------------------------
# /semesters
# ---------------------------------------------------------------------------

class TestSemesters:
    def test_list_returns_200(self):
        assert client.get("/semesters").status_code == 200

    def test_list_has_items(self):
        data = client.get("/semesters").json()
        assert len(data) >= 1

    def test_semester_schema(self):
        item = client.get("/semesters").json()[0]
        assert "id" in item
        assert "name" in item

    def test_detail_existing(self):
        sid = get_first_id(Semester)
        r = client.get(f"/semesters/{sid}")
        assert r.status_code == 200
        assert r.json()["id"] == sid

    def test_detail_missing_returns_404(self):
        r = client.get(f"/semesters/{get_last_id(Semester) + 9999}")
        assert r.status_code == 404
        assert r.json()["detail"] == "Semester not found"


# ---------------------------------------------------------------------------
# Cross-cutting / data integrity
# ---------------------------------------------------------------------------

class TestDataIntegrity:
    def test_module_event_ids_reference_real_events(self):
        """IDs returned in include_relationships must correspond to real events."""
        modules = client.get("/modules?include_relationships=true").json()
        # Just sample the first few to keep it fast
        for mod in modules[:10]:
            for eid in mod["event_ids"]:
                r = client.get(f"/events/{eid}")
                assert r.status_code == 200, (
                    f"Module {mod['id']} references event {eid} which returned {r.status_code}"
                )

    def test_module_degree_ids_reference_real_degrees(self):
        modules = client.get("/modules?include_relationships=true").json()
        for mod in modules[:10]:
            for did in mod["degree_ids"]:
                r = client.get(f"/degrees/{did}")
                assert r.status_code == 200, (
                    f"Module {mod['id']} references degree {did} which returned {r.status_code}"
                )

    def test_event_location_id_references_real_location(self):
        events = client.get("/events").json()
        for ev in events[:20]:
            r = client.get(f"/locations/{ev['location_id']}")
            assert r.status_code == 200, (
                f"Event {ev['id']} has location_id {ev['location_id']} which returned {r.status_code}"
            )

    def test_staff_event_ids_reference_real_events(self):
        staff_list = client.get("/staff?include_relationships=true").json()
        for member in staff_list[:10]:
            for eid in member["event_ids"]:
                r = client.get(f"/events/{eid}")
                assert r.status_code == 200, (
                    f"Staff {member['id']} references event {eid} which returned {r.status_code}"
                )

    def test_no_duplicate_ids_in_module_relationships(self):
        modules = client.get("/modules?include_relationships=true").json()
        for mod in modules[:30]:
            assert len(mod["event_ids"]) == len(set(mod["event_ids"])), (
                f"Module {mod['id']} has duplicate event_ids"
            )
            assert len(mod["degree_ids"]) == len(set(mod["degree_ids"])), (
                f"Module {mod['id']} has duplicate degree_ids"
            )

    def test_all_events_have_valid_weekday(self):
        events = client.get("/events").json()
        for ev in events:
            assert ev["weekday"] in range(1, 8), f"Invalid weekday {ev['weekday']} in event {ev['id']}"

    def test_all_events_start_before_end(self):
        events = client.get("/events").json()
        for ev in events:
            assert ev["start_time"] < ev["end_time"], (
                f"Event {ev['id']} starts at {ev['start_time']} but ends at {ev['end_time']}"
            )

    def test_all_modules_have_non_empty_module_number(self):
        modules = client.get("/modules").json()
        for mod in modules:
            assert mod["module_number"].strip() != "", f"Module {mod['id']} has empty module_number"

    def test_all_modules_have_positive_credits(self):
        modules = client.get("/modules").json()
        for mod in modules:
            assert mod["credits"] > 0, f"Module {mod['id']} has credits={mod['credits']}"

    def test_valid_event_status_values(self):
        valid = {"ok", "pok", "tok", "alt", "reserve"}
        events = client.get("/events").json()
        for ev in events:
            assert ev["status"] in valid, f"Unknown status '{ev['status']}' in event {ev['id']}"
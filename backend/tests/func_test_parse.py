"""Functional tests — full parse_and_populate with realistic HTML fragments."""

from datetime import time
from unittest.mock import patch

import pytest
from sqlmodel import Session, SQLModel, create_engine, select

from database.models import (
    Module, Event, Staff, Location, Degree, Semester,
    ModuleDegreeLink, ModuleEventLink, EventStaffLink,
    EventType, Weekday, Status,
)
from database.parse import parse_and_populate


# ---------------------------------------------------------------------------
# Realistic HTML fragments
# ---------------------------------------------------------------------------

MINIMAL_VALID_HTML = """\
<html><body>
<h1>LV-Planung Sommersemester 2026</h1>

<h2><a name="mod1">Mathematik I</a></h2>
<table class="maintable">
  <tr class="row-module-info"><td>ModulNr</td><td>101-001</td></tr>
  <tr class="row-module-info"><td>Credits</td><td>6</td></tr>
  <tr class="row-module-info"><td>Planung</td><td>FB Mathematik</td></tr>
  <tr class="row-module-info"><td>Sprache</td><td>Deutsch</td></tr>
  <tr class="row-module-info"><td>Studiengang</td><td><span>B.Sc. Informatik 2. Semester [Pflichtmodul]</span></td></tr>
</table>
<table class="maintable" border="1">
  <tr><th>Unit</th><th>Dozent</th><th>Titel</th><th>Zeit</th><th>Raum</th><th>Kap.</th><th>Status</th><th>Extra</th></tr>
  <tr class="ok">
    <td><a href="#">101-001</a></td>
    <td><a href="#">Prof. Schmidt</a></td>
    <td>Mathematik I - Vorlesung</td>
    <td>montags<br/>8:00 - 9:30</td>
    <td><a href="#">Raum A-101</a></td>
    <td>200</td>
    <td>ok</td>
    <td></td>
  </tr>
</table>
</body></html>
"""

TWO_MODULES_HTML = """\
<html><body>
<h1>LV-Planung Wintersemester 2026/27</h1>

<h2><a name="mod1">Algorithmen</a></h2>
<table class="maintable">
  <tr class="row-module-info"><td>ModulNr</td><td>200-001</td></tr>
  <tr class="row-module-info"><td>Credits</td><td>9</td></tr>
  <tr class="row-module-info"><td>Planung</td><td>FB Info</td></tr>
  <tr class="row-module-info"><td>Sprache</td><td>Deutsch</td></tr>
  <tr class="row-module-info"><td>Studiengang</td><td><span>B.Sc. Informatik 3. Semester [Pflichtmodul]</span><span>M.Sc. Informatik 1. Semester [Wahlpflicht]</span></td></tr>
</table>
<table class="maintable" border="1">
  <tr><th>Unit</th><th>Dozent</th><th>Titel</th><th>Zeit</th><th>Raum</th><th>Kap.</th><th>Status</th><th>Extra</th></tr>
  <tr class="ok">
    <td><a href="#">200-001</a></td>
    <td><a href="#">Prof. Müller</a></td>
    <td>Algorithmen - Vorlesung</td>
    <td>dienstags<br/>10:00 - 11:30</td>
    <td><a href="#">Hörsaal 1</a></td>
    <td>150</td>
    <td>ok</td>
    <td></td>
  </tr>
  <tr class="ok">
    <td><a href="#">200-001</a></td>
    <td><a href="#">Dr. Weber</a></td>
    <td>Algorithmen - Übung, Gruppe A</td>
    <td>mittwochs<br/>14:00 - 15:30</td>
    <td><a href="#">Raum B-202</a></td>
    <td>30</td>
    <td>ok</td>
    <td></td>
  </tr>
</table>

<h2><a name="mod2">Ethik der KI</a></h2>
<table class="maintable">
  <tr class="row-module-info"><td>ModulNr</td><td>300-010</td></tr>
  <tr class="row-module-info"><td>Credits</td><td>3</td></tr>
  <tr class="row-module-info"><td>Planung</td><td>FB Philosophie</td></tr>
  <tr class="row-module-info"><td>Sprache</td><td>Englisch</td></tr>
</table>
<table class="maintable" border="1">
  <tr><th>Unit</th><th>Dozent</th><th>Titel</th><th>Zeit</th><th>Raum</th><th>Kap.</th><th>Status</th><th>Extra</th></tr>
  <tr class="pok">
    <td><a href="#">300-010</a></td>
    <td><a href="#">Prof. Lee</a></td>
    <td>Ethik der KI - Seminar</td>
    <td>donnerstags<br/>16:00 - 17:30</td>
    <td><a href="#">Raum C-303</a></td>
    <td>25</td>
    <td>pok</td>
    <td></td>
  </tr>
</table>
</body></html>
"""

NO_H1_HTML = "<html><body><p>No heading</p></body></html>"

MISSING_MODULE_NUMBER_HTML = """\
<html><body>
<h1>LV-Planung Sommersemester 2026</h1>
<h2><a name="bad">Bad Module</a></h2>
<table class="maintable">
  <tr class="row-module-info"><td>ModulNr</td><td></td></tr>
  <tr class="row-module-info"><td>Credits</td><td>3</td></tr>
  <tr class="row-module-info"><td>Planung</td><td>X</td></tr>
  <tr class="row-module-info"><td>Sprache</td><td>Deutsch</td></tr>
</table>
<table class="maintable" border="1">
  <tr><th>Unit</th><th>Dozent</th><th>Titel</th><th>Zeit</th><th>Raum</th><th>Kap.</th><th>Status</th><th>Extra</th></tr>
</table>
</body></html>
"""

OFFEN_TIME_HTML = """\
<html><body>
<h1>LV-Planung Sommersemester 2026</h1>
<h2><a name="offen">Open Module</a></h2>
<table class="maintable">
  <tr class="row-module-info"><td>ModulNr</td><td>400-001</td></tr>
  <tr class="row-module-info"><td>Credits</td><td>6</td></tr>
  <tr class="row-module-info"><td>Planung</td><td>FB X</td></tr>
  <tr class="row-module-info"><td>Sprache</td><td>Deutsch</td></tr>
</table>
<table class="maintable" border="1">
  <tr><th>Unit</th><th>Dozent</th><th>Titel</th><th>Zeit</th><th>Raum</th><th>Kap.</th><th>Status</th><th>Extra</th></tr>
  <tr class="ok">
    <td><a href="#">400-001</a></td>
    <td><a href="#">Prof. Y</a></td>
    <td>Open Module - Vorlesung</td>
    <td>[offen]</td>
    <td><a href="#">Raum D</a></td>
    <td>50</td>
    <td>ok</td>
    <td></td>
  </tr>
</table>
</body></html>
"""


# ---------------------------------------------------------------------------
# Fixtures — in-memory database per test, patching the global engine
# ---------------------------------------------------------------------------

@pytest.fixture()
def _patch_engine():
    """Replace the module-level engine with an in-memory SQLite engine for the test."""
    test_engine = create_engine("sqlite://", echo=False)
    SQLModel.metadata.create_all(test_engine)
    with patch("database.parse.engine", test_engine), \
         patch("database.database.engine", test_engine):
        yield test_engine


@pytest.fixture()
def db_session(_patch_engine):
    """Yield a session bound to the patched in-memory engine."""
    with Session(_patch_engine) as session:
        yield session


# ===================================================================
# Happy-path: single module HTML
# ===================================================================

class TestParseMinimalHtml:
    def test_semester_created(self, _patch_engine, db_session: Session):
        with patch("database.parse._fetch_html", return_value=MINIMAL_VALID_HTML):
            parse_and_populate()
        sem = db_session.exec(select(Semester)).first()
        assert sem is not None
        assert sem.name == "SoSe 2026"

    def test_module_created(self, _patch_engine, db_session: Session):
        with patch("database.parse._fetch_html", return_value=MINIMAL_VALID_HTML):
            parse_and_populate()
        mod = db_session.exec(select(Module)).first()
        assert mod is not None
        assert mod.module_number == "101-001"
        assert mod.name == "Mathematik I"
        assert mod.credits == 6

    def test_event_created(self, _patch_engine, db_session: Session):
        with patch("database.parse._fetch_html", return_value=MINIMAL_VALID_HTML):
            parse_and_populate()
        ev = db_session.exec(select(Event)).first()
        assert ev is not None
        assert ev.title == "Mathematik I - Vorlesung"
        assert ev.type == EventType.LECTURE
        assert ev.weekday == Weekday.MONDAY
        assert ev.start_time == time(8, 0)
        assert ev.end_time == time(9, 30)
        assert ev.status == Status.OK

    def test_staff_linked(self, _patch_engine, db_session: Session):
        with patch("database.parse._fetch_html", return_value=MINIMAL_VALID_HTML):
            parse_and_populate()
        staff = db_session.exec(select(Staff)).first()
        assert staff is not None
        assert staff.name == "Prof. Schmidt"

    def test_location_linked(self, _patch_engine, db_session: Session):
        with patch("database.parse._fetch_html", return_value=MINIMAL_VALID_HTML):
            parse_and_populate()
        loc = db_session.exec(select(Location)).first()
        assert loc is not None
        assert loc.name == "Raum A-101"

    def test_degree_and_semester_link(self, _patch_engine, db_session: Session):
        with patch("database.parse._fetch_html", return_value=MINIMAL_VALID_HTML):
            parse_and_populate()
        deg = db_session.exec(select(Degree)).first()
        assert deg is not None
        assert deg.name == "B.Sc. Informatik"

        link = db_session.exec(select(ModuleDegreeLink)).first()
        assert link is not None
        assert link.semester == 2
        assert link.note == "Pflichtmodul"


# ===================================================================
# Multiple modules, events, staff, degrees
# ===================================================================

class TestParseTwoModulesHtml:
    def test_two_modules_created(self, _patch_engine, db_session: Session):
        with patch("database.parse._fetch_html", return_value=TWO_MODULES_HTML):
            parse_and_populate()
        modules = db_session.exec(select(Module)).all()
        assert len(modules) == 2
        numbers = {m.module_number for m in modules}
        assert numbers == {"200-001", "300-010"}

    def test_three_events_created(self, _patch_engine, db_session: Session):
        with patch("database.parse._fetch_html", return_value=TWO_MODULES_HTML):
            parse_and_populate()
        events = db_session.exec(select(Event)).all()
        assert len(events) == 3

    def test_semester_is_wise(self, _patch_engine, db_session: Session):
        with patch("database.parse._fetch_html", return_value=TWO_MODULES_HTML):
            parse_and_populate()
        sem = db_session.exec(select(Semester)).first()
        assert sem is not None
        assert sem.name == "WiSe 2026/27"

    def test_pok_status(self, _patch_engine, db_session: Session):
        with patch("database.parse._fetch_html", return_value=TWO_MODULES_HTML):
            parse_and_populate()
        ev = db_session.exec(
            select(Event).where(Event.title == "Ethik der KI - Seminar")
        ).first()
        assert ev is not None
        assert ev.status == Status.POK

    def test_multiple_degrees_linked(self, _patch_engine, db_session: Session):
        with patch("database.parse._fetch_html", return_value=TWO_MODULES_HTML):
            parse_and_populate()
        degrees = db_session.exec(select(Degree)).all()
        names = {d.name for d in degrees}
        assert "B.Sc. Informatik" in names
        assert "M.Sc. Informatik" in names

    def test_multiple_staff_created(self, _patch_engine, db_session: Session):
        with patch("database.parse._fetch_html", return_value=TWO_MODULES_HTML):
            parse_and_populate()
        staff = db_session.exec(select(Staff)).all()
        names = {s.name for s in staff}
        assert names == {"Prof. Müller", "Dr. Weber", "Prof. Lee"}


# ===================================================================
# Edge cases / error handling
# ===================================================================

class TestParseEdgeCases:
    def test_no_h1_aborts_gracefully(self, _patch_engine, db_session: Session):
        with patch("database.parse._fetch_html", return_value=NO_H1_HTML):
            parse_and_populate()
        assert db_session.exec(select(Semester)).first() is None
        assert db_session.exec(select(Module)).first() is None

    def test_missing_module_number_skipped(self, _patch_engine, db_session: Session):
        with patch("database.parse._fetch_html", return_value=MISSING_MODULE_NUMBER_HTML):
            parse_and_populate()
        assert db_session.exec(select(Module)).first() is None

    def test_offen_time_skipped(self, _patch_engine, db_session: Session):
        with patch("database.parse._fetch_html", return_value=OFFEN_TIME_HTML):
            parse_and_populate()
        # Module should exist but event should be skipped
        mod = db_session.exec(select(Module)).first()
        assert mod is not None
        assert mod.module_number == "400-001"
        events = db_session.exec(select(Event)).all()
        assert len(events) == 0

    def test_idempotent_double_parse(self, _patch_engine, db_session: Session):
        """Running parse_and_populate twice with the same semester should not duplicate data."""
        with patch("database.parse._fetch_html", return_value=MINIMAL_VALID_HTML):
            parse_and_populate()
            parse_and_populate()
        modules = db_session.exec(select(Module)).all()
        assert len(modules) == 1
        events = db_session.exec(select(Event)).all()
        assert len(events) == 1

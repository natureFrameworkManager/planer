"""Unit tests for database.parse — isolated logic, edge cases, mocked dependencies."""

import re
from datetime import time
from unittest.mock import MagicMock, patch

import httpx
import pytest
from bs4 import BeautifulSoup, Tag

from database.models import EventType, Weekday, Status
from database.parse import (
    WEEKDAY_MAP,
    STATUS_MAP,
    EVENT_TYPE_BY_VALUE,
    _fetch_html,
    _parse_degree_string,
    _parse_time_cell,
    _extract_event_type,
    _parse_staff_names,
    _parse_location_name,
    _parse_unit_module_numbers,
    _parse_module_info,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _td(html: str) -> Tag:
    """Wrap raw HTML in a <td> and return the Tag."""
    soup = BeautifulSoup(f"<td>{html}</td>", "html.parser")
    return soup.find("td")  # type: ignore[return-value]


def _table(rows_html: str) -> Tag:
    """Wrap rows HTML in a <table class='maintable'> and return the Tag."""
    soup = BeautifulSoup(
        f'<table class="maintable">{rows_html}</table>', "html.parser"
    )
    return soup.find("table")  # type: ignore[return-value]


# ===================================================================
# WEEKDAY_MAP / STATUS_MAP / EVENT_TYPE_BY_VALUE completeness
# ===================================================================

class TestMappings:
    def test_weekday_map_covers_all_weekdays(self):
        assert set(WEEKDAY_MAP.values()) == set(Weekday)

    def test_status_map_covers_all_statuses(self):
        assert set(STATUS_MAP.values()) == set(Status)

    def test_event_type_by_value_covers_all_types(self):
        assert set(EVENT_TYPE_BY_VALUE.values()) == set(EventType)


# ===================================================================
# _fetch_html
# ===================================================================

class TestFetchHtml:
    @patch("database.parse.httpx.get")
    def test_returns_response_text(self, mock_get: MagicMock):
        mock_get.return_value = MagicMock(text="<html></html>")
        assert _fetch_html() == "<html></html>"

    @patch("database.parse.httpx.get")
    def test_raises_on_http_error(self, mock_get: MagicMock):
        mock_resp = MagicMock()
        mock_resp.raise_for_status.side_effect = httpx.HTTPStatusError(
            "Server Error", request=MagicMock(), response=MagicMock()
        )
        mock_get.return_value = mock_resp
        with pytest.raises(httpx.HTTPStatusError):
            _fetch_html()


# ===================================================================
# _parse_degree_string
# ===================================================================

class TestParseDegreeString:
    def test_simple_with_semester_and_note(self):
        name, sems, note = _parse_degree_string(
            "B.Sc. Informatik 2. Semester [Pflichtmodul]"
        )
        assert name == "B.Sc. Informatik"
        assert sems == [2]
        assert note == "Pflichtmodul"

    def test_multiple_bracket_and_paren_notes(self):
        name, sems, note = _parse_degree_string(
            "M.Sc. Informatik 2. Semester [Kernmodul]\xa0(25 Plätze)"
        )
        assert name == "M.Sc. Informatik"
        assert sems == [2]
        assert note == "Kernmodul, 25 Plätze"

    def test_multiple_semesters(self):
        name, sems, note = _parse_degree_string(
            "Dipl. Mathematik 5., 6. Semester"
        )
        assert name == "Dipl. Mathematik"
        assert sems == [5, 6]
        assert note is None

    def test_no_semester_no_note(self):
        name, sems, note = _parse_degree_string("Senioren-Studium")
        assert name == "Senioren-Studium"
        assert sems == []
        assert note is None

    def test_three_semesters(self):
        name, sems, note = _parse_degree_string(
            "B.Sc. Physik 1., 2., 3. Semester"
        )
        assert name == "B.Sc. Physik"
        assert sems == [1, 2, 3]
        assert note is None

    def test_whitespace_handling(self):
        name, sems, note = _parse_degree_string("  Some Degree  ")
        assert name == "Some Degree"
        assert sems == []
        assert note is None

    def test_empty_string(self):
        name, sems, note = _parse_degree_string("")
        assert name == ""
        assert sems == []
        assert note is None

    def test_note_only_no_semester(self):
        name, sems, note = _parse_degree_string(
            "B.Sc. Informatik [Wahlpflicht]"
        )
        assert name == "B.Sc. Informatik"
        assert sems == []
        assert note == "Wahlpflicht"

    def test_bracket_and_paren_notes(self):
        name, semesters, note = _parse_degree_string(
            "M.Sc. Informatik 2. Semester [Kernmodul]\xa0(25 Plätze)"
        )
        assert name == "M.Sc. Informatik"
        assert semesters == [2]
        assert note == "Kernmodul, 25 Plätze"

    def test_whitespace_stripped(self):
        name, semesters, note = _parse_degree_string("  B.A. Geschichte  ")
        assert name == "B.A. Geschichte"
        assert semesters == []
        assert note is None

    @pytest.mark.parametrize("raw, expected_name, expected_semesters, expected_note", [
        # --- M.Sc. Mathematics (English notes) ---
        ("M.Sc. Mathematics 2. Semester [Advanced Module]",                                    "M.Sc. Mathematics",                        [2],       "Advanced Module"),
        ("M.Sc. Mathematics 1. Semester [Advanced Module]",                                    "M.Sc. Mathematics",                        [1],       "Advanced Module"),
        ("M.Sc. Mathematics 1., 2., 3. Semester [Supplementary Modules]",                      "M.Sc. Mathematics",                        [1, 2, 3], "Supplementary Modules"),
        ("M.Sc. Mathematics 2., 3. Semester [Professionalisation Modules]",                    "M.Sc. Mathematics",                        [2, 3],    "Professionalisation Modules"),
        ("M.Sc. Mathematics 2. Semester [Basic Module]",                                       "M.Sc. Mathematics",                        [2],       "Basic Module"),
        ("M.Sc. Mathematics 1. Semester [Basic Module]",                                       "M.Sc. Mathematics",                        [1],       "Basic Module"),
        ("M.Sc. Mathematics 2. Semester [Specialisation Module]",                              "M.Sc. Mathematics",                        [2],       "Specialisation Module"),
        ("M.Sc. Mathematics 3. Semester [Supplementary Modules]",                              "M.Sc. Mathematics",                        [3],       "Supplementary Modules"),
        ("M.Sc. Mathematics 3. Semester [Pflichtmodul]",                                       "M.Sc. Mathematics",                        [3],       "Pflichtmodul"),
        ("M.Sc. Mathematics 4. Semester [Pflichtmodul]",                                       "M.Sc. Mathematics",                        [4],       "Pflichtmodul"),
        # --- M.Sc. Mathematical Physics (no note) ---
        ("M.Sc. Mathematical Physics 2. Semester",                                             "M.Sc. Mathematical Physics",               [2],       None),
        ("M.Sc. Mathematical Physics 2., 3. Semester",                                         "M.Sc. Mathematical Physics",               [2, 3],    None),
        ("M.Sc. Mathematical Physics 3. Semester",                                             "M.Sc. Mathematical Physics",               [3],       None),
        # --- M.Sc. Bioinformatik ---
        ("M.Sc. Bioinformatik 1., 3. Semester [Wahlpflichtbereich Informatik]",                "M.Sc. Bioinformatik",                      [1, 3],    "Wahlpflichtbereich Informatik"),
        ("M.Sc. Bioinformatik 2. Semester [Wahlpflichtbereich Informatik] (7 Plätze)",         "M.Sc. Bioinformatik",                      [2],       "Wahlpflichtbereich Informatik, 7 Plätze"),
        ("M.Sc. Bioinformatik 2. Semester [Wahlpflichtbereich Informatik]",                    "M.Sc. Bioinformatik",                      [2],       "Wahlpflichtbereich Informatik"),
        ("M.Sc. Bioinformatik 2. Semester [Wahlpflichtbereich Informatik] (4 Plätze)",         "M.Sc. Bioinformatik",                      [2],       "Wahlpflichtbereich Informatik, 4 Plätze"),
        ("M.Sc. Bioinformatik 1., 2., 3. Semester [Wahlpflichtbereich Science] (5 Plätze)",    "M.Sc. Bioinformatik",                      [1, 2, 3], "Wahlpflichtbereich Science, 5 Plätze"),
        ("M.Sc. Bioinformatik 2. Semester [Wahlpflichtbereich Life Science] (20 Plätze)",      "M.Sc. Bioinformatik",                      [2],       "Wahlpflichtbereich Life Science, 20 Plätze"),
        ("M.Sc. Bioinformatik 2., 3., 4. Semester [Wahlpflichtbereich Life Science]",          "M.Sc. Bioinformatik",                      [2, 3, 4], "Wahlpflichtbereich Life Science"),
        ("M.Sc. Bioinformatik 2. Semester [Pflichtmodul]",                                     "M.Sc. Bioinformatik",                      [2],       "Pflichtmodul"),
        ("M.Sc. Bioinformatik 4. Semester [Pflichtmodul]",                                     "M.Sc. Bioinformatik",                      [4],       "Pflichtmodul"),
        ("M.Sc. Bioinformatik 4. Semester [Wahlpflichtmodul]",                                 "M.Sc. Bioinformatik",                      [4],       "Wahlpflichtmodul"),
        ("M.Sc. Bioinformatik 2. Semester [Wahlpflichtmodul]",                                 "M.Sc. Bioinformatik",                      [2],       "Wahlpflichtmodul"),
        ("M.Sc. Bioinformatik 3. Semester",                                                    "M.Sc. Bioinformatik",                      [3],       None),
        # --- M.Sc. Data Science ---
        ("M.Sc. Data Science 2. Semester [Skalierbares Datenmanagement]",                      "M.Sc. Data Science",                       [2],       "Skalierbares Datenmanagement"),
        ("M.Sc. Data Science 2. Semester [Ergänzungs- und Anwendungsbereich]",                 "M.Sc. Data Science",                       [2],       "Ergänzungs- und Anwendungsbereich"),
        ("M.Sc. Data Science 2. Semester [Ergänzungs- und Anwendungsbereich] (10 Plätze)",     "M.Sc. Data Science",                       [2],       "Ergänzungs- und Anwendungsbereich, 10 Plätze"),
        ("M.Sc. Data Science 2., 4. Semester [Ergänzungsbereich]",                             "M.Sc. Data Science",                       [2, 4],    "Ergänzungsbereich"),
        ("M.Sc. Data Science 2., 4. Semester [Skalierbares Datenmanagement]",                  "M.Sc. Data Science",                       [2, 4],    "Skalierbares Datenmanagement"),
        ("M.Sc. Data Science 2., 4. Semester [Skalierbares Datenmanagement] (20 Plätze)",      "M.Sc. Data Science",                       [2, 4],    "Skalierbares Datenmanagement, 20 Plätze"),
        ("M.Sc. Data Science 2., 4. Semester [Skalierbares Datenmanagement] (25 Plätze)",      "M.Sc. Data Science",                       [2, 4],    "Skalierbares Datenmanagement, 25 Plätze"),
        ("M.Sc. Data Science 2., 3., 4. Semester [Wahlpflichtbereich Statistik]",              "M.Sc. Data Science",                       [2, 3, 4], "Wahlpflichtbereich Statistik"),
        ("M.Sc. Data Science 1., 3. Semester [Wahlpflichtbereich Datenanalyse]",               "M.Sc. Data Science",                       [1, 3],    "Wahlpflichtbereich Datenanalyse"),
        ("M.Sc. Data Science 1., 3. Semester (5 Plätze)",                                      "M.Sc. Data Science",                       [1, 3],    "5 Plätze"),
        ("M.Sc. Data Science 1., 2., 3. Semester [Skalierbares Datenmanagement]",              "M.Sc. Data Science",                       [1, 2, 3], "Skalierbares Datenmanagement"),
        ("M.Sc. Data Science 2. Semester [Wahlpflichtbereich Datenanalyse]",                   "M.Sc. Data Science",                       [2],       "Wahlpflichtbereich Datenanalyse"),
        ("M.Sc. Data Science 2. Semester",                                                     "M.Sc. Data Science",                       [2],       None),
        ("M.Sc. Data Science 4. Semester [Pflichtmodul]",                                      "M.Sc. Data Science",                       [4],       "Pflichtmodul"),
        # --- M.Sc. Digital Humanities ---
        ("M.Sc. Digital Humanities 1., 2., 3. Semester [Wahlpflichtmodul] (5 Plätze)",         "M.Sc. Digital Humanities",                 [1, 2, 3], "Wahlpflichtmodul, 5 Plätze"),
        ("M.Sc. Digital Humanities 2., 3. Semester [Wahlpflichtmodul] (15 Plätze)",            "M.Sc. Digital Humanities",                 [2, 3],    "Wahlpflichtmodul, 15 Plätze"),
        ("M.Sc. Digital Humanities 2., 3. Semester [Wahlpflichtmodul]",                        "M.Sc. Digital Humanities",                 [2, 3],    "Wahlpflichtmodul"),
        ("M.Sc. Digital Humanities 1., 2., 3. Semester [Wahlpflichtbereich Informatik] (10 Plätze)", "M.Sc. Digital Humanities",            [1, 2, 3], "Wahlpflichtbereich Informatik, 10 Plätze"),
        ("M.Sc. Digital Humanities 2., 3. Semester [Pflichtmodul]",                            "M.Sc. Digital Humanities",                 [2, 3],    "Pflichtmodul"),
        ("M.Sc. Digital Humanities 3., 4. Semester [Pflichtmodul]",                            "M.Sc. Digital Humanities",                 [3, 4],    "Pflichtmodul"),
        ("M.Sc. Digital Humanities 2. Semester [Pflichtmodul] (15 Plätze)",                    "M.Sc. Digital Humanities",                 [2],       "Pflichtmodul, 15 Plätze"),
        # --- M.Sc. Informatik ---
        ("M.Sc. Informatik 2. Semester [Kernmodul] (25 Plätze)",                               "M.Sc. Informatik",                         [2],       "Kernmodul, 25 Plätze"),
        ("M.Sc. Informatik 1. Semester [Kernmodul]",                                           "M.Sc. Informatik",                         [1],       "Kernmodul"),
        ("M.Sc. Informatik 2. Semester [Kernmodul]",                                           "M.Sc. Informatik",                         [2],       "Kernmodul"),
        ("M.Sc. Informatik 1., 2. Semester [Kernmodul]",                                       "M.Sc. Informatik",                         [1, 2],    "Kernmodul"),
        ("M.Sc. Informatik 1., 3. Semester [Kernmodul]",                                       "M.Sc. Informatik",                         [1, 3],    "Kernmodul"),
        ("M.Sc. Informatik 1. Semester [Kernmodul] (40 Plätze)",                               "M.Sc. Informatik",                         [1],       "Kernmodul, 40 Plätze"),
        ("M.Sc. Informatik 2. Semester [Vertiefungsmodul] (11 Plätze)",                        "M.Sc. Informatik",                         [2],       "Vertiefungsmodul, 11 Plätze"),
        ("M.Sc. Informatik 2. Semester [Vertiefungsmodul] (15 Plätze)",                        "M.Sc. Informatik",                         [2],       "Vertiefungsmodul, 15 Plätze"),
        ("M.Sc. Informatik 2. Semester [Vertiefungsmodul] (25 Plätze)",                        "M.Sc. Informatik",                         [2],       "Vertiefungsmodul, 25 Plätze"),
        ("M.Sc. Informatik 2. Semester [Seminarmodul]",                                        "M.Sc. Informatik",                         [2],       "Seminarmodul"),
        ("M.Sc. Informatik 3. Semester [Seminarmodul]",                                        "M.Sc. Informatik",                         [3],       "Seminarmodul"),
        ("M.Sc. Informatik 1. Semester [Seminarmodul]",                                        "M.Sc. Informatik",                         [1],       "Seminarmodul"),
        ("M.Sc. Informatik 2., 3. Semester [SQ-Modul] (15 Plätze)",                            "M.Sc. Informatik",                         [2, 3],    "SQ-Modul, 15 Plätze"),
        # --- M.Sc. Medizininformatik ---
        ("M.Sc. Medizininformatik 2. Semester [Wahlpflichtbereich Medizininformatik]",         "M.Sc. Medizininformatik",                  [2],       "Wahlpflichtbereich Medizininformatik"),
        ("M.Sc. Medizininformatik 2. Semester [Pflichtmodul]",                                 "M.Sc. Medizininformatik",                  [2],       "Pflichtmodul"),
        ("M.Sc. Medizininformatik 4., 5. Semester [Pflichtmodul]",                             "M.Sc. Medizininformatik",                  [4, 5],    "Pflichtmodul"),
        # --- B.Sc. Digital Humanities ---
        ("B.Sc. Digital Humanities 4. Semester [Pflichtmodul]",                                "B.Sc. Digital Humanities",                 [4],       "Pflichtmodul"),
        ("B.Sc. Digital Humanities 2. Semester [Pflichtmodul]",                                "B.Sc. Digital Humanities",                 [2],       "Pflichtmodul"),
        ("B.Sc. Digital Humanities 2. Semester [Pflichtmodul] (45 Plätze)",                    "B.Sc. Digital Humanities",                 [2],       "Pflichtmodul, 45 Plätze"),
        ("B.Sc. Digital Humanities 6. Semester [Pflichtmodul]",                                "B.Sc. Digital Humanities",                 [6],       "Pflichtmodul"),
        ("B.Sc. Digital Humanities 4., 6. Semester [Kernmodul] (6 Plätze)",                    "B.Sc. Digital Humanities",                 [4, 6],    "Kernmodul, 6 Plätze"),
        ("B.Sc. Digital Humanities 4., 6. Semester [Kernmodul] (25 Plätze)",                   "B.Sc. Digital Humanities",                 [4, 6],    "Kernmodul, 25 Plätze"),
        ("B.Sc. Digital Humanities 4., 6. Semester [Kernmodul] (10 Plätze)",                   "B.Sc. Digital Humanities",                 [4, 6],    "Kernmodul, 10 Plätze"),
        ("B.Sc. Digital Humanities 4., 6. Semester [Kernmodul]",                               "B.Sc. Digital Humanities",                 [4, 6],    "Kernmodul"),
        ("B.Sc. Digital Humanities 5. Semester [Vertiefungsmodul]",                            "B.Sc. Digital Humanities",                 [5],       "Vertiefungsmodul"),
        ("B.Sc. Digital Humanities 4., 6. Semester [Vertiefungsmodul] (5 Plätze)",             "B.Sc. Digital Humanities",                 [4, 6],    "Vertiefungsmodul, 5 Plätze"),
        # --- B.Sc. Informatik ---
        ("B.Sc. Informatik 5., 6. Semester [Pflichtmodul]",                                    "B.Sc. Informatik",                         [5, 6],    "Pflichtmodul"),
        ("B.Sc. Informatik 4. Semester [Pflichtmodul]",                                        "B.Sc. Informatik",                         [4],       "Pflichtmodul"),
        ("B.Sc. Informatik 2. Semester [Pflichtmodul]",                                        "B.Sc. Informatik",                         [2],       "Pflichtmodul"),
        ("B.Sc. Informatik 4., 6. Semester [Kernmodul] (35 Plätze)",                           "B.Sc. Informatik",                         [4, 6],    "Kernmodul, 35 Plätze"),
        ("B.Sc. Informatik 4., 6. Semester [Kernmodul]",                                       "B.Sc. Informatik",                         [4, 6],    "Kernmodul"),
        ("B.Sc. Informatik 4. Semester [Kernmodul]",                                           "B.Sc. Informatik",                         [4],       "Kernmodul"),
        ("B.Sc. Informatik 5. Semester [Kernmodul] (25 Plätze)",                               "B.Sc. Informatik",                         [5],       "Kernmodul, 25 Plätze"),
        ("B.Sc. Informatik 6. Semester [Kernmodul]",                                           "B.Sc. Informatik",                         [6],       "Kernmodul"),
        ("B.Sc. Informatik 6. Semester [Kernmodul] (25 Plätze)",                               "B.Sc. Informatik",                         [6],       "Kernmodul, 25 Plätze"),
        ("B.Sc. Informatik 5. Semester [Vertiefungsmodul] (30 Plätze)",                        "B.Sc. Informatik",                         [5],       "Vertiefungsmodul, 30 Plätze"),
        ("B.Sc. Informatik 4., 5., 6. Semester [Seminarmodul]",                                "B.Sc. Informatik",                         [4, 5, 6], "Seminarmodul"),
        # --- B.Sc. Mathematik ---
        ("B.Sc. Mathematik 4., 6. Semester [Wahlpflichtbereich Gruppe A]",                     "B.Sc. Mathematik",                         [4, 6],    "Wahlpflichtbereich Gruppe A"),
        ("B.Sc. Mathematik 2. Semester [Pflichtmodul]",                                        "B.Sc. Mathematik",                         [2],       "Pflichtmodul"),
        ("B.Sc. Mathematik 5., 6. Semester [Pflichtmodul]",                                    "B.Sc. Mathematik",                         [5, 6],    "Pflichtmodul"),
        ("B.Sc. Mathematik 4. Semester [Wahlpflichtbereich Gruppe A]",                         "B.Sc. Mathematik",                         [4],       "Wahlpflichtbereich Gruppe A"),
        ("B.Sc. Mathematik 4., 6. Semester [Wahlpflichtbereich Informatik] (5 Plätze)",        "B.Sc. Mathematik",                         [4, 6],    "Wahlpflichtbereich Informatik, 5 Plätze"),
        ("B.Sc. Mathematik 4., 6. Semester [Wahlpflichtbereich Gruppe B]",                     "B.Sc. Mathematik",                         [4, 6],    "Wahlpflichtbereich Gruppe B"),
        ("B.Sc. Mathematik 4. Semester [Pflichtmodul]",                                        "B.Sc. Mathematik",                         [4],       "Pflichtmodul"),
        ("B.Sc. Mathematik 6. Semester [Wahlpflichtbereich Gruppe A]",                         "B.Sc. Mathematik",                         [6],       "Wahlpflichtbereich Gruppe A"),
        ("B.Sc. Mathematik 4., 5., 6. Semester [Wahlpflichtbereich Gruppe A]",                 "B.Sc. Mathematik",                         [4, 5, 6], "Wahlpflichtbereich Gruppe A"),
        ("B.Sc. Mathematik 4. Semester [Wahlpflichtbereich Gruppe B]",                         "B.Sc. Mathematik",                         [4],       "Wahlpflichtbereich Gruppe B"),
        # --- B.Sc. Physik / International Physics ---
        ("B.Sc. Physik 2. Semester",                                                           "B.Sc. Physik",                             [2],       None),
        ("B.Sc. International Physics Studies Program 2. Semester",                            "B.Sc. International Physics Studies Program", [2],    None),
        ("B.Sc. International Physics Studies Program 4. Semester",                            "B.Sc. International Physics Studies Program", [4],    None),
        # --- Dipl. ---
        ("Dipl. Mathematik 4. Semester [Pflichtmodul]",                                        "Dipl. Mathematik",                         [4],       "Pflichtmodul"),
        ("Dipl. Mathematik 2. Semester",                                                       "Dipl. Mathematik",                         [2],       None),
        ("Dipl. Mathematik 4. Semester",                                                       "Dipl. Mathematik",                         [4],       None),
        ("Dipl. Mathematik 5., 6. Semester",                                                   "Dipl. Mathematik",                         [5, 6],    None),
        ("Dipl. Wirtschaftsmathematik 4. Semester",                                            "Dipl. Wirtschaftsmathematik",              [4],       None),
        # --- LA Mathematik ---
        ("LA Mathematik Berufsbildende Schulen 4. Semester [Pflichtmodul]",                    "LA Mathematik Berufsbildende Schulen",     [4],       "Pflichtmodul"),
        ("LA Mathematik Berufsbildende Schulen 8. Semester [Pflichtmodul]",                    "LA Mathematik Berufsbildende Schulen",     [8],       "Pflichtmodul"),
        ("LA Mathematik Berufsbildende Schulen 6. Semester [Pflichtmodul]",                    "LA Mathematik Berufsbildende Schulen",     [6],       "Pflichtmodul"),
        ("LA Mathematik Berufsbildende Schulen 7., 8. Semester [Pflichtmodul]",                "LA Mathematik Berufsbildende Schulen",     [7, 8],    "Pflichtmodul"),
        ("LA Mathematik Berufsbildende Schulen 5., 6. Semester [Pflichtmodul]",                "LA Mathematik Berufsbildende Schulen",     [5, 6],    "Pflichtmodul"),
        ("LA Mathematik Berufsbildende Schulen 2. Semester [Pflichtmodul]",                    "LA Mathematik Berufsbildende Schulen",     [2],       "Pflichtmodul"),
        ("LA Mathematik Grundschulen 2. Semester [Pflichtmodul]",                              "LA Mathematik Grundschulen",               [2],       "Pflichtmodul"),
        ("LA Mathematik Oberschule 8. Semester [Pflichtmodul]",                                "LA Mathematik Oberschule",                 [8],       "Pflichtmodul"),
        # --- LA Informatik ---
        ("LA Informatik Berufsbildende Schulen 7., 8. Semester [Pflichtmodul]",                "LA Informatik Berufsbildende Schulen",     [7, 8],    "Pflichtmodul"),
        ("LA Informatik Sonderpädagogik 8. Semester [Pflichtmodul]",                           "LA Informatik Sonderpädagogik",            [8],       "Pflichtmodul"),
        ("LA Informatik Berufsbildende Schulen 5. Semester [Pflichtmodul]",                    "LA Informatik Berufsbildende Schulen",     [5],       "Pflichtmodul"),
        ("LA Informatik Gymnasien [Wahlpflichtmodul]",                                         "LA Informatik Gymnasien",                  [],        "Wahlpflichtmodul"),
        ("LA Informatik Berufsbildende Schulen 2., 3. Semester",                               "LA Informatik Berufsbildende Schulen",     [2, 3],    None),
        # --- Special / bracket-starting codes ---
        ("[LA.Math-O+S]: ?? Plätze",                                                           "[LA.Math-O+S]: ?? Plätze",                 [],        None),
        ("[LA.Inf-G+B]: ?? Plätze",                                                            "[LA.Inf-G+B]: ?? Plätze",                  [],        None),
        ("[LA.Inf-G+B]: 25 Plätze",                                                            "[LA.Inf-G+B]: 25 Plätze",                  [],        None),
        # --- No-semester entries with bracket note ---
        ("Fakultätsübergreifende Schlüsselqualifikation [Schlüsselqualifikation]",             "Fakultätsübergreifende Schlüsselqualifikation", [],   "Schlüsselqualifikation"),
    ])
    def test_real_world_degree_strings(self, raw, expected_name, expected_semesters, expected_note):
        name, semesters, note = _parse_degree_string(raw)
        assert name == expected_name
        assert semesters == expected_semesters
        assert note == expected_note



# ===================================================================
# _parse_time_cell
# ===================================================================

class TestParseTimeCell:
    def test_valid_weekday_and_time(self):
        td = _td("montags<br/>8:00 - 9:30")
        wd, start, end = _parse_time_cell(td)
        assert wd == Weekday.MONDAY
        assert start == time(8, 0)
        assert end == time(9, 30)

    def test_two_digit_hours(self):
        td = _td("freitags<br/>14:00 - 15:30")
        wd, start, end = _parse_time_cell(td)
        assert wd == Weekday.FRIDAY
        assert start == time(14, 0)
        assert end == time(15, 30)

    def test_empty_cell(self):
        td = _td("")
        wd, start, end = _parse_time_cell(td)
        assert wd is None
        assert start is None
        assert end is None

    def test_offen_marker(self):
        td = _td("[offen]")
        wd, start, end = _parse_time_cell(td)
        assert wd is None
        assert start is None
        assert end is None

    def test_weekday_without_time(self):
        td = _td("mittwochs")
        wd, start, end = _parse_time_cell(td)
        assert wd == Weekday.WEDNESDAY
        assert start is None
        assert end is None

    def test_all_weekdays_recognized(self):
        for label, expected in WEEKDAY_MAP.items():
            td = _td(f"{label}<br/>10:00 - 11:00")
            wd, _, _ = _parse_time_cell(td)
            assert wd == expected, f"Failed for {label}"

    def test_time_with_extra_spaces(self):
        td = _td("dienstags<br/>8:00  -  9:30")
        wd, start, end = _parse_time_cell(td)
        assert wd == Weekday.TUESDAY
        assert start == time(8, 0)
        assert end == time(9, 30)

    def test_normal_time(self):
        td = _td("montags<br/>8:00 - 9:30")
        weekday, start, end = _parse_time_cell(td)
        assert weekday == Weekday.MONDAY
        assert start == time(8, 0)
        assert end == time(9, 30)

    def test_padded_times(self):
        td = _td("freitags<br/>08:00 - 09:30")
        weekday, start, end = _parse_time_cell(td)
        assert weekday == Weekday.FRIDAY
        assert start == time(8, 0)
        assert end == time(9, 30)

    def test_afternoon(self):
        td = _td("dienstags<br/>14:00 - 15:30")
        weekday, start, end = _parse_time_cell(td)
        assert weekday == Weekday.TUESDAY
        assert start == time(14, 0)
        assert end == time(15, 30)

    def test_all_weekdays(self):
        for german, expected in [
            ("montags", Weekday.MONDAY),
            ("dienstags", Weekday.TUESDAY),
            ("mittwochs", Weekday.WEDNESDAY),
            ("donnerstags", Weekday.THURSDAY),
            ("freitags", Weekday.FRIDAY),
            ("samstags", Weekday.SATURDAY),
            ("sonntags", Weekday.SUNDAY),
        ]:
            td = _td(f"{german}<br/>10:00 - 11:30")
            weekday, start, end = _parse_time_cell(td)
            assert weekday == expected, f"Failed for {german}"


# ===================================================================
# _extract_event_type
# ===================================================================

class TestExtractEventType:
    def test_vorlesung(self):
        assert _extract_event_type("Mathe I - Vorlesung") == EventType.LECTURE

    def test_uebung(self):
        assert _extract_event_type("Mathe I - Übung") == EventType.EXERCISE

    def test_seminar(self):
        assert _extract_event_type("Ethik - Seminar") == EventType.SEMINAR

    def test_vorlesung_mit_integrierter_uebung(self):
        assert (
            _extract_event_type("Prog - Vorlesung mit integrierter Übung")
            == EventType.LECTURE_WITH_INTEGRATED_EXERCISES
        )

    def test_group_suffix_stripped(self):
        assert (
            _extract_event_type("Mathe I - Übung, Gruppe A")
            == EventType.EXERCISE
        )

    def test_no_type_specified(self):
        assert (
            _extract_event_type("Some Unknown Title")
            == EventType.NO_TYPE_SPECIFIED
        )

    def test_longest_match_wins(self):
        # "Seminar mit Übungsanteil" should not match plain "Seminar"
        assert (
            _extract_event_type("X - Seminar mit Übungsanteil")
            == EventType.SEMINAR_WITH_EXERCISES
        )

    def test_all_event_types_extractable(self):
        for etype in EventType:
            if etype == EventType.NO_TYPE_SPECIFIED:
                continue
            title = f"Dummy - {etype.value}"
            assert _extract_event_type(title) == etype

    def test_praktikum(self):
        assert _extract_event_type("Programmieren - Praktikum") == EventType.PRACTICAL_COURSE

    def test_no_type(self):
        assert _extract_event_type("Some Event") == EventType.NO_TYPE_SPECIFIED

    def test_strip_group_suffix(self):
        assert _extract_event_type("Mathe - Übung, Gruppe A") == EventType.EXERCISE

    def test_seminar_mit_uebungsanteil(self):
        assert (
            _extract_event_type("Logik - Seminar mit Übungsanteil")
            == EventType.SEMINAR_WITH_EXERCISES
        )


# ===================================================================
# _parse_staff_names
# ===================================================================

class TestParseStaffNames:
    def test_single_link(self):
        td = _td('<a href="#">Prof. Müller</a>')
        assert _parse_staff_names(td) == ["Prof. Müller"]

    def test_multiple_links(self):
        td = _td('<a href="#">A</a><a href="#">B</a>')
        assert _parse_staff_names(td) == ["A", "B"]

    def test_plain_text_fallback(self):
        td = _td("Dr. Schmidt")
        assert _parse_staff_names(td) == ["Dr. Schmidt"]

    def test_empty_cell(self):
        td = _td("")
        assert _parse_staff_names(td) == []

    def test_plain_text(self):
        td = _td("Dr. Meier")
        assert _parse_staff_names(td) == ["Dr. Meier"]

    def test_empty(self):
        td = _td("")
        assert _parse_staff_names(td) == []


# ===================================================================
# _parse_location_name
# ===================================================================

class TestParseLocationName:
    def test_link_location(self):
        td = _td('<a href="#">Raum A-101</a>')
        assert _parse_location_name(td) == "Raum A-101"

    def test_plain_text_location(self):
        td = _td("Gebäude B")
        assert _parse_location_name(td) == "Gebäude B"

    def test_empty_returns_none(self):
        td = _td("")
        assert _parse_location_name(td) is None


# ===================================================================
# _parse_unit_module_numbers
# ===================================================================

class TestParseUnitModuleNumbers:
    def test_valid_module_links(self):
        td = _td('<a href="#">101-001</a><a href="#">102-002</a>')
        assert _parse_unit_module_numbers(td) == ["101-001", "102-002"]

    def test_ignores_non_module_links(self):
        td = _td('<a href="#">some text</a><a href="#">200-005</a>')
        assert _parse_unit_module_numbers(td) == ["200-005"]

    def test_no_links(self):
        td = _td("plain text")
        assert _parse_unit_module_numbers(td) == []

    def test_single_module(self):
        td = _td('<a href="#">123-456</a>')
        assert _parse_unit_module_numbers(td) == ["123-456"]

    def test_multiple_modules(self):
        td = _td('<a href="#">100-200</a> <a href="#">300-400</a>')
        assert _parse_unit_module_numbers(td) == ["100-200", "300-400"]

    def test_non_module_link_ignored(self):
        td = _td('<a href="#">Some Text</a>')
        assert _parse_unit_module_numbers(td) == []

    def test_empty(self):
        td = _td("")
        assert _parse_unit_module_numbers(td) == []


# ===================================================================
# _parse_module_info
# ===================================================================

class TestParseModuleInfo:
    def _build_info_table(
        self,
        module_number: str = "101-001",
        credits: str = "6",
        planung: str = "FB Info",
        language: str = "Deutsch",
        degrees: list[str] | None = None,
    ) -> Tag:
        rows = ""
        rows += f'<tr class="row-module-info"><td>ModulNr</td><td>{module_number}</td></tr>'
        rows += f'<tr class="row-module-info"><td>Credits</td><td>{credits}</td></tr>'
        rows += f'<tr class="row-module-info"><td>Planung</td><td>{planung}</td></tr>'
        rows += f'<tr class="row-module-info"><td>Sprache</td><td>{language}</td></tr>'
        if degrees:
            deg_items = "".join(f"<span>{d}</span>" for d in degrees)
            rows += f'<tr class="row-module-info"><td>Studiengang</td><td>{deg_items}</td></tr>'
        return _table(rows)

    def test_full_info(self):
        tbl = self._build_info_table(degrees=["B.Sc. Informatik 2. Semester"])
        info = _parse_module_info(tbl)
        assert info["module_number"] == "101-001"
        assert info["credits"] == 6
        assert info["planung"] == "FB Info"
        assert info["language"] == "Deutsch"
        assert info["degree_names"] == ["B.Sc. Informatik 2. Semester"]

    def test_non_numeric_credits_defaults_to_zero(self):
        tbl = self._build_info_table(credits="N/A")
        info = _parse_module_info(tbl)
        assert info["credits"] == 0

    def test_missing_degrees(self):
        tbl = self._build_info_table()
        info = _parse_module_info(tbl)
        assert info["degree_names"] == []

    def test_comment_row_skipped(self):
        rows = (
            '<tr class="row-module-info"><td><p class="comment">Some note</p></td></tr>'
            '<tr class="row-module-info"><td>ModulNr</td><td>999-001</td></tr>'
        )
        tbl = _table(rows)
        info = _parse_module_info(tbl)
        assert info["module_number"] == "999-001"

    def test_tag_row_without_info_skipped(self):
        rows = (
            '<tr class="row-module-info"><td>Tags</td></tr>'
            '<tr class="row-module-info"><td>ModulNr</td><td>888-001</td></tr>'
        )
        tbl = _table(rows)
        info = _parse_module_info(tbl)
        assert info["module_number"] == "888-001"

    def test_missing_credits_defaults_to_zero(self):
        table = _table("""
            <tr class="row-module-info">
                <td>ModulNr</td><td>PHY-200</td>
            </tr>
            <tr class="row-module-info">
                <td>Credits</td><td>abc</td>
            </tr>
        """)
        info = _parse_module_info(table)
        assert info["module_number"] == "PHY-200"
        assert info["credits"] == 0

    def test_tags_row_skipped(self):
        table = _table("""
            <tr class="row-module-info">
                <td>Tags</td>
            </tr>
            <tr class="row-module-info">
                <td>ModulNr</td><td>BIO-100</td>
            </tr>
        """)
        info = _parse_module_info(table)
        assert info["module_number"] == "BIO-100"

    def test_multiple_degrees(self):
        table = _table("""
            <tr class="row-module-info">
                <td>Studiengang</td>
                <td>
                    <br/>B.Sc. Informatik 1. Semester
                    <br/>M.Sc. Informatik 2. Semester
                </td>
            </tr>
        """)
        info = _parse_module_info(table)
        assert type(info["degree_names"]) == list
        assert len(info["degree_names"]) == 2

    def test_empty_table(self):
        table = _table("")
        info = _parse_module_info(table)
        assert info["module_number"] == ""
        assert info["credits"] == 0
        assert info["degree_names"] == []
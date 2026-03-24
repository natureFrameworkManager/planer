import re
from datetime import time

import httpx
from bs4 import BeautifulSoup, Tag
from sqlmodel import Session, SQLModel, select

from database.database import engine
from database.models import (
    Module, Event, Staff, Location, Degree, Semester,
    ModuleDegreeLink, ModuleEventLink, EventStaffLink,
    EventType, Weekday, Status,
)
from my_logging import get_logger

SOURCE_URL = "https://casparkroll.de/planer/getHtml.php"

WEEKDAY_MAP = {
    "montags": Weekday.MONDAY,
    "dienstags": Weekday.TUESDAY,
    "mittwochs": Weekday.WEDNESDAY,
    "donnerstags": Weekday.THURSDAY,
    "freitags": Weekday.FRIDAY,
    "samstags": Weekday.SATURDAY,
    "sonntags": Weekday.SUNDAY,
}

EVENT_TYPE_MAP = {v.value: v for v in EventType}
STATUS_MAP = {v.value: v for v in Status}
logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# Generic helpers
# ---------------------------------------------------------------------------

def _first_string(value: str | list[str], default: str = "") -> str:
    """Extract a single string from a value that may be a list."""
    if isinstance(value, list):
        return value[0] if value else default
    return value or default


def _get_or_create(session: Session, model: type[SQLModel], name: str) -> SQLModel:
    """Look up a record by name, or create and flush it if it doesn't exist."""
    record = session.exec(select(model).where(model.name == name)).first()
    if not record:
        record = model(name=name)
        session.add(record)
        session.flush()
    return record


def _parse_credits(raw: str | None) -> int:
    if not raw:
        return 0
    match = re.search(r"\d+", str(raw))
    return int(match.group()) if match else 0


# ---------------------------------------------------------------------------
# HTML fetching & semester detection
# ---------------------------------------------------------------------------

def fetch_html(url: str) -> str:
    response = httpx.get(url, follow_redirects=True, timeout=30)
    response.raise_for_status()
    return response.text


def get_semester_from_html(soup: BeautifulSoup) -> str:
    heading = soup.find("h1")
    if not heading:
        logger.warning("get_semester_from_html: no <h1> found, returning empty semester name")
    return heading.get_text(strip=True) if heading else ""


# ---------------------------------------------------------------------------
# HTML → raw data structures
# ---------------------------------------------------------------------------

def split_html_modules(soup: BeautifulSoup) -> list[list[Tag]]:
    """
    The page structure is:
      [header content] ... <hr> <h2>ÜBERSICHT</h2> [overview table]
      <hr> <h2>Module 1</h2> <p/> <table info> <table events> <a>BACK TO TOP</a> <p/>
      <h2>Module 2</h2> ...

    Steps:
      1. Walk direct body children to find the last H2 preceded by HR
         (the first module heading), then stop at the first H2 *not* preceded by HR.
      2. Slice from that split point.
      3. Group remaining elements into consecutive pairs.
    """
    if not soup.body:
        logger.warning("split_html_modules: soup has no <body>, returning empty module groups")
        return []

    children = [element for element in soup.body.children if isinstance(element, Tag)]

    # Finds the index where the actual contents begin. This is the last occurrence
    # of h2 directly after hr. After that, h2 always follows a p tag.
    split_index = -1
    previous_element = None
    for i, element in enumerate(children):
        if i == 0:
            previous_element = element
            continue
        if element.name == "h2" and previous_element and previous_element.name == "hr":
            split_index = i
        elif element.name == "h2" and previous_element and previous_element.name != "hr":
            break
        previous_element = element

    if split_index == -1:
        logger.warning("split_html_modules: no module start marker found, returning empty module groups")
        return []

    children = children[split_index:]
    if not children:
        logger.warning("split_html_modules: split produced no children, returning empty module groups")
        return []

    groups = []
    for i in range(0, len(children), 2):
        # Each module pair: children[i] = <h2> heading, children[i+1] = <p> wrapper.
        # Inside the <p>, index 1 = info table, index 3 = events table
        # (indices 0 and 2 are whitespace/text nodes).
        wrapper_contents = children[i + 1].contents
        heading = children[i]
        info_table = wrapper_contents[1]
        events_table = wrapper_contents[3]
        groups.append([heading, info_table, events_table])
    return groups


def _parse_cell_values(cell: Tag) -> str | list[str]:
    """Return plain text or a list of strings when the cell contains <br>-separated values."""
    inner = cell.decode_contents()
    if "<br" in inner:
        parts = [
            BeautifulSoup(part, "html.parser").get_text(strip=True)
            for part in re.split(r"<br\s*/?>", inner)
        ]
        parts = [part for part in parts if part]
        if len(parts) > 1:
            return parts
    return cell.get_text(strip=True)


def _parse_event_row(headers: list[str], row: Tag, module_title: str) -> dict | None:
    """Parse a single event <tr> into a dict with parsed_weekday, parsed_start_time, etc.

    Returns None if the row is invalid and should be skipped.
    """
    columns = row.find_all("td")
    data: dict = {}
    for i, header in enumerate(headers):
        if i >= len(columns):
            break
        data[header] = _parse_cell_values(columns[i])

    # Parse Zeit — format: ["montags", "11:15 - 12:45"]
    zeit = data.get("Zeit")
    if not isinstance(zeit, list) or len(zeit) < 2:
        logger.warning(
            "parse_module_data: skipping event in module '%s' due to invalid Zeit value: %r",
            module_title, zeit,
        )
        return None

    time_match = re.match(r"(.+?)\s+-\s+(.+)", zeit[1])
    if not time_match:
        logger.warning(
            "parse_module_data: skipping event in module '%s' due to invalid time range: %r",
            module_title, zeit[1],
        )
        return None

    day_string = zeit[0].split(" ")[0]
    weekday = WEEKDAY_MAP.get(day_string)
    if weekday is None:
        logger.warning(
            "parse_module_data: skipping event in module '%s' due to unknown weekday token: %r",
            module_title, day_string,
        )
        return None

    try:
        start_hour, start_minute = time_match.group(1).strip().split(":")
        end_hour, end_minute = time_match.group(2).strip().split(":")
        data["parsed_start_time"] = time(int(start_hour), int(start_minute))
        data["parsed_end_time"] = time(int(end_hour), int(end_minute))
    except (ValueError, IndexError):
        logger.warning(
            "parse_module_data: skipping event in module '%s' due to unparseable time values: %r",
            module_title, zeit,
        )
        return None

    data["parsed_weekday"] = weekday

    # Extract event type from Titel — "Module Name - Vorlesung mit integrierter Übung"
    title = _first_string(data.get("Titel", ""))
    type_string = ""
    if title:
        first_part = title.split(",")[0]
        parts = first_part.split(" - ")
        if len(parts) >= 2:
            type_string = parts[-1].strip()
    data["parsed_type"] = EVENT_TYPE_MAP.get(type_string, EventType.NO_TYPE_SPECIFIED)

    return data


def parse_module_data(html_group: list[Tag]) -> dict | None:
    """
    html_group layout (after filtering empty elements):
      [0] <h2>  — module title + anchor name
      [1] <table class="maintable"> — outer info table containing two inner tables
      [2] <table class="maintable" border=""> — events table

    Info table keys (German): ModulNr, Planung, Umfang, Ø/max, Potentiel, Tags,
                               Credits, Sprache, Studiengang
    Event table columns: Unit, Lehrkraft, Titel, Zeit, Ort, vorjahr/Ø/max, Status, LV-Typ
    """
    if len(html_group) < 3:
        logger.warning(
            "parse_module_data: expected at least 3 tags (h2/info/events), got %s; returning None",
            len(html_group),
        )
        return None

    anchor = html_group[0].find("a")
    anchor_id = anchor.get("name", "") if anchor else ""
    title = html_group[0].get_text(strip=True)

    # Info tables — select recursively from both nested tables
    info: dict = {}
    for row in html_group[1].select("tr.row-module-info"):
        cells = row.find_all(["td", "th"])
        if len(cells) == 1:
            key = cells[0].get_text(strip=True).rstrip(":")
            info[key] = None
        elif len(cells) >= 2:
            key = cells[0].get_text(strip=True).rstrip(":")
            info[key] = _parse_cell_values(cells[1])

    info["Titel"] = title
    info["anchor_id"] = anchor_id

    # Clean Studiengang — strip seat counts like "(28 Plätze)"
    studiengang = info.get("Studiengang", "")
    if isinstance(studiengang, list):
        info["cleanStudiengang"] = [
            re.sub(r"\(\d+\s*Plätze\)", "", entry).strip() for entry in studiengang
        ]
    elif studiengang:
        info["cleanStudiengang"] = re.sub(r"\(\d+\s*Plätze\)", "", studiengang).strip()
    else:
        info["cleanStudiengang"] = ""

    # Events table
    events = []
    event_rows = html_group[2].select("tr[align=center]")
    if not event_rows:
        logger.warning(
            "parse_module_data: no event rows found for module '%s' (anchor '%s'), returning empty events",
            title, anchor_id,
        )
        return {"info": info, "events": events}

    headers = [header.get_text(strip=True) for header in event_rows[0].find_all("th")]

    for row in event_rows[1:]:
        event_data = _parse_event_row(headers, row, title)
        if event_data:
            events.append(event_data)

    return {"info": info, "events": events}


# ---------------------------------------------------------------------------
# Database persistence
# ---------------------------------------------------------------------------

def _link_degrees(session: Session, module: Module, degree_names: list[str]):
    """Create degree records and link them to the module."""
    for degree_name in degree_names:
        if degree_name:
            degree = _get_or_create(session, Degree, degree_name)
            module.degrees.append(degree)


def _save_event(session: Session, module: Module, event_data: dict):
    """Create or deduplicate an event and link it to the module."""
    # Location — column "Ort", value like "Paulinum, P-701 (28)"; strip capacity annotation
    raw_location = _first_string(event_data.get("Ort", ""))
    location_name = re.sub(r"\s*\(\d+\)\s*$", "", raw_location).strip() or "Unbekannt"
    location = _get_or_create(session, Location, location_name)

    status_raw = _first_string(event_data.get("Status", ""))
    status = STATUS_MAP.get(status_raw.strip().lower(), Status.OK)

    event_title = _first_string(event_data.get("Titel", ""))

    # Dedup: an event with identical title+weekday+times+location is the same physical event
    existing_event = session.exec(
        select(Event).where(
            Event.title == event_title,
            Event.weekday == event_data["parsed_weekday"],
            Event.start_time == event_data["parsed_start_time"],
            Event.end_time == event_data["parsed_end_time"],
            Event.location_id == location.id,
        )
    ).first()
    if existing_event:
        if existing_event not in module.events:
            module.events.append(existing_event)
        return

    event = Event(
        type=event_data.get("parsed_type", EventType.NO_TYPE_SPECIFIED),
        title=event_title,
        weekday=event_data["parsed_weekday"],
        start_time=event_data["parsed_start_time"],
        end_time=event_data["parsed_end_time"],
        location=location,
        status=status,
    )
    session.add(event)
    session.flush()

    # Staff — column "Lehrkraft", may be a list for multiple lecturers
    raw_staff = event_data.get("Lehrkraft", "") or ""
    staff_names = raw_staff if isinstance(raw_staff, list) else ([raw_staff] if raw_staff else [])
    for staff_name in staff_names:
        staff_name = staff_name.strip()
        if staff_name:
            staff = _get_or_create(session, Staff, staff_name)
            event.staff.append(staff)

    module.events.append(event)


def clear_database(session: Session):
    for model in [EventStaffLink, ModuleEventLink, ModuleDegreeLink, Event, Module, Staff, Location, Degree, Semester]:
        rows = session.exec(select(model)).all()
        for row in rows:
            session.delete(row)
    session.commit()


def save_module_to_db(session: Session, module_data: dict):
    info = module_data["info"]
    module_number = info.get("ModulNr", info.get("anchor_id", "")).strip()

    # Skip if this module is already stored
    if module_number and session.exec(
        select(Module).where(Module.module_number == module_number)
    ).first():
        return

    module = Module(
        name=info.get("Titel", ""),
        module_number=module_number,
        credits=_parse_credits(info.get("Credits")),
        planung=str(info.get("Planung", "") or ""),
        language=str(info.get("Sprache", "") or ""),
    )
    session.add(module)
    session.flush()

    # Degrees
    studiengang = info.get("cleanStudiengang", "")
    degree_names = studiengang if isinstance(studiengang, list) else ([studiengang] if studiengang else [])
    _link_degrees(session, module, degree_names)

    # Events
    for event_data in module_data["events"]:
        _save_event(session, module, event_data)

    session.commit()


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def parse_and_populate(url: str = SOURCE_URL):
    html = fetch_html(url)
    soup = BeautifulSoup(html, "html.parser")

    semester_name = get_semester_from_html(soup)

    with Session(engine) as session:
        current = session.exec(select(Semester)).first()

        if current and current.name != semester_name:
            clear_database(session)
            current = None

        if not current:
            session.add(Semester(name=semester_name))
            session.commit()

        groups = split_html_modules(soup)
        if not groups:
            logger.warning("parse_and_populate: no module groups extracted from source HTML")
        for group in groups:
            module_data = parse_module_data(group)
            if module_data:
                save_module_to_db(session, module_data)

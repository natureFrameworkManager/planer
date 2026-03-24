import re
from datetime import time

import httpx
from bs4 import BeautifulSoup, Tag
from sqlmodel import Session, select

from database.database import engine
from database.models import (
    Module, Event, Staff, Location, Degree, Semester,
    ModuleDegreeLink, ModuleEventLink, EventStaffLink,
    EventType, Weekday, Status,
)

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


def fetch_html(url: str) -> str:
    response = httpx.get(url, follow_redirects=True, timeout=30)
    response.raise_for_status()
    return response.text


def get_semester_from_html(soup: BeautifulSoup) -> str:
    h1 = soup.find("h1")
    return h1.get_text(strip=True) if h1 else ""


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
      3. Use the "BACK TO TOP" <a> direct children as separators between modules.
    """
    children = [el for el in soup.body.children if isinstance(el, Tag)]

    split_index = -1
    prev = None
    for i, el in enumerate(children):
        if i == 0:
            prev = el
            continue
        if el.name == "h2" and prev and prev.name == "hr":
            split_index = i
        elif el.name == "h2" and prev and prev.name != "hr":
            break
        prev = el

    if split_index == -1:
        return []

    children = children[split_index:]

    # "BACK TO TOP" anchors are direct body children between module sections
    a_indices = [i for i, el in enumerate(children) if el.name == "a"]

    groups: list[list[Tag]] = []
    prev_index = None
    for idx in a_indices:
        start = 0 if prev_index is None else prev_index + 2
        groups.append(children[start:idx])
        prev_index = idx

    # Filter out whitespace-only elements; each group should be [h2, info_table, events_table]
    return [
        [el for el in group if el.get_text(strip=True)]
        for group in groups
    ]


def _parse_cell_values(cell: Tag) -> str | list[str]:
    """Return plain text or a list of strings when the cell contains <br>-separated values."""
    inner = cell.decode_contents()
    if "<br" in inner:
        parts = [
            BeautifulSoup(p, "html.parser").get_text(strip=True)
            for p in re.split(r"<br\s*/?>", inner)
        ]
        parts = [p for p in parts if p]
        if len(parts) > 1:
            return parts
    return cell.get_text(strip=True)


def parse_module_data(html_group: list[Tag]) -> dict | None:
    """
    html_group layout (after filtering empty elements):
      [0] <h2>  — module title + anchor name (anchor name = path-like ID, e.g. studium/Num.ACPDE)
      [1] <table class="maintable"> — outer info table containing two inner tables
      [2] <table class="maintable" border=""> — events table

    Info table keys (German): ModulNr, Planung, Umfang, Ø/max, Potentiel, Tags,
                               Credits, Sprache, Studiengang
    Event table columns: Unit, Lehrkraft, Titel, Zeit, Ort, vorjahr/Ø/max, Status, LV-Typ
    """
    if len(html_group) < 3:
        return None

    # Anchor name from h2 (path-like ID, e.g. "studium/Num.ACPDE")
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
            re.sub(r"\(\d+\s*Plätze\)", "", s).strip() for s in studiengang
        ]
    elif studiengang:
        info["cleanStudiengang"] = re.sub(r"\(\d+\s*Plätze\)", "", studiengang).strip()
    else:
        info["cleanStudiengang"] = ""

    # Events table
    # Headers: Unit, Lehrkraft, Titel, Zeit, Ort, vorjahr/Ø/max, Status, LV-Typ
    events = []
    event_rows = html_group[2].select("tr[align=center]")
    if not event_rows:
        return {"info": info, "events": events}

    headers = [th.get_text(strip=True) for th in event_rows[0].find_all("th")]

    for row in event_rows[1:]:
        cols = row.find_all("td")
        data: dict = {}
        for j, header in enumerate(headers):
            if j >= len(cols):
                break
            data[header] = _parse_cell_values(cols[j])

        # Parse Zeit — format: ["montags", "11:15 - 12:45"]
        zeit = data.get("Zeit")
        if not isinstance(zeit, list) or len(zeit) < 2:
            continue

        time_match = re.match(r"(.+?)\s+-\s+(.+)", zeit[1])
        if not time_match:
            continue

        day_str = zeit[0].split(" ")[0]
        weekday = WEEKDAY_MAP.get(day_str)
        if weekday is None:
            continue

        try:
            sh, sm = time_match.group(1).strip().split(":")
            eh, em = time_match.group(2).strip().split(":")
            data["parsed_start_time"] = time(int(sh), int(sm))
            data["parsed_end_time"] = time(int(eh), int(em))
        except (ValueError, IndexError):
            continue

        data["parsed_weekday"] = weekday

        # Extract event type from Titel — "Module Name - Vorlesung mit integrierter Übung"
        # Split by "," first (JS compat), then by " - " to get type
        titel = data.get("Titel", "")
        if isinstance(titel, list):
            titel = titel[0] if titel else ""
        typ_str = ""
        if isinstance(titel, str):
            first_part = titel.split(",")[0]
            parts = first_part.split(" - ")
            if len(parts) >= 2:
                typ_str = parts[-1].strip()
        data["parsed_type"] = EVENT_TYPE_MAP.get(typ_str, EventType.NO_TYPE_SPECIFIED)

        events.append(data)

    return {"info": info, "events": events}


def _get_or_create_location(session: Session, name: str) -> Location:
    loc = session.exec(select(Location).where(Location.name == name)).first()
    if not loc:
        loc = Location(name=name)
        session.add(loc)
        session.flush()
    return loc


def _get_or_create_staff(session: Session, name: str) -> Staff:
    staff = session.exec(select(Staff).where(Staff.name == name)).first()
    if not staff:
        staff = Staff(name=name)
        session.add(staff)
        session.flush()
    return staff


def _get_or_create_degree(session: Session, name: str) -> Degree:
    degree = session.exec(select(Degree).where(Degree.name == name)).first()
    if not degree:
        degree = Degree(name=name)
        session.add(degree)
        session.flush()
    return degree


def _parse_credits(raw: str | None) -> int:
    if not raw:
        return 0
    match = re.search(r"\d+", str(raw))
    return int(match.group()) if match else 0


def clear_database(session: Session):
    for model in [EventStaffLink, ModuleEventLink, ModuleDegreeLink, Event, Module, Staff, Location, Degree, Semester]:
        rows = session.exec(select(model)).all()
        for row in rows:
            session.delete(row)
    session.commit()


def save_module_to_db(session: Session, module_data: dict):
    info = module_data["info"]

    # "ModulNr" holds the real module ID like "10-MAT-MM2CPDE";
    # "anchor_id" is the path-like key used to identify the module in the HTML
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
    for dname in degree_names:
        if dname:
            degree = _get_or_create_degree(session, dname)
            module.degrees.append(degree)

    # Events
    # Event table columns: Unit, Lehrkraft, Titel, Zeit, Ort, vorjahr/Ø/max, Status, LV-Typ
    for ev_data in module_data["events"]:
        # Location — column "Ort", value like "Paulinum, P-701 (28)"; strip capacity annotation
        raw_location = ev_data.get("Ort", "") or ""
        if isinstance(raw_location, list):
            raw_location = raw_location[0]
        location_name = re.sub(r"\s*\(\d+\)\s*$", "", raw_location).strip()
        if not location_name:
            location_name = "Unbekannt"
        location = _get_or_create_location(session, location_name)

        status_raw = ev_data.get("Status", "")
        if isinstance(status_raw, list):
            status_raw = status_raw[0]
        status = STATUS_MAP.get(status_raw.strip().lower(), Status.OK)

        event_title = ev_data.get("Titel", "")
        if isinstance(event_title, list):
            event_title = event_title[0] if event_title else ""

        # Dedup: an event with identical title+weekday+times+location is the same physical event
        # (occurs for shared events listed in multiple modules, e.g. "What is...? Seminar")
        existing_event = session.exec(
            select(Event).where(
                Event.title == event_title,
                Event.weekday == ev_data["parsed_weekday"],
                Event.start_time == ev_data["parsed_start_time"],
                Event.end_time == ev_data["parsed_end_time"],
                Event.location_id == location.id,
            )
        ).first()
        if existing_event:
            if existing_event not in module.events:
                module.events.append(existing_event)
            continue

        event = Event(
            type=ev_data.get("parsed_type", EventType.NO_TYPE_SPECIFIED),
            title=event_title,
            weekday=ev_data["parsed_weekday"],
            start_time=ev_data["parsed_start_time"],
            end_time=ev_data["parsed_end_time"],
            location=location,
            status=status,
        )
        session.add(event)
        session.flush()

        # Staff — column "Lehrkraft", may be a list for multiple lecturers
        lehrkraft = ev_data.get("Lehrkraft", "") or ""
        staff_names = lehrkraft if isinstance(lehrkraft, list) else ([lehrkraft] if lehrkraft else [])
        for sname in staff_names:
            sname = sname.strip()
            if sname:
                staff = _get_or_create_staff(session, sname)
                event.staff.append(staff)

        module.events.append(event)

    session.commit()


def parse_and_populate(url: str = SOURCE_URL):
    html = fetch_html(url)
    soup = BeautifulSoup(html, "html.parser")

    semester_name = get_semester_from_html(soup)

    with Session(engine) as session:
        current = session.exec(select(Semester)).first()

        if current and current.name != semester_name:
            # New semester detected — clear all data and start fresh
            clear_database(session)
            current = None

        if not current:
            session.add(Semester(name=semester_name))
            session.commit()

        groups = split_html_modules(soup)
        for group in groups:
            module_data = parse_module_data(group)
            if module_data:
                save_module_to_db(session, module_data)

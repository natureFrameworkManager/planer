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

logger = get_logger(__name__)

WEEKDAY_MAP = {
    "montags": Weekday.MONDAY,
    "dienstags": Weekday.TUESDAY,
    "mittwochs": Weekday.WEDNESDAY,
    "donnerstags": Weekday.THURSDAY,
    "freitags": Weekday.FRIDAY,
    "samstags": Weekday.SATURDAY,
    "sonntags": Weekday.SUNDAY,
}

STATUS_MAP = {
    "ok": Status.OK,
    "pok": Status.POK,
    "tok": Status.TOK,
    "alt": Status.ALT,
    "pausiert": Status.RESERVE,
}

EVENT_TYPE_BY_VALUE = {et.value: et for et in EventType}


def _fetch_html() -> str:
    response = httpx.get(SOURCE_URL, timeout=30)
    response.raise_for_status()
    return response.text


def _clear_database() -> None:
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)


def _get_or_create_location(session: Session, name: str) -> Location:
    loc = session.exec(select(Location).where(Location.name == name)).first()
    if loc is None:
        loc = Location(name=name)
        session.add(loc)
        session.flush()
    return loc


def _get_or_create_staff(session: Session, name: str) -> Staff:
    staff = session.exec(select(Staff).where(Staff.name == name)).first()
    if staff is None:
        staff = Staff(name=name)
        session.add(staff)
        session.flush()
    return staff


def _get_or_create_degree(session: Session, name: str) -> Degree:
    degree = session.exec(select(Degree).where(Degree.name == name)).first()
    if degree is None:
        degree = Degree(name=name)
        session.add(degree)
        session.flush()
    return degree


def _get_or_create_module(
    session: Session, module_number: str, **kwargs
) -> Module:
    module = session.exec(
        select(Module).where(Module.module_number == module_number)
    ).first()
    if module is None:
        module = Module(module_number=module_number, **kwargs)
        session.add(module)
        session.flush()
    return module


def _parse_time_cell(td: Tag) -> tuple[Weekday | None, time | None, time | None]:
    text = td.get_text("\n")
    if not text.strip() or "[offen]" in text:
        return None, None, None

    weekday = None
    for key, wd in WEEKDAY_MAP.items():
        if key in text.lower():
            weekday = wd
            break

    # Format: "8:00 - 9:30" or "08:00 - 09:30", possibly with extra spaces
    m = re.search(r"(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})", text)
    if m:
        start = time(int(m.group(1)), int(m.group(2)))
        end = time(int(m.group(3)), int(m.group(4)))
    else:
        return weekday, None, None

    return weekday, start, end


def _extract_event_type(title: str) -> EventType:
    cleaned = re.sub(r",\s*Gruppe\s+\w+$", "", title)
    for type_val, etype in sorted(
        EVENT_TYPE_BY_VALUE.items(), key=lambda x: -len(x[0])
    ):
        if cleaned.endswith(f" - {type_val}"):
            return etype
    return EventType.NO_TYPE_SPECIFIED


def _parse_staff_names(td: Tag) -> list[str]:
    links = td.find_all("a")
    if links:
        return [a.get_text(strip=True) for a in links]
    text = td.get_text(strip=True)
    return [text] if text else []


def _parse_location_name(td: Tag) -> str | None:
    a = td.find("a")
    if a:
        return a.get_text(strip=True)
    text = td.get_text(strip=True)
    return text if text else None


def _parse_unit_module_numbers(td: Tag) -> list[str]:
    return [
        a.get_text(strip=True)
        for a in td.find_all("a")
        if re.match(r"\d+-", a.get_text(strip=True))
    ]


def _find_existing_event(
    session: Session,
    title: str,
    weekday: Weekday,
    start_time: time,
    end_time: time,
    location_id: int,
) -> Event | None:
    return session.exec(
        select(Event).where(
            Event.title == title,
            Event.weekday == weekday,
            Event.start_time == start_time,
            Event.end_time == end_time,
            Event.location_id == location_id,
        )
    ).first()


def _parse_module_info(info_table: Tag) -> dict:
    info: dict = {
        "module_number": "",
        "credits": 0,
        "planung": "",
        "language": "",
        "degree_names": [],
    }
    for row in info_table.find_all("tr", class_="row-module-info"):
        tds = row.find_all("td")
        if len(tds) < 2:
            logger.warning(
                "Skipping module info row: expected at least 2 cells but got %d. Raw HTML: %s",
                len(tds),
                str(row),
            )
            continue
        label = tds[0].get_text(strip=True)
        value_td = tds[1]

        if label.startswith("ModulNr"):
            info["module_number"] = value_td.get_text(strip=True)
        elif label.startswith("Credits"):
            try:
                info["credits"] = int(value_td.get_text(strip=True))
            except ValueError:
                info["credits"] = 0
        elif label.startswith("Planung"):
            info["planung"] = value_td.get_text(strip=True)
        elif label.startswith("Sprache"):
            info["language"] = value_td.get_text(strip=True)
        elif label.startswith("Studiengang"):
            info["degree_names"] = [
                s for s in value_td.stripped_strings if s
            ]
    return info


def parse_and_populate() -> None:
    logger.info("Fetching HTML from %s", SOURCE_URL)
    html = _fetch_html()
    soup = BeautifulSoup(html, "html.parser")

    h1 = soup.find("h1")
    if not h1:
        logger.warning("No <h1> found – aborting parse")
        return
    # h1 text example: "LV-Planung Sommersemester 2026" or "LV-Planung Wintersemester 2026/27" -> extract "SoSe 2026" or "WiSe 2026/27"
    semester_name = h1.get_text(strip=True).replace("LV-Planung ", "")
    if (not semester_name.startswith("Sommersemester") and not semester_name.startswith("Wintersemester")):
        logger.warning("Unexpected <h1> format: '%s' – using raw text as semester name", semester_name)
    if semester_name.startswith("Sommersemester"):
        semester_name = semester_name.replace("Sommersemester", "SoSe")
    elif semester_name.startswith("Wintersemester"):
        semester_name = semester_name.replace("Wintersemester", "WiSe")

    with Session(engine) as session:
        existing = session.exec(select(Semester)).first()
        if existing and existing.name == semester_name:
            logger.info("Semester '%s' already in database – updating", semester_name)
        elif existing and existing.name != semester_name:
            logger.info(
                "New semester '%s' detected (was '%s') – clearing database",
                semester_name,
                existing.name,
            )
            session.close()
            _clear_database()
        else: # No semester in DB yet
            logger.info("Adding new semester '%s' to database", semester_name)
            session.add(Semester(name=semester_name))

    with Session(engine) as session:
        for h2 in soup.find_all("h2"):
            anchor = h2.find("a", attrs={"name": True})
            if not anchor or anchor["name"] == "top":
                continue

            module_name = anchor.get_text(strip=True)

            info_table = h2.find_next("table", class_="maintable")
            if not info_table:
                continue

            info = _parse_module_info(info_table)
            if not info["module_number"]:
                logger.warning(
                    "Skipping module '%s': module number is missing or empty",
                    module_name,
                )
                continue

            module = _get_or_create_module(
                session,
                info["module_number"],
                name=module_name,
                credits=info["credits"],
                planung=info["planung"],
                language=info["language"],
            )

            for deg_name in info["degree_names"]:
                degree = _get_or_create_degree(session, deg_name)
                if degree not in module.degrees:
                    module.degrees.append(degree)

            event_table = info_table.find_next(
                "table", class_="maintable", attrs={"border": True}
            )
            if not event_table:
                logger.warning(
                    "Skipping module '%s' (module_number: %s): event table not found",
                    module_name,
                    info["module_number"],
                )
                continue

            for row in event_table.find_all("tr"):
                row_classes = row.get("class", [])
                status_key = next(
                    (c for c in row_classes if c in STATUS_MAP), None
                )
                if status_key is None:
                    logger.warning(
                        "Skipping event row in module '%s': no valid status found. Available row classes: %s",
                        module_name,
                        row_classes,
                    )
                    continue

                tds = row.find_all("td")
                if len(tds) < 8:
                    logger.warning(
                        "Skipping event row in module '%s': expected 8+ cells but got %d",
                        module_name,
                        len(tds),
                    )
                    continue

                weekday, start_t, end_t = _parse_time_cell(tds[3])
                if weekday is None or start_t is None or end_t is None:
                    title = tds[2].get_text(strip=True)
                    logger.warning(
                        "Skipping event '%s' in module '%s': invalid or missing time format - weekday=%s, start_time=%s, end_time=%s. Raw text: %s",
                        title,
                        module_name,
                        weekday,
                        start_t,
                        end_t,
                        tds[3].get_text("\n"),
                    )
                    continue

                loc_name = _parse_location_name(tds[4])
                if not loc_name:
                    title = tds[2].get_text(strip=True)
                    logger.warning(
                        "Skipping event '%s' in module '%s': location name is missing or empty",
                        title,
                        module_name,
                    )
                    continue

                location = _get_or_create_location(session, loc_name)
                title = tds[2].get_text(strip=True)
                event_type = _extract_event_type(title)
                status = STATUS_MAP[status_key]

                existing_event = _find_existing_event(
                    session, title, weekday, start_t, end_t, location.id
                )
                if existing_event:
                    event = existing_event
                else:
                    event = Event(
                        title=title,
                        type=event_type,
                        weekday=weekday,
                        start_time=start_t,
                        end_time=end_t,
                        location_id=location.id,
                        status=status,
                    )
                    session.add(event)
                    session.flush()

                if module not in event.module:
                    event.module.append(module)

                unit_numbers = _parse_unit_module_numbers(tds[0])
                for num in unit_numbers:
                    if num == info["module_number"]:
                        continue
                    other = session.exec(
                        select(Module).where(Module.module_number == num)
                    ).first()
                    if other and other not in event.module:
                        event.module.append(other)

                for name in _parse_staff_names(tds[1]):
                    staff = _get_or_create_staff(session, name)
                    if staff not in event.staff:
                        event.staff.append(staff)

        session.commit()
        logger.info(
            "Populated database for semester '%s'", semester_name
        )


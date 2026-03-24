from datetime import time
from enum import Enum
from sqlmodel import Field, SQLModel, Relationship

class Weekday(int, Enum):
    MONDAY = 1
    TUESDAY = 2
    WEDNESDAY = 3
    THURSDAY = 4
    FRIDAY = 5
    SATURDAY = 6
    SUNDAY = 7

class EventType(str, Enum):
    E_LEARNING = "E-Learning-Veranstaltung"
    COLLOQUIUM = "Kolloquium"
    PRACTICAL_COURSE = "Praktikum"
    PROJECT_SEMINAR = "Projektseminar"
    SCHOOL_PRACTICAL_STUDIES = "Schulpraktische Studien"
    SEMINAR = "Seminar"
    SEMINAR_WITH_EXERCISES = "Seminar mit Übungsanteil"
    LECTURE = "Vorlesung"
    LECTURE_WITH_INTEGRATED_EXERCISES = "Vorlesung mit integrierter Übung"
    LECTURE_WITH_SEMINAR_COMPONENT = "Vorlesung mit seminaristischem Anteil"
    EXERCISE = "Übung"
    NO_TYPE_SPECIFIED = "Kein Typ angegeben"

class Status(str, Enum):
    OK = "ok" # alles ist bestätigt
    POK = "pok" # Termin nicht bestätigt
    TOK = "tok" # Dozent nicht bestätigt
    ALT = "alt" # Aus letztem Semester übernommen, noch nicht bestätigt
    RESERVE = "reserve" # Wird nicht mehr angeboten


class ModuleDegreeLink(SQLModel, table=True):
    module_id: int | None = Field(default=None, foreign_key="module.id", primary_key=True)
    degree_id: int | None = Field(default=None, foreign_key="degree.id", primary_key=True)

class ModuleEventLink(SQLModel, table=True):
    module_id: int | None = Field(default=None, foreign_key="module.id", primary_key=True)
    event_id: int | None = Field(default=None, foreign_key="event.id", primary_key=True)

class EventStaffLink(SQLModel, table=True):
    event_id: int | None = Field(default=None, foreign_key="event.id", primary_key=True)
    staff_id: int | None = Field(default=None, foreign_key="staff.id", primary_key=True)

class Module(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    module_number: str
    credits: int
    planung: str # Institut, dass die Planung macht
    language: str
    degrees: list["Degree"] = Relationship(back_populates="modules", link_model=ModuleDegreeLink)
    events: list["Event"] = Relationship(back_populates="module", link_model=ModuleEventLink)

class Staff(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    events: list["Event"] = Relationship(back_populates="staff", link_model=EventStaffLink)

class Event(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    module: list[Module] = Relationship(back_populates="events", link_model=ModuleEventLink)
    type: EventType
    staff: list[Staff] = Relationship(back_populates="events", link_model=EventStaffLink)
    title: str
    weekday: Weekday
    start_time: time
    end_time: time
    location_id: int | None = Field(default=None, foreign_key="location.id")
    location: Location | None = Relationship(back_populates="events")
    status: Status

class Location(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    events: list[Event] = Relationship(back_populates="location")
    name: str

class Degree(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    modules: list[Module] = Relationship(back_populates="degrees", link_model=ModuleDegreeLink)


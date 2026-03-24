from enum import Enum
from sqlmodel import Field, SQLModel, Relationship


class ModuleDegreeLink(SQLModel, table=True):
    module_id: int | None = Field(default=None, foreign_key="module.id", primary_key=True)
    degree_id: int | None = Field(default=None, foreign_key="degree.id", primary_key=True)

class ModuleEventLink(SQLModel, table=True):
    module_id: int | None = Field(default=None, foreign_key="module.id", primary_key=True)
    event_id: int | None = Field(default=None, foreign_key="event.id", primary_key=True)

class Module(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    module_number: str
    credits: int
    planung: str # Institut, dass die Planung macht
    average: int | None
    max: int | None
    language: str
    degrees: list["Degree"] = Relationship(back_populates="modules", link_model=ModuleDegreeLink)
    events: list["Event"] = Relationship(back_populates="module", link_model=ModuleEventLink)

class EventType(str, Enum):
    LECTURE = "lecture"
    SEMINAR = "seminar"
    LAB = "lab"
    EXERCISE = "exercise"

class Event(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    module: list[Module] = Relationship(back_populates="events", link_model=ModuleEventLink)
    typ: EventType

class Degree(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    modules: list[Module] = Relationship(back_populates="degrees", link_model=ModuleDegreeLink)
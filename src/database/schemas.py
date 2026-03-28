from datetime import time
from sqlmodel import SQLModel
from database.models import Weekday, EventType, Status


# --- Base schemas (flat, no relationships) ---

class ModuleResponse(SQLModel):
    id: int | None
    name: str
    module_number: str
    credits: int
    planung: str
    language: str

class StaffResponse(SQLModel):
    id: int | None
    name: str

class EventResponse(SQLModel):
    id: int | None
    type: EventType
    title: str
    weekday: Weekday
    start_time: time
    end_time: time
    location_id: int
    status: Status

class LocationResponse(SQLModel):
    id: int | None
    name: str

class DegreeResponse(SQLModel):
    id: int | None
    name: str

class SemesterResponse(SQLModel):
    id: int | None
    name: str


# --- List schemas (IDs only for relationships) ---

class ModuleWithRelationshipsResponse(ModuleResponse):
    degree_ids: list[int] = []
    event_ids: list[int] = []

class StaffWithRelationshipsResponse(StaffResponse):
    event_ids: list[int] = []

class EventWithRelationshipsResponse(EventResponse):
    module_ids: list[int] = []
    staff_ids: list[int] = []

class LocationWithRelationshipsResponse(LocationResponse):
    event_ids: list[int] = []

class DegreeWithRelationshipsResponse(DegreeResponse):
    module_ids: list[int] = []


# --- Detail schemas (full nested objects, using flat base schemas to avoid circular refs) ---

class DegreeInModuleResponse(DegreeResponse):
    semester: str | None = None
    note: str | None = None

class ModuleInDegreeResponse(ModuleResponse):
    semester: str | None = None
    note: str | None = None

class ModuleDetailResponse(ModuleResponse):
    degrees: list[DegreeInModuleResponse] = []
    events: list[EventResponse] = []

class StaffDetailResponse(StaffResponse):
    events: list[EventResponse] = []

class EventDetailResponse(EventResponse):
    module: list[ModuleResponse] = []
    staff: list[StaffResponse] = []

class LocationDetailResponse(LocationResponse):
    events: list[EventResponse] = []

class DegreeDetailResponse(DegreeResponse):
    modules: list[ModuleInDegreeResponse] = []
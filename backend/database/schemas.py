from datetime import time
from sqlmodel import SQLModel
from database.models import Weekday, EventType, Status


# --- Base schemas (flat, no relationships) ---

class ModuleResponse(SQLModel):
    model_config = {"json_schema_extra": {"examples": [{"id": 1, "name": "Mathematik I", "module_number": "MAT-101", "credits": 6, "planung": "FB Mathematik", "language": "Deutsch"}]}}
    id: int | None
    name: str
    module_number: str
    credits: int
    planung: str
    language: str

class StaffResponse(SQLModel):
    model_config = {"json_schema_extra": {"examples": [{"id": 1, "name": "Prof. Dr. Schmidt"}]}}
    id: int | None
    name: str

class EventResponse(SQLModel):
    model_config = {"json_schema_extra": {"examples": [{"id": 1, "type": "Vorlesung", "title": "Mathematik I - Vorlesung", "weekday": 1, "start_time": "08:00:00", "end_time": "09:30:00", "location_id": 5, "status": "ok"}]}}
    id: int | None
    type: EventType
    title: str
    weekday: Weekday
    start_time: time
    end_time: time
    location_id: int
    status: Status

class LocationResponse(SQLModel):
    model_config = {"json_schema_extra": {"examples": [{"id": 5, "name": "Raum A-101"}]}}
    id: int | None
    name: str

class DegreeResponse(SQLModel):
    model_config = {"json_schema_extra": {"examples": [{"id": 1, "name": "Informatik B.Sc."}]}}
    id: int | None
    name: str

class SemesterResponse(SQLModel):
    model_config = {"json_schema_extra": {"examples": [{"id": 1, "name": "SoSe 2026"}]}}
    id: int | None
    name: str


# --- List schemas (IDs only for relationships) ---

class ModuleWithRelationshipsResponse(ModuleResponse):
    model_config = {"json_schema_extra": {"examples": [{"id": 1, "name": "Mathematik I", "module_number": "MAT-101", "credits": 6, "planung": "FB Mathematik", "language": "Deutsch", "degree_ids": {1: [1, 2], 3: [1]}, "event_ids": [10, 11]}]}} # pyright: ignore[reportAssignmentType]
    degree_ids: dict[int, list[int]] = {}
    event_ids: list[int] = []

class StaffWithRelationshipsResponse(StaffResponse):
    model_config = {"json_schema_extra": {"examples": [{"id": 1, "name": "Prof. Dr. Schmidt", "event_ids": [10, 11, 25]}]}}
    event_ids: list[int] = []

class EventWithRelationshipsResponse(EventResponse):
    model_config = {"json_schema_extra": {"examples": [{"id": 10, "type": "Vorlesung", "title": "Mathematik I - Vorlesung", "weekday": 1, "start_time": "08:00:00", "end_time": "09:30:00", "location_id": 5, "status": "ok", "module_ids": [1], "staff_ids": [1, 3], "semester_ids": [1, 2]}]}}
    module_ids: list[int] = []
    staff_ids: list[int] = []
    semester_ids: list[int] = []

class LocationWithRelationshipsResponse(LocationResponse):
    model_config = {"json_schema_extra": {"examples": [{"id": 5, "name": "Raum A-101", "event_ids": [10, 11, 42]}]}}
    event_ids: list[int] = []

class DegreeWithRelationshipsResponse(DegreeResponse):
    model_config = {"json_schema_extra": {"examples": [{"id": 1, "name": "Informatik B.Sc.", "module_ids": [1, 2, 5], "semesters": [1, 2, 3, 4, 5, 6]}]}}
    module_ids: list[int] = []
    semesters: list[int] = []


# --- Detail schemas (full nested objects, using flat base schemas to avoid circular refs) ---

class DegreeInModuleResponse(DegreeResponse):
    model_config = {"json_schema_extra": {"examples": [{"id": 1, "name": "Informatik B.Sc.", "semesters": [1, 2], "note": "Pflichtmodul"}]}}
    semesters: list[int] = []
    note: str | None = None

class ModuleInDegreeResponse(ModuleResponse):
    model_config = {"json_schema_extra": {"examples": [{"id": 1, "name": "Mathematik I", "module_number": "MAT-101", "credits": 6, "planung": "FB Mathematik", "language": "Deutsch", "semesters": [1], "note": "Pflichtmodul"}]}}
    semesters: list[int] = []
    note: str | None = None

class ModuleDetailResponse(ModuleResponse):
    model_config = {"json_schema_extra": {"examples": [{"id": 1, "name": "Mathematik I", "module_number": "MAT-101", "credits": 6, "planung": "FB Mathematik", "language": "Deutsch", "degrees": [{"id": 1, "name": "Informatik B.Sc.", "semesters": [1], "note": "Pflichtmodul"}], "events": [{"id": 10, "type": "Vorlesung", "title": "Mathematik I - Vorlesung", "weekday": 1, "start_time": "08:00:00", "end_time": "09:30:00", "location_id": 5, "status": "ok"}]}]}}
    degrees: list[DegreeInModuleResponse] = []
    events: list[EventResponse] = []

class StaffDetailResponse(StaffResponse):
    model_config = {"json_schema_extra": {"examples": [{"id": 1, "name": "Prof. Dr. Schmidt", "events": [{"id": 10, "type": "Vorlesung", "title": "Mathematik I - Vorlesung", "weekday": 1, "start_time": "08:00:00", "end_time": "09:30:00", "location_id": 5, "status": "ok"}]}]}}
    events: list[EventResponse] = []

class EventDetailResponse(EventResponse):
    model_config = {"json_schema_extra": {"examples": [{"id": 10, "type": "Vorlesung", "title": "Mathematik I - Vorlesung", "weekday": 1, "start_time": "08:00:00", "end_time": "09:30:00", "location_id": 5, "status": "ok", "module": [{"id": 1, "name": "Mathematik I", "module_number": "MAT-101", "credits": 6, "planung": "FB Mathematik", "language": "Deutsch"}], "staff": [{"id": 1, "name": "Prof. Dr. Schmidt"}], "semester": [{"id": 1, "name": "Wintersemester 2023/24"}]}]}}
    module: list[ModuleResponse] = []
    staff: list[StaffResponse] = []
    semester: list[SemesterResponse] = []

class LocationDetailResponse(LocationResponse):
    model_config = {"json_schema_extra": {"examples": [{"id": 5, "name": "Raum A-101", "events": [{"id": 10, "type": "Vorlesung", "title": "Mathematik I - Vorlesung", "weekday": 1, "start_time": "08:00:00", "end_time": "09:30:00", "location_id": 5, "status": "ok"}]}]}}
    events: list[EventResponse] = []

class DegreeDetailResponse(DegreeResponse):
    model_config = {"json_schema_extra": {"examples": [{"id": 1, "name": "Informatik B.Sc.", "modules": [{"id": 1, "name": "Mathematik I", "module_number": "MAT-101", "credits": 6, "planung": "FB Mathematik", "language": "Deutsch", "semesters": [1], "note": "Pflichtmodul"}], "semesters": [1, 2, 3, 4, 5, 6]}]}}
    modules: list[ModuleInDegreeResponse] = []
    semesters: list[int] = []
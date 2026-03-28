![Logo](https://casparkroll.de/planer/assets/img/logo.png)

# Modul Planer – Universität Leipzig – Informatik Fakultät

This web app parses and renders data from the [planning tool of the faculty](https://www.informatik.uni-leipzig.de/~stundenplan/modul.html) in a clean timetable view.
It offers powerful filtering by degree, semester, module, event type, status, staff, and location.

## Features

- Timetable view (week, day, list) powered by FullCalendar v6
- Tri-state filters (neutral / selected / hidden) across six categories
- Cascading filter counts and active-selection chips
- Degree → semester → module cascade
- Event pinning and pin-group exclusion
- Multiple color modes (type, module, status, staff, custom)
- Shareable links via URL parameters
- Local persistence with `localStorage`
- Dark mode
- Responsive design with mobile sidebar
- Event detail popup (time, location, staff, status, modules, credits, degrees)

## Tech Stack

**Frontend:** HTML, Tailwind CSS v4, Plain JavaScript (ES Modules), FullCalendar v6, Material Icons

**Backend:** Python, FastAPI, SQLModel (SQLite), BeautifulSoup, httpx

## Requirements

- Python 3.10+
- Node.js (for Tailwind CSS CLI, dev only)

## Installation

```bash
# Clone the repository
git clone https://github.com/natureFrameworkManager/planer.git
cd planer

# Create and activate a virtual environment
python -m venv .venv
# Windows
.venv\Scripts\Activate.ps1
# Linux / macOS
source .venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Install Tailwind CSS CLI (dev only)
npm install
```

## Usage

```bash
# Start the FastAPI server (serves API + frontend)
fastapi run backend/main.py
```

The app will be available at `http://127.0.0.1:8000`.
On startup the backend fetches the latest schedule, parses it, and populates the SQLite database.

### Tailwind CSS (development)

```bash
npx @tailwindcss/cli -i frontend/css/main.css -o frontend/css/css.css --watch
```

### Tests

```bash
pytest
```

## API

FastAPI provides interactive API documentation out of the box:

- **Swagger UI (OpenAPI):** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

All endpoints are read-only (`GET`) under `/api`. CORS is enabled for all origins (GET only).
On startup the backend parses the latest schedule from the faculty website and populates a local SQLite database. The database is automatically cleared and repopulated when a new semester is detected.

### Endpoints

| Resource    | List               | Detail                  |
| ----------- | ------------------ | ----------------------- |
| Modules     | `/api/modules`     | `/api/modules/{id}`     |
| Events      | `/api/events`      | `/api/events/{id}`      |
| Staff       | `/api/staff`       | `/api/staff/{id}`       |
| Locations   | `/api/locations`   | `/api/locations/{id}`   |
| Degrees     | `/api/degrees`     | `/api/degrees/{id}`     |
| Semesters   | `/api/semesters`   | `/api/semesters/{id}`   |

### Relationship loading

Every list and detail endpoint supports `?include_relationships=true`:

- **List endpoints** — adds related ID arrays (e.g. `degree_ids`, `event_ids`, `module_ids`, `staff_ids`).
- **Detail endpoints** — embeds full nested objects (e.g. modules include their degrees with semester info and their events).

Degree endpoints additionally support `?include_semesters=true` to include the list of semesters associated with each degree.

### Filters

All filters are combined with **AND**. List parameters (e.g. `weekday`, `type`, `status`) accept multiple values combined with **OR**.

#### Modules

| Parameter       | Description                                       |
| --------------- | ------------------------------------------------- |
| `name`          | Case-insensitive substring match on module name   |
| `module_number` | Case-insensitive substring match on module number |
| `language`      | Case-insensitive substring match on language      |
| `planung`       | Case-insensitive substring match on department    |
| `credits_min`   | Minimum credits (inclusive)                       |
| `credits_max`   | Maximum credits (inclusive)                       |
| `degree_id`     | Filter by associated degree ID                    |
| `semester`      | Filter by semester number (with `degree_id`)      |

#### Events

| Parameter        | Description                                                                  |
| ---------------- | ---------------------------------------------------------------------------- |
| `title`          | Case-insensitive substring match on event title                              |
| `weekday`        | Weekday(s): `1`=Monday .. `7`=Sunday                                        |
| `type`           | Event type(s), e.g. `Vorlesung`, `Seminar`, `Übung`, `Praktikum`, ...       |
| `status`         | Status(es): `ok`, `pok`, `tok`, `alt`, `reserve`                            |
| `location_id`    | Filter by location ID                                                        |
| `start_time_min` | Events starting at or after this time (`HH:MM`)                             |
| `start_time_max` | Events starting at or before this time (`HH:MM`)                            |
| `end_time_min`   | Events ending at or after this time (`HH:MM`)                               |
| `end_time_max`   | Events ending at or before this time (`HH:MM`)                              |
| `module_id`      | Filter by associated module ID(s)                                            |
| `staff_id`       | Filter by associated staff ID(s)                                             |
| `degree_id`      | Filter by associated degree ID(s) (via modules)                              |
| `semester`       | Filter by semester number (with `degree_id`)                                 |

#### Staff / Locations / Degrees / Semesters

| Endpoint   | Parameter    | Description                            |
| ---------- | ------------ | -------------------------------------- |
| Staff      | `name`       | Case-insensitive substring match       |
| Staff      | `event_id`   | Filter by associated event ID          |
| Locations  | `name`       | Case-insensitive substring match       |
| Degrees    | `name`       | Case-insensitive substring match       |
| Degrees    | `module_id`  | Filter by associated module ID         |
| Semesters  | `name`       | Case-insensitive substring match       |

### Data model

Six entities connected by three many-to-many link tables:

```
Degree ←─ ModuleDegreeLink (+ semester, note) ─→ Module
Module ←─ ModuleEventLink ─→ Event
Event  ←─ EventStaffLink  ─→ Staff
Event  ───→ Location (many-to-one)
```

**Enums:**
- **Weekday:** `1` (Monday) – `7` (Sunday)
- **Status:** `ok` · `pok` (time unconfirmed) · `tok` (lecturer unconfirmed) · `alt` (carried over) · `reserve` (no longer offered)
- **EventType:** Vorlesung · Seminar · Übung · Praktikum · Kolloquium · E-Learning-Veranstaltung · Projektseminar · Schulpraktische Studien · Seminar mit Übungsanteil · Vorlesung mit integrierter Übung · Vorlesung mit seminaristischem Anteil · Kein Typ angegeben

## Feature ideas

- [x] Parse data from faculty planning tool
- [x] Filtering (status, type, module, degree, person, location)
- [x] Responsive design
- [x] Dark mode
- [x] Generate final timetable from selectable events
  - [x] Hide selected events
- [x] Different color styles (type, module, status, staff, custom)
- [x] Shareable links via URL parameters
- [ ] Progressive Web App / Offline usage
- [ ] Deselect impossible filter combinations without unchecking user selections
- [ ] Save selection per client in `localStorage`
  - [ ] Create personal link from selection

## License

[Open Software License 3.0](https://choosealicense.com/licenses/osl-3.0/)

## Acknowledgements

- [FullCalendar](https://fullcalendar.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [SQLModel](https://sqlmodel.tiangolo.com/)
- [BeautifulSoup](https://www.crummy.com/software/BeautifulSoup/)
- [Choose an open source license](https://choosealicense.com/)

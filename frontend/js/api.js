const API_BASE = "http://127.0.0.1:8000/api";

async function apiFetch(path) {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) throw new Error(`API ${path}: ${res.status}`);
    return res.json();
}

export async function fetchDegrees() {
    return apiFetch(
        "/degrees?include_relationships=true&include_semesters=true",
    );
}

export async function fetchDegreeDetail(id) {
    return apiFetch(
        `/degrees/${id}?include_relationships=true&include_semesters=true`,
    );
}

export async function fetchModules() {
    return apiFetch("/modules?include_relationships=true");
}

export async function fetchEvents() {
    return apiFetch("/events?include_relationships=true");
}

export async function fetchStaff() {
    return apiFetch("/staff");
}

export async function fetchLocations() {
    return apiFetch("/locations");
}

export async function fetchSemesters() {
    return apiFetch("/semesters");
}

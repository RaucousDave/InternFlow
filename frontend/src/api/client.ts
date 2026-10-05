import axios from "axios";
import { createAuthClient } from "better-auth/client";
import type {
  FeedbackItem,
  LogbookEntry,
  Placement,
  StudentProfile,
} from "./types";

export type { FeedbackItem, LogbookEntry, Placement, StudentProfile };

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// better-auth owns sign-up / sign-in / sign-out / session (cookie-based).
export const authClient = createAuthClient({ baseURL: API_URL });

const api = axios.create({ baseURL: `${API_URL}/api`, withCredentials: true });

// Role cache for route guards. Convenience only — the backend re-checks
// the DB-stored role on every request. Refreshed on login, cleared on logout.
const ROLE_KEY = "internflow.role";
export const getRole = () => localStorage.getItem(ROLE_KEY);
const setRole = (r: string) => localStorage.setItem(ROLE_KEY, r);
export const clearRole = () => localStorage.removeItem(ROLE_KEY);

export async function refreshRole(): Promise<string | null> {
  try {
    const { data } = await api.get<{ role: string }>("/me");
    setRole(data.role);
    return data.role;
  } catch {
    return null;
  }
}

// Human-readable message from an API failure ({ error, code } shape).
export function errMsg(
  e: unknown,
  fallback = "Request failed. Is the backend running?",
): string {
  if (typeof e === "object" && e !== null && "response" in e) {
    const r = (
      e as { response?: { data?: { error?: string }; status?: number } }
    ).response;
    if (r?.data?.error) return r.data.error;
    if (r?.status) return `${fallback} (HTTP ${r.status})`;
  }
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

// Locale-aware date rendering (never hardcode date formats).
export function fmtDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(d);
}
export async function register(p: {
  name: string;
  email: string;
  password: string;
  registrationNumber: string;
}) {
  const res = await authClient.signUp.email({
    name: p.name,
    email: p.email,
    password: p.password,
  });
  if (res.error) throw new Error(res.error.message ?? "Registration failed");
  // Backend creates the student row + validates the reg. number on profile save.
  await updateProfile({
    fullName: p.name,
    registrationNumber: p.registrationNumber,
    email: p.email,
  });
  return refreshRole();
}

export async function login(p: { email: string; password: string }) {
  const res = await authClient.signIn.email(p);
  if (res.error) throw new Error(res.error.message ?? "Login failed");
  return refreshRole();
}

export async function logout() {
  await authClient.signOut();
  clearRole();
}

// ---- Student ----
export const getProfile = () => api.get<StudentProfile>("/students/profile");
export const updateProfile = (p: Partial<StudentProfile>) =>
  api.put("/students/profile", p);
export const listPlacements = () => api.get<Placement[]>("/placements");
export const createPlacement = (p: Placement) => api.post("/placements", p);
export const updatePlacement = (id: string, p: Partial<Placement>) =>
  api.put(`/placements/${id}`, p);
export const listLogbook = () => api.get<LogbookEntry[]>("/logbook");
export const getLogbook = (id: string) =>
  api.get<LogbookEntry>(`/logbook/${id}`);
export const createLogbook = (p: Omit<LogbookEntry, "id" | "status">) =>
  api.post("/logbook", p);
export const updateLogbook = (id: string, p: Partial<LogbookEntry>) =>
  api.put(`/logbook/${id}`, p);
export const submitLogbook = (id: string) => api.post(`/logbook/${id}/submit`);
export const listFeedback = () => api.get<FeedbackItem[]>("/feedback");

// ---- Supervisor ----
export const listStudents = () => api.get("/supervisor/students");
export const getStudent = (id: string) => api.get(`/supervisor/students/${id}`);
export const getStudentLogbook = (id: string) =>
  api.get(`/supervisor/students/${id}/logbook`);
export const giveFeedback = (logbookId: string, body: string) =>
  api.post(`/supervisor/logbook/${logbookId}/feedback`, { body });
export const markComplete = (id: string) =>
  api.patch(`/supervisor/students/${id}/complete`);

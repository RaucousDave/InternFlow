// Shared shapes matching the backend contract (DESIGN.md §4).
// Keep in sync with backend/src/db/schema.ts.

export type Role = "STUDENT" | "SUPERVISOR";
export type LogbookStatus = "DRAFT" | "SUBMITTED" | "REVIEWED";

export interface Session {
  token: string;
  role: Role;
  email: string;
}

export interface StudentProfile {
  fullName: string;
  registrationNumber: string;
  email: string;
  phone?: string;
  department?: string;
  faculty?: string;
}

export interface Placement {
  id?: string;
  orgName: string;
  orgAddress: string;
  position: string;
  startDate: string;
  endDate: string;
  industrySupervisorName: string;
  industrySupervisorContact: string;
}

export interface LogbookEntry {
  id?: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  activities: string;
  challenges: string;
  lessons: string;
  status: LogbookStatus;
  feedback?: FeedbackItem[];
}

export interface FeedbackItem {
  id?: string;
  logbookEntryId: string;
  body: string;
  createdAt?: string;
}

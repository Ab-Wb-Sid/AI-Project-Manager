import type { Role } from "@/types/user";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Parses "YYYY-MM-DD" without touching time zones. Returns null when it isn't a real date. */
export function parseIsoDate(value: string | null | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return null;
  }
  return { year: y, month: m, day: d };
}

/** "2026-10-20" → "20 Oct 2026" */
export function formatDate(value: string | null | undefined) {
  const p = parseIsoDate(value);
  if (!p) return value ?? "";
  return `${p.day} ${MONTHS[p.month - 1]} ${p.year}`;
}

/** Task due date: "12 Oct" when it shares the project deadline's year, else "12 Oct 2027". */
export function formatTaskDate(value: string, projectDeadline?: string) {
  const p = parseIsoDate(value);
  if (!p) return value;
  const projectYear = parseIsoDate(projectDeadline)?.year;
  const short = `${p.day} ${MONTHS[p.month - 1]}`;
  return projectYear === undefined || projectYear === p.year ? short : `${short} ${p.year}`;
}

/** 12 → "12", 7.5 → "7.5" */
export function formatHours(hours: number) {
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1).replace(/\.0$/, "");
}

/** formatCount(1, "task") → "1 task"; formatCount(3, "task") → "3 tasks" */
export function formatCount(n: number, singular: string, plural = `${singular}s`) {
  return `${n.toLocaleString("en-GB")} ${n === 1 ? singular : plural}`;
}

/** "Ayesha Khan" → "AK" */
export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/** The company calls the AGENT role "Developer". */
export function roleLabel(role: Role) {
  if (role === "ADMIN") return "Administrator";
  if (role === "MANAGER") return "Manager";
  return "Developer";
}

/** "Manager · Web PM" — the small line under the user's name. */
export function roleLine(role: Role, specialization?: string | null) {
  const label = roleLabel(role);
  if (!specialization || specialization === label) return label;
  return `${label} · ${specialization}`;
}

export function sumHours<T extends { estimatedHours: number }>(rows: T[]) {
  return rows.reduce((total, row) => total + row.estimatedHours, 0);
}

/** Ascending by due date, then title, so tables read in delivery order. */
export function byDeadline<T extends { deadline: string; title?: string }>(a: T, b: T) {
  return a.deadline.localeCompare(b.deadline) || (a.title ?? "").localeCompare(b.title ?? "");
}

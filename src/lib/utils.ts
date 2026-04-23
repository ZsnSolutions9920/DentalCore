import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CLINIC_TZ = "Asia/Karachi";
export const CLINIC_TZ_OFFSET = "+05:00";

export function getClinicToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: CLINIC_TZ });
}

export function toClinicDay(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleDateString("en-CA", { timeZone: CLINIC_TZ });
}

export function clinicDayRange(dateStr: string): { gte: Date; lt: Date } {
  const gte = new Date(`${dateStr}T00:00:00${CLINIC_TZ_OFFSET}`);
  const lt = new Date(gte.getTime() + 24 * 60 * 60 * 1000);
  return { gte, lt };
}

export function shiftDay(dateStr: string, deltaDays: number): string {
  const base = new Date(`${dateStr}T12:00:00${CLINIC_TZ_OFFSET}`);
  base.setUTCDate(base.getUTCDate() + deltaDays);
  return base.toLocaleDateString("en-CA", { timeZone: CLINIC_TZ });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: CLINIC_TZ,
  }).format(new Date(date));
}

export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: CLINIC_TZ,
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function getInitials(name: string): string {
  return (name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function generateId(prefix: string, num: number): string {
  return `${prefix}-${num.toString().padStart(4, "0")}`;
}

export function calculateAge(dob: string | Date): number {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function calculateBMI(weightKg: number, heightCm: number): string {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return bmi.toFixed(1);
}

export function timeAgo(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

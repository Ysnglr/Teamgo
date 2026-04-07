import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type EventState = "upcoming" | "approaching" | "live" | "expired";

export function getEventState(event: {
  start_time: string | Date;
  end_time: string | Date | null;
  arrival_time: string | Date | null;
}): EventState {
  const now = new Date();
  const start = new Date(event.start_time);
  const end = event.end_time ? new Date(event.end_time) : null;
  const arrival = event.arrival_time ? new Date(event.arrival_time) : null;

  if (end && now > end) return "expired";
  if (now >= start) return "live";
  if (arrival && now >= arrival) return "approaching";
  return "upcoming";
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Event } from "@/generated/prisma";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type EventState = "upcoming" | "approaching" | "live" | "expired";

export function getEventState(event: Pick<Event, "start_time" | "end_time" | "arrival_time">): EventState {
  const now = new Date();
  if (event.end_time && now > event.end_time) return "expired";
  if (now >= event.start_time) return "live";
  if (event.arrival_time && now >= event.arrival_time) return "approaching";
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

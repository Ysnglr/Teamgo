import type { SportType } from "@/types";

export type OnboardingTemplate = {
  roles: string[];
  teams: string[];
  eventTypes: { name: string; color: string }[];
};

const TR_TEMPLATE: OnboardingTemplate = {
  roles: ["Baş Antrenör", "Yardımcı Antrenör", "Menajer", "Kondisyoner"],
  teams: ["A Takım", "U19", "U16", "U14", "U12", "U11"],
  eventTypes: [
    { name: "Antrenman", color: "#3498db" },
    { name: "Maç", color: "#e74c3c" },
    { name: "Toplantı", color: "#f1c40f" },
    { name: "Video Analiz", color: "#2ecc71" },
    { name: "Seyahat", color: "#95a5a6" },
    { name: "Kondisyon", color: "#9b59b6" },
  ],
};

const EN_TEMPLATE: OnboardingTemplate = {
  roles: ["Head Coach", "Assistant Coach", "Manager", "Trainer"],
  teams: ["Varsity", "JV", "Freshman", "Middle School"],
  eventTypes: [
    { name: "Practice", color: "#3498db" },
    { name: "Game", color: "#e74c3c" },
    { name: "Team Meeting", color: "#f1c40f" },
    { name: "Film Study", color: "#2ecc71" },
    { name: "Travel", color: "#95a5a6" },
    { name: "Conditioning", color: "#9b59b6" },
  ],
};

export function getTemplate(locale: string | null): OnboardingTemplate {
  if (locale?.startsWith("tr")) return TR_TEMPLATE;
  return EN_TEMPLATE;
}

export const SPORT_OPTIONS: { value: SportType; label: string; emoji: string }[] = [
  { value: "basketball", label: "Basketbol", emoji: "🏀" },
  { value: "soccer", label: "Futbol", emoji: "⚽" },
  { value: "volleyball", label: "Voleybol", emoji: "🏐" },
  { value: "baseball", label: "Beyzbol", emoji: "⚾" },
  { value: "football", label: "Amerikan Futbolu", emoji: "🏈" },
  { value: "other", label: "Diğer", emoji: "🏅" },
];

export const COLOR_PALETTE = [
  "#3498db",
  "#e74c3c",
  "#f1c40f",
  "#2ecc71",
  "#95a5a6",
  "#9b59b6",
  "#e67e22",
  "#1abc9c",
];

"use client";

import { useRouter } from "next/navigation";
import { SPORT_OPTIONS } from "@/lib/onboarding-templates";
import type { SportType } from "@/types";

export default function SportSelector() {
  const router = useRouter();

  function handleSelect(sport: SportType) {
    // Store selection in sessionStorage so the wizard can seed the correct templates
    sessionStorage.setItem("onboarding_sport", sport);
    // 300ms animation delay before navigating
    setTimeout(() => router.push(`/onboarding/club?sport=${sport}`), 300);
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold">Branşınızı Seçin</h1>
        <p className="text-muted-foreground text-sm">Kulübünüzün branşını seçin</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {SPORT_OPTIONS.map((sport) => (
          <button
            key={sport.value}
            onClick={() => handleSelect(sport.value)}
            className="flex flex-col items-center gap-2 rounded-xl border bg-card p-5 text-card-foreground shadow-sm transition-all hover:border-primary hover:shadow-md active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="text-4xl">{sport.emoji}</span>
            <span className="text-sm font-medium">{sport.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

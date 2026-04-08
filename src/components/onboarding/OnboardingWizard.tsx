"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getTemplate } from "@/lib/onboarding-templates";
import RolesStep from "./RolesStep";
import EventTypesStep from "./EventTypesStep";
import TeamsStep from "./TeamsStep";

const STEPS = [
  { title: "Roller", description: "Personel rollerini tanımlayın" },
  { title: "Event Tipleri", description: "Etkinlik kategorilerini belirleyin" },
  { title: "Takımlar", description: "Takım yapınızı oluşturun" },
];

export default function OnboardingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sport = searchParams.get("sport") ?? sessionStorage.getItem("onboarding_sport") ?? "other";

  const [step, setStep] = useState(0);
  const [roles, setRoles] = useState<string[]>([]);
  const [eventTypes, setEventTypes] = useState<{ name: string; color: string }[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Detect locale from browser and populate templates
    const locale = navigator.language ?? "en";
    const template = getTemplate(locale);
    setRoles(template.roles);
    setEventTypes(template.eventTypes);
    setTeams(template.teams);
  }, []);

  async function handleComplete() {
    setSubmitting(true);
    setError(null);

    // Seed default data
    const seedRes = await fetch("/api/onboarding/seed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sport_type: sport, roles, eventTypes, teams }),
    });

    if (!seedRes.ok) {
      const data = await seedRes.json();
      setError(data.errors?.join(", ") ?? "Kurulum başarısız");
      setSubmitting(false);
      return;
    }

    // Mark onboarding complete
    await fetch("/api/onboarding/complete", { method: "PATCH" });

    router.push("/onboarding/complete");
    router.refresh();
  }

  const isLast = step === STEPS.length - 1;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            Adım {step + 1} / {STEPS.length}
          </span>
          <span>{STEPS[step].title}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step header */}
      <div>
        <h1 className="text-xl font-bold">{STEPS[step].title}</h1>
        <p className="text-sm text-muted-foreground">{STEPS[step].description}</p>
      </div>

      {/* Step content */}
      {step === 0 && <RolesStep roles={roles} onChange={setRoles} />}
      {step === 1 && <EventTypesStep eventTypes={eventTypes} onChange={setEventTypes} />}
      {step === 2 && <TeamsStep teams={teams} onChange={setTeams} />}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Navigation */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => (step === 0 ? router.back() : setStep((s) => s - 1))}
          disabled={submitting}
        >
          Geri
        </Button>
        {isLast ? (
          <Button
            type="button"
            className="flex-1"
            onClick={handleComplete}
            disabled={submitting || teams.length === 0}
          >
            {submitting ? "Kuruluyor..." : "Tamamla & Başla"}
          </Button>
        ) : (
          <Button
            type="button"
            className="flex-1"
            onClick={() => setStep((s) => s + 1)}
          >
            Devam Et
          </Button>
        )}
      </div>
    </div>
  );
}

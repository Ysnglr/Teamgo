"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ClubSetup() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sport = searchParams.get("sport") ?? sessionStorage.getItem("onboarding_sport") ?? "other";

  const [clubName, setClubName] = useState("");

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    sessionStorage.setItem("onboarding_club_name", clubName);
    router.push(`/onboarding/setup?sport=${sport}`);
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold">Kulübünüzü Kurun</h1>
        <p className="text-muted-foreground text-sm">Kulüp adını girin</p>
      </div>
      <form onSubmit={handleContinue} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="club_name">Kulüp Adı</Label>
          <Input
            id="club_name"
            type="text"
            placeholder="Örn: Lakers Academy"
            value={clubName}
            onChange={(e) => setClubName(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.back()}
          >
            Geri
          </Button>
          <Button type="submit" className="flex-1" disabled={!clubName.trim()}>
            Devam Et
          </Button>
        </div>
      </form>
    </div>
  );
}

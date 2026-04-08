"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function OnboardingCompletePage() {
  const router = useRouter();
  const [clubCode, setClubCode] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/onboarding/club-code")
      .then((r) => r.json())
      .then((d) => setClubCode(d.club_code))
      .catch(() => null);
  }, []);

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-2">
        <div className="text-5xl">🎉</div>
        <h1 className="text-2xl font-bold">Kurulum Tamamlandı!</h1>
        <p className="text-muted-foreground text-sm">
          Kulübünüz başarıyla kuruldu. Hemen kullanmaya başlayabilirsiniz.
        </p>
      </div>

      {clubCode && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Oyuncu Davet Kodu</p>
            <p className="text-3xl font-mono font-bold tracking-widest">{clubCode}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Oyuncularınız bu kodu kullanarak /join sayfasından katılabilir
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        <Button
          onClick={() => router.push("/admin/users?invite=staff")}
          variant="outline"
          className="w-full"
        >
          👔 Personel Davet Et
        </Button>
        <Button onClick={() => router.push("/staff/create-event")} variant="outline" className="w-full">
          📅 İlk Event Oluştur
        </Button>
        <Button onClick={() => router.push("/admin")} className="w-full">
          Panele Git
        </Button>
      </div>
    </div>
  );
}

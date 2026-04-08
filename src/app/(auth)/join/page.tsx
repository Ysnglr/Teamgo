"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

export default function JoinPage() {
  const router = useRouter();
  const [clubCode, setClubCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        club_code: clubCode.toUpperCase(),
        email,
        password,
        full_name: fullName,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Katılım başarısız");
      setLoading(false);
      return;
    }

    // Sign in as the newly created player
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/player");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <span className="text-4xl">🏆</span>
        </div>
        <CardTitle className="text-xl">Kulübe Katıl</CardTitle>
        <CardDescription>Coach&apos;unuzdan aldığınız 6 haneli kodu girin</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleJoin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="club_code">Kulüp Kodu</Label>
            <Input
              id="club_code"
              type="text"
              placeholder="ABC123"
              value={clubCode}
              onChange={(e) => setClubCode(e.target.value.toUpperCase())}
              required
              maxLength={6}
              className="tracking-widest text-center font-mono text-lg uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Ad Soyad</Label>
            <Input
              id="full_name"
              type="text"
              placeholder="Ahmet Yılmaz"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              type="email"
              placeholder="ornek@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Şifre</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Katılınıyor..." : "Katıl"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Zaten hesabınız var mı?{" "}
            <Link href="/login" className="underline underline-offset-4 hover:text-foreground">
              Giriş Yap
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";
import { z } from "zod";

const joinSchema = z.object({
  club_code: z.string().length(6),
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = joinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { club_code, email, password, full_name } = parsed.data;

  const serviceSupabase = createServiceClient();

  // Verify the club code belongs to an ADMIN
  const { data: admin } = await serviceSupabase
    .from("User")
    .select("id")
    .eq("club_code", club_code.toUpperCase())
    .eq("user_type", "ADMIN")
    .maybeSingle();

  if (!admin) {
    return NextResponse.json({ error: "Geçersiz kulüp kodu" }, { status: 404 });
  }

  // Create auth user
  const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: authError?.message ?? "Auth creation failed" },
      { status: 400 }
    );
  }

  // Insert User row as PLAYER
  const { data: newUser, error: userError } = await serviceSupabase
    .from("User")
    .insert({
      email,
      full_name,
      user_type: "PLAYER",
      onboarding_completed: true,
    })
    .select()
    .single();

  if (userError || !newUser) {
    await serviceSupabase.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json(
      { error: userError?.message ?? "User creation failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(1),
});

function generateClubCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { email, password, full_name } = parsed.data;
  const locale = request.headers.get("accept-language")?.split(",")[0] ?? "en";

  const serviceSupabase = createServiceClient();

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

  // Generate a unique club code
  let club_code = generateClubCode();
  let attempts = 0;
  while (attempts < 5) {
    const { data: existing } = await serviceSupabase
      .from("User")
      .select("id")
      .eq("club_code", club_code)
      .maybeSingle();
    if (!existing) break;
    club_code = generateClubCode();
    attempts++;
  }

  // Insert User row
  const { data: newUser, error: userError } = await serviceSupabase
    .from("User")
    .insert({
      email,
      full_name,
      user_type: "ADMIN",
      onboarding_completed: false,
      locale,
      club_code,
    })
    .select()
    .single();

  if (userError || !newUser) {
    // Rollback auth user on failure
    await serviceSupabase.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json(
      { error: userError?.message ?? "User creation failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, locale }, { status: 201 });
}

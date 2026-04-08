import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const seedSchema = z.object({
  sport_type: z.string(),
  roles: z.array(z.string().min(1)),
  eventTypes: z.array(
    z.object({
      name: z.string().min(1),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    })
  ),
  teams: z.array(z.string().min(1)),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: dbUser } = await supabase
    .from("User")
    .select("user_type, onboarding_completed")
    .eq("email", user.email!)
    .single();

  if (!dbUser || dbUser.user_type !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (dbUser.onboarding_completed) {
    return NextResponse.json({ error: "Already onboarded" }, { status: 409 });
  }

  const body = await request.json();
  const parsed = seedSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { sport_type, roles, eventTypes, teams } = parsed.data;

  const errors: string[] = [];

  // Seed roles
  if (roles.length > 0) {
    const { error } = await supabase
      .from("Role")
      .insert(roles.map((name) => ({ name, can_create_event: false, can_invite_players: false })));
    if (error) errors.push(`roles: ${error.message}`);
  }

  // Seed event types
  if (eventTypes.length > 0) {
    const { error } = await supabase
      .from("EventType")
      .insert(eventTypes.map(({ name, color }) => ({ name, color })));
    if (error) errors.push(`eventTypes: ${error.message}`);
  }

  // Seed teams
  if (teams.length > 0) {
    const { error } = await supabase
      .from("Team")
      .insert(teams.map((name) => ({ name })));
    if (error) errors.push(`teams: ${error.message}`);
  }

  // Update sport_type on user
  await supabase
    .from("User")
    .update({ sport_type })
    .eq("email", user.email!);

  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 207 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

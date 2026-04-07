import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const teamSchema = z.object({ name: z.string().min(1) });

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: teams }, { data: playerMembers }, { data: staffMembers }] = await Promise.all([
    supabase.from("Team").select("*").order("name", { ascending: true }),
    supabase.from("TeamPlayerMember").select("team_id"),
    supabase.from("TeamStaffMember").select("team_id"),
  ]);

  const result = (teams ?? []).map((t: { id: string; [key: string]: unknown }) => ({
    ...t,
    _count: {
      player_members: (playerMembers ?? []).filter((m) => m.team_id === t.id).length,
      staff_members: (staffMembers ?? []).filter((m) => m.team_id === t.id).length,
    },
  }));

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: dbUser } = await supabase
    .from("User")
    .select("user_type")
    .eq("email", user.email!)
    .single();
  if (!dbUser || dbUser.user_type !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = teamSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data: team } = await supabase
    .from("Team")
    .insert(parsed.data)
    .select()
    .single();

  return NextResponse.json(team, { status: 201 });
}

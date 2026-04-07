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

  const { data: teams } = await supabase
    .from("Team")
    .select("*, TeamPlayerMember(count), TeamStaffMember(count)")
    .order("name", { ascending: true });

  // Normalize count shape
  const result = (teams ?? []).map(
    (t: {
      TeamPlayerMember: { count: number }[];
      TeamStaffMember: { count: number }[];
      [key: string]: unknown;
    }) => ({
      ...t,
      _count: {
        player_members: t.TeamPlayerMember?.[0]?.count ?? 0,
        staff_members: t.TeamStaffMember?.[0]?.count ?? 0,
      },
      TeamPlayerMember: undefined,
      TeamStaffMember: undefined,
    })
  );

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

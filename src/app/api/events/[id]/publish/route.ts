import { createClient } from "@/lib/supabase/server";
import { EVENT_SELECT, sendNotificationToTeam } from "@/lib/events";
import { NextResponse } from "next/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: dbUser } = await supabase
    .from("User")
    .select("id, user_type")
    .eq("email", user.email!)
    .single();
  if (!dbUser || (dbUser.user_type !== "STAFF" && dbUser.user_type !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: existing } = await supabase
    .from("Event")
    .select("id, status, created_by, team_id")
    .eq("id", id)
    .single();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status !== "DRAFT") {
    return NextResponse.json({ error: "Already published" }, { status: 400 });
  }

  if (dbUser.user_type === "STAFF" && existing.created_by !== dbUser.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await supabase.from("Event").update({ status: "PUBLISHED" }).eq("id", id);

  const { data: event } = await supabase
    .from("Event")
    .select(EVENT_SELECT)
    .eq("id", id)
    .single();

  await sendNotificationToTeam(supabase, id, existing.team_id, "new");

  return NextResponse.json(event);
}

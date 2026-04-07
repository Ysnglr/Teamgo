import { createClient } from "@/lib/supabase/server";
import { getUpcomingEventsForUser } from "@/lib/events";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: dbUser } = await supabase
    .from("User")
    .select("id")
    .eq("email", user.email!)
    .single();
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") ?? "30");
  const limit = parseInt(searchParams.get("limit") ?? "10");

  const events = await getUpcomingEventsForUser(supabase, dbUser.id, days, limit);
  return NextResponse.json(events);
}

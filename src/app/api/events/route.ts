import { createClient } from "@/lib/supabase/server";
import { EVENT_SELECT, sendNotificationToTeam } from "@/lib/events";
import { NextResponse } from "next/server";
import { z } from "zod";

const createEventSchema = z.object({
  title: z.string().min(1),
  event_type_id: z.string().uuid(),
  event_subtype_id: z.string().uuid().optional().nullable(),
  team_id: z.string().uuid(),
  opponent: z.string().optional().nullable(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime().optional().nullable(),
  arrival_time: z.string().datetime().optional().nullable(),
  location_id: z.string().uuid(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  staff_assignments: z
    .array(
      z.object({
        user_id: z.string().uuid(),
        role_id: z.string().uuid(),
      })
    )
    .optional(),
});

export async function GET(request: Request) {
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
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const typeFilter = searchParams.get("type");
  const statusFilter = searchParams.get("status");

  // Get team IDs based on user type
  let teamIds: string[] = [];
  if (dbUser.user_type === "ADMIN") {
    const { data: teams } = await supabase.from("Team").select("id");
    teamIds = teams?.map((t: { id: string }) => t.id) ?? [];
  } else if (dbUser.user_type === "STAFF") {
    const { data: staffTeams } = await supabase
      .from("TeamStaffMember")
      .select("team_id")
      .eq("user_id", dbUser.id);
    teamIds = staffTeams?.map((t: { team_id: string }) => t.team_id) ?? [];
  } else {
    const { data: playerTeams } = await supabase
      .from("TeamPlayerMember")
      .select("team_id")
      .eq("user_id", dbUser.id);
    teamIds = playerTeams?.map((t: { team_id: string }) => t.team_id) ?? [];
  }

  if (teamIds.length === 0) return NextResponse.json([]);

  let query = supabase
    .from("Event")
    .select(EVENT_SELECT)
    .in("team_id", teamIds)
    .order("start_time", { ascending: true });

  if (dbUser.user_type !== "ADMIN") {
    query = query.eq("status", "PUBLISHED");
  } else if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  if (typeFilter) {
    const { data: typeRow } = await supabase
      .from("EventType")
      .select("id")
      .eq("name", typeFilter)
      .single();
    if (typeRow) {
      query = query.eq("event_type_id", typeRow.id);
    }
  }

  const { data: events } = await query;
  const result = events ?? [];

  // Filter out expired events for non-admin
  if (dbUser.user_type !== "ADMIN") {
    const now = new Date();
    return NextResponse.json(
      result.filter(
        (e: { end_time: string | null }) => !e.end_time || new Date(e.end_time) > now
      )
    );
  }

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
    .select("id, user_type")
    .eq("email", user.email!)
    .single();
  if (!dbUser || (dbUser.user_type !== "STAFF" && dbUser.user_type !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { staff_assignments, ...data } = parsed.data;

  const { data: event, error } = await supabase
    .from("Event")
    .insert({ ...data, created_by: dbUser.id })
    .select("id, team_id, status")
    .single();

  if (error || !event) {
    return NextResponse.json({ error: error?.message ?? "Failed to create event" }, { status: 500 });
  }

  if (staff_assignments && staff_assignments.length > 0) {
    await supabase.from("EventStaffAssignment").insert(
      staff_assignments.map((a) => ({ ...a, event_id: event.id }))
    );
  }

  if (event.status === "PUBLISHED") {
    await sendNotificationToTeam(supabase, event.id, event.team_id, "new");
  }

  // Return full event with relations
  const { data: fullEvent } = await supabase
    .from("Event")
    .select(EVENT_SELECT)
    .eq("id", event.id)
    .single();

  return NextResponse.json(fullEvent, { status: 201 });
}

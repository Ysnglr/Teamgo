import { createClient } from "@/lib/supabase/server";
import { EVENT_SELECT, sendNotificationToTeam } from "@/lib/events";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  event_type_id: z.string().uuid().optional(),
  event_subtype_id: z.string().uuid().nullable().optional(),
  team_id: z.string().uuid().optional(),
  opponent: z.string().nullable().optional(),
  start_time: z.string().datetime().optional(),
  end_time: z.string().datetime().nullable().optional(),
  arrival_time: z.string().datetime().nullable().optional(),
  location_id: z.string().uuid().optional(),
  staff_assignments: z
    .array(
      z.object({
        user_id: z.string().uuid(),
        role_id: z.string().uuid(),
      })
    )
    .optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: event } = await supabase
    .from("Event")
    .select(EVENT_SELECT)
    .eq("id", id)
    .single();
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(event);
}

export async function PATCH(
  request: Request,
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
    .select("id, status, created_by, start_time, location_id, team_id")
    .eq("id", id)
    .single();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (dbUser.user_type === "STAFF" && existing.created_by !== dbUser.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { staff_assignments, ...data } = parsed.data;

  // Determine notification type
  let changeType: string | null = null;
  if (existing.status === "PUBLISHED") {
    if (data.start_time && data.start_time !== existing.start_time) changeType = "time";
    else if (data.location_id && data.location_id !== existing.location_id) changeType = "location";
    else changeType = "status";
  }

  // Update staff assignments if provided
  if (staff_assignments !== undefined) {
    await supabase.from("EventStaffAssignment").delete().eq("event_id", id);
    if (staff_assignments.length > 0) {
      await supabase.from("EventStaffAssignment").insert(
        staff_assignments.map((a) => ({ ...a, event_id: id }))
      );
    }
  }

  // Update event
  await supabase.from("Event").update(data).eq("id", id);

  // Fetch full updated event
  const { data: event } = await supabase
    .from("Event")
    .select(EVENT_SELECT)
    .eq("id", id)
    .single();

  if (changeType && event?.status === "PUBLISHED") {
    await sendNotificationToTeam(supabase, id, existing.team_id, changeType);
  }

  return NextResponse.json(event);
}

export async function DELETE(
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
    .select("user_type")
    .eq("email", user.email!)
    .single();
  if (!dbUser || dbUser.user_type !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await supabase.from("Event").delete().eq("id", id);
  return NextResponse.json({ success: true });
}

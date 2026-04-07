import { createClient } from "@/lib/supabase/server";
import { EVENT_SELECT } from "@/lib/events";
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

  // Fetch source event with staff assignments
  const { data: source } = await supabase
    .from("Event")
    .select("*, EventStaffAssignment(user_id, role_id)")
    .eq("id", id)
    .single();
  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const {
    id: _id,
    created_at: _created_at,
    updated_at: _updated_at,
    EventStaffAssignment: assignments,
    ...rest
  } = source;

  // Insert clone
  const { data: clone, error } = await supabase
    .from("Event")
    .insert({
      ...rest,
      title: `${rest.title} (Kopya)`,
      status: "DRAFT",
      created_by: dbUser.id,
    })
    .select("id")
    .single();

  if (error || !clone) {
    return NextResponse.json({ error: error?.message ?? "Clone failed" }, { status: 500 });
  }

  if (assignments && assignments.length > 0) {
    await supabase.from("EventStaffAssignment").insert(
      assignments.map((a: { user_id: string; role_id: string }) => ({
        ...a,
        event_id: clone.id,
      }))
    );
  }

  const { data: fullClone } = await supabase
    .from("Event")
    .select(EVENT_SELECT)
    .eq("id", clone.id)
    .single();

  return NextResponse.json(fullClone, { status: 201 });
}

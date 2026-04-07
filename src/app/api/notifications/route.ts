import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
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

  const { data: notifications } = await supabase
    .from("Notification")
    .select("id, change_type, sent_at, read_at, Event(id, title, Team(name))")
    .eq("user_id", dbUser.id)
    .order("sent_at", { ascending: false })
    .limit(50);

  return NextResponse.json(notifications ?? []);
}

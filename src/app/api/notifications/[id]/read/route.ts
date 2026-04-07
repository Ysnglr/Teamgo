import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
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
    .select("id")
    .eq("email", user.email!)
    .single();
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await supabase
    .from("Notification")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", dbUser.id);

  return NextResponse.json({ success: true });
}

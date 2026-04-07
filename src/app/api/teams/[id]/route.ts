import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const teamSchema = z.object({ name: z.string().min(1) });

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>, email: string) {
  const { data } = await supabase.from("User").select("user_type").eq("email", email).single();
  return data?.user_type === "ADMIN";
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
  if (!(await requireAdmin(supabase, user.email!))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = teamSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data: team } = await supabase
    .from("Team")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();

  return NextResponse.json(team);
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
  if (!(await requireAdmin(supabase, user.email!))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await supabase.from("Team").delete().eq("id", id);
  return NextResponse.json({ success: true });
}

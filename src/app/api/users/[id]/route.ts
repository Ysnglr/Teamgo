import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
  full_name: z.string().min(1).optional(),
  user_type: z.enum(["PLAYER", "STAFF", "ADMIN"]).optional(),
  team_assignments: z
    .array(
      z.object({
        team_id: z.string().uuid(),
        role_id: z.string().uuid().optional(),
      })
    )
    .optional(),
});

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
    .select("user_type")
    .eq("email", user.email!)
    .single();
  if (!dbUser || dbUser.user_type !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { team_assignments, ...data } = parsed.data;

  if (Object.keys(data).length > 0) {
    await supabase.from("User").update(data).eq("id", id);
  }

  if (team_assignments !== undefined) {
    // Clear existing assignments
    await supabase.from("TeamStaffMember").delete().eq("user_id", id);
    await supabase.from("TeamPlayerMember").delete().eq("user_id", id);

    // Get updated user_type
    const { data: targetUser } = await supabase
      .from("User")
      .select("user_type")
      .eq("id", id)
      .single();

    const userType = data.user_type ?? targetUser?.user_type;

    if (userType === "STAFF") {
      const staffRows = team_assignments
        .filter((a) => a.role_id)
        .map((a) => ({ user_id: id, team_id: a.team_id, role_id: a.role_id! }));
      if (staffRows.length > 0) {
        await supabase.from("TeamStaffMember").insert(staffRows);
      }
    } else if (userType === "PLAYER") {
      const playerRows = team_assignments.map((a) => ({ user_id: id, team_id: a.team_id }));
      if (playerRows.length > 0) {
        await supabase.from("TeamPlayerMember").insert(playerRows);
      }
    }
  }

  const { data: updatedUser } = await supabase.from("User").select("*").eq("id", id).single();
  return NextResponse.json(updatedUser);
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

  await supabase.from("User").delete().eq("id", id);
  return NextResponse.json({ success: true });
}

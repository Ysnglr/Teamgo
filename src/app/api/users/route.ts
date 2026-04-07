import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";
import { z } from "zod";

const createUserSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(1),
  user_type: z.enum(["PLAYER", "STAFF", "ADMIN"]),
  password: z.string().min(6),
  team_assignments: z
    .array(
      z.object({
        team_id: z.string().uuid(),
        role_id: z.string().uuid().optional(),
      })
    )
    .optional(),
});

export async function GET() {
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

  const { data: users } = await supabase
    .from("User")
    .select(
      "*, TeamStaffMember(*, Team(id,name), Role(id,name)), TeamPlayerMember(*, Team(id,name))"
    )
    .order("full_name", { ascending: true });

  return NextResponse.json(users ?? []);
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
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { email, full_name, user_type, password, team_assignments } = parsed.data;

  // Use service role client for admin auth operations
  const serviceSupabase = createServiceClient();
  const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: authError?.message ?? "Auth creation failed" },
      { status: 400 }
    );
  }

  // Insert into User table
  const { data: newUser, error: userError } = await supabase
    .from("User")
    .insert({ email, full_name, user_type })
    .select("id")
    .single();

  if (userError || !newUser) {
    return NextResponse.json(
      { error: userError?.message ?? "User creation failed" },
      { status: 500 }
    );
  }

  // Insert team assignments
  if (team_assignments && team_assignments.length > 0) {
    if (user_type === "STAFF") {
      const staffRows = team_assignments
        .filter((a) => a.role_id)
        .map((a) => ({ user_id: newUser.id, team_id: a.team_id, role_id: a.role_id! }));
      if (staffRows.length > 0) {
        await supabase.from("TeamStaffMember").insert(staffRows);
      }
    } else if (user_type === "PLAYER") {
      const playerRows = team_assignments.map((a) => ({
        user_id: newUser.id,
        team_id: a.team_id,
      }));
      await supabase.from("TeamPlayerMember").insert(playerRows);
    }
  }

  const { data: fullUser } = await supabase
    .from("User")
    .select("*")
    .eq("id", newUser.id)
    .single();

  return NextResponse.json(fullUser, { status: 201 });
}

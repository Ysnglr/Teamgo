import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const createUserSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(1),
  user_type: z.enum(["PLAYER", "STAFF", "ADMIN"]),
  password: z.string().min(6),
  team_assignments: z.array(z.object({
    team_id: z.string().uuid(),
    role_id: z.string().uuid().optional(),
  })).optional(),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser || dbUser.user_type !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await prisma.user.findMany({
    orderBy: { full_name: "asc" },
    include: {
      staff_teams: { include: { team: true, role: true } },
      player_teams: { include: { team: true } },
    },
  });
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser || dbUser.user_type !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { email, full_name, user_type, password, team_assignments } = parsed.data;

  // Create Supabase Auth user using service role
  const adminSupabase = await createClient();
  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message ?? "Auth creation failed" }, { status: 400 });
  }

  const newUser = await prisma.user.create({
    data: {
      email,
      full_name,
      user_type,
      staff_teams: user_type === "STAFF" && team_assignments
        ? {
            create: team_assignments
              .filter((a) => a.role_id)
              .map((a) => ({ team_id: a.team_id, role_id: a.role_id! })),
          }
        : undefined,
      player_teams: user_type === "PLAYER" && team_assignments
        ? {
            create: team_assignments.map((a) => ({ team_id: a.team_id })),
          }
        : undefined,
    },
  });

  return NextResponse.json(newUser, { status: 201 });
}

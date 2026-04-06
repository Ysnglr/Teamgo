import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
  full_name: z.string().min(1).optional(),
  user_type: z.enum(["PLAYER", "STAFF", "ADMIN"]).optional(),
  team_assignments: z.array(z.object({
    team_id: z.string().uuid(),
    role_id: z.string().uuid().optional(),
  })).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser || dbUser.user_type !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { team_assignments, ...data } = parsed.data;

  const target = await prisma.user.update({ where: { id }, data });

  if (team_assignments !== undefined) {
    await prisma.teamStaffMember.deleteMany({ where: { user_id: id } });
    await prisma.teamPlayerMember.deleteMany({ where: { user_id: id } });

    if (target.user_type === "STAFF") {
      await prisma.teamStaffMember.createMany({
        data: team_assignments
          .filter((a) => a.role_id)
          .map((a) => ({ user_id: id, team_id: a.team_id, role_id: a.role_id! })),
      });
    } else if (target.user_type === "PLAYER") {
      await prisma.teamPlayerMember.createMany({
        data: team_assignments.map((a) => ({ user_id: id, team_id: a.team_id })),
      });
    }
  }

  return NextResponse.json(target);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser || dbUser.user_type !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

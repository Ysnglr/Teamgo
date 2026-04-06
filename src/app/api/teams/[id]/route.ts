import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const teamSchema = z.object({ name: z.string().min(1) });

async function requireAdmin(email: string) {
  const dbUser = await prisma.user.findUnique({ where: { email } });
  return dbUser?.user_type === "ADMIN" ? dbUser : null;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await requireAdmin(user.email!))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = teamSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const team = await prisma.team.update({ where: { id }, data: parsed.data });
  return NextResponse.json(team);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await requireAdmin(user.email!))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.team.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

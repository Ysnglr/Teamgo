import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const eventTypeSchema = z.object({ name: z.string().min(1) });

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const types = await prisma.eventType.findMany({
    orderBy: { name: "asc" },
    include: { subtypes: { orderBy: { name: "asc" } } },
  });
  return NextResponse.json(types);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser || dbUser.user_type !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = eventTypeSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const type = await prisma.eventType.create({ data: parsed.data });
  return NextResponse.json(type, { status: 201 });
}

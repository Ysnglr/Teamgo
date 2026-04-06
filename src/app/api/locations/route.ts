import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const locationSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional().nullable(),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const locations = await prisma.location.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(locations);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser || dbUser.user_type !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = locationSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const location = await prisma.location.create({ data: parsed.data });
  return NextResponse.json(location, { status: 201 });
}

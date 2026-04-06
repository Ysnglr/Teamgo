import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getLiveEventForUser } from "@/lib/events";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const event = await getLiveEventForUser(dbUser.id);
  return NextResponse.json(event);
}

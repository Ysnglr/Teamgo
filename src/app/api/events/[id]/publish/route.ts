import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { eventSelect, sendNotificationToTeam } from "@/lib/events";
import { NextResponse } from "next/server";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser || (dbUser.user_type !== "STAFF" && dbUser.user_type !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status !== "DRAFT") {
    return NextResponse.json({ error: "Already published" }, { status: 400 });
  }

  if (dbUser.user_type === "STAFF" && existing.created_by !== dbUser.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const event = await prisma.event.update({
    where: { id },
    data: { status: "PUBLISHED" },
    select: eventSelect,
  });

  await sendNotificationToTeam(event.id, event.team_id, "new");

  return NextResponse.json(event);
}

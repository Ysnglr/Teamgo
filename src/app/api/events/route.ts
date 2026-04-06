import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { eventSelect, sendNotificationToTeam } from "@/lib/events";
import { NextResponse } from "next/server";
import { z } from "zod";

const createEventSchema = z.object({
  title: z.string().min(1),
  event_type_id: z.string().uuid(),
  event_subtype_id: z.string().uuid().optional().nullable(),
  team_id: z.string().uuid(),
  opponent: z.string().optional().nullable(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime().optional().nullable(),
  arrival_time: z.string().datetime().optional().nullable(),
  location_id: z.string().uuid(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  staff_assignments: z.array(z.object({
    user_id: z.string().uuid(),
    role_id: z.string().uuid(),
  })).optional(),
});

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const typeFilter = searchParams.get("type");
  const statusFilter = searchParams.get("status");

  let teamIds: string[];
  if (dbUser.user_type === "ADMIN") {
    const teams = await prisma.team.findMany({ select: { id: true } });
    teamIds = teams.map((t) => t.id);
  } else if (dbUser.user_type === "STAFF") {
    const staffTeams = await prisma.teamStaffMember.findMany({
      where: { user_id: dbUser.id },
      select: { team_id: true },
    });
    teamIds = staffTeams.map((t) => t.team_id);
  } else {
    const playerTeams = await prisma.teamPlayerMember.findMany({
      where: { user_id: dbUser.id },
      select: { team_id: true },
    });
    teamIds = playerTeams.map((t) => t.team_id);
  }

  const where: Record<string, unknown> = { team_id: { in: teamIds } };

  if (dbUser.user_type !== "ADMIN") {
    where.status = "PUBLISHED";
  } else if (statusFilter) {
    where.status = statusFilter;
  }

  if (typeFilter) {
    where.event_type = { name: typeFilter };
  }

  const events = await prisma.event.findMany({
    where,
    orderBy: { start_time: "asc" },
    select: eventSelect,
  });

  // Filter out expired for non-admin
  if (dbUser.user_type !== "ADMIN") {
    const now = new Date();
    return NextResponse.json(events.filter((e) => !e.end_time || e.end_time > now));
  }

  return NextResponse.json(events);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser || (dbUser.user_type !== "STAFF" && dbUser.user_type !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { staff_assignments, ...data } = parsed.data;

  const event = await prisma.event.create({
    data: {
      ...data,
      created_by: dbUser.id,
      staff_assignments: staff_assignments
        ? { create: staff_assignments }
        : undefined,
    },
    select: eventSelect,
  });

  if (event.status === "PUBLISHED") {
    await sendNotificationToTeam(event.id, event.team_id, "new");
  }

  return NextResponse.json(event, { status: 201 });
}

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { eventSelect, sendNotificationToTeam } from "@/lib/events";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  event_type_id: z.string().uuid().optional(),
  event_subtype_id: z.string().uuid().nullable().optional(),
  team_id: z.string().uuid().optional(),
  opponent: z.string().nullable().optional(),
  start_time: z.string().datetime().optional(),
  end_time: z.string().datetime().nullable().optional(),
  arrival_time: z.string().datetime().nullable().optional(),
  location_id: z.string().uuid().optional(),
  staff_assignments: z.array(z.object({
    user_id: z.string().uuid(),
    role_id: z.string().uuid(),
  })).optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await prisma.event.findUnique({ where: { id }, select: eventSelect });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(event);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

  if (dbUser.user_type === "STAFF" && existing.created_by !== dbUser.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { staff_assignments, ...data } = parsed.data;

  // Determine notification type
  let changeType: string | null = null;
  if (existing.status === "PUBLISHED") {
    if (data.start_time && data.start_time !== existing.start_time.toISOString()) changeType = "time";
    else if (data.location_id && data.location_id !== existing.location_id) changeType = "location";
    else changeType = "status";
  }

  const event = await prisma.$transaction(async (tx) => {
    if (staff_assignments !== undefined) {
      await tx.eventStaffAssignment.deleteMany({ where: { event_id: id } });
      if (staff_assignments.length > 0) {
        await tx.eventStaffAssignment.createMany({
          data: staff_assignments.map((a) => ({ ...a, event_id: id })),
        });
      }
    }
    return tx.event.update({ where: { id }, data, select: eventSelect });
  });

  if (changeType && event.status === "PUBLISHED") {
    await sendNotificationToTeam(event.id, event.team_id, changeType);
  }

  return NextResponse.json(event);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser || dbUser.user_type !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

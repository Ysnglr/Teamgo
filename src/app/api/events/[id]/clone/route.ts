import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { eventSelect } from "@/lib/events";
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

  const source = await prisma.event.findUnique({
    where: { id },
    include: { staff_assignments: true },
  });
  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { id: _id, created_at, updated_at, staff_assignments, ...rest } = source;

  const clone = await prisma.event.create({
    data: {
      ...rest,
      title: `${rest.title} (Kopya)`,
      status: "DRAFT",
      created_by: dbUser.id,
      staff_assignments: {
        create: staff_assignments.map(({ event_id: _eid, id: _aid, ...a }) => a),
      },
    },
    select: eventSelect,
  });

  return NextResponse.json(clone, { status: 201 });
}

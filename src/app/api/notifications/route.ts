import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const notifications = await prisma.notification.findMany({
    where: { user_id: dbUser.id },
    orderBy: { sent_at: "desc" },
    take: 50,
    select: {
      id: true,
      change_type: true,
      sent_at: true,
      read_at: true,
      event: {
        select: {
          id: true,
          title: true,
          team: { select: { name: true } },
        },
      },
    },
  });

  return NextResponse.json(notifications);
}

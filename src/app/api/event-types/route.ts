import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const eventTypeSchema = z.object({ name: z.string().min(1) });

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: types } = await supabase
    .from("EventType")
    .select("*, EventSubtype(*)")
    .order("name", { ascending: true });

  // Sort subtypes client-side and normalize key name to `subtypes`
  const result = (types ?? []).map(
    (t: { EventSubtype: { name: string }[]; [key: string]: unknown }) => {
      const { EventSubtype, ...rest } = t;
      return {
        ...rest,
        subtypes: (EventSubtype ?? []).sort((a, b) => a.name.localeCompare(b.name)),
      };
    }
  );

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: dbUser } = await supabase
    .from("User")
    .select("user_type")
    .eq("email", user.email!)
    .single();
  if (!dbUser || dbUser.user_type !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = eventTypeSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data: type } = await supabase.from("EventType").insert(parsed.data).select().single();
  return NextResponse.json(type, { status: 201 });
}

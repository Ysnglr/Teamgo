import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventWithRelations } from "@/types";

export const EVENT_SELECT =
  "*, EventType(id,name), EventSubtype(id,name), Team(id,name), Location(id,name,address), EventStaffAssignment(id,user_id,role_id,User(id,full_name),Role(id,name))";

async function getTeamIds(
  supabase: SupabaseClient,
  userId: string,
  userType: string
): Promise<string[]> {
  if (userType === "ADMIN") {
    const { data } = await supabase.from("Team").select("id");
    return data?.map((t: { id: string }) => t.id) ?? [];
  } else if (userType === "STAFF") {
    const { data } = await supabase
      .from("TeamStaffMember")
      .select("team_id")
      .eq("user_id", userId);
    return data?.map((t: { team_id: string }) => t.team_id) ?? [];
  } else {
    const { data } = await supabase
      .from("TeamPlayerMember")
      .select("team_id")
      .eq("user_id", userId);
    return data?.map((t: { team_id: string }) => t.team_id) ?? [];
  }
}

export async function getUpcomingEventsForUser(
  supabase: SupabaseClient,
  userId: string,
  days = 30,
  limit = 10
): Promise<EventWithRelations[]> {
  const now = new Date();
  const until = new Date(now);
  until.setDate(until.getDate() + days);

  const { data: userRow } = await supabase
    .from("User")
    .select("user_type")
    .eq("id", userId)
    .single();

  if (!userRow) return [];

  const teamIds = await getTeamIds(supabase, userId, userRow.user_type);
  if (teamIds.length === 0) return [];

  const { data } = await supabase
    .from("Event")
    .select(EVENT_SELECT)
    .in("team_id", teamIds)
    .eq("status", "PUBLISHED")
    .gte("start_time", now.toISOString())
    .lte("start_time", until.toISOString())
    .order("start_time", { ascending: true })
    .limit(limit);

  return (data as EventWithRelations[]) ?? [];
}

export async function getLiveEventForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<EventWithRelations | null> {
  const now = new Date();

  const { data: userRow } = await supabase
    .from("User")
    .select("user_type")
    .eq("id", userId)
    .single();

  if (!userRow) return null;

  const teamIds = await getTeamIds(supabase, userId, userRow.user_type);
  if (teamIds.length === 0) return null;

  const { data } = await supabase
    .from("Event")
    .select(EVENT_SELECT)
    .in("team_id", teamIds)
    .eq("status", "PUBLISHED")
    .lte("start_time", now.toISOString())
    .or(`end_time.is.null,end_time.gte.${now.toISOString()}`)
    .order("start_time", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as EventWithRelations) ?? null;
}

export async function sendNotificationToTeam(
  supabase: SupabaseClient,
  eventId: string,
  teamId: string,
  changeType: string
): Promise<void> {
  const [{ data: players }, { data: staff }] = await Promise.all([
    supabase.from("TeamPlayerMember").select("user_id").eq("team_id", teamId),
    supabase.from("TeamStaffMember").select("user_id").eq("team_id", teamId),
  ]);

  const allUserIds = [
    ...(players?.map((p: { user_id: string }) => p.user_id) ?? []),
    ...(staff?.map((s: { user_id: string }) => s.user_id) ?? []),
  ];
  const uniqueUserIds = [...new Set(allUserIds)];

  if (uniqueUserIds.length === 0) return;

  await supabase.from("Notification").insert(
    uniqueUserIds.map((user_id) => ({
      event_id: eventId,
      change_type: changeType,
      user_id,
    }))
  );
}

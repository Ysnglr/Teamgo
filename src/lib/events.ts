import { prisma } from "@/lib/prisma";

const eventSelect = {
  id: true,
  title: true,
  opponent: true,
  start_time: true,
  end_time: true,
  arrival_time: true,
  status: true,
  created_at: true,
  updated_at: true,
  created_by: true,
  event_type_id: true,
  event_subtype_id: true,
  team_id: true,
  location_id: true,
  event_type: { select: { id: true, name: true } },
  event_subtype: { select: { id: true, name: true } },
  team: { select: { id: true, name: true } },
  location: { select: { id: true, name: true, address: true } },
  creator: { select: { id: true, full_name: true } },
  staff_assignments: {
    select: {
      id: true,
      user_id: true,
      role_id: true,
      user: { select: { id: true, full_name: true } },
      role: { select: { id: true, name: true } },
    },
  },
} as const;

export { eventSelect };

export async function getUpcomingEventsForUser(userId: string, days = 30, limit = 10) {
  const now = new Date();
  const until = new Date(now);
  until.setDate(until.getDate() + days);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      user_type: true,
      player_teams: { select: { team_id: true } },
      staff_teams: { select: { team_id: true } },
    },
  });

  if (!user) return [];

  let teamIds: string[];
  if (user.user_type === "ADMIN") {
    const teams = await prisma.team.findMany({ select: { id: true } });
    teamIds = teams.map((t) => t.id);
  } else if (user.user_type === "STAFF") {
    teamIds = user.staff_teams.map((t) => t.team_id);
  } else {
    teamIds = user.player_teams.map((t) => t.team_id);
  }

  return prisma.event.findMany({
    where: {
      team_id: { in: teamIds },
      status: "PUBLISHED",
      start_time: { gte: now, lte: until },
    },
    orderBy: { start_time: "asc" },
    take: limit,
    select: eventSelect,
  });
}

export async function getLiveEventForUser(userId: string) {
  const now = new Date();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      user_type: true,
      player_teams: { select: { team_id: true } },
      staff_teams: { select: { team_id: true } },
    },
  });

  if (!user) return null;

  let teamIds: string[];
  if (user.user_type === "ADMIN") {
    const teams = await prisma.team.findMany({ select: { id: true } });
    teamIds = teams.map((t) => t.id);
  } else if (user.user_type === "STAFF") {
    teamIds = user.staff_teams.map((t) => t.team_id);
  } else {
    teamIds = user.player_teams.map((t) => t.team_id);
  }

  return prisma.event.findFirst({
    where: {
      team_id: { in: teamIds },
      status: "PUBLISHED",
      start_time: { lte: now },
      OR: [{ end_time: null }, { end_time: { gte: now } }],
    },
    orderBy: { start_time: "desc" },
    select: eventSelect,
  });
}

export async function sendNotificationToTeam(
  eventId: string,
  teamId: string,
  changeType: string
) {
  const members = await prisma.$queryRaw<{ user_id: string }[]>`
    SELECT user_id FROM "TeamPlayerMember" WHERE team_id = ${teamId}
    UNION
    SELECT user_id FROM "TeamStaffMember" WHERE team_id = ${teamId}
  `;

  if (members.length === 0) return;

  await prisma.notification.createMany({
    data: members.map((m) => ({
      event_id: eventId,
      change_type: changeType,
      user_id: m.user_id,
    })),
  });
}

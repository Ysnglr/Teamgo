export type { User, Role, Team, Event, EventType, EventSubtype, Location, Notification, EventStaffAssignment, PlayerProfile, EventStatus, UserType } from "@/generated/prisma";

export type EventWithRelations = {
  id: string;
  title: string;
  opponent: string | null;
  start_time: Date;
  end_time: Date | null;
  arrival_time: Date | null;
  status: import("@/generated/prisma").EventStatus;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  event_type_id: string;
  event_subtype_id: string | null;
  team_id: string;
  location_id: string;
  event_type: { id: string; name: string };
  event_subtype: { id: string; name: string } | null;
  team: { id: string; name: string };
  location: { id: string; name: string; address: string | null };
  creator: { id: string; full_name: string };
  staff_assignments: {
    id: string;
    user_id: string;
    role_id: string;
    user: { id: string; full_name: string };
    role: { id: string; name: string };
  }[];
};

export type NotificationWithEvent = {
  id: string;
  change_type: string;
  sent_at: Date;
  read_at: Date | null;
  event: {
    id: string;
    title: string;
    team: { name: string };
  };
};

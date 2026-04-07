export type UserType = "PLAYER" | "STAFF" | "ADMIN";
export type EventStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type User = {
  id: string;
  email: string;
  full_name: string;
  user_type: UserType;
  avatar_url: string | null;
  created_at: string;
};

export type Role = {
  id: string;
  name: string;
  can_create_event: boolean;
};

export type Team = {
  id: string;
  name: string;
  created_at: string;
};

export type EventType = {
  id: string;
  name: string;
};

export type EventSubtype = {
  id: string;
  name: string;
  event_type_id: string;
};

export type Location = {
  id: string;
  name: string;
  address: string | null;
};

export type Notification = {
  id: string;
  user_id: string;
  event_id: string;
  change_type: string;
  sent_at: string;
  read_at: string | null;
};

export type EventStaffAssignment = {
  id: string;
  event_id: string;
  user_id: string;
  role_id: string;
};

export type PlayerProfile = {
  id: string;
  user_id: string;
  position: string | null;
  jersey_number: number | null;
};

export type EventWithRelations = {
  id: string;
  title: string;
  opponent: string | null;
  start_time: string;
  end_time: string | null;
  arrival_time: string | null;
  status: EventStatus;
  created_at: string;
  updated_at: string;
  created_by: string;
  event_type_id: string;
  event_subtype_id: string | null;
  team_id: string;
  location_id: string;
  EventType: { id: string; name: string };
  EventSubtype: { id: string; name: string } | null;
  Team: { id: string; name: string };
  Location: { id: string; name: string; address: string | null };
  creator: { id: string; full_name: string } | null;
  EventStaffAssignment: {
    id: string;
    user_id: string;
    role_id: string;
    User: { id: string; full_name: string } | null;
    Role: { id: string; name: string } | null;
  }[];
};

export type NotificationWithEvent = {
  id: string;
  change_type: string;
  sent_at: string;
  read_at: string | null;
  Event: {
    id: string;
    title: string;
    Team: { name: string } | null;
  } | null;
};

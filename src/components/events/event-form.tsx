"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import type { EventWithRelations } from "@/types";

type EventType = { id: string; name: string; subtypes: { id: string; name: string }[] };
type Team = { id: string; name: string };
type Location = { id: string; name: string };
type Role = { id: string; name: string };
type StaffUser = { id: string; full_name: string; staff_teams: { role: Role; team: { id: string } }[] };

type EventFormProps = {
  event?: EventWithRelations;
  onSuccess?: () => void;
};

export function EventForm({ event, onSuccess }: EventFormProps) {
  const router = useRouter();
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: event?.title ?? "",
    event_type_id: event?.event_type_id ?? "",
    event_subtype_id: event?.event_subtype_id ?? "",
    team_id: event?.team_id ?? "",
    opponent: event?.opponent ?? "",
    start_time: event?.start_time ? new Date(event.start_time).toISOString().slice(0, 16) : "",
    end_time: event?.end_time ? new Date(event.end_time).toISOString().slice(0, 16) : "",
    arrival_time: event?.arrival_time ? new Date(event.arrival_time).toISOString().slice(0, 16) : "",
    location_id: event?.location_id ?? "",
  });

  const [staffAssignments, setStaffAssignments] = useState<{ user_id: string; role_id: string; user_name: string; role_name: string }[]>(
    event?.staff_assignments.map((a) => ({
      user_id: a.user_id,
      role_id: a.role_id,
      user_name: a.user.full_name,
      role_name: a.role.name,
    })) ?? []
  );
  const [newStaff, setNewStaff] = useState({ user_id: "", role_id: "" });

  useEffect(() => {
    async function load() {
      const [typesRes, teamsRes, locsRes, usersRes, rolesRes] = await Promise.all([
        fetch("/api/event-types"),
        fetch("/api/teams"),
        fetch("/api/locations"),
        fetch("/api/users"),
        fetch("/api/roles"),
      ]);
      if (typesRes.ok) setEventTypes(await typesRes.json());
      if (teamsRes.ok) setTeams(await teamsRes.json());
      if (locsRes.ok) setLocations(await locsRes.json());
      if (usersRes.ok) {
        const allUsers = await usersRes.json();
        setStaffUsers(allUsers.filter((u: { user_type: string }) => u.user_type === "STAFF"));
      }
      if (rolesRes.ok) setRoles(await rolesRes.json());
      setLoading(false);
    }
    load();
  }, []);

  const selectedType = eventTypes.find((t) => t.id === form.event_type_id);
  const isMac = selectedType?.name === "Maç";

  // Top 3 frequent staff (simplified: first 3 not already added)
  const frequentStaff = staffUsers
    .filter((u) => !staffAssignments.find((a) => a.user_id === u.id))
    .slice(0, 3);

  function addStaff() {
    if (!newStaff.user_id || !newStaff.role_id) return;
    const user = staffUsers.find((u) => u.id === newStaff.user_id);
    const role = roles.find((r) => r.id === newStaff.role_id);
    if (!user || !role) return;
    setStaffAssignments([...staffAssignments, {
      user_id: user.id,
      role_id: role.id,
      user_name: user.full_name,
      role_name: role.name,
    }]);
    setNewStaff({ user_id: "", role_id: "" });
  }

  function addFrequentStaff(user: StaffUser) {
    const defaultRole = user.staff_teams[0]?.role;
    if (!defaultRole) return;
    if (staffAssignments.find((a) => a.user_id === user.id)) return;
    setStaffAssignments([...staffAssignments, {
      user_id: user.id,
      role_id: defaultRole.id,
      user_name: user.full_name,
      role_name: defaultRole.name,
    }]);
  }

  function removeStaff(userId: string) {
    setStaffAssignments(staffAssignments.filter((a) => a.user_id !== userId));
  }

  async function handleSubmit(status: "DRAFT" | "PUBLISHED") {
    setSaving(true);
    try {
      const payload = {
        ...form,
        event_subtype_id: form.event_subtype_id || null,
        opponent: isMac ? form.opponent || null : null,
        end_time: form.end_time || null,
        arrival_time: form.arrival_time || null,
        status,
        staff_assignments: staffAssignments.map((a) => ({
          user_id: a.user_id,
          role_id: a.role_id,
        })),
      };

      const url = event ? `/api/events/${event.id}` : "/api/events";
      const method = event ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (status === "PUBLISHED" && event) {
          await fetch(`/api/events/${event.id}/publish`, { method: "POST" });
        }
        onSuccess?.();
        router.push("/staff");
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-center py-10 text-gray-400 text-sm">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Basic info */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">Event Bilgileri</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Event Tipi</Label>
              <Select value={form.event_type_id} onValueChange={(v) => setForm({ ...form, event_type_id: v, event_subtype_id: "" })}>
                <SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger>
                <SelectContent>
                  {eventTypes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {selectedType && selectedType.subtypes.length > 0 && (
              <div className="space-y-1.5">
                <Label>Alt Tip</Label>
                <Select value={form.event_subtype_id} onValueChange={(v) => setForm({ ...form, event_subtype_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Seç (opsiyonel)" /></SelectTrigger>
                  <SelectContent>
                    {selectedType.subtypes.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Başlık</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Event başlığı" required />
          </div>

          <div className="space-y-1.5">
            <Label>Takım</Label>
            <Select value={form.team_id} onValueChange={(v) => setForm({ ...form, team_id: v })}>
              <SelectTrigger><SelectValue placeholder="Takım seç" /></SelectTrigger>
              <SelectContent>
                {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isMac && (
            <div className="space-y-1.5">
              <Label>Rakip Takım</Label>
              <Input value={form.opponent} onChange={(e) => setForm({ ...form, opponent: e.target.value })} placeholder="Rakip takım adı" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Times */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">Zaman</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Toplanma Saati</Label>
              <Input type="datetime-local" value={form.arrival_time} onChange={(e) => setForm({ ...form, arrival_time: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Başlangıç Saati *</Label>
              <Input type="datetime-local" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Bitiş Saati</Label>
              <Input type="datetime-local" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">Lokasyon</h3>
          <Select value={form.location_id} onValueChange={(v) => setForm({ ...form, location_id: v })}>
            <SelectTrigger><SelectValue placeholder="Mekan seç" /></SelectTrigger>
            <SelectContent>
              {locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Staff */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">Staff Ataması</h3>

          {/* Frequent chips */}
          {frequentStaff.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {frequentStaff.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => addFrequentStaff(u)}
                  className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm hover:bg-orange-50 hover:text-orange-700 transition-colors"
                >
                  + {u.full_name}
                </button>
              ))}
            </div>
          )}

          {/* Added staff */}
          {staffAssignments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {staffAssignments.map((a) => (
                <div key={a.user_id} className="flex items-center gap-1 bg-orange-100 text-orange-800 rounded-full px-3 py-1 text-sm">
                  <span>{a.role_name}: {a.user_name}</span>
                  <button type="button" onClick={() => removeStaff(a.user_id)} className="ml-1 hover:text-red-600">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add staff */}
          <div className="flex gap-2">
            <Select value={newStaff.user_id} onValueChange={(v) => setNewStaff({ ...newStaff, user_id: v })}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Staff seç" /></SelectTrigger>
              <SelectContent>
                {staffUsers
                  .filter((u) => !staffAssignments.find((a) => a.user_id === u.id))
                  .map((u) => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={newStaff.role_id} onValueChange={(v) => setNewStaff({ ...newStaff, role_id: v })}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Rol" /></SelectTrigger>
              <SelectContent>
                {roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button type="button" size="sm" onClick={addStaff} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => handleSubmit("DRAFT")}
          disabled={saving || !form.title || !form.event_type_id || !form.team_id || !form.start_time || !form.location_id}
        >
          Taslak Kaydet
        </Button>
        <Button
          onClick={() => handleSubmit("PUBLISHED")}
          disabled={saving || !form.title || !form.event_type_id || !form.team_id || !form.start_time || !form.location_id}
        >
          {saving ? "Kaydediliyor..." : "Yayınla"}
        </Button>
      </div>
    </div>
  );
}

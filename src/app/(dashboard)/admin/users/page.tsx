"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";

type Team = { id: string; name: string };
type Role = { id: string; name: string };
type UserTeam = { team: Team; role?: Role };
type User = {
  id: string;
  email: string;
  full_name: string;
  user_type: "PLAYER" | "STAFF" | "ADMIN";
  staff_teams: { team: Team; role: Role }[];
  player_teams: { team: Team }[];
};

const userTypeBadge = {
  ADMIN: <Badge variant="default">Admin</Badge>,
  STAFF: <Badge variant="warning">Staff</Badge>,
  PLAYER: <Badge variant="secondary">Oyuncu</Badge>,
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    email: "",
    full_name: "",
    user_type: "PLAYER" as "PLAYER" | "STAFF" | "ADMIN",
    password: "",
    team_id: "",
    role_id: "",
  });

  async function load() {
    setLoading(true);
    const [usersRes, teamsRes, rolesRes] = await Promise.all([
      fetch("/api/users"),
      fetch("/api/teams"),
      fetch("/api/roles"),
    ]);
    if (usersRes.ok) setUsers(await usersRes.json());
    if (teamsRes.ok) setTeams(await teamsRes.json());
    if (rolesRes.ok) setRoles(await rolesRes.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditUser(null);
    setForm({ email: "", full_name: "", user_type: "PLAYER", password: "", team_id: "", role_id: "" });
    setDialogOpen(true);
  }

  function openEdit(user: User) {
    setEditUser(user);
    const team = user.staff_teams[0]?.team ?? user.player_teams[0]?.team;
    const role = user.staff_teams[0]?.role;
    setForm({
      email: user.email,
      full_name: user.full_name,
      user_type: user.user_type,
      password: "",
      team_id: team?.id ?? "",
      role_id: role?.id ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const assignments = form.team_id
        ? [{ team_id: form.team_id, role_id: form.role_id || undefined }]
        : [];

      if (editUser) {
        await fetch(`/api/users/${editUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ full_name: form.full_name, user_type: form.user_type, team_assignments: assignments }),
        });
      } else {
        await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, team_assignments: assignments }),
        });
      }
      setDialogOpen(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser(id: string) {
    if (!confirm("Bu kullanıcıyı silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kullanıcılar</h1>
          <p className="text-gray-500 text-sm mt-1">Oyuncu ve staff üyelerini yönet</p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Kullanıcı Ekle
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Yükleniyor...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Kullanıcı bulunamadı</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Ad Soyad</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">E-posta</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Tip</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Takım(lar)</th>
                <th className="px-4 py-3 text-right text-gray-500 font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => {
                const teamNames = u.user_type === "STAFF"
                  ? u.staff_teams.map((t) => `${t.team.name} (${t.role.name})`).join(", ")
                  : u.player_teams.map((t) => t.team.name).join(", ");
                return (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.full_name}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">{userTypeBadge[u.user_type]}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{teamNames || "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(u)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => deleteUser(u.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editUser ? "Kullanıcı Düzenle" : "Yeni Kullanıcı"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Ad Soyad</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            </div>
            {!editUser && (
              <>
                <div className="space-y-1.5">
                  <Label>E-posta</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Şifre</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label>Kullanıcı Tipi</Label>
              <Select value={form.user_type} onValueChange={(v) => setForm({ ...form, user_type: v as "PLAYER" | "STAFF" | "ADMIN" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLAYER">Oyuncu</SelectItem>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
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
            {form.user_type === "STAFF" && (
              <div className="space-y-1.5">
                <Label>Rol</Label>
                <Select value={form.role_id} onValueChange={(v) => setForm({ ...form, role_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Rol seç" /></SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
              <Button type="submit" disabled={saving}>{saving ? "Kaydediliyor..." : "Kaydet"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

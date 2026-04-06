"use client";

import { useState, useEffect } from "react";
import { CrudTable } from "@/components/admin/crud-table";

type Team = { id: string; name: string; _count: { player_members: number; staff_members: number } };

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/teams");
    if (res.ok) setTeams(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Takımlar</h1>
        <p className="text-gray-500 text-sm mt-1">Altyapı takımlarını yönet</p>
      </div>
      <CrudTable
        title="Takımlar"
        rows={teams}
        columns={[
          { key: "name", label: "Takım Adı" },
          { key: "_count", label: "Oyuncu", render: (r) => (r._count as { player_members: number }).player_members },
          { key: "_count2", label: "Staff", render: (r) => (r._count as { staff_members: number }).staff_members },
        ]}
        fields={[{ key: "name", label: "Takım Adı", required: true }]}
        loading={loading}
        onCreate={async (data) => {
          await fetch("/api/teams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
          load();
        }}
        onUpdate={async (id, data) => {
          await fetch(`/api/teams/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
          load();
        }}
        onDelete={async (id) => {
          if (!confirm("Bu takımı silmek istediğinize emin misiniz?")) return;
          await fetch(`/api/teams/${id}`, { method: "DELETE" });
          load();
        }}
      />
    </div>
  );
}

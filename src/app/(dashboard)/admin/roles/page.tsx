"use client";

import { useState, useEffect } from "react";
import { CrudTable } from "@/components/admin/crud-table";

type Role = { id: string; name: string; can_create_event: boolean };

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/roles");
    if (res.ok) setRoles(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Roller</h1>
        <p className="text-gray-500 text-sm mt-1">Staff rollerini ve yetkilerini yönet</p>
      </div>
      <CrudTable
        title="Roller"
        rows={roles}
        columns={[
          { key: "name", label: "Rol Adı" },
          {
            key: "can_create_event",
            label: "Event Oluşturabilir",
            render: (r) => (
              <span className={r.can_create_event ? "text-green-600 font-medium" : "text-gray-400"}>
                {r.can_create_event ? "Evet" : "Hayır"}
              </span>
            ),
          },
        ]}
        fields={[
          { key: "name", label: "Rol Adı", required: true },
          { key: "can_create_event", label: "Event Oluşturabilir", type: "checkbox" },
        ]}
        loading={loading}
        onCreate={async (data) => {
          await fetch("/api/roles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
          load();
        }}
        onUpdate={async (id, data) => {
          await fetch(`/api/roles/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
          load();
        }}
        onDelete={async (id) => {
          if (!confirm("Bu rolü silmek istediğinize emin misiniz?")) return;
          await fetch(`/api/roles/${id}`, { method: "DELETE" });
          load();
        }}
      />
    </div>
  );
}

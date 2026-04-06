"use client";

import { useState, useEffect } from "react";
import { CrudTable } from "@/components/admin/crud-table";

type Location = { id: string; name: string; address: string | null };

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/locations");
    if (res.ok) setLocations(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lokasyonlar</h1>
        <p className="text-gray-500 text-sm mt-1">Mekan listesini yönet</p>
      </div>
      <CrudTable
        title="Lokasyonlar"
        rows={locations}
        columns={[
          { key: "name", label: "Mekan Adı" },
          { key: "address", label: "Adres", render: (r) => <span>{(r.address as string | null) ?? "-"}</span> },
        ]}
        fields={[
          { key: "name", label: "Mekan Adı", required: true },
          { key: "address", label: "Adres" },
        ]}
        loading={loading}
        onCreate={async (data) => {
          await fetch("/api/locations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
          load();
        }}
        onUpdate={async (id, data) => {
          await fetch(`/api/locations/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
          load();
        }}
        onDelete={async (id) => {
          if (!confirm("Bu lokasyonu silmek istediğinize emin misiniz?")) return;
          await fetch(`/api/locations/${id}`, { method: "DELETE" });
          load();
        }}
      />
    </div>
  );
}

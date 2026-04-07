"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime, getEventState } from "@/lib/utils";
import type { EventWithRelations } from "@/types";
import { Copy, Eye, Trash2 } from "lucide-react";
import Link from "next/link";

const statusBadge = {
  DRAFT: <Badge variant="outline">Taslak</Badge>,
  PUBLISHED: <Badge variant="success">Yayında</Badge>,
  ARCHIVED: <Badge variant="secondary">Arşiv</Badge>,
};

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/events");
    if (res.ok) setEvents(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    if (!confirm("Bu eventi silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    load();
  }

  async function handleClone(id: string) {
    await fetch(`/api/events/${id}/clone`, { method: "POST" });
    load();
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Eventler</h1>
        <p className="text-gray-500 text-sm mt-1">Tüm eventleri görüntüle ve yönet</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Yükleniyor...</div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Event bulunamadı</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Event</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Takım</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Tarih</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Lokasyon</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Durum</th>
                <th className="px-4 py-3 text-right text-gray-500 font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {events.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{e.title}</div>
                    <div className="text-xs text-gray-400">{e.EventType?.name}{e.EventSubtype ? ` · ${e.EventSubtype.name}` : ""}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{e.Team?.name}</td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatDateTime(e.start_time)}</td>
                  <td className="px-4 py-3 text-gray-700">{e.Location?.name}</td>
                  <td className="px-4 py-3">{statusBadge[e.status]}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleClone(e.id)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700" title="Klonla">
                        <Copy className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(e.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600" title="Sil">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

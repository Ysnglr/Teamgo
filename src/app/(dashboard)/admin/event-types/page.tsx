"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";

type EventSubtype = { id: string; name: string };
type EventType = { id: string; name: string; subtypes: EventSubtype[] };

export default function EventTypesPage() {
  const [types, setTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTypeName, setNewTypeName] = useState("");
  const [newSubtype, setNewSubtype] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  async function load() {
    setLoading(true);
    const res = await fetch("/api/event-types");
    if (res.ok) setTypes(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createType() {
    if (!newTypeName.trim()) return;
    await fetch("/api/event-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTypeName }),
    });
    setNewTypeName("");
    load();
  }

  async function deleteType(id: string) {
    if (!confirm("Bu tipi silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/event-types/${id}`, { method: "DELETE" });
    load();
  }

  async function createSubtype(typeId: string) {
    const name = newSubtype[typeId];
    if (!name?.trim()) return;
    await fetch(`/api/event-types/${typeId}/subtypes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setNewSubtype({ ...newSubtype, [typeId]: "" });
    load();
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Event Tipleri</h1>
        <p className="text-gray-500 text-sm mt-1">Maç, Antrenman, Etkinlik ve alt tiplerini yönet</p>
      </div>

      {/* Add new type */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Yeni event tipi (örn: Maç)"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createType()}
            />
            <Button onClick={createType}>
              <Plus className="h-4 w-4 mr-1" />
              Ekle
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Types list */}
      {loading ? (
        <Card><CardContent className="py-10 text-center text-gray-400 text-sm">Yükleniyor...</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {types.map((type) => (
            <Card key={type.id}>
              <CardContent className="p-0">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpanded({ ...expanded, [type.id]: !expanded[type.id] })}
                >
                  <div className="flex items-center gap-2">
                    {expanded[type.id] ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                    <span className="font-medium text-gray-900">{type.name}</span>
                    <span className="text-xs text-gray-400">({type.subtypes.length} alt tip)</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteType(type.id); }}
                    className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {expanded[type.id] && (
                  <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
                    {type.subtypes.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between pl-6 py-1">
                        <span className="text-sm text-gray-700">{sub.name}</span>
                      </div>
                    ))}
                    <div className="flex gap-2 pl-6">
                      <Input
                        placeholder="Alt tip ekle"
                        value={newSubtype[type.id] ?? ""}
                        onChange={(e) => setNewSubtype({ ...newSubtype, [type.id]: e.target.value })}
                        onKeyDown={(e) => e.key === "Enter" && createSubtype(type.id)}
                        className="text-sm"
                      />
                      <Button size="sm" onClick={() => createSubtype(type.id)}>Ekle</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

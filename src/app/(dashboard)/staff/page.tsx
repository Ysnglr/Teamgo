"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EventCard } from "@/components/events/event-card";
import type { EventWithRelations } from "@/types";
import Link from "next/link";
import { Plus, Copy, Pencil, SendHorizonal } from "lucide-react";

export default function StaffPage() {
  const [events, setEvents] = useState<EventWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/events");
    if (res.ok) setEvents(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function publish(id: string) {
    setPublishing(id);
    await fetch(`/api/events/${id}/publish`, { method: "POST" });
    setPublishing(null);
    load();
  }

  async function clone(id: string) {
    await fetch(`/api/events/${id}/clone`, { method: "POST" });
    load();
  }

  function filterByType(type: string) {
    if (type === "all") return events;
    return events.filter((e) => e.EventType?.name === type);
  }

  function EventList({ type }: { type: string }) {
    const filtered = filterByType(type);
    if (filtered.length === 0) {
      return <div className="text-center py-10 text-gray-400 text-sm">Event bulunamadı</div>;
    }
    return (
      <div className="space-y-3">
        {filtered.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            actions={
              <div className="flex flex-col gap-1">
                {event.status === "DRAFT" && (
                  <Button
                    size="sm"
                    onClick={() => publish(event.id)}
                    disabled={publishing === event.id}
                    className="text-xs"
                  >
                    <SendHorizonal className="h-3 w-3 mr-1" />
                    Yayınla
                  </Button>
                )}
                <div className="flex gap-1">
                  <Link href={`/staff/events/${event.id}/edit`}>
                    <Button size="icon" variant="ghost" className="h-7 w-7">
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </Link>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => clone(event.id)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                {event.status === "DRAFT" && (
                  <Badge variant="outline" className="text-xs justify-center">Taslak</Badge>
                )}
              </div>
            }
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Eventler</h1>
          <p className="text-gray-500 text-sm mt-1">Takımlarınızın etkinlikleri</p>
        </div>
        <Link href="/staff/create-event">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Yeni Event
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Tüm Eventler</TabsTrigger>
          <TabsTrigger value="mac">Maçlar</TabsTrigger>
          <TabsTrigger value="antrenman">Antrenmanlar</TabsTrigger>
          <TabsTrigger value="diger">Diğer</TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="text-center py-10 text-gray-400 text-sm mt-4">Yükleniyor...</div>
        ) : (
          <>
            <TabsContent value="all"><EventList type="all" /></TabsContent>
            <TabsContent value="mac"><EventList type="Maç" /></TabsContent>
            <TabsContent value="antrenman"><EventList type="Antrenman" /></TabsContent>
            <TabsContent value="diger">
              <div className="space-y-3 mt-2">
                {events
                  .filter((e) => e.EventType?.name !== "Maç" && e.EventType?.name !== "Antrenman")
                  .map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

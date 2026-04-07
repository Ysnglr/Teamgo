"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EventCard } from "@/components/events/event-card";
import type { EventWithRelations } from "@/types";
import { formatDateTime, formatTime } from "@/lib/utils";
import { Clock, MapPin } from "lucide-react";

function LiveWidget({ event }: { event: EventWithRelations | null }) {
  if (!event) return null;
  const isLive = event.end_time
    ? new Date() >= new Date(event.start_time) && new Date() <= new Date(event.end_time)
    : new Date() >= new Date(event.start_time);

  return (
    <Card className={`border-2 ${isLive ? "border-red-300 bg-red-50/30" : "border-orange-200 bg-orange-50/30"}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {isLive ? (
            <Badge variant="live">CANLI</Badge>
          ) : (
            <Badge variant="warning">Sıradaki</Badge>
          )}
          <span className="text-sm font-medium text-gray-600">{event.Team?.name}</span>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">
          {event.title}
          {event.opponent && <span className="text-gray-500 font-normal"> vs {event.opponent}</span>}
        </h2>
        <div className="flex flex-col gap-1 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span>{formatDateTime(event.start_time)}</span>
            {event.arrival_time && (
              <span className="text-gray-400">· Toplanma: {formatTime(event.arrival_time)}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span>{event.Location?.name}</span>
            {event.Location?.address && <span className="text-gray-400">· {event.Location.address}</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PlayerPage() {
  const [liveEvent, setLiveEvent] = useState<EventWithRelations | null>(null);
  const [events, setEvents] = useState<EventWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [liveRes, upcomingRes] = await Promise.all([
        fetch("/api/events/live"),
        fetch("/api/events/upcoming?limit=10&days=30"),
      ]);
      if (liveRes.ok) setLiveEvent(await liveRes.json());
      if (upcomingRes.ok) setEvents(await upcomingRes.json());
      setLoading(false);
    }
    load();

    // Refresh every 60 seconds for live state updates
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  function filterByType(type: string) {
    if (type === "all") return events;
    return events.filter((e) => e.EventType?.name === type);
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-400 text-sm">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Yaklaşan etkinlikleriniz</p>
      </div>

      {/* Live / next up widget */}
      <LiveWidget event={liveEvent} />

      {/* Upcoming events tabbed */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">Yaklaşan Eventler</h2>
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">Tümü</TabsTrigger>
            <TabsTrigger value="mac">Maçlar</TabsTrigger>
            <TabsTrigger value="antrenman">Antrenmanlar</TabsTrigger>
            <TabsTrigger value="diger">Diğer</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <EventList events={filterByType("all")} />
          </TabsContent>
          <TabsContent value="mac">
            <EventList events={filterByType("Maç")} />
          </TabsContent>
          <TabsContent value="antrenman">
            <EventList events={filterByType("Antrenman")} />
          </TabsContent>
          <TabsContent value="diger">
            <EventList
              events={events.filter(
                (e) => e.EventType?.name !== "Maç" && e.EventType?.name !== "Antrenman"
              )}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function EventList({ events }: { events: EventWithRelations[] }) {
  if (events.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400 text-sm mt-2">
        Yaklaşan event yok
      </div>
    );
  }
  return (
    <div className="space-y-3 mt-2">
      {events.map((event) => (
        <EventCard key={event.id} event={event} compact />
      ))}
    </div>
  );
}

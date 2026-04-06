import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Calendar, MapPin } from "lucide-react";
import { formatDateTime, getEventState } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default async function AdminPage() {
  const [teams, users, locations, activeEvents] = await Promise.all([
    prisma.team.count(),
    prisma.user.count(),
    prisma.location.count(),
    prisma.event.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { end_time: null, start_time: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } },
          { end_time: { gte: new Date() } },
        ],
      },
      orderBy: { start_time: "asc" },
      include: {
        team: true,
        location: true,
        event_type: true,
        staff_assignments: {
          include: { user: { select: { full_name: true } }, role: { select: { name: true } } },
        },
      },
    }),
  ]);

  const stats = [
    { label: "Takımlar", value: teams, icon: Trophy, color: "text-orange-500" },
    { label: "Kullanıcılar", value: users, icon: Users, color: "text-blue-500" },
    { label: "Aktif Eventler", value: activeEvents.length, icon: Calendar, color: "text-green-500" },
    { label: "Lokasyonlar", value: locations, icon: MapPin, color: "text-purple-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Genel Bakış</h1>
        <p className="text-gray-500 text-sm mt-1">Operasyon merkezi</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color} opacity-80`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Active events operation center */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Aktif & Yaklaşan Eventler</h2>
        {activeEvents.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-gray-400 text-sm">
              Aktif event yok
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {activeEvents.map((event) => {
              const state = getEventState(event);
              const stateBadge = {
                live: <Badge variant="live">CANLI</Badge>,
                approaching: <Badge variant="warning">Toplanma</Badge>,
                upcoming: <Badge variant="secondary">Yaklaşan</Badge>,
                expired: <Badge variant="outline">Bitti</Badge>,
              }[state];

              return (
                <Card key={event.id} className={state === "live" ? "border-red-200 bg-red-50/30" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {stateBadge}
                          <span className="font-semibold text-gray-900">{event.team.name}</span>
                          <span className="text-gray-400">·</span>
                          <span className="text-orange-600 font-medium">{event.event_type.name}</span>
                          <span className="text-gray-400">·</span>
                          <span className="text-gray-700">{event.title}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500">
                          <span>{formatDateTime(event.start_time)}</span>
                          <span>·</span>
                          <span>{event.location.name}</span>
                          {event.staff_assignments.length > 0 && (
                            <>
                              <span>·</span>
                              <span>
                                {event.staff_assignments
                                  .map((a) => `${a.role.name}: ${a.user.full_name}`)
                                  .join(", ")}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

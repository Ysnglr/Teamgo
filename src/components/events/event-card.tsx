import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatTime, getEventState } from "@/lib/utils";
import { MapPin, Clock, Users } from "lucide-react";
import type { EventWithRelations } from "@/types";

type EventCardProps = {
  event: EventWithRelations;
  actions?: React.ReactNode;
  compact?: boolean;
};

const typeColor: Record<string, string> = {
  "Maç": "bg-orange-50 border-orange-200",
  "Antrenman": "bg-blue-50 border-blue-200",
  "Etkinlik": "bg-purple-50 border-purple-200",
};

const typeTextColor: Record<string, string> = {
  "Maç": "text-orange-600",
  "Antrenman": "text-blue-600",
  "Etkinlik": "text-purple-600",
};

export function EventCard({ event, actions, compact = false }: EventCardProps) {
  const state = getEventState(event);
  const cardClass = typeColor[event.event_type.name] ?? "bg-gray-50 border-gray-200";
  const textClass = typeTextColor[event.event_type.name] ?? "text-gray-600";

  return (
    <Card className={`border ${cardClass}`}>
      <CardContent className={compact ? "p-3" : "p-4"}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Type + subtype + team */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-xs font-semibold ${textClass}`}>
                {event.event_type.name}
                {event.event_subtype ? ` · ${event.event_subtype.name}` : ""}
              </span>
              {state === "live" && <Badge variant="live">CANLI</Badge>}
              {state === "approaching" && <Badge variant="warning">Toplanma Zamanı</Badge>}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1.5">
              {event.title}
              {event.opponent && (
                <span className="text-gray-500 font-normal"> vs {event.opponent}</span>
              )}
            </h3>

            {/* Meta */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Clock className="h-3 w-3 flex-shrink-0" />
                <span>{formatDateTime(event.start_time)}</span>
                {event.arrival_time && (
                  <span className="text-gray-400">· Toplanma: {formatTime(event.arrival_time)}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span>{event.location.name}</span>
              </div>
              {!compact && event.staff_assignments.length > 0 && (
                <div className="flex items-start gap-1.5 text-xs text-gray-500">
                  <Users className="h-3 w-3 flex-shrink-0 mt-0.5" />
                  <span>
                    {event.staff_assignments.map((a) => `${a.role.name}: ${a.user.full_name}`).join(", ")}
                  </span>
                </div>
              )}
            </div>
          </div>
          {actions && <div className="flex-shrink-0">{actions}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

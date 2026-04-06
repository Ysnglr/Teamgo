import { prisma } from "@/lib/prisma";
import { eventSelect } from "@/lib/events";
import { EventForm } from "@/components/events/event-form";
import { notFound } from "next/navigation";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id }, select: eventSelect });

  if (!event) notFound();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Event Düzenle</h1>
        <p className="text-gray-500 text-sm mt-1">{event.title}</p>
      </div>
      <EventForm event={event as Parameters<typeof EventForm>[0]["event"]} />
    </div>
  );
}

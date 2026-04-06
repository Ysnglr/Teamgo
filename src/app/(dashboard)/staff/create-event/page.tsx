import { EventForm } from "@/components/events/event-form";

export default function CreateEventPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Yeni Event</h1>
        <p className="text-gray-500 text-sm mt-1">Yeni bir etkinlik oluştur</p>
      </div>
      <EventForm />
    </div>
  );
}

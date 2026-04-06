"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/utils";
import type { NotificationWithEvent } from "@/types";

export function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationWithEvent[]>([]);
  const [unread, setUnread] = useState(0);

  const fetchNotifications = useCallback(async () => {
    const res = await fetch("/api/notifications");
    if (res.ok) {
      const data: NotificationWithEvent[] = await res.json();
      setNotifications(data);
      setUnread(data.filter((n) => !n.read_at).length);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const supabase = createClient();
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "Notification", filter: `user_id=eq.${userId}` },
        () => fetchNotifications()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchNotifications]);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    fetchNotifications();
  }

  const changeTypeLabel: Record<string, string> = {
    new: "Yeni event yayınlandı",
    time: "Saat güncellendi",
    location: "Lokasyon değişti",
    cancel: "Event iptal edildi",
    status: "Durum değişti",
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-medium">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-lg z-40 max-h-96 overflow-y-auto">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">Bildirimler</h3>
            </div>
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">
                Bildirim yok
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.read_at && markRead(n.id)}
                    className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !n.read_at ? "bg-orange-50" : ""
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-900">
                      {n.event.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {changeTypeLabel[n.change_type] ?? n.change_type} · {n.event.team.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDateTime(n.sent_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

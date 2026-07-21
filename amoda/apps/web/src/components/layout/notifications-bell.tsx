"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { listNotifications, markNotificationRead } from "@/lib/api/notifications";
import { useAuthStore } from "@/store/auth-store";
import { formatDate } from "@/lib/utils";

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: listNotifications,
    enabled: Boolean(user),
    refetchInterval: 60_000,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  if (!user) return null;

  const unreadCount = data?.filter((n) => !n.readAt).length ?? 0;

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" aria-label="Notifications" onClick={() => setOpen((v) => !v)}>
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-border bg-card shadow-lg">
          <div className="max-h-96 overflow-y-auto">
            {!data || data.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No notifications yet.</p>
            ) : (
              data.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => !notification.readAt && markReadMutation.mutate(notification.id)}
                  className={`block w-full border-b border-border p-3 text-left text-sm last:border-0 hover:bg-muted ${
                    !notification.readAt ? "bg-muted/50" : ""
                  }`}
                >
                  <p className="font-medium">{notification.title}</p>
                  <p className="text-xs text-muted-foreground">{notification.body}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{formatDate(notification.createdAt)}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

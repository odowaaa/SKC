import { apiClient } from "@/lib/api-client";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  channel: string;
  status: string;
  readAt?: string | null;
  createdAt: string;
}

export async function listNotifications() {
  const { data } = await apiClient.get("/notifications");
  return data.data as AppNotification[];
}

export async function markNotificationRead(id: string) {
  const { data } = await apiClient.patch(`/notifications/${id}/read`);
  return data.data;
}

import { http } from "./http.js";
import type { NotificationDTO } from "@vendor-management/shared";

export async function listNotifications(limit = 30): Promise<NotificationDTO[]> {
  const { data } = await http.get(`/api/notifications?limit=${limit}`);
  return data;
}

export async function getUnreadCount(): Promise<{ count: number }> {
  const { data } = await http.get("/api/notifications/unread-count");
  return data;
}

export async function markNotificationRead(id: string): Promise<void> {
  await http.post(`/api/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await http.post("/api/notifications/read-all");
}

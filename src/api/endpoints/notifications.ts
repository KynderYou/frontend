import { apiClient } from '../client';
import type { NotificationsState } from '../notificationTypes';

/** GET /api/notifications */
export async function getNotifications(signal?: AbortSignal): Promise<NotificationsState> {
  return apiClient<NotificationsState>('/api/notifications', { signal });
}

/** POST /api/notifications/{id}/read */
export async function markNotificationRead(notificationId: number, signal?: AbortSignal): Promise<void> {
  await apiClient(`/api/notifications/${notificationId}/read`, { method: 'POST', signal });
}

/** POST /api/notifications/read-all */
export async function markAllNotificationsRead(signal?: AbortSignal): Promise<void> {
  await apiClient('/api/notifications/read-all', { method: 'POST', signal });
}

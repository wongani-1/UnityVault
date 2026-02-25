import type { NotificationRepository } from "../interfaces/notificationRepository";
import type { Notification } from "../../models/types";
import { store } from "./store";

export const notificationRepository: NotificationRepository = {
  async create(notification: Notification) {
    const notif = { ...notification, isRead: false };
    store.notifications.set(notif.id, notif);
    return notif;
  },
  async listByGroup(groupId: string) {
    return Array.from(store.notifications.values()).filter(
      (notification) => notification.groupId === groupId
    );
  },
  async listByMember(memberId: string) {
    return Array.from(store.notifications.values()).filter(
      (notification) => notification.memberId === memberId
    );
  },
  async markAsRead(notificationIds: string[]) {
    notificationIds.forEach((id) => {
      const notification = store.notifications.get(id);
      if (notification) {
        store.notifications.set(id, {
          ...notification,
          isRead: true,
          readAt: new Date().toISOString(),
        });
      }
    });
  },
  async markAllAsReadForMember(memberId: string) {
    const notifications = Array.from(store.notifications.values()).filter(
      (n) => n.memberId === memberId
    );
    notifications.forEach((n) => {
      store.notifications.set(n.id, {
        ...n,
        isRead: true,
        readAt: new Date().toISOString(),
      });
    });
  },
  async markAllAsReadForAdmin(adminId: string) {
    // Find the admin's group
    const admin = Array.from(store.admins.values()).find(a => a.id === adminId);
    if (!admin) return;
    
    // Mark group-wide and admin-targeted notifications
    const notifications = Array.from(store.notifications.values()).filter(
      (n) => n.groupId === admin.groupId && (n.adminId === undefined || n.adminId === adminId)
    );
    notifications.forEach((n) => {
      store.notifications.set(n.id, {
        ...n,
        isRead: true,
        readAt: new Date().toISOString(),
      });
    });
  },
};

import type { NotificationRepository } from "../interfaces/notificationRepository";
import type { Notification } from "../../models/types";
import { store } from "./store";

export const notificationRepository: NotificationRepository = {
  async create(notification: Notification) {
    store.notifications.set(notification.id, notification);
    return notification;
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
};

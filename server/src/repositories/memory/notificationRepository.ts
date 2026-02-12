import type { NotificationRepository } from "../interfaces/notificationRepository";
import type { Notification } from "../../models/types";
import { store } from "./store";

export const notificationRepository: NotificationRepository = {
  create(notification: Notification) {
    store.notifications.set(notification.id, notification);
    return notification;
  },
  listByGroup(groupId: string) {
    return Array.from(store.notifications.values()).filter(
      (notification) => notification.groupId === groupId
    );
  },
  listByMember(memberId: string) {
    return Array.from(store.notifications.values()).filter(
      (notification) => notification.memberId === memberId
    );
  },
};

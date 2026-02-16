import type { Notification } from "../../models/types";

export type NotificationRepository = {
  create: (notification: Notification) => Promise<Notification>;
  listByGroup: (groupId: string) => Promise<Notification[]>;
  listByMember: (memberId: string) => Promise<Notification[]>;
  markAsRead: (notificationIds: string[]) => Promise<void>;
  markAllAsReadForMember: (memberId: string) => Promise<void>;
  markAllAsReadForAdmin: (adminId: string) => Promise<void>;
};

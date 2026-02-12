import type { Notification } from "../../models/types";

export type NotificationRepository = {
  create: (notification: Notification) => Notification;
  listByGroup: (groupId: string) => Notification[];
  listByMember: (memberId: string) => Notification[];
};

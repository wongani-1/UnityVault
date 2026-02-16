import type { NotificationRepository } from "../repositories/interfaces";
import type { Notification } from "../models/types";
import { createId } from "../utils/id";

export class NotificationService {
  constructor(private notificationRepository: NotificationRepository) {}

  async create(notification: Omit<Notification, "id" | "createdAt" | "status">) {
    const record: Notification = {
      ...notification,
      id: createId("note"),
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    return this.notificationRepository.create(record);
  }

  async listByGroup(groupId: string) {
    return this.notificationRepository.listByGroup(groupId);
  }

  async listByMember(memberId: string) {
    return this.notificationRepository.listByMember(memberId);
  }
}

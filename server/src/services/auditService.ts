import type { AuditRepository } from "../repositories/interfaces";
import type { AuditLog, Role } from "../models/types";
import { createId } from "../utils/id";

export class AuditService {
  constructor(private auditRepository: AuditRepository) {}

  async log(params: {
    groupId: string;
    actorId: string;
    actorRole: Role;
    action: string;
    entityType: string;
    entityId: string;
    meta?: Record<string, unknown>;
  }) {
    const log: AuditLog = {
      id: createId("audit"),
      groupId: params.groupId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      createdAt: new Date().toISOString(),
      meta: params.meta,
    };

    return this.auditRepository.create(log);
  }

  async listByGroup(groupId: string) {
    return this.auditRepository.listByGroup(groupId);
  }
}

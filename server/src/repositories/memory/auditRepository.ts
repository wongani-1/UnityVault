import type { AuditRepository } from "../interfaces/auditRepository";
import type { AuditLog } from "../../models/types";
import { store } from "./store";

export const auditRepository: AuditRepository = {
  async create(log: AuditLog) {
    store.auditLogs.set(log.id, log);
    return log;
  },
  async listByGroup(groupId: string) {
    return Array.from(store.auditLogs.values()).filter(
      (log) => log.groupId === groupId
    );
  },
};

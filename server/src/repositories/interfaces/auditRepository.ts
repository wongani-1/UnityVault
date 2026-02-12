import type { AuditLog } from "../../models/types";

export type AuditRepository = {
  create: (log: AuditLog) => AuditLog;
  listByGroup: (groupId: string) => AuditLog[];
};

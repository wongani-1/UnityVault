import type { AuditLog } from "../../models/types";

export type AuditRepository = {
  create: (log: AuditLog) => Promise<AuditLog>;
  listByGroup: (groupId: string) => Promise<AuditLog[]>;
};

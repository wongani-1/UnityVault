import type {
  Group,
  Admin,
  Member,
  Contribution,
  Loan,
  Penalty,
  Notification,
  AuditLog,
  Transaction,
} from "../../models/types";

export const store = {
  groups: new Map<string, Group>(),
  admins: new Map<string, Admin>(),
  members: new Map<string, Member>(),
  contributions: new Map<string, Contribution>(),
  loans: new Map<string, Loan>(),
  penalties: new Map<string, Penalty>(),
  notifications: new Map<string, Notification>(),
  auditLogs: new Map<string, AuditLog>(),
  transactions: new Map<string, Transaction>(),
};

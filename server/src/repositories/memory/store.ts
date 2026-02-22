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
import type { Distribution, MemberDistribution } from "../../models/distribution";
import type { PaymentTransaction } from "../../services/paymentService";

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
  distributions: new Map<string, Distribution>(),
  memberDistributions: new Map<string, MemberDistribution>(),
  paymentTransactions: new Map<string, PaymentTransaction>(),
};

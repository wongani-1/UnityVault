import type {
  Admin,
  AuditLog,
  Contribution,
  Group,
  GroupSettings,
  Loan,
  LoanInstallment,
  Member,
  Notification,
  Penalty,
  Transaction,
} from "../../models/types";

export type GroupRow = {
  id: string;
  name: string;
  created_at: string;
  settings: GroupSettings;
  total_savings: number;
  total_income: number;
  cash: number;
};

export type AdminRow = {
  id: string;
  group_id: string;
  first_name?: string | null;
  last_name?: string | null;
  email: string;
  phone: string | null;
  username: string;
  password_hash: string;
  role: "group_admin";
  created_at: string;
  two_factor_enabled?: boolean;
  two_factor_secret?: string | null;
  two_factor_backup_codes?: string[] | null;
  password_reset_token?: string | null;
  password_reset_expires_at?: string | null;
  subscription_paid?: boolean;
  subscription_paid_at?: string | null;
  subscription_expires_at?: string | null;
  current_plan_id?: "starter" | "professional" | "enterprise" | null;
};

export type MemberRow = {
  id: string;
  group_id: string;
  first_name?: string;
  last_name?: string;
  email: string | null;
  phone: string | null;
  username: string;
  password_hash: string;
  status: string;
  created_at: string;
  balance: number;
  penalties_total: number;
  invite_token: string | null;
  invite_otp_hash: string | null;
  invite_expires_at: string | null;
  invite_sent_at: string | null;
  two_factor_enabled?: boolean;
  two_factor_secret?: string | null;
  two_factor_backup_codes?: string[] | null;
  password_reset_token?: string | null;
  password_reset_expires_at?: string | null;
  registration_fee_paid?: boolean;
  registration_fee_paid_at?: string | null;
  seed_paid?: boolean;
  seed_paid_at?: string | null;
  shares_owned?: number;
};

export type ContributionRow = {
  id: string;
  group_id: string;
  member_id: string;
  amount: number;
  month: string;
  status: string;
  due_date: string;
  created_at: string;
  paid_at: string | null;
};

export type LoanRow = {
  id: string;
  group_id: string;
  member_id: string;
  principal: number;
  interest_rate: number;
  total_interest: number;
  total_due: number;
  balance: number;
  status: string;
  installments: LoanInstallment[];
  reason: string | null;
  created_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  completed_at: string | null;
  due_date: string | null;
};

export type PenaltyRow = {
  id: string;
  group_id: string;
  member_id: string;
  loan_id: string | null;
  installment_id: string | null;
  contribution_id: string | null;
  amount: number;
  reason: string;
  status: string;
  due_date: string;
  created_at: string;
  paid_at: string | null;
  is_paid: boolean;
};

export type NotificationRow = {
  id: string;
  group_id: string;
  member_id: string | null;
  admin_id: string | null;
  type: string;
  message: string;
  status: string;
  is_read: boolean;
  created_at: string;
  sent_at: string | null;
  read_at: string | null;
};

export type AuditRow = {
  id: string;
  group_id: string;
  actor_id: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
  meta: Record<string, unknown> | null;
};

export type TransactionRow = {
  id: string;
  group_id: string;
  member_id: string;
  type: string;
  amount: number;
  description: string;
  member_savings_change: number;
  group_income_change: number;
  group_cash_change: number;
  contribution_id: string | null;
  loan_id: string | null;
  installment_id: string | null;
  penalty_id: string | null;
  created_at: string;
  created_by: string;
};

export const toGroupRow = (group: Group): GroupRow => ({
  id: group.id,
  name: group.name,
  created_at: group.createdAt,
  settings: group.settings,
  total_savings: group.totalSavings,
  total_income: group.totalIncome,
  cash: group.cash,
});

export const toGroupPatch = (patch: Partial<Group>): Partial<GroupRow> => ({
  ...(patch.name !== undefined ? { name: patch.name } : {}),
  ...(patch.createdAt !== undefined ? { created_at: patch.createdAt } : {}),
  ...(patch.settings !== undefined ? { settings: patch.settings } : {}),
  ...(patch.totalSavings !== undefined ? { total_savings: patch.totalSavings } : {}),
  ...(patch.totalIncome !== undefined ? { total_income: patch.totalIncome } : {}),
  ...(patch.cash !== undefined ? { cash: patch.cash } : {}),
});

export const fromGroupRow = (row: GroupRow): Group => ({
  id: row.id,
  name: row.name,
  createdAt: row.created_at,
  settings: {
    contributionAmount: row.settings.contributionAmount ?? 0,
    loanInterestRate: row.settings.loanInterestRate ?? 0,
    penaltyRate: row.settings.penaltyRate ?? 0,
    contributionPenaltyRate: row.settings.contributionPenaltyRate ?? 0,
    minimumContributionMonths: row.settings.minimumContributionMonths ?? 0,
    loanToSavingsRatio: row.settings.loanToSavingsRatio ?? 0,
    enableAutomaticPenalties: row.settings.enableAutomaticPenalties ?? false,
    // New fields with defaults
    shareFee: row.settings.shareFee ?? 1000,
    initialLoanAmount: row.settings.initialLoanAmount ?? 50000,
    seedAmount: row.settings.seedAmount ?? 50000,
    compulsoryInterestRate: row.settings.compulsoryInterestRate ?? 0.20,
  },
  totalSavings: row.total_savings,
  totalIncome: row.total_income,
  cash: row.cash,
});

export const toAdminRow = (admin: Admin): Record<string, unknown> => ({
  id: admin.id,
  group_id: admin.groupId,
  first_name: admin.first_name || null,
  last_name: admin.last_name || null,
  email: admin.email,
  phone: admin.phone || null,
  username: admin.username,
  password_hash: admin.passwordHash,
  role: admin.role,
  created_at: admin.createdAt,
  subscription_paid: admin.subscriptionPaid,
  subscription_paid_at: admin.subscriptionPaidAt || null,
  subscription_expires_at: admin.subscriptionExpiresAt || null,
  current_plan_id: admin.currentPlanId || "starter",
});

export const toAdminPatch = (patch: Partial<Admin>): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  
  if (patch.groupId !== undefined) result.group_id = patch.groupId;
  if (patch.first_name !== undefined) result.first_name = patch.first_name || null;
  if (patch.last_name !== undefined) result.last_name = patch.last_name || null;
  
  if (patch.email !== undefined) result.email = patch.email;
  if (patch.phone !== undefined) result.phone = patch.phone || null;
  if (patch.username !== undefined) result.username = patch.username;
  if (patch.passwordHash !== undefined) result.password_hash = patch.passwordHash;
  if (patch.role !== undefined) result.role = patch.role;
  if (patch.createdAt !== undefined) result.created_at = patch.createdAt;
  if (patch.subscriptionPaid !== undefined) result.subscription_paid = patch.subscriptionPaid;
  if (patch.subscriptionPaidAt !== undefined) result.subscription_paid_at = patch.subscriptionPaidAt || null;
  if (patch.subscriptionExpiresAt !== undefined) result.subscription_expires_at = patch.subscriptionExpiresAt || null;
  if (patch.currentPlanId !== undefined) result.current_plan_id = patch.currentPlanId || null;
  
  return result;
};

export const fromAdminRow = (row: AdminRow): Admin => {
  const firstName = row.first_name || undefined;
  const lastName = row.last_name || undefined;

  return {
    id: row.id,
    groupId: row.group_id,
    first_name: firstName,
    last_name: lastName,
    email: row.email,
    phone: row.phone || undefined,
    username: row.username,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: row.created_at,
    twoFactorEnabled: row.two_factor_enabled || false,
    twoFactorSecret: row.two_factor_secret || undefined,
    twoFactorBackupCodes: row.two_factor_backup_codes || undefined,
    passwordResetToken: row.password_reset_token || undefined,
    passwordResetExpiresAt: row.password_reset_expires_at || undefined,
    subscriptionPaid: row.subscription_paid || false,
    subscriptionPaidAt: row.subscription_paid_at || undefined,
    subscriptionExpiresAt: row.subscription_expires_at || undefined,
    currentPlanId: row.current_plan_id || "starter",
  };
};

export const toMemberRow = (member: Member): Record<string, unknown> => ({
  id: member.id,
  group_id: member.groupId,
  first_name: member.first_name,
  last_name: member.last_name,
  email: member.email || null,
  phone: member.phone || null,
  username: member.username,
  password_hash: member.passwordHash,
  status: member.status,
  created_at: member.createdAt,
  balance: member.balance,
  penalties_total: member.penaltiesTotal,
  invite_token: member.inviteToken || null,
  invite_otp_hash: member.inviteOtpHash || null,
  invite_expires_at: member.inviteExpiresAt || null,
  invite_sent_at: member.inviteSentAt || null,
  registration_fee_paid: member.registrationFeePaid,
  registration_fee_paid_at: member.registrationFeePaidAt || null,
  seed_paid: member.seedPaid,
  seed_paid_at: member.seedPaidAt || null,
  shares_owned: member.sharesOwned,
});

export const toMemberPatch = (patch: Partial<Member>): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  
  if (patch.groupId !== undefined) result.group_id = patch.groupId;
  if (patch.first_name !== undefined) result.first_name = patch.first_name;
  if (patch.last_name !== undefined) result.last_name = patch.last_name;
  
  if (patch.email !== undefined) result.email = patch.email || null;
  if (patch.phone !== undefined) result.phone = patch.phone || null;
  if (patch.username !== undefined) result.username = patch.username;
  if (patch.passwordHash !== undefined) result.password_hash = patch.passwordHash;
  if (patch.status !== undefined) result.status = patch.status;
  if (patch.createdAt !== undefined) result.created_at = patch.createdAt;
  if (patch.balance !== undefined) result.balance = patch.balance;
  if (patch.penaltiesTotal !== undefined) result.penalties_total = patch.penaltiesTotal;
  if (patch.inviteToken !== undefined) result.invite_token = patch.inviteToken || null;
  if (patch.inviteOtpHash !== undefined) result.invite_otp_hash = patch.inviteOtpHash || null;
  if (patch.inviteExpiresAt !== undefined) result.invite_expires_at = patch.inviteExpiresAt || null;
  if (patch.inviteSentAt !== undefined) result.invite_sent_at = patch.inviteSentAt || null;
  if (patch.registrationFeePaid !== undefined) result.registration_fee_paid = patch.registrationFeePaid;
  if (patch.registrationFeePaidAt !== undefined) result.registration_fee_paid_at = patch.registrationFeePaidAt || null;
  if (patch.seedPaid !== undefined) result.seed_paid = patch.seedPaid;
  if (patch.seedPaidAt !== undefined) result.seed_paid_at = patch.seedPaidAt || null;
  if (patch.sharesOwned !== undefined) result.shares_owned = patch.sharesOwned;
  
  return result;
};

export const fromMemberRow = (row: MemberRow): Member => {
  const firstName = row.first_name || row.username;
  const lastName = row.last_name || "";

  return {
    id: row.id,
    groupId: row.group_id,
    first_name: firstName,
    last_name: lastName,
    email: row.email || undefined,
    phone: row.phone || undefined,
    username: row.username,
    passwordHash: row.password_hash,
    status: row.status as Member["status"],
    createdAt: row.created_at,
    balance: row.balance,
    penaltiesTotal: row.penalties_total,
    inviteToken: row.invite_token || undefined,
    inviteOtpHash: row.invite_otp_hash || undefined,
    inviteExpiresAt: row.invite_expires_at || undefined,
    twoFactorEnabled: row.two_factor_enabled || false,
    twoFactorSecret: row.two_factor_secret || undefined,
    twoFactorBackupCodes: row.two_factor_backup_codes || undefined,
    passwordResetToken: row.password_reset_token || undefined,
    passwordResetExpiresAt: row.password_reset_expires_at || undefined,
    inviteSentAt: row.invite_sent_at || undefined,
    registrationFeePaid: row.registration_fee_paid || false,
    registrationFeePaidAt: row.registration_fee_paid_at || undefined,
    seedPaid: row.seed_paid || false,
    seedPaidAt: row.seed_paid_at || undefined,
    sharesOwned: row.shares_owned || 0,
  };
};

export const toContributionRow = (contribution: Contribution): ContributionRow => ({
  id: contribution.id,
  group_id: contribution.groupId,
  member_id: contribution.memberId,
  amount: contribution.amount,
  month: contribution.month,
  status: contribution.status,
  due_date: contribution.dueDate,
  created_at: contribution.createdAt,
  paid_at: contribution.paidAt || null,
});

export const toContributionPatch = (patch: Partial<Contribution>): Partial<ContributionRow> => ({
  ...(patch.groupId !== undefined ? { group_id: patch.groupId } : {}),
  ...(patch.memberId !== undefined ? { member_id: patch.memberId } : {}),
  ...(patch.amount !== undefined ? { amount: patch.amount } : {}),
  ...(patch.month !== undefined ? { month: patch.month } : {}),
  ...(patch.status !== undefined ? { status: patch.status } : {}),
  ...(patch.dueDate !== undefined ? { due_date: patch.dueDate } : {}),
  ...(patch.createdAt !== undefined ? { created_at: patch.createdAt } : {}),
  ...(patch.paidAt !== undefined ? { paid_at: patch.paidAt || null } : {}),
});

export const fromContributionRow = (row: ContributionRow): Contribution => ({
  id: row.id,
  groupId: row.group_id,
  memberId: row.member_id,
  amount: row.amount,
  month: row.month,
  status: row.status as Contribution["status"],
  dueDate: row.due_date,
  createdAt: row.created_at,
  paidAt: row.paid_at || undefined,
});

export const toLoanRow = (loan: Loan): LoanRow => ({
  id: loan.id,
  group_id: loan.groupId,
  member_id: loan.memberId,
  principal: loan.principal,
  interest_rate: loan.interestRate,
  total_interest: loan.totalInterest,
  total_due: loan.totalDue,
  balance: loan.balance,
  status: loan.status,
  installments: loan.installments || [],
  reason: loan.reason || null,
  created_at: loan.createdAt,
  approved_at: loan.approvedAt || null,
  rejected_at: loan.rejectedAt || null,
  rejection_reason: loan.rejectionReason || null,
  completed_at: loan.completedAt || null,
  due_date: loan.dueDate || null,
});

export const toLoanPatch = (patch: Partial<Loan>): Partial<LoanRow> => ({
  ...(patch.groupId !== undefined ? { group_id: patch.groupId } : {}),
  ...(patch.memberId !== undefined ? { member_id: patch.memberId } : {}),
  ...(patch.principal !== undefined ? { principal: patch.principal } : {}),
  ...(patch.interestRate !== undefined ? { interest_rate: patch.interestRate } : {}),
  ...(patch.totalInterest !== undefined ? { total_interest: patch.totalInterest } : {}),
  ...(patch.totalDue !== undefined ? { total_due: patch.totalDue } : {}),
  ...(patch.balance !== undefined ? { balance: patch.balance } : {}),
  ...(patch.status !== undefined ? { status: patch.status } : {}),
  ...(patch.installments !== undefined ? { installments: patch.installments || [] } : {}),
  ...(patch.reason !== undefined ? { reason: patch.reason || null } : {}),
  ...(patch.createdAt !== undefined ? { created_at: patch.createdAt } : {}),
  ...(patch.approvedAt !== undefined ? { approved_at: patch.approvedAt || null } : {}),
  ...(patch.rejectedAt !== undefined ? { rejected_at: patch.rejectedAt || null } : {}),
  ...(patch.rejectionReason !== undefined ? { rejection_reason: patch.rejectionReason || null } : {}),
  ...(patch.completedAt !== undefined ? { completed_at: patch.completedAt || null } : {}),
  ...(patch.dueDate !== undefined ? { due_date: patch.dueDate || null } : {}),
});

export const fromLoanRow = (row: LoanRow): Loan => ({
  id: row.id,
  groupId: row.group_id,
  memberId: row.member_id,
  principal: row.principal,
  interestRate: row.interest_rate,
  totalInterest: row.total_interest,
  totalDue: row.total_due,
  balance: row.balance,
  status: row.status as Loan["status"],
  installments: row.installments || [],
  reason: row.reason || undefined,
  createdAt: row.created_at,
  approvedAt: row.approved_at || undefined,
  rejectedAt: row.rejected_at || undefined,
  rejectionReason: row.rejection_reason || undefined,
  completedAt: row.completed_at || undefined,
  dueDate: row.due_date || undefined,
});

export const toPenaltyRow = (penalty: Penalty): PenaltyRow => ({
  id: penalty.id,
  group_id: penalty.groupId,
  member_id: penalty.memberId,
  loan_id: penalty.loanId || null,
  installment_id: penalty.installmentId || null,
  contribution_id: penalty.contributionId || null,
  amount: penalty.amount,
  reason: penalty.reason,
  status: penalty.status,
  due_date: penalty.dueDate,
  created_at: penalty.createdAt,
  paid_at: penalty.paidAt || null,
  is_paid: penalty.isPaid,
});

export const toPenaltyPatch = (patch: Partial<Penalty>): Partial<PenaltyRow> => ({
  ...(patch.groupId !== undefined ? { group_id: patch.groupId } : {}),
  ...(patch.memberId !== undefined ? { member_id: patch.memberId } : {}),
  ...(patch.loanId !== undefined ? { loan_id: patch.loanId || null } : {}),
  ...(patch.installmentId !== undefined ? { installment_id: patch.installmentId || null } : {}),
  ...(patch.contributionId !== undefined ? { contribution_id: patch.contributionId || null } : {}),
  ...(patch.amount !== undefined ? { amount: patch.amount } : {}),
  ...(patch.reason !== undefined ? { reason: patch.reason } : {}),
  ...(patch.status !== undefined ? { status: patch.status } : {}),
  ...(patch.dueDate !== undefined ? { due_date: patch.dueDate } : {}),
  ...(patch.createdAt !== undefined ? { created_at: patch.createdAt } : {}),
  ...(patch.paidAt !== undefined ? { paid_at: patch.paidAt || null } : {}),
  ...(patch.isPaid !== undefined ? { is_paid: patch.isPaid } : {}),
});

export const fromPenaltyRow = (row: PenaltyRow): Penalty => ({
  id: row.id,
  groupId: row.group_id,
  memberId: row.member_id,
  loanId: row.loan_id || undefined,
  installmentId: row.installment_id || undefined,
  contributionId: row.contribution_id || undefined,
  amount: row.amount,
  reason: row.reason,
  status: row.status as Penalty["status"],
  dueDate: row.due_date,
  createdAt: row.created_at,
  paidAt: row.paid_at || undefined,
  isPaid: row.is_paid,
});

export const toNotificationRow = (notification: Notification): NotificationRow => ({
  id: notification.id,
  group_id: notification.groupId,
  member_id: notification.memberId || null,
  admin_id: notification.adminId || null,
  type: notification.type,
  message: notification.message,
  status: notification.status,
  is_read: notification.isRead,
  created_at: notification.createdAt,
  sent_at: notification.sentAt || null,
  read_at: notification.readAt || null,
});

export const toNotificationPatch = (patch: Partial<Notification>): Partial<NotificationRow> => ({
  ...(patch.groupId !== undefined ? { group_id: patch.groupId } : {}),
  ...(patch.memberId !== undefined ? { member_id: patch.memberId || null } : {}),
  ...(patch.adminId !== undefined ? { admin_id: patch.adminId || null } : {}),
  ...(patch.type !== undefined ? { type: patch.type } : {}),
  ...(patch.message !== undefined ? { message: patch.message } : {}),
  ...(patch.status !== undefined ? { status: patch.status } : {}),
  ...(patch.createdAt !== undefined ? { created_at: patch.createdAt } : {}),
  ...(patch.sentAt !== undefined ? { sent_at: patch.sentAt || null } : {}),
});

export const fromNotificationRow = (row: NotificationRow): Notification => ({
  id: row.id,
  groupId: row.group_id,
  memberId: row.member_id || undefined,
  adminId: row.admin_id || undefined,
  type: row.type,
  message: row.message,
  status: row.status as Notification["status"],
  isRead: row.is_read,
  createdAt: row.created_at,
  sentAt: row.sent_at || undefined,
  readAt: row.read_at || undefined,
});

export const toAuditRow = (log: AuditLog): AuditRow => ({
  id: log.id,
  group_id: log.groupId,
  actor_id: log.actorId,
  actor_role: log.actorRole,
  action: log.action,
  entity_type: log.entityType,
  entity_id: log.entityId,
  created_at: log.createdAt,
  meta: log.meta || null,
});

export const fromAuditRow = (row: AuditRow): AuditLog => ({
  id: row.id,
  groupId: row.group_id,
  actorId: row.actor_id,
  actorRole: row.actor_role as AuditLog["actorRole"],
  action: row.action,
  entityType: row.entity_type,
  entityId: row.entity_id,
  createdAt: row.created_at,
  meta: row.meta || undefined,
});

export const toTransactionRow = (transaction: Transaction): TransactionRow => ({
  id: transaction.id,
  group_id: transaction.groupId,
  member_id: transaction.memberId,
  type: transaction.type,
  amount: transaction.amount,
  description: transaction.description,
  member_savings_change: transaction.memberSavingsChange,
  group_income_change: transaction.groupIncomeChange,
  group_cash_change: transaction.groupCashChange,
  contribution_id: transaction.contributionId || null,
  loan_id: transaction.loanId || null,
  installment_id: transaction.installmentId || null,
  penalty_id: transaction.penaltyId || null,
  created_at: transaction.createdAt,
  created_by: transaction.createdBy,
});

export const fromTransactionRow = (row: TransactionRow): Transaction => ({
  id: row.id,
  groupId: row.group_id,
  memberId: row.member_id,
  type: row.type as Transaction["type"],
  amount: row.amount,
  description: row.description,
  memberSavingsChange: row.member_savings_change,
  groupIncomeChange: row.group_income_change,
  groupCashChange: row.group_cash_change,
  contributionId: row.contribution_id || undefined,
  loanId: row.loan_id || undefined,
  installmentId: row.installment_id || undefined,
  penaltyId: row.penalty_id || undefined,
  createdAt: row.created_at,
  createdBy: row.created_by,
});

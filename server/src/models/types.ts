export type Role = "platform_owner" | "group_admin" | "member";
export type MemberStatus = "pending" | "active" | "rejected";
export type NotificationStatus = "pending" | "sent" | "failed";
export type LoanStatus = "pending" | "approved" | "rejected" | "active" | "completed";
export type InstallmentStatus = "unpaid" | "paid" | "overdue";
export type ContributionStatus = "unpaid" | "paid" | "overdue";
export type PenaltyStatus = "unpaid" | "paid";
export type TransactionType = "contribution" | "loan_disbursement" | "loan_repayment" | "penalty_payment" | "initial_deposit";

export type GroupSettings = {
  contributionAmount: number;
  loanInterestRate: number;
  penaltyRate: number; // Penalty rate for missed loan payments (as decimal, e.g., 0.15 = 15%)
  contributionPenaltyRate: number; // Penalty rate for missed contributions (as decimal, e.g., 0.10 = 10%)
  compulsoryInterestRate: number;
  minimumContributionMonths: number; // Minimum months of contributions before loan eligibility
  loanToSavingsRatio: number; // Maximum loan amount as ratio of total contributions (e.g., 2.0 = 200%)
  enableAutomaticPenalties: boolean; // Auto-apply penalties for overdue installments
};

export type Group = {
  id: string;
  name: string;
  createdAt: string;
  settings: GroupSettings;
  totalSavings: number; // Total member savings/contributions
  totalIncome: number; // Group income (interest, penalties, fees)
  cash: number; // Available cash (savings + income - loans disbursed)
};

export type Admin = {
  id: string;
  groupId: string;
  fullName?: string;
  email: string;
  phone?: string;
  username: string;
  passwordHash: string;
  role: "group_admin";
  createdAt: string;
  // 2FA fields
  twoFactorEnabled: boolean;
  twoFactorSecret?: string; // TOTP secret for authenticator apps
  twoFactorBackupCodes?: string[]; // Backup codes for 2FA
  // Password reset fields
  passwordResetToken?: string;
  passwordResetExpiresAt?: string;
  // Subscription payment tracking
  subscriptionPaid: boolean;
  subscriptionPaidAt?: string;
  subscriptionExpiresAt?: string;
};

export type Member = {
  id: string;
  groupId: string;
  fullName: string;
  email?: string;
  phone?: string;
  username: string;
  passwordHash: string;
  status: MemberStatus;
  createdAt: string;
  balance: number;
  penaltiesTotal: number;
  inviteToken?: string;
  inviteOtpHash?: string;
  inviteExpiresAt?: string;
  inviteSentAt?: string;
  // 2FA fields
  twoFactorEnabled: boolean;
  twoFactorSecret?: string; // TOTP secret for authenticator apps
  twoFactorBackupCodes?: string[]; // Backup codes for 2FA
  // Password reset fields
  passwordResetToken?: string;
  passwordResetExpiresAt?: string;
  // Registration fee payment tracking
  registrationFeePaid: boolean;
  registrationFeePaidAt?: string;
};

export type Contribution = {
  id: string;
  groupId: string;
  memberId: string;
  amount: number;
  month: string; // Format: "YYYY-MM" (e.g., "2026-02")
  status: ContributionStatus;
  dueDate: string; // ISO date string
  createdAt: string;
  paidAt?: string;
};

export type LoanInstallment = {
  id: string;
  installmentNumber: number;
  dueDate: string;
  amount: number; // Total (principal + interest)
  principalAmount: number;
  interestAmount: number;
  status: InstallmentStatus;
  paidAt?: string;
};

export type Loan = {
  id: string;
  groupId: string;
  memberId: string;
  principal: number;
  interestRate: number;
  totalInterest: number;
  totalDue: number;
  balance: number; // Remaining amount to be paid
  status: LoanStatus;
  installments: LoanInstallment[];
  reason?: string; // Optional reason provided by member
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  completedAt?: string;
  dueDate?: string; // Final due date (last installment)
};

export type Penalty = {
  id: string;
  groupId: string;
  memberId: string;
  loanId?: string;
  installmentId?: string;
  contributionId?: string;
  amount: number;
  reason: string;
  status: PenaltyStatus;
  dueDate: string; // When penalty should be paid
  createdAt: string;
  paidAt?: string; // When penalty was actually paid
  isPaid: boolean; // Deprecated: use status instead, kept for backward compatibility
};

export type Notification = {
  id: string;
  groupId: string;
  memberId?: string;
  adminId?: string;
  type: string;
  message: string;
  status: NotificationStatus;
  isRead: boolean;
  createdAt: string;
  sentAt?: string;
  readAt?: string;
};

export type AuditLog = {
  id: string;
  groupId: string;
  actorId: string;
  actorRole: Role;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  meta?: Record<string, unknown>;
};

export type Transaction = {
  id: string;
  groupId: string;
  memberId: string;
  type: TransactionType;
  amount: number;
  description: string;
  // Accounting double-entry fields
  memberSavingsChange: number; // Change to member's savings balance
  groupIncomeChange: number; // Change to group's income
  groupCashChange: number; // Change to group's cash
  // Reference to source entity
  contributionId?: string;
  loanId?: string;
  installmentId?: string;
  penaltyId?: string;
  createdAt: string;
  createdBy: string;
};

export type Session = {
  id: string;
  userId: string;
  userRole: Role;
  deviceName: string; // Browser/device identifier
  ipAddress: string;
  userAgent: string;
  expiresAt: string;
  createdAt: string;
  lastActivityAt: string;
  isActive: boolean;
};

export type PasswordReset = {
  id: string;
  userId: string;
  userRole: Role;
  token: string;
  expiresAt: string;
  createdAt: string;
  usedAt?: string;
};

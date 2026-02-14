export type Role = "platform_owner" | "group_admin" | "member";
export type MemberStatus = "pending" | "active" | "rejected";
export type NotificationStatus = "pending" | "sent" | "failed";
export type LoanStatus = "pending" | "approved" | "rejected" | "active" | "completed";
export type InstallmentStatus = "unpaid" | "paid" | "overdue";

export type GroupSettings = {
  contributionAmount: number;
  loanInterestRate: number;
  penaltyRate: number;
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
};

export type Contribution = {
  id: string;
  groupId: string;
  memberId: string;
  amount: number;
  month: string;
  createdAt: string;
  paidAt?: string;
};

export type LoanInstallment = {
  id: string;
  dueDate: string;
  amount: number;
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
  contributionId?: string;
  amount: number;
  reason: string;
  createdAt: string;
  isPaid: boolean;
};

export type Notification = {
  id: string;
  groupId: string;
  memberId?: string;
  adminId?: string;
  type: string;
  message: string;
  status: NotificationStatus;
  createdAt: string;
  sentAt?: string;
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

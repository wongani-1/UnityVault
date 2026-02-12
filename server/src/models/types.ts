export type Role = "platform_owner" | "group_admin" | "member";
export type MemberStatus = "pending" | "active" | "rejected";
export type NotificationStatus = "pending" | "sent" | "failed";
export type LoanStatus = "pending" | "approved" | "rejected" | "closed";
export type InstallmentStatus = "due" | "paid" | "late";

export type GroupSettings = {
  contributionAmount: number;
  loanInterestRate: number;
  penaltyRate: number;
  compulsoryInterestRate: number;
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
  status: LoanStatus;
  installments: LoanInstallment[];
  createdAt: string;
  approvedAt?: string;
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
  resolved: boolean;
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

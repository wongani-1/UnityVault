export type DistributionStatus = "pending" | "completed" | "cancelled";

export type Distribution = {
  id: string;
  groupId: string;
  year: number;
  totalContributions: number;
  totalProfitPool: number; // Loan interest + penalties
  totalLoanInterest: number;
  totalPenalties: number;
  numberOfMembers: number;
  profitPerMember: number;
  status: DistributionStatus;
  distributedAt?: string;
  createdAt: string;
};

export type MemberDistribution = {
  id: string;
  distributionId: string;
  memberId: string;
  memberName: string;
  totalContributions: number;
  profitShare: number;
  totalPayout: number;
  paidAt?: string;
  createdAt: string;
};

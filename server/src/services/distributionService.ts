import type {
  ContributionRepository,
  LoanRepository,
  PenaltyRepository,
  MemberRepository,
  GroupRepository,
  TransactionRepository,
} from "../repositories/interfaces";
import type { DistributionRepository } from "../repositories/interfaces/distributionRepository";
import { ApiError } from "../utils/apiError";
import { Distribution, MemberDistribution } from "../models/distribution";
import type { Transaction } from "../models/types";
import { v4 as uuid } from "uuid";
import { createId } from "../utils/id";

const CYCLE_MONTHS = 12;

type MemberPayoutCalc = {
  memberId: string;
  memberName: string;
  totalContributions: number;
  contributionShortfall: number;
  outstandingLoan: number;
  pendingPenalties: number;
  complianceStatus: "completed" | "partial" | "defaulted";
  totalPayout: number;
  expectedContribution: number;
};

export class DistributionService {
  constructor(
    private contributionRepository: ContributionRepository,
    private loanRepository: LoanRepository,
    private penaltyRepository: PenaltyRepository,
    private memberRepository: MemberRepository,
    private groupRepository: GroupRepository,
    private distributionRepository: DistributionRepository,
    private transactionRepository: TransactionRepository
  ) {}

  private getExpectedContributionPerMember(monthlyContribution: number) {
    return (monthlyContribution || 0) * CYCLE_MONTHS;
  }

  private buildMemberPayoutCalcs(params: {
    members: Awaited<ReturnType<MemberRepository["listByGroup"]>>;
    allContributions: Awaited<ReturnType<ContributionRepository["listByGroup"]>>;
    allLoans: Awaited<ReturnType<LoanRepository["listByGroup"]>>;
    allPenalties: Awaited<ReturnType<PenaltyRepository["listByGroup"]>>;
    year: number;
    expectedContributionPerMember: number;
    baseShare: number;
  }): MemberPayoutCalc[] {
    const {
      members,
      allContributions,
      allLoans,
      allPenalties,
      year,
      expectedContributionPerMember,
      baseShare,
    } = params;

    const activeMembers = members.filter((m) => m.status === "active");

    return activeMembers.map((member) => {
      const memberContributions = allContributions.filter((c) => {
        const paidDate = c.paidAt ? new Date(c.paidAt) : undefined;
        const contributionYear = (paidDate || new Date(c.createdAt)).getFullYear();
        return c.memberId === member.id && c.status === "paid" && contributionYear === year;
      });

      const totalContributions = memberContributions.reduce((sum, c) => sum + c.amount, 0);
      const contributionShortfall = Math.max(expectedContributionPerMember - totalContributions, 0);

      const outstandingLoan = allLoans
        .filter(
          (loan) =>
            loan.memberId === member.id &&
            (loan.status === "active" || loan.status === "approved") &&
            (loan.balance || 0) > 0
        )
        .reduce((sum, loan) => sum + (loan.balance || 0), 0);

      const pendingPenalties = allPenalties
        .filter((p) => p.memberId === member.id && p.status !== "paid")
        .reduce((sum, p) => sum + p.amount, 0);

      const complianceStatus: MemberPayoutCalc["complianceStatus"] =
        totalContributions >= expectedContributionPerMember
          ? "completed"
          : totalContributions > 0
          ? "partial"
          : "defaulted";

      const totalPayout = Math.max(
        baseShare - contributionShortfall - outstandingLoan - pendingPenalties,
        0
      );

      const fullName = `${member.first_name ?? ""} ${member.last_name ?? ""}`.trim();

      return {
        memberId: member.id,
        memberName: fullName || member.username,
        totalContributions,
        contributionShortfall,
        outstandingLoan,
        pendingPenalties,
        complianceStatus,
        totalPayout: Number(totalPayout.toFixed(2)),
        expectedContribution: expectedContributionPerMember,
      };
    });
  }

  /**
   * Calculate year-end distribution for a group
   */
  async calculateDistribution(params: { groupId: string; year: number }): Promise<Distribution> {
    const { groupId, year } = params;

    // Check if distribution already exists for this year
    const existing = await this.distributionRepository.getByGroupAndYear(groupId, year);
    if (existing && existing.status === "completed") {
      throw new ApiError("Distribution already completed for this year", 400);
    }
    if (existing && existing.status !== "completed") {
      return existing;
    }

    const group = await this.groupRepository.getById(groupId);
    if (!group) throw new ApiError("Group not found", 404);

    // Get all members
    const members = await this.memberRepository.listByGroup(groupId);
    const activeMembers = members.filter((m) => m.status === "active");

    if (activeMembers.length === 0) {
      throw new ApiError("No active members found", 400);
    }

    // Get all paid contributions for the year
    const allContributions = await this.contributionRepository.listByGroup(groupId);
    const yearContributions = allContributions.filter((c) => {
      const paidDate = c.paidAt ? new Date(c.paidAt) : undefined;
      const contributionYear = (paidDate || new Date(c.createdAt)).getFullYear();
      return contributionYear === year && c.status === "paid";
    });

    // Calculate total contributions
    const totalContributions = yearContributions.reduce((sum, c) => sum + c.amount, 0);

    // Get all loans for the year
    const allLoans = await this.loanRepository.listByGroup(groupId);
    const yearLoans = allLoans.filter((loan) => {
      const loanYear = new Date(loan.createdAt).getFullYear();
      return loanYear === year;
    });

    // Calculate total loan interest from paid installments
    let totalLoanInterest = 0;
    yearLoans.forEach((loan) => {
      loan.installments.forEach((inst) => {
        if (inst.status === "paid" && inst.paidAt) {
          const paidYear = new Date(inst.paidAt).getFullYear();
          if (paidYear === year) {
            totalLoanInterest += inst.interestAmount;
          }
        }
      });
    });

    // Get all penalties for the year
    const allPenalties = await this.penaltyRepository.listByGroup(groupId);
    const yearPenalties = allPenalties.filter((p) => {
      const penaltyYear = new Date(p.createdAt).getFullYear();
      return penaltyYear === year && p.isPaid;
    });

    // Calculate total penalties
    const totalPenalties = yearPenalties.reduce((sum, p) => sum + p.amount, 0);

    // Calculate profit pool (interest + penalties)
    const totalProfitPool = totalLoanInterest + totalPenalties;

    // Final group fund for end-cycle distribution
    const finalGroupFund = totalContributions + totalProfitPool;

    const expectedContributionPerMember = this.getExpectedContributionPerMember(
      group.settings.contributionAmount
    );

    const memberYearContribMap = new Map<string, number>();
    yearContributions.forEach((c) => {
      memberYearContribMap.set(c.memberId, (memberYearContribMap.get(c.memberId) || 0) + c.amount);
    });

    const compliantMembers = activeMembers.filter(
      (m) => (memberYearContribMap.get(m.id) || 0) >= expectedContributionPerMember
    );

    const eligibleMembers = compliantMembers.length > 0 ? compliantMembers : activeMembers;

    // Base share per eligible member
    const baseShare = finalGroupFund / eligibleMembers.length;

    // Create distribution record
    const distribution: Distribution = {
      id: uuid(),
      groupId,
      year,
      totalContributions,
      totalProfitPool,
      totalLoanInterest,
      totalPenalties,
      numberOfMembers: eligibleMembers.length,
      profitPerMember: Number(baseShare.toFixed(2)),
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    await this.distributionRepository.create(distribution);

    return distribution;
  }

  /**
   * Get distribution breakdown per member
   */
  async getDistributionBreakdown(params: {
    groupId: string;
    year: number;
  }): Promise<Array<MemberDistribution & {
    expectedContribution: number;
    contributionShortfall: number;
    outstandingLoan: number;
    pendingPenalties: number;
    complianceStatus: "completed" | "partial" | "defaulted";
  }>> {
    const { groupId, year } = params;

    // Get or calculate distribution
    let distribution = await this.distributionRepository.getByGroupAndYear(groupId, year);

    if (!distribution) {
      distribution = await this.calculateDistribution(params);
    }

    const group = await this.groupRepository.getById(groupId);
    if (!group) throw new ApiError("Group not found", 404);

    // Get all members
    const members = await this.memberRepository.listByGroup(groupId);
    const allContributions = await this.contributionRepository.listByGroup(groupId);
    const allLoans = await this.loanRepository.listByGroup(groupId);
    const allPenalties = await this.penaltyRepository.listByGroup(groupId);

    const expectedContributionPerMember = this.getExpectedContributionPerMember(
      group.settings.contributionAmount
    );

    const memberCalcs = this.buildMemberPayoutCalcs({
      members,
      allContributions,
      allLoans,
      allPenalties,
      year,
      expectedContributionPerMember,
      baseShare: distribution.profitPerMember,
    });

    // Get existing member distributions for this distribution
    const existingMemberDists = await this.distributionRepository.listMemberDistributionsByDistribution(distribution.id);

    const memberDistributions: Array<MemberDistribution & {
      expectedContribution: number;
      contributionShortfall: number;
      outstandingLoan: number;
      pendingPenalties: number;
      complianceStatus: "completed" | "partial" | "defaulted";
    }> = [];

    for (const calc of memberCalcs) {
      const existing = existingMemberDists.find((md) => md.memberId === calc.memberId);

      if (!existing) {
        const toCreate: MemberDistribution = {
          id: uuid(),
          distributionId: distribution.id,
          memberId: calc.memberId,
          memberName: calc.memberName,
          totalContributions: calc.totalContributions,
          profitShare: distribution.profitPerMember,
          totalPayout: calc.totalPayout,
          createdAt: new Date().toISOString(),
        };

        const created = await this.distributionRepository.createMemberDistribution(toCreate);
        memberDistributions.push({
          ...created,
          expectedContribution: calc.expectedContribution,
          contributionShortfall: calc.contributionShortfall,
          outstandingLoan: calc.outstandingLoan,
          pendingPenalties: calc.pendingPenalties,
          complianceStatus: calc.complianceStatus,
        });
        continue;
      }

      memberDistributions.push({
        ...existing,
        memberName: calc.memberName,
        totalContributions: calc.totalContributions,
        profitShare: distribution.profitPerMember,
        totalPayout: calc.totalPayout,
        expectedContribution: calc.expectedContribution,
        contributionShortfall: calc.contributionShortfall,
        outstandingLoan: calc.outstandingLoan,
        pendingPenalties: calc.pendingPenalties,
        complianceStatus: calc.complianceStatus,
      });
    }

    return memberDistributions;
  }

  async getEstimatedPayout(params: { groupId: string; memberId: string; year: number }) {
    const { groupId, memberId, year } = params;

    const distribution = await this.calculateDistribution({ groupId, year }).catch(async (error) => {
      if (error instanceof ApiError && error.message.includes("already completed")) {
        const existing = await this.distributionRepository.getByGroupAndYear(groupId, year);
        if (!existing) throw error;
        return existing;
      }
      throw error;
    });

    const group = await this.groupRepository.getById(groupId);
    if (!group) throw new ApiError("Group not found", 404);

    const members = await this.memberRepository.listByGroup(groupId);
    const allContributions = await this.contributionRepository.listByGroup(groupId);
    const allLoans = await this.loanRepository.listByGroup(groupId);
    const allPenalties = await this.penaltyRepository.listByGroup(groupId);

    const expectedContributionPerMember = this.getExpectedContributionPerMember(
      group.settings.contributionAmount
    );

    const memberCalcs = this.buildMemberPayoutCalcs({
      members,
      allContributions,
      allLoans,
      allPenalties,
      year,
      expectedContributionPerMember,
      baseShare: distribution.profitPerMember,
    });

    const memberCalc = memberCalcs.find((m) => m.memberId === memberId);
    if (!memberCalc) throw new ApiError("Member not found in active cycle members", 404);

    return {
      year,
      baseShare: Number(distribution.profitPerMember.toFixed(2)),
      expectedContribution: memberCalc.expectedContribution,
      actualContribution: Number(memberCalc.totalContributions.toFixed(2)),
      remainingContributionBalance: Number(memberCalc.contributionShortfall.toFixed(2)),
      loanBalance: Number(memberCalc.outstandingLoan.toFixed(2)),
      pendingPenalties: Number(memberCalc.pendingPenalties.toFixed(2)),
      complianceStatus: memberCalc.complianceStatus,
      estimatedPayout: Number(memberCalc.totalPayout.toFixed(2)),
    };
  }

  /**
   * Execute distribution - mark as completed
   */
  async executeDistribution(params: {
    groupId: string;
    year: number;
  }): Promise<Distribution> {
    const { groupId, year } = params;

    const distribution = await this.distributionRepository.getByGroupAndYear(groupId, year);

    if (!distribution) {
      throw new ApiError("Distribution not found", 404);
    }

    if (distribution.status === "completed") {
      throw new ApiError("Distribution already completed", 400);
    }

    const group = await this.groupRepository.getById(params.groupId);
    if (!group) throw new ApiError("Group not found", 404);

    // Get member distributions
    const memberDistributions = await this.getDistributionBreakdown(params);

    let totalPayoutAmount = 0;

    // Update member balances (optional - or just record distribution)
    for (const memberDist of memberDistributions) {
      const member = await this.memberRepository.getById(memberDist.memberId);
      if (member) {
        totalPayoutAmount += memberDist.totalPayout;

        // Add payout to member balance
        await this.memberRepository.update(member.id, {
          balance: member.balance + memberDist.totalPayout,
        });

        const ledgerEntry: Transaction = {
          id: createId("transaction"),
          groupId: params.groupId,
          memberId: member.id,
          type: "cycle_distribution",
          amount: memberDist.totalPayout,
          description: `Cycle distribution payout for ${year}`,
          memberSavingsChange: memberDist.totalPayout,
          groupIncomeChange: 0,
          groupCashChange: -memberDist.totalPayout,
          createdAt: new Date().toISOString(),
          createdBy: "system",
        };

        await this.transactionRepository.create(ledgerEntry);

        // Mark member distribution as paid
        await this.distributionRepository.updateMemberDistribution(memberDist.id, {
          paidAt: new Date().toISOString(),
        });
      }
    }

    await this.groupRepository.update(group.id, {
      cash: group.cash - totalPayoutAmount,
    });

    // Mark distribution as completed
    const updated = await this.distributionRepository.update(distribution.id, {
      status: "completed",
      distributedAt: new Date().toISOString(),
    });

    return updated!;
  }

  /**
   * Get all distributions for a group
   */
  async listDistributions(groupId: string): Promise<Distribution[]> {
    return this.distributionRepository.listByGroup(groupId);
  }

  /**
   * Get distribution by ID
   */
  async getDistribution(id: string): Promise<Distribution | undefined> {
    return this.distributionRepository.getById(id);
  }

  /**
   * Get member's distribution history
   */
  async getMemberDistributions(memberId: string): Promise<MemberDistribution[]> {
    return this.distributionRepository.listMemberDistributionsByMember(memberId);
  }
}

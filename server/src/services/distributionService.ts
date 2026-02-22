import type {
  ContributionRepository,
  LoanRepository,
  PenaltyRepository,
  MemberRepository,
  GroupRepository,
} from "../repositories/interfaces";
import type { DistributionRepository } from "../repositories/interfaces/distributionRepository";
import { ApiError } from "../utils/apiError";
import { Distribution, MemberDistribution } from "../models/distribution";
import { v4 as uuid } from "uuid";

export class DistributionService {
  constructor(
    private contributionRepository: ContributionRepository,
    private loanRepository: LoanRepository,
    private penaltyRepository: PenaltyRepository,
    private memberRepository: MemberRepository,
    private groupRepository: GroupRepository,
    private distributionRepository: DistributionRepository
  ) {}

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

    // Get all members
    const members = await this.memberRepository.listByGroup(groupId);
    const activeMembers = members.filter((m) => m.status === "active");

    if (activeMembers.length === 0) {
      throw new ApiError("No active members found", 400);
    }

    // Get all contributions for the year
    const allContributions = await this.contributionRepository.listByGroup(groupId);
    const yearContributions = allContributions.filter((c) => {
      const contributionYear = new Date(c.createdAt).getFullYear();
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

    // Calculate profit per member (equal distribution)
    const profitPerMember = totalProfitPool / activeMembers.length;

    // Create distribution record
    const distribution: Distribution = {
      id: uuid(),
      groupId,
      year,
      totalContributions,
      totalProfitPool,
      totalLoanInterest,
      totalPenalties,
      numberOfMembers: activeMembers.length,
      profitPerMember: Number(profitPerMember.toFixed(2)),
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
  }): Promise<MemberDistribution[]> {
    const { groupId, year } = params;

    // Get or calculate distribution
    let distribution = await this.distributionRepository.getByGroupAndYear(groupId, year);

    if (!distribution) {
      distribution = await this.calculateDistribution(params);
    }

    // Get all members
    const members = await this.memberRepository.listByGroup(groupId);
    const activeMembers = members.filter((m) => m.status === "active");

    // Get all contributions for the year
    const allContributions = await this.contributionRepository.listByGroup(groupId);

    // Get existing member distributions for this distribution
    const existingMemberDists = await this.distributionRepository.listMemberDistributionsByDistribution(distribution.id);

    const memberDistributions: MemberDistribution[] = [];

    for (const member of activeMembers) {
      // Check if member distribution already exists
      let memberDist = existingMemberDists.find(md => md.memberId === member.id);
      
      if (memberDist) {
        // Return existing member distribution (preserves paidAt)
        memberDistributions.push(memberDist);
      } else {
        // Calculate this member's total contributions for the year
        const memberContributions = allContributions.filter((c) => {
          const contributionYear = new Date(c.createdAt).getFullYear();
          return (
            c.memberId === member.id &&
            contributionYear === year &&
            c.status === "paid"
          );
        });

        const totalContributions = memberContributions.reduce(
          (sum, c) => sum + c.amount,
          0
        );

        // Total payout = contributions + equal share of profit
        const totalPayout = totalContributions + distribution.profitPerMember;

        memberDist = {
          id: uuid(),
          distributionId: distribution.id,
          memberId: member.id,
          memberName: `${member.first_name} ${member.last_name}` || member.username,
          totalContributions,
          profitShare: distribution.profitPerMember,
          totalPayout: Number(totalPayout.toFixed(2)),
          createdAt: new Date().toISOString(),
        };

        await this.distributionRepository.createMemberDistribution(memberDist);
        memberDistributions.push(memberDist);
      }
    }

    return memberDistributions;
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

    // Get member distributions
    const memberDistributions = await this.getDistributionBreakdown(params);

    // Update member balances (optional - or just record distribution)
    for (const memberDist of memberDistributions) {
      const member = await this.memberRepository.getById(memberDist.memberId);
      if (member) {
        // Add payout to member balance
        await this.memberRepository.update(member.id, {
          balance: member.balance + memberDist.totalPayout,
        });

        // Mark member distribution as paid
        await this.distributionRepository.updateMemberDistribution(memberDist.id, {
          paidAt: new Date().toISOString(),
        });
      }
    }

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

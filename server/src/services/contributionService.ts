import type { ContributionRepository, MemberRepository, PenaltyRepository, GroupRepository } from "../repositories/interfaces";
import type { Contribution, Penalty } from "../models/types";
import { createId } from "../utils/id";
import { ApiError } from "../utils/apiError";

export class ContributionService {
  constructor(
    private contributionRepository: ContributionRepository,
    private memberRepository: MemberRepository,
    private penaltyRepository: PenaltyRepository,
    private groupRepository: GroupRepository
  ) {}

  /**
   * Generate monthly contributions for all active members in a group
   * This should be called at the start of each month (automated job)
   */
  generateMonthlyContributions(params: {
    groupId: string;
    month: string; // Format: "YYYY-MM"
    amount: number;
    dueDate: string; // ISO date string
  }) {
    const members = this.memberRepository.listByGroup(params.groupId);
    const activeMembers = members.filter(m => m.status === "active");
    const generated: Contribution[] = [];

    for (const member of activeMembers) {
      // Check if contribution already exists for this member/month
      const existing = this.contributionRepository.listByMemberAndMonth(
        member.id,
        params.month
      );

      if (existing.length === 0) {
        const contribution: Contribution = {
          id: createId("contrib"),
          groupId: params.groupId,
          memberId: member.id,
          amount: params.amount,
          month: params.month,
          status: "unpaid",
          dueDate: params.dueDate,
          createdAt: new Date().toISOString(),
        };

        this.contributionRepository.create(contribution);
        generated.push(contribution);
      }
    }

    return generated;
  }

  /**
   * Record a contribution payment
   * This marks the contribution as paid and updates member balance
   */
  recordPayment(params: {
    contributionId: string;
    memberId: string;
    groupId: string;
  }) {
    const contribution = this.contributionRepository.getById(params.contributionId);
    if (!contribution) throw new ApiError("Contribution not found", 404);
    if (contribution.groupId !== params.groupId) throw new ApiError("Access denied", 403);
    if (contribution.memberId !== params.memberId) throw new ApiError("Access denied", 403);
    if (contribution.status === "paid") throw new ApiError("Contribution already paid", 400);

    const member = this.memberRepository.getById(params.memberId);
    if (!member) throw new ApiError("Member not found", 404);

    // Mark contribution as paid
    const updated = this.contributionRepository.update(contribution.id, {
      status: "paid",
      paidAt: new Date().toISOString(),
    });

    // Update member balance (savings)
    this.memberRepository.update(member.id, {
      balance: member.balance + contribution.amount,
    });

    return updated;
  }

  /**
   * Check for overdue contributions and mark them
   * This should be called daily (automated job)
   */
  markOverdueContributions(params: {
    groupId: string;
    autoGeneratePenalty?: boolean;
  }) {
    const now = new Date().toISOString();
    const contributions = this.contributionRepository.listByGroup(params.groupId);
    const overdueCount = { marked: 0, penaltiesGenerated: 0 };

    const group = this.groupRepository.getById(params.groupId);
    if (!group) throw new ApiError("Group not found", 404);

    for (const contribution of contributions) {
      if (contribution.status === "unpaid" && contribution.dueDate < now) {
        // Mark as overdue
        this.contributionRepository.update(contribution.id, {
          status: "overdue",
        });
        overdueCount.marked++;

        // Generate penalty if enabled
        if (params.autoGeneratePenalty && group.settings.contributionPenaltyRate > 0) {
          const existingPenalties = this.penaltyRepository.listByContribution(contribution.id);
          
          if (existingPenalties.length === 0) {
            const penaltyDueDate = new Date();
            penaltyDueDate.setDate(penaltyDueDate.getDate() + 7);

            // Calculate penalty as percentage of contribution amount
            const penaltyAmount = contribution.amount * group.settings.contributionPenaltyRate;

            const penalty: Penalty = {
              id: createId("penalty"),
              groupId: contribution.groupId,
              memberId: contribution.memberId,
              contributionId: contribution.id,
              amount: Number(penaltyAmount.toFixed(2)),
              reason: `Late contribution for ${contribution.month}`,
              status: "unpaid",
              dueDate: penaltyDueDate.toISOString(),
              isPaid: false,
              createdAt: new Date().toISOString(),
            };

            this.penaltyRepository.create(penalty);
            overdueCount.penaltiesGenerated++;

            // Update member penalties total
            const member = this.memberRepository.getById(contribution.memberId);
            if (member) {
              this.memberRepository.update(member.id, {
                penaltiesTotal: member.penaltiesTotal + Number(penaltyAmount.toFixed(2)),
              });
            }
          }
        }
      }
    }

    return overdueCount;
  }

  /**
   * Legacy method for admin to manually add contributions (deprecated)
   * Use generateMonthlyContributions instead
   */
  addContribution(params: {
    groupId: string;
    memberId: string;
    amount: number;
    month: string;
  }) {
    const member = this.memberRepository.getById(params.memberId);
    if (!member) throw new ApiError("Member not found", 404);
    if (member.groupId !== params.groupId) throw new ApiError("Access denied", 403);

    const existing = this.contributionRepository.listByMemberAndMonth(
      params.memberId,
      params.month
    );
    if (existing.length > 0) throw new ApiError("Contribution already recorded");

    // Calculate due date (end of the month)
    const [year, month] = params.month.split("-");
    const dueDate = new Date(parseInt(year), parseInt(month), 0).toISOString();

    const contribution: Contribution = {
      id: createId("contrib"),
      groupId: params.groupId,
      memberId: params.memberId,
      amount: params.amount,
      month: params.month,
      status: "paid", // Marked as paid immediately (legacy behavior)
      dueDate,
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
    };

    this.memberRepository.update(member.id, {
      balance: member.balance + params.amount,
    });

    return this.contributionRepository.create(contribution);
  }

  listByGroup(groupId: string) {
    return this.contributionRepository.listByGroup(groupId);
  }

  listByMember(memberId: string) {
    return this.contributionRepository.listByMember(memberId);
  }

  listUnpaidByGroup(groupId: string) {
    return this.contributionRepository.listUnpaidByGroup(groupId);
  }

  listOverdue(groupId: string) {
    return this.contributionRepository.listOverdue(groupId);
  }
}

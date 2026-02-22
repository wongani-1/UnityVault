import type {
  ContributionRepository,
  MemberRepository,
  PenaltyRepository,
  GroupRepository,
  TransactionRepository,
  LoanRepository,
} from "../repositories/interfaces";
import type { DistributionRepository } from "../repositories/interfaces/distributionRepository";
import type { Contribution, Penalty, Transaction } from "../models/types";
import { createId } from "../utils/id";
import { ApiError } from "../utils/apiError";
import { EmailService } from "./emailService";

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

const parseMonthToDate = (month: string) => {
  if (!MONTH_PATTERN.test(month)) return undefined;
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  return new Date(year, monthIndex, 1);
};

const formatMonth = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
};

const nextMonth = (month: string) => {
  const monthDate = parseMonthToDate(month);
  if (!monthDate) return undefined;
  const next = new Date(monthDate);
  next.setMonth(next.getMonth() + 1);
  return formatMonth(next);
};

export class ContributionService {
  constructor(
    private contributionRepository: ContributionRepository,
    private memberRepository: MemberRepository,
    private penaltyRepository: PenaltyRepository,
    private groupRepository: GroupRepository,
    private transactionRepository: TransactionRepository,
    private loanRepository: LoanRepository,
    private emailService: EmailService,
    private distributionRepository: DistributionRepository
  ) {}

  private async ensureCycleOpen(groupId: string, at = new Date()) {
    const year = at.getFullYear();
    const distribution = await this.distributionRepository.getByGroupAndYear(groupId, year);
    if (distribution?.status === "completed") {
      throw new ApiError(`Cycle ${year} is closed. No new transactions are allowed.`, 400);
    }
  }

  private getPaymentMethodLabel(
    paymentMethod: "airtel_money" | "tnm_mpamba" | "card"
  ): string | undefined {
    if (!paymentMethod) return undefined;
    if (paymentMethod === "airtel_money") return "Airtel Money";
    if (paymentMethod === "tnm_mpamba") return "TNM Mpamba";
    if (paymentMethod === "card") return "Card Payment";
    return undefined;
  }

  private extractPaymentMethodFromDescription(
    description?: string
  ): "airtel_money" | "tnm_mpamba" | "card" | undefined {
    if (!description) return undefined;
    const text = description.toLowerCase();
    if (text.includes("airtel money")) return "airtel_money";
    if (text.includes("tnm mpamba") || text.includes("mpamba")) return "tnm_mpamba";
    if (text.includes("card payment") || text.includes(" via card")) return "card";
    return undefined;
  }

  /**
   * Generate monthly contributions for all active members in a group
   * This should be called at the start of each month (automated job)
   */
  async generateMonthlyContributions(params: {
    groupId: string;
    month: string; // Format: "YYYY-MM"
    amount: number;
    dueDate: string; // ISO date string
  }) {
    await this.ensureCycleOpen(params.groupId);

    const requestedMonth = params.month?.trim();
    if (!requestedMonth || !MONTH_PATTERN.test(requestedMonth)) {
      throw new ApiError("Invalid month format. Use YYYY-MM", 400);
    }

    const dueDate = new Date(params.dueDate);
    if (Number.isNaN(dueDate.getTime())) {
      throw new ApiError("Invalid due date", 400);
    }

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    if (dueDateOnly < startOfToday) {
      throw new ApiError("Due date cannot be before today", 400);
    }

    const existingContributions = await this.contributionRepository.listByGroup(params.groupId);
    const generatedMonths = Array.from(
      new Set(
        existingContributions
          .map((contribution) => contribution.month)
          .filter((month) => MONTH_PATTERN.test(month))
      )
    );

    if (generatedMonths.length > 0) {
      const latestGeneratedMonth = generatedMonths.sort((a, b) => a.localeCompare(b)).at(-1)!;
      const expectedNextMonth = nextMonth(latestGeneratedMonth);

      if (!expectedNextMonth) {
        throw new ApiError("Failed to calculate next contribution month", 500);
      }

      if (requestedMonth !== expectedNextMonth) {
        throw new ApiError(
          `Contributions must be generated sequentially. Latest generated month is ${latestGeneratedMonth}, so the next month must be ${expectedNextMonth}`,
          400
        );
      }
    }

    const group = await this.groupRepository.getById(params.groupId);
    if (!group) throw new ApiError("Group not found", 404);

    const members = await this.memberRepository.listByGroup(params.groupId);
    const activeMembers = members.filter(m => m.status === "active");

    const missingSeed = activeMembers.filter((member) => !member.seedPaid);
    if (missingSeed.length > 0) {
      const preview = missingSeed.slice(0, 5).map((m) => `${m.first_name} ${m.last_name}`);
      const suffix = missingSeed.length > 5 ? ` +${missingSeed.length - 5} more` : "";
      throw new ApiError(
        `Seed deposit is required before generating contributions. Pending seed payments for: ${preview.join(", ")}${suffix}`,
        400
      );
    }

    await this.applyMonthlyCompulsoryInterest({
      groupId: params.groupId,
      month: requestedMonth,
      groupShareFee: group.settings.shareFee,
      compulsoryInterestRate: group.settings.compulsoryInterestRate,
    });
    const generated: Contribution[] = [];

    for (const member of activeMembers) {
      // Check if contribution already exists for this member/month
      const existing = await this.contributionRepository.listByMemberAndMonth(
        member.id,
        params.month
      );

      if (existing.length === 0) {
        const contribution: Contribution = {
          id: createId("contrib"),
          groupId: params.groupId,
          memberId: member.id,
          amount: params.amount,
          month: requestedMonth,
          status: "unpaid",
          dueDate: dueDate.toISOString(),
          createdAt: new Date().toISOString(),
        };

        await this.contributionRepository.create(contribution);
        generated.push(contribution);
      }
    }

    return generated;
  }

  /**
   * Record a contribution payment
   * This marks the contribution as paid and updates member balance
   */
  async recordPayment(params: {
    contributionId: string;
    memberId: string;
    groupId: string;
    requesterRole: "member" | "group_admin";
    paymentMethod: "airtel_money" | "tnm_mpamba" | "card";
  }) {
    const contribution = await this.contributionRepository.getById(params.contributionId);
    if (!contribution) throw new ApiError("Contribution not found", 404);
    if (contribution.groupId !== params.groupId) throw new ApiError("Access denied", 403);
    if (params.requesterRole === "member" && contribution.memberId !== params.memberId) {
      throw new ApiError("Access denied", 403);
    }
    if (contribution.status === "paid") throw new ApiError("Contribution already paid", 400);

    await this.ensureCycleOpen(params.groupId);

    const member = await this.memberRepository.getById(contribution.memberId);
    if (!member) throw new ApiError("Member not found", 404);

    if (!member.seedPaid) {
      throw new ApiError("Seed deposit is required before paying contributions", 400);
    }

    // Mark contribution as paid
    const updated = await this.contributionRepository.update(contribution.id, {
      status: "paid",
      paidAt: new Date().toISOString(),
    });

    // Update member balance (savings)
    const updatedMember = await this.memberRepository.update(member.id, {
      balance: member.balance + contribution.amount,
    });

    const paymentMethodLabel = this.getPaymentMethodLabel(params.paymentMethod);
    if (!paymentMethodLabel) {
      throw new ApiError("Invalid payment method", 400);
    }

    const ledgerEntry: Transaction = {
      id: createId("transaction"),
      groupId: params.groupId,
      memberId: member.id,
      type: "contribution",
      amount: contribution.amount,
      description: paymentMethodLabel
        ? `Contribution payment for ${contribution.month} via ${paymentMethodLabel}`
        : `Contribution payment for ${contribution.month}`,
      memberSavingsChange: contribution.amount,
      groupIncomeChange: 0,
      groupCashChange: contribution.amount,
      contributionId: contribution.id,
      createdAt: new Date().toISOString(),
      createdBy: params.memberId,
    };

    await this.transactionRepository.create(ledgerEntry);

    // Send payment confirmation email if member has email
    if (member.email && updated && updatedMember) {
      const group = await this.groupRepository.getById(params.groupId);
      const groupName = group?.name || "Your Group";
      
      // Send email asynchronously, don't block the response
      this.emailService.sendContributionConfirmation({
        to: member.email,
        memberName: `${member.first_name} ${member.last_name}`,
        groupName,
        amount: contribution.amount,
        month: contribution.month,
        transactionId: contribution.id,
        newBalance: updatedMember.balance,
      }).catch(error => {
        console.error("Failed to send payment confirmation email:", error);
      });
    }

    return updated;
  }

  /**
   * Automatically check for overdue contributions and apply penalties
   * Called automatically when contributions are accessed
   */
  async markOverdueContributions(params: {
    groupId: string;
    autoGeneratePenalty?: boolean;
  }) {
    const now = new Date().toISOString();
    const contributions = await this.contributionRepository.listByGroup(params.groupId);
    const overdueCount = { marked: 0, penaltiesGenerated: 0 };

    const group = await this.groupRepository.getById(params.groupId);
    if (!group) throw new ApiError("Group not found", 404);

    for (const contribution of contributions) {
      if (contribution.status === "unpaid" && contribution.dueDate < now) {
        // Mark as overdue
        await this.contributionRepository.update(contribution.id, {
          status: "overdue",
        });
        overdueCount.marked++;

        // Generate penalty if enabled
        if (params.autoGeneratePenalty && group.settings.contributionPenaltyRate > 0) {
          const existingPenalties = await this.penaltyRepository.listByContribution(contribution.id);
          
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

            await this.penaltyRepository.create(penalty);
            overdueCount.penaltiesGenerated++;

            const penaltyLedgerEntry: Transaction = {
              id: createId("transaction"),
              groupId: contribution.groupId,
              memberId: contribution.memberId,
              type: "penalty_charged",
              amount: Number(penaltyAmount.toFixed(2)),
              description: `Penalty charged for late contribution (${contribution.month})`,
              memberSavingsChange: 0,
              groupIncomeChange: 0,
              groupCashChange: 0,
              contributionId: contribution.id,
              penaltyId: penalty.id,
              createdAt: new Date().toISOString(),
              createdBy: "system",
            };

            await this.transactionRepository.create(penaltyLedgerEntry);

            // Update member penalties total
            const member = await this.memberRepository.getById(contribution.memberId);
            if (member) {
              await this.memberRepository.update(member.id, {
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
  async addContribution(params: {
    groupId: string;
    memberId: string;
    amount: number;
    month: string;
  }) {
    await this.ensureCycleOpen(params.groupId);

    const member = await this.memberRepository.getById(params.memberId);
    if (!member) throw new ApiError("Member not found", 404);
    if (member.groupId !== params.groupId) throw new ApiError("Access denied", 403);

    const existing = await this.contributionRepository.listByMemberAndMonth(
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

    const updatedMember = await this.memberRepository.update(member.id, {
      balance: member.balance + params.amount,
    });

    const createdContribution = await this.contributionRepository.create(contribution);

    const ledgerEntry: Transaction = {
      id: createId("transaction"),
      groupId: params.groupId,
      memberId: params.memberId,
      type: "contribution",
      amount: params.amount,
      description: `Manual contribution recorded for ${params.month}`,
      memberSavingsChange: params.amount,
      groupIncomeChange: 0,
      groupCashChange: params.amount,
      contributionId: createdContribution.id,
      createdAt: new Date().toISOString(),
      createdBy: params.memberId,
    };

    await this.transactionRepository.create(ledgerEntry);

    return createdContribution;
  }

  async listByGroup(groupId: string) {
    // Automatically process overdue contributions before returning data
    // This ensures penalties are applied without requiring manual admin action
    try {
      await this.markOverdueContributions({
        groupId,
        autoGeneratePenalty: true, // Always auto-generate penalties
      });
    } catch (error) {
      // Log error but don't fail the request
      console.error("Error processing overdue contributions:", error);
    }
    
    return this.contributionRepository.listByGroup(groupId);
  }

  async listByMember(memberId: string) {
    // Get member's group to run overdue check
    const member = await this.memberRepository.getById(memberId);
    if (member) {
      try {
        await this.markOverdueContributions({
          groupId: member.groupId,
          autoGeneratePenalty: true,
        });
      } catch (error) {
        console.error("Error processing overdue contributions:", error);
      }
    }
    
    const [contributions, transactions] = await Promise.all([
      this.contributionRepository.listByMember(memberId),
      this.transactionRepository.listByMember(memberId),
    ]);

    const contributionPaymentTx = transactions
      .filter((tx) => tx.type === "contribution" && tx.contributionId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const methodByContributionId = new Map<
      string,
      "airtel_money" | "tnm_mpamba" | "card"
    >();

    contributionPaymentTx.forEach((tx) => {
      if (!tx.contributionId || methodByContributionId.has(tx.contributionId)) return;
      const parsed = this.extractPaymentMethodFromDescription(tx.description);
      if (parsed) {
        methodByContributionId.set(tx.contributionId, parsed);
      }
    });

    return contributions.map((contribution) => ({
      ...contribution,
      paymentMethod: contribution.paidAt
        ? methodByContributionId.get(contribution.id)
        : undefined,
    }));
  }

  async listUnpaidByGroup(groupId: string) {
    return this.contributionRepository.listUnpaidByGroup(groupId);
  }

  async listOverdue(groupId: string) {
    return this.contributionRepository.listOverdue(groupId);
  }

  private async applyMonthlyCompulsoryInterest(params: {
    groupId: string;
    month: string;
    groupShareFee: number;
    compulsoryInterestRate: number;
  }) {
    if (params.groupShareFee <= 0 || params.compulsoryInterestRate <= 0) return;

    const [members, loans] = await Promise.all([
      this.memberRepository.listByGroup(params.groupId),
      this.loanRepository.listByGroup(params.groupId),
    ]);

    const activeMembers = members.filter((member) => member.status === "active");
    const loansByMember = new Map<string, boolean>();
    loans.forEach((loan) => {
      if (["pending", "approved", "active"].includes(loan.status)) {
        loansByMember.set(loan.memberId, true);
      }
    });

    const [yearText, monthText] = params.month.split("-");
    const monthIndex = Number(monthText) - 1;
    const year = Number(yearText);
    const endOfMonth = new Date(year, monthIndex + 1, 0);

    for (const member of activeMembers) {
      if (loansByMember.get(member.id)) continue;
      if (!member.sharesOwned || member.sharesOwned <= 0) continue;

      const shareValue = member.sharesOwned * params.groupShareFee;
      const interestAmount = Number((shareValue * params.compulsoryInterestRate).toFixed(2));
      if (interestAmount <= 0) continue;

      const existingPenalties = await this.penaltyRepository.listByMember(member.id);
      const alreadyCharged = existingPenalties.some((penalty) => {
        if (!penalty.reason?.toLowerCase().includes("compulsory interest")) return false;
        if (!penalty.createdAt) return false;
        return penalty.createdAt.startsWith(params.month);
      });

      if (alreadyCharged) continue;

      const penaltyId = createId("penalty");
      await this.penaltyRepository.create({
        id: penaltyId,
        groupId: params.groupId,
        memberId: member.id,
        amount: interestAmount,
        reason: `Compulsory interest on share value for ${params.month}`,
        status: "unpaid",
        dueDate: endOfMonth.toISOString(),
        createdAt: new Date().toISOString(),
        isPaid: false,
      });

      const penaltyLedgerEntry: Transaction = {
        id: createId("transaction"),
        groupId: params.groupId,
        memberId: member.id,
        type: "compulsory_interest",
        amount: interestAmount,
        description: `Compulsory interest charge for ${params.month}`,
        memberSavingsChange: 0,
        groupIncomeChange: 0,
        groupCashChange: 0,
        penaltyId,
        createdAt: new Date().toISOString(),
        createdBy: "system",
      };

      await this.transactionRepository.create(penaltyLedgerEntry);

      await this.memberRepository.update(member.id, {
        penaltiesTotal: member.penaltiesTotal + interestAmount,
      });
    }
  }
}

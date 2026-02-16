import type { 
  PenaltyRepository, 
  MemberRepository,
  GroupRepository,
  TransactionRepository 
} from "../repositories/interfaces";
import type { Penalty, Transaction } from "../models/types";
import { createId } from "../utils/id";
import { ApiError } from "../utils/apiError";

export class PenaltyService {
  constructor(
    private penaltyRepository: PenaltyRepository,
    private memberRepository: MemberRepository,
    private groupRepository: GroupRepository,
    private transactionRepository: TransactionRepository
  ) {}

  async create(params: Omit<Penalty, "id" | "createdAt" | "isPaid" | "status" | "dueDate">) {
    const member = await this.memberRepository.getById(params.memberId);
    if (!member) throw new ApiError("Member not found", 404);

    // Set due date to 7 days from now by default
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    const penalty: Penalty = {
      ...params,
      id: createId("penalty"),
      status: "unpaid",
      dueDate: dueDate.toISOString(),
      createdAt: new Date().toISOString(),
      isPaid: false,
    };

    await this.memberRepository.update(member.id, {
      penaltiesTotal: member.penaltiesTotal + penalty.amount,
    });

    return this.penaltyRepository.create(penalty);
  }

  async listByGroup(groupId: string) {
    return this.penaltyRepository.listByGroup(groupId);
  }

  async listByMember(memberId: string) {
    return this.penaltyRepository.listByMember(memberId);
  }

  async payPenalty(penaltyId: string, memberId: string, actorId: string) {
    const penalty = await this.penaltyRepository.getById(penaltyId);
    if (!penalty) throw new ApiError("Penalty not found", 404);
    if (penalty.memberId !== memberId) throw new ApiError("Unauthorized to pay this penalty", 403);
    if (penalty.isPaid || penalty.status === "paid") throw new ApiError("Penalty already paid", 400);

    const member = await this.memberRepository.getById(memberId);
    if (!member) throw new ApiError("Member not found", 404);

    const group = await this.groupRepository.getById(penalty.groupId);
    if (!group) throw new ApiError("Group not found", 404);

    const paidAt = new Date().toISOString();

    // Update penalty status
    const updatedPenalty = await this.penaltyRepository.update(penaltyId, { 
      isPaid: true,
      status: "paid",
      paidAt 
    });

    // Update member's penalties total
    await this.memberRepository.update(memberId, {
      penaltiesTotal: member.penaltiesTotal - penalty.amount,
    });

    // Create transaction record for penalty payment
    // IMPORTANT: Penalty payments increase Group Income, NOT Member Savings
    const transaction: Transaction = {
      id: createId("transaction"),
      groupId: penalty.groupId,
      memberId: memberId,
      type: "penalty_payment",
      amount: penalty.amount,
      description: `Penalty payment: ${penalty.reason}`,
      memberSavingsChange: 0, // Penalties do NOT increase member savings
      groupIncomeChange: penalty.amount, // Penalties increase group income
      groupCashChange: penalty.amount, // Cash increases as payment is received
      penaltyId: penalty.id,
      contributionId: penalty.contributionId,
      installmentId: penalty.installmentId,
      loanId: penalty.loanId,
      createdAt: paidAt,
      createdBy: actorId,
    };

    await this.transactionRepository.create(transaction);

    // Update group financials
    await this.groupRepository.update(penalty.groupId, {
      totalIncome: group.totalIncome + penalty.amount,
      cash: group.cash + penalty.amount,
    });

    return updatedPenalty;
  }

  async getById(id: string) {
    return this.penaltyRepository.getById(id);
  }
}

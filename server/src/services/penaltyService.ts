import type { PenaltyRepository, MemberRepository } from "../repositories/interfaces";
import type { Penalty } from "../models/types";
import { createId } from "../utils/id";
import { ApiError } from "../utils/apiError";

export class PenaltyService {
  constructor(
    private penaltyRepository: PenaltyRepository,
    private memberRepository: MemberRepository
  ) {}

  create(params: Omit<Penalty, "id" | "createdAt" | "isPaid">) {
    const member = this.memberRepository.getById(params.memberId);
    if (!member) throw new ApiError("Member not found", 404);

    const penalty: Penalty = {
      ...params,
      id: createId("penalty"),
      createdAt: new Date().toISOString(),
      isPaid: false,
    };

    this.memberRepository.update(member.id, {
      penaltiesTotal: member.penaltiesTotal + penalty.amount,
    });

    return this.penaltyRepository.create(penalty);
  }

  listByGroup(groupId: string) {
    return this.penaltyRepository.listByGroup(groupId);
  }
}

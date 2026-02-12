import type { ContributionRepository, MemberRepository } from "../repositories/interfaces";
import type { Contribution } from "../models/types";
import { createId } from "../utils/id";
import { ApiError } from "../utils/apiError";

export class ContributionService {
  constructor(
    private contributionRepository: ContributionRepository,
    private memberRepository: MemberRepository
  ) {}

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

    const contribution: Contribution = {
      id: createId("contrib"),
      groupId: params.groupId,
      memberId: params.memberId,
      amount: params.amount,
      month: params.month,
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
}

import type { Penalty } from "../../models/types";

export type PenaltyRepository = {
  create: (penalty: Penalty) => Penalty;
  getById: (id: string) => Penalty | undefined;
  update: (id: string, updates: Partial<Penalty>) => Penalty | undefined;
  listByMember: (memberId: string) => Penalty[];
  listByGroup: (groupId: string) => Penalty[];
  listByContribution: (contributionId: string) => Penalty[];
  listByInstallment: (installmentId: string) => Penalty[];
};

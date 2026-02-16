import type { Penalty } from "../../models/types";

export type PenaltyRepository = {
  create: (penalty: Penalty) => Promise<Penalty>;
  getById: (id: string) => Promise<Penalty | undefined>;
  update: (id: string, updates: Partial<Penalty>) => Promise<Penalty | undefined>;
  listByMember: (memberId: string) => Promise<Penalty[]>;
  listByGroup: (groupId: string) => Promise<Penalty[]>;
  listByContribution: (contributionId: string) => Promise<Penalty[]>;
  listByInstallment: (installmentId: string) => Promise<Penalty[]>;
};

import type { Contribution } from "../../models/types";

export type ContributionRepository = {
  create: (contribution: Contribution) => Promise<Contribution>;
  getById: (id: string) => Promise<Contribution | undefined>;
  update: (id: string, updates: Partial<Contribution>) => Promise<Contribution | undefined>;
  listByMemberAndMonth: (memberId: string, month: string) => Promise<Contribution[]>;
  listByMember: (memberId: string) => Promise<Contribution[]>;
  listByGroup: (groupId: string) => Promise<Contribution[]>;
  listOverdue: (groupId: string) => Promise<Contribution[]>;
  listUnpaidByGroup: (groupId: string) => Promise<Contribution[]>;
};

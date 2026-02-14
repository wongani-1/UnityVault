import type { Contribution } from "../../models/types";

export type ContributionRepository = {
  create: (contribution: Contribution) => Contribution;
  getById: (id: string) => Contribution | undefined;
  update: (id: string, updates: Partial<Contribution>) => Contribution | undefined;
  listByMemberAndMonth: (memberId: string, month: string) => Contribution[];
  listByMember: (memberId: string) => Contribution[];
  listByGroup: (groupId: string) => Contribution[];
  listOverdue: (groupId: string) => Contribution[];
  listUnpaidByGroup: (groupId: string) => Contribution[];
};

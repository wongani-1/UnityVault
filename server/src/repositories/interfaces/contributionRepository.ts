import type { Contribution } from "../../models/types";

export type ContributionRepository = {
  create: (contribution: Contribution) => Contribution;
  listByMemberAndMonth: (memberId: string, month: string) => Contribution[];
  listByMember: (memberId: string) => Contribution[];
  listByGroup: (groupId: string) => Contribution[];
};

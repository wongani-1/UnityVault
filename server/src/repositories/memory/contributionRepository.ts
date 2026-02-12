import type { ContributionRepository } from "../interfaces/contributionRepository";
import type { Contribution } from "../../models/types";
import { store } from "./store";

export const contributionRepository: ContributionRepository = {
  create(contribution: Contribution) {
    store.contributions.set(contribution.id, contribution);
    return contribution;
  },
  listByMemberAndMonth(memberId: string, month: string) {
    return Array.from(store.contributions.values()).filter(
      (contribution) =>
        contribution.memberId === memberId && contribution.month === month
    );
  },
  listByMember(memberId: string) {
    return Array.from(store.contributions.values()).filter(
      (contribution) => contribution.memberId === memberId
    );
  },
  listByGroup(groupId: string) {
    return Array.from(store.contributions.values()).filter(
      (contribution) => contribution.groupId === groupId
    );
  },
};

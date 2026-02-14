import type { ContributionRepository } from "../interfaces/contributionRepository";
import type { Contribution } from "../../models/types";
import { store } from "./store";

export const contributionRepository: ContributionRepository = {
  create(contribution: Contribution) {
    store.contributions.set(contribution.id, contribution);
    return contribution;
  },
  getById(id: string) {
    return store.contributions.get(id);
  },
  update(id: string, updates: Partial<Contribution>) {
    const contribution = store.contributions.get(id);
    if (!contribution) return undefined;
    const updated = { ...contribution, ...updates };
    store.contributions.set(id, updated);
    return updated;
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
  listOverdue(groupId: string) {
    const now = new Date().toISOString();
    return Array.from(store.contributions.values()).filter(
      (contribution) =>
        contribution.groupId === groupId &&
        contribution.status === "unpaid" &&
        contribution.dueDate < now
    );
  },
  listUnpaidByGroup(groupId: string) {
    return Array.from(store.contributions.values()).filter(
      (contribution) =>
        contribution.groupId === groupId &&
        (contribution.status === "unpaid" || contribution.status === "overdue")
    );
  },
};

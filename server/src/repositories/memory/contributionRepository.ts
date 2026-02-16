import type { ContributionRepository } from "../interfaces/contributionRepository";
import type { Contribution } from "../../models/types";
import { store } from "./store";

export const contributionRepository: ContributionRepository = {
  async create(contribution: Contribution) {
    store.contributions.set(contribution.id, contribution);
    return contribution;
  },
  async getById(id: string) {
    return store.contributions.get(id);
  },
  async update(id: string, updates: Partial<Contribution>) {
    const contribution = store.contributions.get(id);
    if (!contribution) return undefined;
    const updated = { ...contribution, ...updates };
    store.contributions.set(id, updated);
    return updated;
  },
  async listByMemberAndMonth(memberId: string, month: string) {
    return Array.from(store.contributions.values()).filter(
      (contribution) =>
        contribution.memberId === memberId && contribution.month === month
    );
  },
  async listByMember(memberId: string) {
    return Array.from(store.contributions.values()).filter(
      (contribution) => contribution.memberId === memberId
    );
  },
  async listByGroup(groupId: string) {
    return Array.from(store.contributions.values()).filter(
      (contribution) => contribution.groupId === groupId
    );
  },
  async listOverdue(groupId: string) {
    const now = new Date().toISOString();
    return Array.from(store.contributions.values()).filter(
      (contribution) =>
        contribution.groupId === groupId &&
        contribution.status === "unpaid" &&
        contribution.dueDate < now
    );
  },
  async listUnpaidByGroup(groupId: string) {
    return Array.from(store.contributions.values()).filter(
      (contribution) =>
        contribution.groupId === groupId &&
        (contribution.status === "unpaid" || contribution.status === "overdue")
    );
  },
};

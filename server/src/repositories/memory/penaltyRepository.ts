import type { PenaltyRepository } from "../interfaces/penaltyRepository";
import type { Penalty } from "../../models/types";
import { store } from "./store";

export const penaltyRepository: PenaltyRepository = {
  async create(penalty: Penalty) {
    store.penalties.set(penalty.id, penalty);
    return penalty;
  },
  async getById(id: string) {
    return store.penalties.get(id);
  },
  async update(id: string, updates: Partial<Penalty>) {
    const existing = store.penalties.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    store.penalties.set(id, updated);
    return updated;
  },
  async listByMember(memberId: string) {
    return Array.from(store.penalties.values()).filter(
      (penalty) => penalty.memberId === memberId
    );
  },
  async listByGroup(groupId: string) {
    return Array.from(store.penalties.values()).filter(
      (penalty) => penalty.groupId === groupId
    );
  },
  async listByContribution(contributionId: string) {
    return Array.from(store.penalties.values()).filter(
      (penalty) => penalty.contributionId === contributionId
    );
  },
  async listByInstallment(installmentId: string) {
    return Array.from(store.penalties.values()).filter(
      (penalty) => penalty.installmentId === installmentId
    );
  },
};

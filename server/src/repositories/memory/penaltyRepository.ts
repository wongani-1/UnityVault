import type { PenaltyRepository } from "../interfaces/penaltyRepository";
import type { Penalty } from "../../models/types";
import { store } from "./store";

export const penaltyRepository: PenaltyRepository = {
  create(penalty: Penalty) {
    store.penalties.set(penalty.id, penalty);
    return penalty;
  },
  getById(id: string) {
    return store.penalties.get(id);
  },
  update(id: string, updates: Partial<Penalty>) {
    const existing = store.penalties.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    store.penalties.set(id, updated);
    return updated;
  },
  listByMember(memberId: string) {
    return Array.from(store.penalties.values()).filter(
      (penalty) => penalty.memberId === memberId
    );
  },
  listByGroup(groupId: string) {
    return Array.from(store.penalties.values()).filter(
      (penalty) => penalty.groupId === groupId
    );
  },
  listByContribution(contributionId: string) {
    return Array.from(store.penalties.values()).filter(
      (penalty) => penalty.contributionId === contributionId
    );
  },
  listByInstallment(installmentId: string) {
    return Array.from(store.penalties.values()).filter(
      (penalty) => penalty.installmentId === installmentId
    );
  },
};

import type { LoanRepository } from "../interfaces/loanRepository";
import type { Loan } from "../../models/types";
import { store } from "./store";

export const loanRepository: LoanRepository = {
  async create(loan: Loan) {
    store.loans.set(loan.id, loan);
    return loan;
  },
  async getById(id: string) {
    return store.loans.get(id);
  },
  async listByGroup(groupId: string) {
    return Array.from(store.loans.values()).filter(
      (loan) => loan.groupId === groupId
    );
  },
  async listByMember(memberId: string) {
    return Array.from(store.loans.values()).filter(
      (loan) => loan.memberId === memberId
    );
  },
  async update(id: string, patch: Partial<Loan>) {
    const current = store.loans.get(id);
    if (!current) return undefined;
    const updated = { ...current, ...patch };
    store.loans.set(id, updated);
    return updated;
  },
};

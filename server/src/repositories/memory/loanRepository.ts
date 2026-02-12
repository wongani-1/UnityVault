import type { LoanRepository } from "../interfaces/loanRepository";
import type { Loan } from "../../models/types";
import { store } from "./store";

export const loanRepository: LoanRepository = {
  create(loan: Loan) {
    store.loans.set(loan.id, loan);
    return loan;
  },
  getById(id: string) {
    return store.loans.get(id);
  },
  listByGroup(groupId: string) {
    return Array.from(store.loans.values()).filter(
      (loan) => loan.groupId === groupId
    );
  },
  update(id: string, patch: Partial<Loan>) {
    const current = store.loans.get(id);
    if (!current) return undefined;
    const updated = { ...current, ...patch };
    store.loans.set(id, updated);
    return updated;
  },
};

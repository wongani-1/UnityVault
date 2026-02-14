import type { Loan } from "../../models/types";

export type LoanRepository = {
  create: (loan: Loan) => Loan;
  getById: (id: string) => Loan | undefined;
  listByGroup: (groupId: string) => Loan[];
  listByMember: (memberId: string) => Loan[];
  update: (id: string, patch: Partial<Loan>) => Loan | undefined;
};

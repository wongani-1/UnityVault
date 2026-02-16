import type { Loan } from "../../models/types";

export type LoanRepository = {
  create: (loan: Loan) => Promise<Loan>;
  getById: (id: string) => Promise<Loan | undefined>;
  listByGroup: (groupId: string) => Promise<Loan[]>;
  listByMember: (memberId: string) => Promise<Loan[]>;
  update: (id: string, patch: Partial<Loan>) => Promise<Loan | undefined>;
};

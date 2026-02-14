import type { Transaction } from "../../models/types";

export type TransactionRepository = {
  create: (transaction: Transaction) => Transaction;
  getById: (id: string) => Transaction | undefined;
  listByGroup: (groupId: string) => Transaction[];
  listByMember: (memberId: string) => Transaction[];
  listByType: (groupId: string, type: string) => Transaction[];
};

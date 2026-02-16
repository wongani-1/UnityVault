import type { Transaction } from "../../models/types";

export type TransactionRepository = {
  create: (transaction: Transaction) => Promise<Transaction>;
  getById: (id: string) => Promise<Transaction | undefined>;
  listByGroup: (groupId: string) => Promise<Transaction[]>;
  listByMember: (memberId: string) => Promise<Transaction[]>;
  listByType: (groupId: string, type: string) => Promise<Transaction[]>;
};

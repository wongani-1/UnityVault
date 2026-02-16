import type { TransactionRepository } from "../interfaces/transactionRepository";
import type { Transaction } from "../../models/types";
import { store } from "./store";

export const transactionRepository: TransactionRepository = {
  async create(transaction: Transaction) {
    store.transactions.set(transaction.id, transaction);
    return transaction;
  },
  async getById(id: string) {
    return store.transactions.get(id);
  },
  async listByGroup(groupId: string) {
    return Array.from(store.transactions.values()).filter(
      (t) => t.groupId === groupId
    );
  },
  async listByMember(memberId: string) {
    return Array.from(store.transactions.values()).filter(
      (t) => t.memberId === memberId
    );
  },
  async listByType(groupId: string, type: string) {
    return Array.from(store.transactions.values()).filter(
      (t) => t.groupId === groupId && t.type === type
    );
  },
};

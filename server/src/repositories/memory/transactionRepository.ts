import type { TransactionRepository } from "../interfaces/transactionRepository";
import type { Transaction } from "../../models/types";
import { store } from "./store";

export const transactionRepository: TransactionRepository = {
  create(transaction: Transaction) {
    store.transactions.set(transaction.id, transaction);
    return transaction;
  },
  getById(id: string) {
    return store.transactions.get(id);
  },
  listByGroup(groupId: string) {
    return Array.from(store.transactions.values()).filter(
      (t) => t.groupId === groupId
    );
  },
  listByMember(memberId: string) {
    return Array.from(store.transactions.values()).filter(
      (t) => t.memberId === memberId
    );
  },
  listByType(groupId: string, type: string) {
    return Array.from(store.transactions.values()).filter(
      (t) => t.groupId === groupId && t.type === type
    );
  },
};

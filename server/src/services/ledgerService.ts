import type { TransactionRepository } from "../repositories/interfaces";
import type { Role, Transaction, TransactionType } from "../models/types";

export type LedgerQuery = {
  groupId: string;
  role: Role;
  requesterId: string;
  memberId?: string;
  type?: TransactionType;
  from?: string;
  to?: string;
  limit?: number;
};

export class LedgerService {
  constructor(private transactionRepository: TransactionRepository) {}

  async listEntries(params: LedgerQuery): Promise<Transaction[]> {
    const limit = Math.min(Math.max(params.limit || 100, 1), 500);

    const baseItems =
      params.role === "member"
        ? await this.transactionRepository.listByMember(params.requesterId)
        : await this.transactionRepository.listByGroup(params.groupId);

    const memberScope = params.role === "member" ? params.requesterId : params.memberId;

    const fromDate = params.from ? new Date(params.from) : undefined;
    const toDate = params.to ? new Date(params.to) : undefined;

    const filtered = baseItems.filter((item) => {
      if (memberScope && item.memberId !== memberScope) return false;
      if (params.type && item.type !== params.type) return false;

      const createdAt = new Date(item.createdAt);
      if (fromDate && createdAt < fromDate) return false;
      if (toDate && createdAt > toDate) return false;

      return true;
    });

    return filtered
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
}

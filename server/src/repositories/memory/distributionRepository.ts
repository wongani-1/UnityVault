import type { DistributionRepository } from "../interfaces/distributionRepository";
import type { Distribution, MemberDistribution } from "../../models/distribution";
import { store } from "./store";

export const distributionRepository: DistributionRepository = {
  async create(distribution: Distribution) {
    store.distributions.set(distribution.id, distribution);
    return distribution;
  },

  async getById(id: string) {
    return store.distributions.get(id);
  },

  async getByGroupAndYear(groupId: string, year: number) {
    return Array.from(store.distributions.values()).find(
      (d) => d.groupId === groupId && d.year === year
    );
  },

  async update(id: string, updates: Partial<Distribution>) {
    const distribution = store.distributions.get(id);
    if (!distribution) return undefined;
    const updated = { ...distribution, ...updates };
    store.distributions.set(id, updated);
    return updated;
  },

  async listByGroup(groupId: string) {
    return Array.from(store.distributions.values())
      .filter((d) => d.groupId === groupId)
      .sort((a, b) => b.year - a.year);
  },

  async createMemberDistribution(memberDistribution: MemberDistribution) {
    store.memberDistributions.set(memberDistribution.id, memberDistribution);
    return memberDistribution;
  },

  async getMemberDistributionById(id: string) {
    return store.memberDistributions.get(id);
  },

  async updateMemberDistribution(id: string, updates: Partial<MemberDistribution>) {
    const memberDistribution = store.memberDistributions.get(id);
    if (!memberDistribution) return undefined;
    const updated = { ...memberDistribution, ...updates };
    store.memberDistributions.set(id, updated);
    return updated;
  },

  async listMemberDistributionsByDistribution(distributionId: string) {
    return Array.from(store.memberDistributions.values()).filter(
      (md) => md.distributionId === distributionId
    );
  },

  async listMemberDistributionsByMember(memberId: string) {
    return Array.from(store.memberDistributions.values())
      .filter((md) => md.memberId === memberId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
};

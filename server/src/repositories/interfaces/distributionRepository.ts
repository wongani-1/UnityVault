import type { Distribution, MemberDistribution } from "../../models/distribution";

export type DistributionRepository = {
  create: (distribution: Distribution) => Promise<Distribution>;
  getById: (id: string) => Promise<Distribution | undefined>;
  getByGroupAndYear: (groupId: string, year: number) => Promise<Distribution | undefined>;
  update: (id: string, updates: Partial<Distribution>) => Promise<Distribution | undefined>;
  listByGroup: (groupId: string) => Promise<Distribution[]>;
  
  createMemberDistribution: (memberDistribution: MemberDistribution) => Promise<MemberDistribution>;
  getMemberDistributionById: (id: string) => Promise<MemberDistribution | undefined>;
  updateMemberDistribution: (id: string, updates: Partial<MemberDistribution>) => Promise<MemberDistribution | undefined>;
  listMemberDistributionsByDistribution: (distributionId: string) => Promise<MemberDistribution[]>;
  listMemberDistributionsByMember: (memberId: string) => Promise<MemberDistribution[]>;
};

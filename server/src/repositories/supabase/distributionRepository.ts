import type { DistributionRepository } from "../interfaces/distributionRepository";
import type { Distribution, MemberDistribution } from "../../models/distribution";
import { requireSupabase } from "../../db/supabaseClient";

// Mapper functions for Distribution
function toDistributionRow(distribution: Distribution) {
  return {
    id: distribution.id,
    group_id: distribution.groupId,
    year: distribution.year,
    total_contributions: distribution.totalContributions,
    total_profit_pool: distribution.totalProfitPool,
    total_loan_interest: distribution.totalLoanInterest,
    total_penalties: distribution.totalPenalties,
    number_of_members: distribution.numberOfMembers,
    profit_per_member: distribution.profitPerMember,
    status: distribution.status,
    distributed_at: distribution.distributedAt,
    created_at: distribution.createdAt,
  };
}

function fromDistributionRow(row: any): Distribution {
  return {
    id: row.id,
    groupId: row.group_id,
    year: row.year,
    totalContributions: row.total_contributions,
    totalProfitPool: row.total_profit_pool,
    totalLoanInterest: row.total_loan_interest,
    totalPenalties: row.total_penalties,
    numberOfMembers: row.number_of_members,
    profitPerMember: row.profit_per_member,
    status: row.status,
    distributedAt: row.distributed_at,
    createdAt: row.created_at,
  };
}

// Mapper functions for MemberDistribution
function toMemberDistributionRow(memberDistribution: MemberDistribution) {
  return {
    id: memberDistribution.id,
    distribution_id: memberDistribution.distributionId,
    member_id: memberDistribution.memberId,
    member_name: memberDistribution.memberName,
    total_contributions: memberDistribution.totalContributions,
    profit_share: memberDistribution.profitShare,
    total_payout: memberDistribution.totalPayout,
    paid_at: memberDistribution.paidAt,
    created_at: memberDistribution.createdAt,
  };
}

function fromMemberDistributionRow(row: any): MemberDistribution {
  return {
    id: row.id,
    distributionId: row.distribution_id,
    memberId: row.member_id,
    memberName: row.member_name,
    totalContributions: row.total_contributions,
    profitShare: row.profit_share,
    totalPayout: row.total_payout,
    paidAt: row.paid_at,
    createdAt: row.created_at,
  };
}

export const distributionRepository: DistributionRepository = {
  async create(distribution: Distribution) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("distributions")
      .insert(toDistributionRow(distribution))
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return fromDistributionRow(data);
  },

  async getById(id: string) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("distributions")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromDistributionRow(data) : undefined;
  },

  async getByGroupAndYear(groupId: string, year: number) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("distributions")
      .select("*")
      .eq("group_id", groupId)
      .eq("year", year)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromDistributionRow(data) : undefined;
  },

  async update(id: string, updates: Partial<Distribution>) {
    const supabase = requireSupabase();
    const patch: any = {};
    if (updates.status !== undefined) patch.status = updates.status;
    if (updates.distributedAt !== undefined) patch.distributed_at = updates.distributedAt;
    
    const { data, error } = await supabase
      .from("distributions")
      .update(patch)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromDistributionRow(data) : undefined;
  },

  async listByGroup(groupId: string) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("distributions")
      .select("*")
      .eq("group_id", groupId)
      .order("year", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(fromDistributionRow);
  },

  async createMemberDistribution(memberDistribution: MemberDistribution) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("member_distributions")
      .insert(toMemberDistributionRow(memberDistribution))
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return fromMemberDistributionRow(data);
  },

  async getMemberDistributionById(id: string) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("member_distributions")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromMemberDistributionRow(data) : undefined;
  },

  async updateMemberDistribution(id: string, updates: Partial<MemberDistribution>) {
    const supabase = requireSupabase();
    const patch: any = {};
    if (updates.paidAt !== undefined) patch.paid_at = updates.paidAt;
    
    const { data, error } = await supabase
      .from("member_distributions")
      .update(patch)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromMemberDistributionRow(data) : undefined;
  },

  async listMemberDistributionsByDistribution(distributionId: string) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("member_distributions")
      .select("*")
      .eq("distribution_id", distributionId);
    if (error) throw new Error(error.message);
    return (data || []).map(fromMemberDistributionRow);
  },

  async listMemberDistributionsByMember(memberId: string) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("member_distributions")
      .select("*")
      .eq("member_id", memberId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(fromMemberDistributionRow);
  },
};

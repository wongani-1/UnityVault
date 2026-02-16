import type { ContributionRepository } from "../interfaces/contributionRepository";
import { requireSupabase } from "../../db/supabaseClient";
import { fromContributionRow, toContributionPatch, toContributionRow } from "./mappers";

export const contributionRepository: ContributionRepository = {
  async create(contribution) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("contributions")
      .insert(toContributionRow(contribution))
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return fromContributionRow(data);
  },
  async getById(id) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("contributions")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromContributionRow(data) : undefined;
  },
  async update(id, updates) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("contributions")
      .update(toContributionPatch(updates))
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromContributionRow(data) : undefined;
  },
  async listByMemberAndMonth(memberId, month) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("contributions")
      .select("*")
      .eq("member_id", memberId)
      .eq("month", month);
    if (error) throw new Error(error.message);
    return (data || []).map(fromContributionRow);
  },
  async listByMember(memberId) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("contributions")
      .select("*")
      .eq("member_id", memberId);
    if (error) throw new Error(error.message);
    return (data || []).map(fromContributionRow);
  },
  async listByGroup(groupId) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("contributions")
      .select("*")
      .eq("group_id", groupId);
    if (error) throw new Error(error.message);
    return (data || []).map(fromContributionRow);
  },
  async listOverdue(groupId) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("contributions")
      .select("*")
      .eq("group_id", groupId)
      .eq("status", "unpaid")
      .lt("due_date", new Date().toISOString());
    if (error) throw new Error(error.message);
    return (data || []).map(fromContributionRow);
  },
  async listUnpaidByGroup(groupId) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("contributions")
      .select("*")
      .eq("group_id", groupId)
      .in("status", ["unpaid", "overdue"]);
    if (error) throw new Error(error.message);
    return (data || []).map(fromContributionRow);
  },
};

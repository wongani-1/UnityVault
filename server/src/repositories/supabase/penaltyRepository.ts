import type { PenaltyRepository } from "../interfaces/penaltyRepository";
import { requireSupabase } from "../../db/supabaseClient";
import { fromPenaltyRow, toPenaltyPatch, toPenaltyRow } from "./mappers";

export const penaltyRepository: PenaltyRepository = {
  async create(penalty) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("penalties")
      .insert(toPenaltyRow(penalty))
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return fromPenaltyRow(data);
  },
  async getById(id) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("penalties")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromPenaltyRow(data) : undefined;
  },
  async update(id, updates) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("penalties")
      .update(toPenaltyPatch(updates))
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromPenaltyRow(data) : undefined;
  },
  async listByMember(memberId) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("penalties")
      .select("*")
      .eq("member_id", memberId);
    if (error) throw new Error(error.message);
    return (data || []).map(fromPenaltyRow);
  },
  async listByGroup(groupId) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("penalties")
      .select("*")
      .eq("group_id", groupId);
    if (error) throw new Error(error.message);
    return (data || []).map(fromPenaltyRow);
  },
  async listByContribution(contributionId) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("penalties")
      .select("*")
      .eq("contribution_id", contributionId);
    if (error) throw new Error(error.message);
    return (data || []).map(fromPenaltyRow);
  },
  async listByInstallment(installmentId) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("penalties")
      .select("*")
      .eq("installment_id", installmentId);
    if (error) throw new Error(error.message);
    return (data || []).map(fromPenaltyRow);
  },
};

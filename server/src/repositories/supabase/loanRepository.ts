import type { LoanRepository } from "../interfaces/loanRepository";
import { requireSupabase } from "../../db/supabaseClient";
import { fromLoanRow, toLoanPatch, toLoanRow } from "./mappers";

export const loanRepository: LoanRepository = {
  async create(loan) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("loans")
      .insert(toLoanRow(loan))
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return fromLoanRow(data);
  },
  async getById(id) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("loans")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromLoanRow(data) : undefined;
  },
  async listByGroup(groupId) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("loans")
      .select("*")
      .eq("group_id", groupId);
    if (error) throw new Error(error.message);
    return (data || []).map(fromLoanRow);
  },
  async listByMember(memberId) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("loans")
      .select("*")
      .eq("member_id", memberId);
    if (error) throw new Error(error.message);
    return (data || []).map(fromLoanRow);
  },
  async update(id, patch) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("loans")
      .update(toLoanPatch(patch))
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromLoanRow(data) : undefined;
  },
};

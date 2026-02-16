import type { TransactionRepository } from "../interfaces/transactionRepository";
import { requireSupabase } from "../../db/supabaseClient";
import { fromTransactionRow, toTransactionRow } from "./mappers";

export const transactionRepository: TransactionRepository = {
  async create(transaction) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("transactions")
      .insert(toTransactionRow(transaction))
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return fromTransactionRow(data);
  },
  async getById(id) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromTransactionRow(data) : undefined;
  },
  async listByGroup(groupId) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("group_id", groupId);
    if (error) throw new Error(error.message);
    return (data || []).map(fromTransactionRow);
  },
  async listByMember(memberId) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("member_id", memberId);
    if (error) throw new Error(error.message);
    return (data || []).map(fromTransactionRow);
  },
  async listByType(groupId, type) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("group_id", groupId)
      .eq("type", type);
    if (error) throw new Error(error.message);
    return (data || []).map(fromTransactionRow);
  },
};

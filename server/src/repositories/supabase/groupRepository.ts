import type { GroupRepository } from "../interfaces/groupRepository";
import { requireSupabase } from "../../db/supabaseClient";
import { fromGroupRow, toGroupPatch, toGroupRow } from "./mappers";

export const groupRepository: GroupRepository = {
  async create(group) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("groups")
      .insert(toGroupRow(group))
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return fromGroupRow(data);
  },
  async getById(id) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromGroupRow(data) : undefined;
  },
  async list() {
    const supabase = requireSupabase();
    const { data, error } = await supabase.from("groups").select("*");
    if (error) throw new Error(error.message);
    return (data || []).map(fromGroupRow);
  },
  async update(id, patch) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("groups")
      .update(toGroupPatch(patch))
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromGroupRow(data) : undefined;
  },
};

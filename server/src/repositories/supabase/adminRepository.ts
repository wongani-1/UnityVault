import type { AdminRepository } from "../interfaces/adminRepository";
import { requireSupabase } from "../../db/supabaseClient";
import { fromAdminRow, toAdminPatch, toAdminRow } from "./mappers";

export const adminRepository: AdminRepository = {
  async create(admin) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("admins")
      .insert(toAdminRow(admin))
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return fromAdminRow(data);
  },
  async getById(id) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("admins")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromAdminRow(data) : undefined;
  },
  async findByGroupAndIdentifier(groupId, identifier) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("admins")
      .select("*")
      .eq("group_id", groupId)
      .or(`email.eq.${identifier},username.eq.${identifier}`)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromAdminRow(data) : undefined;
  },
  async findByIdentifier(identifier) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("admins")
      .select("*")
      .or(`email.eq.${identifier},username.eq.${identifier},phone.eq.${identifier}`)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromAdminRow(data) : undefined;
  },
  async listByGroup(groupId) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("admins")
      .select("*")
      .eq("group_id", groupId);
    if (error) throw new Error(error.message);
    return (data || []).map(fromAdminRow);
  },
  async update(id, patch) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("admins")
      .update(toAdminPatch(patch))
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromAdminRow(data) : undefined;
  },
};

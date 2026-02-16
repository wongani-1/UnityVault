import type { MemberRepository } from "../interfaces/memberRepository";
import { requireSupabase } from "../../db/supabaseClient";
import { fromMemberRow, toMemberPatch, toMemberRow } from "./mappers";

export const memberRepository: MemberRepository = {
  async create(member) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("members")
      .insert(toMemberRow(member))
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return fromMemberRow(data);
  },
  async getById(id) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromMemberRow(data) : undefined;
  },
  async listByGroup(groupId) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("group_id", groupId);
    if (error) throw new Error(error.message);
    return (data || []).map(fromMemberRow);
  },
  async findByIdentifier(identifier) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .or(`username.eq.${identifier},email.eq.${identifier},phone.eq.${identifier}`)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromMemberRow(data) : undefined;
  },
  async findByInviteToken(token) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("invite_token", token)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromMemberRow(data) : undefined;
  },
  async update(id, patch) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("members")
      .update(toMemberPatch(patch))
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromMemberRow(data) : undefined;
  },
  async delete(id) {
    const supabase = requireSupabase();
    const { error } = await supabase.from("members").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  },
};

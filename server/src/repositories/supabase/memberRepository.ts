import type { MemberRepository } from "../interfaces/memberRepository";
import { requireSupabase } from "../../db/supabaseClient";
import { fromMemberRow, toMemberPatch, toMemberRow } from "./mappers";

const toFilterValue = (value: string) => {
  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}"`;
};

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
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(fromMemberRow);
  },
  async findByIdentifier(identifier) {
    const supabase = requireSupabase();
    const idValue = toFilterValue(identifier);
    const filter = `username.eq.${idValue},email.eq.${idValue},phone.eq.${idValue}`;
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .or(filter)
      .maybeSingle();

    if (!error) {
      return data ? fromMemberRow(data) : undefined;
    }

    const isMultipleRowsError =
      error.code === "PGRST116" ||
      /multiple|more than 1 row/i.test(error.message || "");

    if (!isMultipleRowsError) {
      throw new Error(error.message);
    }

    const { data: manyRows, error: manyError } = await supabase
      .from("members")
      .select("*")
      .or(filter)
      .order("created_at", { ascending: false })
      .limit(20);

    if (manyError) throw new Error(manyError.message);

    const rows = manyRows || [];
    if (rows.length === 0) return undefined;

    const activeExact = rows.find((row) =>
      row.status === "active" &&
      (row.username === identifier || row.email === identifier || row.phone === identifier)
    );

    if (activeExact) return fromMemberRow(activeExact);

    const latestExact = rows.find(
      (row) =>
        row.username === identifier || row.email === identifier || row.phone === identifier
    );

    return latestExact ? fromMemberRow(latestExact) : undefined;
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

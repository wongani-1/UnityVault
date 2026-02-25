import type { AdminRepository } from "../interfaces/adminRepository";
import { requireSupabase } from "../../db/supabaseClient";
import { fromAdminRow, toAdminPatch, toAdminRow } from "./mappers";

const getMissingColumn = (message: string): string | undefined => {
  const match = message.match(/Could not find the '([^']+)' column/);
  return match?.[1];
};

const removeMissingColumn = (payload: Record<string, unknown>, column: string) => {
  if (column in payload) {
    delete payload[column];
    return true;
  }
  return false;
};

const isMultipleRowsError = (code: string | undefined, message: string | undefined) =>
  code === "PGRST116" || /multiple|more than 1 row/i.test(message || "");

const toFilterValue = (value: string) => {
  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}"`;
};

export const adminRepository: AdminRepository = {
  async create(admin) {
    const supabase = requireSupabase();
    const adminRow = toAdminRow(admin) as Record<string, unknown>;
    const insertPayload = { ...adminRow } as Record<string, unknown>;

    while (true) {
      const { data, error } = await supabase
        .from("admins")
        .insert(insertPayload)
        .select("*")
        .single();

      if (!error) {
        return fromAdminRow(data);
      }

      const missingColumn = getMissingColumn(error.message || "");
      if (!missingColumn || !removeMissingColumn(insertPayload, missingColumn)) {
        throw new Error(error.message);
      }
    }
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
    const idValue = toFilterValue(identifier);
    const filter = `email.eq.${idValue},username.eq.${idValue}`;
    const { data, error } = await supabase
      .from("admins")
      .select("*")
      .eq("group_id", groupId)
      .or(filter)
      .maybeSingle();

    if (!error) {
      return data ? fromAdminRow(data) : undefined;
    }

    if (!isMultipleRowsError(error.code, error.message)) {
      throw new Error(error.message);
    }

    const { data: manyRows, error: manyError } = await supabase
      .from("admins")
      .select("*")
      .eq("group_id", groupId)
      .or(filter)
      .order("created_at", { ascending: false })
      .limit(20);

    if (manyError) throw new Error(manyError.message);

    const rows = manyRows || [];
    if (rows.length === 0) return undefined;

    const exactMatch = rows.find(
      (row) => row.username === identifier || row.email === identifier
    );

    return exactMatch ? fromAdminRow(exactMatch) : fromAdminRow(rows[0]);
  },
  async findByIdentifier(identifier) {
    const supabase = requireSupabase();
    const idValue = toFilterValue(identifier);
    const filter = `email.eq.${idValue},username.eq.${idValue},phone.eq.${idValue}`;
    const { data, error } = await supabase
      .from("admins")
      .select("*")
      .or(filter)
      .maybeSingle();

    if (!error) {
      return data ? fromAdminRow(data) : undefined;
    }

    if (!isMultipleRowsError(error.code, error.message)) {
      throw new Error(error.message);
    }

    const { data: manyRows, error: manyError } = await supabase
      .from("admins")
      .select("*")
      .or(filter)
      .order("created_at", { ascending: false })
      .limit(20);

    if (manyError) throw new Error(manyError.message);

    const rows = manyRows || [];
    if (rows.length === 0) return undefined;

    const exactMatch = rows.find(
      (row) =>
        row.username === identifier || row.email === identifier || row.phone === identifier
    );

    return exactMatch ? fromAdminRow(exactMatch) : fromAdminRow(rows[0]);
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
    const adminPatch = toAdminPatch(patch) as Record<string, unknown>;
    const updatePayload = { ...adminPatch } as Record<string, unknown>;

    while (true) {
      if (Object.keys(updatePayload).length === 0) {
        return this.getById(id);
      }

      const { data, error } = await supabase
        .from("admins")
        .update(updatePayload)
        .eq("id", id)
        .select("*")
        .maybeSingle();

      if (!error) {
        return data ? fromAdminRow(data) : undefined;
      }

      const missingColumn = getMissingColumn(error.message || "");
      if (!missingColumn || !removeMissingColumn(updatePayload, missingColumn)) {
        throw new Error(error.message);
      }
    }
  },
};

import type { AuditRepository } from "../interfaces/auditRepository";
import { requireSupabase } from "../../db/supabaseClient";
import { fromAuditRow, toAuditRow } from "./mappers";

export const auditRepository: AuditRepository = {
  async create(log) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("audit_logs")
      .insert(toAuditRow(log))
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return fromAuditRow(data);
  },
  async listByGroup(groupId) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("group_id", groupId);
    if (error) throw new Error(error.message);
    return (data || []).map(fromAuditRow);
  },
};

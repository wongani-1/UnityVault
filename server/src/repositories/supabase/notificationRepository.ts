import type { NotificationRepository } from "../interfaces/notificationRepository";
import { requireSupabase } from "../../db/supabaseClient";
import { fromNotificationRow, toNotificationRow } from "./mappers";

export const notificationRepository: NotificationRepository = {
  async create(notification) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("notifications")
      .insert(toNotificationRow(notification))
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return fromNotificationRow(data);
  },
  async listByGroup(groupId) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("group_id", groupId);
    if (error) throw new Error(error.message);
    return (data || []).map(fromNotificationRow);
  },
  async listByMember(memberId) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("member_id", memberId);
    if (error) throw new Error(error.message);
    return (data || []).map(fromNotificationRow);
  },
};

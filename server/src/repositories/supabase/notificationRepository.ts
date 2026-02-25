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
  async markAsRead(notificationIds) {
    const supabase = requireSupabase();
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in("id", notificationIds);
    if (error) throw new Error(error.message);
  },
  async markAllAsReadForMember(memberId) {
    const supabase = requireSupabase();
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("member_id", memberId);
    if (error) throw new Error(error.message);
  },
  async markAllAsReadForAdmin(adminId) {
    const supabase = requireSupabase();

    // First get the admin's group
    const { data: adminData, error: adminError } = await supabase
      .from("admins")
      .select("group_id")
      .eq("id", adminId)
      .single();

    if (adminError) {
      throw new Error(adminError.message);
    }

    // Mark group-wide notifications (admin_id null) as read
    const { error: groupWideError } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("group_id", adminData.group_id)
      .is("admin_id", null);

    if (groupWideError) {
      throw new Error(groupWideError.message);
    }

    // Mark admin-targeted notifications as read
    const { error: adminTargetedError } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("group_id", adminData.group_id)
      .eq("admin_id", adminId);

    if (adminTargetedError) {
      throw new Error(adminTargetedError.message);
    }
  },
};

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
    console.log("[markAllAsReadForAdmin] Starting for adminId:", adminId);
    
   // Admin notifications have admin_id as null, so we need to filter by group
    // First get the admin's group
    const { data: adminData, error: adminError } = await supabase
      .from("admins")
      .select("group_id")
      .eq("id", adminId)
      .single();
    
    if (adminError) {
      console.error("[markAllAsReadForAdmin] Error fetching admin:", adminError);
      throw new Error(adminError.message);
    }
    
    console.log("[markAllAsReadForAdmin] Admin group_id:", adminData.group_id);
    
    // Mark all notifications for this group where admin_id is null as read
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("group_id", adminData.group_id)
      .is("admin_id", null);
    
    if (error) {
      console.error("[markAllAsReadForAdmin] Error updating notifications:", error);
      throw new Error(error.message);
    }
    
    console.log("[markAllAsReadForAdmin] Successfully marked notifications as read");
  },
};

import type { AdminRepository } from "../interfaces/adminRepository";
import type { Admin } from "../../models/types";
import { store } from "./store";

export const adminRepository: AdminRepository = {
  create(admin: Admin) {
    store.admins.set(admin.id, admin);
    return admin;
  },
  getById(id: string) {
    return store.admins.get(id);
  },
  findByGroupAndIdentifier(groupId: string, identifier: string) {
    const admins = Array.from(store.admins.values());
    return admins.find(
      (admin) =>
        admin.groupId === groupId &&
        (admin.email === identifier || admin.username === identifier)
    );
  },
  findByIdentifier(identifier: string) {
    const admins = Array.from(store.admins.values());
    return admins.find(
      (admin) => admin.email === identifier || admin.username === identifier || admin.phone === identifier
    );
  },
  listByGroup(groupId: string) {
    return Array.from(store.admins.values()).filter(
      (admin) => admin.groupId === groupId
    );
  },
  update(id: string, patch: Partial<Admin>) {
    const current = store.admins.get(id);
    if (!current) return undefined;
    const updated = { ...current, ...patch };
    store.admins.set(id, updated);
    return updated;
  },
};

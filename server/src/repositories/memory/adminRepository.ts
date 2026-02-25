import type { AdminRepository } from "../interfaces/adminRepository";
import type { Admin } from "../../models/types";
import { store } from "./store";

export const adminRepository: AdminRepository = {
  async create(admin: Admin) {
    store.admins.set(admin.id, admin);
    return admin;
  },
  async getById(id: string) {
    return store.admins.get(id);
  },
  async findByEmail(email: string) {
    const normalized = email.trim().toLowerCase();
    const admins = Array.from(store.admins.values());
    return admins.find((admin) => (admin.email || "").trim().toLowerCase() === normalized);
  },
  async findByGroupAndIdentifier(groupId: string, identifier: string) {
    const admins = Array.from(store.admins.values());
    return admins.find(
      (admin) =>
        admin.groupId === groupId &&
        (admin.email === identifier || admin.username === identifier)
    );
  },
  async findByIdentifier(identifier: string) {
    const admins = Array.from(store.admins.values());
    return admins.find(
      (admin) => admin.email === identifier || admin.username === identifier || admin.phone === identifier
    );
  },
  async listByGroup(groupId: string) {
    return Array.from(store.admins.values()).filter(
      (admin) => admin.groupId === groupId
    );
  },
  async update(id: string, patch: Partial<Admin>) {
    const current = store.admins.get(id);
    if (!current) return undefined;
    const updated = { ...current, ...patch };
    store.admins.set(id, updated);
    return updated;
  },
};

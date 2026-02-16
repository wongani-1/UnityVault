import type { Admin } from "../../models/types";

export type AdminRepository = {
  create: (admin: Admin) => Promise<Admin>;
  getById: (id: string) => Promise<Admin | undefined>;
  findByGroupAndIdentifier: (groupId: string, identifier: string) => Promise<Admin | undefined>;
  findByIdentifier: (identifier: string) => Promise<Admin | undefined>;
  listByGroup: (groupId: string) => Promise<Admin[]>;
  update: (id: string, patch: Partial<Admin>) => Promise<Admin | undefined>;
};

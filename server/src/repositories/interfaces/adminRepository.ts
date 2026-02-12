import type { Admin } from "../../models/types";

export type AdminRepository = {
  create: (admin: Admin) => Admin;
  getById: (id: string) => Admin | undefined;
  findByGroupAndIdentifier: (groupId: string, identifier: string) => Admin | undefined;
  listByGroup: (groupId: string) => Admin[];
  update: (id: string, patch: Partial<Admin>) => Admin | undefined;
};

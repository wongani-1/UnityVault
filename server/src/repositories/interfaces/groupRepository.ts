import type { Group } from "../../models/types";

export type GroupRepository = {
  create: (group: Group) => Group;
  getById: (id: string) => Group | undefined;
  list: () => Group[];
  update: (id: string, patch: Partial<Group>) => Group | undefined;
};

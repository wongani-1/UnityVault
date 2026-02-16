import type { Group } from "../../models/types";

export type GroupRepository = {
  create: (group: Group) => Promise<Group>;
  getById: (id: string) => Promise<Group | undefined>;
  list: () => Promise<Group[]>;
  update: (id: string, patch: Partial<Group>) => Promise<Group | undefined>;
};

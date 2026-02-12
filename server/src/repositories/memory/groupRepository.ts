import type { GroupRepository } from "../interfaces/groupRepository";
import type { Group } from "../../models/types";
import { store } from "./store";

export const groupRepository: GroupRepository = {
  create(group: Group) {
    store.groups.set(group.id, group);
    return group;
  },
  getById(id: string) {
    return store.groups.get(id);
  },
  list() {
    return Array.from(store.groups.values());
  },
  update(id: string, patch: Partial<Group>) {
    const current = store.groups.get(id);
    if (!current) return undefined;
    const updated = { ...current, ...patch };
    store.groups.set(id, updated);
    return updated;
  },
};

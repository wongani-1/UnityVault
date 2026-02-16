import type { GroupRepository } from "../interfaces/groupRepository";
import type { Group } from "../../models/types";
import { store } from "./store";

export const groupRepository: GroupRepository = {
  async create(group: Group) {
    store.groups.set(group.id, group);
    return group;
  },
  async getById(id: string) {
    return store.groups.get(id);
  },
  async list() {
    return Array.from(store.groups.values());
  },
  async update(id: string, patch: Partial<Group>) {
    const current = store.groups.get(id);
    if (!current) return undefined;
    const updated = { ...current, ...patch };
    store.groups.set(id, updated);
    return updated;
  },
};

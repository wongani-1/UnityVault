import type { MemberRepository } from "../interfaces/memberRepository";
import type { Member } from "../../models/types";
import { store } from "./store";

export const memberRepository: MemberRepository = {
  async create(member: Member) {
    store.members.set(member.id, member);
    return member;
  },
  async getById(id: string) {
    return store.members.get(id);
  },
  async listByGroup(groupId: string) {
    return Array.from(store.members.values()).filter(
      (member) => member.groupId === groupId
    );
  },
  async findByIdentifier(identifier: string) {
    const members = Array.from(store.members.values());
    return members.find(
      (member) =>
        member.username === identifier ||
        member.email === identifier ||
        member.phone === identifier
    );
  },
  async findByInviteToken(token: string) {
    const members = Array.from(store.members.values());
    return members.find((member) => member.inviteToken === token);
  },
  async update(id: string, patch: Partial<Member>) {
    const current = store.members.get(id);
    if (!current) return undefined;
    const updated = { ...current, ...patch };
    store.members.set(id, updated);
    return updated;
  },
  async delete(id: string) {
    return store.members.delete(id);
  },
};

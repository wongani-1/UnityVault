import type { MemberRepository } from "../interfaces/memberRepository";
import type { Member } from "../../models/types";
import { store } from "./store";

export const memberRepository: MemberRepository = {
  create(member: Member) {
    store.members.set(member.id, member);
    return member;
  },
  getById(id: string) {
    return store.members.get(id);
  },
  listByGroup(groupId: string) {
    return Array.from(store.members.values()).filter(
      (member) => member.groupId === groupId
    );
  },
  findByIdentifier(identifier: string) {
    const members = Array.from(store.members.values());
    return members.find(
      (member) =>
        member.username === identifier ||
        member.email === identifier ||
        member.phone === identifier
    );
  },
  findByInviteToken(token: string) {
    const members = Array.from(store.members.values());
    return members.find((member) => member.inviteToken === token);
  },
  update(id: string, patch: Partial<Member>) {
    const current = store.members.get(id);
    if (!current) return undefined;
    const updated = { ...current, ...patch };
    store.members.set(id, updated);
    return updated;
  },
  delete(id: string) {
    return store.members.delete(id);
  },
};

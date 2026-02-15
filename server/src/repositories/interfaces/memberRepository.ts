import type { Member } from "../../models/types";

export type MemberRepository = {
  create: (member: Member) => Member;
  getById: (id: string) => Member | undefined;
  listByGroup: (groupId: string) => Member[];
  findByIdentifier: (identifier: string) => Member | undefined;
  findByInviteToken: (token: string) => Member | undefined;
  update: (id: string, patch: Partial<Member>) => Member | undefined;
  delete: (id: string) => boolean;
};

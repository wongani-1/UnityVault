import type { Member } from "../../models/types";

export type MemberRepository = {
  create: (member: Member) => Promise<Member>;
  getById: (id: string) => Promise<Member | undefined>;
  listByGroup: (groupId: string) => Promise<Member[]>;
  findByIdentifier: (identifier: string) => Promise<Member | undefined>;
  findByInviteToken: (token: string) => Promise<Member | undefined>;
  update: (id: string, patch: Partial<Member>) => Promise<Member | undefined>;
  delete: (id: string) => Promise<boolean>;
};

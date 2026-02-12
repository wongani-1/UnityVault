import type { Penalty } from "../../models/types";

export type PenaltyRepository = {
  create: (penalty: Penalty) => Penalty;
  listByMember: (memberId: string) => Penalty[];
  listByGroup: (groupId: string) => Penalty[];
};

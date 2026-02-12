import type { PenaltyRepository } from "../interfaces/penaltyRepository";
import type { Penalty } from "../../models/types";
import { store } from "./store";

export const penaltyRepository: PenaltyRepository = {
  create(penalty: Penalty) {
    store.penalties.set(penalty.id, penalty);
    return penalty;
  },
  listByMember(memberId: string) {
    return Array.from(store.penalties.values()).filter(
      (penalty) => penalty.memberId === memberId
    );
  },
  listByGroup(groupId: string) {
    return Array.from(store.penalties.values()).filter(
      (penalty) => penalty.groupId === groupId
    );
  },
};

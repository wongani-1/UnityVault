import { Router } from "express";
import {
  registerMember,
  inviteMember,
  listMembers,
  listDuplicateMemberCredentials,
  getMe,
  updateMe,
  changeMemberPassword,
  verifyMemberInvite,
  completeMemberInvite,
  recordRegistrationFeePayment,
  recordSeedDeposit,
  purchaseShares,
  checkRegistrationFeeStatus,
} from "../controllers/memberController";
import { requireRole } from "../middleware/auth";

export const membersRouter = Router();

membersRouter.post("/register", registerMember);
membersRouter.post("/invite", requireRole(["group_admin"]), inviteMember);
membersRouter.post("/activate/verify", verifyMemberInvite);
membersRouter.post("/activate/complete", completeMemberInvite);
membersRouter.get("/me", requireRole(["member"]), getMe);
membersRouter.put("/me", requireRole(["member"]), updateMe);
membersRouter.put("/me/password", requireRole(["member"]), changeMemberPassword);
membersRouter.post("/me/registration-payment", requireRole(["member"]), recordRegistrationFeePayment);
membersRouter.get("/me/registration-status", requireRole(["member"]), checkRegistrationFeeStatus);
membersRouter.post("/me/seed-payment", requireRole(["member"]), recordSeedDeposit);
membersRouter.post("/me/share-purchase", requireRole(["member"]), purchaseShares);
membersRouter.get("/", requireRole(["group_admin"]), listMembers);
membersRouter.get("/duplicates", requireRole(["group_admin"]), listDuplicateMemberCredentials);

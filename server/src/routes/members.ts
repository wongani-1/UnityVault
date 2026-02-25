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
import { rateLimiter } from "../middleware/rateLimiter";

const registerLimiter = rateLimiter({ windowMs: 60 * 60_000, max: 10 });

export const membersRouter = Router();

membersRouter.post("/register", registerLimiter, registerMember);
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

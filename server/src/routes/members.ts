import { Router } from "express";
import {
  registerMember,
  inviteMember,
  listMembers,
  getMe,
  updateMe,
  changeMemberPassword,
  verifyMemberInvite,
  completeMemberInvite,
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
membersRouter.get("/", requireRole(["group_admin"]), listMembers);

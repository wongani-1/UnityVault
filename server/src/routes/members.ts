import { Router } from "express";
import {
  registerMember,
  approveMember,
  rejectMember,
  listMembers,
  getMe,
  updateMe,
  changeMemberPassword,
} from "../controllers/memberController";
import { requireRole } from "../middleware/auth";

export const membersRouter = Router();

membersRouter.post("/register", registerMember);
membersRouter.get("/me", requireRole(["member"]), getMe);
membersRouter.put("/me", requireRole(["member"]), updateMe);
membersRouter.put("/me/password", requireRole(["member"]), changeMemberPassword);
membersRouter.get("/", requireRole(["group_admin"]), listMembers);
membersRouter.post("/:memberId/approve", requireRole(["group_admin"]), approveMember);
membersRouter.post("/:memberId/reject", requireRole(["group_admin"]), rejectMember);

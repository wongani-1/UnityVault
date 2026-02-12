import { Router } from "express";
import {
  registerMember,
  approveMember,
  rejectMember,
  listMembers,
  getMe,
} from "../controllers/memberController";
import { requireRole } from "../middleware/auth";

export const membersRouter = Router();

membersRouter.post("/register", registerMember);
membersRouter.get("/me", requireRole(["member"]), getMe);
membersRouter.get("/", requireRole(["group_admin"]), listMembers);
membersRouter.post("/:memberId/approve", requireRole(["group_admin"]), approveMember);
membersRouter.post("/:memberId/reject", requireRole(["group_admin"]), rejectMember);

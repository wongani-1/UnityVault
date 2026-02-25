import { Router } from "express";
import {
	createGroup,
	getGroup,
	getMyGroup,
	getGroupSettings,
	updateGroupSettings,
} from "../controllers/groupController";
import { requireAuth, requireRole } from "../middleware/auth";
import { rateLimiter } from "../middleware/rateLimiter";

const createGroupLimiter = rateLimiter({ windowMs: 60 * 60_000, max: 5 });

export const groupsRouter = Router();

groupsRouter.post("/", createGroupLimiter, createGroup);
groupsRouter.get("/me", requireAuth, getMyGroup);
groupsRouter.get("/settings", requireAuth, getGroupSettings);
groupsRouter.put("/settings", requireRole(["group_admin"]), updateGroupSettings);
groupsRouter.get("/:groupId", requireRole(["group_admin"]), getGroup);

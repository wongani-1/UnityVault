import { Router } from "express";
import {
	createGroup,
	getGroup,
	getMyGroup,
	getGroupSettings,
	updateGroupSettings,
} from "../controllers/groupController";
import { requireAuth, requireRole } from "../middleware/auth";

export const groupsRouter = Router();

groupsRouter.post("/", createGroup);
groupsRouter.get("/me", requireAuth, getMyGroup);
groupsRouter.get("/settings", requireAuth, getGroupSettings);
groupsRouter.put("/settings", requireRole(["group_admin"]), updateGroupSettings);
groupsRouter.get("/:groupId", requireRole(["group_admin"]), getGroup);

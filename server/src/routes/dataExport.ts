import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  exportMemberData,
  exportGroupData,
  exportGroupMembers,
} from "../controllers/dataExportController";

export const dataExportRouter = Router();

dataExportRouter.get("/member-data", requireAuth, exportMemberData);
dataExportRouter.get("/group-data", requireRole(["group_admin"]), exportGroupData);
dataExportRouter.get("/members", requireRole(["group_admin"]), exportGroupMembers);

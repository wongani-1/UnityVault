import { Router } from "express";
import { listAuditLogs } from "../controllers/auditController";
import { requireRole } from "../middleware/auth";

export const auditRouter = Router();

auditRouter.get("/", requireRole(["group_admin"]), listAuditLogs);

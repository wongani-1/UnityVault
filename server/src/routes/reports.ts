import { Router } from "express";
import { listReports, exportReport } from "../controllers/reportController";
import { requireRole } from "../middleware/auth";

export const reportsRouter = Router();

reportsRouter.get("/", requireRole(["group_admin"]), listReports);
reportsRouter.get("/:type", requireRole(["group_admin"]), exportReport);
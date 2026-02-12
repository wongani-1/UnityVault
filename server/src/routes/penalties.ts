import { Router } from "express";
import { listPenalties } from "../controllers/penaltyController";
import { requireRole } from "../middleware/auth";

export const penaltiesRouter = Router();

penaltiesRouter.get("/", requireRole(["group_admin"]), listPenalties);

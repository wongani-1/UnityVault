import { Router } from "express";
import { listPenalties, payPenalty } from "../controllers/penaltyController";
import { requireAuth, requireRole } from "../middleware/auth";

export const penaltiesRouter = Router();

penaltiesRouter.get("/", requireAuth, listPenalties);
penaltiesRouter.post("/:id/pay", requireRole(["member", "group_admin"]), payPenalty);

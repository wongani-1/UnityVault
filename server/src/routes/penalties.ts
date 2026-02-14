import { Router } from "express";
import { listPenalties, payPenalty } from "../controllers/penaltyController";
import { requireRole } from "../middleware/auth";

export const penaltiesRouter = Router();

penaltiesRouter.get("/", requireRole(["group_admin"]), listPenalties);
penaltiesRouter.post("/:id/pay", requireRole(["member", "group_admin"]), payPenalty);

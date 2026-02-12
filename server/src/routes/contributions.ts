import { Router } from "express";
import { addContribution, listContributions } from "../controllers/contributionController";
import { requireRole } from "../middleware/auth";

export const contributionsRouter = Router();

contributionsRouter.get("/", requireRole(["group_admin", "member"]), listContributions);
contributionsRouter.post("/", requireRole(["group_admin"]), addContribution);

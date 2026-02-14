import { Router } from "express";
import { 
  addContribution, 
  listContributions, 
  generateMonthlyContributions,
  recordPayment,
  checkOverdueContributions,
  listUnpaidContributions
} from "../controllers/contributionController";
import { requireRole } from "../middleware/auth";

export const contributionsRouter = Router();

contributionsRouter.get("/", requireRole(["group_admin", "member"]), listContributions);
contributionsRouter.get("/unpaid", requireRole(["group_admin", "member"]), listUnpaidContributions);
contributionsRouter.post("/", requireRole(["group_admin"]), addContribution);
contributionsRouter.post("/generate", requireRole(["group_admin"]), generateMonthlyContributions);
contributionsRouter.post("/pay", requireRole(["member", "group_admin"]), recordPayment);
contributionsRouter.post("/check-overdue", requireRole(["group_admin"]), checkOverdueContributions);

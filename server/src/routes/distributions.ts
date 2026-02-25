import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import * as distributionController from "../controllers/distributionController";

export const distributionRoutes = Router();

// All distribution routes require authentication
distributionRoutes.use(requireAuth);

// Calculate distribution for a year (admin only)
distributionRoutes.post("/calculate", requireRole(["group_admin"]), distributionController.calculateDistribution);

// Get distribution breakdown per member
distributionRoutes.get("/breakdown", distributionController.getDistributionBreakdown);

// Execute distribution (admin only)
distributionRoutes.post("/execute", requireRole(["group_admin"]), distributionController.executeDistribution);

// List all distributions
distributionRoutes.get("/", distributionController.listDistributions);

// Get member's distribution history
distributionRoutes.get("/member", distributionController.getMemberDistributions);

// Live estimated payout for current/future cycle close
distributionRoutes.get("/estimate", distributionController.getEstimatedPayout);

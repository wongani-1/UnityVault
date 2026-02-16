import { Router } from "express";
import { authenticate } from "../middleware/auth";
import * as receiptController from "../controllers/receiptController";

export const receiptRoutes = Router();

// All receipt routes require authentication
receiptRoutes.use(authenticate);

// Generate contribution receipt
receiptRoutes.get(
  "/contribution/:contributionId",
  receiptController.generateContributionReceipt
);

// Generate loan payment receipt
receiptRoutes.get(
  "/loan/:installmentId",
  receiptController.generateLoanPaymentReceipt
);

// Email receipt
receiptRoutes.post("/email", receiptController.emailReceipt);

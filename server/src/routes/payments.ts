import { Router } from "express";
import { 
  initializePayment,
  verifyPayment,
  getPaymentHistory,
  handlePaymentCallback
} from "../controllers/paymentController";
import { requireRole } from "../middleware/auth";

export const paymentRouter = Router();

// Initialize a new payment
paymentRouter.post("/initialize", requireRole(["group_admin", "member"]), initializePayment);

// Verify payment status by charge ID
paymentRouter.get("/verify/:chargeId", requireRole(["group_admin", "member"]), verifyPayment);

// Get payment history for current user
paymentRouter.get("/history", requireRole(["group_admin", "member"]), getPaymentHistory);

// Callback endpoint for PayChangu (no auth required)
paymentRouter.post("/callback", handlePaymentCallback);

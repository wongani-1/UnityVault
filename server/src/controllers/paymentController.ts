import type { Request, Response } from "express";
import { container } from "../container";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import type { PaymentOperator, PaymentTransaction } from "../services/paymentService";

export const initializePayment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);

  const {
    amount,
    phone,
    operator,
    email,
    first_name,
    last_name,
    firstName,
    lastName,
    paymentType,
  }: {
    amount: number;
    phone: string;
    operator: PaymentOperator;
    email: string;
    first_name?: string;
    last_name?: string;
    firstName?: string;
    lastName?: string;
    paymentType: "subscription" | "registration" | "contribution" | "loan_repayment" | "penalty";
  } = req.body;

  // Validate required fields
  if (!amount || !phone || !operator || !paymentType) {
    throw new ApiError("Missing required fields: amount, phone, operator, and paymentType are required", 400);
  }

  // Determine customer type based on role
  const customerType = req.user.role === "group_admin" ? "admin" : "member";

  // Initialize payment with PayChangu
  const transaction = await container.paymentService.initializePayment({
    amount,
    phone,
    operator,
    email: email || "",
    first_name: first_name || firstName || "",
    last_name: last_name || lastName || "",
    customerId: req.user.userId,
    customerType,
    paymentType,
  });

  // Save transaction to database
  await container.paymentRepository.create(transaction);

  // Start polling payment status if not mock
  if (transaction.status === "pending") {
    container.paymentService.pollPaymentStatus(
      transaction.chargeId,
      async (updatedTransaction) => {
        await container.paymentRepository.update(transaction.chargeId, updatedTransaction);
      }
    );
  }

  res.json({
    status: "success",
    message: "Payment initialized successfully",
    paymentInfo: {
      chargeId: transaction.chargeId,
      transactionId: transaction.transactionId,
      amount: `${transaction.amount} MWK`,
      status: transaction.status,
      provider: transaction.provider,
      phone: transaction.phone,
      charges: transaction.charges ? `${transaction.charges} MWK` : undefined,
      reference: transaction.reference,
      created: transaction.created,
    },
  });
});

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);

  const { chargeId } = req.params;

  if (!chargeId) {
    throw new ApiError("Charge ID is required", 400);
  }

  // Get payment from database
  const payment = await container.paymentRepository.getByChargeId(chargeId);

  if (!payment) {
    throw new ApiError("Payment not found", 404);
  }

  // Verify payment is owned by the user
  if (payment.customerId !== req.user.userId) {
    throw new ApiError("Unauthorized to access this payment", 403);
  }

  // If payment is still pending, try to verify with PayChangu
  if (payment.status === "pending") {
    try {
      const verifiedTransaction = await container.paymentService.verifyPayment(chargeId);
      const updated = await container.paymentRepository.update(chargeId, verifiedTransaction);
      
      if (updated) {
        res.json({
          status: updated.status,
          message: updated.status === "success" ? "Payment completed successfully" : 
                   updated.status === "failed" ? "Payment failed" : "Payment is still pending",
          paymentInfo: {
            transactionId: updated.transactionId,
            chargeId: updated.chargeId,
            amount: `${updated.amount} MWK`,
            status: updated.status,
            provider: updated.provider,
            phone: updated.phone,
            charges: updated.charges ? `${updated.charges} MWK` : undefined,
            reference: updated.reference,
            created: updated.created,
            completed: updated.completedAt,
          },
        });
        return;
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
    }
  }

  // Return current payment status
  res.json({
    status: payment.status,
    message: payment.status === "success" ? "Payment completed successfully" : 
             payment.status === "failed" ? "Payment failed" : 
             payment.status === "expired" ? "Payment expired" : "Payment is still pending",
    paymentInfo: {
      transactionId: payment.transactionId,
      chargeId: payment.chargeId,
      amount: `${payment.amount} MWK`,
      status: payment.status,
      provider: payment.provider,
      phone: payment.phone,
      charges: payment.charges ? `${payment.charges} MWK` : undefined,
      reference: payment.reference,
      created: payment.created,
      completed: payment.completedAt,
      customer: {
        first_name: payment.first_name,
        last_name: payment.last_name,
        email: payment.email,
      },
    },
  });
});

export const getPaymentHistory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);

  const customerType = req.user.role === "group_admin" ? "admin" : "member";
  const payments = await container.paymentRepository.listByCustomer(req.user.userId, customerType);

  res.json({
    status: "success",
    message: `Found ${payments.length} payment(s)`,
    payments: payments.map((p: PaymentTransaction) => ({
      chargeId: p.chargeId,
      amount: `${p.amount} MWK`,
      phone: p.phone,
      operator: p.operator,
      status: p.status,
      paymentType: p.paymentType,
      created: p.created,
      lastChecked: p.lastChecked,
      completedAt: p.completedAt,
    })),
  });
});

export const handlePaymentCallback = asyncHandler(async (req: Request, res: Response) => {
  // Validate callback authenticity via PayChangu signature header
  const signature = req.headers["x-paychangu-signature"] as string | undefined;
  const apiToken = (await import("../config/env")).env.paychangu.apiToken;
  if (apiToken && signature) {
    const crypto = await import("crypto");
    const expectedSig = crypto
      .createHmac("sha256", apiToken)
      .update(JSON.stringify(req.body))
      .digest("hex");
    if (signature !== expectedSig) {
      throw new ApiError("Invalid callback signature", 403);
    }
  } else if (!apiToken) {
    // In mock/dev mode without API token, allow callbacks
  } else {
    throw new ApiError("Missing callback signature", 403);
  }

  const { tx_ref, status } = req.body;

  if (!tx_ref) {
    throw new ApiError("Transaction reference is required", 400);
  }

  // Find payment by transaction ID
  const payment = await container.paymentRepository.getByChargeId(tx_ref);
  
  if (payment) {
    await container.paymentRepository.update(payment.chargeId, {
      status: status === "successful" || status === "success" ? "success" : 
              status === "failed" ? "failed" : "pending",
      completedAt: status === "successful" || status === "success" || status === "failed" 
                  ? new Date().toISOString() 
                  : undefined,
    });
  }

  res.json({ status: "ok" });
});

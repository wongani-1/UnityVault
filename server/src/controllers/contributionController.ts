import type { Request, Response } from "express";
import { container } from "../container";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";

/**
 * Generate monthly contributions for all active members
 * Should be called at the start of each month
 */
export const generateMonthlyContributions = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  if (req.user.role !== "group_admin") throw new ApiError("Only admins can generate contributions", 403);

  const { month, amount, dueDate } = req.body as {
    month: string; // Format: "YYYY-MM"
    amount: number;
    dueDate: string; // ISO date string
  };

  if (!month || !amount || !dueDate) {
    throw new ApiError("Missing required fields: month, amount, dueDate", 400);
  }

  if (amount <= 0) {
    throw new ApiError("Amount must be greater than zero", 400);
  }

  const contributions = await container.contributionService.generateMonthlyContributions({
    groupId: req.user.groupId,
    month,
    amount,
    dueDate,
  });

  res.status(201).json({ 
    message: `Generated ${contributions.length} contributions`,
    contributions 
  });
});

/**
 * Record a contribution payment by a member
 */
export const recordPayment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  
  const { contributionId, paymentMethod } = req.body as {
    contributionId: string;
    paymentMethod?: "airtel_money" | "tnm_mpamba" | "card";
  };

  if (!paymentMethod) {
    throw new ApiError("paymentMethod is required (airtel_money, tnm_mpamba, or card)", 400);
  }

  if (
    paymentMethod !== undefined &&
    !["airtel_money", "tnm_mpamba", "card"].includes(paymentMethod)
  ) {
    throw new ApiError("Invalid payment method", 400);
  }

  if (!contributionId) {
    throw new ApiError("contributionId is required", 400);
  }

  const contribution = await container.contributionService.recordPayment({
    contributionId,
    memberId: req.user.userId,
    groupId: req.user.groupId,
    requesterRole: req.user.role === "group_admin" ? "group_admin" : "member",
    paymentMethod,
  });

  res.json(contribution);
});

/**
 * Check for overdue contributions and apply penalties
 * Should be called daily (automated job)
 */
export const checkOverdueContributions = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  if (req.user.role !== "group_admin") throw new ApiError("Only admins can check overdue contributions", 403);

  const { autoGeneratePenalty } = req.body as {
    autoGeneratePenalty?: boolean;
  };

  const result = await container.contributionService.markOverdueContributions({
    groupId: req.user.groupId,
    autoGeneratePenalty,
  });

  res.json({
    message: `Marked ${result.marked} contributions as overdue, generated ${result.penaltiesGenerated} penalties`,
    ...result,
  });
});

/**
 * Legacy: Add contribution (admin manually records a paid contribution)
 */
export const addContribution = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  throw new ApiError(
    "Manual recorded contributions are disabled. Use /contributions/pay with a payment method.",
    400
  );
});

export const listContributions = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);

  const items =
    req.user.role === "member"
      ? await container.contributionService.listByMember(req.user.userId)
      : await container.contributionService.listByGroup(req.user.groupId);

  res.json({ items });
});

export const listUnpaidContributions = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);

  const items = await container.contributionService.listUnpaidByGroup(req.user.groupId);

  res.json({ items });
});

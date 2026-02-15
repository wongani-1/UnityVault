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

  const contributions = container.contributionService.generateMonthlyContributions({
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
  
  const { contributionId } = req.body as { contributionId: string };

  if (!contributionId) {
    throw new ApiError("contributionId is required", 400);
  }

  const contribution = container.contributionService.recordPayment({
    contributionId,
    memberId: req.user.userId,
    groupId: req.user.groupId,
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

  const result = container.contributionService.markOverdueContributions({
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
  const { memberId, amount, month } = req.body as {
    memberId: string;
    amount: number;
    month: string;
  };

  if (!memberId || !month) throw new ApiError("Missing required fields", 400);
  if (!amount || amount <= 0) throw new ApiError("Amount must be greater than zero", 400);

  const contribution = container.contributionService.addContribution({
    groupId: req.user.groupId,
    memberId,
    amount,
    month,
  });

  res.status(201).json(contribution);
});

export const listContributions = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);

  const items =
    req.user.role === "member"
      ? container.contributionService.listByMember(req.user.userId)
      : container.contributionService.listByGroup(req.user.groupId);

  res.json({ items });
});

export const listUnpaidContributions = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);

  const items = container.contributionService.listUnpaidByGroup(req.user.groupId);

  res.json({ items });
});

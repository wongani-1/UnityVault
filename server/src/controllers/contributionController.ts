import type { Request, Response } from "express";
import { container } from "../container";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";

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

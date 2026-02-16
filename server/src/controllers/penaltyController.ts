import type { Request, Response } from "express";
import { container } from "../container";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";

export const listPenalties = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  
  if (req.user.role === "member") {
    // Members only see their own penalties
    const items = await container.penaltyService.listByMember(req.user.userId);
    res.json({ items });
  } else {
    // Admins see all group penalties
    const items = await container.penaltyService.listByGroup(req.user.groupId);
    res.json({ items });
  }
});

export const payPenalty = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const { id } = req.params;
  const penalty = await container.penaltyService.payPenalty(id, req.user.userId, req.user.userId);
  res.json({ penalty });
});

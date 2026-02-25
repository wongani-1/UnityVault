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
  
  // Admins may pay on behalf of a member — look up the penalty's actual owner  
  const existing = await container.penaltyService.getById(id);
  if (!existing) throw new ApiError("Penalty not found", 404);

  // Members can only pay their own; admins can pay for any member in their group
  const memberId = req.user.role === "group_admin" ? existing.memberId : req.user.userId;
  if (req.user.role === "member" && existing.memberId !== req.user.userId) {
    throw new ApiError("Unauthorized to pay this penalty", 403);
  }

  const penalty = await container.penaltyService.payPenalty(id, memberId, req.user.userId);
  res.json({ penalty });
});

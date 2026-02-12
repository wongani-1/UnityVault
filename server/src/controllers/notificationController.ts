import type { Request, Response } from "express";
import { container } from "../container";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";

export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);

  if (req.user.role === "member") {
    const items = container.notificationService.listByMember(req.user.userId);
    return res.json({ items });
  }

  const items = container.notificationService.listByGroup(req.user.groupId);
  return res.json({ items });
});

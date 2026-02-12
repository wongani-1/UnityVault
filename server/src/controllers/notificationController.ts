import type { Request, Response } from "express";
import { container } from "../container";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";

export const createNotification = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const { memberId, type, message } = req.body as {
    memberId?: string;
    type: string;
    message: string;
  };

  if (!type || !message) {
    throw new ApiError("Missing required fields: type, message", 400);
  }

  const notification = container.notificationService.create({
    groupId: req.user.groupId,
    memberId,
    type,
    message,
  });

  res.status(201).json(notification);
});

export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);

  if (req.user.role === "member") {
    const items = container.notificationService.listByMember(req.user.userId);
    return res.json({ items });
  }

  const items = container.notificationService.listByGroup(req.user.groupId);
  return res.json({ items });
});

import type { Request, Response } from "express";
import { container } from "../container";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";

export const initiate2FA = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  if (req.user.role !== "group_admin" && req.user.role !== "member") {
    throw new ApiError("2FA is only available for group admins and members", 403);
  }

  const { secret, backupCodes, qrCode } = await container.twoFactorService.enableTwoFactor({
    userId: req.user.userId,
    role: req.user.role,
  });

  res.json({
    secret,
    backupCodes,
    qrCode,
    message: "2FA initiated. Scan QR code with authenticator app.",
  });
});

export const verify2FA = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  if (req.user.role !== "group_admin" && req.user.role !== "member") {
    throw new ApiError("2FA is only available for group admins and members", 403);
  }

  const { token } = req.body as { token: string };

  if (!token) {
    throw new ApiError("token is required", 400);
  }

  await container.twoFactorService.verifyAndEnable({
    userId: req.user.userId,
    token,
    role: req.user.role,
  });

  res.json({ message: "2FA enabled successfully" });
});

export const disable2FA = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  if (req.user.role !== "group_admin" && req.user.role !== "member") {
    throw new ApiError("2FA is only available for group admins and members", 403);
  }

  await container.twoFactorService.disableTwoFactor({
    userId: req.user.userId,
    role: req.user.role,
  });

  res.json({ message: "2FA disabled" });
});

export const getBackupCodes = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  if (req.user.role !== "group_admin" && req.user.role !== "member") {
    throw new ApiError("2FA is only available for group admins and members", 403);
  }

  const result = await container.twoFactorService.getBackupCodes({
    userId: req.user.userId,
    role: req.user.role,
  });

  res.json(result);
});

export const regenerateBackupCodes = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  if (req.user.role !== "group_admin" && req.user.role !== "member") {
    throw new ApiError("2FA is only available for group admins and members", 403);
  }

  const result = await container.twoFactorService.regenerateBackupCodes({
    userId: req.user.userId,
    role: req.user.role,
  });

  res.json(result);
});

export const verify2FAToken = asyncHandler(async (req: Request, res: Response) => {
  const { userId, token, role } = req.body as {
    userId: string;
    token: string;
    role: "member" | "group_admin";
  };

  if (!userId || !token || !role) {
    throw new ApiError("userId, token, and role are required", 400);
  }

  const isValid = await container.twoFactorService.verifyToken({
    userId,
    token,
    role,
  });

  if (!isValid) {
    throw new ApiError("Invalid 2FA token", 401);
  }

  res.json({ valid: true });
});

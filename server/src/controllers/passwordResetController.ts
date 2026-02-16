import type { Request, Response } from "express";
import { container } from "../container";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";

export const requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
  const { identifier, role } = req.body as {
    identifier: string;
    role: "member" | "group_admin";
  };

  if (!identifier || !role) {
    throw new ApiError("identifier and role are required", 400);
  }

  const { token } = await container.passwordResetService.requestReset({
    identifier,
    role,
  });

  // In production, send email with reset link
  // For now, just return the token (frontend should handle this appropriately)
  res.json({
    message: "Password reset email sent",
    token, // ONLY for development/testing - remove in production
  });
});

export const validateResetToken = asyncHandler(async (req: Request, res: Response) => {
  const { token, role } = req.body as {
    token: string;
    role: "member" | "group_admin";
  };

  if (!token || !role) {
    throw new ApiError("token and role are required", 400);
  }

  const result = await container.passwordResetService.validateReset({
    token,
    role,
  });

  res.json(result);
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword, role } = req.body as {
    token: string;
    newPassword: string;
    role: "member" | "group_admin";
  };

  if (!token || !newPassword || !role) {
    throw new ApiError("token, newPassword, and role are required", 400);
  }

  if (newPassword.length < 8) {
    throw new ApiError("Password must be at least 8 characters", 400);
  }

  await container.passwordResetService.resetPassword({
    token,
    newPassword,
    role,
  });

  res.json({ message: "Password reset successful" });
});

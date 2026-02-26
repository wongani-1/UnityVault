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

  // Token is sent via email — never exposed in the response
  res.json({
    message: "If your account exists, a password reset email has been sent.",
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

  await container.passwordResetService.resetPassword({
    token,
    newPassword,
    role,
  });

  res.json({ message: "Password reset successful" });
});

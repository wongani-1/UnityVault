import type { Request, Response } from "express";
import { container } from "../container";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";

export const getAdminMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const admin = await container.adminService.getById(req.user.userId);
  res.json(admin);
});

export const updateAdminMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const { fullName, email, phone, username } = req.body as {
    fullName?: string;
    email?: string;
    phone?: string;
    username?: string;
  };

  const admin = await container.adminService.updateProfile(req.user.userId, {
    fullName,
    email,
    phone,
    username,
  });

  res.json(admin);
});

export const changeAdminPassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    throw new ApiError("Missing required fields", 400);
  }

  const result = await container.adminService.changePassword(
    req.user.userId,
    currentPassword,
    newPassword
  );
  res.json(result);
});
import type { Request, Response } from "express";
import { container } from "../container";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";

export const registerMember = asyncHandler(async (req: Request, res: Response) => {
  const { groupId, fullName, username, password, email, phone } = req.body as {
    groupId: string;
    fullName: string;
    username: string;
    password: string;
    email?: string;
    phone?: string;
  };

  const member = await container.memberService.register({
    groupId,
    fullName,
    username,
    password,
    email,
    phone,
  });

  res.status(201).json(member);
});

export const approveMember = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const member = container.memberService.approve(req.params.memberId, {
    id: req.user.userId,
    groupId: req.user.groupId,
  });
  res.json(member);
});

export const rejectMember = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const member = container.memberService.reject(req.params.memberId, {
    id: req.user.userId,
    groupId: req.user.groupId,
  });
  res.json(member);
});

export const listMembers = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const members = container.memberService.listByGroup(req.user.groupId);
  res.json({ items: members });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const member = container.memberService.getById(req.user.userId);
  res.json(member);
});

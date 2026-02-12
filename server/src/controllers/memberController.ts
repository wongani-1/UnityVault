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

export const inviteMember = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const { fullName, username, email, phone } = req.body as {
    fullName: string;
    username: string;
    email?: string;
    phone?: string;
  };

  const result = await container.memberService.createInvite({
    groupId: req.user.groupId,
    fullName,
    username,
    email,
    phone,
  });

  // Mock delivery: log invite details for email/SMS handoff.
  console.log("[Mock Invite Delivery]", {
    toEmail: email,
    toPhone: phone,
    link: result.invite.link,
    otp: result.invite.otp,
    expiresAt: result.invite.expiresAt,
  });

  res.status(201).json(result);
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

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const { fullName, email, phone, username } = req.body as {
    fullName?: string;
    email?: string;
    phone?: string;
    username?: string;
  };

  const member = container.memberService.updateProfile(req.user.userId, {
    fullName,
    email,
    phone,
    username,
  });

  res.json(member);
});

export const changeMemberPassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    throw new ApiError("Missing required fields", 400);
  }

  const result = await container.memberService.changePassword(
    req.user.userId,
    currentPassword,
    newPassword
  );
  res.json(result);
});

export const verifyMemberInvite = asyncHandler(async (req: Request, res: Response) => {
  const { token, otp } = req.body as { token?: string; otp?: string };
  if (!token || !otp) throw new ApiError("Missing required fields", 400);

  const result = await container.memberService.verifyInvite(token, otp);
  res.json(result);
});

export const completeMemberInvite = asyncHandler(async (req: Request, res: Response) => {
  const { token, otp, newPassword } = req.body as {
    token?: string;
    otp?: string;
    newPassword?: string;
  };

  if (!token || !otp || !newPassword) {
    throw new ApiError("Missing required fields", 400);
  }

  const result = await container.memberService.completeInvite({
    token,
    otp,
    newPassword,
  });
  res.json(result);
});

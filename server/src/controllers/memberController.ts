import type { Request, Response } from "express";
import { container } from "../container";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";

export const registerMember = asyncHandler(async (req: Request, res: Response) => {
  const { groupId, first_name, last_name, username, password, email, phone } = req.body as {
    groupId: string;
    first_name: string;
    last_name: string;
    username: string;
    password: string;
    email?: string;
    phone?: string;
  };

  const member = await container.memberService.register({
    groupId,
    first_name,
    last_name,
    username,
    password,
    email,
    phone,
  });

  res.status(201).json(member);
});

export const inviteMember = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const { first_name, last_name, username, email, phone } = req.body as {
    first_name: string;
    last_name: string;
    username: string;
    email?: string;
    phone?: string;
  };

  const result = await container.memberService.createInvite({
    groupId: req.user.groupId,
    first_name,
    last_name,
    username,
    email,
    phone,
  });

  res.status(201).json(result);
});

export const listMembers = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const members = await container.memberService.listByGroup(req.user.groupId);
  res.json({ items: members });
});

export const listDuplicateMemberCredentials = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);

  const duplicates = await container.memberService.listDuplicateCredentials(req.user.groupId);
  res.json(duplicates);
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const member = await container.memberService.getById(req.user.userId);
  res.json(member);
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const { first_name, last_name, email, phone, username } = req.body as {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    username?: string;
  };

  const member = await container.memberService.updateProfile(req.user.userId, {
    first_name,
    last_name,
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

export const recordRegistrationFeePayment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  
  const member = await container.memberService.recordRegistrationFeePayment(req.user.userId);
  res.json(member);
});

export const recordSeedDeposit = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);

  const member = await container.memberService.recordSeedDeposit(req.user.userId);
  res.json(member);
});

export const purchaseShares = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);

  const { shares } = req.body as { shares?: number };
  if (shares === undefined) throw new ApiError("Shares count is required", 400);

  const member = await container.memberService.purchaseShares({
    memberId: req.user.userId,
    shares: Number(shares),
  });
  res.json(member);
});

export const checkRegistrationFeeStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  
  const member = await container.memberService.getById(req.user.userId);
  res.json({ 
    registrationFeePaid: member.registrationFeePaid,
    registrationFeePaidAt: member.registrationFeePaidAt 
  });
});

import type { Request, Response } from "express";
import { container } from "../container";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";

export const createGroup = asyncHandler(async (req: Request, res: Response) => {
  const { name, settings, admin } = req.body as {
    name: string;
    settings: {
      contributionAmount: number;
      loanInterestRate: number;
      penaltyRate: number;
      contributionPenaltyRate: number;
      compulsoryInterestRate: number;
      minimumContributionMonths: number;
      loanToSavingsRatio: number;
      enableAutomaticPenalties: boolean;
    };
    admin: { email: string; username: string; password: string };
  };

  const result = await container.groupService.createGroup({ name, settings, admin });
  res.status(201).json(result);
});

export const getGroup = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  if (req.user.groupId !== req.params.groupId) throw new ApiError("Forbidden", 403);
  const group = container.groupService.getGroup(req.params.groupId);
  res.json(group);
});

export const getMyGroup = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const group = container.groupService.getGroup(req.user.groupId);
  res.json(group);
});

export const getGroupSettings = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const group = container.groupService.getGroup(req.user.groupId);
  res.json(group.settings);
});

export const updateGroupSettings = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const settings = req.body as {
    contributionAmount: number;
    loanInterestRate: number;
    penaltyRate: number;
    contributionPenaltyRate: number;
    compulsoryInterestRate: number;
    minimumContributionMonths: number;
    loanToSavingsRatio: number;
    enableAutomaticPenalties: boolean;
  };

  const updated = container.groupService.updateSettings(req.user.groupId, settings);
  res.json(updated.settings);
});

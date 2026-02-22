import type { Request, Response } from "express";
import { container } from "../container";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";

export const calculateDistribution = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);

  const { year } = req.body as { year: number };

  if (!year) {
    throw new ApiError("Year is required", 400);
  }

  const distribution = await container.distributionService.calculateDistribution({
    groupId: req.user.groupId,
    year,
  });

  res.json(distribution);
});

export const getDistributionBreakdown = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);

  const { year } = req.query as { year: string };

  if (!year) {
    throw new ApiError("Year is required", 400);
  }

  const breakdown = await container.distributionService.getDistributionBreakdown({
    groupId: req.user.groupId,
    year: parseInt(year, 10),
  });

  res.json({ items: breakdown });
});

export const executeDistribution = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  if (req.user.role !== "group_admin") {
    throw new ApiError("Only admins can execute distributions", 403);
  }

  const { year } = req.body as { year: number };

  if (!year) {
    throw new ApiError("Year is required", 400);
  }

  const distribution = await container.distributionService.executeDistribution({
    groupId: req.user.groupId,
    year,
  });

  res.json(distribution);
});

export const listDistributions = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);

  const distributions = await container.distributionService.listDistributions(
    req.user.groupId
  );

  res.json({ items: distributions });
});

export const getMemberDistributions = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);

  const memberId = req.user.role === "member" ? req.user.userId : req.query.memberId as string;

  if (!memberId) {
    throw new ApiError("Member ID is required", 400);
  }

  const memberDistributions = await container.distributionService.getMemberDistributions(memberId);
  
  // Enrich with year and status from parent distribution
  const enriched = await Promise.all(
    memberDistributions.map(async (md) => {
      const distribution = await container.distributionService.getDistribution(md.distributionId);
      return {
        ...md,
        year: distribution?.year || 0,
        status: md.paidAt ? "completed" as const : "pending" as const,
      };
    })
  );

  res.json({ items: enriched });
});

export const getEstimatedPayout = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);

  const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();
  if (!Number.isFinite(year)) {
    throw new ApiError("Invalid year", 400);
  }

  const memberId =
    req.user.role === "member" ? req.user.userId : ((req.query.memberId as string) || undefined);

  if (!memberId) {
    throw new ApiError("Member ID is required", 400);
  }

  const estimate = await container.distributionService.getEstimatedPayout({
    groupId: req.user.groupId,
    memberId,
    year,
  });

  res.json(estimate);
});

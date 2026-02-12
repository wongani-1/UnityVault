import type { Request, Response } from "express";
import { container } from "../container";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";

const buildSummary = (groupId: string) => {
  const members = container.memberService.listByGroup(groupId);
  const contributions = container.contributionService.listByGroup(groupId);
  const loans = container.loanService.listByGroup(groupId);
  const penalties = container.penaltyService.listByGroup(groupId);

  return {
    members: members.length,
    contributions: contributions.length,
    loans: loans.length,
    penalties: penalties.length,
  };
};

export const listReports = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const summary = buildSummary(req.user.groupId);

  res.json({
    items: [
      { type: "monthly", title: "Monthly Report", summary },
      { type: "yearly", title: "Yearly Report", summary },
      { type: "contributions", title: "Contribution Report", summary },
      { type: "loans", title: "Loan Portfolio", summary },
    ],
  });
});

export const exportReport = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const type = req.params.type;
  const summary = buildSummary(req.user.groupId);

  res.json({
    type,
    generatedAt: new Date().toISOString(),
    summary,
  });
});
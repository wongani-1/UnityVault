import type { Request, Response } from "express";
import { container } from "../container";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import type { TransactionType } from "../models/types";

const ALLOWED_TYPES: TransactionType[] = [
  "contribution",
  "loan_disbursement",
  "loan_repayment",
  "penalty_charged",
  "penalty_payment",
  "cycle_distribution",
  "initial_deposit",
  "seed_deposit",
  "share_purchase",
  "compulsory_interest",
];

export const listLedgerEntries = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);

  const { memberId, type, from, to, limit } = req.query as {
    memberId?: string;
    type?: string;
    from?: string;
    to?: string;
    limit?: string;
  };

  if (type && !ALLOWED_TYPES.includes(type as TransactionType)) {
    throw new ApiError("Invalid ledger type filter", 400);
  }

  const parsedLimit = limit ? Number.parseInt(limit, 10) : undefined;
  if (limit && (parsedLimit === undefined || !Number.isFinite(parsedLimit) || parsedLimit <= 0)) {
    throw new ApiError("Invalid limit filter", 400);
  }

  if (from && Number.isNaN(new Date(from).getTime())) {
    throw new ApiError("Invalid from date filter", 400);
  }

  if (to && Number.isNaN(new Date(to).getTime())) {
    throw new ApiError("Invalid to date filter", 400);
  }

  const items = await container.ledgerService.listEntries({
    groupId: req.user.groupId,
    role: req.user.role,
    requesterId: req.user.userId,
    memberId,
    type: type as TransactionType | undefined,
    from,
    to,
    limit: parsedLimit,
  });

  res.json({ items });
});

import type { Request, Response } from "express";
import { container } from "../container";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";

export const requestLoan = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const { amount, installments, reason } = req.body as {
    amount: number;
    installments?: number;
    reason?: string;
  };

  if (!amount || amount <= 0) {
    throw new ApiError("Loan amount must be greater than zero", 400);
  }

  const loan = await container.loanService.requestLoan({
    groupId: req.user.groupId,
    memberId: req.user.userId,
    principal: amount,
    installments: installments || 6,
    reason,
  });

  res.status(201).json(loan);
});

export const checkEligibility = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const { amount } = req.query as { amount?: string };

  const requestedAmount = amount ? parseFloat(amount) : 0;

  const eligibility = await container.loanService.checkEligibility({
    groupId: req.user.groupId,
    memberId: req.user.userId,
    requestedAmount,
  });

  res.json(eligibility);
});

export const listLoans = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);

  const loans = container.loanService.listByGroup(req.user.groupId);
  const items =
    req.user.role === "member"
      ? loans.filter((loan) => loan.memberId === req.user?.userId)
      : loans;

  res.json({ items });
});

export const approveLoan = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  if (req.user.role !== "group_admin") {
    throw new ApiError("Only admins can approve loans", 403);
  }

  const { installments } = req.body as { installments?: number };

  if (installments !== undefined && installments <= 0) {
    throw new ApiError("Installments must be greater than zero", 400);
  }

  const loan = await container.loanService.approveLoan({
    groupId: req.user.groupId,
    loanId: req.params.loanId,
    installments: installments || 6,
    actorId: req.user.userId,
  });

  res.json(loan);
});

export const rejectLoan = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  if (req.user.role !== "group_admin") {
    throw new ApiError("Only admins can reject loans", 403);
  }

  const { reason } = req.body as { reason?: string };

  const loan = await container.loanService.rejectLoan({
    groupId: req.user.groupId,
    loanId: req.params.loanId,
    actorId: req.user.userId,
    reason,
  });

  res.json(loan);
});

export const repayInstallment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const { installmentId } = req.body as { installmentId: string };

  if (!installmentId) {
    throw new ApiError("Installment ID is required", 400);
  }

  const loan = await container.loanService.repayInstallment({
    groupId: req.user.groupId,
    loanId: req.params.loanId,
    installmentId,
    actorId: req.user.userId,
    actorRole: req.user.role === "group_admin" ? "group_admin" : "member",
  });

  res.json(loan);
});

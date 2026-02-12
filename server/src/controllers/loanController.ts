import type { Request, Response } from "express";
import { container } from "../container";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";

export const requestLoan = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const { amount, installments } = req.body as {
    amount: number;
    installments?: number;
  };

  if (!amount || amount <= 0) {
    throw new ApiError("Loan amount must be greater than zero", 400);
  }

  const loan = container.loanService.requestLoan({
    groupId: req.user.groupId,
    memberId: req.user.userId,
    principal: amount,
    installments: installments || 6,
  });

  res.status(201).json(loan);
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
  const { installments } = req.body as { installments?: number };

  if (installments !== undefined && installments <= 0) {
    throw new ApiError("Installments must be greater than zero", 400);
  }

  const loan = container.loanService.approveLoan({
    groupId: req.user.groupId,
    loanId: req.params.loanId,
    installments: installments || 6,
  });

  res.json(loan);
});

export const rejectLoan = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);

  const loan = container.loanService.rejectLoan({
    groupId: req.user.groupId,
    loanId: req.params.loanId,
  });

  res.json(loan);
});

export const repayInstallment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const { installmentId } = req.body as { installmentId: string };

  const loan = container.loanService.repayInstallment({
    groupId: req.user.groupId,
    loanId: req.params.loanId,
    installmentId,
  });

  res.json(loan);
});

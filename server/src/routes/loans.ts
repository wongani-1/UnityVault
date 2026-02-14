import { Router } from "express";
import {
  requestLoan,
  listLoans,
  approveLoan,
  rejectLoan,
  repayInstallment,
  checkEligibility,
  checkOverdueInstallments,
} from "../controllers/loanController";
import { requireRole } from "../middleware/auth";

export const loansRouter = Router();

loansRouter.get("/", requireRole(["group_admin", "member"]), listLoans);
loansRouter.get("/eligibility", requireRole(["member"]), checkEligibility);
loansRouter.post("/request", requireRole(["member"]), requestLoan);
loansRouter.post("/:loanId/approve", requireRole(["group_admin"]), approveLoan);
loansRouter.post("/:loanId/reject", requireRole(["group_admin"]), rejectLoan);
loansRouter.post("/:loanId/repay", requireRole(["group_admin", "member"]), repayInstallment);
loansRouter.post("/check-overdue", requireRole(["group_admin"]), checkOverdueInstallments);

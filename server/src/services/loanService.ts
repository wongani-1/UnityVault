import type {
  LoanRepository,
  MemberRepository,
  PenaltyRepository,
  GroupRepository,
} from "../repositories/interfaces";
import type { Loan, LoanInstallment } from "../models/types";
import { createId } from "../utils/id";
import { ApiError } from "../utils/apiError";

const addMonths = (date: Date, months: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

export class LoanService {
  constructor(
    private loanRepository: LoanRepository,
    private memberRepository: MemberRepository,
    private penaltyRepository: PenaltyRepository,
    private groupRepository: GroupRepository
  ) {}

  requestLoan(params: {
    groupId: string;
    memberId: string;
    principal: number;
    installments: number;
  }) {
    const member = this.memberRepository.getById(params.memberId);
    if (!member) throw new ApiError("Member not found", 404);
    if (member.groupId !== params.groupId) throw new ApiError("Access denied", 403);

    const loan: Loan = {
      id: createId("loan"),
      groupId: params.groupId,
      memberId: params.memberId,
      principal: params.principal,
      interestRate: 0,
      totalInterest: 0,
      totalDue: params.principal,
      status: "pending",
      installments: [],
      createdAt: new Date().toISOString(),
    };

    return this.loanRepository.create(loan);
  }

  listByGroup(groupId: string) {
    return this.loanRepository.listByGroup(groupId);
  }

  approveLoan(params: {
    groupId: string;
    loanId: string;
    installments: number;
  }) {
    const loan = this.loanRepository.getById(params.loanId);
    if (!loan) throw new ApiError("Loan not found", 404);
    if (loan.groupId !== params.groupId) throw new ApiError("Access denied", 403);

    const group = this.groupRepository.getById(params.groupId);
    if (!group) throw new ApiError("Group not found", 404);

    const interestRate = group.settings.loanInterestRate;
    const totalInterest = loan.principal * interestRate;
    const totalDue = loan.principal + totalInterest;
    const installmentAmount = totalDue / params.installments;

    const installments: LoanInstallment[] = Array.from(
      { length: params.installments },
      (_, index) => ({
        id: createId("inst"),
        dueDate: addMonths(new Date(), index + 1).toISOString(),
        amount: Number(installmentAmount.toFixed(2)),
        status: "due",
      })
    );

    const updated = this.loanRepository.update(params.loanId, {
      interestRate,
      totalInterest,
      totalDue,
      status: "approved",
      approvedAt: new Date().toISOString(),
      installments,
    });

    if (!updated) throw new ApiError("Failed to approve loan");
    return updated;
  }

  rejectLoan(params: { groupId: string; loanId: string }) {
    const loan = this.loanRepository.getById(params.loanId);
    if (!loan) throw new ApiError("Loan not found", 404);
    if (loan.groupId !== params.groupId) throw new ApiError("Access denied", 403);

    const updated = this.loanRepository.update(params.loanId, {
      status: "rejected",
    });

    if (!updated) throw new ApiError("Failed to reject loan");
    return updated;
  }

  repayInstallment(params: {
    groupId: string;
    loanId: string;
    installmentId: string;
  }) {
    const loan = this.loanRepository.getById(params.loanId);
    if (!loan) throw new ApiError("Loan not found", 404);
    if (loan.groupId !== params.groupId) throw new ApiError("Access denied", 403);

    const installment = loan.installments.find(
      (item) => item.id === params.installmentId
    );
    if (!installment) throw new ApiError("Installment not found", 404);
    if (installment.status === "paid") throw new ApiError("Installment already paid");

    const now = new Date();
    const due = new Date(installment.dueDate);
    const isLate = now > due;

    installment.status = isLate ? "late" : "paid";
    installment.paidAt = now.toISOString();

    if (isLate) {
      const group = this.groupRepository.getById(params.groupId);
      const penaltyRate = group ? group.settings.penaltyRate : 0.01;
      const penaltyAmount = loan.totalDue * penaltyRate;

      this.penaltyRepository.create({
        id: createId("penalty"),
        groupId: params.groupId,
        memberId: loan.memberId,
        loanId: loan.id,
        amount: penaltyAmount,
        reason: "Late loan installment",
        createdAt: now.toISOString(),
        resolved: false,
      });

      const member = this.memberRepository.getById(loan.memberId);
      if (member) {
        this.memberRepository.update(member.id, {
          penaltiesTotal: member.penaltiesTotal + penaltyAmount,
        });
      }
    }

    const allPaid = loan.installments.every((item) => item.status === "paid");
    const status = allPaid ? "closed" : loan.status;

    const updated = this.loanRepository.update(params.loanId, {
      installments: loan.installments,
      status,
    });

    if (!updated) throw new ApiError("Failed to record repayment");
    return updated;
  }
}

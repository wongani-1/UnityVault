import type {
  LoanRepository,
  MemberRepository,
  PenaltyRepository,
  GroupRepository,
  NotificationRepository,
  ContributionRepository,
  AuditRepository,
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
    private groupRepository: GroupRepository,
    private notificationRepository: NotificationRepository,
    private contributionRepository: ContributionRepository,
    private auditRepository: AuditRepository
  ) {}

  /**
   * Check loan eligibility for a member
   * Returns eligibility status and reasons for ineligibility
   */
  async checkEligibility(params: { groupId: string; memberId: string; requestedAmount: number }) {
    const member = await this.memberRepository.getById(params.memberId);
    if (!member) throw new ApiError("Member not found", 404);
    if (member.groupId !== params.groupId) throw new ApiError("Access denied", 403);

    const group = await this.groupRepository.getById(params.groupId);
    if (!group) throw new ApiError("Group not found", 404);

    const reasons: string[] = [];
    let isEligible = true;

    // 1. Check member status is Active
    if (member.status !== "active") {
      isEligible = false;
      reasons.push("Member status must be Active");
    }

    // 2. Check for overdue installments
    const memberLoans = await this.loanRepository.listByMember(params.memberId);
    const now = new Date();
    const hasOverdueInstallments = memberLoans.some((loan) =>
      loan.installments.some(
        (inst) =>
          inst.status === "overdue" ||
          (inst.status === "unpaid" && new Date(inst.dueDate) < now)
      )
    );
    if (hasOverdueInstallments) {
      isEligible = false;
      reasons.push("You have overdue loan installments");
    }

    // 3. Check for unpaid penalties
    const penalties = await this.penaltyRepository.listByMember(params.memberId);
    const unpaidPenalties = penalties.filter((p) => !p.isPaid);
    if (unpaidPenalties.length > 0) {
      isEligible = false;
      reasons.push(`You have ${unpaidPenalties.length} unpaid penalties`);
    }

    // 4. Check minimum contribution duration
    const contributions = await this.contributionRepository.listByMember(params.memberId);
    const paidContributions = contributions.filter((c) => c.paidAt);
    const minMonths = group.settings.minimumContributionMonths || 3;
    if (paidContributions.length < minMonths) {
      isEligible = false;
      reasons.push(
        `Minimum ${minMonths} months of contributions required (you have ${paidContributions.length})`
      );
    }

    // 5. Check loan-to-savings ratio
    const totalContributions = paidContributions.reduce((sum, c) => sum + c.amount, 0);
    const maxLoanAmount = totalContributions * (group.settings.loanToSavingsRatio || 2.0);
    if (params.requestedAmount > 0 && params.requestedAmount > maxLoanAmount) {
      isEligible = false;
      reasons.push(
        `Requested amount exceeds maximum allowed (MWK ${maxLoanAmount.toLocaleString()} based on your contributions)`
      );
    }

    // 6. Check for existing active loans
    const activeLoans = memberLoans.filter(
      (loan) => loan.status === "active" && (loan.balance === undefined || loan.balance > 0)
    );
    if (activeLoans.length > 0) {
      isEligible = false;
      reasons.push("You already have an active loan. Please clear it before applying for a new one");
    }

    return {
      isEligible,
      reasons,
      maxLoanAmount,
      contributionMonths: paidContributions.length,
      requiredMonths: minMonths,
    };
  }

  async requestLoan(params: {
    groupId: string;
    memberId: string;
    principal: number;
    installments: number;
    reason?: string;
  }) {
    const member = await this.memberRepository.getById(params.memberId);
    if (!member) throw new ApiError("Member not found", 404);
    if (member.groupId !== params.groupId) throw new ApiError("Access denied", 403);

    // Check eligibility
    const eligibility = await this.checkEligibility({
      groupId: params.groupId,
      memberId: params.memberId,
      requestedAmount: params.principal,
    });

    if (!eligibility.isEligible) {
      throw new ApiError(
        `Loan application denied: ${eligibility.reasons.join("; ")}`,
        400
      );
    }

    const loan: Loan = {
      id: createId("loan"),
      groupId: params.groupId,
      memberId: params.memberId,
      principal: params.principal,
      interestRate: 0,
      totalInterest: 0,
      totalDue: params.principal,
      balance: params.principal,
      status: "pending",
      installments: [],
      reason: params.reason,
      createdAt: new Date().toISOString(),
    };

    const created = await this.loanRepository.create(loan);

    // Send notification to admin
    await this.notificationRepository.create({
      id: createId("notif"),
      groupId: params.groupId,
      adminId: undefined, // Will be sent to all group admins
      type: "loan_request",
      message: `${member.fullName} has requested a loan of MWK ${params.principal.toLocaleString()}`,
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    // Create audit log
    await this.auditRepository.create({
      id: createId("audit"),
      groupId: params.groupId,
      actorId: params.memberId,
      actorRole: "member",
      action: "loan_requested",
      entityType: "loan",
      entityId: created.id,
      createdAt: new Date().toISOString(),
      meta: { principal: params.principal, reason: params.reason },
    });

    return created;
  }

  async listByGroup(groupId: string) {
    return this.loanRepository.listByGroup(groupId);
  }

  async approveLoan(params: {
    groupId: string;
    loanId: string;
    installments: number;
    actorId: string;
  }) {
    const loan = await this.loanRepository.getById(params.loanId);
    if (!loan) throw new ApiError("Loan not found", 404);
    if (loan.groupId !== params.groupId) throw new ApiError("Access denied", 403);
    if (loan.status !== "pending") {
      throw new ApiError("Only pending loans can be approved", 400);
    }

    const group = await this.groupRepository.getById(params.groupId);
    if (!group) throw new ApiError("Group not found", 404);

    const member = await this.memberRepository.getById(loan.memberId);
    if (!member) throw new ApiError("Member not found", 404);

    // Calculate interest and total amounts
    const interestRate = group.settings.loanInterestRate;
    const totalInterest = loan.principal * interestRate;
    const totalDue = loan.principal + totalInterest;
    const installmentAmount = totalDue / params.installments;

    // Split each installment into principal and interest portions
    const principalPerInstallment = loan.principal / params.installments;
    const interestPerInstallment = totalInterest / params.installments;

    // Generate installment plan
    const now = new Date();
    const installments: LoanInstallment[] = Array.from(
      { length: params.installments },
      (_, index) => ({
        id: createId("inst"),
        installmentNumber: index + 1,
        dueDate: addMonths(now, index + 1).toISOString(),
        amount: Number(installmentAmount.toFixed(2)),
        principalAmount: Number(principalPerInstallment.toFixed(2)),
        interestAmount: Number(interestPerInstallment.toFixed(2)),
        status: "unpaid",
      })
    );

    const finalDueDate = installments[installments.length - 1].dueDate;

    // Update loan to approved/active status
    const updated = await this.loanRepository.update(params.loanId, {
      interestRate,
      totalInterest: Number(totalInterest.toFixed(2)),
      totalDue: Number(totalDue.toFixed(2)),
      balance: Number(totalDue.toFixed(2)),
      status: "active",
      approvedAt: now.toISOString(),
      dueDate: finalDueDate,
      installments,
    });

    if (!updated) throw new ApiError("Failed to approve loan");

    // Send notification to member
    await this.notificationRepository.create({
      id: createId("notif"),
      groupId: params.groupId,
      memberId: loan.memberId,
      type: "loan_approved",
      message: `Your loan of MWK ${loan.principal.toLocaleString()} has been approved. Total repayment: MWK ${totalDue.toLocaleString()} in ${params.installments} installments`,
      status: "pending",
      createdAt: now.toISOString(),
    });

    // Create audit log
    await this.auditRepository.create({
      id: createId("audit"),
      groupId: params.groupId,
      actorId: params.actorId,
      actorRole: "group_admin",
      action: "loan_approved",
      entityType: "loan",
      entityId: params.loanId,
      createdAt: now.toISOString(),
      meta: {
        principal: loan.principal,
        totalDue,
        installments: params.installments,
        memberId: loan.memberId,
        memberName: member.fullName,
      },
    });

    return updated;
  }

  async rejectLoan(params: { 
    groupId: string; 
    loanId: string;
    actorId: string;
    reason?: string;
  }) {
    const loan = await this.loanRepository.getById(params.loanId);
    if (!loan) throw new ApiError("Loan not found", 404);
    if (loan.groupId !== params.groupId) throw new ApiError("Access denied", 403);
    if (loan.status !== "pending") {
      throw new ApiError("Only pending loans can be rejected", 400);
    }

    const member = await this.memberRepository.getById(loan.memberId);
    if (!member) throw new ApiError("Member not found", 404);

    const now = new Date().toISOString();

    const updated = await this.loanRepository.update(params.loanId, {
      status: "rejected",
      rejectedAt: now,
      rejectionReason: params.reason,
    });

    if (!updated) throw new ApiError("Failed to reject loan");

    // Send notification to member
    await this.notificationRepository.create({
      id: createId("notif"),
      groupId: params.groupId,
      memberId: loan.memberId,
      type: "loan_rejected",
      message: `Your loan request of MWK ${loan.principal.toLocaleString()} has been rejected${params.reason ? `: ${params.reason}` : ""}`,
      status: "pending",
      createdAt: now,
    });

    // Create audit log
    await this.auditRepository.create({
      id: createId("audit"),
      groupId: params.groupId,
      actorId: params.actorId,
      actorRole: "group_admin",
      action: "loan_rejected",
      entityType: "loan",
      entityId: params.loanId,
      createdAt: now,
      meta: {
        reason: params.reason,
        memberId: loan.memberId,
        memberName: member.fullName,
        principal: loan.principal,
      },
    });

    return updated;
  }

  /**
   * Mark overdue installments and apply penalties automatically
   * Should be run periodically (e.g., daily cron job)
   */
  /**
   * Automatically process overdue installments and apply penalties
   * Called automatically when loans are accessed
   */
  async processOverdueInstallments(groupId: string) {
    const loans = await this.loanRepository.listByGroup(groupId);
    const activeLoans = loans.filter((loan) => loan.status === "active");
    const now = new Date();

    const group = await this.groupRepository.getById(groupId);
    if (!group) throw new ApiError("Group not found", 404);

    const results = {
      processed: 0,
      penaltiesApplied: 0,
    };

    for (const loan of activeLoans) {
      let loanUpdated = false;
      let penaltyApplied = false;

      for (const installment of loan.installments) {
        if (installment.status === "unpaid" && new Date(installment.dueDate) < now) {
          installment.status = "overdue";
          loanUpdated = true;

          // Apply penalty if automatic penalties are enabled
          if (group.settings.enableAutomaticPenalties) {
            // Check if penalty already exists for this installment
            const existingPenalties = await this.penaltyRepository.listByMember(loan.memberId);
            const hasPenaltyForInstallment = existingPenalties.some(
              (p) => p.installmentId === installment.id
            );

            if (!hasPenaltyForInstallment) {
              const penaltyAmount = installment.amount * group.settings.penaltyRate;
              const penaltyDueDate = new Date(now);
              penaltyDueDate.setDate(penaltyDueDate.getDate() + 7);

              await this.penaltyRepository.create({
                id: createId("penalty"),
                groupId: groupId,
                memberId: loan.memberId,
                loanId: loan.id,
                installmentId: installment.id,
                amount: Number(penaltyAmount.toFixed(2)),
                reason: `Overdue loan installment #${installment.installmentNumber}`,
                status: "unpaid",
                dueDate: penaltyDueDate.toISOString(),
                createdAt: now.toISOString(),
                isPaid: false,
              });

              // Update member penalties total
              const member = await this.memberRepository.getById(loan.memberId);
              if (member) {
                await this.memberRepository.update(member.id, {
                  penaltiesTotal: member.penaltiesTotal + Number(penaltyAmount.toFixed(2)),
                });
              }

              penaltyApplied = true;
              results.penaltiesApplied++;

              // Notify member
              await this.notificationRepository.create({
                id: createId("notif"),
                groupId: groupId,
                memberId: loan.memberId,
                type: "installment_overdue",
                message: `Your loan installment #${installment.installmentNumber} of MWK ${installment.amount.toLocaleString()} is overdue. A penalty of MWK ${penaltyAmount.toLocaleString()} has been applied.`,
                status: "pending",
                createdAt: now.toISOString(),
              });
            }
          }
        }
      }

      if (loanUpdated) {
        await this.loanRepository.update(loan.id, {
          installments: loan.installments,
        });
        results.processed++;
      }
    }

    return results;
  }

  async repayInstallment(params: {
    groupId: string;
    loanId: string;
    installmentId: string;
    actorId: string;
    actorRole: "member" | "group_admin";
  }) {
    const loan = await this.loanRepository.getById(params.loanId);
    if (!loan) throw new ApiError("Loan not found", 404);
    if (loan.groupId !== params.groupId) throw new ApiError("Access denied", 403);

    const member = await this.memberRepository.getById(loan.memberId);
    if (!member) throw new ApiError("Member not found", 404);

    const installment = loan.installments.find(
      (item) => item.id === params.installmentId
    );
    if (!installment) throw new ApiError("Installment not found", 404);
    if (installment.status === "paid") {
      throw new ApiError("Installment already paid", 400);
    }

    const now = new Date();

    // Mark installment as paid
    installment.status = "paid";
    installment.paidAt = now.toISOString();

    // Recalculate remaining balance
    const paidInstallments = loan.installments.filter((i) => i.status === "paid");
    const paidAmount = paidInstallments.reduce((sum, i) => sum + i.amount, 0);
    const newBalance = loan.totalDue - paidAmount;

    // Check if all installments are paid
    const allPaid = loan.installments.every((item) => item.status === "paid");
    const status = allPaid ? "completed" : loan.status;
    const completedAt = allPaid ? now.toISOString() : loan.completedAt;

    const updated = await this.loanRepository.update(params.loanId, {
      installments: loan.installments,
      balance: Number(newBalance.toFixed(2)),
      status,
      completedAt,
    });

    if (!updated) throw new ApiError("Failed to record repayment");

    // Create audit log
    await this.auditRepository.create({
      id: createId("audit"),
      groupId: params.groupId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      action: "installment_paid",
      entityType: "loan",
      entityId: params.loanId,
      createdAt: now.toISOString(),
      meta: {
        installmentId: params.installmentId,
        amount: installment.amount,
        remainingBalance: newBalance,
        memberId: loan.memberId,
        memberName: member.fullName,
      },
    });

    // If loan completed, send notification
    if (allPaid) {
      await this.notificationRepository.create({
        id: createId("notif"),
        groupId: params.groupId,
        memberId: loan.memberId,
        type: "loan_completed",
        message: `Congratulations! Your loan of MWK ${loan.principal.toLocaleString()} has been fully repaid.`,
        status: "pending",
        createdAt: now.toISOString(),
      });

      // Create audit log for loan completion
      await this.auditRepository.create({
        id: createId("audit"),
        groupId: params.groupId,
        actorId: params.actorId,
        actorRole: params.actorRole,
        action: "loan_completed",
        entityType: "loan",
        entityId: params.loanId,
        createdAt: now.toISOString(),
        meta: {
          principal: loan.principal,
          totalPaid: loan.totalDue,
          memberId: loan.memberId,
          memberName: member.fullName,
        },
      });
    }

    return updated;
  }
}

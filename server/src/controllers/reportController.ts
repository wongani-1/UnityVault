import type { Request, Response } from "express";
import { container } from "../container";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";

const buildSummary = async (groupId: string) => {
  const members = await container.memberService.listByGroup(groupId);
  const contributions = await container.contributionService.listByGroup(groupId);
  const loans = await container.loanService.listByGroup(groupId);
  const penalties = await container.penaltyService.listByGroup(groupId);

  return {
    members: members.length,
    contributions: contributions.length,
    loans: loans.length,
    penalties: penalties.length,
  };
};

export const listReports = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const summary = await buildSummary(req.user.groupId);

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
  const groupId = req.user.groupId;

  // Get group info
  const group = await container.groupService.getGroup(groupId);
  if (!group) throw new ApiError("Group not found", 404);

  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;

  let reportData: any = {
    type,
    generatedAt: currentDate.toISOString(),
  };

  if (type === "monthly-report") {
    // Monthly financial summary
    const members = await container.memberService.listByGroup(groupId);
    const contributions = await container.contributionService.listByGroup(groupId);
    const loans = await container.loanService.listByGroup(groupId);
    const penalties = await container.penaltyService.listByGroup(groupId);

    // Current month contributions
    const currentMonthContributions = contributions.filter(c => c.month === currentMonth);
    const paidContributions = currentMonthContributions.filter(c => c.status === "paid");
    const unpaidContributions = currentMonthContributions.filter(c => c.status !== "paid");

    // Active loans
    const activeLoans = loans.filter(l => l.status === "active");
    const totalLoansDisbursed = activeLoans.reduce((sum, l) => sum + l.principal, 0);
    const totalLoansOutstanding = activeLoans.reduce((sum, l) => sum + l.balance, 0);

    // Unpaid penalties
    const unpaidPenalties = penalties.filter(p => p.status === "unpaid");
    const totalUnpaidPenalties = unpaidPenalties.reduce((sum, p) => sum + p.amount, 0);

    reportData.summary = {
      totalMembers: members.length,
      activeMembers: members.filter(m => m.status === "active").length,
      totalSavings: group.totalSavings,
      totalIncome: group.totalIncome,
      availableCash: group.cash,
      contributionsPaid: paidContributions.length,
      contributionsUnpaid: unpaidContributions.length,
      activeLoans: activeLoans.length,
      totalLoansDisbursed,
      totalLoansOutstanding,
      unpaidPenalties: unpaidPenalties.length,
      totalUnpaidPenalties,
    };
  } else if (type === "yearly-report") {
    // Annual audit report
    const members = await container.memberService.listByGroup(groupId);
    const contributions = await container.contributionService.listByGroup(groupId);
    const loans = await container.loanService.listByGroup(groupId);
    const penalties = await container.penaltyService.listByGroup(groupId);

    const currentYear = currentDate.getFullYear();
    const yearlyContributions = contributions.filter(c => c.month.startsWith(String(currentYear)));
    const paidYearlyContributions = yearlyContributions.filter(c => c.status === "paid");
    const totalYearlyContributions = paidYearlyContributions.reduce((sum, c) => sum + c.amount, 0);

    const yearlyLoans = loans.filter(l => 
      l.approvedAt && new Date(l.approvedAt).getFullYear() === currentYear
    );
    const totalYearlyLoans = yearlyLoans.reduce((sum, l) => sum + l.principal, 0);

    const yearlyPenalties = penalties.filter(p => 
      new Date(p.createdAt).getFullYear() === currentYear
    );
    const totalYearlyPenalties = yearlyPenalties.reduce((sum, p) => sum + p.amount, 0);

    reportData.summary = {
      year: currentYear,
      totalMembers: members.length,
      totalSavings: group.totalSavings,
      totalIncome: group.totalIncome,
      availableCash: group.cash,
      yearlyContributions: totalYearlyContributions,
      yearlyLoans: totalYearlyLoans,
      yearlyPenalties: totalYearlyPenalties,
      netGrowth: totalYearlyContributions - totalYearlyLoans,
    };
  } else if (type === "contribution-report") {
    // Member-by-member contribution breakdown
    const members = await container.memberService.listByGroup(groupId);
    const contributions = await container.contributionService.listByGroup(groupId);

    // Get current month contributions
    const currentMonthContributions = contributions.filter(c => c.month === currentMonth);
    
    const contributionMap = new Map(
      currentMonthContributions.map(c => [c.memberId, c])
    );

    const items = members.map(member => {
      const contribution = contributionMap.get(member.id);
      return {
        memberName: member.fullName,
        status: contribution ? contribution.status : "unpaid",
        amount: contribution ? contribution.amount : group.settings.contributionAmount,
        paidAt: contribution?.paidAt || null,
      };
    });

    const paid = items.filter(i => i.status === "paid");
    const unpaid = items.filter(i => i.status !== "paid");

    reportData.summary = {
      month: currentMonth,
      totalMembers: members.length,
      contributionsPaid: paid.length,
      contributionsUnpaid: unpaid.length,
      totalCollected: paid.reduce((sum, i) => sum + i.amount, 0),
      expectedAmount: members.length * group.settings.contributionAmount,
    };
    reportData.items = items;
  } else if (type === "loan-portfolio") {
    // Active loans and repayment status
    const members = await container.memberService.listByGroup(groupId);
    const loans = await container.loanService.listByGroup(groupId);

    const activeLoans = loans.filter(l => l.status === "active");
    const memberMap = new Map(members.map(m => [m.id, m]));

    const items = activeLoans.map(loan => {
      const member = memberMap.get(loan.memberId);
      const paidInstallments = loan.installments.filter(i => i.status === "paid").length;
      const totalInstallments = loan.installments.length;
      
      return {
        memberName: member?.fullName || "Unknown",
        principal: loan.principal,
        totalDue: loan.totalDue,
        balance: loan.balance,
        interestRate: `${(loan.interestRate * 100).toFixed(1)}%`,
        installmentsPaid: `${paidInstallments}/${totalInstallments}`,
        status: loan.status,
        approvedAt: loan.approvedAt,
      };
    });

    reportData.summary = {
      activeLoans: activeLoans.length,
      totalDisbursed: activeLoans.reduce((sum, l) => sum + l.principal, 0),
      totalOutstanding: activeLoans.reduce((sum, l) => sum + l.balance, 0),
      totalExpectedInterest: activeLoans.reduce((sum, l) => sum + l.totalInterest, 0),
    };
    reportData.items = items;
  }

  res.json(reportData);
});
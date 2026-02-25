import { Request, Response } from "express";
import PDFDocument from "pdfkit";
import { container } from "../container";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import { env } from "../config/env";
import * as memoryRepositories from "../repositories/memory";
import * as supabaseRepositories from "../repositories/supabase";

const repositories =
  env.dataStore === "supabase" ? supabaseRepositories : memoryRepositories;

export const generateContributionReceipt = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  
  const { contributionId } = req.params;
  const userId = req.user.userId;
  const userRole = req.user.role;

  // Get contribution details
  const contribution = await repositories.contributionRepository.getById(contributionId);
  
  if (!contribution) {
    throw new ApiError("Contribution not found", 404);
  }

  // Verify user has access
  if (userRole === "member" && contribution.memberId !== userId) {
    throw new ApiError("Access denied", 403);
  }

  // Get member and group details
  const member = await repositories.memberRepository.getById(contribution.memberId);
  const group = await repositories.groupRepository.getById(contribution.groupId);

  if (!member || !group) {
    throw new ApiError("Member or Group not found", 404);
  }

  // Create PDF
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  // Set response headers
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=receipt-${contributionId}.pdf`
  );

  // Pipe PDF to response
  doc.pipe(res);

  // Branded header bar
  doc.rect(0, 0, doc.page.width, 80).fillColor("#047857").fill();
  doc.fontSize(24).fillColor("#ffffff").text("PAYMENT RECEIPT", 50, 25, { align: "center" });
  doc.fontSize(10).fillColor("#d1fae5").text(group.name, 50, 52, { align: "center" });

  doc.moveDown(4);

  // Receipt Details
  doc.fontSize(13).fillColor("#047857").text("Receipt Details");
  doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor("#047857").stroke();
  doc.moveDown(0.5);

  const formatMethod = (method?: string) => {
    if (method === "airtel_money") return "Airtel Money";
    if (method === "tnm_mpamba") return "TNM Mpamba";
    if (method === "card") return "Card Payment";
    return "N/A";
  };

  const details = [
    ["Receipt No:", contributionId.substring(0, 8).toUpperCase()],
    ["Date:", new Date(contribution.paidAt || contribution.createdAt).toLocaleDateString()],
    ["Member:", `${member.first_name} ${member.last_name}`],
    ["Username:", member.username],
    ["Email:", member.email || "N/A"],
    ["Phone:", member.phone || "N/A"],
    ["Month:", contribution.month],
    ["Amount Paid:", `MWK ${contribution.amount.toLocaleString()}`],
    ["Payment Method:", formatMethod((contribution as any).paymentMethod)],
    ["Payment Status:", contribution.status.toUpperCase()],
    ["Due Date:", new Date(contribution.dueDate).toLocaleDateString()],
    ["Paid Date:", contribution.paidAt ? new Date(contribution.paidAt).toLocaleDateString() : "N/A"],
  ];

  details.forEach(([label, value]) => {
    doc.fontSize(10)
       .fillColor("#666")
       .text(label, 50, doc.y, { continued: true, width: 150 })
       .fillColor("#000")
       .text(value, { width: 350 });
    doc.moveDown(0.5);
  });

  doc.moveDown(2);

  // Footer
  doc.fontSize(8)
     .fillColor("#999")
     .text(`Generated on ${new Date().toLocaleString()}`, { align: "center" });

  doc.moveDown();
  doc.text("This is an electronically generated receipt and does not require a signature.", {
    align: "center",
  });

  // Finalize PDF
  doc.end();
});

export const generateLoanPaymentReceipt = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  
  const { installmentId } = req.params;
  const userId = req.user.userId;
  const userRole = req.user.role;

  // Get all loans to find the one with this installment
  const loans = await repositories.loanRepository.listByGroup(req.user.groupId);
  const loan = loans.find((l) => l.installments.some((inst) => inst.id === installmentId));

  if (!loan) {
    throw new ApiError("Loan installment not found", 404);
  }

  const installment = loan.installments.find((inst) => inst.id === installmentId);
  if (!installment) {
    throw new ApiError("Installment not found", 404);
  }

  // Verify access
  if (userRole === "member" && loan.memberId !== userId) {
    throw new ApiError("Access denied", 403);
  }

  // Get member and group
  const member = await repositories.memberRepository.getById(loan.memberId);
  const group = await repositories.groupRepository.getById(loan.groupId);

  if (!member || !group) {
    throw new ApiError("Member or Group not found", 404);
  }

  // Create PDF
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=loan-receipt-${installmentId}.pdf`
  );

  doc.pipe(res);

  // Branded header bar
  doc.rect(0, 0, doc.page.width, 80).fillColor("#047857").fill();
  doc.fontSize(24).fillColor("#ffffff").text("LOAN PAYMENT RECEIPT", 50, 25, { align: "center" });
  doc.fontSize(10).fillColor("#d1fae5").text(group.name, 50, 52, { align: "center" });

  doc.moveDown(4);

  // Receipt Details
  doc.fontSize(13).fillColor("#047857").text("Receipt Details");
  doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor("#047857").stroke();
  doc.moveDown(0.5);

  const paidInstallments = loan.installments.filter((i: any) => i.status === "paid").length;
  const totalInstallments = loan.installments.length;

  const details = [
    ["Receipt No:", installmentId.substring(0, 8).toUpperCase()],
    ["Date:", new Date(installment.paidAt || installment.dueDate).toLocaleDateString()],
    ["Member:", `${member.first_name} ${member.last_name}`],
    ["Username:", member.username],
    ["Email:", member.email || "N/A"],
    ["Phone:", member.phone || "N/A"],
    ["Installment:", `#${installment.installmentNumber} of ${totalInstallments}`],
    ["Principal Amount:", `MWK ${installment.principalAmount.toLocaleString()}`],
    ["Interest Amount:", `MWK ${installment.interestAmount.toLocaleString()}`],
    ["Total Amount:", `MWK ${installment.amount.toLocaleString()}`],
    ["Due Date:", new Date(installment.dueDate).toLocaleDateString()],
    ["Paid Date:", installment.paidAt ? new Date(installment.paidAt).toLocaleDateString() : "N/A"],
    ["Payment Status:", installment.status.toUpperCase()],
  ];

  details.forEach(([label, value]) => {
    doc.fontSize(10)
       .fillColor("#666")
       .text(label, 50, doc.y, { continued: true, width: 150 })
       .fillColor("#000")
       .text(value, { width: 350 });
    doc.moveDown(0.5);
  });

  doc.moveDown(2);

  // Loan Summary
  doc.fontSize(13).fillColor("#047857").text("Loan Summary");
  doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor("#047857").stroke();
  doc.moveDown(0.5);

  const loanSummary = [
    ["Original Principal:", `MWK ${loan.principal.toLocaleString()}`],
    ["Interest Rate:", `${(loan.interestRate * 100).toFixed(1)}%`],
    ["Total Due:", `MWK ${loan.totalDue.toLocaleString()}`],
    ["Remaining Balance:", `MWK ${loan.balance.toLocaleString()}`],
    ["Installments Paid:", `${paidInstallments} of ${totalInstallments}`],
    ["Loan Status:", loan.status.toUpperCase()],
    ["Approved Date:", loan.approvedAt ? new Date(loan.approvedAt).toLocaleDateString() : "N/A"],
    ["Final Due Date:", loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : "N/A"],
  ];

  loanSummary.forEach(([label, value]) => {
    doc.fontSize(10)
       .fillColor("#666")
       .text(label, 50, doc.y, { continued: true, width: 150 })
       .fillColor("#000")
       .text(value, { width: 350 });
    doc.moveDown(0.5);
  });

  doc.moveDown(2);

  // Footer
  doc.fontSize(8)
     .fillColor("#999")
     .text(`Generated on ${new Date().toLocaleString()}`, { align: "center" });

  doc.moveDown();
  doc.text("This is an electronically generated receipt and does not require a signature.", {
    align: "center",
  });

  doc.end();
});

export const emailReceipt = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  
  const { type, id } = req.body;
  const userId = req.user.userId;

  if (!type || !id) {
    throw new ApiError("Receipt type and ID are required", 400);
  }

  // Get user email
  const user = await (req.user.role === "group_admin"
    ? container.adminService.getById(userId)
    : container.memberService.getById(userId));

  if (!user || !user.email) {
    throw new ApiError("User email not found", 400);
  }

  // Note: You'll need to implement actual email sending using your email service
  // For now, we'll return success
  res.json({
    message: `Receipt will be sent to ${user.email}`,
    email: user.email,
  });
});

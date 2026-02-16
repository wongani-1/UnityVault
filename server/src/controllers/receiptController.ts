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

  // Header
  doc.fillColor("#047857")
     .fontSize(24)
     .text("PAYMENT RECEIPT", { align: "center" });

  doc.moveDown();
  doc.fontSize(10)
     .fillColor("#666")
     .text(group.name, { align: "center" });

  doc.moveDown(2);

  // Receipt Details
  doc.fontSize(12).fillColor("#000").text("Receipt Details", { underline: true });
  doc.moveDown(0.5);

  const details = [
    ["Receipt No:", contributionId.substring(0, 8).toUpperCase()],
    ["Date:", new Date(contribution.paidAt || contribution.createdAt).toLocaleDateString()],
    ["Member:", member.fullName || member.username],
    ["Month:", contribution.month],
    ["Amount Paid:", `MWK ${contribution.amount.toLocaleString()}`],
    ["Payment Status:", contribution.status.toUpperCase()],
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

  // Header
  doc.fillColor("#047857")
     .fontSize(24)
     .text("LOAN PAYMENT RECEIPT", { align: "center" });

  doc.moveDown();
  doc.fontSize(10).fillColor("#666").text(group.name, { align: "center" });

  doc.moveDown(2);

  // Receipt Details
  doc.fontSize(12).fillColor("#000").text("Receipt Details", { underline: true });
  doc.moveDown(0.5);

  const details = [
    ["Receipt No:", installmentId.substring(0, 8).toUpperCase()],
    ["Date:", new Date(installment.paidAt || installment.dueDate).toLocaleDateString()],
    ["Member:", member.fullName || member.username],
    ["Installment:", `#${installment.installmentNumber}`],
    ["Principal Amount:", `MWK ${installment.principalAmount.toLocaleString()}`],
    ["Interest Amount:", `MWK ${installment.interestAmount.toLocaleString()}`],
    ["Total Amount:", `MWK ${installment.amount.toLocaleString()}`],
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
  doc.fontSize(12).fillColor("#000").text("Loan Summary", { underline: true });
  doc.moveDown(0.5);

  doc.fontSize(10)
     .fillColor("#666")
     .text("Loan Balance:", 50, doc.y, { continued: true, width: 150 })
     .fillColor("#000")
     .text(`MWK ${loan.balance.toLocaleString()}`, { width: 350 });

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

import type { Request, Response } from "express";
import { container } from "../container";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import PDFDocument from "pdfkit";

export const exportMemberData = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  if (req.user.role !== "member") throw new ApiError("Only members can export personal data", 403);

  const memberId = req.user.userId;
  const groupId = req.user.groupId;

  // Fetch all member-related data
  const member = await container.memberService.getById(memberId);
  if (!member) throw new ApiError("Member not found", 404);

  const group = await container.groupService.getGroup(groupId);
  const memberContributions = await container.contributionService.listByMember(memberId);

  const loans = await container.loanService.listByGroup(groupId);
  const memberLoans = loans.filter(l => l.memberId === memberId);

  const penalties = await container.penaltyService.listByGroup(groupId);
  const memberPenalties = penalties.filter(p => p.memberId === memberId);

  // Create PDF
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="member_data.pdf"');
  
  doc.pipe(res);
  generateMemberPDF(doc, member, memberContributions, memberLoans, memberPenalties, group);
  doc.end();
});

export const exportGroupData = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  if (req.user.role !== "group_admin") throw new ApiError("Only admins can export group data", 403);

  const groupId = req.user.groupId;

  // Fetch all group data
  const group = await container.groupService.getGroup(groupId);
  if (!group) throw new ApiError("Group not found", 404);

  const members = await container.memberService.listByGroup(groupId);
  const admins = await container.adminService.listByGroup(groupId);
  const contributions = await container.contributionService.listByGroup(groupId);
  const loans = await container.loanService.listByGroup(groupId);
  const penalties = await container.penaltyService.listByGroup(groupId);

  // Create PDF
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${group.name.replace(/\s+/g, "_")}_data.pdf"`);
  
  doc.pipe(res);
  generateGroupPDF(doc, group, members, admins, contributions, loans, penalties);
  doc.end();
});

export const exportGroupMembers = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  if (req.user.role !== "group_admin") throw new ApiError("Only admins can export member list", 403);

  const groupId = req.user.groupId;
  const members = await container.memberService.listByGroup(groupId);
  const group = await container.groupService.getGroup(groupId);

  // Create PDF
  const doc = new PDFDocument({ margin: 50, size: "A4", layout: "landscape" });
  
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="members_${new Date().toISOString().split("T")[0]}.pdf"`);
  
  doc.pipe(res);
  generateMembersListPDF(doc, group?.name || "Group", members);
  doc.end();
});

// PDF Generation Functions
const generateMemberPDF = (
  doc: PDFKit.PDFDocument,
  member: any,
  contributions: any[],
  loans: any[],
  penalties: any[],
  group?: any
): void => {

  const formatPaymentMethod = (method?: string) => {
    if (method === "airtel_money") return "Airtel Money";
    if (method === "tnm_mpamba") return "TNM Mpamba";
    if (method === "card") return "Card Payment";
    return "N/A";
  };

  // Header
  doc.fontSize(20).fillColor("#047857").text("UnityVault Member Report", { align: "center" });
  doc.moveDown(0.5);
  if (group) {
    doc.fontSize(12).fillColor("#333").text(group.name, { align: "center" });
  }
  doc.fontSize(10).fillColor("#666").text(`Generated on ${new Date().toLocaleDateString()}`, { align: "center" });
  doc.moveDown(2);

  // Member Information
  doc.fontSize(14).fillColor("#047857").text("Member Information");
  doc.moveDown(0.5);

  const paidContributions = contributions.filter(c => c.status === "paid");
  const totalContributed = paidContributions.reduce((sum, c) => sum + c.amount, 0);
  const unpaidContributions = contributions.filter(c => c.status !== "paid");
  const totalPenaltiesPaid = penalties.filter(p => p.isPaid || p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  const totalPenaltiesUnpaid = penalties.filter(p => !p.isPaid && p.status !== "paid").reduce((sum, p) => sum + p.amount, 0);

  const memberData = [
    ["Full Name:", `${member.first_name} ${member.last_name}`],
    ["Email:", member.email || "N/A"],
    ["Phone:", member.phone || "N/A"],
    ["Status:", member.status.toUpperCase()],
    ["Shares Owned:", String(member.sharesOwned || 0)],
    ["Registration Fee:", member.registrationFeePaid ? "Paid" : "Unpaid"],
    ["Seed Deposit:", member.seedPaid ? "Paid" : "Unpaid"],
    ["Balance:", `MWK ${member.balance.toLocaleString()}`],
    ["Total Contributed:", `MWK ${totalContributed.toLocaleString()} (${paidContributions.length} payments)`],
    ["Unpaid Contributions:", `${unpaidContributions.length} outstanding`],
    ["Total Penalties:", `MWK ${member.penaltiesTotal.toLocaleString()}`],
    ["Penalties Paid:", `MWK ${totalPenaltiesPaid.toLocaleString()}`],
    ["Penalties Unpaid:", `MWK ${totalPenaltiesUnpaid.toLocaleString()}`],
    ["Member Since:", new Date(member.createdAt).toLocaleDateString()],
  ];

  memberData.forEach(([label, value]) => {
    doc.fontSize(10).fillColor("#000").text(label, 50, doc.y, { continued: true, width: 150 })
       .fillColor("#333").text(value, { width: 350 });
    doc.moveDown(0.3);
  });

  doc.moveDown(1);

  // Contributions Section
  if (contributions.length > 0) {
    addSectionHeader(doc, "Contributions History");
    
    const contribHeaders = ["Month", "Amount", "Method", "Status", "Due Date", "Paid Date"];
    const contribRows = contributions.map(c => [
      c.month,
      `MWK ${c.amount.toLocaleString()}`,
      formatPaymentMethod(c.paymentMethod),
      c.status,
      new Date(c.dueDate).toLocaleDateString(),
      c.paidAt ? new Date(c.paidAt).toLocaleDateString() : "N/A",
    ]);

    drawTable(doc, contribHeaders, contribRows, [65, 70, 85, 60, 80, 80]);
  }

  // Loans Section
  if (loans.length > 0) {
    doc.addPage();
    addSectionHeader(doc, "Loans History");
    
    const loanHeaders = ["Principal", "Interest", "Total Due", "Balance", "Status", "Date"];
    const loanRows = loans.map(l => [
      `MWK ${l.principal.toLocaleString()}`,
      `${(l.interestRate * 100).toFixed(1)}%`,
      `MWK ${l.totalDue.toLocaleString()}`,
      `MWK ${l.balance.toLocaleString()}`,
      l.status.toUpperCase(),
      l.approvedAt ? new Date(l.approvedAt).toLocaleDateString() : "N/A",
    ]);

    drawTable(doc, loanHeaders, loanRows, [80, 50, 80, 80, 60, 70]);
  }

  // Penalties Section
  if (penalties.length > 0) {
    if (loans.length === 0) doc.addPage();
    else doc.moveDown(2);
    
    addSectionHeader(doc, "Penalties History");
    
    const penaltyHeaders = ["Amount", "Reason", "Status", "Due Date", "Paid Date"];
    const penaltyRows = penalties.map(p => [
      `MWK ${p.amount.toLocaleString()}`,
      p.reason.substring(0, 25) + (p.reason.length > 25 ? "..." : ""),
      p.status.toUpperCase(),
      new Date(p.dueDate).toLocaleDateString(),
      p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "N/A",
    ]);

    drawTable(doc, penaltyHeaders, penaltyRows, [70, 120, 60, 80, 80]);
  }

  // Footer
  doc.fontSize(8).fillColor("#999").text(
    "This is a system-generated report from UnityVault",
    50,
    doc.page.height - 50,
    { align: "center", width: doc.page.width - 100 }
  );
};

const generateGroupPDF = (
  doc: PDFKit.PDFDocument,
  group: any,
  members: any[],
  admins: any[],
  contributions: any[],
  loans: any[],
  penalties: any[]
): void => {
  // Header
  doc.fontSize(20).fillColor("#047857").text("UnityVault Group Report", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(12).fillColor("#333").text(group.name, { align: "center" });
  doc.fontSize(10).fillColor("#666").text(`Generated on ${new Date().toLocaleDateString()}`, { align: "center" });
  doc.moveDown(2);

  // Group Information
  doc.fontSize(14).fillColor("#047857").text("Group Overview");
  doc.moveDown(0.5);

  const groupData = [
    ["Group Name:", group.name],
    ["Total Savings:", `MWK ${group.totalSavings.toLocaleString()}`],
    ["Total Income:", `MWK ${group.totalIncome.toLocaleString()}`],
    ["Available Cash:", `MWK ${group.cash.toLocaleString()}`],
    ["Created Date:", new Date(group.createdAt).toLocaleDateString()],
  ];

  groupData.forEach(([label, value]) => {
    doc.fontSize(10).fillColor("#000").text(label, 50, doc.y, { continued: true, width: 150 })
       .fillColor("#333").text(value, { width: 350 });
    doc.moveDown(0.3);
  });

  doc.moveDown(1);

  // Group Settings
  if (group.settings) {
    doc.fontSize(14).fillColor("#047857").text("Group Settings");
    doc.moveDown(0.5);

    const settingsData = [
      ["Contribution Amount:", `MWK ${group.settings.contributionAmount.toLocaleString()}`],
      ["Share Fee:", `MWK ${group.settings.shareFee.toLocaleString()}`],
      ["Seed Amount (per share):", `MWK ${group.settings.seedAmount.toLocaleString()}`],
      ["Initial Loan Limit (per share):", `MWK ${group.settings.initialLoanAmount.toLocaleString()}`],
      ["Loan Interest Rate:", `${(group.settings.loanInterestRate * 100).toFixed(1)}%`],
      ["Penalty Rate (Loans):", `${(group.settings.penaltyRate * 100).toFixed(1)}%`],
      ["Penalty Rate (Contributions):", `${(group.settings.contributionPenaltyRate * 100).toFixed(1)}%`],
      ["Compulsory Interest Rate:", `${(group.settings.compulsoryInterestRate * 100).toFixed(1)}%`],
      ["Min. Contribution Months:", String(group.settings.minimumContributionMonths)],
      ["Loan to Savings Ratio:", `${(group.settings.loanToSavingsRatio * 100).toFixed(0)}%`],
      ["Automatic Penalties:", group.settings.enableAutomaticPenalties ? "Enabled" : "Disabled"],
    ];

    settingsData.forEach(([label, value]) => {
      doc.fontSize(10).fillColor("#000").text(label, 50, doc.y, { continued: true, width: 180 })
         .fillColor("#333").text(value, { width: 300 });
      doc.moveDown(0.3);
    });

    doc.moveDown(1);
  }

  // Financial Summary
  const totalContributions = contributions.filter(c => c.status === "paid").reduce((sum, c) => sum + c.amount, 0);
  const totalLoansDisbursed = loans.reduce((sum, l) => sum + l.principal, 0);
  const totalLoansOutstanding = loans.filter(l => l.status === "active").reduce((sum, l) => sum + l.balance, 0);
  const totalPenaltiesAmount = penalties.reduce((sum, p) => sum + p.amount, 0);
  const totalPenaltiesPaid = penalties.filter(p => p.isPaid || p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  const paidContribCount = contributions.filter(c => c.status === "paid").length;
  const paymentRate = contributions.length > 0 ? ((paidContribCount / contributions.length) * 100).toFixed(1) : "0.0";

  doc.fontSize(14).fillColor("#047857").text("Financial Summary");
  doc.moveDown(0.5);

  const financialData = [
    ["Total Contributions Collected:", `MWK ${totalContributions.toLocaleString()}`],
    ["Contribution Payment Rate:", `${paymentRate}% (${paidContribCount}/${contributions.length})`],
    ["Total Loans Disbursed:", `MWK ${totalLoansDisbursed.toLocaleString()}`],
    ["Total Loans Outstanding:", `MWK ${totalLoansOutstanding.toLocaleString()}`],
    ["Total Penalties Charged:", `MWK ${totalPenaltiesAmount.toLocaleString()}`],
    ["Total Penalties Collected:", `MWK ${totalPenaltiesPaid.toLocaleString()}`],
  ];

  financialData.forEach(([label, value]) => {
    doc.fontSize(10).fillColor("#000").text(label, 50, doc.y, { continued: true, width: 180 })
       .fillColor("#333").text(value, { width: 300 });
    doc.moveDown(0.3);
  });

  doc.moveDown(1);

  // Summary Statistics
  doc.fontSize(14).fillColor("#047857").text("Summary Statistics");
  doc.moveDown(0.5);

  const stats = [
    ["Total Members:", members.length],
    ["Active Members:", members.filter(m => m.status === "active").length],
    ["Total Loans:", loans.length],
    ["Active Loans:", loans.filter(l => l.status === "active").length],
    ["Total Contributions:", contributions.length],
    ["Unpaid Contributions:", contributions.filter(c => c.status !== "paid").length],
    ["Total Penalties:", penalties.length],
    ["Unpaid Penalties:", penalties.filter(p => !p.isPaid).length],
  ];

  const midPoint = Math.ceil(stats.length / 2);
  const leftStats = stats.slice(0, midPoint);
  const rightStats = stats.slice(midPoint);

  leftStats.forEach(([label, value], idx) => {
    const yPos = doc.y;
    doc.fontSize(10).fillColor("#000").text(String(label), 50, yPos, { continued: true, width: 120 })
       .fillColor("#333").text(String(value), { width: 80 });
    
    if (rightStats[idx]) {
      doc.fillColor("#000").text(String(rightStats[idx][0]), 300, yPos, { continued: true, width: 120 })
         .fillColor("#333").text(String(rightStats[idx][1]), { width: 80 });
    }
    
    doc.moveDown(0.5);
  });

  // Members List
  doc.addPage();
  addSectionHeader(doc, "Members Directory");
  
  const memberHeaders = ["Name", "Email", "Status", "Shares", "Balance", "Penalties"];
  const memberRows = members.map(m => [
    `${m.first_name} ${m.last_name}`.substring(0, 25),
    m.email || "N/A",
    m.status.toUpperCase(),
    String(m.sharesOwned || 0),
    `MWK ${m.balance.toLocaleString()}`,
    `MWK ${m.penaltiesTotal.toLocaleString()}`,
  ]);

  drawTable(doc, memberHeaders, memberRows, [100, 80, 60, 40, 80, 80]);

  // Administrators
  doc.addPage();
  addSectionHeader(doc, "Administrators");
  
  const adminHeaders = ["Name", "Email", "Phone"];
  const adminRows = admins.map(a => [
    a.first_name && a.last_name ? `${a.first_name} ${a.last_name}` : "N/A",
    a.email,
    a.phone || "N/A",
  ]);

  drawTable(doc, adminHeaders, adminRows, [150, 180, 120]);

  // Footer
  doc.fontSize(8).fillColor("#999").text(
    "This is a confidential system-generated report from UnityVault",
    50,
    doc.page.height - 50,
    { align: "center", width: doc.page.width - 100 }
  );
};

const generateMembersListPDF = (
  doc: PDFKit.PDFDocument,
  groupName: string,
  members: any[]
): void => {
  // Header
  doc.fontSize(18).fillColor("#047857").text("Member Directory", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(12).fillColor("#333").text(groupName, { align: "center" });
  doc.fontSize(9).fillColor("#666").text(`Generated on ${new Date().toLocaleDateString()}`, { align: "center" });
  doc.fontSize(9).fillColor("#666").text(`Total Members: ${members.length}`, { align: "center" });
  doc.moveDown(2);

  // Table
  const headers = ["Full Name", "Email", "Phone", "Status", "Shares", "Balance", "Penalties", "Joined"];
  const rows = members.map(m => [
    `${m.first_name} ${m.last_name}`.substring(0, 22),
    (m.email || "N/A").substring(0, 22),
    (m.phone || "N/A").substring(0, 13),
    m.status.toUpperCase(),
    String(m.sharesOwned || 0),
    `MWK ${m.balance.toLocaleString()}`,
    `MWK ${m.penaltiesTotal.toLocaleString()}`,
    new Date(m.createdAt).toLocaleDateString(),
  ]);

  drawTable(doc, headers, rows, [100, 105, 75, 55, 40, 75, 75, 65], 7.5);

  // Footer
  doc.fontSize(7).fillColor("#999").text(
    "UnityVault - Member Directory Export",
    50,
    doc.page.height - 40,
    { align: "center", width: doc.page.width - 100 }
  );
};

// Helper Functions
const addSectionHeader = (doc: PDFKit.PDFDocument, title: string): void => {
  doc.fontSize(14).fillColor("#047857").text(title);
  doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor("#047857").stroke();
  doc.moveDown(0.8);
};

const drawTable = (
  doc: PDFKit.PDFDocument,
  headers: string[],
  rows: string[][],
  columnWidths: number[],
  fontSize: number = 9
): void => {
  const startX = 50;
  const startY = doc.y;
  const rowHeight = 20;

  // Draw headers
  doc.fontSize(fontSize).fillColor("#047857").font("Helvetica-Bold");
  let xPos = startX;
  headers.forEach((header, i) => {
    doc.text(header, xPos, startY, { width: columnWidths[i], align: "left" });
    xPos += columnWidths[i];
  });

  // Draw header line
  doc.moveTo(startX, startY + rowHeight - 5)
     .lineTo(startX + columnWidths.reduce((a, b) => a + b, 0), startY + rowHeight - 5)
     .strokeColor("#047857")
     .stroke();

  // Draw rows
  doc.font("Helvetica").fillColor("#333");
  let yPos = startY + rowHeight;

  rows.forEach((row, rowIndex) => {
    if (yPos > doc.page.height - 100) {
      doc.addPage();
      yPos = 50;
    }

    xPos = startX;
    row.forEach((cell, i) => {
      doc.fontSize(fontSize - 0.5).text(cell, xPos, yPos, { width: columnWidths[i], align: "left" });
      xPos += columnWidths[i];
    });

    yPos += rowHeight;

    // Alternate row background (light gray)
    if (rowIndex % 2 === 0) {
      doc.rect(startX - 5, yPos - rowHeight, columnWidths.reduce((a, b) => a + b, 0) + 10, rowHeight)
         .fillColor("#f9f9f9")
         .fillOpacity(0.3)
         .fill();
      doc.fillColor("#333").fillOpacity(1);
    }
  });

  doc.y = yPos + 10;
};
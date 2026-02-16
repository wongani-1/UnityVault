import jsPDF from "jspdf";

interface ReportData {
  type: string;
  generatedAt: string;
  summary?: Record<string, number | string>;
  items?: Array<Record<string, any>>;
  [key: string]: any;
}

export const generateReportPDF = async (
  reportTitle: string,
  reportData: ReportData,
  groupName: string
): Promise<Blob> => {
  const doc = new jsPDF();

  // Page dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Load and add logo
  try {
    const logoUrl = "/Unity Vault.png";
    const img = await loadImage(logoUrl);
    const logoSize = 20;
    doc.addImage(img, "PNG", pageWidth - margin - logoSize, margin, logoSize, logoSize);
  } catch (error) {
    console.warn("Logo not loaded:", error);
  }

  // Add header
  doc.setFontSize(22);
  doc.setTextColor(37, 99, 235); // Primary blue color
  doc.text("UnityVault", margin, yPosition + 5);

  yPosition += 15;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(groupName, margin, yPosition);

  yPosition += 15;

  // Add title
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text(reportTitle, margin, yPosition);

  yPosition += 10;

  // Add date
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const dateStr = new Date(reportData.generatedAt).toLocaleString();
  doc.text(`Generated: ${dateStr}`, margin, yPosition);

  yPosition += 15;

  // Add horizontal line
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);

  yPosition += 10;

  // Add report content
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);

  // Summary section
  if (reportData.summary) {
    doc.setFontSize(14);
    doc.text("Summary", margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    Object.entries(reportData.summary).forEach(([key, value]) => {
      const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
      
      // Format value based on type
      let valueStr: string;
      if (typeof value === "number") {
        // Check if it's a currency field
        const currencyFields = [
          "totalsavings", "totalincome", "availablecash", "totalcollected",
          "expectedamount", "totaldisbursed", "totaloutstanding", 
          "totalexpectedinterest", "totalunpaidpenalties", "totalloansdisbursed",
          "totalloansoutstanding", "yearlycontributions", "yearlyloans",
          "yearlypenalties", "netgrowth"
        ];
        
        if (currencyFields.includes(key.toLowerCase().replace(/\s+/g, ""))) {
          valueStr = `MWK ${value.toLocaleString()}`;
        } else {
          valueStr = value.toLocaleString();
        }
      } else {
        valueStr = String(value);
      }
      
      if (yPosition > pageHeight - margin - 10) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setTextColor(80, 80, 80);
      doc.text(`${label}:`, margin, yPosition);
      doc.setTextColor(0, 0, 0);
      doc.text(valueStr, margin + 80, yPosition);
      yPosition += 7;
    });

    yPosition += 10;
  }

  // Items section (for detailed reports)
  if (reportData.items && reportData.items.length > 0) {
    if (yPosition > pageHeight - margin - 30) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(14);
    doc.text("Details", margin, yPosition);
    yPosition += 10;

    // Check if this is a contribution or loan report (use table format)
    const firstItem = reportData.items[0];
    if (firstItem.memberName !== undefined) {
      // Table format for member-based reports
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);

      // Table headers
      const isContributionReport = firstItem.status !== undefined && firstItem.principal === undefined;
      const isLoanReport = firstItem.principal !== undefined;

      if (isContributionReport) {
        // Contribution report table headers
        doc.setFillColor(220, 220, 220);
        doc.rect(margin, yPosition, pageWidth - margin * 2, 8, "F");
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("#", margin + 2, yPosition + 5.5);
        doc.text("Member Name", margin + 10, yPosition + 5.5);
        doc.text("Amount", margin + 90, yPosition + 5.5);
        doc.text("Status", margin + 125, yPosition + 5.5);
        doc.text("Paid Date", margin + 155, yPosition + 5.5);
        yPosition += 10;
        doc.setFont("helvetica", "normal");

        // Table rows
        reportData.items.forEach((item: any, index: number) => {
          if (yPosition > pageHeight - margin - 10) {
            doc.addPage();
            yPosition = margin + 10;
            
            // Re-render header on new page
            doc.setFillColor(220, 220, 220);
            doc.rect(margin, yPosition, pageWidth - margin * 2, 8, "F");
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "bold");
            doc.text("#", margin + 2, yPosition + 5.5);
            doc.text("Member Name", margin + 10, yPosition + 5.5);
            doc.text("Amount", margin + 90, yPosition + 5.5);
            doc.text("Status", margin + 125, yPosition + 5.5);
            doc.text("Paid Date", margin + 155, yPosition + 5.5);
            yPosition += 10;
            doc.setFont("helvetica", "normal");
          }

          if (index % 2 === 0) {
            doc.setFillColor(248, 248, 248);
            doc.rect(margin, yPosition - 1, pageWidth - margin * 2, 7, "F");
          }

          doc.setTextColor(0, 0, 0);
          doc.text(String(index + 1), margin + 2, yPosition + 4);
          doc.text(item.memberName, margin + 10, yPosition + 4);
          doc.text(`MWK ${item.amount.toLocaleString()}`, margin + 90, yPosition + 4);
          
          // Color-code status
          if (item.status === "paid") {
            doc.setTextColor(0, 150, 0);
            doc.text("Paid", margin + 125, yPosition + 4);
          } else {
            doc.setTextColor(200, 0, 0);
            doc.text("Unpaid", margin + 125, yPosition + 4);
          }
          
          doc.setTextColor(80, 80, 80);
          const paidDate = item.paidAt ? new Date(item.paidAt).toLocaleDateString() : "-";
          doc.text(paidDate, margin + 155, yPosition + 4);
          
          yPosition += 7;
        });
      } else if (isLoanReport) {
        // Loan report table headers
        doc.setFillColor(220, 220, 220);
        doc.rect(margin, yPosition, pageWidth - margin * 2, 8, "F");
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text("#", margin + 2, yPosition + 5.5);
        doc.text("Member Name", margin + 10, yPosition + 5.5);
        doc.text("Principal", margin + 70, yPosition + 5.5);
        doc.text("Balance", margin + 110, yPosition + 5.5);
        doc.text("Installments", margin + 145, yPosition + 5.5);
        yPosition += 10;
        doc.setFont("helvetica", "normal");

        // Table rows
        reportData.items.forEach((item: any, index: number) => {
          if (yPosition > pageHeight - margin - 10) {
            doc.addPage();
            yPosition = margin + 10;
            
            // Re-render header on new page
            doc.setFillColor(220, 220, 220);
            doc.rect(margin, yPosition, pageWidth - margin * 2, 8, "F");
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "bold");
            doc.text("#", margin + 2, yPosition + 5.5);
            doc.text("Member Name", margin + 10, yPosition + 5.5);
            doc.text("Principal", margin + 70, yPosition + 5.5);
            doc.text("Balance", margin + 110, yPosition + 5.5);
            doc.text("Installments", margin + 145, yPosition + 5.5);
            yPosition += 10;
            doc.setFont("helvetica", "normal");
          }

          if (index % 2 === 0) {
            doc.setFillColor(248, 248, 248);
            doc.rect(margin, yPosition - 1, pageWidth - margin * 2, 7, "F");
          }

          doc.setTextColor(0, 0, 0);
          doc.text(String(index + 1), margin + 2, yPosition + 4);
          doc.text(item.memberName, margin + 10, yPosition + 4);
          doc.text(`MWK ${item.principal.toLocaleString()}`, margin + 70, yPosition + 4);
          doc.text(`MWK ${item.balance.toLocaleString()}`, margin + 110, yPosition + 4);
          doc.setTextColor(80, 80, 80);
          doc.text(item.installmentsPaid, margin + 145, yPosition + 4);
          
          yPosition += 7;
        });
      }
    } else {
      // Generic list format for other reports
      doc.setFontSize(9);
      reportData.items.slice(0, 50).forEach((item: any, index: number) => {
        if (yPosition > pageHeight - margin - 15) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setTextColor(100, 100, 100);
        doc.text(`${index + 1}.`, margin, yPosition);
        doc.setTextColor(0, 0, 0);

        const itemText = Object.entries(item)
          .slice(0, 3)
          .map(([k, v]) => `${k}: ${v}`)
          .join(" | ");

        doc.text(itemText, margin + 10, yPosition, { maxWidth: pageWidth - margin * 2 - 10 });
        yPosition += 7;
      });

      if (reportData.items.length > 50) {
        yPosition += 5;
        doc.setTextColor(100, 100, 100);
        doc.text(`... and ${reportData.items.length - 50} more items`, margin, yPosition);
      }
    }
  }

  // Add footer
  const footerY = pageHeight - 10;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `UnityVault Report - ${groupName} - Page 1`,
    pageWidth / 2,
    footerY,
    { align: "center" }
  );

  return doc.output("blob");
};

// Helper function to load images
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

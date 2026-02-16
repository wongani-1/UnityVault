import { useMemo, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Download, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { apiRequest } from "../lib/api";
import { generateReportPDF } from "../lib/pdfGenerator";

const reports = [
  { title: "Monthly Report", desc: "Current month financial summary" },
  { title: "Yearly Report", desc: "Annual audit report" },
  { title: "Contribution Report", desc: "Member-by-member breakdown" },
  { title: "Loan Portfolio", desc: "Active loans and repayment status" },
];

const AdminReports = () => {
  const [exportingReport, setExportingReport] = useState<string | null>(null);

  const storedGroup = useMemo(() => {
    try {
      const raw = localStorage.getItem("unityvault:adminGroup");
      return raw
        ? (JSON.parse(raw) as { groupId?: string; groupName?: string; adminName?: string })
        : {};
    } catch {
      return {};
    }
  }, []);

  const groupName = storedGroup.groupName || "UnityVault Group";

  const handleExport = async (title: string) => {
    const slug = title.toLowerCase().replace(/\s+/g, "-");
    setExportingReport(slug);
    
    try {
      const payload = await apiRequest<{ type: string; generatedAt: string; summary: Record<string, number> }>(
        `/reports/${slug}`
      );
      
      // Generate PDF
      const pdfBlob = await generateReportPDF(title, payload, groupName);
      
      // Download PDF
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${groupName.replace(/\s+/g, "_")}_${slug}_${new Date().toISOString().slice(0, 10)}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Report exported as PDF");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Export failed";
      toast.error(message);
    } finally {
      setExportingReport(null);
    }
  };

  return (
    <DashboardLayout title="Reports" subtitle="Export group financial statements" isAdmin>
      <div className="grid gap-6 md:grid-cols-2">
        {reports.map((report) => (
          <Card key={report.title} className="border-0 shadow-card">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary">
                <FileText className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{report.title}</h3>
                <p className="text-sm text-muted-foreground">{report.desc}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleExport(report.title)} disabled={exportingReport !== null}>
                {exportingReport === report.title.toLowerCase().replace(/\s+/g, "-") ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export PDF
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default AdminReports;

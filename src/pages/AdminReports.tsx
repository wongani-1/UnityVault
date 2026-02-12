import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Download } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { apiRequest } from "../lib/api";

const reports = [
  { title: "Monthly Report", desc: "February 2026 financial summary" },
  { title: "Yearly Report", desc: "2025 annual audit report" },
  { title: "Contribution Report", desc: "Member-by-member breakdown" },
  { title: "Loan Portfolio", desc: "Active loans and repayment status" },
];

const AdminReports = () => {
  const handleExport = async (title: string) => {
    const slug = title.toLowerCase().replace(/\s+/g, "-");
    try {
      const payload = await apiRequest<{ type: string; generatedAt: string; summary: Record<string, number> }>(
        `/reports/${slug}`
      );
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${slug}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Report exported");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Export failed";
      toast.error(message);
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
              <Button variant="outline" size="sm" onClick={() => handleExport(report.title)}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default AdminReports;

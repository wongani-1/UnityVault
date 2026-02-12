import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";
import { apiRequest } from "../lib/api";
import { toast } from "@/components/ui/sonner";

const fallbackLogs = [
  {
    actor: "Sarah Banda",
    action: "member_approved",
    entity: "Member: Grace Atim",
    time: "2026-02-06 09:42",
  },
  {
    actor: "Sarah Banda",
    action: "loan_approved",
    entity: "Loan: Robert Ochieng",
    time: "2026-02-05 14:18",
  },
  {
    actor: "System",
    action: "penalty_applied",
    entity: "Loan: David Mukiibi",
    time: "2026-02-04 07:05",
  },
];

const AdminAudit = () => {
  const [logs, setLogs] = useState(fallbackLogs);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await apiRequest<{ items: Array<{
          id: string;
          actorId: string;
          actorRole: string;
          action: string;
          entityType: string;
          entityId: string;
          createdAt: string;
        }> }>("/audit");

        if (!active) return;
        const mapped = data.items.map((item) => ({
          actor: `${item.actorRole} ${item.actorId}`,
          action: item.action,
          entity: `${item.entityType}: ${item.entityId}`,
          time: item.createdAt.slice(0, 16).replace("T", " "),
        }));
        setLogs(mapped.length ? mapped : fallbackLogs);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load audit logs";
        toast.error(message);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <DashboardLayout title="Audit Logs" subtitle="Track sensitive actions" isAdmin>
      <Card className="border-0 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Audit Trail
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && (
            <p className="text-sm text-muted-foreground">Loading audit logs...</p>
          )}
          {logs.map((log) => (
            <div
              key={`${log.action}-${log.time}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">{log.entity}</p>
                <p className="text-xs text-muted-foreground">{log.actor}</p>
              </div>
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0">
                {log.action}
              </Badge>
              <span className="text-xs text-muted-foreground">{log.time}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AdminAudit;

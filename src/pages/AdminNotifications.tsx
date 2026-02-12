import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { apiRequest } from "../lib/api";
import { toast } from "@/components/ui/sonner";

const fallbackNotifications = [
  {
    title: "Member registration pending",
    body: "Grace Atim requested to join the group.",
    status: "pending",
    time: "2026-02-06 09:10",
  },
  {
    title: "Loan approved",
    body: "Loan for Robert Ochieng approved and ready to disburse.",
    status: "sent",
    time: "2026-02-05 16:22",
  },
  {
    title: "Penalty applied",
    body: "Late repayment penalty applied to David Mukiibi.",
    status: "sent",
    time: "2026-02-04 07:05",
  },
];

const statusClass = (status: string) =>
  status === "pending"
    ? "bg-warning/10 text-warning hover:bg-warning/20 border-0"
    : "bg-success/10 text-success hover:bg-success/20 border-0";

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState(fallbackNotifications);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await apiRequest<{ items: Array<{
          id: string;
          type: string;
          message: string;
          status: string;
          createdAt: string;
        }> }>("/notifications");

        if (!active) return;
        const mapped = data.items.map((item) => ({
          title: item.type.replace(/_/g, " "),
          body: item.message,
          status: item.status,
          time: item.createdAt.slice(0, 16).replace("T", " "),
        }));
        setNotifications(mapped.length ? mapped : fallbackNotifications);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load notifications";
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
    <DashboardLayout title="Notifications" subtitle="Admin alerts and activity" isAdmin>
      <Card className="border-0 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-4 w-4 text-primary" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && (
            <p className="text-sm text-muted-foreground">Loading notifications...</p>
          )}
          {notifications.map((note) => (
            <div
              key={`${note.title}-${note.time}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">{note.title}</p>
                <p className="text-xs text-muted-foreground">{note.body}</p>
              </div>
              <Badge className={statusClass(note.status)}>{note.status}</Badge>
              <span className="text-xs text-muted-foreground">{note.time}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AdminNotifications;

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { apiRequest } from "../lib/api";
import { toast } from "@/components/ui/sonner";

const fallbackNotifications = [
  { message: "Monthly contribution due on Feb 28", type: "info", time: "2 days ago" },
  { message: "Loan repayment due Mar 15", type: "warning", time: "5 days ago" },
];

const statusClass = (status: string) =>
  status === "pending"
    ? "bg-warning/10 text-warning hover:bg-warning/20 border-0"
    : "bg-success/10 text-success hover:bg-success/20 border-0";

const MemberNotifications = () => {
  const [items, setItems] = useState(fallbackNotifications);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await apiRequest<{ items: Array<{
          id: string;
          message: string;
          status: string;
          createdAt: string;
        }> }>("/notifications");

        if (!active) return;
        const mapped = data.items.map((note) => ({
          message: note.message,
          type: note.status,
          time: note.createdAt.slice(0, 16).replace("T", " "),
        }));
        setItems(mapped.length ? mapped : fallbackNotifications);
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
    <DashboardLayout title="Notifications" subtitle="Your alerts and updates">
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
          {items.map((note, index) => (
            <div
              key={`${note.message}-${index}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">{note.message}</p>
              </div>
              <Badge className={statusClass(note.type)}>{note.type}</Badge>
              <span className="text-xs text-muted-foreground">{note.time}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default MemberNotifications;

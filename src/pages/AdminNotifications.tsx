import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";
import { apiRequest } from "../lib/api";
import { toast } from "@/components/ui/sonner";

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState<Array<{ title: string; body: string; status: string; time: string }>>([]);
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
        const sorted = [...(data.items || [])].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        const mapped = sorted.map((item) => ({
          title: item.type.replace(/_/g, " "),
          body: item.message,
          status: item.status,
          time: item.createdAt.slice(0, 16).replace("T", " "),
        }));
        setNotifications(mapped);

        // Mark all notifications as read
        await apiRequest("/notifications/mark-read", { method: "POST" });
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
          {!loading && notifications.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">No notifications yet</p>
          )}
          {notifications.map((note) => (
            <div
              key={`${note.title}-${note.time}`}
              className="flex items-start justify-between gap-3 rounded-lg border bg-card p-4"
            >
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{note.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{note.body}</p>
                <span className="text-xs text-muted-foreground mt-2 block">{note.time}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AdminNotifications;

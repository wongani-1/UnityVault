import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle } from "lucide-react";
import { apiRequest } from "../lib/api";
import { toast } from "@/components/ui/sonner";

const fallbackPenalties = [
  {
    member: "Robert Ochieng",
    type: "Contribution",
    amount: "MWK 50,000",
    dueDate: "2026-01-01",
    penalty: "MWK 5,000",
    memberId: "member-1",
  },
  {
    member: "David Mukiibi",
    type: "Loan Repayment",
    amount: "MWK 40,000",
    dueDate: "2026-01-15",
    penalty: "MWK 2,000",
    memberId: "member-2",
  },
];

const AdminPenalties = () => {
  const [penalties, setPenalties] = useState(fallbackPenalties);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await apiRequest<{ items: Array<{
          id: string;
          memberId: string;
          amount: number;
          reason: string;
          createdAt: string;
        }> }>("/penalties");

        if (!active) return;
        const mapped = data.items.map((item) => ({
          member: item.memberId,
          memberId: item.memberId,
          type: item.reason,
          amount: "—",
          dueDate: item.createdAt.slice(0, 10),
          penalty: `MWK ${item.amount}`,
        }));
        setPenalties(mapped.length ? mapped : fallbackPenalties);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load penalties";
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

  const handleNotify = async (memberId: string, type: string) => {
    try {
      await apiRequest("/notifications", {
        method: "POST",
        body: {
          memberId,
          type: "penalty_notice",
          message: `Penalty notice: ${type}`,
        },
      });
      toast.success("Notification sent");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send notification";
      toast.error(message);
    }
  };

  return (
    <DashboardLayout title="Penalties" subtitle="Track missed payments" isAdmin>
      <Card className="border-0 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Missed Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <p className="mb-4 text-sm text-muted-foreground">Loading penalties...</p>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount Due</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Penalty</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {penalties.map((item) => (
                <TableRow key={`${item.member}-${item.dueDate}`}>
                  <TableCell className="font-medium">{item.member}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>{item.amount}</TableCell>
                  <TableCell className="text-muted-foreground">{item.dueDate}</TableCell>
                  <TableCell className="font-medium text-destructive">{item.penalty}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                      onClick={() => handleNotify(item.memberId, item.type)}
                    >
                      Notify
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AdminPenalties;

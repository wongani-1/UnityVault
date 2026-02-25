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
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { apiRequest } from "../lib/api";
import { toast } from "@/components/ui/sonner";

type Penalty = {
  id: string;
  memberId: string;
  loanId?: string;
  installmentId?: string;
  contributionId?: string;
  amount: number;
  reason: string;
  status: "unpaid" | "paid";
  dueDate: string;
  createdAt: string;
  paidAt?: string;
};

type Member = {
  id: string;
  first_name: string;
  last_name: string;
};

type Contribution = {
  id: string;
  amount: number;
};

type DisplayPenalty = {
  id: string;
  member: string;
  type: string;
  amount: string;
  dueDate: string;
  penalty: string;
  status: string;
  memberId: string;
};

const AdminPenalties = () => {
  const [penalties, setPenalties] = useState<DisplayPenalty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        // Load members for name lookup
        const memberData = await apiRequest<{ items: Member[] }>("/members");
        const memberMap = new Map(memberData.items.map((m) => [m.id, `${m.first_name} ${m.last_name}`]));

        // Load contributions for amount lookup
        const contributionData = await apiRequest<{ items: Contribution[] }>("/contributions");
        const contributionMap = new Map(contributionData.items.map((c) => [c.id, c.amount]));

        // Load penalties
        const data = await apiRequest<{ items: Penalty[] }>("/penalties");

        if (!active) return;
        const mapped = data.items.map((item) => {
          let relatedAmount = "—";
          if (item.contributionId && contributionMap.has(item.contributionId)) {
            relatedAmount = `MWK ${(contributionMap.get(item.contributionId) || 0).toLocaleString()}`;
          }

          return {
            id: item.id,
            member: memberMap.get(item.memberId) || "Unknown",
            memberId: item.memberId,
            type: item.reason || "Penalty",
            amount: relatedAmount,
            dueDate: item.dueDate ? item.dueDate.slice(0, 10) : item.createdAt.slice(0, 10),
            penalty: `MWK ${item.amount.toLocaleString()}`,
            status: item.status,
          };
        });
        setPenalties(mapped);
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
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="hidden sm:table-cell">Amount Due</TableHead>
                <TableHead className="hidden sm:table-cell">Due Date</TableHead>
                <TableHead>Penalty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {penalties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No penalties recorded yet
                  </TableCell>
                </TableRow>
              ) : (
                penalties.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.member}</TableCell>
                    <TableCell className="hidden sm:table-cell">{item.type}</TableCell>
                    <TableCell className="hidden sm:table-cell">{item.amount}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">{item.dueDate}</TableCell>
                    <TableCell className="font-medium text-destructive">{item.penalty}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          item.status === "paid"
                            ? "bg-success/10 text-success hover:bg-success/20 border-0"
                            : "bg-destructive/10 text-destructive hover:bg-destructive/20 border-0"
                        }
                      >
                        {item.status === "paid" ? "Paid" : "Unpaid"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.status === "unpaid" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground"
                          onClick={() => handleNotify(item.memberId, item.type)}
                        >
                          Notify
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AdminPenalties;

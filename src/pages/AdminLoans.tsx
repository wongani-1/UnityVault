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
import { apiRequest } from "@/lib/api";
import { toast } from "@/components/ui/sonner";

type Loan = {
  id: string;
  memberId: string;
  principal: number;
  interestRate: number;
  totalInterest: number;
  totalDue: number;
  balance: number;
  status: "pending" | "approved" | "active" | "rejected" | "completed";
  reason?: string;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  completedAt?: string;
};

type Member = {
  id: string;
  first_name: string;
  last_name: string;
};

type DisplayLoan = {
  id: string;
  member: string;
  amount: string;
  purpose: string;
  balance: string;
  totalDue: string;
  date: string;
  status: string;
};

const AdminLoans = () => {
  const [loans, setLoans] = useState<DisplayLoan[]>([]);
  const [members, setMembers] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadLoans = async () => {
    setLoading(true);
    try {
      // Load members for name lookup
      const memberData = await apiRequest<{ items: Member[] }>("/members");
      const memberMap = new Map(memberData.items.map((m) => [m.id, `${m.first_name} ${m.last_name}`]));
      setMembers(memberMap);

      // Load loans
      const loanData = await apiRequest<{ items: Loan[] }>("/loans");
      const mapped = loanData.items.map((loan) => ({
        id: loan.id,
        member: memberMap.get(loan.memberId) || "Unknown",
        amount: `MWK ${(loan.principal || 0).toLocaleString()}`,
        purpose: loan.reason || "—",
        balance: `MWK ${(loan.balance || 0).toLocaleString()}`,
        totalDue: `MWK ${(loan.totalDue || 0).toLocaleString()}`,
        date: loan.createdAt ? loan.createdAt.slice(0, 10) : "N/A",
        status:
          loan.status === "pending"
            ? "Pending"
            : loan.status === "approved"
            ? "Approved"
            : loan.status === "active"
            ? "Active"
            : loan.status === "rejected"
            ? "Rejected"
            : loan.status === "completed"
            ? "Completed"
            : "Unknown",
      }));
      setLoans(mapped);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load loans";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoans();
  }, []);

  const handleApprove = async (loanId: string) => {
    setActionLoading(loanId);
    try {
      await apiRequest(`/loans/${loanId}/approve`, {
        method: "POST",
        body: { installments: 6 },
      });
      toast.success("Loan approved");
      await loadLoans(); // Refresh the loan list
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to approve loan";
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (loanId: string) => {
    setActionLoading(loanId);
    try {
      await apiRequest(`/loans/${loanId}/reject`, {
        method: "POST",
        body: {},
      });
      toast.success("Loan rejected");
      await loadLoans(); // Refresh the loan list
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reject loan";
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <DashboardLayout title="Loans" subtitle="Review and track group loans" isAdmin>
      <Card className="border-0 shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Loan Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-sm text-muted-foreground">Loading loans...</p>}
          {!loading && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Total Due</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No loan applications yet
                    </TableCell>
                  </TableRow>
                ) : (
                  loans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell className="font-medium">{loan.member}</TableCell>
                    <TableCell>{loan.amount}</TableCell>
                    <TableCell>{loan.balance}</TableCell>
                    <TableCell>{loan.totalDue}</TableCell>
                    <TableCell className="text-muted-foreground">{loan.purpose}</TableCell>
                    <TableCell className="text-muted-foreground">{loan.date}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          loan.status === "Approved" || loan.status === "Active"
                            ? "bg-success/10 text-success hover:bg-success/20 border-0"
                            : loan.status === "Pending"
                            ? "bg-warning/10 text-warning hover:bg-warning/20 border-0"
                            : loan.status === "Rejected"
                            ? "bg-destructive/10 text-destructive hover:bg-destructive/20 border-0"
                            : loan.status === "Completed"
                            ? "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 border-0"
                            : "bg-info/10 text-info hover:bg-info/20 border-0"
                        }
                      >
                        {loan.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {loan.status === "Pending" ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApprove(loan.id)}
                            disabled={actionLoading === loan.id}
                          >
                            {actionLoading === loan.id ? "..." : "Approve"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => handleReject(loan.id)}
                            disabled={actionLoading === loan.id}
                          >
                            {actionLoading === loan.id ? "..." : "Reject"}
                          </Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" className="text-muted-foreground">
                          Details
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AdminLoans;

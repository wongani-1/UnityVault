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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "../lib/api";
import { toast } from "@/components/ui/sonner";

const fallbackLoans = [
  { id: "loan-1", amount: "MWK 200,000", status: "Pending", date: "2026-02-03" },
  { id: "loan-2", amount: "MWK 150,000", status: "Approved", date: "2026-01-20" },
];

const MemberLoans = () => {
  const [loans, setLoans] = useState(fallbackLoans);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");

  const loadLoans = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<{ items: Array<{
        id: string;
        principal: number;
        status: "pending" | "approved" | "rejected" | "closed";
        createdAt: string;
      }> }>("/loans");

      const mapped = data.items.map((loan) => ({
        id: loan.id,
        amount: `MWK ${loan.principal}`,
        status:
          loan.status === "approved"
            ? "Approved"
            : loan.status === "rejected"
            ? "Rejected"
            : loan.status === "closed"
            ? "Cleared"
            : "Pending",
        date: loan.createdAt.slice(0, 10),
      }));
      setLoans(mapped.length ? mapped : fallbackLoans);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load loans";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoans();

    // Auto-refresh every 10 seconds to catch admin approvals
    const interval = setInterval(loadLoans, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRequestLoan = async () => {
    if (!amount.trim()) {
      toast.error("Enter a loan amount");
      return;
    }

    try {
      await apiRequest<{ id: string; principal: number; status: string; createdAt: string }>(
        "/loans/request",
        {
          method: "POST",
          body: { amount: Number(amount), installments: 6 },
        }
      );
      setAmount("");
      toast.success("Loan request submitted");
      await loadLoans(); // Refresh the loan list
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to request loan";
      toast.error(message);
    }
  };

  return (
    <DashboardLayout title="Loans" subtitle="Track your loan requests">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">My Loans</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="hero">Request Loan</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request a Loan</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="loan-amount">Amount (MWK)</Label>
              <Input
                id="loan-amount"
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button onClick={handleRequestLoan}>Submit Request</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Loan Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <p className="mb-4 text-sm text-muted-foreground">Loading loans...</p>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loan ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell className="font-medium">{loan.id}</TableCell>
                  <TableCell>{loan.amount}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        loan.status === "Approved"
                          ? "bg-success/10 text-success hover:bg-success/20 border-0"
                          : loan.status === "Pending"
                          ? "bg-warning/10 text-warning hover:bg-warning/20 border-0"
                          : "bg-info/10 text-info hover:bg-info/20 border-0"
                      }
                    >
                      {loan.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{loan.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default MemberLoans;

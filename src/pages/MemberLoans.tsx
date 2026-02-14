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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { apiRequest } from "../lib/api";
import { toast } from "@/components/ui/sonner";

interface EligibilityCheck {
  isEligible: boolean;
  reasons: string[];
  maxLoanAmount: number;
  contributionMonths: number;
  requiredMonths: number;
}

const MemberLoans = () => {
  const [loans, setLoans] = useState<Array<{id: string; amount: string; status: string; date: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [eligibility, setEligibility] = useState<EligibilityCheck | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadLoans = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<{ items: Array<{
        id: string;
        principal: number;
        status: "pending" | "active" | "rejected" | "completed";
        createdAt: string;
      }> }>("/loans");

      const mapped = data.items.map((loan) => ({
        id: loan.id,
        amount: `MWK ${loan.principal.toLocaleString()}`,
        status:
          loan.status === "active"
            ? "Active"
            : loan.status === "rejected"
            ? "Rejected"
            : loan.status === "completed"
            ? "Completed"
            : "Pending",
        date: loan.createdAt.slice(0, 10),
      }));
      setLoans(mapped);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load loans";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async (checkAmount?: string) => {
    setCheckingEligibility(true);
    try {
      const data = await apiRequest<EligibilityCheck>(
        `/loans/eligibility${checkAmount ? `?amount=${checkAmount}` : ""}`
      );
      setEligibility(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to check eligibility";
      console.error("Eligibility check error:", message);
      // On error, set eligibility to null so button isn't permanently disabled
      setEligibility(null);
    } finally {
      setCheckingEligibility(false);
    }
  };

  useEffect(() => {
    loadLoans();
    checkEligibility(); // Check initial eligibility

    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      loadLoans();
      checkEligibility();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Re-check eligibility when amount changes
  useEffect(() => {
    if (amount && !isNaN(Number(amount)) && Number(amount) > 0) {
      checkEligibility(amount);
    }
  }, [amount]);

  const handleRequestLoan = async () => {
    if (!amount.trim()) {
      toast.error("Enter a loan amount");
      return;
    }

    // Only block if we successfully checked and member is ineligible
    if (eligibility && !eligibility.isEligible) {
      toast.error("You are not eligible for a loan at this time");
      return;
    }

    try {
      await apiRequest<{ id: string; principal: number; status: string; createdAt: string }>(
        "/loans/request",
        {
          method: "POST",
          body: { amount: Number(amount), installments: 6, reason: reason.trim() || undefined },
        }
      );
      setAmount("");
      setReason("");
      setDialogOpen(false);
      toast.success("Loan request submitted successfully");
      await loadLoans();
      await checkEligibility();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to request loan";
      toast.error(message);
    }
  };

  return (
    <DashboardLayout title="Loans" subtitle="Track your loan requests">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">My Loans</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="hero"
              disabled={checkingEligibility}
            >
              Request Loan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Request a Loan</DialogTitle>
            </DialogHeader>

            {/* Eligibility Status */}
            {eligibility && (
              <Alert className={eligibility.isEligible ? "border-success/50 bg-success/5" : "border-destructive/50 bg-destructive/5"}>
                {eligibility.isEligible ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
                <AlertDescription>
                  {eligibility.isEligible ? (
                    <div className="space-y-1">
                      <p className="font-medium text-success">You are eligible for a loan!</p>
                      <p className="text-sm text-muted-foreground">
                        Maximum amount: MWK {eligibility.maxLoanAmount.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Contribution months: {eligibility.contributionMonths} / {eligibility.requiredMonths}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-medium text-destructive">Not eligible at this time</p>
                      <ul className="mt-2 space-y-1 text-sm">
                        {eligibility.reasons.map((reasonText, idx) => (
                          <li key={idx} className="text-destructive">• {reasonText}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="loan-amount">Amount (MWK)</Label>
                <Input
                  id="loan-amount"
                  type="number"
                  min="0"
                  max={eligibility?.maxLoanAmount || undefined}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={eligibility?.maxLoanAmount ? `Max: ${eligibility.maxLoanAmount.toLocaleString()}` : "Enter amount"}
                />
                {eligibility && amount && Number(amount) > eligibility.maxLoanAmount && (
                  <p className="text-xs text-destructive">
                    Exceeds maximum allowed: MWK {eligibility.maxLoanAmount.toLocaleString()}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="loan-reason">Reason (Optional)</Label>
                <Textarea
                  id="loan-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Business expansion, Emergency, etc."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button 
                onClick={handleRequestLoan}
                disabled={
                  !amount || 
                  Number(amount) <= 0 || 
                  (eligibility?.isEligible === false) ||
                  (eligibility && Number(amount) > eligibility.maxLoanAmount)
                }
              >
                Submit Request
              </Button>
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
              {loans.length > 0 ? loans.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell className="font-medium">{loan.id}</TableCell>
                  <TableCell>{loan.amount}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        loan.status === "Active"
                          ? "bg-info/10 text-info hover:bg-info/20 border-0"
                          : loan.status === "Completed"
                          ? "bg-success/10 text-success hover:bg-success/20 border-0"
                          : loan.status === "Pending"
                          ? "bg-warning/10 text-warning hover:bg-warning/20 border-0"
                          : loan.status === "Rejected"
                          ? "bg-destructive/10 text-destructive hover:bg-destructive/20 border-0"
                          : "bg-muted/50 text-muted-foreground border-0"
                      }
                    >
                      {loan.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{loan.date}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                    No loans yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default MemberLoans;

import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import SummaryCard from "@/components/dashboard/SummaryCard";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users,
  Wallet,
  CreditCard,
  TrendingUp,
  UserPlus,
  CheckCircle,
  XCircle,
  Download,
  FileText,
  AlertTriangle,
  LinkIcon,
  Copy,
  Check,
  Shield,
  Eye,
  Calendar,
  RefreshCw,
  Plus,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { toast } from "@/components/ui/sonner";

interface MemberData {
  id: string;
  fullName: string;
  phone?: string;
  status: string;
  createdAt: string;
}

interface LoanData {
  id: string;
  memberId: string;
  principal: number;
  status: string;
  totalDue?: number;
  createdAt: string;
}

interface PenaltyData {
  id: string;
  memberId: string;
  amount: number;
  reason?: string;
  createdAt: string;
}

interface DisplayMember {
  id: string;
  name: string;
  phone: string;
  status: string;
  contributions: string;
  loans: string;
  joined: string;
}

interface DisplayLoan {
  id: string;
  member: string;
  amount: string;
  purpose: string;
  date: string;
  status: string;
}

interface DisplayPenalty {
  id: string;
  member: string;
  type: string;
  amount: string;
  dueDate: string;
  penalty: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [copiedLink, setCopiedLink] = useState(false);
  const [members, setMembers] = useState<DisplayMember[]>([]);
  const [loanRequests, setLoanRequests] = useState<DisplayLoan[]>([]);
  const [missedPayments, setMissedPayments] = useState<DisplayPenalty[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalMembers, setTotalMembers] = useState("0");
  const [totalContributions, setTotalContributions] = useState("MWK 0");
  const [activeLoans, setActiveLoans] = useState("MWK 0");
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [checkOverdueDialogOpen, setCheckOverdueDialogOpen] = useState(false);
  const [generatingContributions, setGeneratingContributions] = useState(false);
  const [checkingOverdue, setCheckingOverdue] = useState(false);
  const [contributionForm, setContributionForm] = useState({
    month: new Date().toISOString().slice(0, 7), // YYYY-MM format
    amount: "",
    dueDate: "",
  });
  const [overdueForm, setOverdueForm] = useState({
    penaltyAmount: "",
    autoGeneratePenalty: true,
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        // Load members
        const memberData = await apiRequest<{ items: MemberData[] }>("/members");
        if (active) {
          setMembers(memberData.items.map((m) => ({
            id: m.id,
            name: m.fullName,
            phone: m.phone || "+—",
            status: m.status === "active" ? "Active" : "Pending",
            contributions: "MWK 0",
            loans: "MWK 0",
            joined: m.createdAt.slice(0, 10),
          })));
        }

        // Load loans
        const loanData = await apiRequest<{ items: LoanData[] }>("/loans");
        if (active) {
          const memberMap = new Map(memberData.items.map((m) => [m.id, m.fullName]));
          const loansMapped = loanData.items
            .filter((l) => l.status === "pending" || l.status === "approved")
            .slice(0, 3)
            .map((l) => ({
              id: l.id,
              member: memberMap.get(l.memberId) || "Unknown",
              amount: `MWK ${l.principal.toLocaleString()}`,
              purpose: "Loan",
              date: l.createdAt.slice(0, 10),
              status: l.status === "pending" ? "Pending" : l.status === "approved" ? "Approved" : "Disbursed",
            }));
          setLoanRequests(loansMapped);
        }

        // Load penalties
        const penaltyData = await apiRequest<{ items: PenaltyData[] }>("/penalties");
        if (active) {
          const memberMap = new Map(memberData.items.map((m) => [m.id, m.fullName]));
          const penaltiesMapped = penaltyData.items.slice(0, 3).map((p) => ({
            id: p.id,
            member: memberMap.get(p.memberId) || "Unknown",
            type: p.reason || "Penalty",
            amount: "MWK 0",
            dueDate: p.createdAt.slice(0, 10),
            penalty: `MWK ${p.amount}`,
          }));
          setMissedPayments(penaltiesMapped);
        }

        // Calculate summary stats
        const activeCount = memberData.items.filter((m) => m.status === "active").length;
        const contribTotal = memberData.items.length * 50000; // Simple estimation
        const loansTotal = loanData.items.reduce((sum: number, l) => sum + (l.totalDue || 0), 0);

        if (active) {
          setTotalMembers(String(activeCount));
          setTotalContributions(`MWK ${contribTotal.toLocaleString()}`);
          setActiveLoans(`MWK ${loansTotal.toLocaleString()}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load dashboard data";
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

  const storedGroup = useMemo(() => {
    try {
      const raw = localStorage.getItem("unityvault:adminGroup");
      return raw
        ? (JSON.parse(raw) as { groupId?: string; groupName?: string; adminName?: string })
        : {};
    } catch {
      return {};
    }
  }, []);

  const storedRules = useMemo(() => {
    try {
      const raw = localStorage.getItem("unityvault:groupRules");
      return raw
        ? (JSON.parse(raw) as {
            shareFee?: string;
            monthlyContribution?: string;
            initialLoanAmount?: string;
            loanInterestPercent?: string;
            penaltyMonthlyMiss?: string;
            penaltyLoanMiss?: string;
            seedAmount?: string;
          })
        : {};
    } catch {
      return {};
    }
  }, []);

  const groupName = storedGroup.groupName || "Your Group";
  const groupId = storedGroup.groupId || "GB-XXXXXX";
  const adminName = storedGroup.adminName || "Group Admin";

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(`https://unityvault.app/join/${groupId}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleGenerateContributions = async () => {
    if (!contributionForm.amount || !contributionForm.dueDate) {
      toast.error("Please fill in all fields");
      return;
    }

    setGeneratingContributions(true);
    try {
      const response = await apiRequest<{ message: string; contributions: unknown[] }>("/contributions/generate", {
        method: "POST",
        body: {
          month: contributionForm.month,
          amount: Number(contributionForm.amount),
          dueDate: new Date(contributionForm.dueDate).toISOString(),
        },
      });
      toast.success(response.message);
      setGenerateDialogOpen(false);
      setContributionForm({ month: new Date().toISOString().slice(0, 7), amount: "", dueDate: "" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate contributions";
      toast.error(message);
    } finally {
      setGeneratingContributions(false);
    }
  };

  const handleCheckOverdue = async () => {
    setCheckingOverdue(true);
    try {
      const response = await apiRequest<{ message: string }>("/contributions/check-overdue", {
        method: "POST",
        body: {
          penaltyAmount: overdueForm.penaltyAmount ? Number(overdueForm.penaltyAmount) : undefined,
          autoGeneratePenalty: overdueForm.autoGeneratePenalty,
        },
      });
      toast.success(response.message);
      setCheckOverdueDialogOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to check overdue contributions";
      toast.error(message);
    } finally {
      setCheckingOverdue(false);
    }
  };

  return (
    <DashboardLayout
      title="Group Admin"
      subtitle={`Manage ${groupName}`}
      isAdmin
      groupId={groupId}
      groupName={groupName}
      userName={adminName}
    >
      {/* Group Info Banner */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{groupName}</p>
            <p className="font-mono text-xs tracking-wider text-muted-foreground">{groupId}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleCopyInvite}>
          {copiedLink ? (
            <Check className="mr-2 h-3.5 w-3.5 text-success" />
          ) : (
            <LinkIcon className="mr-2 h-3.5 w-3.5" />
          )}
          {copiedLink ? "Copied!" : "Copy Invite Link"}
        </Button>
      </div>

      {/* Summary */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total Members"
          value={totalMembers}
          subtitle={`${members.filter((m) => m.status === "Pending").length} pending approval`}
          icon={Users}
          variant="primary"
        />
        <SummaryCard
          title="Total Contributions"
          value={totalContributions}
          subtitle="This cycle"
          icon={Wallet}
          trend={{ value: "+12% from last month", positive: true }}
        />
        <SummaryCard
          title="Active Loans"
          value={activeLoans}
          subtitle={`${loanRequests.length} active loans`}
          icon={CreditCard}
          variant="info"
        />
        <SummaryCard
          title="Collection Rate"
          value="94%"
          subtitle="Above target (90%)"
          icon={TrendingUp}
          trend={{ value: "+2% improvement", positive: true }}
        />
      </div>

      <Tabs defaultValue="members" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="contributions">Contributions</TabsTrigger>
          <TabsTrigger value="loans">Loan Requests</TabsTrigger>
          <TabsTrigger value="penalties">Penalties</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="settings">Rules & Settings</TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members">
          <Card className="border-0 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Member Management</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyInvite}>
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Invite Link
                </Button>
                <Button variant="hero" size="sm" onClick={() => navigate("/admin/members")}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading && <p className="text-sm text-muted-foreground">Loading members...</p>}
              {!loading && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Contributions</TableHead>
                      <TableHead>Outstanding Loans</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.slice(0, 5).map((m) => (
                    <TableRow key={m.name}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell className="text-muted-foreground">{m.phone}</TableCell>
                      <TableCell>{m.contributions}</TableCell>
                      <TableCell>{m.loans}</TableCell>
                      <TableCell className="text-muted-foreground">{m.joined}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            m.status === "Active"
                              ? "bg-success/10 text-success hover:bg-success/20 border-0"
                              : "bg-warning/10 text-warning hover:bg-warning/20 border-0"
                          }
                        >
                          {m.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {m.status === "Pending" ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-success"
                              onClick={() => navigate("/admin/members")}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => navigate("/admin/members")}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground"
                            onClick={() => navigate("/admin/members")}
                          >
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                            View
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contributions Tab */}
        <TabsContent value="contributions">
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-0 shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Generate Monthly Contributions</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Create contribution records for all active members
                      </p>
                      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="hero" size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Generate Contributions
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Generate Monthly Contributions</DialogTitle>
                            <DialogDescription>
                              This will create contribution records for all active members for the selected month.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="month">Month</Label>
                              <Input
                                id="month"
                                type="month"
                                value={contributionForm.month}
                                onChange={(e) => setContributionForm({ ...contributionForm, month: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="amount">Amount (MWK)</Label>
                              <Input
                                id="amount"
                                type="number"
                                placeholder="50000"
                                value={contributionForm.amount}
                                onChange={(e) => setContributionForm({ ...contributionForm, amount: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="dueDate">Due Date</Label>
                              <Input
                                id="dueDate"
                                type="date"
                                value={contributionForm.dueDate}
                                onChange={(e) => setContributionForm({ ...contributionForm, dueDate: e.target.value })}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button 
                              variant="hero" 
                              onClick={handleGenerateContributions}
                              disabled={generatingContributions}
                            >
                              {generatingContributions ? "Generating..." : "Generate"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
                      <RefreshCw className="h-6 w-6 text-warning" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Check Overdue Contributions</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Mark overdue contributions and generate penalties
                      </p>
                      <Dialog open={checkOverdueDialogOpen} onOpenChange={setCheckOverdueDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Check Overdue
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Check Overdue Contributions</DialogTitle>
                            <DialogDescription>
                              This will mark unpaid contributions past their due date as overdue and optionally generate penalties.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="penaltyAmount">Penalty Amount (MWK) - Optional</Label>
                              <Input
                                id="penaltyAmount"
                                type="number"
                                placeholder="5000"
                                value={overdueForm.penaltyAmount}
                                onChange={(e) => setOverdueForm({ ...overdueForm, penaltyAmount: e.target.value })}
                              />
                              <p className="text-xs text-muted-foreground">
                                Leave empty to mark as overdue without generating penalties
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="autoGenerate"
                                checked={overdueForm.autoGeneratePenalty}
                                onChange={(e) => setOverdueForm({ ...overdueForm, autoGeneratePenalty: e.target.checked })}
                                className="h-4 w-4"
                              />
                              <Label htmlFor="autoGenerate" className="text-sm font-normal">
                                Automatically generate penalty records
                              </Label>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setCheckOverdueDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button 
                              variant="default" 
                              onClick={handleCheckOverdue}
                              disabled={checkingOverdue}
                            >
                              {checkingOverdue ? "Checking..." : "Check Overdue"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contributions Info */}
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Contribution Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <h4 className="font-medium text-foreground mb-2">How It Works</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• <strong>Generate Contributions:</strong> Creates contribution records for all active members at the start of each month</li>
                      <li>• <strong>Payment Recording:</strong> Members pay through the payment page, which automatically updates their balance</li>
                      <li>• <strong>Overdue Check:</strong> Run this to mark late contributions as overdue and optionally apply penalties</li>
                      <li>• <strong>Automatic Penalties:</strong> When enabled, penalties are automatically created for overdue contributions</li>
                    </ul>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>All contribution payments are tracked in the audit log</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Loan Requests Tab */}
        <TabsContent value="loans">
          <div className="space-y-6">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Loan Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-foreground mb-4">Check Overdue Installments</h4>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90">
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Check Overdue Installments
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Check for Overdue Loan Installments</DialogTitle>
                          <DialogDescription>
                            This will mark any loan installments past their due date as overdue and create penalties for them.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                            <p className="text-sm font-medium">What happens:</p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                              <li>All loan installments past their due date will be marked as overdue</li>
                              <li>Penalties will be created automatically for each overdue installment</li>
                              <li>Members will be notified about overdue installments</li>
                              <li>All actions are logged in the audit trail</li>
                            </ul>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={async () => {
                                try {
                                  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/loans/check-overdue`, {
                                    method: 'POST',
                                    headers: {
                                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                                    }
                                  });
                                  
                                  if (!response.ok) {
                                    throw new Error('Failed to check overdue installments');
                                  }
                                  
                                  const result = await response.json();
                                  alert(`Success! Processed ${result.processed} installments. Marked ${result.markedOverdue} as overdue and created ${result.penaltiesCreated} penalties.`);
                                } catch (error) {
                                  console.error('Error checking overdue installments:', error);
                                  alert('Failed to check overdue installments. Please try again.');
                                }
                              }}
                              className="bg-primary hover:bg-primary/90"
                            >
                              Run Check Now
                            </Button>
                          </DialogFooter>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <h4 className="font-medium text-foreground mb-2">How It Works</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• <strong>Loan Approval:</strong> When a loan is approved, installments are automatically generated with principal and interest amounts</li>
                      <li>• <strong>Payment Recording:</strong> Members pay through the payment page, which records payments against specific installments</li>
                      <li>• <strong>Overdue Check:</strong> Run this to mark late installments as overdue and apply penalties</li>
                      <li>• <strong>Automatic Penalties:</strong> Penalties are automatically created for each overdue installment (only once per installment)</li>
                    </ul>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>All loan payments are tracked in the audit log</span>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                      <TableHead>Purpose</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loanRequests.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">{l.member}</TableCell>
                        <TableCell>{l.amount}</TableCell>
                        <TableCell className="text-muted-foreground">{l.purpose}</TableCell>
                        <TableCell className="text-muted-foreground">{l.date}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              l.status === "Approved"
                                ? "bg-success/10 text-success hover:bg-success/20 border-0"
                                : l.status === "Pending"
                                ? "bg-warning/10 text-warning hover:bg-warning/20 border-0"
                                : "bg-info/10 text-info hover:bg-info/20 border-0"
                            }
                          >
                            {l.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {l.status === "Pending" ? (
                            <div className="flex justify-end gap-2">
                              <Button variant="default" size="sm" onClick={() => navigate("/admin/loans")}>
                                Approve
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => navigate("/admin/loans")}
                              >
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground"
                              onClick={() => navigate("/admin/loans")}
                            >
                              Details
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          </div>
        </TabsContent>

        {/* Penalties Tab */}
        <TabsContent value="penalties">
          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Missed Payments & Penalties
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading && <p className="text-sm text-muted-foreground">Loading penalties...</p>}
              {!loading && (
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
                    {missedPayments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.member}</TableCell>
                        <TableCell>{p.type}</TableCell>
                        <TableCell>{p.amount}</TableCell>
                        <TableCell className="text-muted-foreground">{p.dueDate}</TableCell>
                        <TableCell>
                          <span className="font-medium text-destructive">{p.penalty}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground"
                            onClick={() => navigate("/admin/penalties")}
                          >
                            Notify
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <div className="grid gap-6 md:grid-cols-2">
            {[
              { title: "Monthly Report", desc: "February 2026 financial summary" },
              { title: "Yearly Report", desc: "2025 annual audit report" },
              { title: "Contribution Report", desc: "Member-by-member breakdown" },
              { title: "Loan Portfolio", desc: "Active loans & repayment status" },
            ].map((report) => (
              <Card key={report.title} className="border-0 shadow-card">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{report.title}</h3>
                    <p className="text-sm text-muted-foreground">{report.desc}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate("/admin/reports")}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Contribution Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    label: "Share Fee",
                    desc: "One-time fee per member",
                    val: storedRules.shareFee ? `MWK ${storedRules.shareFee}` : "Not set",
                  },
                  {
                    label: "Monthly Contribution",
                    desc: "Required contribution per member",
                    val: storedRules.monthlyContribution
                      ? `MWK ${storedRules.monthlyContribution}`
                      : "Not set",
                  },
                  {
                    label: "Initial Loan Amount",
                    desc: "Default loan cap for new members",
                    val: storedRules.initialLoanAmount
                      ? `MWK ${storedRules.initialLoanAmount}`
                      : "Not set",
                  },
                ].map((rule) => (
                  <div key={rule.label} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{rule.label}</p>
                      <p className="text-xs text-muted-foreground">{rule.desc}</p>
                    </div>
                    <span className="font-semibold text-foreground">{rule.val}</span>
                  </div>
                ))}
                <Button variant="outline" className="w-full" onClick={() => navigate("/admin/settings")}>
                  Edit Rules
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Penalty Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    label: "Missed Contribution",
                    desc: "Percentage of the missed contribution amount",
                    val: storedRules.penaltyMonthlyMiss
                      ? `${storedRules.penaltyMonthlyMiss}%`
                      : "Not set",
                  },
                  {
                    label: "Missed Loan Payment",
                    desc: "Percentage of the missed loan payment amount",
                    val: storedRules.penaltyLoanMiss
                      ? `${storedRules.penaltyLoanMiss}%`
                      : "Not set",
                  },
                  {
                    label: "Loan Interest",
                    desc: "Monthly interest rate",
                    val: storedRules.loanInterestPercent
                      ? `${storedRules.loanInterestPercent}%`
                      : "Not set",
                  },
                ].map((rule) => (
                  <div key={rule.label} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{rule.label}</p>
                      <p className="text-xs text-muted-foreground">{rule.desc}</p>
                    </div>
                    <span className="font-semibold text-foreground">{rule.val}</span>
                  </div>
                ))}
                <Button variant="outline" className="w-full" onClick={() => navigate("/admin/settings")}>
                  Edit Rules
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default AdminDashboard;

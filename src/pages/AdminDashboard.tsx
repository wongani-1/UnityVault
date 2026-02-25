import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminRole } from "@/hooks/use-admin-role";
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
  Download,
  FileText,
  AlertTriangle,
  Shield,
  Eye,
  Calendar,
  RefreshCw,
  Plus,
  PiggyBank,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { toast } from "@/components/ui/sonner";

interface MemberData {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  status: string;
  balance: number;
  penaltiesTotal: number;
  createdAt: string;
}

interface LoanData {
  id: string;
  memberId: string;
  principal: number;
  interestRate: number;
  totalInterest: number;
  totalDue: number;
  balance: number;
  status: string;
  reason?: string;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  completedAt?: string;
}

interface PenaltyData {
  id: string;
  memberId: string;
  loanId?: string;
  installmentId?: string;
  contributionId?: string;
  amount: number;
  reason?: string;
  status: string;
  dueDate: string;
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
  balance: string;
  totalDue: string;
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
  status: string;
}

interface ContributionData {
  id: string;
  memberId: string;
  amount: number;
  month: string;
  status: string;
  dueDate: string;
  paidAt?: string;
}

interface LedgerEntryData {
  id: string;
  type: string;
  amount: number;
  groupCashChange: number;
}

interface DistributionStatusItem {
  year: number;
  status: "pending" | "completed" | "cancelled";
  distributedAt?: string;
}

interface SubscriptionStatusData {
  subscriptionPaid: boolean;
  isActive: boolean;
  isTrialActive?: boolean;
  trialEndsAt?: string;
  trialDaysRemaining?: number;
}

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

const addOneMonth = (month: string) => {
  if (!MONTH_PATTERN.test(month)) return undefined;
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const date = new Date(year, monthIndex, 1);
  date.setMonth(date.getMonth() + 1);
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const isAdmin = useAdminRole();
  const [members, setMembers] = useState<DisplayMember[]>([]);
  const [loanRequests, setLoanRequests] = useState<DisplayLoan[]>([]);
  const [missedPayments, setMissedPayments] = useState<DisplayPenalty[]>([]);
  const [contributions, setContributions] = useState<ContributionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupSettings, setGroupSettings] = useState<{
    contributionAmount: number;
    loanInterestRate: number;
    penaltyRate: number;
    contributionPenaltyRate: number;
  } | null>(null);
  const [totalMembers, setTotalMembers] = useState("0");
  const [totalContributions, setTotalContributions] = useState("MWK 0");
  const [activeLoans, setActiveLoans] = useState("MWK 0");
  const [collectionRate, setCollectionRate] = useState("0%");
  const [collectionRateSubtitle, setCollectionRateSubtitle] = useState("No data yet");
  const [groupTreasury, setGroupTreasury] = useState("MWK 0");
  const [treasuryBreakdown, setTreasuryBreakdown] = useState("Contributions + Penalties");
  const [cycleLockedAt, setCycleLockedAt] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatusData | null>(null);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generatingContributions, setGeneratingContributions] = useState(false);
  const [contributionForm, setContributionForm] = useState({
    month: new Date().toISOString().slice(0, 7), // YYYY-MM format
    dueDate: "",
  });

  const expectedNextContributionMonth = useMemo(() => {
    const generatedMonths = Array.from(
      new Set(
        contributions
          .map((contribution) => contribution.month)
          .filter((month) => MONTH_PATTERN.test(month))
      )
    ).sort((a, b) => a.localeCompare(b));

    if (generatedMonths.length === 0) return null;
    return addOneMonth(generatedMonths[generatedMonths.length - 1]) || null;
  }, [contributions]);

  const isContributionMonthValid =
    !expectedNextContributionMonth || contributionForm.month === expectedNextContributionMonth;

  const isContributionDueDateValid = useMemo(() => {
    if (!contributionForm.dueDate) return false;
    const selected = new Date(contributionForm.dueDate);
    if (Number.isNaN(selected.getTime())) return false;
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const selectedDate = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate());
    return selectedDate >= startOfToday;
  }, [contributionForm.dueDate]);

  useEffect(() => {
    if (!generateDialogOpen || !expectedNextContributionMonth) return;

    setContributionForm((prev) => ({
      ...prev,
      month: expectedNextContributionMonth,
    }));
  }, [generateDialogOpen, expectedNextContributionMonth]);

  const loadDashboardData = async () => {
    try {
      const subscription = await apiRequest<SubscriptionStatusData>("/admins/me/subscription-status");
      setSubscriptionStatus(subscription);

      if (!subscription.isActive) {
        const hasStarterTrialExpired =
          !subscription.subscriptionPaid && Boolean(subscription.trialEndsAt);
        toast.error(
          hasStarterTrialExpired
            ? "Your 14-day Starter trial has ended. Please subscribe to continue."
            : "Subscription required. Please pay or renew to continue."
        );
        navigate("/admin/subscription-fee");
        return;
      }

      // Load group settings
      const settings = await apiRequest<{
        contributionAmount: number;
        loanInterestRate: number;
        penaltyRate: number;
        contributionPenaltyRate: number;
      }>("/groups/settings");
      setGroupSettings(settings);

      // Load members
      const memberData = await apiRequest<{ items: MemberData[] }>("/members");
      
      // Load loans
      const loanData = await apiRequest<{ items: LoanData[] }>("/loans");
      const memberMap = new Map(memberData.items.map((m) => [m.id, `${m.first_name} ${m.last_name}`]));
      
      // Calculate member loan totals
      const memberLoans = new Map<string, number>();
      loanData.items.forEach((loan) => {
        if (loan.status === "active" || loan.status === "approved") {
          const currentTotal = memberLoans.get(loan.memberId) || 0;
          memberLoans.set(loan.memberId, currentTotal + (loan.balance || 0));
        }
      });

      // Load contributions for penalty amount lookup
      const contributionData = await apiRequest<{ items: ContributionData[] }>("/contributions");
      setContributions(contributionData.items);
      const contributionMap = new Map(contributionData.items.map((c) => [c.id, c.amount]));

      // Load ledger entries to compute true cash-on-hand treasury
      const ledgerData = await apiRequest<{ items: LedgerEntryData[] }>("/ledger?limit=500").catch(
        () => ({ items: [] })
      );

      const currentYear = new Date().getFullYear();
      const distributions = await apiRequest<{ items: DistributionStatusItem[] }>("/distributions").catch(
        () => ({ items: [] })
      );
      const currentYearDistribution = distributions.items.find(
        (d) => d.year === currentYear && d.status === "completed"
      );
      setCycleLockedAt(currentYearDistribution?.distributedAt || null);

      // Calculate cycle-to-date paid contributions per member
      const memberContributions = new Map<string, number>();
      contributionData.items
        .filter(c => c.status === "paid")
        .forEach((c) => {
          const currentTotal = memberContributions.get(c.memberId) || 0;
          memberContributions.set(c.memberId, currentTotal + c.amount);
        });

      // Set members with actual contributions and loan balances
      setMembers(memberData.items.map((m) => ({
        id: m.id,
        name: `${m.first_name} ${m.last_name}`,
        phone: m.phone || "+—",
        status: m.status === "active" ? "Active" : "Pending",
        contributions: `MWK ${(memberContributions.get(m.id) || 0).toLocaleString()}`,
        loans: `MWK ${(memberLoans.get(m.id) || 0).toLocaleString()}`,
        joined: m.createdAt.slice(0, 10),
      })));
      
      const loansMapped = loanData.items
        .map((l) => ({
          id: l.id,
          member: memberMap.get(l.memberId) || "Unknown",
          amount: `MWK ${(l.principal || 0).toLocaleString()}`,
          purpose: l.reason || "General Loan",
          balance: `MWK ${(l.balance || 0).toLocaleString()}`,
          totalDue: `MWK ${(l.totalDue || 0).toLocaleString()}`,
          date: l.createdAt ? l.createdAt.slice(0, 10) : "N/A",
          status: l.status === "pending" ? "Pending" : 
                  l.status === "approved" ? "Approved" : 
                  l.status === "active" ? "Active" :
                  l.status === "completed" ? "Completed" :
                  l.status === "rejected" ? "Rejected" : "Unknown",
        }));
      setLoanRequests(loansMapped);

      // Load penalties
      const penaltyData = await apiRequest<{ items: PenaltyData[] }>("/penalties");
      const penaltiesMapped = penaltyData.items.map((p) => {
        let relatedAmount = "—";
        if (p.contributionId && contributionMap.has(p.contributionId)) {
          relatedAmount = `MWK ${(contributionMap.get(p.contributionId) || 0).toLocaleString()}`;
        }

        return {
          id: p.id,
          member: memberMap.get(p.memberId) || "Unknown",
          type: p.reason || "Penalty",
          amount: relatedAmount,
          dueDate: p.dueDate ? p.dueDate.slice(0, 10) : p.createdAt.slice(0, 10),
          penalty: `MWK ${p.amount.toLocaleString()}`,
          status: p.status === "paid" ? "Paid" : "Unpaid",
        };
      });
      setMissedPayments(penaltiesMapped);

      // Calculate summary stats
      const activeCount = memberData.items.filter((m) => m.status === "active").length;
      
      // Calculate total contributions for cycle-to-date (already filtered above)
      const contribTotal = Array.from(memberContributions.values()).reduce((sum, amt) => sum + amt, 0);
      
      // Only count active and approved loans for dashboard outstanding loans card
      const activeLoansList = loanData.items.filter((l) => l.status === "active" || l.status === "approved");
      const loansTotal = activeLoansList.reduce((sum: number, l) => sum + (l.balance || 0), 0);

      // Calculate treasury from ledger cash flow (source of truth):
      // includes contributions, seed deposits, penalties, loan repayments (incl. interest), and deductions.
      const ledgerItems = (ledgerData.items || []) as LedgerEntryData[];
      let ledgerTreasuryTotal = 0;
      let contributionCash = 0;
      let seedCash = 0;
      let penaltiesCash = 0;
      let loanRepaymentCash = 0;

      for (const entry of ledgerItems) {
        const cashChange = entry.groupCashChange || 0;
        ledgerTreasuryTotal += cashChange;

        if (entry.type === "contribution") contributionCash += cashChange;
        if (entry.type === "seed_deposit") seedCash += cashChange;
        if (entry.type === "penalty_payment") penaltiesCash += cashChange;
        if (entry.type === "loan_repayment") loanRepaymentCash += cashChange;
      }

      const treasuryTotal = Number(Math.max(0, ledgerTreasuryTotal).toFixed(2));

      setTotalMembers(String(activeCount));
      setTotalContributions(`MWK ${contribTotal.toLocaleString()}`);
      setActiveLoans(`MWK ${loansTotal.toLocaleString()}`);
      setGroupTreasury(`MWK ${treasuryTotal.toLocaleString()}`);
      setTreasuryBreakdown(
        `Includes contributions (MWK ${contributionCash.toLocaleString()}), seed (MWK ${seedCash.toLocaleString()}), penalties (MWK ${penaltiesCash.toLocaleString()}), and loan repayments/interest (MWK ${loanRepaymentCash.toLocaleString()})`
      );

      // Calculate collection rate
      const paidContributions = contributionData.items.filter(c => c.status === "paid").length;
      const totalContributions = contributionData.items.length;
      if (totalContributions > 0) {
        const rate = Math.round((paidContributions / totalContributions) * 100);
        setCollectionRate(`${rate}%`);
        const target = 90;
        setCollectionRateSubtitle(rate >= target ? `Above target (${target}%)` : `Below target (${target}%)`);
      } else {
        setCollectionRate("--");
        setCollectionRateSubtitle("No contributions yet");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load dashboard data";
      toast.error(message);
      if (
        typeof message === "string" &&
        (message.toLowerCase().includes("trial has ended") ||
          message.toLowerCase().includes("subscription required"))
      ) {
        navigate("/admin/subscription-fee");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData();
    }
  }, [isAdmin]);

  // Update contribution form when group settings are loaded
  useEffect(() => {
    if (groupSettings) {
      setContributionForm(prev => ({
        ...prev,
        amount: groupSettings.contributionAmount.toString(),
      }));
    }
  }, [groupSettings]);

  const storedGroup = useMemo(() => {
    try {
      const raw = sessionStorage.getItem("unityvault:adminGroup");
      return raw
        ? (JSON.parse(raw) as { groupId?: string; groupName?: string; adminName?: string })
        : {};
    } catch {
      return {};
    }
  }, []);

  const storedRules = useMemo(() => {
    try {
      const raw = sessionStorage.getItem("unityvault:groupRules");
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
  const adminName = storedGroup.adminName || "Group Admin";

  const handleGenerateContributions = async () => {
    if (!isAdmin) {
      toast.error("Access denied");
      return;
    }

    if (!MONTH_PATTERN.test(contributionForm.month)) {
      toast.error("Please select a valid month (YYYY-MM)");
      return;
    }

    if (expectedNextContributionMonth && contributionForm.month !== expectedNextContributionMonth) {
      toast.error(`Contributions must be generated in order. Next allowed month is ${expectedNextContributionMonth}.`);
      return;
    }

    if (!contributionForm.dueDate) {
      toast.error("Please select a due date");
      return;
    }

    if (!isContributionDueDateValid) {
      toast.error("Due date cannot be before today");
      return;
    }

    if (!groupSettings?.contributionAmount) {
      toast.error("Group contribution amount not set");
      return;
    }

    setGeneratingContributions(true);
    try {
      const response = await apiRequest<{ message: string; contributions: unknown[] }>("/contributions/generate", {
        method: "POST",
        body: {
          month: contributionForm.month,
          amount: groupSettings.contributionAmount,
          dueDate: new Date(contributionForm.dueDate).toISOString(),
        },
      });
      toast.success(response.message);
      setGenerateDialogOpen(false);
      setContributionForm({ 
        month: new Date().toISOString().slice(0, 7), 
        dueDate: "" 
      });
      // Reload dashboard data to reflect new contributions
      await loadDashboardData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate contributions";
      toast.error(message);
    } finally {
      setGeneratingContributions(false);
    }
  };



  return (
    <DashboardLayout
      title="Group Admin"
      subtitle={`Manage ${groupName}`}
      isAdmin
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
          </div>
        </div>
        <Button variant="hero" size="sm" onClick={() => navigate("/admin/subscription-fee")}>
          Upgrade Plan
        </Button>
      </div>

      {subscriptionStatus?.isTrialActive && subscriptionStatus.trialEndsAt && (
        <div className="mb-6 rounded-xl border border-warning/30 bg-warning/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-warning" />
            <div>
              <p className="text-sm font-semibold text-foreground">You are on a 14-day Starter trial</p>
              <p className="text-xs text-muted-foreground">
                Trial ends on {new Date(subscriptionStatus.trialEndsAt).toLocaleDateString()} ({subscriptionStatus.trialDaysRemaining || 0} day{(subscriptionStatus.trialDaysRemaining || 0) === 1 ? "" : "s"} remaining).
              </p>
            </div>
          </div>
        </div>
      )}

      {cycleLockedAt && (
        <div className="mb-6 rounded-xl border border-warning/30 bg-warning/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-warning" />
            <div>
              <p className="text-sm font-semibold text-foreground">Cycle Locked</p>
              <p className="text-xs text-muted-foreground">
                This cycle was closed on {new Date(cycleLockedAt).toLocaleDateString()}. New loans, contribution payments, and penalty payments are locked.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard
          title="Group Treasury"
          value={groupTreasury}
          subtitle={treasuryBreakdown}
          tooltip="(Paid Contributions + Paid Penalties) - Loan Principal Disbursed + Loan Repayments (including interest)"
          icon={PiggyBank}
          variant="primary"
        />
        <SummaryCard
          title="Total Members"
          value={totalMembers}
          subtitle={`${members.filter((m) => m.status === "Active").length} active members`}
          icon={Users}
          variant="primary"
        />
        <SummaryCard
          title="Total Contributions"
          value={totalContributions}
          subtitle="Cycle-to-date"
          icon={Wallet}
        />
        <SummaryCard
          title="Active Loans"
          value={activeLoans}
          subtitle={`${loanRequests.filter((l) => l.status === "Active" || l.status === "Approved").length} active loans`}
          icon={CreditCard}
          variant="info"
        />
        <SummaryCard
          title="Collection Rate"
          value={collectionRate}
          subtitle={collectionRateSubtitle}
          icon={TrendingUp}
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
            <CardHeader className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-lg">Member Management</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyInvite}>
                  <LinkIcon className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Invite Link</span>
                  <span className="sm:hidden">Invite</span>
                </Button>
                <Button variant="hero" size="sm" onClick={() => navigate("/admin/members")}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Add Member</span>
                  <span className="sm:hidden">Add</span>
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
                      <TableHead className="hidden sm:table-cell">Phone</TableHead>
                      <TableHead>Contributions</TableHead>
                      <TableHead className="hidden sm:table-cell">Outstanding Loans</TableHead>
                      <TableHead className="hidden sm:table-cell">Joined</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.slice(0, 5).map((m) => (
                    <TableRow key={m.name}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{m.phone}</TableCell>
                      <TableCell>{m.contributions}</TableCell>
                      <TableCell className="hidden sm:table-cell">{m.loans}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{m.joined}</TableCell>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground"
                          onClick={() => navigate("/admin/members")}
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          View
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

        {/* Contributions Tab */}
        <TabsContent value="contributions">
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="grid gap-4">
              <Card className="border-0 shadow-card">
                <CardContent className="p-4 sm:p-6">
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
                              {expectedNextContributionMonth && (
                                <p className="text-xs text-muted-foreground">
                                  Next allowed month: {expectedNextContributionMonth}
                                </p>
                              )}
                              {!isContributionMonthValid && (
                                <p className="text-xs text-destructive">
                                  Month must be {expectedNextContributionMonth}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="amount">Amount (MWK)</Label>
                              <Input
                                id="amount"
                                type="text"
                                value={groupSettings ? `MWK ${groupSettings.contributionAmount.toLocaleString()}` : "Loading..."}
                                disabled
                                className="bg-muted"
                              />
                              <p className="text-xs text-muted-foreground">
                                This amount is set in your group's rules and fees settings
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="dueDate">Due Date</Label>
                              <Input
                                id="dueDate"
                                type="date"
                                value={contributionForm.dueDate}
                                onChange={(e) => setContributionForm({ ...contributionForm, dueDate: e.target.value })}
                              />
                              {contributionForm.dueDate && !isContributionDueDateValid && (
                                <p className="text-xs text-destructive">
                                  Due date cannot be before today
                                </p>
                              )}
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button 
                              variant="hero" 
                              onClick={handleGenerateContributions}
                              disabled={
                                generatingContributions ||
                                !isContributionMonthValid ||
                                !isContributionDueDateValid
                              }
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
            </div>

            {/* Contributions Info */}
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Contribution Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <h4 className="font-medium text-foreground mb-2">Automatic Contribution Management</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• <strong>Generate Contributions:</strong> Creates contribution records for all active members at the start of each month</li>
                      <li>• <strong>Payment Recording:</strong> Members pay through the payment page, which automatically updates their balance</li>
                      <li>• <strong>Automatic Overdue Check:</strong> The system automatically checks for overdue contributions every time contribution data is accessed</li>
                      <li>• <strong>Automatic Penalties:</strong> When a contribution becomes overdue, the system automatically applies penalties based on the group's contribution penalty rate</li>
                      <li>• <strong>Penalty Calculation:</strong> Penalty = Contribution Amount × Group Contribution Penalty Rate (e.g., MWK 10,000 × 10% = MWK 1,000)</li>
                      <li>• <strong>Smart Detection:</strong> Penalties are only created once per overdue contribution to prevent duplicates</li>
                    </ul>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>All contribution payments and penalties are tracked in the audit log</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Contributions Table */}
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Recent Contributions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Month</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead className="hidden sm:table-cell">Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden sm:table-cell">Paid Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contributions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            No contributions generated yet. Click "Generate Contributions" to create records.
                          </TableCell>
                        </TableRow>
                      ) : (
                        contributions.slice(0, 10).map((contrib) => {
                          const member = members.find(m => m.id === contrib.memberId);
                          const statusColor = 
                            contrib.status === "paid" ? "bg-green-500/10 text-green-700" :
                            contrib.status === "overdue" ? "bg-red-500/10 text-red-700" :
                            "bg-yellow-500/10 text-yellow-700";
                          
                          return (
                            <TableRow key={contrib.id}>
                              <TableCell className="font-medium">{member?.name || "Unknown"}</TableCell>
                              <TableCell>{contrib.month}</TableCell>
                              <TableCell>MWK {contrib.amount.toLocaleString()}</TableCell>
                              <TableCell className="hidden sm:table-cell">{new Date(contrib.dueDate).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Badge className={statusColor}>
                                  {contrib.status === "paid" ? "Paid" : contrib.status === "overdue" ? "Overdue" : "Unpaid"}
                                </Badge>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                {contrib.paidAt ? new Date(contrib.paidAt).toLocaleDateString() : "—"}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
                {contributions.length > 10 && (
                  <div className="mt-4 text-center">
                    <Button variant="outline" size="sm" onClick={() => navigate("/admin/contributions")}>
                      View All Contributions
                    </Button>
                  </div>
                )}
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
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <h4 className="font-medium text-foreground mb-2">Automatic Loan Management</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• <strong>Loan Approval:</strong> When a loan is approved, installments are automatically generated with due dates, principal and interest amounts</li>
                      <li>• <strong>Payment Recording:</strong> Members pay through the payment page, which records payments against specific installments</li>
                      <li>• <strong>Automatic Overdue Check:</strong> The system automatically checks for overdue installments every time loan data is accessed</li>
                      <li>• <strong>Automatic Penalties:</strong> When an installment becomes overdue, the system automatically applies penalties based on the group's penalty rate and notifies the member</li>
                      <li>• <strong>Smart Detection:</strong> Penalties are only created once per overdue installment to prevent duplicates</li>
                    </ul>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>All loan payments and penalties are tracked in the audit log</span>
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
                      <TableHead className="hidden sm:table-cell">Balance</TableHead>
                      <TableHead className="hidden sm:table-cell">Total Due</TableHead>
                      <TableHead className="hidden sm:table-cell">Purpose</TableHead>
                      <TableHead className="hidden sm:table-cell">Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loanRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          No loan applications yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      loanRequests.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell className="font-medium">{l.member}</TableCell>
                          <TableCell>{l.amount}</TableCell>
                          <TableCell className="hidden sm:table-cell">{l.balance}</TableCell>
                          <TableCell className="hidden sm:table-cell">{l.totalDue}</TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground">{l.purpose}</TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground">{l.date}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                l.status === "Approved" || l.status === "Active"
                                  ? "bg-success/10 text-success hover:bg-success/20 border-0"
                                  : l.status === "Pending"
                                  ? "bg-warning/10 text-warning hover:bg-warning/20 border-0"
                                  : l.status === "Completed"
                                  ? "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 border-0"
                                  : l.status === "Rejected"
                                  ? "bg-red-500/10 text-red-700 hover:bg-red-500/20 border-0"
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
                    )))}
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
                      <TableHead className="hidden sm:table-cell">Type</TableHead>
                      <TableHead className="hidden sm:table-cell">Amount Due</TableHead>
                      <TableHead className="hidden sm:table-cell">Due Date</TableHead>
                      <TableHead>Penalty</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {missedPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          No penalties recorded yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      missedPayments.slice(0, 5).map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.member}</TableCell>
                          <TableCell className="hidden sm:table-cell">{p.type}</TableCell>
                          <TableCell className="hidden sm:table-cell">{p.amount}</TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground">{p.dueDate}</TableCell>
                          <TableCell>
                            <span className="font-medium text-destructive">{p.penalty}</span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                p.status === "Paid"
                                  ? "bg-success/10 text-success hover:bg-success/20 border-0"
                                  : "bg-destructive/10 text-destructive hover:bg-destructive/20 border-0"
                              }
                            >
                              {p.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground"
                              onClick={() => navigate("/admin/penalties")}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { title: "Monthly Report", desc: "Current month financial summary" },
              { title: "Yearly Report", desc: "Annual audit report" },
              { title: "Contribution Report", desc: "Member-by-member breakdown" },
              { title: "Loan Portfolio", desc: "Active loans & repayment status" },
            ].map((report) => (
              <Card key={report.title} className="border-0 shadow-card">
                <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{report.title}</h3>
                    <p className="text-sm text-muted-foreground">{report.desc}</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => navigate("/admin/reports")}>
                    <Download className="mr-2 h-4 w-4" />
                    Export PDF
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="grid gap-4 sm:grid-cols-2">
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
                    val: groupSettings 
                      ? `MWK ${groupSettings.contributionAmount.toLocaleString()}` 
                      : "Loading...",
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
                    val: groupSettings
                      ? `${(groupSettings.contributionPenaltyRate * 100).toFixed(1)}%`
                      : "Loading...",
                  },
                  {
                    label: "Missed Loan Payment",
                    desc: "Percentage of the missed loan payment amount",
                    val: groupSettings
                      ? `${(groupSettings.penaltyRate * 100).toFixed(1)}%`
                      : "Loading...",
                  },
                  {
                    label: "Loan Interest",
                    desc: "Monthly interest rate",
                    val: groupSettings
                      ? `${(groupSettings.loanInterestRate * 100).toFixed(1)}%`
                      : "Loading...",
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

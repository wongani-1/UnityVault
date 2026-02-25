import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import SummaryCard from "@/components/dashboard/SummaryCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Wallet,
  CreditCard,
  AlertTriangle,
  PiggyBank,
  Plus,
  HandCoins,
  Bell,
  CalendarClock,
  TrendingUp,
  DollarSign,
  Banknote,
  Sprout,
  Share2,
  AlertCircle,
} from "lucide-react";
import { apiRequest } from "../lib/api";
import { toast } from "@/components/ui/sonner";

interface Contribution {
  id: string;
  amount: number;
  month: string;
  paidAt?: string;
  createdAt: string;
}

interface Loan {
  id: string;
  principal: number;
  balance: number;
  totalDue: number;
  status: string;
  approvedAt?: string;
  dueDate?: string;
}

interface Penalty {
  id: string;
  amount: number;
  reason: string;
  isPaid: boolean;
  createdAt: string;
}

interface Notification {
  id: string;
  message: string;
  type: string;
  createdAt: string;
}

interface MemberProfile {
  id: string;
  first_name: string;
  last_name?: string;
  groupId: string;
  seedPaid?: boolean;
  sharesOwned?: number;
}

interface GroupSettings {
  seedAmount?: number;
  shareFee?: number;
  initialLoanAmount?: number;
}

const MemberDashboard = () => {
  const navigate = useNavigate();
  const storedProfile = useMemo(() => {
    try {
      const raw = sessionStorage.getItem("unityvault:memberProfile");
      return raw
        ? (JSON.parse(raw) as { fullName?: string; groupId?: string; groupName?: string })
        : {};
    } catch {
      return {};
    }
  }, []);

  const [profile, setProfile] = useState(storedProfile);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [sharePurchaseDialogOpen, setSharePurchaseDialogOpen] = useState(false);
  const [sharesToPurchase, setSharesToPurchase] = useState(1);
  
  // Data state
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [memberProfile, setMemberProfile] = useState<MemberProfile | null>(null);
  const [groupSettings, setGroupSettings] = useState<GroupSettings | null>(null);
  const [profileResolved, setProfileResolved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Calculated values
  const totalContributions = useMemo(() => {
    return contributions
      .filter(c => c.paidAt)
      .reduce((sum, c) => sum + (c.amount || 0), 0);
  }, [contributions]);

  const paidContributionsCount = useMemo(() => {
    return contributions.filter(c => c.paidAt).length;
  }, [contributions]);

  const outstandingLoans = useMemo(() => {
    return loans
      .filter(l => l.status === "approved" || l.status === "active")
      .reduce((sum, l) => sum + (l.balance || 0), 0);
  }, [loans]);

  const activeLoansCount = useMemo(() => {
    return loans.filter(l => (l.status === "approved" || l.status === "active") && (l.balance || 0) > 0).length;
  }, [loans]);

  const pendingPenalties = useMemo(() => {
    return penalties
      .filter(p => !p.isPaid)
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [penalties]);

  const pendingPenaltiesCount = useMemo(() => {
    return penalties.filter(p => !p.isPaid).length;
  }, [penalties]);

  const totalBalance = useMemo(() => {
    return totalContributions - outstandingLoans - pendingPenalties;
  }, [totalContributions, outstandingLoans, pendingPenalties]);

  // Check if member has contribution-related penalties (for "on track" status)
  const hasContributionPenalties = useMemo(() => {
    return penalties.some(p => 
      !p.isPaid && 
      (p.reason.toLowerCase().includes("contribution") || 
       p.reason.toLowerCase().includes("monthly") ||
       p.reason.toLowerCase().includes("payment"))
    );
  }, [penalties]);

  const isOnTrack = !hasContributionPenalties;

  // Calculate loan limit based on shares
  const loanLimit = useMemo(() => {
    if (!memberProfile?.sharesOwned || !groupSettings?.initialLoanAmount) return 0;
    return memberProfile.sharesOwned * groupSettings.initialLoanAmount;
  }, [memberProfile, groupSettings]);

  const shareFee = groupSettings?.shareFee || 0;
  const seedPaid = memberProfile?.seedPaid || false;
  const sharesOwned = memberProfile?.sharesOwned || 0;
  const seedFeePerShare = groupSettings?.seedAmount || 0;
  const seedDepositTotal = seedFeePerShare * sharesOwned;

  // Handle share purchase - redirect to payment page
  const handlePurchaseShares = () => {
    if (sharesToPurchase < 1) {
      toast.error("Please select at least 1 share to purchase");
      return;
    }

    // Store shares in localStorage and navigate to payment page
    sessionStorage.setItem("unityvault:pendingShares", sharesToPurchase.toString());
    setSharePurchaseDialogOpen(false);
    navigate(`/member/share-purchase?shares=${sharesToPurchase}`);
  };

  // Load member profile and group settings (always fetch fresh data)
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const member = await apiRequest<MemberProfile>("/members/me");
        const group = await apiRequest<{ name: string; settings: GroupSettings }>("/groups/me");
        const fullName = `${member.first_name} ${member.last_name || ""}`.trim();
        const next = {
          fullName,
          groupId: member.groupId,
          groupName: group.name,
        };
        if (!active) return;
        setProfile(next);
        setMemberProfile(member);
        setGroupSettings(group.settings || {});
        sessionStorage.setItem("unityvault:memberProfile", JSON.stringify(next));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load profile";
        toast.error(message);
      } finally {
        if (active) {
          setProfileResolved(true);
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []); // Empty dependency array means this runs once on mount

  // Fetch dashboard data
  useEffect(() => {
    let active = true;
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [contributionsData, loansData, penaltiesData, notificationsData] = await Promise.all([
          apiRequest<{ items: Contribution[] }>("/contributions").catch(() => ({ items: [] })),
          apiRequest<{ items: Loan[] }>("/loans").catch(() => ({ items: [] })),
          apiRequest<{ items: Penalty[] }>("/penalties").catch(() => ({ items: [] })),
          apiRequest<{ items: Notification[] }>("/notifications").catch(() => ({ items: [] })),
        ]);

        if (!active) return;

        setContributions(contributionsData.items || []);
        setLoans(loansData.items || []);
        setPenalties(penaltiesData.items || []);
        const sortedNotifications = [...(notificationsData.items || [])].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setNotifications(sortedNotifications);
      } catch (error) {
        if (active) {
          const message = error instanceof Error ? error.message : "Failed to load dashboard data";
          toast.error(message);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDashboardData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const displayName = profile.fullName || "";
  const groupId = profile.groupId || "";
  const groupName = profile.groupName || "";

  // Format contributions for table display
  const contributionHistory = useMemo(() => {
    return contributions.slice(0, 5).map(c => ({
      date: (c.paidAt || c.createdAt).slice(0, 10),
      amount: `MWK ${(c.amount || 0).toLocaleString()}`,
      status: c.paidAt ? "Paid" : "Pending",
      method: "Recorded",
    }));
  }, [contributions]);

  // Format loans for display
  const loanHistory = useMemo(() => {
    return loans.map(l => {
      const amount = l.principal || 0;
      const balance = l.balance || 0;
      const totalDue = l.totalDue || 0;
      const repaidPercentage = totalDue > 0 ? Math.round(((totalDue - balance) / totalDue) * 100) : 0;
      return {
        id: l.id,
        amount: `MWK ${amount.toLocaleString()}`,
        balance: `MWK ${balance.toLocaleString()}`,
        repaid: repaidPercentage,
        status: balance === 0 ? "Cleared" : (l.status === "approved" || l.status === "active") ? "Active" : "Pending",
        dueDate: l.dueDate ? new Date(l.dueDate).toISOString().slice(0, 10) : "—",
        nextPayment: balance > 0 ? `MWK ${Math.ceil(balance / 3).toLocaleString()}` : "—",
      };
    });
  }, [loans]);

  // Format notifications for display
  const recentNotifications = useMemo(() => {
    const getTimeAgo = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
      return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
    };

    return notifications.slice(0, 4).map(n => ({
      message: n.message,
      type: n.type || "info",
      time: getTimeAgo(n.createdAt),
    }));
  }, [notifications]);

  return (
    <DashboardLayout
      title="My Dashboard"
      subtitle={`Welcome, ${displayName}`}
      groupId={groupId}
      groupName={groupName}
    >
      {/* Seed Deposit Alert */}
      {profileResolved && !seedPaid && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Seed Deposit Required
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {sharesOwned > 0
                  ? `Pay your one-time seed deposit of MWK ${seedDepositTotal.toLocaleString()} (based on ${sharesOwned} share${sharesOwned === 1 ? "" : "s"}).`
                  : "Buy shares first to calculate your one-time seed deposit."}
              </p>
              <Button
                variant="default"
                size="sm"
                className="mt-2 bg-amber-600 hover:bg-amber-700"
                onClick={() =>
                  navigate(
                    sharesOwned > 0
                      ? "/member/seed-payment"
                      : "/member/share-purchase?shares=1"
                  )
                }
              >
                <Sprout className="mr-2 h-4 w-4" />
                {sharesOwned > 0 ? "Pay Seed Deposit" : "Buy Shares"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="My Contributions"
          value={`MWK ${totalContributions.toLocaleString()}`}
          subtitle={`${paidContributionsCount} payment${paidContributionsCount !== 1 ? 's' : ''} made`}
          icon={Wallet}
          variant="primary"
          trend={{ value: isOnTrack ? "On track" : "Off track", positive: isOnTrack }}
        />
        <SummaryCard
          title="Outstanding Loans"
          value={`MWK ${outstandingLoans.toLocaleString()}`}
          subtitle={`${activeLoansCount} active loan${activeLoansCount !== 1 ? 's' : ''}`}
          icon={CreditCard}
          variant="info"
        />
        <SummaryCard
          title="Shares Owned"
          value={`${sharesOwned}`}
          subtitle={`Loan limit: MWK ${loanLimit.toLocaleString()}`}
          icon={Share2}
          variant="primary"
        />
        <SummaryCard
          title="Penalties Due"
          value={`MWK ${pendingPenalties.toLocaleString()}`}
          subtitle={`${pendingPenaltiesCount} pending ${pendingPenaltiesCount !== 1 ? 'penalties' : 'penalty'}`}
          icon={AlertTriangle}
          variant="warning"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8 flex flex-wrap gap-3">
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" size="lg" disabled={!seedPaid}>
              <Plus className="mr-2 h-4 w-4" />
              Make Payments
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Select Payment Type</DialogTitle>
              <DialogDescription>
                Choose what you would like to pay for
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 pt-4">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-4 px-4 hover:bg-primary/5 hover:border-primary"
                onClick={() => {
                  setPaymentDialogOpen(false);
                  navigate("/member/pay-contribution?type=contribution");
                }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-foreground">Monthly Contribution</p>
                  <p className="text-sm text-muted-foreground">Pay your monthly group contribution</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-4 px-4 hover:bg-info/5 hover:border-info"
                onClick={() => {
                  setPaymentDialogOpen(false);
                  navigate("/member/pay-contribution?type=loan");
                }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                  <CreditCard className="h-5 w-5 text-info" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-foreground">Loan Payment</p>
                  <p className="text-sm text-muted-foreground">Repay your loan with interest</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-4 px-4 hover:bg-warning/5 hover:border-warning"
                onClick={() => {
                  setPaymentDialogOpen(false);
                  navigate("/member/pay-contribution?type=penalty");
                }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-foreground">Penalty Payment</p>
                  <p className="text-sm text-muted-foreground">Clear your pending penalties</p>
                </div>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        <Link to="/dashboard/loans">
          <Button variant="hero-outline" size="lg" disabled={!seedPaid || sharesOwned === 0}>
            <HandCoins className="mr-2 h-4 w-4" />
            Apply for Loan
          </Button>
        </Link>

        <Dialog open={sharePurchaseDialogOpen} onOpenChange={setSharePurchaseDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="lg">
              <Share2 className="mr-2 h-4 w-4" />
              Purchase Shares
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Purchase Shares</DialogTitle>
              <DialogDescription>
                Increase your loan eligibility by purchasing more shares
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Current shares owned:</span>
                  <span className="font-semibold">{sharesOwned}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Current loan limit:</span>
                  <span className="font-semibold">MWK {loanLimit.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Price per share:</span>
                  <span className="font-semibold">MWK {shareFee.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shares-amount">Number of shares to purchase</Label>
                <Input
                  id="shares-amount"
                  type="number"
                  min="1"
                  value={sharesToPurchase}
                  onChange={(e) => setSharesToPurchase(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>

              <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total cost:</span>
                  <span className="text-lg font-bold text-primary">
                    MWK {(shareFee * sharesToPurchase).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">New total shares:</span>
                  <span className="font-semibold">{sharesOwned + sharesToPurchase}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">New loan limit:</span>
                  <span className="font-semibold text-success">
                    MWK {((sharesOwned + sharesToPurchase) * (groupSettings?.initialLoanAmount || 0)).toLocaleString()}
                  </span>
                </div>
              </div>

              <Button
                variant="hero"
                size="lg"
                className="w-full"
                onClick={handlePurchaseShares}
              >
                Proceed to Payment
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Payment will be processed securely through your chosen payment method
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Loan Repayment Progress */}
      <div className="mb-6">
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-4 w-4 text-info" />
              Loan Repayment Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {loading ? (
              <p className="text-center text-sm text-muted-foreground py-4">Loading loans...</p>
            ) : loanHistory.filter((l) => l.status === "Active").length > 0 ? (
              loanHistory
                .filter((l) => l.status === "Active")
                .map((l) => (
                  <div key={l.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground" title={l.id}>{l.id.length > 8 ? `${l.id.slice(0, 8)}…` : l.id}</p>
                        <p className="text-xs text-muted-foreground">
                          {l.amount} borrowed · Due {l.dueDate}
                        </p>
                      </div>
                      <Badge className="bg-info/10 text-info hover:bg-info/20 border-0">
                        {l.repaid}% repaid
                      </Badge>
                    </div>
                    <Progress value={l.repaid} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Balance: {l.balance}</span>
                      <span>Next: {l.nextPayment}</span>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">
                No active loans
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Contribution History */}
        <Card className="border-0 shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Contribution History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                      Loading contributions...
                    </TableCell>
                  </TableRow>
                ) : contributionHistory.length > 0 ? (
                  contributionHistory.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{c.date}</TableCell>
                      <TableCell>{c.amount}</TableCell>
                      <TableCell className="text-muted-foreground">{c.method}</TableCell>
                      <TableCell>
                        <Badge
                          variant={c.status === "Paid" ? "default" : "destructive"}
                          className={c.status === "Paid" ? "bg-success/10 text-success hover:bg-success/20 border-0" : ""}
                        >
                          {c.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                      No contributions yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-4 w-4" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-sm text-muted-foreground py-4">Loading notifications...</p>
            ) : (
              <div className="space-y-3">
                {recentNotifications.length > 0 ? (
                  recentNotifications.map((n, i) => (
                    <div key={i} className="flex gap-3 rounded-lg bg-muted/50 p-3">
                      <div
                        className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${
                          n.type === "error"
                            ? "bg-destructive"
                            : n.type === "warning"
                            ? "bg-warning"
                            : "bg-info"
                        }`}
                      />
                      <div>
                        <p className="text-sm text-foreground">{n.message}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{n.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    No notifications
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Loan History */}
      <Card className="mt-6 border-0 shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Loan History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loan ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="hidden sm:table-cell">Balance</TableHead>
                <TableHead className="hidden sm:table-cell">Progress</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    Loading loans...
                  </TableCell>
                </TableRow>
              ) : loanHistory.length > 0 ? (
                loanHistory.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium" title={l.id}>{l.id.length > 8 ? `${l.id.slice(0, 8)}…` : l.id}</TableCell>
                    <TableCell>{l.amount}</TableCell>
                    <TableCell className="hidden sm:table-cell">{l.balance}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <Progress value={l.repaid} className="h-1.5 w-16" />
                        <span className="text-xs text-muted-foreground">{l.repaid}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{l.dueDate}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          l.status === "Cleared"
                            ? "bg-success/10 text-success hover:bg-success/20 border-0"
                            : "bg-info/10 text-info hover:bg-info/20 border-0"
                        }
                      >
                        {l.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    No loans yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default MemberDashboard;

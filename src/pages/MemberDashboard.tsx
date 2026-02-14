import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
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
import { Progress } from "@/components/ui/progress";
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
  amount: number;
  balance: number;
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

const MemberDashboard = () => {
  const navigate = useNavigate();
  const storedProfile = useMemo(() => {
    try {
      const raw = localStorage.getItem("unityvault:memberProfile");
      return raw
        ? (JSON.parse(raw) as { fullName?: string; groupId?: string; groupName?: string })
        : {};
    } catch {
      return {};
    }
  }, []);

  const [profile, setProfile] = useState(storedProfile);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(true);
  
  // Data state
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculated values
  const totalContributions = useMemo(() => {
    return contributions
      .filter(c => c.paidAt)
      .reduce((sum, c) => sum + c.amount, 0);
  }, [contributions]);

  const paidContributionsCount = useMemo(() => {
    return contributions.filter(c => c.paidAt).length;
  }, [contributions]);

  const outstandingLoans = useMemo(() => {
    return loans
      .filter(l => l.status === "approved")
      .reduce((sum, l) => sum + l.balance, 0);
  }, [loans]);

  const activeLoansCount = useMemo(() => {
    return loans.filter(l => l.status === "approved" && l.balance > 0).length;
  }, [loans]);

  const pendingPenalties = useMemo(() => {
    return penalties
      .filter(p => !p.isPaid)
      .reduce((sum, p) => sum + p.amount, 0);
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

  // Check if member is fully registered, if not redirect to payment after 5 seconds
  useEffect(() => {
    const checkRegistration = () => {
      const hasProfile = profile?.fullName && profile?.groupId;
      const hasToken = localStorage.getItem("unityvault:token");
      const hasRole = localStorage.getItem("unityvault:role") === "member";

      // If user doesn't have a complete profile or auth, they need to register
      if (!hasProfile || !hasToken || !hasRole) {
        const timer = setTimeout(() => {
          // Get group ID from URL if accessing via group link
          const urlParams = new URLSearchParams(window.location.search);
          const groupId = urlParams.get("groupId");
          
          if (groupId) {
            localStorage.setItem("unityvault:pendingGroupId", groupId);
          }
          
          navigate("/member/registration-fee");
        }, 5000);

        return () => clearTimeout(timer);
      } else {
        setIsCheckingRegistration(false);
      }
    };

    checkRegistration();
  }, [navigate, profile]);

  useEffect(() => {
    if (profile?.fullName && profile?.groupId) return;

    let active = true;
    const load = async () => {
      try {
        const member = await apiRequest<{ fullName: string; groupId: string }>("/members/me");
        const group = await apiRequest<{ name: string }>("/groups/me");
        const next = {
          fullName: member.fullName,
          groupId: member.groupId,
          groupName: group.name,
        };
        if (!active) return;
        setProfile(next);
        localStorage.setItem("unityvault:memberProfile", JSON.stringify(next));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load profile";
        toast.error(message);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [profile]);

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
        setNotifications(notificationsData.items || []);
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

  const displayName = profile.fullName || "Member";
  const groupId = profile.groupId || "GB-8F3K2";
  const groupName = profile.groupName || "Your Group";

  // Format contributions for table display
  const contributionHistory = useMemo(() => {
    return contributions.slice(0, 5).map(c => ({
      date: (c.paidAt || c.createdAt).slice(0, 10),
      amount: `MWK ${c.amount.toLocaleString()}`,
      status: c.paidAt ? "Paid" : "Pending",
      method: "Recorded",
    }));
  }, [contributions]);

  // Format loans for display
  const loanHistory = useMemo(() => {
    return loans.map(l => {
      const repaidPercentage = l.amount > 0 ? Math.round(((l.amount - l.balance) / l.amount) * 100) : 0;
      return {
        id: l.id,
        amount: `MWK ${l.amount.toLocaleString()}`,
        balance: `MWK ${l.balance.toLocaleString()}`,
        repaid: repaidPercentage,
        status: l.balance === 0 ? "Cleared" : l.status === "approved" ? "Active" : "Pending",
        dueDate: l.dueDate ? new Date(l.dueDate).toISOString().slice(0, 10) : "—",
        nextPayment: l.balance > 0 ? `MWK ${Math.ceil(l.balance / 3).toLocaleString()}` : "—",
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
      subtitle={`Welcome back, ${displayName}`}
      groupId={groupId}
      groupName={groupName}
    >
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
          title="Penalties Due"
          value={`MWK ${pendingPenalties.toLocaleString()}`}
          subtitle={`${pendingPenaltiesCount} pending ${pendingPenaltiesCount !== 1 ? 'penalties' : 'penalty'}`}
          icon={AlertTriangle}
          variant="warning"
        />
        <SummaryCard
          title="Total Balance"
          value={`MWK ${totalBalance.toLocaleString()}`}
          subtitle="Net after loans & penalties"
          icon={PiggyBank}
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8 flex flex-wrap gap-3">
        <Link to="/member/pay-contribution">
          <Button variant="hero" size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Pay Contribution
          </Button>
        </Link>
        <Link to="/dashboard/loans">
          <Button variant="hero-outline" size="lg">
            <HandCoins className="mr-2 h-4 w-4" />
            Apply for Loan
          </Button>
        </Link>
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
                        <p className="text-sm font-medium text-foreground">{l.id}</p>
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contribution History */}
        <Card className="border-0 shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Contribution History</CardTitle>
          </CardHeader>
          <CardContent>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loan ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Progress</TableHead>
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
                    <TableCell className="font-medium">{l.id}</TableCell>
                    <TableCell>{l.amount}</TableCell>
                    <TableCell>{l.balance}</TableCell>
                    <TableCell>
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
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default MemberDashboard;

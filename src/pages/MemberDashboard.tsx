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

const contributions = [
  { date: "2026-02-01", amount: "MWK 50,000", status: "Paid", method: "Mobile Money" },
  { date: "2026-01-01", amount: "MWK 50,000", status: "Paid", method: "Bank Transfer" },
  { date: "2025-12-01", amount: "MWK 50,000", status: "Paid", method: "Mobile Money" },
  { date: "2025-11-01", amount: "MWK 50,000", status: "Late", method: "Mobile Money" },
  { date: "2025-10-01", amount: "MWK 50,000", status: "Paid", method: "Cash" },
];

const loans = [
  { id: "LN-001", amount: "MWK 200,000", balance: "MWK 80,000", repaid: 60, status: "Active", dueDate: "2026-03-15", nextPayment: "MWK 40,000" },
  { id: "LN-002", amount: "MWK 150,000", balance: "MWK 0", repaid: 100, status: "Cleared", dueDate: "2025-09-30", nextPayment: "—" },
];

const notifications = [
  { message: "Monthly contribution due on Feb 28", type: "info", time: "2 days ago" },
  { message: "Loan repayment of MWK 40,000 due Mar 15", type: "warning", time: "5 days ago" },
  { message: "Late penalty of MWK 5,000 applied for Nov", type: "error", time: "1 week ago" },
  { message: "Group meeting scheduled for Mar 1", type: "info", time: "1 week ago" },
];

const upcomingPayments = [
  { label: "Monthly Contribution", amount: "MWK 50,000", dueDate: "Feb 28, 2026", daysLeft: 21 },
  { label: "Loan Repayment (LN-001)", amount: "MWK 40,000", dueDate: "Mar 15, 2026", daysLeft: 36 },
];

const MemberDashboard = () => {
  return (
    <DashboardLayout
      title="My Dashboard"
      subtitle="Welcome back, John"
      groupId="GB-8F3K2"
      groupName="Umoja Savings Group"
    >
      {/* Summary Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="My Contributions"
          value="MWK 250,000"
          subtitle="5 of 12 months paid"
          icon={Wallet}
          variant="primary"
          trend={{ value: "On track", positive: true }}
        />
        <SummaryCard
          title="Outstanding Loans"
          value="MWK 80,000"
          subtitle="1 active loan"
          icon={CreditCard}
          variant="info"
        />
        <SummaryCard
          title="Penalties Due"
          value="MWK 5,000"
          subtitle="1 pending penalty"
          icon={AlertTriangle}
          variant="warning"
        />
        <SummaryCard
          title="Total Balance"
          value="MWK 165,000"
          subtitle="Net after loans & penalties"
          icon={PiggyBank}
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8 flex flex-wrap gap-3">
        <Button variant="hero" size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Pay Contribution
        </Button>
        <Button variant="hero-outline" size="lg">
          <HandCoins className="mr-2 h-4 w-4" />
          Apply for Loan
        </Button>
      </div>

      {/* Upcoming Payments + Loan Progress */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Upcoming Payments */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarClock className="h-4 w-4 text-primary" />
              Upcoming Payments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingPayments.map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border bg-muted/30 p-4"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{p.label}</p>
                  <p className="text-xs text-muted-foreground">Due {p.dueDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{p.amount}</p>
                  <p className={`text-xs font-medium ${p.daysLeft <= 7 ? "text-destructive" : "text-muted-foreground"}`}>
                    {p.daysLeft} days left
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Loan Repayment Progress */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-4 w-4 text-info" />
              Loan Repayment Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {loans
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
              ))}
            {loans.filter((l) => l.status === "Active").length === 0 && (
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
                {contributions.map((c, i) => (
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
                ))}
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
            <div className="space-y-3">
              {notifications.map((n, i) => (
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
              ))}
            </div>
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
              {loans.map((l) => (
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default MemberDashboard;

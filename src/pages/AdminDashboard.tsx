import { useState } from "react";
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
} from "lucide-react";

const members = [
  { name: "Alice Namukasa", phone: "+256 701 234 567", status: "Active", contributions: "UGX 300,000", loans: "UGX 0", joined: "2025-01-15" },
  { name: "Robert Ochieng", phone: "+256 702 345 678", status: "Active", contributions: "UGX 250,000", loans: "UGX 100,000", joined: "2025-01-20" },
  { name: "Grace Atim", phone: "+256 703 456 789", status: "Pending", contributions: "UGX 0", loans: "UGX 0", joined: "2026-02-01" },
  { name: "David Mukiibi", phone: "+256 704 567 890", status: "Active", contributions: "UGX 200,000", loans: "UGX 50,000", joined: "2025-02-10" },
  { name: "Faith Nabukeera", phone: "+256 705 678 901", status: "Active", contributions: "UGX 280,000", loans: "UGX 0", joined: "2025-01-18" },
];

const loanRequests = [
  { member: "Robert Ochieng", amount: "UGX 300,000", purpose: "School fees", date: "2026-02-03", status: "Pending" },
  { member: "Alice Namukasa", amount: "UGX 150,000", purpose: "Medical", date: "2026-01-28", status: "Approved" },
  { member: "David Mukiibi", amount: "UGX 200,000", purpose: "Business stock", date: "2026-01-15", status: "Disbursed" },
];

const missedPayments = [
  { member: "Robert Ochieng", type: "Contribution", amount: "UGX 50,000", dueDate: "2026-01-01", penalty: "UGX 5,000" },
  { member: "David Mukiibi", type: "Loan Repayment", amount: "UGX 40,000", dueDate: "2026-01-15", penalty: "UGX 2,000" },
];

const AdminDashboard = () => {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyInvite = () => {
    navigator.clipboard.writeText("https://groupfund.app/join/GB-8F3K2");
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <DashboardLayout
      title="Group Admin"
      subtitle="Manage your group"
      isAdmin
      groupId="GB-8F3K2"
      groupName="Umoja Savings Group"
    >
      {/* Group Info Banner */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Umoja Savings Group</p>
            <p className="font-mono text-xs tracking-wider text-muted-foreground">GB-8F3K2</p>
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
          value="24"
          subtitle="4 pending approval"
          icon={Users}
          variant="primary"
        />
        <SummaryCard
          title="Total Contributions"
          value="MWK 6,200,000"
          subtitle="This cycle"
          icon={Wallet}
          trend={{ value: "+12% from last month", positive: true }}
        />
        <SummaryCard
          title="Active Loans"
          value="MWK 2,800,000"
          subtitle="8 active loans"
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
                <Button variant="hero" size="sm">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
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
                  {members.map((m) => (
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
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-success">
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button variant="ghost" size="sm" className="text-muted-foreground">
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                            View
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loan Requests Tab */}
        <TabsContent value="loans">
          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Loan Applications</CardTitle>
            </CardHeader>
            <CardContent>
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
                  {loanRequests.map((l, i) => (
                    <TableRow key={i}>
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
                            <Button variant="default" size="sm">
                              Approve
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive">
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <Button variant="ghost" size="sm" className="text-muted-foreground">
                            Details
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
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
                  {missedPayments.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{p.member}</TableCell>
                      <TableCell>{p.type}</TableCell>
                      <TableCell>{p.amount}</TableCell>
                      <TableCell className="text-muted-foreground">{p.dueDate}</TableCell>
                      <TableCell>
                        <span className="font-medium text-destructive">{p.penalty}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-muted-foreground">
                          Notify
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                  <Button variant="outline" size="sm">
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
                  { label: "Monthly Amount", desc: "Required contribution per member", val: "UGX 50,000" },
                  { label: "Due Date", desc: "Monthly payment deadline", val: "1st of month" },
                  { label: "Grace Period", desc: "Days after due date", val: "7 days" },
                ].map((rule) => (
                  <div key={rule.label} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{rule.label}</p>
                      <p className="text-xs text-muted-foreground">{rule.desc}</p>
                    </div>
                    <span className="font-semibold text-foreground">{rule.val}</span>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
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
                  { label: "Late Payment", desc: "After grace period expires", val: "UGX 5,000" },
                  { label: "Missed Meeting", desc: "Per unexcused absence", val: "UGX 2,000" },
                  { label: "Loan Default", desc: "Per month overdue", val: "5% of balance" },
                ].map((rule) => (
                  <div key={rule.label} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{rule.label}</p>
                      <p className="text-xs text-muted-foreground">{rule.desc}</p>
                    </div>
                    <span className="font-semibold text-foreground">{rule.val}</span>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
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

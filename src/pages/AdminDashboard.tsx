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
import { apiRequest } from "@/lib/api";
import { toast } from "@/components/ui/sonner";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [copiedLink, setCopiedLink] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [loanRequests, setLoanRequests] = useState<any[]>([]);
  const [missedPayments, setMissedPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalMembers, setTotalMembers] = useState("0");
  const [totalContributions, setTotalContributions] = useState("MWK 0");
  const [activeLoans, setActiveLoans] = useState("MWK 0");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        // Load members
        const memberData = await apiRequest<{ items: any[] }>("/members");
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
        const loanData = await apiRequest<{ items: any[] }>("/loans");
        if (active) {
          const memberMap = new Map(memberData.items.map((m: any) => [m.id, m.fullName]));
          const loansMapped = loanData.items
            .filter((l: any) => l.status === "pending" || l.status === "approved")
            .slice(0, 3)
            .map((l: any) => ({
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
        const penaltyData = await apiRequest<{ items: any[] }>("/penalties");
        if (active) {
          const memberMap = new Map(memberData.items.map((m: any) => [m.id, m.fullName]));
          const penaltiesMapped = penaltyData.items.slice(0, 3).map((p: any) => ({
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
        const activeCount = memberData.items.filter((m: any) => m.status === "active").length;
        const contribTotal = memberData.items.length * 50000; // Simple estimation
        const loansTotal = loanData.items.reduce((sum: number, l: any) => sum + (l.totalDue || 0), 0);

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

        {/* Loan Requests Tab */}
        <TabsContent value="loans">
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
                    desc: "Applied when a contribution is late",
                    val: storedRules.penaltyMonthlyMiss
                      ? `MWK ${storedRules.penaltyMonthlyMiss}`
                      : "Not set",
                  },
                  {
                    label: "Missed Loan Payment",
                    desc: "Applied when loan repayment is late",
                    val: storedRules.penaltyLoanMiss
                      ? `MWK ${storedRules.penaltyLoanMiss}`
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

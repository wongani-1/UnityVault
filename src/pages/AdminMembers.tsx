import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserPlus, CheckCircle, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { toast } from "@/components/ui/sonner";

type Member = {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  username: string;
  status: "pending" | "active" | "rejected";
  createdAt: string;
  balance?: number;
  penaltiesTotal?: number;
};

type Contribution = {
  id: string;
  memberId: string;
  amount: number;
  month: string;
  createdAt: string;
};

type Loan = {
  id: string;
  memberId: string;
  principal: number;
  totalDue: number;
  status: "pending" | "approved" | "rejected" | "closed";
  createdAt: string;
};

type Penalty = {
  id: string;
  memberId: string;
  amount: number;
  reason: string;
  createdAt: string;
  resolved: boolean;
};

type InviteInfo = {
  otp: string;
  link: string;
  expiresAt: string;
  token: string;
};

const AdminMembers = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    username: "",
  });


  const loadMembers = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<{ items: Member[] }>("/members");
      setMembers(data.items);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load members";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddMember = async () => {
    if (!form.fullName || !form.username) {
      toast.error("Full name and username are required.");
      return;
    }
    if (!form.email && !form.phone) {
      toast.error("Email or phone is required for the invite.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await apiRequest<{ invite: InviteInfo }>("/members/invite", {
        method: "POST",
        body: {
          fullName: form.fullName,
          username: form.username,
          email: form.email || undefined,
          phone: form.phone || undefined,
        },
      });
      setInviteInfo(result.invite);
      toast.success("Invite generated (mock delivery)");
      setForm({ fullName: "", email: "", phone: "", username: "" });
      await loadMembers();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add member";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (memberId: string) => {
    try {
      await apiRequest(`/members/${memberId}/approve`, { method: "POST" });
      toast.success("Member approved");
      await loadMembers();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to approve member";
      toast.error(message);
    }
  };

  const handleReject = async (memberId: string) => {
    try {
      await apiRequest(`/members/${memberId}/reject`, { method: "POST" });
      toast.success("Member rejected");
      await loadMembers();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reject member";
      toast.error(message);
    }
  };

  const formatCurrency = (value: number) => `MWK ${value.toLocaleString()}`;

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setInviteInfo(null);
  };

  const handleViewDetails = async (member: Member) => {
    setSelectedMember(member);
    setDetailsOpen(true);
    setDetailsLoading(true);
    try {
      const [contribData, loanData, penaltyData] = await Promise.all([
        apiRequest<{ items: Contribution[] }>("/contributions"),
        apiRequest<{ items: Loan[] }>("/loans"),
        apiRequest<{ items: Penalty[] }>("/penalties"),
      ]);

      setContributions(contribData.items.filter((item) => item.memberId === member.id));
      setLoans(loanData.items.filter((item) => item.memberId === member.id));
      setPenalties(penaltyData.items.filter((item) => item.memberId === member.id));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load member details";
      toast.error(message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const inviteLink = inviteInfo
    ? `${window.location.origin}/member/activate?token=${inviteInfo.token}`
    : "";

  return (
    <DashboardLayout title="Members" subtitle="Approve and manage group members" isAdmin>
      <Card className="border-0 shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Member Directory</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button variant="hero" size="sm">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Member</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="member-fullName">Full name</Label>
                  <Input
                    id="member-fullName"
                    value={form.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    placeholder="Member name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member-username">Username</Label>
                  <Input
                    id="member-username"
                    value={form.username}
                    onChange={(e) => updateField("username", e.target.value)}
                    placeholder="Username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member-email">Email</Label>
                  <Input
                    id="member-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="member@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member-phone">Phone</Label>
                  <Input
                    id="member-phone"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="+256 700 000 000"
                  />
                </div>
                {inviteInfo && (
                  <div className="rounded-lg border bg-secondary/30 p-3 text-sm">
                    <p className="font-semibold text-foreground">Mock delivery</p>
                    <p className="text-muted-foreground">Share this link and OTP with the member.</p>
                    <div className="mt-2 space-y-1">
                      <p>
                        <span className="font-medium">Link:</span>{" "}
                        <a
                          href={inviteLink || inviteInfo.link}
                          className="text-primary underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {inviteLink || inviteInfo.link}
                        </a>
                      </p>
                      <p>
                        <span className="font-medium">OTP:</span> {inviteInfo.otp}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Expires: {new Date(inviteInfo.expiresAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="hero" onClick={handleAddMember} disabled={submitting}>
                    {submitting ? "Adding..." : "Add Member"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading && (
            <p className="text-sm text-muted-foreground">Loading members...</p>
          )}
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
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.fullName}</TableCell>
                  <TableCell className="text-muted-foreground">{member.phone || "-"}</TableCell>
                  <TableCell>MWK 0</TableCell>
                  <TableCell>MWK 0</TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.createdAt.slice(0, 10)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        member.status === "active"
                          ? "bg-success/10 text-success hover:bg-success/20 border-0"
                          : member.status === "pending"
                          ? "bg-warning/10 text-warning hover:bg-warning/20 border-0"
                          : "bg-destructive/10 text-destructive hover:bg-destructive/20 border-0"
                      }
                    >
                      {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {member.status === "pending" ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-success"
                          onClick={() => handleApprove(member.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleReject(member.id)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        onClick={() => handleViewDetails(member)}
                      >
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

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Member Details</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Name</p>
                  <p className="text-sm font-semibold text-foreground">{selectedMember.fullName}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Username</p>
                  <p className="text-sm font-semibold text-foreground">{selectedMember.username}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Email</p>
                  <p className="text-sm font-semibold text-foreground">{selectedMember.email || "-"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Phone</p>
                  <p className="text-sm font-semibold text-foreground">{selectedMember.phone || "-"}</p>
                </div>
              </div>

              {detailsLoading ? (
                <p className="text-sm text-muted-foreground">Loading contributions, loans, and penalties...</p>
              ) : (
                <div className="space-y-6">
                  <div className="rounded-lg border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold">Contributions</p>
                      <p className="text-sm text-muted-foreground">
                        Total: {formatCurrency(contributions.reduce((sum, item) => sum + item.amount, 0))}
                      </p>
                    </div>
                    {contributions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No contributions recorded.</p>
                    ) : (
                      <div className="space-y-2">
                        {contributions.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{item.month}</span>
                            <span className="font-medium text-foreground">{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold">Loans</p>
                      <p className="text-sm text-muted-foreground">
                        Outstanding: {formatCurrency(
                          loans
                            .filter((loan) => loan.status !== "closed" && loan.status !== "rejected")
                            .reduce((sum, loan) => sum + (loan.totalDue || 0), 0)
                        )}
                      </p>
                    </div>
                    {loans.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No loans recorded.</p>
                    ) : (
                      <div className="space-y-2">
                        {loans.map((loan) => (
                          <div key={loan.id} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {loan.createdAt.slice(0, 10)} • {loan.status}
                            </span>
                            <span className="font-medium text-foreground">{formatCurrency(loan.totalDue)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold">Penalties</p>
                      <p className="text-sm text-muted-foreground">
                        Total: {formatCurrency(penalties.reduce((sum, item) => sum + item.amount, 0))}
                      </p>
                    </div>
                    {penalties.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No penalties recorded.</p>
                    ) : (
                      <div className="space-y-2">
                        {penalties.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {item.reason} • {item.resolved ? "Resolved" : "Open"}
                            </span>
                            <span className="font-medium text-foreground">{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminMembers;

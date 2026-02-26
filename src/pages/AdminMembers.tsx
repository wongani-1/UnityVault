import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, UserPlus } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { isValidEmail, isValidPhone } from "@/lib/contactValidation";
import { toast } from "@/components/ui/sonner";

type Member = {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
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
  balance: number;
  status: "pending" | "approved" | "active" | "rejected" | "completed";
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

type InviteMemberResponse = {
  member: Member;
  invite: {
    otp: string;
    link: string;
    expiresAt: string;
    token: string;
  };
  emailDelivery?: {
    attempted: boolean;
    sent: boolean;
    error?: string;
  };
};

const AdminMembers = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [subscriptionPaid, setSubscriptionPaid] = useState(false);
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState<string | null>(null);
  const [subscriptionPlanName, setSubscriptionPlanName] = useState("Starter");
  const [subscriptionMemberLimit, setSubscriptionMemberLimit] = useState<number | null>(null);
  const [subscriptionMemberCount, setSubscriptionMemberCount] = useState(0);
  const [canAddMembers, setCanAddMembers] = useState(false);
  const [subscriptionTrialActive, setSubscriptionTrialActive] = useState(false);
  const [subscriptionTrialEndsAt, setSubscriptionTrialEndsAt] = useState<string | null>(null);
  const [subscriptionTrialDaysRemaining, setSubscriptionTrialDaysRemaining] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [allLoans, setAllLoans] = useState<Loan[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [cycleLocked, setCycleLocked] = useState(false);
  const [cycleYear, setCycleYear] = useState<number | null>(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });


  const loadMembers = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<{ items: Member[] }>("/members");
      setMembers(data.items);
      
      // Load all loans to calculate outstanding loans per member
      const loanData = await apiRequest<{ items: Loan[] }>("/loans");
      setAllLoans(loanData.items);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load members";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate outstanding loans for a specific member
  const getOutstandingLoans = (memberId: string): number => {
    return allLoans
      .filter((loan) => loan.memberId === memberId && (loan.status === "active" || loan.status === "approved"))
      .reduce((sum, loan) => sum + (loan.balance || 0), 0);
  };

  useEffect(() => {
    loadMembers();
    checkSubscription();
    checkCycleLock();
  }, []);

  const checkCycleLock = async () => {
    try {
      const data = await apiRequest<{
        items: Array<{ year: number; status: "pending" | "completed" | "cancelled" }>;
      }>("/distributions");
      const currentYear = new Date().getFullYear();
      const completed = data.items.find(
        (item) => item.year === currentYear && item.status === "completed"
      );
      setCycleLocked(Boolean(completed));
      setCycleYear(completed ? completed.year : null);
    } catch {
      setCycleLocked(false);
      setCycleYear(null);
    }
  };

  const checkSubscription = async () => {
    try {
      const data = await apiRequest<{ 
        subscriptionPaid: boolean;
        isActive: boolean;
        subscriptionExpiresAt?: string;
        planName?: string;
        memberLimit?: number | null;
        memberCount?: number;
        canAddMembers?: boolean;
        isTrialActive?: boolean;
        trialEndsAt?: string;
        trialDaysRemaining?: number;
      }>("/admins/me/subscription-status");
      setSubscriptionPaid(data.subscriptionPaid);
      setSubscriptionActive(data.isActive);
      setSubscriptionExpiresAt(data.subscriptionExpiresAt || null);
      setSubscriptionPlanName(data.planName || "Starter");
      setSubscriptionMemberLimit(data.memberLimit ?? null);
      setSubscriptionMemberCount(data.memberCount || 0);
      setCanAddMembers(Boolean(data.canAddMembers));
      setSubscriptionTrialActive(Boolean(data.isTrialActive));
      setSubscriptionTrialEndsAt(data.trialEndsAt || null);
      setSubscriptionTrialDaysRemaining(data.trialDaysRemaining || 0);
      return data;
    } catch (error) {
      console.error("Failed to check subscription status:", error);
      return null;
    }
  };

  const handleAddMemberClick = async () => {
    if (cycleLocked) {
      toast.error("Cycle is closed. You can only view members until the next cycle starts.");
      return;
    }

    const status = await checkSubscription();
    if (!status || !status.isActive || !status.canAddMembers) {
      setSubscriptionDialogOpen(true);
    } else {
      setDialogOpen(true);
    }
  };

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddMember = async () => {
    if (cycleLocked) {
      toast.error("Cycle is closed. New members cannot be added right now.");
      return;
    }

    if (!form.first_name || !form.last_name) {
      toast.error("First name and last name are required.");
      return;
    }
    if (!form.email && !form.phone) {
      toast.error("Email or phone is required for the invite.");
      return;
    }

    if (form.email && !isValidEmail(form.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (form.phone && !isValidPhone(form.phone)) {
      toast.error("Please enter a valid phone number.");
      return;
    }

    setSubmitting(true);
    try {
      const inviteResult = await apiRequest<InviteMemberResponse>("/members/invite", {
        method: "POST",
        body: {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email || undefined,
          phone: form.phone || undefined,
        },
      });
      if (inviteResult.emailDelivery?.attempted && !inviteResult.emailDelivery.sent) {
        toast.info(
          inviteResult.emailDelivery.error
            ? `Member added, but email was not sent: ${inviteResult.emailDelivery.error}`
            : "Member added, but invitation email was not sent. Check server email configuration."
        );
      } else if (!inviteResult.emailDelivery?.attempted) {
        toast.success("Member invited successfully. No email was sent because no email address was provided.");
      } else {
        toast.success("Member invited successfully and activation email sent.");
      }
      setForm({ first_name: "", last_name: "", email: "", phone: "" });
      await loadMembers();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add member";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => `MWK ${value.toLocaleString()}`;

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
  };

  const trialExpired = !subscriptionActive && !subscriptionPaid && Boolean(subscriptionTrialEndsAt);
  const blockedByPlanLimit = subscriptionActive && !canAddMembers;

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



  return (
    <DashboardLayout title="Members" subtitle="Manage group members" isAdmin>
      {cycleLocked && (
        <Card className="mb-6 border-warning/30 bg-warning/10 shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-warning" />
              <div>
                <p className="text-sm font-semibold text-foreground">Read-only mode</p>
                <p className="text-xs text-muted-foreground">
                  Cycle {cycleYear ?? new Date().getFullYear()} is closed. Adding members is disabled.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-card">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-lg">Member Directory</CardTitle>
          <Button variant="hero" size="sm" onClick={handleAddMemberClick} disabled={cycleLocked}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </CardHeader>
        <CardContent>
          {loading && (
            <p className="text-sm text-muted-foreground">Loading members...</p>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Phone</TableHead>
                <TableHead>Contributions</TableHead>
                <TableHead>Outstanding Loans</TableHead>
                <TableHead className="hidden sm:table-cell">Penalties</TableHead>
                <TableHead className="hidden sm:table-cell">Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.first_name} {member.last_name}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">{member.phone || "-"}</TableCell>
                  <TableCell>MWK {(member.balance || 0).toLocaleString()}</TableCell>
                  <TableCell>MWK {getOutstandingLoans(member.id).toLocaleString()}</TableCell>
                  <TableCell className="hidden sm:table-cell">MWK {(member.penaltiesTotal || 0).toLocaleString()}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                      onClick={() => handleViewDetails(member)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="member-firstName">First name</Label>
              <Input
                id="member-firstName"
                value={form.first_name}
                onChange={(e) => updateField("first_name", e.target.value)}
                placeholder="First name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-lastName">Last name</Label>
              <Input
                id="member-lastName"
                value={form.last_name}
                onChange={(e) => updateField("last_name", e.target.value)}
                placeholder="Last name"
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
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="+265 XXX XXX XXX"
              />
            </div>
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

      {/* Subscription Payment Dialog */}
      <Dialog open={subscriptionDialogOpen} onOpenChange={setSubscriptionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {blockedByPlanLimit
                ? "Plan Limit Reached"
                : trialExpired
                ? "Starter Trial Ended"
                : subscriptionPaid
                ? "Subscription Expired"
                : "Subscription Required"}
            </DialogTitle>
            <DialogDescription>
              {blockedByPlanLimit
                ? "Your current plan member limit has been reached. Upgrade to continue adding members."
                : trialExpired
                ? "Your 14-day Starter trial has ended. Choose a paid plan to keep adding members."
                : subscriptionPaid
                ? "Your monthly subscription has expired. Renew to continue adding members to your group."
                : "Choose a subscription plan to continue adding members to your group."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-xl font-bold text-primary sm:text-2xl">{subscriptionPlanName} Plan</p>
              <p className="text-sm text-muted-foreground">
                {subscriptionMemberLimit === null
                  ? `${subscriptionMemberCount} members (no limit)`
                  : `${subscriptionMemberCount}/${subscriptionMemberLimit} members used`}
              </p>
              {subscriptionTrialActive && subscriptionTrialEndsAt && (
                <p className="text-xs text-muted-foreground mt-2">
                  Starter trial ends on {new Date(subscriptionTrialEndsAt).toLocaleDateString()} ({subscriptionTrialDaysRemaining} day{subscriptionTrialDaysRemaining === 1 ? "" : "s"} remaining)
                </p>
              )}
              {subscriptionExpiresAt && (
                <p className="text-xs text-muted-foreground mt-2">
                  {subscriptionActive ? "Valid" : "Expired"}: {new Date(subscriptionExpiresAt).toLocaleDateString()}
                </p>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {trialExpired
                ? "Trial access has ended. Choose a plan to continue managing member invites."
                : blockedByPlanLimit
                ? "Upgrade your plan to increase the member limit for your group."
                : "Choose or renew a subscription plan to keep managing your group."}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setSubscriptionDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="hero" 
                onClick={() => {
                  setSubscriptionDialogOpen(false);
                  navigate("/admin/subscription-fee");
                }}
              >
                {blockedByPlanLimit || subscriptionPaid ? "Renew / Upgrade Plan" : "Choose Plan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Member Details</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Name</p>
                  <p className="text-sm font-semibold text-foreground">{selectedMember.first_name} {selectedMember.last_name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Email</p>
                  <p className="text-sm font-semibold text-foreground">{selectedMember.email || "N/A"}</p>
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
                            .filter((loan) => loan.status === "active" || loan.status === "approved")
                            .reduce((sum, loan) => sum + (loan.balance || 0), 0)
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
                            <span className="font-medium text-foreground">
                              {formatCurrency(loan.balance || 0)} / {formatCurrency(loan.totalDue || 0)}
                            </span>
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

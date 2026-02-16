import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { apiRequest } from "../lib/api";
import { toast } from "@/components/ui/sonner";
import { Monitor, Smartphone, LogOut, Download } from "lucide-react";

type Session = {
  id: string;
  deviceName: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastActivityAt: string;
  isActive: boolean;
};

const AdminSettings = () => {
  const [form, setForm] = useState({
    shareFee: "",
    monthlyContribution: "",
    initialLoanAmount: "",
    loanInterestPercent: "",
    penaltyMonthlyMiss: "",
    penaltyLoanMiss: "",
    seedAmount: "",
  });
  const [status, setStatus] = useState<"idle" | "saved">("idle");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await apiRequest<{
          contributionAmount: number;
          loanInterestRate: number;
          penaltyRate: number;
          contributionPenaltyRate: number;
          compulsoryInterestRate: number;
        }>("/groups/settings");

        if (!active) return;
        setForm({
          shareFee: "",
          monthlyContribution: String(data.contributionAmount ?? ""),
          initialLoanAmount: "",
          loanInterestPercent: String((data.loanInterestRate || 0) * 100),
          penaltyMonthlyMiss: String((data.contributionPenaltyRate || 0) * 100),
          penaltyLoanMiss: String((data.penaltyRate || 0) * 100),
          seedAmount: "",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load settings";
        setError(message);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const updateField = (field: keyof typeof form, value: string) => {
    setStatus("idle");
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const numbers = Object.values(form).map((value) => Number(value));
    const invalid = numbers.some((value) => Number.isNaN(value) || value < 0);
    if (invalid) {
      setError("All values must be valid non-negative numbers.");
      return;
    }

    setError(null);
    try {
      await apiRequest("/groups/settings", {
        method: "PUT",
        body: {
          contributionAmount: Number(form.monthlyContribution || 0),
          loanInterestRate: Number(form.loanInterestPercent || 0) / 100,
          penaltyRate: Number(form.penaltyLoanMiss || 0) / 100,
          contributionPenaltyRate: Number(form.penaltyMonthlyMiss || 0) / 100,
          compulsoryInterestRate: 0.01,
        },
      });
      localStorage.setItem("unityvault:groupRules", JSON.stringify(form));
      setStatus("saved");
      toast.success("Settings saved");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save settings";
      setError(message);
      toast.error(message);
    }
  };

  const handleReset = () => {
    setStatus("idle");
    setError(null);
  };

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const data = await apiRequest<Session[]>("/sessions");
      setSessions(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load sessions";
      toast.error(message);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await apiRequest(`/sessions/${sessionId}`, { method: "DELETE" });
      toast.success("Session logged out");
      loadSessions();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to revoke session";
      toast.error(message);
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      await apiRequest("/sessions/revoke-all", { method: "POST" });
      toast.success("All other sessions logged out");
      loadSessions();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to revoke sessions";
      toast.error(message);
    }
  };

  const handleExportGroupData = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:4000/api"}/export/group-data`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("unityvault:token")}` },
        }
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `group-data-${new Date().toISOString().split("T")[0]}.pdf`;
      a.click();
      toast.success("Group data exported successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to export data";
      toast.error(message);
    }
  };

  const handleExportMembers = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:4000/api"}/export/members`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("unityvault:token")}` },
        }
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `members-list-${new Date().toISOString().split("T")[0]}.pdf`;
      a.click();
      toast.success("Members list exported successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to export members";
      toast.error(message);
    }
  };

  return (
    <DashboardLayout title="Settings" subtitle="Manage group rules and fees" isAdmin>
      <div className="space-y-6">
        <Card className="border-0 shadow-card">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg">Group Rules</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              Reset
            </Button>
            <Button variant="hero" size="sm" onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {loading && (
            <p className="text-sm text-muted-foreground md:col-span-2">Loading settings...</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="share-fee">Share Fee (MWK)</Label>
            <Input
              id="share-fee"
              type="number"
              min="0"
              step="1"
              value={form.shareFee}
              onChange={(e) => updateField("shareFee", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">One-time fee per member.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthly-contribution">Monthly Contribution (MWK)</Label>
            <Input
              id="monthly-contribution"
              type="number"
              min="0"
              step="1"
              value={form.monthlyContribution}
              onChange={(e) => updateField("monthlyContribution", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Required monthly savings amount.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="initial-loan">Initial Loan Amount (MWK)</Label>
            <Input
              id="initial-loan"
              type="number"
              min="0"
              step="1"
              value={form.initialLoanAmount}
              onChange={(e) => updateField("initialLoanAmount", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Default loan cap for new members.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="loan-interest">Loan Interest (%)</Label>
            <Input
              id="loan-interest"
              type="number"
              min="0"
              step="0.1"
              value={form.loanInterestPercent}
              onChange={(e) => updateField("loanInterestPercent", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Monthly interest rate.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="penalty-contribution">Penalty: Missed Contribution (%)</Label>
            <Input
              id="penalty-contribution"
              type="number"
              min="0"
              step="0.1"
              value={form.penaltyMonthlyMiss}
              onChange={(e) => updateField("penaltyMonthlyMiss", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Percentage of the missed contribution amount.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="penalty-loan">Penalty: Missed Loan Payment (%)</Label>
            <Input
              id="penalty-loan"
              type="number"
              min="0"
              step="0.1"
              value={form.penaltyLoanMiss}
              onChange={(e) => updateField("penaltyLoanMiss", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Percentage of the missed loan payment amount.</p>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="seed-amount">Initial Seed Amount (MWK)</Label>
            <Input
              id="seed-amount"
              type="number"
              min="0"
              step="1"
              value={form.seedAmount}
              onChange={(e) => updateField("seedAmount", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Opening balance to start the group fund.</p>
          </div>

          {error && (
            <p className="text-sm text-destructive md:col-span-2">{error}</p>
          )}

          {status === "saved" && (
            <p className="text-sm font-medium text-success md:col-span-2">
              Changes saved.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-card">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg">Active Sessions</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadSessions}>
              Refresh
            </Button>
            <Button variant="destructive" size="sm" onClick={handleRevokeAllSessions}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout All Devices
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingSessions && (
            <p className="text-sm text-muted-foreground">Loading sessions...</p>
          )}
          {!loadingSessions && sessions.length === 0 && (
            <p className="text-sm text-muted-foreground">No active sessions found. Click Refresh to load.</p>
          )}
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-3">
                  {session.deviceName.toLowerCase().includes("mobile") ? (
                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Monitor className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{session.deviceName}</p>
                    <p className="text-xs text-muted-foreground">{session.ipAddress}</p>
                    <p className="text-xs text-muted-foreground">
                      Last active: {new Date(session.lastActivityAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRevokeSession(session.id)}
                >
                  Logout
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Export Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Download group data and member lists for record keeping and analysis.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExportGroupData}>
              <Download className="mr-2 h-4 w-4" />
              Export Group Data (PDF)
            </Button>
            <Button variant="outline" onClick={handleExportMembers}>
              <Download className="mr-2 h-4 w-4" />
              Export Members List (PDF)
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminSettings;

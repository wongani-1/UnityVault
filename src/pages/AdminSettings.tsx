import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { apiRequest } from "../lib/api";
import { toast } from "@/components/ui/sonner";

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

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await apiRequest<{
          contributionAmount: number;
          loanInterestRate: number;
          penaltyRate: number;
          compulsoryInterestRate: number;
        }>("/groups/settings");

        if (!active) return;
        setForm({
          shareFee: "",
          monthlyContribution: String(data.contributionAmount ?? ""),
          initialLoanAmount: "",
          loanInterestPercent: String((data.loanInterestRate || 0) * 100),
          penaltyMonthlyMiss: "",
          penaltyLoanMiss: String(Math.round((data.penaltyRate || 0) * 100000)),
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
          penaltyRate: Number(form.penaltyLoanMiss || 0) / 100000,
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

  return (
    <DashboardLayout title="Settings" subtitle="Manage group rules and fees" isAdmin>
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
            <Label htmlFor="penalty-contribution">Penalty: Missed Contribution (MWK)</Label>
            <Input
              id="penalty-contribution"
              type="number"
              min="0"
              step="1"
              value={form.penaltyMonthlyMiss}
              onChange={(e) => updateField("penaltyMonthlyMiss", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Applied when a contribution is late.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="penalty-loan">Penalty: Missed Loan Payment (MWK)</Label>
            <Input
              id="penalty-loan"
              type="number"
              min="0"
              step="1"
              value={form.penaltyLoanMiss}
              onChange={(e) => updateField("penaltyLoanMiss", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Applied when repayment is late.</p>
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
    </DashboardLayout>
  );
};

export default AdminSettings;

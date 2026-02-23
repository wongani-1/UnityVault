import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { toast } from "@/components/ui/sonner";

const AdminGroupSetup = () => {
  const location = useLocation();
  const [form, setForm] = useState({
    shareFee: "",
    monthlyContribution: "",
    initialLoanAmount: "",
    loanInterestPercent: "",
    penaltyMonthlyMiss: "",
    penaltyLoanMiss: "",
    seedAmount: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const state = location.state as { groupCreated?: boolean } | null;
    if (state?.groupCreated) {
      toast.success("Group created successfully");
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const updateField = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSaveRules = () => {
    const hasEmpty = Object.values(form).some((value) => value.trim().length === 0);
    setFormError(hasEmpty ? "All fields are required." : null);
    if (hasEmpty) return;

    localStorage.setItem("unityvault:groupRules", JSON.stringify(form));
    const token = localStorage.getItem("unityvault:token");
    navigate(token ? "/admin" : "/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,hsl(158,64%,36%,0.06),transparent)]" />

      <div className="relative w-full max-w-2xl">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <Card className="border-0 shadow-elevated">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Group Rules & Fees</CardTitle>
            <CardDescription>
              Define your group’s contribution rules, loan terms, and penalties.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="seed-amount">Initial Seed Amount (MWK)</Label>
                <Input
                  id="seed-amount"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 100,000"
                  value={form.seedAmount}
                  onChange={(e) => updateField("seedAmount", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Opening balance to start the group fund.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="share-fee">Share Fee (MWK)</Label>
                <Input
                  id="share-fee"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 1,000"
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
                  placeholder="e.g. 5,000"
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
                  placeholder="e.g. 50,000"
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
                  placeholder="e.g. 5"
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
                  placeholder="e.g. 10"
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
                  placeholder="e.g. 15"
                  value={form.penaltyLoanMiss}
                  onChange={(e) => updateField("penaltyLoanMiss", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Percentage of the missed loan payment amount.</p>
              </div>

            </div>

            {formError && (
              <p className="text-center text-sm text-destructive">{formError}</p>
            )}

            <Button variant="hero" size="lg" className="w-full" onClick={handleSaveRules}>
              Save Rules & Fees
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminGroupSetup;

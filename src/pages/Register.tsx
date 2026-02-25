import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, User, Mail, Phone, Lock, Eye, EyeOff } from "lucide-react";
import { apiRequest } from "../lib/api";
import { toast } from "@/components/ui/sonner";

const Register = () => {
  const [form, setForm] = useState({
    groupName: "",
    adminFirstName: "",
    adminSurname: "",
    adminEmail: "",
    adminPhone: "",
    adminPassword: "",
    confirmPassword: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const updateField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const isStrongPassword = (value: string) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(value);

  const handleCreateGroup = async () => {
    const values = Object.values(form).map((value) => value.trim());
    const hasEmpty = values.some((value) => value.length === 0);
    const passwordStrong = isStrongPassword(form.adminPassword);
    const passwordsMatch = form.adminPassword === form.confirmPassword;

    setFormError(hasEmpty ? "All fields are required." : null);
    setPasswordError(
      passwordStrong
        ? null
        : "Password must include lowercase, uppercase, number, and symbol."
    );
    setConfirmError(passwordsMatch ? null : "Passwords do not match.");

    if (hasEmpty || !passwordStrong || !passwordsMatch) {
      return;
    }

    try {
      const rawRules = localStorage.getItem("unityvault:groupRules");
      const rules = rawRules
        ? (JSON.parse(rawRules) as {
            monthlyContribution?: string;
            shareFee?: string;
            seedAmount?: string;
            initialLoanAmount?: string;
            loanInterestPercent?: string;
            penaltyLoanMiss?: string;
            penaltyMonthlyMiss?: string;
          })
        : {};

      const settings = {
        contributionAmount: Number(rules.monthlyContribution || 50000),
        shareFee: Number(rules.shareFee || 0),
        initialLoanAmount: Number(rules.initialLoanAmount || 0),
        seedAmount: Number(rules.seedAmount || 0),
        loanInterestRate: Number(rules.loanInterestPercent || 5) / 100,
        penaltyRate: Number(rules.penaltyLoanMiss || 10) / 100,
        contributionPenaltyRate: Number(rules.penaltyMonthlyMiss || 10) / 100,
        compulsoryInterestRate: 0.2,
        minimumContributionMonths: 3,
        loanToSavingsRatio: 2.0,
        enableAutomaticPenalties: true,
      };

      const result = await apiRequest<{ group: { id: string; name: string } }>("/groups", {
        method: "POST",
        body: {
          name: form.groupName,
          settings,
          admin: {
            email: form.adminEmail,
            username: form.adminEmail,
            password: form.adminPassword,
            first_name: form.adminFirstName,
            last_name: form.adminSurname,
            phone: form.adminPhone,
          },
        },
      });

      const auth = await apiRequest<{ token?: string; user: { userId: string; groupId: string } }>(
        "/auth/admin/login",
        {
          method: "POST",
          body: {
            groupId: result.group.id,
            identifier: form.adminEmail,
            password: form.adminPassword,
            mode: "both",
          },
        }
      );

      if (auth.token) {
        localStorage.setItem("unityvault:token", auth.token);
      }
      localStorage.setItem("unityvault:role", "group_admin");

      const adminName = `${form.adminFirstName} ${form.adminSurname}`.trim();
      localStorage.setItem(
        "unityvault:adminGroup",
        JSON.stringify({
          groupId: result.group.id,
          groupName: result.group.name,
          adminName,
          adminEmail: form.adminEmail,
          adminPhone: form.adminPhone,
        })
      );

      navigate("/admin/group-rules", {
        state: {
          groupCreated: true,
          groupName: result.group.name,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create group";
      toast.error(message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,hsl(158,64%,36%,0.06),transparent)]" />

      <div className="relative w-full max-w-lg">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:px-0 sm:py-0"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to home</span>
        </Link>

        <Card className="border-0 shadow-elevated">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary">
              <Users className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Create a New Group</CardTitle>
            <CardDescription>
              Set up your savings group and become its admin
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Group Name */}
            <div className="space-y-2">
              <Label htmlFor="groupName">Group Name</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="groupName"
                  placeholder="Umoja Savings Group"
                  className="pl-10"
                  value={form.groupName}
                  onChange={(e) => updateField("groupName", e.target.value)}
                />
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Admin Account</span>
              </div>
            </div>

            {/* Admin Name */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="adminFirstName">First Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="adminFirstName"
                    placeholder="John"
                    className="pl-10"
                    value={form.adminFirstName}
                    onChange={(e) => updateField("adminFirstName", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminSurname">Surname</Label>
                <Input
                  id="adminSurname"
                  placeholder="Doe"
                  value={form.adminSurname}
                  onChange={(e) => updateField("adminSurname", e.target.value)}
                />
              </div>
            </div>

            {/* Admin Contact */}
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="adminEmail"
                  type="email"
                  placeholder="admin@example.com"
                  className="pl-10"
                  value={form.adminEmail}
                  onChange={(e) => updateField("adminEmail", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminPhone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="adminPhone"
                  type="tel"
                  placeholder="+265 888 000 000"
                  className="pl-10"
                  value={form.adminPhone}
                  onChange={(e) => updateField("adminPhone", e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="adminPassword">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="adminPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    value={form.adminPassword}
                    onChange={(e) => updateField("adminPassword", e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-xs text-destructive">{passwordError}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    value={form.confirmPassword}
                    onChange={(e) => updateField("confirmPassword", e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {confirmError && (
                  <p className="text-xs text-destructive">{confirmError}</p>
                )}
              </div>
            </div>

            {formError && (
              <p className="text-center text-sm text-destructive">{formError}</p>
            )}

            <Button variant="hero" className="w-full" size="lg" onClick={handleCreateGroup}>
              Create Group & Admin Account
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;

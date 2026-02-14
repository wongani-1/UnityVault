import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Mail, Phone, Lock, Shield, User, CheckCircle2 } from "lucide-react";
import { apiRequest } from "../lib/api";
import { toast } from "@/components/ui/sonner";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get("role") || "member";
  
  const [step, setStep] = useState<"verify" | "reset" | "success">("verify");
  const [role, setRole] = useState<"member" | "admin">(defaultRole as "member" | "admin");
  const [identifier, setIdentifier] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!identifier.trim()) {
      setError("Please enter your email or phone number");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate verification - in real app, this would send an OTP or verification code
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast.success("Verification successful! You can now reset your password.");
      setStep("reset");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Verification failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // In a real application, this would call an API to reset the password
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      toast.success("Password reset successfully!");
      setStep("success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Password reset failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,hsl(158,64%,36%,0.06),transparent)]" />

      <div className="relative w-full max-w-md">
        <Link
          to="/login"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>

        <Card className="border-0 shadow-elevated">
          <CardHeader className="text-center">
            <img
              src="/Unity Vault.png"
              alt="UnityVault"
              className="mx-auto mb-2 h-12 w-12 rounded-lg"
            />
            <CardTitle className="text-2xl">
              {step === "verify" && "Reset Password"}
              {step === "reset" && "Create New Password"}
              {step === "success" && "Password Reset Complete"}
            </CardTitle>
            <CardDescription>
              {step === "verify" && "Enter your details to verify your identity"}
              {step === "reset" && "Enter a new password for your account"}
              {step === "success" && "You can now sign in with your new password"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {step === "verify" && (
              <div className="space-y-4">
                <Tabs value={role} onValueChange={(value) => setRole(value as "member" | "admin")}>
                  <TabsList className="mb-6 grid w-full grid-cols-2">
                    <TabsTrigger value="member">
                      <User className="mr-2 h-4 w-4" />
                      Member
                    </TabsTrigger>
                    <TabsTrigger value="admin">
                      <Shield className="mr-2 h-4 w-4" />
                      Admin
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="member" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="member-identifier">Email or Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="member-identifier"
                          placeholder="member@example.com or +265 888 000 000"
                          className="pl-10"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="admin" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-identifier">Email, Username, or Phone</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="admin-identifier"
                          placeholder="admin@example.com / username / phone"
                          className="pl-10"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {error && (
                  <p className="text-center text-sm text-destructive">{error}</p>
                )}

                <Button
                  variant="hero"
                  className="w-full"
                  size="lg"
                  onClick={handleVerify}
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Continue"}
                </Button>
              </div>
            )}

            {step === "reset" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 6 characters long
                  </p>
                </div>

                {error && (
                  <p className="text-center text-sm text-destructive">{error}</p>
                )}

                <Button
                  variant="hero"
                  className="w-full"
                  size="lg"
                  onClick={handleResetPassword}
                  disabled={loading}
                >
                  {loading ? "Resetting Password..." : "Reset Password"}
                </Button>
              </div>
            )}

            {step === "success" && (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Your password has been successfully reset. You can now sign in with your new password.
                </p>
                <Button
                  variant="hero"
                  className="w-full"
                  size="lg"
                  onClick={() => navigate("/login")}
                >
                  Back to Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;

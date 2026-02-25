import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Mail, Phone, Lock, Shield, User, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { apiRequest } from "../lib/api";
import { toast } from "@/components/ui/sonner";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get("role") || "member";
  const urlToken = searchParams.get("token");
  
  const [step, setStep] = useState<"verify" | "reset" | "success">("verify");
  const [role, setRole] = useState<"member" | "admin">(defaultRole as "member" | "admin");
  const [identifier, setIdentifier] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(false);
  const [successType, setSuccessType] = useState<"email-sent" | "password-reset">("email-sent");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validate token from URL if present
  useEffect(() => {
    const validateToken = async () => {
      if (!urlToken) return;

      setValidatingToken(true);
      try {
        // Validate the token with the backend
        await apiRequest("/password-reset/validate", {
          method: "POST",
          body: {
            token: urlToken,
            role: role === "admin" ? "group_admin" : "member",
          },
        });
        
        // Token is valid, allow access to reset step
        setResetToken(urlToken);
        setStep("reset");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Invalid or expired reset link";
        toast.error(message);
        setError(message);
        // Keep user on verify step if token is invalid
        setStep("verify");
      } finally {
        setValidatingToken(false);
      }
    };

    validateToken();
  }, [urlToken, role]);

  const handleVerify = async () => {
    if (!identifier.trim()) {
      setError("Please enter your email or phone number");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiRequest<{ message: string; token?: string }>(
        "/password-reset/request",
        {
          method: "POST",
          body: {
            identifier,
            role: role === "admin" ? "group_admin" : "member",
          },
        }
      );

      // Don't automatically move to reset step - user must use email link
      toast.success("Password reset link sent! Check your email.");
      setSuccessType("email-sent");
      setStep("success"); // Show success message instead
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

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use the validated token
      const token = resetToken;
      
      if (!token) {
        throw new Error("Reset token not found. Please request a new reset link.");
      }

      await apiRequest("/password-reset/confirm", {
        method: "POST",
        body: {
          token,
          newPassword,
          role: role === "admin" ? "group_admin" : "member",
        },
      });
      
      toast.success("Password reset successfully!");
      setSuccessType("password-reset");
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,hsl(158,64%,36%,0.06),transparent)]" />

      <div className="relative w-full max-w-md">
        <Link
          to="/login"
          className="mb-6 inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:px-0 sm:py-0"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to login</span>
        </Link>

        <Card className="border-0 shadow-elevated">
          <CardHeader className="text-center">
            <img
              src="/Unity Vault.png"
              alt="UnityVault"
              className="mx-auto mb-2 h-12 w-12 rounded-lg"
            />
            <CardTitle className="text-2xl">
              {validatingToken && "Validating Reset Link"}
              {!validatingToken && step === "verify" && "Reset Password"}
              {!validatingToken && step === "reset" && "Create New Password"}
              {!validatingToken && step === "success" && successType === "email-sent" && "Email Sent"}
              {!validatingToken && step === "success" && successType === "password-reset" && "Password Reset Complete"}
            </CardTitle>
            <CardDescription>
              {validatingToken && "Please wait while we verify your reset link..."}
              {!validatingToken && step === "verify" && "Enter your details to verify your identity"}
              {!validatingToken && step === "reset" && "Enter a new password for your account"}
              {!validatingToken && step === "success" && successType === "email-sent" && "We've sent you a password reset link"}
              {!validatingToken && step === "success" && successType === "password-reset" && "You can now sign in with your new password"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {validatingToken && (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            )}

            {!validatingToken && step === "verify" && (
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

            {!validatingToken && step === "reset" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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

            {!validatingToken && step === "success" && (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </div>
                {successType === "email-sent" ? (
                  <>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-foreground">Check Your Email</h3>
                      <p className="text-sm text-muted-foreground">
                        We've sent a password reset link to your email address. Click the link in the email to create a new password.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        The link will expire in 60 minutes. If you don't see the email, check your spam folder.
                      </p>
                    </div>
                    <Button
                      variant="hero"
                      className="w-full"
                      size="lg"
                      onClick={() => navigate("/login")}
                    >
                      Back to Login
                    </Button>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;

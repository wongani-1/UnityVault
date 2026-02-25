import { useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { toast } from "@/components/ui/sonner";

const MemberActivate = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => params.get("token") || "", [params]);
  const [step, setStep] = useState<"otp" | "password">("otp");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleVerify = async () => {
    if (!token) {
      toast.error("Invalid or missing activation link");
      return;
    }
    if (!otp) {
      toast.error("Please enter the one-time password");
      return;
    }

    setLoading(true);
    try {
      await apiRequest("/members/activate/verify", {
        method: "POST",
        body: { token, otp },
      });
      setStep("password");
      toast.success("OTP verified. Set your new password.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to verify OTP";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!token) {
      toast.error("Invalid or missing activation link");
      return;
    }
    if (!password || !confirmPassword) {
      toast.error("Please fill out both password fields");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await apiRequest("/members/activate/complete", {
        method: "POST",
        body: { token, otp, newPassword: password },
      });
      toast.success("Password updated. You can now log in.");
      navigate("/login");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to set password";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md border-0 shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Activate Your Account</CardTitle>
          <p className="text-sm text-muted-foreground">
            Your activation link and one-time password (OTP) expire in 5 minutes.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "otp" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="otp">One-Time Pin</Label>
                <Input
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter the 6-digit code"
                />
              </div>
              <Button variant="hero" className="w-full" onClick={handleVerify} disabled={loading}>
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    className="pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    className="pr-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <Button variant="hero" className="w-full" onClick={handleComplete} disabled={loading}>
                {loading ? "Saving..." : "Set Password"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MemberActivate;

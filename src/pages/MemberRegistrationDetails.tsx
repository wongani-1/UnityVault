import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, User, Mail, Phone, Lock, Eye, EyeOff } from "lucide-react";
import { apiRequest } from "../lib/api";
import { toast } from "@/components/ui/sonner";

const MemberRegistrationDetails = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const isStrongPassword = (value: string) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(value);

  const handleSubmit = async () => {
    const values = Object.values(form).map((value) => value.trim());
    const hasEmpty = values.some((value) => value.length === 0);
    const passwordStrong = isStrongPassword(form.password);
    const passwordsMatch = form.password === form.confirmPassword;

    setFormError(hasEmpty ? "All fields are required." : null);
    setPasswordError(
      passwordStrong
        ? null
        : "Password must include lowercase, uppercase, number, and symbol (min. 8 characters)."
    );
    setConfirmError(passwordsMatch ? null : "Passwords do not match.");

    if (hasEmpty || !passwordStrong || !passwordsMatch) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Get group ID from URL params or localStorage
      const urlParams = new URLSearchParams(window.location.search);
      const groupId = urlParams.get("groupId") || sessionStorage.getItem("unityvault:pendingGroupId");

      if (!groupId) {
        toast.error("Group information not found. Please use the registration link provided.");
        return;
      }

      // Register the member
      await apiRequest("/auth/member/register", {
        method: "POST",
        body: {
          groupId,
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          username: form.email, // Use email as username
        },
      });

      // Auto-login after registration
      const auth = await apiRequest<{ token?: string; user: { userId: string; groupId: string } }>(
        "/auth/member/login",
        {
          method: "POST",
          body: {
            identifier: form.email,
            password: form.password,
          },
        }
      );

      if (auth.token) {
        sessionStorage.setItem("unityvault:token", auth.token);
      }
      sessionStorage.setItem("unityvault:role", "member");
      sessionStorage.setItem(
        "unityvault:memberProfile",
        JSON.stringify({
          firstName: form.first_name,
          lastName: form.last_name,
          groupId: auth.user.groupId,
        })
      );
      
      // Clear pending group ID
      sessionStorage.removeItem("unityvault:pendingGroupId");

      toast.success("Registration successful. Buy your shares to continue setup.");
      navigate("/member/share-purchase?shares=1&registration=1");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,hsl(158,64%,36%,0.06),transparent)]" />

      <div className="relative w-full max-w-lg">
        <Card className="border-0 shadow-elevated">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Complete Your Registration</CardTitle>
            <CardDescription>
              Provide your personal details to complete your member registration.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <div className="space-y-2">
              <Label htmlFor="firstName">
                <User className="mr-2 inline h-4 w-4" />
                First Name
              </Label>
              <Input
                id="firstName"
                placeholder="e.g. Thandiwe"
                value={form.first_name}
                onChange={(e) => updateField("first_name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">
                <User className="mr-2 inline h-4 w-4" />
                Last Name
              </Label>
              <Input
                id="lastName"
                placeholder="e.g. Banda"
                value={form.last_name}
                onChange={(e) => updateField("last_name", e.target.value)}
              />
            </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="mr-2 inline h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g. thandiwe@example.com"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="mr-2 inline h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  placeholder="e.g. 0991 000 000"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                />
              </div>
            </div>

            {/* Password Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">
                  <Lock className="mr-2 inline h-4 w-4" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={form.password}
                    onChange={(e) => updateField("password", e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-sm text-destructive">{passwordError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Must contain uppercase, lowercase, number, and special character (minimum 8 characters)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  <Lock className="mr-2 inline h-4 w-4" />
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={form.confirmPassword}
                    onChange={(e) => updateField("confirmPassword", e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmError && (
                  <p className="text-sm text-destructive">{confirmError}</p>
                )}
              </div>
            </div>

            {/* Action Area */}
            <div className="space-y-3">
              {formError && (
                <p className="text-center text-sm text-destructive">{formError}</p>
              )}
              <Button
                variant="hero"
                size="lg"
                className="w-full"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Registering..." : "Complete Registration"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                By registering, you agree to our terms and privacy policy.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MemberRegistrationDetails;

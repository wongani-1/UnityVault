import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, Mail, ArrowLeft, Shield, Lock, User, Eye, EyeOff } from "lucide-react";
import { apiRequest } from "../lib/api";
import { toast } from "@/components/ui/sonner";

const Login = () => {
  const navigate = useNavigate();
  const [memberLogin, setMemberLogin] = useState({ identifier: "", password: "" });
  const [adminLogin, setAdminLogin] = useState({ identifier: "", password: "" });
  const [memberError, setMemberError] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"member" | "admin" | null>(null);
  const [showMemberPassword, setShowMemberPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const handleMemberLogin = async () => {
    const hasEmpty = [memberLogin.identifier, memberLogin.password].some(
      (value) => value.trim().length === 0,
    );
    setMemberError(hasEmpty ? "All fields are required." : null);
    if (hasEmpty) return;

    setLoading("member");
    try {
      const auth = await apiRequest<{ token?: string; user: { userId: string; groupId: string; role: string } }>(
        "/auth/member/login",
        {
          method: "POST",
          body: {
            identifier: memberLogin.identifier,
            password: memberLogin.password,
            mode: "both",
          },
        }
      );

      if (auth.token) {
        sessionStorage.setItem("unityvault:token", auth.token);
      }
      sessionStorage.setItem("unityvault:role", "member");

      const profile = await apiRequest<{ id: string; first_name: string; last_name: string; groupId: string }>(
        "/members/me"
      );
      const group = await apiRequest<{ name: string }>("/groups/me");
      sessionStorage.setItem(
        "unityvault:memberProfile",
        JSON.stringify({
          fullName: `${profile.first_name} ${profile.last_name}`,
          groupId: profile.groupId,
          groupName: group.name,
        })
      );

      // Check registration fee payment status
      const feeStatus = await apiRequest<{ registrationFeePaid: boolean }>(
        "/members/me/registration-status"
      );

      if (!feeStatus.registrationFeePaid) {
        toast.warning("Registration fee payment required.");
        navigate("/member/registration-fee");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      setMemberError(message);
      toast.error(message);
    } finally {
      setLoading(null);
    }
  };

  const handleAdminLogin = async () => {
    const hasEmpty = [adminLogin.identifier, adminLogin.password].some(
      (value) => value.trim().length === 0,
    );
    setAdminError(hasEmpty ? "All fields are required." : null);
    if (hasEmpty) return;

    setLoading("admin");
    try {
      const auth = await apiRequest<{ token?: string; user: { userId: string; groupId: string; role: string } }>(
        "/auth/admin/login",
        {
          method: "POST",
          body: {
            identifier: adminLogin.identifier,
            password: adminLogin.password,
            mode: "both",
          },
        }
      );

      if (auth.token) {
        sessionStorage.setItem("unityvault:token", auth.token);
      }
      sessionStorage.setItem("unityvault:role", "group_admin");

      const group = await apiRequest<{ id: string; name: string }>(
        `/groups/${auth.user.groupId}`
      );
      const adminProfile = await apiRequest<{ first_name?: string; last_name?: string; email: string; phone?: string }>(
        "/admins/me"
      );
      sessionStorage.setItem(
        "unityvault:adminGroup",
        JSON.stringify({
          groupId: group.id,
          groupName: group.name,
          adminName: (adminProfile.first_name && adminProfile.last_name) ? `${adminProfile.first_name} ${adminProfile.last_name}` : adminProfile.email,
          adminEmail: adminProfile.email,
          adminPhone: adminProfile.phone,
        })
      );

      navigate("/admin");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      setAdminError(message);
      toast.error(message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      {/* Background accent */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,hsl(158,64%,36%,0.06),transparent)]" />

      <div className="relative w-full max-w-md">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:px-0 sm:py-0"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to home</span>
        </Link>

        <Card className="border-0 shadow-elevated">
          <CardHeader className="text-center">
            <img
              src="/Unity Vault.png"
              alt="UnityVault"
              className="mx-auto mb-2 h-12 w-12 rounded-lg"
            />
            <CardTitle className="text-xl sm:text-2xl">Welcome...</CardTitle>
            <CardDescription>Sign in to your UnityVault account</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="member" className="w-full">
              <TabsList className="mb-6 grid w-full grid-cols-2">
                <TabsTrigger value="member">
                  <User className="mr-2 h-4 w-4" />
                  Member
                </TabsTrigger>
                <TabsTrigger value="admin">
                  <Shield className="mr-2 h-4 w-4" />
                  Group Admin
                </TabsTrigger>
              </TabsList>

              {/* Member Login — simple credentials, auto-mapped to group */}
              <TabsContent value="member" className="space-y-4">
                <form onSubmit={(e) => { e.preventDefault(); handleMemberLogin(); }} className="space-y-4">
                <div className="rounded-lg bg-secondary/50 p-3">
                  <p className="text-xs text-muted-foreground">
                    Sign in with your email or phone number. You'll be automatically directed to your group.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="member-id">Email or Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="member-id"
                      placeholder="member@example.com"
                      className="pl-10"
                      value={memberLogin.identifier}
                      onChange={(e) =>
                        setMemberLogin({ ...memberLogin, identifier: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="member-password">Password</Label>
                    <Link
                      to="/forgot-password?role=member"
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="member-password"
                      type={showMemberPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      value={memberLogin.password}
                      onChange={(e) =>
                        setMemberLogin({ ...memberLogin, password: e.target.value })
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowMemberPassword(!showMemberPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showMemberPassword ? "Hide password" : "Show password"}
                    >
                      {showMemberPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {memberError && (
                  <p className="text-center text-sm text-destructive">{memberError}</p>
                )}

                <Button
                  variant="hero"
                  className="w-full"
                  size="lg"
                  type="submit"
                  disabled={loading === "member"}
                >
                  {loading === "member" ? "Signing In..." : "Sign In"}
                </Button>
                </form>
              </TabsContent>

              {/* Admin Login — sign in with email or phone */}
              <TabsContent value="admin" className="space-y-4">
                <form onSubmit={(e) => { e.preventDefault(); handleAdminLogin(); }} className="space-y-4">
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <p className="flex items-center gap-2 text-xs font-medium text-primary">
                    <Shield className="h-3.5 w-3.5" />
                    Sign in with your email or phone number
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    You can access your group once authenticated with valid credentials.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-identifier">Email or Phone</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="admin-identifier"
                      placeholder="admin@example.com"
                      className="pl-10"
                      value={adminLogin.identifier}
                      onChange={(e) =>
                        setAdminLogin({ ...adminLogin, identifier: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="admin-password">Password</Label>
                    <Link
                      to="/forgot-password?role=admin"
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="admin-password"
                      type={showAdminPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      value={adminLogin.password}
                      onChange={(e) =>
                        setAdminLogin({ ...adminLogin, password: e.target.value })
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showAdminPassword ? "Hide password" : "Show password"}
                    >
                      {showAdminPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {adminError && (
                  <p className="text-center text-sm text-destructive">{adminError}</p>
                )}

                <Button
                  variant="hero"
                  className="w-full"
                  size="lg"
                  type="submit"
                  disabled={loading === "admin"}
                >
                  {loading === "admin" ? "Signing In..." : "Sign In as Admin"}
                </Button>
                </form>
              </TabsContent>
            </Tabs>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don't have a group yet?{" "}
              <Link to="/register" className="font-medium text-primary hover:underline">
                Create a Group
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;

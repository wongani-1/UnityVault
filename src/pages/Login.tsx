import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, Mail, ArrowLeft, Shield, Lock, Hash, User } from "lucide-react";

const Login = () => {
  const [memberLogin, setMemberLogin] = useState({ identifier: "", password: "" });
  const [adminLogin, setAdminLogin] = useState({ groupId: "", username: "", password: "" });
  const [memberError, setMemberError] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);

  const handleMemberLogin = () => {
    const hasEmpty = [memberLogin.identifier, memberLogin.password].some(
      (value) => value.trim().length === 0,
    );
    setMemberError(hasEmpty ? "All fields are required." : null);
  };

  const handleAdminLogin = () => {
    const hasEmpty = [adminLogin.groupId, adminLogin.username, adminLogin.password].some(
      (value) => value.trim().length === 0,
    );
    setAdminError(hasEmpty ? "All fields are required." : null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      {/* Background accent */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,hsl(158,64%,36%,0.06),transparent)]" />

      <div className="relative w-full max-w-md">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <Card className="border-0 shadow-elevated">
          <CardHeader className="text-center">
            <img
              src="/Unity Vault.png"
              alt="UnityVault"
              className="mx-auto mb-2 h-12 w-12 rounded-none"
            />
            <CardTitle className="text-2xl">Welcome...</CardTitle>
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
                <div className="rounded-lg bg-secondary/50 p-3">
                  <p className="text-xs text-muted-foreground">
                    Sign in with your phone, email, or username. You'll be automatically directed to your group.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="member-id">Phone, Email, or Username</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="member-id"
                      placeholder="+256 700 000 000 or username"
                      className="pl-10"
                      value={memberLogin.identifier}
                      onChange={(e) =>
                        setMemberLogin({ ...memberLogin, identifier: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="member-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="member-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={memberLogin.password}
                      onChange={(e) =>
                        setMemberLogin({ ...memberLogin, password: e.target.value })
                      }
                    />
                  </div>
                </div>

                {memberError && (
                  <p className="text-center text-sm text-destructive">{memberError}</p>
                )}

                <Button variant="hero" className="w-full" size="lg" onClick={handleMemberLogin}>
                  Sign In
                </Button>

              </TabsContent>

              {/* Admin Login — requires Group ID + credentials */}
              <TabsContent value="admin" className="space-y-4">
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <p className="flex items-center gap-2 text-xs font-medium text-primary">
                    <Shield className="h-3.5 w-3.5" />
                    Admin login requires your unique Group ID
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Your Group ID was generated when the group was created (e.g. GB-8F3K2). You can only access your own group.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="group-id">Group ID</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="group-id"
                      placeholder="GB-8F3K2"
                      className="pl-10 font-mono uppercase tracking-wider"
                      value={adminLogin.groupId}
                      onChange={(e) =>
                        setAdminLogin({ ...adminLogin, groupId: e.target.value.toUpperCase() })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-username">Username or Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="admin-username"
                      placeholder="admin@example.com"
                      className="pl-10"
                      value={adminLogin.username}
                      onChange={(e) =>
                        setAdminLogin({ ...adminLogin, username: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="admin-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={adminLogin.password}
                      onChange={(e) =>
                        setAdminLogin({ ...adminLogin, password: e.target.value })
                      }
                    />
                  </div>
                </div>

                {adminError && (
                  <p className="text-center text-sm text-destructive">{adminError}</p>
                )}

                <Button variant="hero" className="w-full" size="lg" onClick={handleAdminLogin}>
                  Sign In as Admin
                </Button>
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

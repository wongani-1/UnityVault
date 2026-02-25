import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { apiRequest } from "../lib/api";
import { toast } from "@/components/ui/sonner";
import { Shield, Download, Key, Copy, Eye, EyeOff } from "lucide-react";

const MemberProfile = () => {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    username: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const member = await apiRequest<{ first_name?: string; last_name?: string; email?: string; phone?: string; username: string; groupId: string; twoFactorEnabled?: boolean }>(
          "/members/me"
        );
        if (!active) return;
        setForm({
          first_name: member.first_name || "",
          last_name: member.last_name || "",
          email: member.email || "",
          phone: member.phone || "",
          username: member.username || "",
        });
        setTwoFactorEnabled(member.twoFactorEnabled || false);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load profile";
        toast.error(message);
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
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      const updated = await apiRequest<{ first_name?: string; last_name?: string; email?: string; phone?: string; username: string; groupId: string }>(
        "/members/me",
        {
          method: "PUT",
          body: {
            first_name: form.first_name,
            last_name: form.last_name,
            email: form.email,
            phone: form.phone,
            username: form.username,
          },
        }
      );

      const stored = localStorage.getItem("unityvault:memberProfile");
      if (stored) {
        const parsed = JSON.parse(stored) as { groupId?: string; groupName?: string };
        localStorage.setItem(
          "unityvault:memberProfile",
          JSON.stringify({
            ...parsed,
            fullName:
              updated.first_name && updated.last_name
                ? `${updated.first_name} ${updated.last_name}`
                : parsed?.fullName,
            groupId: updated.groupId,
          })
        );
      }

      toast.success("Profile updated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update profile";
      toast.error(message);
    }
  };

  const updatePasswordField = (field: keyof typeof passwordForm, value: string) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEnable2FA = async () => {
    setShow2FASetup(true);
  };

  const handleSetupComplete = async () => {
    if (!pin || !confirmPin) {
      toast.error("Please enter a PIN");
      return;
    }
    
    if (pin !== confirmPin) {
      toast.error("PINs do not match");
      return;
    }

    if (pin.length < 4) {
      toast.error("PIN must be at least 4 digits");
      return;
    }

    try {
      const response = await apiRequest<{ backupCodes: string[] }>("/2fa/enable", {
        method: "POST",
        body: { pin }
      });
      setBackupCodes(response.backupCodes);
      setTwoFactorEnabled(true);
      setPin("");
      setConfirmPin("");
      toast.success("Two-Factor Authentication enabled successfully!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to enable 2FA";
      toast.error(message);
    }
  };

  const handleDisable2FA = async () => {
    try {
      await apiRequest("/2fa/disable", { method: "POST" });
      setTwoFactorEnabled(false);
      setBackupCodes([]);
      setShow2FASetup(false);
      toast.success("Two-Factor Authentication disabled");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to disable 2FA";
      toast.error(message);
    }
  };

  const handleViewBackupCodes = async () => {
    try {
      const response = await apiRequest<{ backupCodes: string[] }>("/2fa/backup-codes");
      setBackupCodes(response.backupCodes);
      toast.info("Backup codes retrieved");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get backup codes";
      toast.error(message);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    try {
      const response = await apiRequest<{ backupCodes: string[] }>(
        "/2fa/regenerate-backup-codes",
        { method: "POST" }
      );
      setBackupCodes(response.backupCodes);
      toast.success("New backup codes generated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to regenerate codes";
      toast.error(message);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    toast.success("Backup codes copied to clipboard");
  };

  const handleExportData = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000/api"}/export/member-data`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("unityvault:token")}` },
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `member-data-${new Date().toISOString().split("T")[0]}.pdf`;
      a.click();
      toast.success("Data exported successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to export data";
      toast.error(message);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error("Please fill out all password fields");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    try {
      await apiRequest("/members/me/password", {
        method: "PUT",
        body: {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password updated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update password";
      toast.error(message);
    }
  };

  return (
    <DashboardLayout title="Profile" subtitle="Manage your personal details">
      <div className="space-y-6">
        <Card className="border-0 shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Member Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {loading && (
            <p className="text-sm text-muted-foreground sm:col-span-2">Loading profile...</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="member-first-name">First name</Label>
            <Input
              id="member-first-name"
              value={form.first_name}
              onChange={(e) => updateField("first_name", e.target.value)}
              placeholder="First name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="member-last-name">Last name</Label>
            <Input
              id="member-last-name"
              value={form.last_name}
              onChange={(e) => updateField("last_name", e.target.value)}
              placeholder="Last name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="member-username">Username</Label>
            <Input
              id="member-username"
              value={form.username}
              onChange={(e) => updateField("username", e.target.value)}
              placeholder="Username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="member-email">Email</Label>
            <Input
              id="member-email"
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="member-phone">Phone</Label>
            <Input
              id="member-phone"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="+256 700 000 000"
            />
          </div>
          <div className="sm:col-span-2">
            <Button variant="hero" onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </CardContent>
        </Card>
        <Card className="border-0 shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Change Password</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="member-current-password">Current password</Label>
            <div className="relative">
              <Input
                id="member-current-password"
                type={showCurrentPassword ? "text" : "password"}
                className="pr-10"
                value={passwordForm.currentPassword}
                onChange={(e) => updatePasswordField("currentPassword", e.target.value)}
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="member-new-password">New password</Label>
            <div className="relative">
              <Input
                id="member-new-password"
                type={showNewPassword ? "text" : "password"}
                className="pr-10"
                value={passwordForm.newPassword}
                onChange={(e) => updatePasswordField("newPassword", e.target.value)}
                placeholder="Create a new password"
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
            <Label htmlFor="member-confirm-password">Confirm new password</Label>
            <div className="relative">
              <Input
                id="member-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                className="pr-10"
                value={passwordForm.confirmPassword}
                onChange={(e) => updatePasswordField("confirmPassword", e.target.value)}
                placeholder="Confirm new password"
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
          <div className="sm:col-span-2">
            <Button variant="hero" onClick={handlePasswordChange}>
              Update Password
            </Button>
          </div>
        </CardContent>
        </Card>

        <Card className="border-0 shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
              </div>
              {twoFactorEnabled && (
                <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                  Enabled
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add an extra layer of security to your account by requiring a PIN code at login.
            </p>

            {!twoFactorEnabled && !show2FASetup && (
              <Button variant="hero" onClick={handleEnable2FA}>
                <Shield className="mr-2 h-4 w-4" />
                Enable 2FA
              </Button>
            )}

            {show2FASetup && !twoFactorEnabled && (
              <div className="space-y-4 rounded-lg border p-4">
                <div className="space-y-2">
                  <Label htmlFor="pin">Create a 4-6 digit PIN</Label>
                  <div className="relative">
                    <Input
                      id="pin"
                      type={showPin ? "text" : "password"}
                      className="pr-10"
                      placeholder="Enter PIN"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPin ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-pin">Confirm PIN</Label>
                  <div className="relative">
                    <Input
                      id="confirm-pin"
                      type={showConfirmPin ? "text" : "password"}
                      className="pr-10"
                      placeholder="Confirm PIN"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPin(!showConfirmPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPin ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="hero" onClick={handleSetupComplete}>
                    Enable 2FA
                  </Button>
                  <Button variant="outline" onClick={() => { setShow2FASetup(false); setPin(""); setConfirmPin(""); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {twoFactorEnabled && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleViewBackupCodes}>
                    <Key className="mr-2 h-4 w-4" />
                    View Backup Codes
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleRegenerateBackupCodes}>
                    Regenerate Codes
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleDisable2FA}>
                    Disable 2FA
                  </Button>
                </div>

                {backupCodes.length > 0 && (
                  <div className="space-y-2 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Your Backup Codes:</p>
                      <Button variant="ghost" size="sm" onClick={copyBackupCodes}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Save these codes in a safe place. Each can be used once if you lose access to your PIN.
                    </p>
                    <div className="grid grid-cols-2 gap-2 rounded bg-muted p-3 font-mono text-xs">
                      {backupCodes.map((code, i) => (
                        <div key={i}>{code}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Export Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Download all your account data including contributions, loans, and transactions.
            </p>
            <Button variant="outline" onClick={handleExportData}>
              <Download className="mr-2 h-4 w-4" />
              Export My Data (PDF)
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MemberProfile;

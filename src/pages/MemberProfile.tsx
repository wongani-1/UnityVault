import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { apiRequest } from "../lib/api";
import { toast } from "@/components/ui/sonner";

const MemberProfile = () => {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    username: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const member = await apiRequest<{ fullName?: string; email?: string; phone?: string; username: string }>(
          "/members/me"
        );
        if (!active) return;
        setForm({
          fullName: member.fullName || "",
          email: member.email || "",
          phone: member.phone || "",
          username: member.username || "",
        });
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
      const updated = await apiRequest<{ fullName?: string; email?: string; phone?: string; username: string; groupId: string }>(
        "/members/me",
        {
          method: "PUT",
          body: {
            fullName: form.fullName,
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
            fullName: updated.fullName,
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
        <CardContent className="grid gap-4 md:grid-cols-2">
          {loading && (
            <p className="text-sm text-muted-foreground md:col-span-2">Loading profile...</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="member-fullname">Full name</Label>
            <Input
              id="member-fullname"
              value={form.fullName}
              onChange={(e) => updateField("fullName", e.target.value)}
              placeholder="Your name"
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
          <div className="md:col-span-2">
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
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="member-current-password">Current password</Label>
            <Input
              id="member-current-password"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => updatePasswordField("currentPassword", e.target.value)}
              placeholder="Enter current password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="member-new-password">New password</Label>
            <Input
              id="member-new-password"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => updatePasswordField("newPassword", e.target.value)}
              placeholder="Create a new password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="member-confirm-password">Confirm new password</Label>
            <Input
              id="member-confirm-password"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => updatePasswordField("confirmPassword", e.target.value)}
              placeholder="Confirm new password"
            />
          </div>
          <div className="md:col-span-2">
            <Button variant="hero" onClick={handlePasswordChange}>
              Update Password
            </Button>
          </div>
        </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MemberProfile;

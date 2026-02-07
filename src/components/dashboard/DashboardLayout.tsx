import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  Bell,
  FileText,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Hash,
  Copy,
  Check,
  LinkIcon,
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  isAdmin?: boolean;
  groupId?: string;
  groupName?: string;
}

const memberNav = [
  { label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Contributions", icon: Wallet, href: "/dashboard/contributions" },
  { label: "Loans", icon: CreditCard, href: "/dashboard/loans" },
  { label: "Notifications", icon: Bell, href: "/dashboard/notifications" },
];

const adminNav = [
  { label: "Overview", icon: LayoutDashboard, href: "/admin" },
  { label: "Members", icon: Users, href: "/admin/members" },
  { label: "Loans", icon: CreditCard, href: "/admin/loans" },
  { label: "Reports", icon: FileText, href: "/admin/reports" },
  { label: "Settings", icon: Settings, href: "/admin/settings" },
];

const DashboardLayout = ({
  children,
  title,
  subtitle,
  isAdmin = false,
  groupId = "GB-8F3K2",
  groupName = "Umoja Savings Group",
}: DashboardLayoutProps) => {
  const location = useLocation();
  const nav = isAdmin ? adminNav : memberNav;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyGroupId = () => {
    navigator.clipboard.writeText(groupId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
          <span className="text-sm font-bold text-primary-foreground">G</span>
        </div>
        <span className="text-lg font-bold text-foreground">GroupFund</span>
      </div>

      {/* Group Badge */}
      <div className="border-b px-4 py-3">
        <div className="rounded-lg bg-secondary/70 p-3">
          <p className="text-xs font-medium text-muted-foreground">Group</p>
          <p className="truncate text-sm font-semibold text-foreground">{groupName}</p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <Hash className="h-3 w-3 text-muted-foreground" />
            <span className="font-mono text-xs tracking-wider text-muted-foreground">{groupId}</span>
            <button
              onClick={handleCopyGroupId}
              className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
              title="Copy Group ID"
            >
              {copiedId ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-4">
        {nav.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.label}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
            </Link>
          );
        })}
      </nav>

      {/* Invite Link (Admin only) */}
      {isAdmin && (
        <div className="border-t px-4 py-3">
          <Button variant="outline" size="sm" className="w-full justify-start text-xs">
            <LinkIcon className="mr-2 h-3.5 w-3.5" />
            Copy Invite Link
          </Button>
        </div>
      )}

      {/* User */}
      <div className="border-t p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
            JD
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-foreground">John Doe</p>
            <p className="truncate text-xs text-muted-foreground">
              {isAdmin ? "Group Admin" : "Member"}
            </p>
          </div>
        </div>
        <Link to="/">
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </Link>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 flex-shrink-0 border-r bg-card lg:block">
        <div className="flex h-full flex-col">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative h-full w-72 bg-card shadow-elevated animate-slide-in-right">
            <div className="flex h-full flex-col">
              <SidebarContent />
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-card/80 px-4 backdrop-blur-md lg:px-6">
          <div className="flex items-center gap-3">
            <button
              className="rounded-md p-1.5 hover:bg-accent lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">{title}</h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                3
              </span>
            </Button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground lg:hidden">
              JD
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;

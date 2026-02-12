import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RegisterSuccess from "./pages/RegisterSuccess";
import AdminGroupSetup from "./pages/AdminGroupSetup";
import MemberRegistrationPayment from "./pages/MemberRegistrationPayment";
import MemberRegistrationDetails from "./pages/MemberRegistrationDetails";
import MemberContributionPayment from "./pages/MemberContributionPayment";
import MemberActivate from "./pages/MemberActivate";
import MemberDashboard from "./pages/MemberDashboard";
import MemberContributions from "./pages/MemberContributions";
import MemberLoans from "./pages/MemberLoans";
import MemberNotifications from "./pages/MemberNotifications";
import MemberProfile from "./pages/MemberProfile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminMembers from "./pages/AdminMembers";
import AdminLoans from "./pages/AdminLoans";
import AdminReports from "./pages/AdminReports";
import AdminSettings from "./pages/AdminSettings";
import AdminAudit from "./pages/AdminAudit";
import AdminPenalties from "./pages/AdminPenalties";
import AdminNotifications from "./pages/AdminNotifications";
import AdminProfile from "./pages/AdminProfile";
import NotFound from "./pages/NotFound";
import RequireAuth from "./components/auth/RequireAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register/success" element={<RegisterSuccess />} />
          <Route path="/admin/group-rules" element={<AdminGroupSetup />} />
          <Route path="/member/registration-fee" element={<MemberRegistrationPayment />} />
          <Route path="/member/registration-details" element={<MemberRegistrationDetails />} />
          <Route path="/member/pay-contribution" element={<MemberContributionPayment />} />
          <Route path="/member/activate" element={<MemberActivate />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth role="member">
                <MemberDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard/contributions"
            element={
              <RequireAuth role="member">
                <MemberContributions />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard/loans"
            element={
              <RequireAuth role="member">
                <MemberLoans />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard/notifications"
            element={
              <RequireAuth role="member">
                <MemberNotifications />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard/profile"
            element={
              <RequireAuth role="member">
                <MemberProfile />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAuth role="group_admin">
                <AdminDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/members"
            element={
              <RequireAuth role="group_admin">
                <AdminMembers />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/loans"
            element={
              <RequireAuth role="group_admin">
                <AdminLoans />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/penalties"
            element={
              <RequireAuth role="group_admin">
                <AdminPenalties />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <RequireAuth role="group_admin">
                <AdminNotifications />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <RequireAuth role="group_admin">
                <AdminReports />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/audit"
            element={
              <RequireAuth role="group_admin">
                <AdminAudit />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <RequireAuth role="group_admin">
                <AdminProfile />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <RequireAuth role="group_admin">
                <AdminSettings />
              </RequireAuth>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

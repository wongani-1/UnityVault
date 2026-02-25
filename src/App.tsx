import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RequireAuth from "./components/auth/RequireAuth";

const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const AdminGroupSetup = lazy(() => import("./pages/AdminGroupSetup"));
const MemberRegistrationPayment = lazy(() => import("./pages/MemberRegistrationPayment"));
const MemberRegistrationDetails = lazy(() => import("./pages/MemberRegistrationDetails"));
const MemberSeedPayment = lazy(() => import("./pages/MemberSeedPayment"));
const MemberSharePurchase = lazy(() => import("./pages/MemberSharePurchase"));
const MemberContributionPayment = lazy(() => import("./pages/MemberContributionPayment"));
const MemberActivate = lazy(() => import("./pages/MemberActivate"));
const MemberDashboard = lazy(() => import("./pages/MemberDashboard"));
const MemberContributions = lazy(() => import("./pages/MemberContributions"));
const MemberLoans = lazy(() => import("./pages/MemberLoans"));
const MemberNotifications = lazy(() => import("./pages/MemberNotifications"));
const MemberProfile = lazy(() => import("./pages/MemberProfile"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminMembers = lazy(() => import("./pages/AdminMembers"));
const AdminLoans = lazy(() => import("./pages/AdminLoans"));
const AdminReports = lazy(() => import("./pages/AdminReports"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminAudit = lazy(() => import("./pages/AdminAudit"));
const AdminPenalties = lazy(() => import("./pages/AdminPenalties"));
const AdminNotifications = lazy(() => import("./pages/AdminNotifications"));
const AdminProfile = lazy(() => import("./pages/AdminProfile"));
const AdminDistributions = lazy(() => import("./pages/AdminDistributions"));
const MemberDistributions = lazy(() => import("./pages/MemberDistributions"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Contact = lazy(() => import("./pages/Contact"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const HelpArticle = lazy(() => import("./pages/HelpArticle"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,
    },
  },
});

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background p-4">
    <div className="w-full max-w-md space-y-3">
      <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/register" element={<Register />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/cookies" element={<CookiePolicy />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="/help/:articleId" element={<HelpArticle />} />
            <Route path="/admin/group-rules" element={<RequireAuth role="group_admin"><AdminGroupSetup /></RequireAuth>} />
            <Route path="/admin/subscription-fee" element={<RequireAuth role="group_admin"><MemberRegistrationPayment /></RequireAuth>} />
            <Route path="/member/registration-fee" element={<RequireAuth role="member"><MemberRegistrationPayment /></RequireAuth>} />
            <Route path="/member/registration-details" element={<RequireAuth role="member"><MemberRegistrationDetails /></RequireAuth>} />
            <Route path="/member/seed-payment" element={<RequireAuth role="member"><MemberSeedPayment /></RequireAuth>} />
            <Route path="/member/share-purchase" element={<RequireAuth role="member"><MemberSharePurchase /></RequireAuth>} />
            <Route path="/member/pay-contribution" element={<RequireAuth role="member"><MemberContributionPayment /></RequireAuth>} />
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
              path="/dashboard/distributions"
              element={
                <RequireAuth role="member">
                  <MemberDistributions />
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
            <Route
              path="/admin/distributions"
              element={
                <RequireAuth role="group_admin">
                  <AdminDistributions />
                </RequireAuth>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

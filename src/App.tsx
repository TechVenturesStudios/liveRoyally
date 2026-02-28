
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getUserFromStorage } from "@/utils/userStorage";
import { UserType } from "@/types/user";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/dashboard/Dashboard";
import VoucherPage from "./pages/dashboard/VoucherPage";
import ScanVoucher from "./pages/dashboard/ScanVoucher";
import ProvidersDashboard from "./pages/dashboard/ProvidersDashboard";
import PartnersDashboard from "./pages/dashboard/PartnersDashboard";
import DatabaseSchemaView from "./pages/dashboard/DatabaseSchemaView";
import NotFound from "./pages/NotFound";
import VoucherWorkflowPage from "./pages/dashboard/VoucherWorkflowPage";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import AdminPendingPartnersPage from "./pages/dashboard/AdminPendingPartnersPage";
import AdminPartnerAnalyticsPage from "./pages/dashboard/AdminPartnerAnalyticsPage";
import AdminMembersPage from "./pages/dashboard/AdminMembersPage";
import AdminProvidersPage from "./pages/dashboard/AdminProvidersPage";
import AdminPartnersListPage from "./pages/dashboard/AdminPartnersListPage";
import PartnerCRMDashboard from "./pages/dashboard/PartnerCRMDashboard";
import Demo from "./pages/Demo";
import ProviderEventsPage from "./pages/dashboard/ProviderEventsPage";
import ProfilePage from "./pages/dashboard/ProfilePage";
import EmailTemplatesPage from "./pages/dashboard/EmailTemplatesPage";
import PurchaseHistoryPage from "./pages/dashboard/PurchaseHistoryPage";
import NewDealsPage from "./pages/dashboard/NewDealsPage";
import EngagementScorePage from "./pages/dashboard/EngagementScorePage";
import ProviderNetworkFinder from "./pages/ProviderNetworkFinder";
import Waitlist from "./pages/Waitlist";
import ProviderPendingEventsPage from "./pages/dashboard/ProviderPendingEventsPage";
import ProviderUpcomingEventsPage from "./pages/dashboard/ProviderUpcomingEventsPage";
import PartnerPendingEventsPage from "./pages/dashboard/PartnerPendingEventsPage";
import PartnerPublishedEventsPage from "./pages/dashboard/PartnerPublishedEventsPage";
import PartnerCreateEventPage from "./pages/dashboard/PartnerCreateEventPage";
import EventAnalyticsDashboard from "./pages/dashboard/EventAnalyticsDashboard";
import AdminNetworkDetailPage from "./pages/dashboard/AdminNetworkDetailPage";
import AdminHistoricalEventsPage from "./pages/dashboard/AdminHistoricalEventsPage";
import PartnerProvidersPage from "./pages/dashboard/PartnerProvidersPage";
import ProviderRepresentativesPage from "./pages/dashboard/ProviderRepresentativesPage";

const queryClient = new QueryClient();

// Basic auth guard — redirects to login if not authenticated
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const user = getUserFromStorage();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// Role-specific guard — redirects unauthorized roles to their own dashboard
const RoleRoute = ({ children, allowed }: { children: JSX.Element; allowed: UserType[] }) => {
  const user = getUserFromStorage();
  if (!user) return <Navigate to="/login" replace />;
  if (!allowed.includes(user.userType)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <Toaster />
        <Sonner />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/waitlist" element={<Waitlist />} />
          <Route path="/join-network" element={<ProviderNetworkFinder />} />
          
          {/* Dashboard home — redirects each role to their landing page */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          
          {/* Shared routes (all authenticated users) */}
          <Route path="/dashboard/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/dashboard/score" element={<ProtectedRoute><EngagementScorePage /></ProtectedRoute>} />

          {/* ── Member-only routes ── */}
          <Route path="/dashboard/vouchers" element={<RoleRoute allowed={["member"]}><VoucherPage /></RoleRoute>} />
          <Route path="/dashboard/voucherworkflow" element={<RoleRoute allowed={["member"]}><VoucherWorkflowPage /></RoleRoute>} />
          <Route path="/dashboard/scan" element={<RoleRoute allowed={["member"]}><ScanVoucher /></RoleRoute>} />
          <Route path="/dashboard/history" element={<RoleRoute allowed={["member"]}><PurchaseHistoryPage /></RoleRoute>} />
          <Route path="/dashboard/deals" element={<RoleRoute allowed={["member"]}><NewDealsPage /></RoleRoute>} />

          {/* ── Provider-only routes ── */}
          <Route path="/dashboard/providers" element={<RoleRoute allowed={["provider"]}><ProvidersDashboard /></RoleRoute>} />
          <Route path="/dashboard/providers/events" element={<RoleRoute allowed={["provider"]}><ProviderEventsPage /></RoleRoute>} />
          <Route path="/dashboard/pending-events" element={<RoleRoute allowed={["provider"]}><ProviderPendingEventsPage /></RoleRoute>} />
          <Route path="/dashboard/upcoming-events" element={<RoleRoute allowed={["provider"]}><ProviderUpcomingEventsPage /></RoleRoute>} />
          <Route path="/dashboard/providers/representatives" element={<RoleRoute allowed={["provider"]}><ProviderRepresentativesPage /></RoleRoute>} />

          {/* ── Partner-only routes ── */}
          <Route path="/dashboard/crm" element={<RoleRoute allowed={["partner"]}><PartnerCRMDashboard /></RoleRoute>} />
          <Route path="/dashboard/my-providers" element={<RoleRoute allowed={["partner"]}><PartnerProvidersPage /></RoleRoute>} />
          <Route path="/dashboard/analytics" element={<RoleRoute allowed={["partner"]}><EventAnalyticsDashboard /></RoleRoute>} />
          <Route path="/dashboard/partners" element={<RoleRoute allowed={["partner"]}><PartnersDashboard /></RoleRoute>} />
          <Route path="/dashboard/partner-pending-events" element={<RoleRoute allowed={["partner"]}><PartnerPendingEventsPage /></RoleRoute>} />
          <Route path="/dashboard/published-events" element={<RoleRoute allowed={["partner"]}><PartnerPublishedEventsPage /></RoleRoute>} />
          <Route path="/dashboard/create-event" element={<RoleRoute allowed={["partner"]}><PartnerCreateEventPage /></RoleRoute>} />

          {/* ── Admin-only routes ── */}
          <Route path="/dashboard/admin" element={<RoleRoute allowed={["admin"]}><AdminDashboard /></RoleRoute>} />
          <Route path="/dashboard/admin/pending-partners" element={<RoleRoute allowed={["admin"]}><AdminPendingPartnersPage /></RoleRoute>} />
          <Route path="/dashboard/admin/analytics" element={<RoleRoute allowed={["admin"]}><AdminPartnerAnalyticsPage /></RoleRoute>} />
          <Route path="/dashboard/admin/members" element={<RoleRoute allowed={["admin"]}><AdminMembersPage /></RoleRoute>} />
          <Route path="/dashboard/admin/providers" element={<RoleRoute allowed={["admin"]}><AdminProvidersPage /></RoleRoute>} />
          <Route path="/dashboard/admin/partners" element={<RoleRoute allowed={["admin"]}><AdminPartnersListPage /></RoleRoute>} />
          <Route path="/dashboard/admin/network/:networkCode" element={<RoleRoute allowed={["admin"]}><AdminNetworkDetailPage /></RoleRoute>} />
          <Route path="/dashboard/admin/history" element={<RoleRoute allowed={["admin"]}><AdminHistoricalEventsPage /></RoleRoute>} />
          <Route path="/dashboard/admin/*" element={<RoleRoute allowed={["admin"]}><AdminDashboard /></RoleRoute>} />
          
          {/* Utility routes (admin-only) */}
          <Route path="/dashboard/database-schema" element={<RoleRoute allowed={["admin"]}><DatabaseSchemaView /></RoleRoute>} />
          <Route path="/dashboard/email-templates" element={<RoleRoute allowed={["admin"]}><EmailTemplatesPage /></RoleRoute>} />
          
          {/* Catch-all dashboard → redirects to role-appropriate landing */}
          <Route path="/dashboard/*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

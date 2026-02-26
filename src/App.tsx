import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getUserFromStorage } from "@/utils/userStorage";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ConfirmAccount from "./pages/ConfirmAccount";

import Dashboard from "./pages/dashboard/Dashboard";
import VoucherPage from "./pages/dashboard/VoucherPage";
import ScanVoucher from "./pages/dashboard/ScanVoucher";
import ProvidersDashboard from "./pages/dashboard/ProvidersDashboard";
import PartnersDashboard from "./pages/dashboard/PartnersDashboard";
import DatabaseSchemaView from "./pages/dashboard/DatabaseSchemaView";
import VoucherWorkflowPage from "./pages/dashboard/VoucherWorkflowPage";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import PartnerCRMDashboard from "./pages/dashboard/PartnerCRMDashboard";
import ProfilePage from "./pages/dashboard/ProfilePage";
import NotFound from "./pages/NotFound";
import PartnerPendingEvents from "./pages/dashboard/PartnerPendingEventsPage.tsx";
import PartnerPublishedEvents from "./pages/dashboard/PartnerPublishedEventsPage.tsx";
import PartnerCreateEvent from "./pages/dashboard/PartnerCreateEventPage.tsx";
import NewDeals from "./pages/dashboard/NewDealsPage.tsx";
import PurchaseHistoryPage from "./pages/dashboard/PurchaseHistoryPage.tsx";
import RoleRouter from "./pages/RoleRouter"; 
import ProviderPendingEvents from "@/pages/dashboard/ProviderPendingEventsPage";
import ProviderUpcomingEvents from "./pages/dashboard/ProviderUpcomingEventsPage.tsx";


const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const user = getUserFromStorage();

  if (!user) return <Navigate to="/login" replace />;

  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <Toaster />
        <Sonner />

        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/confirm" element={<ConfirmAccount />} />

          {/*  Role-based dashboard entry */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <RoleRouter />
              </ProtectedRoute>
            } 
          />

          {/* Other Routes (still protected) */}
          <Route path="/dashboard/partner/pending-events" element={<ProtectedRoute><PartnerPendingEvents /></ProtectedRoute>} />
          <Route path="/dashboard/partner/published-events" element={<ProtectedRoute><PartnerPublishedEvents /></ProtectedRoute>} />
          <Route path="/dashboard/partner/create-event" element={<ProtectedRoute><PartnerCreateEvent /></ProtectedRoute>} />
          <Route path="/dashboard/member/deals" element={<ProtectedRoute><NewDeals /></ProtectedRoute>} />
          <Route path="/dashboard/history" element={<ProtectedRoute><PurchaseHistoryPage /></ProtectedRoute>} />
          <Route path="/dashboard/pending-events" element={<ProviderPendingEvents />} />
          <Route path="/dashboard/upcoming-events" element={<ProviderUpcomingEvents />} />
 

          <Route path="/dashboard/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/dashboard/vouchers" element={<ProtectedRoute><VoucherPage /></ProtectedRoute>} />
          <Route path="/dashboard/voucherworkflow" element={<ProtectedRoute><VoucherWorkflowPage /></ProtectedRoute>} />
          <Route path="/dashboard/scan" element={<ProtectedRoute><ScanVoucher /></ProtectedRoute>} />
          <Route path="/dashboard/providers" element={<ProtectedRoute><ProvidersDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/partners" element={<ProtectedRoute><PartnersDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/crm" element={<ProtectedRoute><PartnerCRMDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/admin/*" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/database-schema" element={<ProtectedRoute><DatabaseSchemaView /></ProtectedRoute>} />

          <Route path="/dashboard/*" element={<ProtectedRoute><RoleRouter /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>

      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

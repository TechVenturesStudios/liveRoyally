import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getUserFromStorage } from "@/utils/userStorage";
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

const queryClient = new QueryClient();

// Protected route wrapper component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const user = getUserFromStorage();
  
  if (!user) {
    return <Navigate to="/login" replace />;
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
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected dashboard routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard/vouchers" element={<ProtectedRoute><VoucherPage /></ProtectedRoute>} />
          <Route path="/dashboard/workflow" element={<ProtectedRoute><VoucherWorkflowPage /></ProtectedRoute>} />
          <Route path="/dashboard/scan" element={<ProtectedRoute><ScanVoucher /></ProtectedRoute>} />
          <Route path="/dashboard/providers" element={<ProtectedRoute><ProvidersDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/partners" element={<ProtectedRoute><PartnersDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/database-schema" element={<ProtectedRoute><DatabaseSchemaView /></ProtectedRoute>} />
          <Route path="/dashboard/*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

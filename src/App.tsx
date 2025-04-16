
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/vouchers" element={<VoucherPage />} />
          <Route path="/dashboard/scan" element={<ScanVoucher />} />
          <Route path="/dashboard/providers" element={<ProvidersDashboard />} />
          <Route path="/dashboard/partners" element={<PartnersDashboard />} />
          <Route path="/dashboard/database-schema" element={<DatabaseSchemaView />} />
          <Route path="/dashboard/*" element={<Dashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

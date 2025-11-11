import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Quote from "./pages/Quote";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Tracking from "./pages/Tracking";
import DriverDashboard from "./pages/DriverDashboard";
import AdminDrivers from "./pages/AdminDrivers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/quote" element={<Quote />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tracking/:trackingCode" element={<Tracking />} />
          <Route path="/motorista/dashboard" element={<DriverDashboard />} />
          <Route path="/admin/motoristas" element={<AdminDrivers />} />
          <Route path="/auth" element={<Auth />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminPanel /></ProtectedRoute>} />
          <Route path="/admin/vics" element={<ProtectedRoute requiredRole="admin"><AdminPanel /></ProtectedRoute>} />
          <Route path="/admin/vics/:id" element={<ProtectedRoute requiredRole="admin"><AdminPanel /></ProtectedRoute>} />
          <Route path="/admin/verifikationen" element={<ProtectedRoute requiredRole="admin"><AdminPanel /></ProtectedRoute>} />
          <Route path="/admin/telefonnummern" element={<ProtectedRoute requiredRole="admin"><AdminPanel /></ProtectedRoute>} />
          
          <Route path="/admin/ueberpruefung" element={<ProtectedRoute requiredRole="admin"><AdminPanel /></ProtectedRoute>} />
          <Route path="/admin/dokumente" element={<ProtectedRoute requiredRole="admin"><AdminPanel /></ProtectedRoute>} />
          <Route path="/admin/emails" element={<ProtectedRoute requiredRole="admin"><AdminPanel /></ProtectedRoute>} />
          <Route path="/admin/leads" element={<ProtectedRoute requiredRole="admin"><AdminPanel /></ProtectedRoute>} />
          <Route path="/admin/leads/:id" element={<ProtectedRoute requiredRole="admin"><AdminPanel /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

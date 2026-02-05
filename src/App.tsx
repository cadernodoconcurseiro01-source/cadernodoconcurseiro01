import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { NavigationNew } from "@/components/NavigationNew";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import PomodoroPage from "./pages/PomodoroNew";
import SubjectsPage from "./pages/SubjectsNew";
import FlashcardsPage from "./pages/FlashcardsNew";
import ContestsPage from "./pages/Contests";
import SimuladosPage from "./pages/Simulados";
import StatisticsPage from "./pages/Statistics";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading } = useAuth();

  // Redirect authenticated users away from auth page
  if (!loading && user && window.location.pathname === '/auth') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {user && <NavigationNew />}
      <main>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pomodoro" 
            element={
              <ProtectedRoute>
                <PomodoroPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/subjects" 
            element={
              <ProtectedRoute>
                <SubjectsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/flashcards" 
            element={
              <ProtectedRoute>
                <FlashcardsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/contests" 
            element={
              <ProtectedRoute>
                <ContestsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/simulados" 
            element={
              <ProtectedRoute>
                <SimuladosPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/statistics" 
            element={
              <ProtectedRoute>
                <StatisticsPage />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

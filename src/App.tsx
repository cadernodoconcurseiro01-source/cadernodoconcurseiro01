import { useEffect } from "react";
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
import ContestDetailsPage from "./pages/ContestDetails";
import QuestionsPage from "./pages/Questions";
import SimuladosPage from "./pages/Simulados";
import StatisticsPage from "./pages/Statistics";
import VersePage from "./pages/Verse";
import CalendarPage from "./pages/CalendarPage";
import ProfilePage from "./pages/Profile";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { toast } from "sonner";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading } = useAuth();

  // Global error handler to prevent white screen crashes
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      event.preventDefault();
      toast.error('Ocorreu um erro. Por favor, tente novamente.');
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

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
            path="/contests/:id" 
            element={
              <ProtectedRoute>
                <ContestDetailsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/questions" 
            element={
              <ProtectedRoute>
                <QuestionsPage />
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
          <Route 
            path="/calendar" 
            element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/verse" 
            element={
              <ProtectedRoute>
                <VersePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
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
  <AppErrorBoundary>
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
  </AppErrorBoundary>
);

export default App;

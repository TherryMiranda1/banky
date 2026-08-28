import React, { useState, useEffect } from "react";
import { Routes, Route, useSearchParams } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/ui/Layout";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { LandingPage } from "@/pages/LandingPage";
import { AuthCallbackPage } from "@/pages/AuthCallbackPage";
import { Dashboard } from "@/pages/Dashboard";
import { Connect } from "@/pages/Connect";
import { AccountDetail } from "@/pages/AccountDetail";
import { CategoriesPage } from "@/pages/CategoriesPage";
import { BudgetsPage } from "@/pages/BudgetsPage";
import { CheckCircle2, X } from "lucide-react";

const AppContent: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [showConnectedToast, setShowConnectedToast] = useState<boolean>(false);

  useEffect(() => {
    if (searchParams.get("connected") === "true") {
      setShowConnectedToast(true);
      window.history.replaceState({}, document.title, window.location.pathname);
      const timer = setTimeout(() => {
        setShowConnectedToast(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/welcome" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/auth/callback"
        element={
          <ProtectedRoute>
            <AuthCallbackPage />
          </ProtectedRoute>
        }
      />

      {/* Protected App Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              {showConnectedToast && (
                <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface border border-accent/40 shadow-[0_4px_24px_-2px_rgba(0,229,160,0.25)] text-text text-sm">
                    <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-text">Banco conectado</p>
                      <p className="text-xs text-muted font-mono truncate">Cuentas sincronizadas exitosamente.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowConnectedToast(false)}
                      className="ml-2 text-muted hover:text-text cursor-pointer p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/accounts" element={<AccountDetail />} />
                <Route path="/accounts/:id" element={<AccountDetail />} />
                <Route path="/budgets" element={<BudgetsPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/connect" element={<Connect />} />
                <Route path="*" element={<Dashboard />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

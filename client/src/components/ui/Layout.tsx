import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Wallet,
  PieChart,
  Tags,
  PlusCircle,
  Search,
  Sparkles,
  RotateCcw
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { BankyLogo } from "./BankyLogo";
import { BottomNav } from "./BottomNav";
import { CutoffSettingsModal } from "./CutoffSettingsModal";
import { UserMenuPopover } from "./UserMenuPopover";
import { BreadcrumbNav } from "./BreadcrumbNav";
import { GlobalSearchModal } from "./GlobalSearchModal";

interface LayoutProps {
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user, isDemoMode, toggleMockMode, resetDemoData } = useAuth();
  const [isCutoffModalOpen, setIsCutoffModalOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Global Keyboard Shortcuts (/ and ⌘K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if ((e.key === "/" && !isInput) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Cuentas", href: "/accounts", icon: Wallet },
    { label: "Presupuestos", href: "/budgets", icon: PieChart },
    { label: "Categorías", href: "/categories", icon: Tags },
    { label: "Conectar Banco", href: "/connect", icon: PlusCircle }
  ];

  return (
    <div className="min-h-screen bg-bg text-text font-sans selection:bg-accent/20 selection:text-accent flex flex-col">
      {/* GitHub Primer Global Top Bar */}
      <header className="sticky top-0 z-30 bg-surface/95 border-b border-border backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Upper Nav Row */}
          <div className="h-14 flex items-center justify-between gap-4">
            {/* Left: Logo & Breadcrumbs */}
            <div className="flex items-center gap-3 min-w-0">
              <Link to="/" className="flex items-center gap-2 shrink-0">
                <div className="w-7 h-7 rounded-md bg-surface-elevated border border-border flex items-center justify-center p-1 shadow-xs">
                  <BankyLogo size={20} />
                </div>
              </Link>

              <BreadcrumbNav />
            </div>

            {/* Right: Search Trigger & Actions */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Command Palette Trigger Button */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-surface-elevated hover:bg-border/60 border border-border text-xs text-muted hover:text-text transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Buscar o saltar a...</span>
                <kbd className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-surface border border-border text-muted">
                  /
                </kbd>
              </button>

              {/* Mobile Search Button */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="sm:hidden p-2 rounded-md bg-surface-elevated border border-border text-muted hover:text-text cursor-pointer"
              >
                <Search className="w-4 h-4" />
              </button>

              {isDemoMode && (
                <div className="hidden xs:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono">
                  <Sparkles className="w-3 h-3 animate-pulse shrink-0" />
                  <span className="font-semibold">Mock</span>
                  <button
                    type="button"
                    onClick={resetDemoData}
                    title="Restablecer datos mock"
                    className="underline text-[11px] text-amber-300 hover:text-amber-200 ml-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3 inline" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleMockMode(false)}
                    title="Desactivar modo mock"
                    className="text-[11px] hover:underline border-l border-amber-500/30 pl-1.5 ml-1 cursor-pointer"
                  >
                    Salir
                  </button>
                </div>
              )}

              {user && (
                <UserMenuPopover onOpenCutoffModal={() => setIsCutoffModalOpen(true)} />
              )}
            </div>
          </div>

          {/* Underline Tabs Row (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 border-t border-border/40 overflow-x-auto no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? location.pathname === "/" || location.pathname === "/dashboard"
                  : location.pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                    isActive
                      ? "border-accent text-text font-semibold"
                      : "border-transparent text-muted hover:text-text hover:border-border"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-accent" : "text-muted"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content Area (Full width, native window scroll) */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-24 sm:pb-28 lg:pb-12">
        {children}
      </main>

      {/* Mobile Bottom Navigation (<1024px) */}
      <BottomNav />

      {/* Global Command Palette Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Cutoff Preferences Modal */}
      <CutoffSettingsModal
        isOpen={isCutoffModalOpen}
        onClose={() => setIsCutoffModalOpen(false)}
      />
    </div>
  );
};

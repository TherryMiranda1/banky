import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Wallet, PlusCircle, ShieldCheck, Tags, PieChart } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { BottomNav } from "./BottomNav";
import { CutoffSettingsModal } from "./CutoffSettingsModal";
import { UserMenuPopover } from "./UserMenuPopover";

interface LayoutProps {
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [isCutoffModalOpen, setIsCutoffModalOpen] = useState<boolean>(false);

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Accounts", href: "/accounts", icon: Wallet },
    { label: "Budgets", href: "/budgets", icon: PieChart },
    { label: "Categories", href: "/categories", icon: Tags },
    { label: "Connect Bank", href: "/connect", icon: PlusCircle }
  ];

  return (
    <div className="flex min-h-screen bg-bg text-text font-sans selection:bg-accent/20 selection:text-accent">
      {/* Desktop Sidebar (>= 1024px) */}
      <aside className="hidden lg:flex w-64 border-r border-border bg-surface flex-col shrink-0">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/B-logo.jpg"
              alt="Banky"
              className="w-8 h-8 rounded-lg object-cover border border-border/80 shadow-sm"
            />
            <div>
              <h1 className="font-bold text-base tracking-tight text-text">Banky</h1>
              <p className="text-xs text-muted font-mono">Open Banking AISP</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          </div>
        </div>

        <nav className="p-4 space-y-1 flex-1">
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted font-mono">
            Navigation
          </div>
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${
                  isActive
                    ? "bg-accent/10 text-accent border border-accent/20 shadow-sm"
                    : "text-muted hover:text-text hover:bg-border/50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-accent" : "text-muted"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border bg-bg/50 space-y-3">
          <div className="flex items-center gap-3 p-2 rounded-md bg-surface border border-border/80 text-xs">
            <ShieldCheck className="w-4 h-4 text-accent shrink-0" />
            <div className="truncate">
              <p className="font-medium text-text">Read-Only AISP</p>
              <p className="text-muted text-[11px] truncate font-mono">AES-256-GCM Vault</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Minimalist Top Header */}
        <header className="h-14 lg:h-16 border-b border-border bg-surface/60 backdrop-blur px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile / Tablet Logo (<1024px) */}
            <Link to="/" className="flex items-center gap-2.5 lg:hidden">
              <img
                src="/B-logo.jpg"
                alt="Banky"
                className="w-7 h-7 rounded-lg object-cover border border-border/80 shadow-sm"
              />
              <span className="font-bold text-base tracking-tight text-text">Banky</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <UserMenuPopover onOpenCutoffModal={() => setIsCutoffModalOpen(true)} />
            )}
          </div>
        </header>

        {/* Content Container (with generous bottom padding for BottomNav on mobile) */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-32 sm:pb-36 lg:pb-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Cutoff Preferences Modal */}
      <CutoffSettingsModal
        isOpen={isCutoffModalOpen}
        onClose={() => setIsCutoffModalOpen(false)}
      />
    </div>
  );
};


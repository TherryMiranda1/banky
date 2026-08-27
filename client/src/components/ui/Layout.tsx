import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Wallet, PlusCircle, ShieldCheck, Activity, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { BottomNav } from "./BottomNav";

interface LayoutProps {
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Accounts", href: "/accounts", icon: Wallet },
    { label: "Connect Bank", href: "/connect", icon: PlusCircle }
  ];

  return (
    <div className="flex min-h-screen bg-bg text-text font-sans selection:bg-accent/20 selection:text-accent">
      {/* Desktop Sidebar (>= 1024px) */}
      <aside className="hidden lg:flex w-64 border-r border-border bg-surface flex-col shrink-0">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/Banky.jpg"
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
          {user && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border/80 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center text-accent shrink-0 font-bold text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="truncate">
                  <p className="font-semibold text-text truncate">{user.name}</p>
                  <p className="text-muted text-[10px] truncate font-mono">{user.email}</p>
                </div>
              </div>
              <button
                onClick={logout}
                title="Cerrar sesión"
                className="text-muted hover:text-red-400 p-1.5 rounded-md hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

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
        {/* Top Header */}
        <header className="h-14 lg:h-16 border-b border-border bg-surface/60 backdrop-blur px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile / Tablet Logo (<1024px) */}
            <div className="flex items-center gap-2.5 lg:hidden">
              <img
                src="/Banky.jpg"
                alt="Banky"
                className="w-7 h-7 rounded-lg object-cover border border-border/80"
              />
              <span className="font-bold text-base tracking-tight text-text">Banky</span>
            </div>

            {/* Desktop system indicator */}
            <div className="hidden lg:flex items-center gap-2">
              <Activity className="w-4 h-4 text-accent" />
              <span className="text-xs font-mono text-muted uppercase tracking-wider">
                System State: Active
              </span>
            </div>

            {/* Mobile status pill */}
            <div className="flex lg:hidden items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface border border-border text-[11px] font-mono text-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="hidden sm:inline">Active</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <span className="text-xs font-semibold text-text block">{user.name}</span>
                  <span className="text-[10px] text-muted font-mono">{user.email}</span>
                </div>
                <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center text-accent shrink-0 font-bold text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={logout}
                  className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-red-400 hover:bg-red-500/10 border border-border hover:border-red-500/20 transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Salir</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content Container (with bottom padding for BottomNav on mobile) */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
};


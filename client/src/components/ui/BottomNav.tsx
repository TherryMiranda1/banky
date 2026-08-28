import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Wallet, PlusCircle, Tags, PieChart } from "lucide-react";

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname;

  const navItems = [
    {
      label: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      isActive: pathname === "/" || pathname === "/dashboard"
    },
    {
      label: "Cuentas",
      href: "/accounts",
      icon: Wallet,
      isActive: pathname.startsWith("/accounts")
    },
    {
      label: "Presupuestos",
      href: "/budgets",
      icon: PieChart,
      isActive: pathname.startsWith("/budgets")
    },
    {
      label: "Categorías",
      href: "/categories",
      icon: Tags,
      isActive: pathname.startsWith("/categories")
    },
    {
      label: "Conectar",
      href: "/connect",
      icon: PlusCircle,
      isActive: pathname === "/connect"
    }
  ];

  return (
    <nav aria-label="Mobile Navigation" className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border mobile-bottom-nav shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
      <div className="grid grid-cols-5 h-14 max-w-lg mx-auto px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.isActive;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex flex-col items-center justify-center min-h-[56px] py-1.5 transition-all duration-150 ${
                isActive ? "text-accent" : "text-muted hover:text-text"
              }`}
            >
              <div
                className={`flex items-center justify-center px-4 py-1 rounded-full transition-colors ${
                  isActive ? "bg-accent/10 text-accent" : ""
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-accent" : "text-muted"}`} />
              </div>
              <span className="text-[11px] font-medium font-sans tracking-tight mt-0.5">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

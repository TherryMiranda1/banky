import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export const BreadcrumbNav: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;

  let currentSection = "Dashboard";
  let sectionHref = "/";

  if (path.startsWith("/accounts")) {
    currentSection = "Cuentas";
    sectionHref = "/accounts";
  } else if (path.startsWith("/budgets")) {
    currentSection = "Presupuestos";
    sectionHref = "/budgets";
  } else if (path.startsWith("/categories")) {
    currentSection = "Categorías";
    sectionHref = "/categories";
  } else if (path.startsWith("/connect")) {
    currentSection = "Conectar Banco";
    sectionHref = "/connect";
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-mono">
      <Link
        to="/"
        className="font-bold text-text hover:text-white transition-colors"
      >
        Banky
      </Link>

      <ChevronRight className="w-3 h-3 text-muted/60" />

      <Link
        to={sectionHref}
        className="text-muted hover:text-text transition-colors truncate max-w-[140px] sm:max-w-none"
      >
        {currentSection}
      </Link>
    </nav>
  );
};

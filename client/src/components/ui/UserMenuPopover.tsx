import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  SlidersHorizontal,
  Tags,
  PlusCircle,
  ShieldCheck,
  LogOut,
  ChevronDown,
  CheckCircle,
  RotateCcw,
  Sparkles
} from "lucide-react";

import { formatFirstName } from "@/lib/format-utils";

interface UserMenuPopoverProps {
  onOpenCutoffModal: () => void;
}

export const UserMenuPopover: React.FC<UserMenuPopoverProps> = ({ onOpenCutoffModal }) => {
  const { user, logout, isDemoMode, toggleMockMode, resetDemoData } = useAuth();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (!user) return null;

  const firstName = formatFirstName(user.name, "Usuario");
  const initial = firstName.charAt(0).toUpperCase();
  const cutoffLabel = user.cutoffDay ? `Día ${user.cutoffDay}` : "Día 1";

  return (
    <div className="relative" ref={popoverRef}>
      {/* Avatar Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-surface border border-border/80 hover:border-accent/40 text-text transition-all cursor-pointer shadow-sm hover:shadow-[0_0_12px_rgba(0,229,160,0.15)] group"
      >
        <div className="w-7 h-7 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
          {initial}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-xs font-semibold text-text leading-tight group-hover:text-accent transition-colors max-w-[120px] truncate">
            {firstName}
          </p>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted transition-transform duration-200 ${
            isOpen ? "rotate-180 text-accent" : "group-hover:text-text"
          }`}
        />
      </button>

      {/* Floating Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-surface border border-border rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2">
          {/* User Profile Header */}
          <div className="p-3 rounded-xl bg-bg/60 border border-border/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent font-bold text-sm shrink-0">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-sm text-text truncate">{firstName}</p>
                {isDemoMode && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 text-[10px] font-mono border border-amber-500/30">
                    <Sparkles className="w-2.5 h-2.5" />
                    Demo
                  </span>
                )}
              </div>
              <p className="text-muted text-xs truncate font-mono">{user.email}</p>
            </div>
          </div>

          {/* Mock Mode Global Toggle Switch */}
          <div className="p-2.5 rounded-xl bg-bg/80 border border-border/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <Sparkles className={`w-4 h-4 shrink-0 ${isDemoMode ? "text-amber-400" : "text-muted"}`} />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-text truncate">Modo Mock</p>
                <p className="text-[10px] text-muted font-mono truncate">Datos simulados en toda la app</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isDemoMode}
              onClick={() => toggleMockMode(!isDemoMode)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isDemoMode ? "bg-amber-400" : "bg-border hover:bg-border/80"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-surface shadow ring-0 transition duration-200 ease-in-out ${
                  isDemoMode ? "translate-x-4 bg-bg" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Quick Actions List */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenCutoffModal();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-border/40 text-xs font-medium text-text transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal className="w-4 h-4 text-accent" />
                <span>Día de Corte Financiero</span>
              </div>
              <span className="font-mono font-bold text-accent text-[11px] px-2 py-0.5 rounded-md bg-accent/10 border border-accent/20">
                {cutoffLabel}
              </span>
            </button>

            <Link
              to="/categories"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-border/40 text-xs font-medium text-text transition-colors"
            >
              <Tags className="w-4 h-4 text-muted group-hover:text-text" />
              <span>Categorías y Reglas</span>
            </Link>

            <Link
              to="/connect"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-border/40 text-xs font-medium text-text transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-muted group-hover:text-text" />
              <span>Conectar Nuevo Banco</span>
            </Link>

            {isDemoMode && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  resetDemoData();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-amber-500/10 text-amber-400 text-xs font-medium transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>Restablecer datos de prueba</span>
              </button>
            )}
          </div>


          {/* AISP Security Badge */}
          <div className="p-2.5 rounded-xl bg-surface border border-border/60 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2 text-muted font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              <span>Read-Only AISP Vault</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] text-accent font-mono">
              <CheckCircle className="w-3 h-3" />
              {isDemoMode ? "Mock" : "Active"}
            </span>
          </div>

          <div className="border-t border-border/60 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-negative/10 text-negative hover:text-negative text-xs font-medium transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{isDemoMode ? "Salir del Modo Demo" : "Cerrar Sesión"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { BankyLogo } from "@/components/ui/BankyLogo";
import { DeployGuideSection } from "@/components/landing/DeployGuideSection";
import { OnlineBankingSetupSection } from "@/components/landing/OnlineBankingSetupSection";
import {
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight,
  Lock,
  PieChart,
  Wallet,
  CheckCircle2,
  ChevronDown
} from "lucide-react";

export const LandingPage: React.FC = () => {
  const { loginDemo } = useAuth();
  const navigate = useNavigate();
  const [isDemoLoading, setIsDemoLoading] = useState<boolean>(false);

  const handleLaunchDemo = async () => {
    setIsDemoLoading(true);
    try {
      await loginDemo();
      navigate("/", { replace: true });
    } catch {
      setIsDemoLoading(false);
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text font-sans selection:bg-accent/20 selection:text-accent relative overflow-x-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-accent/[0.04] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-0 w-[400px] h-[400px] bg-accent/[0.02] rounded-full blur-[100px] pointer-events-none" />

      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-bg/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface border border-border/80 flex items-center justify-center shadow-sm p-1">
              <BankyLogo size={24} />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-text">Banky</span>
              <span className="ml-2 hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono bg-accent/10 text-accent border border-accent/20">
                AISP Serverless
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs text-muted font-medium">
            <button
              type="button"
              onClick={() => scrollToSection("features")}
              className="hover:text-text transition-colors cursor-pointer"
            >
              Características
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("online-banking")}
              className="hover:text-text transition-colors cursor-pointer"
            >
              Open Banking
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("architecture")}
              className="hover:text-text transition-colors cursor-pointer"
            >
              Arquitectura
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("deploy")}
              className="hover:text-text transition-colors cursor-pointer"
            >
              Despliegue
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-3.5 py-1.5 rounded-lg text-xs text-text hover:text-accent font-medium transition-colors"
            >
              Entrar
            </Link>
            <button
              type="button"
              onClick={handleLaunchDemo}
              disabled={isDemoLoading}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-accent text-bg font-semibold text-xs shadow-lg shadow-accent/20 hover:bg-accent/90 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isDemoLoading ? "Iniciando..." : "Demo en Vivo"}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 space-y-24 sm:space-y-32">
        <section className="text-center space-y-6 max-w-3xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-border text-xs font-mono text-muted shadow-sm">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span>Open Banking AISP (Enable Banking PSD2)</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-text leading-[1.1]">
            Tu panel bancario consolidado.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-emerald-400 to-teal-300">
              100% Serverless.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-muted max-w-2xl mx-auto leading-relaxed">
            Conecta Santander, Revolut y más de 2.000 entidades bancarias con acceso de solo lectura.
            Tokens cifrados en el Edge con AES-256-GCM y cero costo de infraestructura.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={handleLaunchDemo}
              disabled={isDemoLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent text-bg font-bold text-sm shadow-xl shadow-accent/25 hover:bg-accent/90 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isDemoLoading ? "Cargando entorno..." : "Explorar Demo Interactiva"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => scrollToSection("deploy")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-surface border border-border text-text hover:border-accent/40 font-medium text-sm transition-all cursor-pointer"
            >
              <span>Ver Guía de Despliegue</span>
              <ChevronDown className="w-4 h-4 text-muted" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-10 border-t border-border/60 text-left">
            <div className="p-3 rounded-xl bg-surface/50 border border-border/40">
              <p className="text-xs text-muted font-mono">Tipo de Acceso</p>
              <p className="text-sm font-semibold text-text mt-0.5">AISP Solo Lectura</p>
            </div>
            <div className="p-3 rounded-xl bg-surface/50 border border-border/40">
              <p className="text-xs text-muted font-mono">Criptografía</p>
              <p className="text-sm font-semibold text-text mt-0.5">AES-256-GCM Vault</p>
            </div>
            <div className="p-3 rounded-xl bg-surface/50 border border-border/40">
              <p className="text-xs text-muted font-mono">Infraestructura</p>
              <p className="text-sm font-semibold text-text mt-0.5">Cloudflare Edge + D1</p>
            </div>
            <div className="p-3 rounded-xl bg-surface/50 border border-border/40">
              <p className="text-xs text-muted font-mono">Costos de Servidor</p>
              <p className="text-sm font-semibold text-accent mt-0.5">$0 (Free Tier)</p>
            </div>
          </div>
        </section>

        <section id="features" className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
              Diseñado para control y privacidad total
            </h2>
            <p className="text-sm text-muted max-w-xl mx-auto">
              Sin intermediarios opacos, sin sincronizaciones no autorizadas y con código 100% auditable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col justify-between space-y-4 hover:border-accent/30 transition-colors">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                  <Wallet className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-text">Multi-Banco Unificado</h3>
                <p className="text-xs sm:text-sm text-muted leading-relaxed">
                  Conexión directa a Santander, Revolut y más entidades mediante Enable Banking. Balances consolidados y transacciones sincronizadas en tiempo real.
                </p>
              </div>
              <div className="pt-3 border-t border-border/60 flex items-center gap-2 text-xs font-mono text-accent">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Protocolo PSD2 / AISP</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col justify-between space-y-4 hover:border-accent/30 transition-colors">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-text">Seguridad Criptográfica</h3>
                <p className="text-xs sm:text-sm text-muted leading-relaxed">
                  Las credenciales y session_ids bancarios se almacenan en reposo cifrados con AES-256-GCM. Autenticación de usuarios vía PBKDF2 con 100.000 iteraciones y JWT.
                </p>
              </div>
              <div className="pt-3 border-t border-border/60 flex items-center gap-2 text-xs font-mono text-accent">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Web Crypto API Nativa</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col justify-between space-y-4 hover:border-accent/30 transition-colors">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                  <PieChart className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-text">Presupuestos y Categorías</h3>
                <p className="text-xs sm:text-sm text-muted leading-relaxed">
                  Clasificación de movimientos, metas de gasto mensuales y personalización del día de corte financiero (ej. día 25 o 1 del mes).
                </p>
              </div>
              <div className="pt-3 border-t border-border/60 flex items-center gap-2 text-xs font-mono text-accent">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Cálculo en Edge Instantáneo</span>
              </div>
            </div>
          </div>
        </section>

        <section id="architecture" className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
              Arquitectura Desacoplada en Cloudflare
            </h2>
            <p className="text-sm text-muted max-w-xl mx-auto">
              Sin servidores que mantener. Despliegue en la red global de Cloudflare con latencia ultra baja.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-border space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div className="p-4 rounded-xl bg-bg border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-text">Client SPA</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/10 text-accent">Pages</span>
                </div>
                <p className="text-xs text-muted">React 19, Vite, Tailwind v4, Router v7 y cliente HTTP con interceptor Bearer.</p>
              </div>

              <div className="p-4 rounded-xl bg-bg border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-text">API Worker</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/10 text-accent">Workers</span>
                </div>
                <p className="text-xs text-muted">Hono + Zod, sub-routers modulares, criptografía Web Crypto y autenticación JWT.</p>
              </div>

              <div className="p-4 rounded-xl bg-bg border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-text">Base de Datos</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/10 text-accent">D1 (SQLite)</span>
                </div>
                <p className="text-xs text-muted">Cloudflare D1 distribuido con interfaz unificada IDatabase para tests locales.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-bg/50 border border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-muted">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-accent shrink-0" />
                <span>Patrón Ports & Adapters: aislamiento total de Enable Banking API</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent shrink-0" />
                <span>Modo Mock disponible sin credenciales bancarias</span>
              </div>
            </div>
          </div>
        </section>

        <OnlineBankingSetupSection />

        <section id="deploy" className="space-y-8">
          <DeployGuideSection />
        </section>

        <section className="text-center p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-surface to-bg border border-border space-y-6 relative overflow-hidden">
          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-3xl font-extrabold text-text">¿Listo para probar Banky?</h2>
            <p className="text-sm text-muted">
              Inicia sesión con tu cuenta personal o lanza la demo interactiva sin necesidad de registro previo.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="px-6 py-2.5 rounded-xl bg-accent text-bg font-bold text-sm shadow-lg shadow-accent/20 hover:bg-accent/90 transition-all"
            >
              Crear Cuenta
            </Link>
            <Link
              to="/login"
              className="px-6 py-2.5 rounded-xl bg-surface border border-border text-text hover:border-accent/40 font-medium text-sm transition-all"
            >
              Iniciar Sesión
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/80 py-8 bg-surface/50 text-xs text-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BankyLogo size={18} />
            <span className="font-semibold text-text">Banky</span>
            <span>— Open Banking AISP Dashboard</span>
          </div>
          <div className="flex items-center gap-4 font-mono">
            <Link to="/login" className="hover:text-text transition-colors">App</Link>
            <Link to="/register" className="hover:text-text transition-colors">Registro</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

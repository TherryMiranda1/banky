import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { Lock, Mail, ArrowRight, AlertCircle, Loader2, Sparkles } from "lucide-react";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDemoSubmitting, setIsDemoSubmitting] = useState(false);

  const { login, loginDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Por favor completa todos los campos");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.message || "Error al iniciar sesión. Verifica tus credenciales.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsDemoSubmitting(true);
    setError(null);
    try {
      await loginDemo();
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err?.message || "Error al activar el modo demo.");
    } finally {
      setIsDemoSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-bg flex flex-col p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-accent/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="m-auto w-full max-w-md relative z-10 py-6">
        <div className="text-center mb-6">
          <div className="inline-flex justify-center items-center gap-3 mb-4">
            <img
              src="/B-logo.jpg"
              alt="Banky"
              className="w-12 h-12 rounded-xl object-cover border border-border shadow-lg shadow-accent/10"
            />
            <span className="text-3xl font-bold tracking-tight text-text font-sans">Banky</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-text">
            Iniciar Sesión
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-muted">
            Accede a tu panel financiero consolidado
          </p>
        </div>

        <div className="bg-surface/90 backdrop-blur-xl border border-border py-8 px-5 sm:px-10 shadow-2xl rounded-2xl">
          {error && (
            <div className="mb-6 bg-negative/10 border border-negative/30 p-3.5 rounded-xl flex items-start gap-3 text-negative text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted font-mono mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full pl-10 pr-4 py-2.5 min-h-[44px] bg-bg border border-border rounded-xl text-text placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted font-mono mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 min-h-[44px] bg-bg border border-border rounded-xl text-text placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent text-sm transition-all"
                />
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={isSubmitting || isDemoSubmitting}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 min-h-[44px] rounded-xl text-sm font-semibold text-bg bg-accent hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <>
                    <span>Entrar a Banky</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-border/80"></div>
                <span className="flex-shrink mx-3 text-muted text-[11px] font-mono uppercase tracking-wider">o pruébalo sin registro</span>
                <div className="flex-grow border-t border-border/80"></div>
              </div>

              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={isSubmitting || isDemoSubmitting}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 min-h-[44px] rounded-xl text-sm font-medium text-text bg-surface hover:bg-border/60 border border-border/80 hover:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent transition-all duration-200 cursor-pointer shadow-sm group"
              >
                {isDemoSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-accent" />
                    <span>Cargando datos demo...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
                    <span>Explorar en Modo Demo (Datos de prueba)</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-border/80 pt-5 text-center">
            <p className="text-xs sm:text-sm text-muted">
              ¿No tienes una cuenta aún?{" "}
              <Link
                to="/register"
                className="font-medium text-accent hover:text-accent/90 transition-colors"
              >
                Crear cuenta nueva
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};


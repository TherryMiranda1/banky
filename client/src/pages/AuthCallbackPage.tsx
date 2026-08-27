import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { completeAuthCallback } from "../lib/api/auth.js";
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft, Building2 } from "lucide-react";

export const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const code = searchParams.get("code") || undefined;
    const state = searchParams.get("state");
    const error = searchParams.get("error") || undefined;
    const errorDescription = searchParams.get("error_description") || undefined;

    if (error) {
      setStatus("error");
      setErrorMessage(errorDescription || error || "La autorización fue cancelada o rechazada por el banco.");
      return;
    }

    if (!state) {
      setStatus("error");
      setErrorMessage("Parámetro de estado inválido o ausente en la respuesta del banco.");
      return;
    }

    const validState = state;

    async function process() {
      try {
        await completeAuthCallback({
          code,
          state: validState,
          error,
          error_description: errorDescription
        });

        setStatus("success");
        setTimeout(() => {
          navigate("/?connected=true", { replace: true });
        }, 1200);
      } catch (err: any) {
        setStatus("error");
        setErrorMessage(err?.message || "Error al completar la vinculación con el banco.");
      }
    }

    process();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6 relative overflow-hidden text-slate-100">
      {/* Glow effect */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 shadow-2xl rounded-2xl text-center">
          {status === "loading" && (
            <div className="flex flex-col items-center py-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white mb-2">
                Conectando con tu banco
              </h2>
              <p className="text-sm text-slate-400 max-w-xs font-mono">
                Verificando credenciales y sincronizando cuentas bancarias...
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center py-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white mb-2">
                ¡Banco vinculado con éxito!
              </h2>
              <p className="text-sm text-slate-400 font-mono">
                Redirigiendo a tu panel financiero...
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center py-4 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-6">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white mb-2">
                No pudimos vincular la cuenta
              </h2>
              <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 p-3 rounded-xl mb-6 w-full text-left font-mono text-xs">
                {errorMessage}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Link
                  to="/connect"
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Reintentar</span>
                </Link>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Ir al panel</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { formatCyclePeriod, getCurrentPeriod } from "@/lib/cycle-utils";
import { Calendar, Check, X, AlertCircle, Sparkles } from "lucide-react";

interface CutoffSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESETS = [
  { day: 1, label: "Día 1 (Mes natural)" },
  { day: 15, label: "Día 15 (Mediados)" },
  { day: 21, label: "Día 21 (Recomendado)" },
  { day: 25, label: "Día 25 (Nómina)" }
];

export const CutoffSettingsModal: React.FC<CutoffSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user, updateCutoffDay } = useAuth();
  const [selectedDay, setSelectedDay] = useState<number>(() => user?.cutoffDay || 1);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedDay(user?.cutoffDay || 1);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, user?.cutoffDay]);

  if (!isOpen) return null;

  const validDay = Math.min(31, Math.max(1, selectedDay || 1));
  const currentPeriod = getCurrentPeriod(validDay);
  const cycleInfo = formatCyclePeriod(currentPeriod, validDay);

  const handleSave = async () => {
    const dayToSave = Math.min(31, Math.max(1, selectedDay || 1));

    try {
      setIsSaving(true);
      setError(null);
      await updateCutoffDay(dayToSave);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 800);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al guardar el día de corte";
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text">Día de Corte Financiero</h2>
              <p className="text-xs text-muted font-mono">Personalizar ciclo mensual</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-border/40 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-muted leading-relaxed">
            Las transacciones, balances y analíticas se agruparán según el día de corte que definas (por defecto, Día 1).
          </p>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted block">
              Accesos rápidos
            </span>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.day}
                  type="button"
                  onClick={() => setSelectedDay(preset.day)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium text-left border transition-all cursor-pointer ${
                    validDay === preset.day
                      ? "bg-accent/10 border-accent text-accent font-semibold"
                      : "bg-bg/50 border-border text-muted hover:text-text hover:border-border/80"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Numeric Input / Slider */}
          <div className="p-4 rounded-xl bg-bg/50 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="cutoff-day-input" className="text-xs font-medium text-text">
                Día del mes (1 - 31)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted">Día:</span>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={selectedDay}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setSelectedDay(isNaN(val) ? 1 : Math.min(31, Math.max(1, val)));
                  }}
                  className="w-16 px-2 py-1 text-right text-sm font-bold font-mono text-accent bg-surface border border-border rounded-lg focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <input
              id="cutoff-day-input"
              type="range"
              min="1"
              max="31"
              value={validDay}
              onChange={(e) => setSelectedDay(parseInt(e.target.value, 10))}
              className="w-full accent-accent cursor-pointer h-2 bg-border rounded-lg"
            />
          </div>

          {/* Live Preview */}
          <div className="p-3.5 rounded-xl bg-surface border border-accent/30 space-y-1.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span className="text-[11px] font-mono text-muted uppercase tracking-wider">
                Previsualización del ciclo actual
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold text-text">{cycleInfo.label}</span>
              <span className="text-xs font-mono text-accent font-semibold">
                {cycleInfo.rangeLabel}
              </span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-negative/10 border border-negative/20 text-negative text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-surface border border-border text-muted hover:text-text text-xs font-semibold cursor-pointer transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || success}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              success
                ? "bg-accent text-bg"
                : "bg-accent text-bg hover:bg-accent/90 shadow-[0_0_16px_rgba(0,229,160,0.3)]"
            }`}
          >
            {success ? (
              <>
                <Check className="w-4 h-4" />
                <span>Guardado</span>
              </>
            ) : isSaving ? (
              <span>Guardando...</span>
            ) : (
              <span>Guardar Preferencia</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

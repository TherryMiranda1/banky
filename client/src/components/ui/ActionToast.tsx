import React, { useEffect, useState } from "react";
import { X, Sparkles, Loader2 } from "lucide-react";

export interface ActionToastProps {
  isOpen: boolean;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
  durationMs?: number;
  isLoadingAction?: boolean;
}

export const ActionToast: React.FC<ActionToastProps> = ({
  isOpen,
  message,
  actionLabel = "Crear regla",
  onAction,
  onDismiss,
  durationMs = 5000,
  isLoadingAction = false
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!isOpen) {
      setProgress(100);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / durationMs) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isOpen, durationMs, onDismiss]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-50 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-surface/95 backdrop-blur-md border border-accent/40 rounded-xl shadow-2xl overflow-hidden p-3.5 sm:p-4 text-text flex items-center justify-between gap-3 sm:gap-4 relative">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0 border border-accent/30">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <p className="text-xs sm:text-sm font-medium text-text leading-tight truncate">
            {message}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onAction && (
            <button
              type="button"
              onClick={onAction}
              disabled={isLoadingAction}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-bg font-semibold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isLoadingAction ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creando...</span>
                </>
              ) : (
                <span>{actionLabel}</span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onDismiss}
            aria-label="Cerrar notificación"
            className="text-muted hover:text-text p-1 rounded-md hover:bg-border/50 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Countdown progress line */}
        <div
          style={{ width: `${progress}%` }}
          className="absolute bottom-0 left-0 h-0.5 bg-accent transition-all duration-75 ease-linear"
        />
      </div>
    </div>
  );
};

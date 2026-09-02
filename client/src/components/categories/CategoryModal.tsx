import React, { useState, useEffect } from "react";
import {
  X,
  ShoppingBag,
  Home,
  Car,
  Utensils,
  Film,
  Sparkles,
  Zap,
  Briefcase,
  CreditCard,
  HeartPulse,
  Plane,
  Gift,
  Tag,
  Dumbbell,
  GraduationCap,
  LucideIcon
} from "lucide-react";
import { CategoryItem } from "@/lib/api/categories";
import { AVAILABLE_REALM_SPRITES, RealmSpriteOption } from "@/lib/realm/sprite-map";

export const ICON_MAP: Record<string, LucideIcon> = {
  ShoppingBag,
  Home,
  Car,
  Utensils,
  Film,
  Sparkles,
  Zap,
  Briefcase,
  CreditCard,
  HeartPulse,
  Plane,
  Gift,
  Tag,
  Dumbbell,
  GraduationCap
};

export const COLOR_PALETTE = [
  "#00E5A0",
  "#10B981",
  "#3B82F6",
  "#6366F1",
  "#A855F7",
  "#EC4899",
  "#F43F5E",
  "#EF4444",
  "#F97316",
  "#F59E0B",
  "#EAB308",
  "#06B6D4"
];

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToEdit?: CategoryItem | null;
  onSave: (data: { name: string; color: string; icon: string; realmSprite?: string | null }) => Promise<void>;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  categoryToEdit,
  onSave
}) => {
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLOR_PALETTE[0]);
  const [icon, setIcon] = useState("Tag");
  const [realmSprite, setRealmSprite] = useState<string>("home");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name);
      setColor(categoryToEdit.color);
      setIcon(categoryToEdit.icon);
      setRealmSprite(categoryToEdit.realmSprite || "home");
    } else {
      setName("");
      setColor(COLOR_PALETTE[0]);
      setIcon("Tag");
      setRealmSprite("home");
    }
    setError(null);
  }, [categoryToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre de la categoría es requerido.");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await onSave({ name: name.trim(), color, icon, realmSprite });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar la categoría");
    } finally {
      setSubmitting(false);
    }
  };

  const SelectedIcon = ICON_MAP[icon] || Tag;
  const selectedSpriteObj = AVAILABLE_REALM_SPRITES.find((s) => s.key === realmSprite) || AVAILABLE_REALM_SPRITES[3];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-xl max-w-lg w-full max-h-[90vh] flex flex-col p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-border mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              style={{ color, backgroundColor: `${color}20`, borderColor: `${color}40` }}
              className="w-8 h-8 rounded-lg flex items-center justify-center border shrink-0"
            >
              <SelectedIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-text">
                {categoryToEdit ? "Editar Categoría" : "Nueva Categoría"}
              </h3>
              <p className="text-xs text-muted font-mono">Personalizá color, ícono y su edificio en el Reino</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-text p-1 rounded-lg hover:bg-border/40 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono shrink-0">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted mb-1.5">
              Nombre de la categoría
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Supermercado, Gimnasio, Freelance"
              className="w-full px-3 py-2 rounded-lg bg-bg border border-border text-sm text-text placeholder:text-muted/60 focus:outline-hidden focus:border-accent font-sans"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted mb-1.5">
              Color Distintivo
            </label>
            <div className="grid grid-cols-6 gap-2">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`h-7 rounded-lg transition-transform cursor-pointer flex items-center justify-center ${
                    color === c ? "ring-2 ring-white scale-105 shadow-sm" : "hover:scale-105 opacity-80 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted mb-1.5">
              Ícono de UI
            </label>
            <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto p-1 bg-bg/50 rounded-lg border border-border/60">
              {Object.entries(ICON_MAP).map(([key, IconComp]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIcon(key)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors cursor-pointer ${
                    icon === key
                      ? "bg-accent/15 text-accent border border-accent/40"
                      : "text-muted hover:text-text hover:bg-surface border border-transparent"
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                  <span className="text-[9px] font-mono mt-1 truncate max-w-full">{key}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-mono uppercase tracking-wider text-muted">
                Edificio en el Reino (Phaser)
              </label>
              <span className="text-[11px] font-mono text-accent flex items-center gap-1.5">
                <img src={selectedSpriteObj.assetPath} alt="" className="w-4 h-4 object-contain pixelated" />
                {selectedSpriteObj.name}
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-2 bg-bg/50 rounded-lg border border-border/60">
              {AVAILABLE_REALM_SPRITES.map((sprite: RealmSpriteOption) => {
                const isSelected = realmSprite === sprite.key;
                return (
                  <button
                    key={sprite.key}
                    type="button"
                    onClick={() => setRealmSprite(sprite.key)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all text-center cursor-pointer border ${
                      isSelected
                        ? "bg-accent/15 border-accent text-text shadow-xs"
                        : "bg-surface/50 border-border/50 text-muted hover:text-text hover:bg-surface hover:border-border"
                    }`}
                  >
                    <img
                      src={sprite.assetPath}
                      alt={sprite.name}
                      className="w-8 h-8 object-contain mb-1 drop-shadow-xs pixelated"
                    />
                    <span className="text-[10px] font-semibold tracking-tight truncate max-w-full">
                      {sprite.name}
                    </span>
                    <span className="text-[8px] text-muted truncate max-w-full font-mono">
                      {sprite.key}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-muted hover:text-text rounded-lg border border-border hover:bg-border/30 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold bg-accent text-bg hover:brightness-110 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Guardando..." : categoryToEdit ? "Actualizar" : "Crear Categoría"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

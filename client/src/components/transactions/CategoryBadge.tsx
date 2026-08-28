import React from "react";

interface CategoryBadgeProps {
  category: string | null;
  color?: string | null;
  className?: string;
}

function getCategoryStyle(category: string | null): { bg: string; text: string; border: string } {
  if (!category) {
    return {
      bg: "bg-surface",
      text: "text-muted",
      border: "border-border/60"
    };
  }

  const normalized = category.toLowerCase();

  if (normalized.includes("income") || normalized.includes("salary") || normalized.includes("nomina")) {
    return {
      bg: "bg-accent/15",
      text: "text-accent",
      border: "border-accent/30"
    };
  }

  if (normalized.includes("groceries") || normalized.includes("supermarket") || normalized.includes("alimentaci")) {
    return {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/20"
    };
  }

  if (normalized.includes("transport") || normalized.includes("gas") || normalized.includes("fuel")) {
    return {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      border: "border-amber-500/20"
    };
  }

  if (normalized.includes("entertainment") || normalized.includes("subscription") || normalized.includes("ocio")) {
    return {
      bg: "bg-purple-500/10",
      text: "text-purple-400",
      border: "border-purple-500/20"
    };
  }

  if (normalized.includes("dining") || normalized.includes("restaurant") || normalized.includes("cafe")) {
    return {
      bg: "bg-orange-500/10",
      text: "text-orange-400",
      border: "border-orange-500/20"
    };
  }

  if (normalized.includes("utilities") || normalized.includes("bill") || normalized.includes("servicio") || normalized.includes("vivienda")) {
    return {
      bg: "bg-cyan-500/10",
      text: "text-cyan-400",
      border: "border-cyan-500/20"
    };
  }

  if (normalized.includes("transfer") || normalized.includes("traspaso")) {
    return {
      bg: "bg-sky-500/10",
      text: "text-sky-400",
      border: "border-sky-500/20"
    };
  }

  if (normalized.includes("health") || normalized.includes("pharmacy")) {
    return {
      bg: "bg-rose-500/10",
      text: "text-rose-400",
      border: "border-rose-500/20"
    };
  }

  // Fallback: subtle accent tint
  return {
    bg: "bg-accent/5",
    text: "text-text/80",
    border: "border-border"
  };
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, color, className = "" }) => {
  if (!category) return null;

  const isTransfer = category.toLowerCase().includes("transfer") || category.toLowerCase().includes("traspaso");

  if (color) {
    const isHex = color.startsWith("#");
    const bgStyle = isHex ? `${color}20` : undefined;
    const borderStyle = isHex ? `${color}40` : undefined;

    return (
      <span
        style={{
          color,
          backgroundColor: bgStyle,
          borderColor: borderStyle
        }}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono tracking-tight border ${className}`}
      >
        {isTransfer && <span>⇆</span>}
        <span>{category}</span>
      </span>
    );
  }

  const style = getCategoryStyle(category);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono tracking-tight border ${style.bg} ${style.text} ${style.border} ${className}`}
    >
      {isTransfer && <span>⇆</span>}
      <span>{category}</span>
    </span>
  );
};


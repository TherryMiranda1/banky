import React, { useState } from "react";
import { Building2 } from "lucide-react";
import { getBankMetadata } from "@/lib/bank-utils";

interface BankLogoProps {
  bankName: string;
  logoUrl?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const BankLogo: React.FC<BankLogoProps> = ({
  bankName,
  logoUrl,
  className = "",
  size = "md"
}) => {
  const [imgError, setImgError] = useState(false);
  const metadata = getBankMetadata(bankName);

  const sizeClasses = {
    sm: "w-7 h-7 p-1 rounded-lg text-xs",
    md: "w-10 h-10 p-1.5 rounded-xl text-sm",
    lg: "w-12 h-12 p-2 rounded-2xl text-base"
  }[size];

  if (logoUrl && !imgError) {
    return (
      <div
        className={`${sizeClasses} bg-white shadow-sm border border-border/40 shrink-0 flex items-center justify-center overflow-hidden ${className}`}
        title={bankName}
      >
        <img
          src={logoUrl}
          alt={bankName}
          className="w-full h-full object-contain"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  if (metadata.isCash) {
    return (
      <div
        className={`${sizeClasses} bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0 flex items-center justify-center ${className}`}
        title="Cuenta de Efectivo"
      >
        <span className="font-bold text-xs tracking-tight text-emerald-400">💵</span>
      </div>
    );
  }

  if (metadata.label === "Santander") {
    return (
      <div
        className={`${sizeClasses} bg-white shadow-sm border border-border/40 shrink-0 flex items-center justify-center ${className}`}
        title="Banco Santander"
      >
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="#ec0000">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.2 14.8h-2.4V8.4h2.4v8.4z M12 6.2c-.7 0-1.2.5-1.2 1.2s.5 1.2 1.2 1.2 1.2-.5 1.2-1.2-.5-1.2-1.2-1.2z" />
        </svg>
      </div>
    );
  }

  if (metadata.label === "Revolut") {
    return (
      <div
        className={`${sizeClasses} bg-white shadow-sm border border-border/40 shrink-0 flex items-center justify-center font-black text-black font-sans ${className}`}
        title="Revolut"
      >
        <span className="font-extrabold tracking-tighter text-black">R</span>
      </div>
    );
  }

  if (metadata.label === "BBVA") {
    return (
      <div
        className={`${sizeClasses} bg-white shadow-sm border border-border/40 shrink-0 flex items-center justify-center font-black text-[#004481] font-sans ${className}`}
        title="BBVA"
      >
        <span className="font-bold text-[10px] tracking-tighter text-[#004481]">BBVA</span>
      </div>
    );
  }

  if (metadata.label === "CaixaBank") {
    return (
      <div
        className={`${sizeClasses} bg-white shadow-sm border border-border/40 shrink-0 flex items-center justify-center font-black text-[#007eae] font-sans ${className}`}
        title="CaixaBank"
      >
        <span className="font-bold text-[10px] tracking-tighter text-[#007eae]">★</span>
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses} bg-white shadow-sm border border-border/40 shrink-0 flex items-center justify-center text-slate-800 ${className}`}
      title={bankName}
    >
      <Building2 className="w-full h-full text-slate-700" />
    </div>
  );
};

export interface BankMetadata {
  label: string;
  badgeBg: string;
  badgeText: string;
  brandColor: string;
  isCash: boolean;
}

export function getBankMetadata(bankName: string = ""): BankMetadata {
  const normalized = bankName.toLowerCase();

  if (normalized.includes("efectivo") || normalized.includes("cash")) {
    return {
      label: "Cash",
      badgeBg: "bg-emerald-500/10 border-emerald-500/30",
      badgeText: "text-emerald-400",
      brandColor: "#10b981",
      isCash: true
    };
  }

  if (normalized.includes("santander")) {
    return {
      label: "Santander",
      badgeBg: "bg-red-500/10 border-red-500/30",
      badgeText: "text-red-400",
      brandColor: "#ec0000",
      isCash: false
    };
  }

  if (normalized.includes("revolut")) {
    return {
      label: "Revolut",
      badgeBg: "bg-blue-500/10 border-blue-500/30",
      badgeText: "text-blue-400",
      brandColor: "#1963d2",
      isCash: false
    };
  }

  if (normalized.includes("bbva")) {
    return {
      label: "BBVA",
      badgeBg: "bg-sky-500/10 border-sky-500/30",
      badgeText: "text-sky-400",
      brandColor: "#004481",
      isCash: false
    };
  }

  if (normalized.includes("caixa") || normalized.includes("imagin")) {
    return {
      label: "CaixaBank",
      badgeBg: "bg-cyan-500/10 border-cyan-500/30",
      badgeText: "text-cyan-400",
      brandColor: "#007eae",
      isCash: false
    };
  }

  return {
    label: "Bank",
    badgeBg: "bg-surface border-border",
    badgeText: "text-muted",
    brandColor: "#6b6b80",
    isCash: false
  };
}

export function maskIban(iban: string | null): string {
  if (!iban) return "Efectivo";
  const clean = iban.replace(/\s+/g, "");
  if (clean.length <= 8) return clean;
  return `•••• ${clean.slice(-4)}`;
}

export function formatCurrencySymbol(currency: string): string {
  switch (currency.toUpperCase()) {
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    case "USD":
      return "$";
    default:
      return `${currency} `;
  }
}

export function formatBalanceAmount(amountStr: string): string {
  const num = parseFloat(amountStr);
  if (isNaN(num)) return amountStr;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

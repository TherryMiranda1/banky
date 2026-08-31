export function formatFirstName(name: string | null | undefined, fallback = ""): string {
  if (!name) return fallback;
  const firstWord = name.trim().split(/\s+/)[0] || "";
  if (!firstWord) return fallback;
  return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
}

export function formatCurrency(amount: number | string, currency = "EUR"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  const validNum = isNaN(num) ? 0 : num;
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(validNum);
}


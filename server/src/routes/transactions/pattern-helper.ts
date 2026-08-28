export function extractSuggestedPattern(description: string | null): { pattern: string; merchantName: string } {
  if (!description || !description.trim()) {
    return { pattern: ".*", merchantName: "General" };
  }

  let text = description.trim();

  // Clean common bank & payment transaction prefixes
  const prefixRegex =
    /^(compra\s+en|pago\s+en|pago\s+con\s+tarjeta|recibo\s+de|recibo|transferencia\s+de|transferencia\s+a|tarj\.\s*[\d*]+|bizum\s+de|bizum\s+a|bizum|direct\s+debit\s+to|card\s+payment\s+to|pos\s+purchase\s+to|pos\s+purchase)\s+/i;
  text = text.replace(prefixRegex, "").trim();

  // Strip trailing noise such as card masks, dates, company forms and location codes
  text = text.replace(/\s+[\d*]{4,}.*$/, "");
  text = text.replace(/\s+(s\.?a\.?|s\.?l\.?|es|spain|madrid|barcelona|valencia|eu|sarl)$/i, "");
  text = text.replace(/[^\w\s.-]/gi, " ").trim();
  text = text.replace(/\s+/g, " ").trim();

  const words = text.split(" ").filter(Boolean);
  const merchantName = words.slice(0, 3).join(" ") || description.trim();

  // Escape special regex chars so that it safely compiles
  const escaped = merchantName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return {
    pattern: escaped,
    merchantName
  };
}

export function formatFirstName(name: string | null | undefined, fallback = ""): string {
  if (!name) return fallback;
  const firstWord = name.trim().split(/\s+/)[0] || "";
  if (!firstWord) return fallback;
  return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
}

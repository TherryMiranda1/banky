import { z } from "zod";
import { AccountBalanceSchema, AccountResponse } from "./accounts-types.js";
import { accounts, bankConnections } from "../../db/index.js";

export const accountSelectFields = {
  id: accounts.id,
  connectionId: accounts.connectionId,
  alias: accounts.alias,
  nickname: accounts.nickname,
  bankName: bankConnections.bankName,
  logoUrl: bankConnections.logoUrl,
  iban: accounts.iban,
  currency: accounts.currency,
  lastBalance: accounts.lastBalance,
  syncedAt: accounts.syncedAt,
  status: bankConnections.status,
  isActive: accounts.isActive,
  position: accounts.position
};

export interface AccountRawRow {
  id: string;
  connectionId?: string | null;
  alias: string | null;
  nickname: string | null;
  bankName: string;
  logoUrl: string | null;
  iban: string | null;
  currency: string;
  lastBalance: string | null;
  syncedAt: string | null;
  status: string;
  isActive: number | boolean | null;
  position?: number | null;
}

interface RawBalanceEntry {
  type?: string;
  balance_type?: string;
  amount?: string | number;
  currency?: string;
}

export function parseLastBalance(rawJson: string | null, fallbackCurrency: string): z.infer<typeof AccountBalanceSchema> | null {
  if (!rawJson) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(rawJson);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const items = parsed as RawBalanceEntry[];
      const availableItem = items.find(
        (b) =>
          b.type === "CLAV" ||
          b.type === "interimAvailable" ||
          b.balance_type === "CLAV" ||
          b.balance_type === "interimAvailable"
      ) || items[0];

      const bookedItem = items.find(
        (b) =>
          b.type === "CLBD" ||
          b.type === "interimBooked" ||
          b.balance_type === "CLBD" ||
          b.balance_type === "interimBooked"
      );

      const availAmt = parseFloat(String(availableItem?.amount ?? "0"));
      const bookedAmt = bookedItem?.amount !== undefined ? parseFloat(String(bookedItem.amount)) : null;
      const heldAmt = bookedAmt !== null && !isNaN(bookedAmt) && !isNaN(availAmt) && Math.abs(bookedAmt - availAmt) > 0.001
        ? Math.abs(bookedAmt - availAmt).toFixed(2)
        : undefined;

      return {
        amount: String(availableItem?.amount ?? "0"),
        currency: typeof availableItem?.currency === "string" ? availableItem.currency : fallbackCurrency,
        type: typeof availableItem?.type === "string" ? availableItem.type : undefined,
        bookedAmount: bookedItem?.amount ? String(bookedItem.amount) : undefined,
        heldAmount: heldAmt
      };
    } else if (typeof parsed === "object" && parsed !== null) {
      const obj = parsed as { amount?: unknown; currency?: unknown; type?: unknown };
      if (typeof obj.amount === "string" || typeof obj.amount === "number") {
        return {
          amount: String(obj.amount),
          currency: typeof obj.currency === "string" ? obj.currency : fallbackCurrency,
          type: typeof obj.type === "string" ? obj.type : undefined
        };
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function mapAccountRow(row: AccountRawRow): AccountResponse {
  return {
    id: row.id,
    connectionId: row.connectionId || undefined,
    alias: row.alias,
    nickname: row.nickname,
    bankName: row.bankName,
    logoUrl: row.logoUrl,
    iban: row.iban,
    currency: row.currency,
    lastBalance: parseLastBalance(row.lastBalance, row.currency),
    syncedAt: row.syncedAt,
    status: row.status,
    isActive: row.isActive === 1 || row.isActive === true || row.isActive === null,
    position: typeof row.position === "number" ? row.position : 0
  };
}

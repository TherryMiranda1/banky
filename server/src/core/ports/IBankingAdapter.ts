export interface AspspInput {
  name: string;
  country: string;
  state?: string;
}

export interface AspspItem {
  name: string;
  country: string;
  logo?: string;
  bic?: string;
  psuTypes?: string[];
}

export interface BankAccount {
  uid: string;
  iban: string | null;
  currency: string;
  name: string | null;
}

export interface SessionData {
  sessionId: string;
  accounts: BankAccount[];
  validUntil: string;
}

export interface Balance {
  amount: string;
  currency: string;
  type: string;
}

export interface Transaction {
  id: string;
  amount: string;
  currency: string;
  description: string | null;
  bookedAt: string;
  raw?: unknown;
}

export interface IBankingAdapter {
  getAspsps(country?: string): Promise<AspspItem[]>;
  startAuth(aspsp: AspspInput): Promise<{ url: string; authorizationId: string }>;
  completeAuth(code: string): Promise<SessionData>;
  getAccounts(sessionId: string): Promise<BankAccount[]>;
  getBalances(accountId: string, sessionId: string): Promise<Balance[]>;
  getTransactions(accountId: string, sessionId: string, from?: string, to?: string): Promise<Transaction[]>;
  deleteSession(sessionId: string): Promise<void>;
}


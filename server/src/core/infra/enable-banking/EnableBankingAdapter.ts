import crypto from "node:crypto";
import {
  AspspInput,
  AspspItem,
  Balance,
  BankAccount,
  IBankingAdapter,
  SessionData,
  Transaction
} from "../../ports/IBankingAdapter.js";
import { generateEnableBankingJwt } from "../../../services/jwt.js";
import {
  AppError,
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError
} from "../../../errors/AppError.js";
import {
  RawAccountItem,
  RawAuthResponse,
  RawBalancesResponse,
  RawGetAspspsResponse,
  RawGetSessionResponse,
  RawSessionResponse,
  RawTransactionsResponse
} from "./types.js";

import { getRuntimeEnv } from "../../../env.js";

export class EnableBankingAdapter implements IBankingAdapter {
  private readonly baseUrl?: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl;
  }

  private getBaseUrl(): string {
    return this.baseUrl || getRuntimeEnv().ENABLE_BANKING_BASE_URL || process.env.ENABLE_BANKING_BASE_URL || "https://api.enablebanking.com";
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = generateEnableBankingJwt();
    const url = `${this.getBaseUrl()}${path}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers as Record<string, string> | undefined)
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let parsedError: unknown = errorBody;
      try {
        parsedError = JSON.parse(errorBody);
      } catch {
      }

      if (response.status === 400) {
        throw new BadRequestError(`Enable Banking Error: ${response.statusText}`, parsedError);
      }
      if (response.status === 401) {
        throw new UnauthorizedError(`Enable Banking Unauthorized: ${response.statusText}`, parsedError);
      }
      if (response.status === 403) {
        throw new ForbiddenError(`Enable Banking Forbidden: ${response.statusText}`, parsedError);
      }
      if (response.status === 404) {
        throw new NotFoundError(`Enable Banking Resource Not Found: ${response.statusText}`, parsedError);
      }

      throw new AppError(
        response.status >= 400 && response.status < 600 ? response.status : 500,
        `Enable Banking API error: ${response.statusText}`,
        parsedError
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  async getAspsps(country?: string): Promise<AspspItem[]> {
    const queryString = country ? `?country=${encodeURIComponent(country)}` : "";
    const result = await this.request<RawGetAspspsResponse>(`/aspsps${queryString}`);

    return (result.aspsps || []).map((item) => ({
      name: item.name,
      country: item.country,
      logo: item.logo,
      bic: item.bic,
      psuTypes: item.psu_types
    }));
  }

  async startAuth(aspsp: AspspInput): Promise<{ url: string; authorizationId: string }> {
    const redirectUrl = getRuntimeEnv().ENABLE_BANKING_REDIRECT_URL || process.env.ENABLE_BANKING_REDIRECT_URL;
    if (!redirectUrl) {
      throw new InternalServerError("ENABLE_BANKING_REDIRECT_URL is not configured");
    }

    const validUntil = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    const state = aspsp.state || crypto.randomUUID();

    const body = {
      access: {
        valid_until: validUntil
      },
      aspsp: {
        name: aspsp.name,
        country: aspsp.country
      },
      state,
      redirect_url: redirectUrl
    };

    const result = await this.request<RawAuthResponse>("/auth", {
      method: "POST",
      body: JSON.stringify(body)
    });

    return {
      url: result.url,
      authorizationId: result.authorization_id
    };
  }

  async completeAuth(code: string): Promise<SessionData> {
    const result = await this.request<RawSessionResponse>("/sessions", {
      method: "POST",
      body: JSON.stringify({ code })
    });

    const accounts: BankAccount[] = (result.accounts || []).map((acc) => ({
      uid: acc.uid || crypto.randomUUID(),
      iban: acc.account_id?.iban ?? null,
      currency: acc.currency || "EUR",
      name: acc.name ?? acc.account_servicer?.name ?? null
    }));

    const validUntil =
      result.access?.valid_until ||
      new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

    return {
      sessionId: result.session_id,
      accounts,
      validUntil
    };
  }

  async getAccounts(sessionId: string): Promise<BankAccount[]> {
    const result = await this.request<RawGetSessionResponse>(`/sessions/${sessionId}`);
    const accountIds = result.accounts || result.accounts_data?.map((a) => a.uid) || [];

    const accounts: BankAccount[] = [];
    for (const accountId of accountIds) {
      try {
        const detail = await this.request<RawAccountItem>(`/accounts/${accountId}/details`);
        accounts.push({
          uid: detail.uid || accountId,
          iban: detail.account_id?.iban ?? null,
          currency: detail.currency || "EUR",
          name: detail.name ?? detail.account_servicer?.name ?? null
        });
      } catch {
        accounts.push({
          uid: accountId,
          iban: null,
          currency: "EUR",
          name: null
        });
      }
    }

    return accounts;
  }

  async getBalances(accountId: string, _sessionId: string): Promise<Balance[]> {
    const result = await this.request<RawBalancesResponse>(`/accounts/${accountId}/balances`);

    return (result.balances || []).map((b) => ({
      amount: b.balance_amount.amount,
      currency: b.balance_amount.currency,
      type: b.balance_type || b.name || "CLAV"
    }));
  }

  async getTransactions(
    accountId: string,
    _sessionId: string,
    from?: string,
    to?: string
  ): Promise<Transaction[]> {
    const allTransactions: Transaction[] = [];
    let continuationKey: string | undefined = undefined;

    do {
      const queryParams = new URLSearchParams();
      if (from) {
        queryParams.set("date_from", from);
      }
      if (to) {
        queryParams.set("date_to", to);
      }
      if (continuationKey) {
        queryParams.set("continuation_key", continuationKey);
      }

      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
      const result = await this.request<RawTransactionsResponse>(
        `/accounts/${accountId}/transactions${queryString}`
      );

      const pageTransactions = (result.transactions || []).map((t) => {
        const isDebit = t.credit_debit_indicator === "DBIT";
        const rawAmount = t.transaction_amount?.amount || "0";
        const formattedAmount = isDebit && !rawAmount.startsWith("-") ? `-${rawAmount}` : rawAmount;
        const description =
          t.remittance_information?.join(" ") ||
          t.bank_transaction_code?.description ||
          t.creditor?.name ||
          t.debtor?.name ||
          null;

        return {
          id: t.transaction_id || t.entry_reference || crypto.randomUUID(),
          amount: formattedAmount,
          currency: t.transaction_amount?.currency || "EUR",
          description,
          bookedAt:
            t.booking_date ||
            t.value_date ||
            t.transaction_date ||
            new Date().toISOString().split("T")[0]!
        };
      });

      allTransactions.push(...pageTransactions);
      continuationKey = result.continuation_key;
    } while (continuationKey && allTransactions.length < 500);

    return allTransactions;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.request<void>(`/sessions/${sessionId}`, {
      method: "DELETE"
    });
  }
}

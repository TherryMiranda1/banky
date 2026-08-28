import {
  IBankingAdapter,
  AspspInput,
  AspspItem,
  BankAccount,
  SessionData,
  Balance,
  Transaction
} from "../../ports/IBankingAdapter.js";
import { getRuntimeEnv } from "../../../env.js";

export class MockBankingAdapter implements IBankingAdapter {
  private aspsps: AspspItem[] = [
    {
      name: "Banco Santander (Demo)",
      country: "ES",
      logo: "https://cdn.enablebanking.com/logos/santander_es.png",
      bic: "BSCHESMMXXX",
      psuTypes: ["personal", "business"]
    },
    {
      name: "Revolut (Demo)",
      country: "ES",
      logo: "https://cdn.enablebanking.com/logos/revolut.png",
      bic: "REVUES21XXX",
      psuTypes: ["personal"]
    },
    {
      name: "BBVA (Demo)",
      country: "ES",
      logo: "https://cdn.enablebanking.com/logos/bbva_es.png",
      bic: "BBVAESMMXXX",
      psuTypes: ["personal"]
    }
  ];

  async getAspsps(_country = "ES"): Promise<AspspItem[]> {
    return this.aspsps;
  }

  async startAuth(aspsp: AspspInput): Promise<{ url: string; authorizationId: string }> {
    const authId = `mock-auth-${Date.now()}`;
    const frontendUrl = getRuntimeEnv().FRONTEND_URL || "http://localhost:5173";
    const redirectUrl = `${frontendUrl}/auth/callback?code=mock-code-123&state=${encodeURIComponent(aspsp.state || "")}`;
    return {
      url: redirectUrl,
      authorizationId: authId
    };
  }


  async completeAuth(_code: string): Promise<SessionData> {
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 90);

    return {
      sessionId: `mock-session-${Date.now()}`,
      accounts: [
        {
          uid: "mock-acc-santander",
          iban: "ES7900491500051234567890",
          currency: "EUR",
          name: "Santander Cuenta Nómina (Demo)"
        },
        {
          uid: "mock-acc-revolut",
          iban: "ES2114650100721234567891",
          currency: "EUR",
          name: "Revolut Vault (Demo)"
        }
      ],
      validUntil: validUntil.toISOString()
    };
  }

  async getAccounts(_sessionId: string): Promise<BankAccount[]> {
    return [
      {
        uid: "mock-acc-santander",
        iban: "ES7900491500051234567890",
        currency: "EUR",
        name: "Santander Cuenta Nómina (Demo)"
      },
      {
        uid: "mock-acc-revolut",
        iban: "ES2114650100721234567891",
        currency: "EUR",
        name: "Revolut Vault (Demo)"
      }
    ];
  }

  async getBalances(accountId: string, _sessionId: string): Promise<Balance[]> {
    if (accountId === "mock-acc-santander") {
      return [{ amount: "3450.20", currency: "EUR", type: "closingBooked" }];
    }
    return [{ amount: "1280.50", currency: "EUR", type: "closingBooked" }];
  }

  async getTransactions(accountId: string, _sessionId: string, _from?: string, _to?: string): Promise<Transaction[]> {
    const now = new Date();
    const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();

    if (accountId === "mock-acc-santander") {
      return [
        {
          id: `mock-tx-san-1`,
          amount: "2850.00",
          currency: "EUR",
          description: "TRANSFERENCIA NOMINA TECH SOLUTIONS IBERIA SL",
          bookedAt: daysAgo(1)
        },
        {
          id: `mock-tx-san-2`,
          amount: "-820.00",
          currency: "EUR",
          description: "PAGO ALQUILER VIVIENDA PRINCIPAL",
          bookedAt: daysAgo(2)
        },
        {
          id: `mock-tx-san-3`,
          amount: "-65.20",
          currency: "EUR",
          description: "RECIBO LUZ IBERDROLA",
          bookedAt: daysAgo(4)
        }
      ];
    }

    return [
      {
        id: `mock-tx-rev-1`,
        amount: "-78.45",
        currency: "EUR",
        description: "MERCADONA MADRID GOYA",
        bookedAt: daysAgo(2)
      },
      {
        id: `mock-tx-rev-2`,
        amount: "-38.50",
        currency: "EUR",
        description: "RESTAURANTE EL BARRIL",
        bookedAt: daysAgo(3)
      },
      {
        id: `mock-tx-rev-3`,
        amount: "-17.99",
        currency: "EUR",
        description: "NETFLIX.COM",
        bookedAt: daysAgo(5)
      }
    ];
  }

  async deleteSession(_sessionId: string): Promise<void> {
    // No-op for mock
  }
}

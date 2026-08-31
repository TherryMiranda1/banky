import { Account } from "@/lib/api/accounts";
import { Transaction } from "@/lib/api/transactions";
import { CategoryItem, CategorizationRuleItem } from "@/lib/api/categories";
import { BudgetItem } from "@/lib/api/budgets";
import { User, Aspsp } from "@/lib/api/auth";

export const MOCK_USER: User = {
  id: "mock-user-1",
  name: "Alex Demo",
  email: "demo@banky.app",
  cutoffDay: 1,
  createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
};

export const MOCK_ASPSPS: Aspsp[] = [
  // ES
  {
    name: "Banco Santander",
    country: "ES",
    logo: "https://cdn.enablebanking.com/logos/santander_es.png",
    bic: "BSCHESMMXXX",
    psuTypes: ["personal", "business"]
  },
  {
    name: "BBVA",
    country: "ES",
    logo: "https://cdn.enablebanking.com/logos/bbva_es.png",
    bic: "BBVAESMMXXX",
    psuTypes: ["personal", "business"]
  },
  {
    name: "CaixaBank",
    country: "ES",
    logo: "https://cdn.enablebanking.com/logos/caixabank_es.png",
    bic: "CAIXESBBXXX",
    psuTypes: ["personal"]
  },
  {
    name: "Revolut",
    country: "ES",
    logo: "https://cdn.enablebanking.com/logos/revolut.png",
    bic: "REVUES21XXX",
    psuTypes: ["personal"]
  },
  {
    name: "Banco Sabadell",
    country: "ES",
    logo: "https://cdn.enablebanking.com/logos/sabadell_es.png",
    bic: "BSABESBBXXX",
    psuTypes: ["personal", "business"]
  },
  {
    name: "ING Direct",
    country: "ES",
    logo: "https://cdn.enablebanking.com/logos/ing_es.png",
    bic: "INGDESMMXXX",
    psuTypes: ["personal"]
  },
  {
    name: "Bankinter",
    country: "ES",
    logo: "https://cdn.enablebanking.com/logos/bankinter_es.png",
    bic: "BKBKESMMXXX",
    psuTypes: ["personal", "business"]
  },
  // GB
  {
    name: "Barclays",
    country: "GB",
    logo: "https://cdn.enablebanking.com/logos/barclays_uk.png",
    bic: "BUKBDD22XXX",
    psuTypes: ["personal", "business"]
  },
  {
    name: "HSBC UK",
    country: "GB",
    logo: "https://cdn.enablebanking.com/logos/hsbc_uk.png",
    bic: "HBUKGB41XXX",
    psuTypes: ["personal", "business"]
  },
  {
    name: "Revolut UK",
    country: "GB",
    logo: "https://cdn.enablebanking.com/logos/revolut.png",
    bic: "REVUGB21XXX",
    psuTypes: ["personal"]
  },
  // FR
  {
    name: "BNP Paribas",
    country: "FR",
    logo: "https://cdn.enablebanking.com/logos/bnp_paribas_fr.png",
    bic: "BNPAFR21XXX",
    psuTypes: ["personal", "business"]
  },
  {
    name: "Société Générale",
    country: "FR",
    logo: "https://cdn.enablebanking.com/logos/societe_generale_fr.png",
    bic: "SOGEFR21XXX",
    psuTypes: ["personal"]
  },
  // DE
  {
    name: "Deutsche Bank",
    country: "DE",
    logo: "https://cdn.enablebanking.com/logos/deutsche_bank_de.png",
    bic: "DEUTDEDDXXX",
    psuTypes: ["personal", "business"]
  },
  {
    name: "N26",
    country: "DE",
    logo: "https://cdn.enablebanking.com/logos/n26_de.png",
    bic: "NTSBDEB1XXX",
    psuTypes: ["personal"]
  },
  // IT
  {
    name: "Intesa Sanpaolo",
    country: "IT",
    logo: "https://cdn.enablebanking.com/logos/intesa_sanpaolo_it.png",
    bic: "BCITITMMXXX",
    psuTypes: ["personal", "business"]
  }
];


export const MOCK_CATEGORIES: CategoryItem[] = [
  {
    id: "cat-income",
    userId: "mock-user-1",
    name: "Ingresos & Nómina",
    color: "#00E5A0",
    icon: "Briefcase",
    position: 0,
    createdAt: "2025-01-01T00:00:00Z"
  },
  {
    id: "cat-housing",
    userId: "mock-user-1",
    name: "Vivienda & Servicios",
    color: "#6366F1",
    icon: "Home",
    position: 1,
    createdAt: "2025-01-01T00:00:00Z"
  },
  {
    id: "cat-groceries",
    userId: "mock-user-1",
    name: "Alimentación & Super",
    color: "#F59E0B",
    icon: "ShoppingCart",
    position: 2,
    createdAt: "2025-01-01T00:00:00Z"
  },
  {
    id: "cat-dining",
    userId: "mock-user-1",
    name: "Restaurantes & Cafés",
    color: "#EC4899",
    icon: "Utensils",
    position: 3,
    createdAt: "2025-01-01T00:00:00Z"
  },
  {
    id: "cat-transport",
    userId: "mock-user-1",
    name: "Transporte & Movilidad",
    color: "#3B82F6",
    icon: "Car",
    position: 4,
    createdAt: "2025-01-01T00:00:00Z"
  },
  {
    id: "cat-subscriptions",
    userId: "mock-user-1",
    name: "Suscripciones & Ocio",
    color: "#8B5CF6",
    icon: "Tv",
    position: 5,
    createdAt: "2025-01-01T00:00:00Z"
  },
  {
    id: "cat-shopping",
    userId: "mock-user-1",
    name: "Compras & Ropa",
    color: "#10B981",
    icon: "ShoppingBag",
    position: 6,
    createdAt: "2025-01-01T00:00:00Z"
  },
  {
    id: "cat-health",
    userId: "mock-user-1",
    name: "Salud & Cuidado",
    color: "#EF4444",
    icon: "HeartPulse",
    position: 7,
    createdAt: "2025-01-01T00:00:00Z"
  },
  {
    id: "cat-unexpected",
    userId: "mock-user-1",
    name: "Imprevistos & Urgencias",
    color: "#F97316",
    icon: "ShieldAlert",
    position: 8,
    createdAt: "2025-01-01T00:00:00Z"
  },
  {
    id: "cat-savings",
    userId: "mock-user-1",
    name: "Ahorro & Inversión",
    color: "#22C55E",
    icon: "PiggyBank",
    position: 9,
    createdAt: "2025-01-01T00:00:00Z"
  }
];

export const MOCK_RULES: CategorizationRuleItem[] = [
  {
    id: "rule-1",
    userId: "mock-user-1",
    categoryId: "cat-income",
    categoryName: "Ingresos & Nómina",
    categoryColor: "#00E5A0",
    categoryIcon: "Briefcase",
    pattern: "NOMINA",
    direction: "in",
    priority: 10,
    createdAt: "2025-01-01T00:00:00Z"
  },
  {
    id: "rule-2",
    userId: "mock-user-1",
    categoryId: "cat-housing",
    categoryName: "Vivienda & Servicios",
    categoryColor: "#6366F1",
    categoryIcon: "Home",
    pattern: "ALQUILER",
    direction: "out",
    priority: 9,
    createdAt: "2025-01-01T00:00:00Z"
  },
  {
    id: "rule-3",
    userId: "mock-user-1",
    categoryId: "cat-groceries",
    categoryName: "Alimentación & Super",
    categoryColor: "#F59E0B",
    categoryIcon: "ShoppingCart",
    pattern: "MERCADONA",
    direction: "out",
    priority: 8,
    createdAt: "2025-01-01T00:00:00Z"
  },
  {
    id: "rule-4",
    userId: "mock-user-1",
    categoryId: "cat-subscriptions",
    categoryName: "Suscripciones & Ocio",
    categoryColor: "#8B5CF6",
    categoryIcon: "Tv",
    pattern: "NETFLIX",
    direction: "out",
    priority: 7,
    createdAt: "2025-01-01T00:00:00Z"
  },
  {
    id: "rule-5",
    userId: "mock-user-1",
    categoryId: "cat-unexpected",
    categoryName: "Imprevistos & Urgencias",
    categoryColor: "#F97316",
    categoryIcon: "ShieldAlert",
    pattern: "FARMACIA",
    direction: "out",
    priority: 8,
    createdAt: "2025-01-01T00:00:00Z"
  },
  {
    id: "rule-6",
    userId: "mock-user-1",
    categoryId: "cat-savings",
    categoryName: "Ahorro & Inversión",
    categoryColor: "#22C55E",
    categoryIcon: "PiggyBank",
    pattern: "MYINVESTOR",
    direction: "out",
    priority: 9,
    createdAt: "2025-01-01T00:00:00Z"
  }
];

export const MOCK_ACCOUNTS: Account[] = [
  {
    id: "acc-santander-1",
    alias: "Santander Cuenta Nómina",
    nickname: "Cuenta Principal",
    bankName: "Banco Santander",
    logoUrl: "https://cdn.enablebanking.com/logos/santander_es.png",
    iban: "ES79 0049 1500 0512 3456 7890",
    currency: "EUR",
    lastBalance: {
      amount: "3450.20",
      currency: "EUR",
      type: "closingBooked",
      bookedAmount: "3450.20",
      heldAmount: "0.00"
    },
    syncedAt: new Date().toISOString(),
    status: "active",
    isActive: true,
    position: 0
  },
  {
    id: "acc-revolut-1",
    alias: "Revolut Vault & Viajes",
    nickname: "Ahorros & Ocio",
    bankName: "Revolut",
    logoUrl: "https://cdn.enablebanking.com/logos/revolut.png",
    iban: "ES21 1465 0100 7212 3456 7891",
    currency: "EUR",
    lastBalance: {
      amount: "1280.50",
      currency: "EUR",
      type: "closingBooked",
      bookedAmount: "1280.50",
      heldAmount: "0.00"
    },
    syncedAt: new Date().toISOString(),
    status: "active",
    isActive: true,
    position: 1
  },
  {
    id: "acc-cash-1",
    alias: "Efectivo / Billetera",
    nickname: "Efectivo",
    bankName: "Cash",
    logoUrl: null,
    iban: null,
    currency: "EUR",
    lastBalance: {
      amount: "145.00",
      currency: "EUR",
      type: "manual",
      bookedAmount: "145.00",
      heldAmount: "0.00"
    },
    syncedAt: new Date().toISOString(),
    status: "active",
    isActive: true,
    position: 2
  }
];

export const MOCK_BUDGETS: BudgetItem[] = [
  {
    id: "bgt-housing",
    categoryId: "cat-housing",
    categoryName: "Vivienda & Servicios",
    categoryColor: "#6366F1",
    categoryIcon: "Home",
    amount: "950",
    isInherited: false
  },
  {
    id: "bgt-groceries",
    categoryId: "cat-groceries",
    categoryName: "Alimentación & Super",
    categoryColor: "#F59E0B",
    categoryIcon: "ShoppingCart",
    amount: "450",
    isInherited: false
  },
  {
    id: "bgt-dining",
    categoryId: "cat-dining",
    categoryName: "Restaurantes & Cafés",
    categoryColor: "#EC4899",
    categoryIcon: "Utensils",
    amount: "250",
    isInherited: false
  },
  {
    id: "bgt-transport",
    categoryId: "cat-transport",
    categoryName: "Transporte & Movilidad",
    categoryColor: "#3B82F6",
    categoryIcon: "Car",
    amount: "120",
    isInherited: false
  },
  {
    id: "bgt-subscriptions",
    categoryId: "cat-subscriptions",
    categoryName: "Suscripciones & Ocio",
    categoryColor: "#8B5CF6",
    categoryIcon: "Tv",
    amount: "60",
    isInherited: false
  },
  {
    id: "bgt-shopping",
    categoryId: "cat-shopping",
    categoryName: "Compras & Ropa",
    categoryColor: "#10B981",
    categoryIcon: "ShoppingBag",
    amount: "180",
    isInherited: false
  },
  {
    id: "bgt-health",
    categoryId: "cat-health",
    categoryName: "Salud & Cuidado",
    categoryColor: "#EF4444",
    categoryIcon: "HeartPulse",
    amount: "80",
    isInherited: false
  },
  {
    id: "bgt-unexpected",
    categoryId: "cat-unexpected",
    categoryName: "Imprevistos & Urgencias",
    categoryColor: "#F97316",
    categoryIcon: "ShieldAlert",
    amount: "150",
    isInherited: false
  },
  {
    id: "bgt-savings",
    categoryId: "cat-savings",
    categoryName: "Ahorro & Inversión",
    categoryColor: "#22C55E",
    categoryIcon: "PiggyBank",
    amount: "400",
    isInherited: false
  }
];

const now = new Date();
const daysAgo = (d: number, h = 12, m = 0): string => {
  const date = new Date(now);
  date.setDate(date.getDate() - d);
  date.setHours(h, m, 0, 0);
  return date.toISOString();
};

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-mock-1",
    accountId: "acc-santander-1",
    accountAlias: "Santander Cuenta Nómina",
    bankName: "Banco Santander",
    iban: "ES79 0049 1500 0512 3456 7890",
    amount: "2850.00",
    currency: "EUR",
    description: "TRANSFERENCIA NOMINA TECH SOLUTIONS IBERIA SL",
    category: "cat-income",
    bookedAt: daysAgo(1, 9, 30),
    metadata: {
      counterparty: { name: "TECH SOLUTIONS IBERIA SL", city: "Madrid", country: "ES" },
      referenceNumber: "NOM-2026-08",
      mccInfo: { code: "6012", name: "Payroll", group: "Income", icon: "Briefcase" }
    }
  },
  {
    id: "tx-mock-2",
    accountId: "acc-santander-1",
    accountAlias: "Santander Cuenta Nómina",
    bankName: "Banco Santander",
    iban: "ES79 0049 1500 0512 3456 7890",
    amount: "-820.00",
    currency: "EUR",
    description: "PAGO ALQUILER VIVIENDA PRINCIPAL MADRID CENTRO",
    category: "cat-housing",
    bookedAt: daysAgo(2, 11, 0),
    metadata: {
      counterparty: { name: "Inmobiliaria Urbana S.A.", city: "Madrid", country: "ES" },
      referenceNumber: "ALQ-AGO-26"
    }
  },
  {
    id: "tx-mock-3",
    accountId: "acc-revolut-1",
    accountAlias: "Revolut Vault & Viajes",
    bankName: "Revolut",
    iban: "ES21 1465 0100 7212 3456 7891",
    amount: "-78.45",
    currency: "EUR",
    description: "MERCADONA MADRID GOYA",
    category: "cat-groceries",
    bookedAt: daysAgo(2, 18, 45),
    metadata: {
      counterparty: { name: "Mercadona S.A.", city: "Madrid", country: "ES" },
      mccInfo: { code: "5411", name: "Grocery Stores", group: "Food", icon: "ShoppingCart" }
    }
  },
  {
    id: "tx-mock-4",
    accountId: "acc-revolut-1",
    accountAlias: "Revolut Vault & Viajes",
    bankName: "Revolut",
    iban: "ES21 1465 0100 7212 3456 7891",
    amount: "-38.50",
    currency: "EUR",
    description: "RESTAURANTE EL BARRIL DE RECOLETOS",
    category: "cat-dining",
    bookedAt: daysAgo(3, 22, 15),
    metadata: {
      counterparty: { name: "El Barril de Recoletos", city: "Madrid", country: "ES" },
      mccInfo: { code: "5812", name: "Restaurants", group: "Dining", icon: "Utensils" }
    }
  },
  {
    id: "tx-mock-5",
    accountId: "acc-santander-1",
    accountAlias: "Santander Cuenta Nómina",
    bankName: "Banco Santander",
    iban: "ES79 0049 1500 0512 3456 7890",
    amount: "-65.20",
    currency: "EUR",
    description: "RECIBO LUZ IBERDROLA CLIENTES",
    category: "cat-housing",
    bookedAt: daysAgo(4, 8, 20),
    metadata: {
      counterparty: { name: "Iberdrola Clientes S.A.U.", country: "ES" },
      referenceNumber: "FAC-IB-94821"
    }
  },
  {
    id: "tx-mock-6",
    accountId: "acc-revolut-1",
    accountAlias: "Revolut Vault & Viajes",
    bankName: "Revolut",
    iban: "ES21 1465 0100 7212 3456 7891",
    amount: "-17.99",
    currency: "EUR",
    description: "NETFLIX.COM PREMIUM 4K",
    category: "cat-subscriptions",
    bookedAt: daysAgo(5, 4, 10),
    metadata: {
      counterparty: { name: "Netflix International B.V.", country: "NL" },
      mccInfo: { code: "4899", name: "Streaming Services", group: "Entertainment", icon: "Tv" }
    }
  },
  {
    id: "tx-mock-7",
    accountId: "acc-revolut-1",
    accountAlias: "Revolut Vault & Viajes",
    bankName: "Revolut",
    iban: "ES21 1465 0100 7212 3456 7891",
    amount: "-10.99",
    currency: "EUR",
    description: "SPOTIFY PREMIUM INDIVIDUAL",
    category: "cat-subscriptions",
    bookedAt: daysAgo(6, 12, 0),
    metadata: {
      counterparty: { name: "Spotify AB", country: "SE" }
    }
  },
  {
    id: "tx-mock-8",
    accountId: "acc-santander-1",
    accountAlias: "Santander Cuenta Nómina",
    bankName: "Banco Santander",
    iban: "ES79 0049 1500 0512 3456 7890",
    amount: "-45.00",
    currency: "EUR",
    description: "METRO DE MADRID ABONO TRANSPORTE",
    category: "cat-transport",
    bookedAt: daysAgo(7, 8, 15),
    metadata: {
      counterparty: { name: "Consorcio Regional de Transportes Madrid", city: "Madrid" }
    }
  },
  {
    id: "tx-mock-9",
    accountId: "acc-santander-1",
    accountAlias: "Santander Cuenta Nómina",
    bankName: "Banco Santander",
    iban: "ES79 0049 1500 0512 3456 7890",
    amount: "-300.00",
    currency: "EUR",
    description: "TRANSFERENCIA PROPIA A REVOLUT AHORROS",
    category: null,
    isTransfer: true,
    transferMatchId: "tx-mock-10",
    bookedAt: daysAgo(8, 14, 0),
    metadata: {
      counterparty: { name: "Alex Demo (Revolut)", iban: "ES21 1465 0100 7212 3456 7891" }
    }
  },
  {
    id: "tx-mock-10",
    accountId: "acc-revolut-1",
    accountAlias: "Revolut Vault & Viajes",
    bankName: "Revolut",
    iban: "ES21 1465 0100 7212 3456 7891",
    amount: "300.00",
    currency: "EUR",
    description: "TRANSFERENCIA RECIBIDA DESDE SANTANDER",
    category: null,
    isTransfer: true,
    transferMatchId: "tx-mock-9",
    bookedAt: daysAgo(8, 14, 0),
    metadata: {
      counterparty: { name: "Alex Demo (Santander)", iban: "ES79 0049 1500 0512 3456 7890" }
    }
  },
  {
    id: "tx-mock-11",
    accountId: "acc-revolut-1",
    accountAlias: "Revolut Vault & Viajes",
    bankName: "Revolut",
    iban: "ES21 1465 0100 7212 3456 7891",
    amount: "-54.20",
    currency: "EUR",
    description: "CARREFOUR EXPRESS ATOCHA",
    category: "cat-groceries",
    bookedAt: daysAgo(9, 19, 10),
    metadata: {
      counterparty: { name: "Carrefour Supermercados", city: "Madrid" }
    }
  },
  {
    id: "tx-mock-12",
    accountId: "acc-revolut-1",
    accountAlias: "Revolut Vault & Viajes",
    bankName: "Revolut",
    iban: "ES21 1465 0100 7212 3456 7891",
    amount: "-49.95",
    currency: "EUR",
    description: "ZARA ONLINE MADRID",
    category: "cat-shopping",
    bookedAt: daysAgo(10, 16, 40),
    metadata: {
      counterparty: { name: "Inditex S.A.", city: "Arteixo" }
    }
  },
  {
    id: "tx-mock-13",
    accountId: "acc-revolut-1",
    accountAlias: "Revolut Vault & Viajes",
    bankName: "Revolut",
    iban: "ES21 1465 0100 7212 3456 7891",
    amount: "-18.50",
    currency: "EUR",
    description: "FARMACIA CENTRAL ALCALA",
    category: "cat-health",
    bookedAt: daysAgo(11, 11, 25),
    metadata: {
      counterparty: { name: "Farmacia Lda. Martínez", city: "Madrid" }
    }
  },
  {
    id: "tx-mock-14",
    accountId: "acc-cash-1",
    accountAlias: "Efectivo / Billetera",
    bankName: "Cash",
    iban: null,
    amount: "-15.00",
    currency: "EUR",
    description: "Café de especialidad y desayuno panadería",
    category: "cat-dining",
    bookedAt: daysAgo(12, 10, 15),
    metadata: {
      note: "Pago en efectivo en Toma Café"
    }
  },
  {
    id: "tx-mock-15",
    accountId: "acc-revolut-1",
    accountAlias: "Revolut Vault & Viajes",
    bankName: "Revolut",
    iban: "ES21 1465 0100 7212 3456 7891",
    amount: "-22.30",
    currency: "EUR",
    description: "UBER TRIP MADRID",
    category: "cat-transport",
    bookedAt: daysAgo(13, 23, 40),
    metadata: {
      counterparty: { name: "Uber B.V.", country: "NL" }
    }
  }
];

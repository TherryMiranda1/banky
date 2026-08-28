import crypto from "node:crypto";
import { AppDatabase, categories, categorizationRules, eq, and, count } from "../db/index.js";

export interface DefaultCategorySeed {
  name: string;
  color: string;
  icon: string;
  rules: Array<{ pattern: string; priority: number }>;
}

export const DEFAULT_CATEGORIES: DefaultCategorySeed[] = [
  {
    name: "Alimentación",
    color: "#10b981",
    icon: "ShoppingBag",
    rules: [
      {
        pattern: "mercadona|carrefour|dia|lidl|eroski|supermercado|alcampo|consum|hipercor",
        priority: 10
      }
    ]
  },
  {
    name: "Vivienda",
    color: "#3b82f6",
    icon: "Home",
    rules: [
      {
        pattern: "alquiler|hipoteca|rent|comunidad|seguro hogar",
        priority: 10
      }
    ]
  },
  {
    name: "Transporte",
    color: "#f59e0b",
    icon: "Car",
    rules: [
      {
        pattern: "uber|cabify|renfe|repsol|cepsa|gasolinera|metro|alsa|parking|gasoil|gasolina",
        priority: 10
      }
    ]
  },
  {
    name: "Ocio",
    color: "#a855f7",
    icon: "Sparkles",
    rules: [
      {
        pattern: "netflix|spotify|hbo|disney|steam|cinema|cine|playstation|prime video|youtube|teatro",
        priority: 10
      }
    ]
  },
  {
    name: "Servicios",
    color: "#06b6d4",
    icon: "Zap",
    rules: [
      {
        pattern: "endesa|iberdrola|naturgy|vodafone|movistar|orange|digi|agua|luz|gas natural",
        priority: 10
      }
    ]
  },
  {
    name: "Nómina",
    color: "#00E5A0",
    icon: "Briefcase",
    rules: [
      {
        pattern: "nomina|salary|sueldo|transferencia a favor",
        priority: 20
      }
    ]
  },
  {
    name: "Traspasos",
    color: "#38bdf8",
    icon: "ArrowLeftRight",
    rules: [
      {
        pattern: "traspaso|transferencia propia|trf interna|movimiento entre cuentas|revolut to",
        priority: 15
      }
    ]
  }
];

export async function ensureSystemCategories(db: AppDatabase, userId: string): Promise<void> {
  const [existingTransfer] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.userId, userId), eq(categories.name, "Traspasos")))
    .limit(1);

  if (!existingTransfer) {
    const categoryId = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.insert(categories).values({
      id: categoryId,
      userId,
      name: "Traspasos",
      color: "#38bdf8",
      icon: "ArrowLeftRight",
      createdAt: now
    }).onConflictDoNothing();
  }
}

export async function seedDefaultCategoriesIfEmpty(db: AppDatabase, userId: string): Promise<number> {
  const [existing] = await db
    .select({ total: count() })
    .from(categories)
    .where(eq(categories.userId, userId));

  if (existing && existing.total > 0) {
    await ensureSystemCategories(db, userId);
    return 0;
  }

  const now = new Date().toISOString();
  let createdCount = 0;

  for (const cat of DEFAULT_CATEGORIES) {
    const categoryId = crypto.randomUUID();
    await db.insert(categories).values({
      id: categoryId,
      userId,
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
      createdAt: now
    });
    createdCount++;

    for (const rule of cat.rules) {
      await db.insert(categorizationRules).values({
        id: crypto.randomUUID(),
        userId,
        categoryId,
        pattern: rule.pattern,
        priority: rule.priority,
        createdAt: now
      });
    }
  }

  return createdCount;
}

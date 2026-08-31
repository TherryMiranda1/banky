import { BudgetAnalyticsService } from "../../services/budget-analytics.service.js";
import { getDb, accounts, bankConnections, eq, and, isNotNull } from "../../db/index.js";
import type { IKingdomService } from "../ports/IKingdomService.js";
import type {
  KingdomState,
  Building,
  BuildingType,
  BuildingStatus,
  KingdomHealth,
  KingdomEvent,
  KingdomSummary
} from "../../routes/kingdom/types.js";

export class KingdomService implements IKingdomService {
  public async getKingdomState(userId: string, period: string): Promise<KingdomState> {
    const analytics = await BudgetAnalyticsService.getCategoryAnalytics(userId, period);
    const totalBalanceEur = await this.calculateTotalBalance(userId);

    const { summary } = analytics;
    const kingdomSummary: KingdomSummary = {
      totalIncome: summary.totalIncome,
      totalSpent: summary.totalSpent,
      netSavings: summary.netSavings,
      savingsRate: summary.savingsRate,
      totalBudgeted: summary.totalBudgeted,
      totalBalanceEur
    };

    const buildings: Building[] = analytics.categories
      .filter((cat) => cat.categoryName.toLowerCase() !== "traspasos" && cat.categoryName.toLowerCase() !== "traspaso")
      .map((cat) => {
        const type = this.mapCategoryToBuildingType(cat.categoryName);
        const level = this.calculateBuildingLevel(cat.spentAmount);
        const status = this.calculateBuildingStatus(cat.budgetAmount, cat.spentAmount, cat.spentPercentage);

        return {
          id: cat.categoryId,
          type,
          level,
          status,
          categoryName: cat.categoryName,
          categoryColor: cat.categoryColor,
          categoryIcon: cat.categoryIcon,
          spentAmount: cat.spentAmount,
          budgetAmount: cat.budgetAmount,
          spentPercentage: cat.spentPercentage
        };
      });

    const events = this.generateKingdomEvents(buildings, kingdomSummary);
    const health = this.calculateKingdomHealth(buildings, kingdomSummary);
    const treasuryLevel = this.calculateTreasuryLevel(kingdomSummary.netSavings, totalBalanceEur);

    return {
      period,
      health,
      summary: kingdomSummary,
      treasuryLevel,
      buildings,
      events
    };
  }

  private mapCategoryToBuildingType(categoryName: string): BuildingType {
    const normalized = categoryName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

    if (normalized.includes("vivienda") || normalized.includes("hogar") || normalized.includes("alquiler") || normalized.includes("hipoteca")) {
      return "house";
    }
    if (normalized.includes("alimentacion") || normalized.includes("comida") || normalized.includes("supermercado")) {
      return "granary";
    }
    if (normalized.includes("transporte") || normalized.includes("gasolina") || normalized.includes("coche") || normalized.includes("peaje")) {
      return "stable";
    }
    if (normalized.includes("ocio") || normalized.includes("restaurante") || normalized.includes("bar") || normalized.includes("viaje")) {
      return "tavern";
    }
    if (normalized.includes("servicio") || normalized.includes("luz") || normalized.includes("agua") || normalized.includes("gas")) {
      return "windmill";
    }
    if (normalized.includes("suscripcion") || normalized.includes("streaming") || normalized.includes("software")) {
      return "library";
    }
    if (normalized.includes("imprevisto") || normalized.includes("salud") || normalized.includes("farmacia") || normalized.includes("medico")) {
      return "watchtower";
    }
    if (normalized.includes("ahorro") || normalized.includes("inversion") || normalized.includes("deposito")) {
      return "vault";
    }
    if (normalized.includes("nomina") || normalized.includes("sueldo") || normalized.includes("ingreso")) {
      return "market";
    }

    return "house";
  }

  private calculateBuildingLevel(spentAmount: number): 1 | 2 | 3 {
    if (spentAmount >= 600) return 3;
    if (spentAmount >= 150) return 2;
    return 1;
  }

  private calculateBuildingStatus(
    budgetAmount: number,
    spentAmount: number,
    spentPercentage: number
  ): BuildingStatus {
    if (budgetAmount > 0 && spentPercentage > 100) {
      return "burning";
    }
    if (budgetAmount === 0 && spentAmount > 0) {
      return "ruined";
    }
    return "healthy";
  }

  private generateKingdomEvents(buildings: Building[], summary: KingdomSummary): KingdomEvent[] {
    const events: KingdomEvent[] = [];

    for (const b of buildings) {
      if (b.status === "burning") {
        events.push({
          kind: "fire",
          categoryName: b.categoryName,
          severity: b.spentPercentage >= 150 ? "high" : "low"
        });
      }
    }

    if (summary.totalIncome > 0) {
      const caravanCount = Math.min(5, Math.max(1, Math.floor(summary.totalIncome / 500)));
      events.push({
        kind: "caravan",
        count: caravanCount
      });
    }

    if (summary.netSavings < 0) {
      events.push({
        kind: "enemy",
        severity: summary.netSavings <= -500 ? "high" : "low"
      });
    }

    return events;
  }

  private calculateKingdomHealth(buildings: Building[], summary: KingdomSummary): KingdomHealth {
    const burningCount = buildings.filter((b) => b.status === "burning").length;

    if (burningCount >= 3 || summary.netSavings <= -1000) {
      return "crisis";
    }
    if (burningCount >= 1 || summary.savingsRate < 0 || summary.netSavings < 0) {
      return "struggling";
    }
    if (summary.savingsRate >= 25 && summary.netSavings > 0) {
      return "thriving";
    }
    return "stable";
  }

  private calculateTreasuryLevel(netSavings: number, totalBalance: number): 1 | 2 | 3 {
    if (totalBalance >= 5000 && netSavings >= 0) return 3;
    if (totalBalance >= 1000 && netSavings >= -100) return 2;
    return 1;
  }

  private async calculateTotalBalance(userId: string): Promise<number> {
    const db = getDb();
    const rows = await db
      .select({
        currency: accounts.currency,
        lastBalance: accounts.lastBalance
      })
      .from(accounts)
      .innerJoin(bankConnections, eq(accounts.connectionId, bankConnections.id))
      .where(
        and(
          eq(bankConnections.status, "active"),
          eq(bankConnections.userId, userId),
          eq(accounts.isActive, true),
          isNotNull(accounts.lastBalance)
        )
      );

    let total = 0;
    for (const row of rows) {
      if (!row.lastBalance) continue;
      try {
        const parsed: unknown = JSON.parse(row.lastBalance);
        let amountNum: number | null = null;

        if (Array.isArray(parsed) && parsed.length > 0) {
          const item = parsed[0] as { amount?: unknown };
          if (typeof item.amount === "string") {
            amountNum = parseFloat(item.amount);
          }
        } else if (typeof parsed === "object" && parsed !== null) {
          const obj = parsed as { amount?: unknown };
          if (typeof obj.amount === "string") {
            amountNum = parseFloat(obj.amount);
          }
        }

        if (amountNum !== null && !isNaN(amountNum)) {
          total += amountNum;
        }
      } catch {
        continue;
      }
    }

    return Math.round(total * 100) / 100;
  }
}

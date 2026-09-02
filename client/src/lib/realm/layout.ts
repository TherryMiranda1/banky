import type { Building, KingdomState } from "../api/kingdom.js";

export const GRID_SIZE = 21;
export const CENTER_COORD = { col: 10, row: 10 };

export type CellType = "ground" | "tree" | "rock" | "water" | "road" | "plaza" | "treasury" | "building";

export interface PlacedCell {
  col: number;
  row: number;
  type: CellType;
  building?: Building;
  isAltGround?: boolean;
  isPerimeter?: boolean;
}

export const INCOME_BUILDING_SLOTS: Array<{ col: number; row: number }> = [
  { col: 8, row: 8 },
  { col: 10, row: 7 },
  { col: 7, row: 10 }
];

export const FIXED_EXPENSE_SLOTS: Array<{ col: number; row: number }> = [
  { col: 7, row: 10 },
  { col: 10, row: 7 },
  { col: 12, row: 8 },
  { col: 5, row: 7 },
  { col: 7, row: 4 },
  { col: 13, row: 4 },
  { col: 15, row: 7 }
];

export const OTHER_EXPENSE_SLOTS: Array<{ col: number; row: number }> = [
  { col: 8, row: 12 },
  { col: 12, row: 12 },
  { col: 13, row: 10 },
  { col: 10, row: 13 },
  { col: 5, row: 13 },
  { col: 15, row: 13 },
  { col: 7, row: 16 },
  { col: 13, row: 16 }
];

export const AVAILABLE_BUILDING_SLOTS: Array<{ col: number; row: number }> = [
  ...INCOME_BUILDING_SLOTS,
  ...FIXED_EXPENSE_SLOTS,
  ...OTHER_EXPENSE_SLOTS
];

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function isIncomeCategory(categoryName: string): boolean {
  const norm = normalizeName(categoryName);
  return (
    norm.includes("nomina") ||
    norm.includes("sueldo") ||
    norm.includes("salario") ||
    norm.includes("ingreso")
  );
}

export function isFixedExpenseCategory(categoryName: string): boolean {
  const norm = normalizeName(categoryName);
  return (
    norm.includes("vivienda") ||
    norm.includes("hogar") ||
    norm.includes("alquiler") ||
    norm.includes("hipoteca") ||
    norm.includes("compra") ||
    norm.includes("supermercado") ||
    norm.includes("alimentacion") ||
    norm.includes("comida") ||
    norm.includes("transporte") ||
    norm.includes("gasolina") ||
    norm.includes("coche") ||
    norm.includes("suministro") ||
    norm.includes("luz") ||
    norm.includes("agua") ||
    norm.includes("gas")
  );
}

export function isPlazaCell(col: number, row: number): boolean {
  if (col === 10 && row === 10) return true;
  if (col === 10 && (row === 9 || row === 11)) return true;
  if (row === 10 && (col === 9 || col === 11)) return true;
  if ((col === 9 && row === 9) || (col === 11 && row === 9)) return true;
  if ((col === 9 && row === 11) || (col === 11 && row === 11)) return true;
  return false;
}

export function isRoadCell(col: number, row: number): boolean {
  if (col === 10 && row >= 3 && row <= 17) return true;
  if (row === 10 && col >= 3 && col <= 17) return true;
  if (row === 8 && col >= 8 && col <= 12) return true;
  if (row === 12 && col >= 8 && col <= 12) return true;
  return false;
}

export function isTreeCell(col: number, row: number): boolean {
  // Esquinas boscosas exteriores
  if (col <= 1 && row <= 2) return true;
  if (col >= 19 && row <= 2) return true;
  if (col <= 1 && row >= 18) return true;
  if (col >= 19 && row >= 18) return true;

  // Bosquecillos en cuadrantes intermedios
  if ((col === 3 && row === 4) || (col === 4 && row === 3)) return true;
  if ((col === 17 && row === 4) || (col === 16 && row === 3)) return true;
  if ((col === 3 && row === 16) || (col === 4 && row === 17)) return true;
  if ((col === 17 && row === 16) || (col === 16 && row === 17)) return true;

  if (row === 0 && col % 2 === 0) return true;
  if (row === 20 && col % 2 === 0) return true;
  return false;
}

export function isRockCell(col: number, row: number): boolean {
  // Afloramientos rocosos y canteras estratégicas
  if ((col === 6 && row === 2) || (col === 14 && row === 2)) return true;
  if ((col === 2 && row === 6) || (col === 18 && row === 6)) return true;
  if ((col === 6 && row === 18) || (col === 14 && row === 18)) return true;
  if ((col === 2 && row === 14) || (col === 18 && row === 14)) return true;
  if (col === 0 && (row === 8 || row === 12)) return true;
  if (col === 20 && (row === 8 || row === 12)) return true;
  return false;
}

export function isWaterCell(col: number, row: number): boolean {
  // Río / Lago serpenteante en sector occidental
  if ((col === 4 && row === 6) || (col === 4 && row === 7)) return true;
  if ((col === 5 && row === 7) || (col === 5 && row === 8)) return true;
  if ((col === 6 && row === 8) || (col === 6 && row === 9)) return true;

  // Estanque en sector oriental
  if ((col === 16 && row === 13) || (col === 16 && row === 14)) return true;
  if ((col === 15 && row === 14) || (col === 15 && row === 15)) return true;
  return false;
}

export function generateKingdomLayout(state: KingdomState): PlacedCell[] {
  const buildingMap = new Map<string, Building>();
  const usedSlots = new Set<string>();

  const incomeBuildings = state.buildings
    .filter((b) => isIncomeCategory(b.categoryName))
    .sort((a, b) => b.spentAmount - a.spentAmount);

  const fixedBuildings = state.buildings
    .filter((b) => !isIncomeCategory(b.categoryName) && isFixedExpenseCategory(b.categoryName))
    .sort((a, b) => b.spentAmount - a.spentAmount);

  const otherBuildings = state.buildings
    .filter((b) => !isIncomeCategory(b.categoryName) && !isFixedExpenseCategory(b.categoryName))
    .sort((a, b) => b.spentAmount - a.spentAmount);

  const assignBuildingToFirstAvailable = (building: Building, candidateSlots: Array<{ col: number; row: number }>) => {
    for (const slot of candidateSlots) {
      const key = `${slot.col},${slot.row}`;
      if (!usedSlots.has(key)) {
        usedSlots.add(key);
        buildingMap.set(key, building);
        return true;
      }
    }
    return false;
  };

  for (const b of incomeBuildings) {
    if (!assignBuildingToFirstAvailable(b, INCOME_BUILDING_SLOTS)) {
      assignBuildingToFirstAvailable(b, FIXED_EXPENSE_SLOTS);
    }
  }

  for (const b of fixedBuildings) {
    if (!assignBuildingToFirstAvailable(b, FIXED_EXPENSE_SLOTS)) {
      assignBuildingToFirstAvailable(b, INCOME_BUILDING_SLOTS) || assignBuildingToFirstAvailable(b, OTHER_EXPENSE_SLOTS);
    }
  }

  for (const b of otherBuildings) {
    if (!assignBuildingToFirstAvailable(b, OTHER_EXPENSE_SLOTS)) {
      assignBuildingToFirstAvailable(b, FIXED_EXPENSE_SLOTS) || assignBuildingToFirstAvailable(b, INCOME_BUILDING_SLOTS);
    }
  }

  const cells: PlacedCell[] = [];

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const key = `${col},${row}`;
      const isCenter = col === CENTER_COORD.col && row === CENTER_COORD.row;
      const isPerimeter = col <= 1 || col >= 19 || row <= 1 || row >= 19;
      const building = buildingMap.get(key);

      if (isCenter) {
        cells.push({ col, row, type: "treasury", isPerimeter: false });
      } else if (building) {
        cells.push({ col, row, type: "building", building, isPerimeter });
      } else if (isPlazaCell(col, row)) {
        cells.push({ col, row, type: "plaza", isPerimeter });
      } else if (isRoadCell(col, row)) {
        cells.push({ col, row, type: "road", isPerimeter });
      } else if (isWaterCell(col, row)) {
        cells.push({ col, row, type: "water", isPerimeter });
      } else if (isTreeCell(col, row)) {
        cells.push({ col, row, type: "tree", isPerimeter });
      } else if (isRockCell(col, row)) {
        cells.push({ col, row, type: "rock", isPerimeter });
      } else {
        cells.push({
          col,
          row,
          type: "ground",
          isPerimeter
        });
      }
    }
  }

  cells.sort((a, b) => {
    const depthA = a.col + a.row;
    const depthB = b.col + b.row;
    if (depthA !== depthB) return depthA - depthB;
    return a.row - b.row;
  });

  return cells;
}

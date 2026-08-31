import type { Building, KingdomState } from "../api/kingdom.js";

export const GRID_SIZE = 7;
export const CENTER_COORD = { col: 3, row: 3 };

export type CellType = "ground" | "road" | "plaza" | "treasury" | "building";
export type DecorationType = "pine" | "autumn_oak" | "chest" | "fence_n" | "fence_w" | "fence_corner";

export interface PlacedCell {
  col: number;
  row: number;
  type: CellType;
  building?: Building;
  decoration?: DecorationType;
  isAltGround?: boolean;
  isPerimeter?: boolean;
}

export const AVAILABLE_BUILDING_SLOTS: Array<{ col: number; row: number }> = [
  { col: 1, row: 1 },
  { col: 5, row: 1 },
  { col: 1, row: 5 },
  { col: 5, row: 5 },
  { col: 0, row: 2 },
  { col: 2, row: 0 },
  { col: 4, row: 0 },
  { col: 6, row: 2 },
  { col: 0, row: 4 },
  { col: 2, row: 6 },
  { col: 4, row: 6 },
  { col: 6, row: 4 }
];

export function isPlazaCell(col: number, row: number): boolean {
  if (col === 3 && row === 3) return true;
  if (col === 3 && (row === 2 || row === 4)) return true;
  if (row === 3 && (col === 2 || col === 4)) return true;
  return false;
}

export function isRoadCell(col: number, row: number): boolean {
  if (col === 3 && (row === 0 || row === 1 || row === 5 || row === 6)) return true;
  if (row === 3 && (col === 0 || col === 1 || col === 5 || col === 6)) return true;
  if ((col === 2 && row === 2) || (col === 4 && row === 2)) return true;
  if ((col === 2 && row === 4) || (col === 4 && row === 4)) return true;
  return false;
}

export function generateKingdomLayout(state: KingdomState): PlacedCell[] {
  const buildingMap = new Map<string, Building>();
  const buildings = [...state.buildings].sort((a, b) => b.spentAmount - a.spentAmount);

  buildings.forEach((b, idx) => {
    if (idx < AVAILABLE_BUILDING_SLOTS.length) {
      const slot = AVAILABLE_BUILDING_SLOTS[idx];
      buildingMap.set(`${slot.col},${slot.row}`, b);
    }
  });

  const cells: PlacedCell[] = [];

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const key = `${col},${row}`;
      const isCenter = col === CENTER_COORD.col && row === CENTER_COORD.row;
      const isPerimeter = col === 0 || col === 6 || row === 0 || row === 6;
      const building = buildingMap.get(key);

      if (isCenter) {
        cells.push({ col, row, type: "treasury", isPerimeter: false });
      } else if (building) {
        cells.push({ col, row, type: "building", building, isPerimeter });
      } else if (isPlazaCell(col, row)) {
        cells.push({ col, row, type: "plaza", isPerimeter });
      } else if (isRoadCell(col, row)) {
        cells.push({ col, row, type: "road", isPerimeter });
      } else {
        const isAlt = (col + row) % 2 === 0;
        const decoration = resolveGroundDecoration(col, row);
        cells.push({
          col,
          row,
          type: "ground",
          isAltGround: isAlt,
          isPerimeter,
          decoration
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

function resolveGroundDecoration(col: number, row: number): DecorationType | undefined {
  if (col === 0 && row === 0) return "pine";
  if (col === 6 && row === 0) return "pine";
  if (col === 0 && row === 6) return "pine";
  if (col === 6 && row === 6) return "pine";

  if (col === 1 && row === 0) return "pine";
  if (col === 5 && row === 0) return "pine";
  if (col === 1 && row === 6) return "pine";
  if (col === 5 && row === 6) return "pine";

  if (col === 0 && row === 1) return "autumn_oak";
  if (col === 6 && row === 1) return "autumn_oak";
  if (col === 0 && row === 5) return "autumn_oak";
  if (col === 6 && row === 5) return "autumn_oak";

  if (col === 1 && row === 2) return "chest";
  if (col === 5 && row === 4) return "chest";

  if (col === 3 && row === 0) return "fence_n";
  if (col === 0 && row === 3) return "fence_w";

  return undefined;
}

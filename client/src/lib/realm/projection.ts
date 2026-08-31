export interface Point {
  x: number;
  y: number;
}

export interface GridCoord {
  col: number;
  row: number;
}

export interface ProjectionConfig {
  tileWidth: number;
  tileHeight: number;
  originX: number;
  originY: number;
}

/**
 * Converts grid coordinates (col, row) to 2D isometric screen space (x, y).
 * Uses standard 2:1 isometric ratio.
 */
export function gridToScreen(
  col: number,
  row: number,
  config: ProjectionConfig
): Point {
  const { tileWidth, tileHeight, originX, originY } = config;
  const halfW = tileWidth / 2;
  const halfH = tileHeight / 2;

  const x = originX + (col - row) * halfW;
  const y = originY + (col + row) * halfH;

  return { x, y };
}

/**
 * Converts screen space coordinates (x, y) back to discrete grid cell (col, row).
 */
export function screenToGrid(
  screenX: number,
  screenY: number,
  config: ProjectionConfig
): GridCoord {
  const { tileWidth, tileHeight, originX, originY } = config;
  const halfW = tileWidth / 2;
  const halfH = tileHeight / 2;

  const relX = screenX - originX;
  const relY = screenY - originY;

  const col = Math.floor((relY / halfH + relX / halfW) / 2);
  const row = Math.floor((relY / halfH - relX / halfW) / 2);

  return { col, row };
}

/**
 * Calculates total bounding dimensions for a square grid of N x N tiles.
 */
export function getGridBounds(
  gridSize: number,
  tileWidth: number,
  tileHeight: number
): { width: number; height: number; offsetY: number } {
  const width = gridSize * tileWidth;
  const height = gridSize * tileHeight;
  const offsetY = tileHeight / 2;

  return { width, height, offsetY };
}

export const FRAME_W = 9;
export const FRAME_H = 9;
export const FRAMES_PER_DIRECTION = 2;
export const DIRECTION_COUNT = 4;
export const DIR_E = 2;
export const DIR_W = 3;
export const FRAME_COUNT = FRAMES_PER_DIRECTION;
export const TOTAL_FRAME_COUNT = FRAMES_PER_DIRECTION * DIRECTION_COUNT;
export const SHEET_W = FRAME_W * FRAMES_PER_DIRECTION;
export const SHEET_H = FRAME_H * DIRECTION_COUNT;
export const CANVAS_ZOOM = 14;

export const PRESET_PALETTE = [
  'transparent',
  '#1a1a2e',
  '#e94560',
  '#ffffff',
  '#7bed9f',
  '#feca57',
  '#48dbfb',
  '#ff9ff3',
  '#54a0ff',
  '#576574',
];

export type Tool = 'brush' | 'eraser' | 'fill' | 'picker';

export function createEmptyGrid(fill = 'transparent'): string[] {
  return Array.from({ length: SHEET_W * SHEET_H }, () => fill);
}

export function gridIndex(globalX: number, y: number): number {
  return y * SHEET_W + globalX;
}

export function localToGlobal(
  direction: number,
  frame: number,
  localX: number,
  localY: number,
): { x: number; y: number } {
  return {
    x: frame * FRAME_W + localX,
    y: direction * FRAME_H + localY,
  };
}

/** 帧 1 复制该朝向帧 0 */
export function syncWalkFromIdle(grid: string[], direction: number): void {
  for (let ly = 0; ly < FRAME_H; ly++) {
    for (let lx = 0; lx < FRAME_W; lx++) {
      const { x: x0, y: y0 } = localToGlobal(direction, 0, lx, ly);
      const { x: x1, y: y1 } = localToGlobal(direction, 1, lx, ly);
      grid[gridIndex(x1, y1)] = grid[gridIndex(x0, y0)] ?? 'transparent';
    }
  }
}

/** 东/西侧面水平对称：sourceDir 为刚编辑的一侧 */
export function syncEastWestMirror(grid: string[], frame: number, sourceDir: typeof DIR_E | typeof DIR_W): void {
  const targetDir = sourceDir === DIR_E ? DIR_W : DIR_E;
  for (let ly = 0; ly < FRAME_H; ly++) {
    for (let lx = 0; lx < FRAME_W; lx++) {
      const { x: sx, y: sy } = localToGlobal(sourceDir, frame, lx, ly);
      const flipLx = FRAME_W - 1 - lx;
      const { x: dx, y: dy } = localToGlobal(targetDir, frame, flipLx, ly);
      grid[gridIndex(dx, dy)] = grid[gridIndex(sx, sy)] ?? 'transparent';
    }
  }
}

export function syncAllFramesInit(grid: string[]): void {
  for (let direction = 0; direction < DIRECTION_COUNT; direction++) {
    syncWalkFromIdle(grid, direction);
  }
  syncEastWestMirror(grid, 0, DIR_E);
  syncEastWestMirror(grid, 1, DIR_E);
}

export function createInitialGrid(): string[] {
  const grid = createEmptyGrid();
  syncAllFramesInit(grid);
  return grid;
}

export function afterFrameEdit(
  grid: string[],
  direction: number,
  frame: number,
): void {
  if (frame === 0) {
    syncWalkFromIdle(grid, direction);
  }
  if (direction === DIR_E || direction === DIR_W) {
    syncEastWestMirror(grid, frame, direction as typeof DIR_E);
    if (frame === 0) {
      syncWalkFromIdle(grid, direction === DIR_E ? DIR_W : DIR_E);
    }
  }
}

export async function gridToPngBlob(grid: string[]): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = SHEET_W;
  canvas.height = SHEET_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法创建画布');

  ctx.clearRect(0, 0, SHEET_W, SHEET_H);
  for (let y = 0; y < SHEET_H; y++) {
    for (let x = 0; x < SHEET_W; x++) {
      const color = grid[gridIndex(x, y)] ?? 'transparent';
      if (color === 'transparent') continue;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error('PNG 导出失败'));
      else resolve(blob);
    }, 'image/png');
  });
}

export async function loadGridFromImageUrl(url: string): Promise<string[]> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;
  await img.decode();

  const canvas = document.createElement('canvas');
  canvas.width = SHEET_W;
  canvas.height = SHEET_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法读取图片');

  ctx.clearRect(0, 0, SHEET_W, SHEET_H);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, SHEET_W, SHEET_H);

  const data = ctx.getImageData(0, 0, SHEET_W, SHEET_H).data;
  const grid = createEmptyGrid();
  for (let y = 0; y < SHEET_H; y++) {
    for (let x = 0; x < SHEET_W; x++) {
      const i = (y * SHEET_W + x) * 4;
      const a = data[i + 3]!;
      if (a < 16) continue;
      const r = data[i]!;
      const g = data[i + 1]!;
      const b = data[i + 2]!;
      grid[gridIndex(x, y)] = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
  }
  return grid;
}

export function floodFill(
  grid: string[],
  startX: number,
  startY: number,
  target: string,
  replacement: string,
): boolean {
  if (target === replacement) return false;
  const stack: Array<[number, number]> = [[startX, startY]];
  let changed = false;
  while (stack.length) {
    const [x, y] = stack.pop()!;
    if (x < 0 || y < 0 || x >= SHEET_W || y >= SHEET_H) continue;
    const idx = gridIndex(x, y);
    if (grid[idx] !== target) continue;
    grid[idx] = replacement;
    changed = true;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return changed;
}

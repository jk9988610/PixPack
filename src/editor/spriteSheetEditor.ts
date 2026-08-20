export const FRAME_W = 32;
export const FRAME_H = 32;
export const FRAME_COUNT = 10;
export const SHEET_W = FRAME_W * FRAME_COUNT;
export const SHEET_H = FRAME_H;

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

export function frameOrigin(frame: number): number {
  return frame * FRAME_W;
}

export function localToGlobal(frame: number, localX: number, localY: number): { x: number; y: number } {
  return { x: frameOrigin(frame) + localX, y: localY };
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
  const scale = Math.min(SHEET_W / img.width, SHEET_H / img.height);
  const dw = Math.min(SHEET_W, Math.round(img.width * scale));
  const dh = Math.min(SHEET_H, Math.round(img.height * scale));
  ctx.drawImage(img, 0, 0, dw, dh);

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

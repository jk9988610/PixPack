import { FRAME_COUNT, FRAME_H, FRAME_W, gridIndex, localToGlobal } from './spriteSheetEditor';

export type BoneId = 'none' | 'head' | 'body' | 'arm' | 'leg_f' | 'leg_b';

export const BONE_OPTIONS: Array<{ id: BoneId; label: string }> = [
  { id: 'head', label: '头' },
  { id: 'body', label: '身' },
  { id: 'arm', label: '手' },
  { id: 'leg_f', label: '前腿' },
  { id: 'leg_b', label: '后腿' },
];

const CHAR_TO_BONE: Record<string, BoneId> = {
  '.': 'none',
  h: 'head',
  b: 'body',
  a: 'arm',
  f: 'leg_f',
  r: 'leg_b',
};

/** 16×16 侧视骨骼（红白机玛丽式块面），10 帧 idle + walk */
const FRAME_TEMPLATES: string[] = [
  // 0 idle
  `................\n.....hh.........\n....hhhh........\n...bbbbbb.......\n...bbbbbb.......\n...bb..bb.......\n...bb..bb.......\n................\n................\n................\n................\n................\n................\n................\n................\n................`,
  // 1 idle
  `................\n.....hh.........\n....hhhh........\n...bbbbbb.......\n...bbbbbb.......\n...bb..bb.......\n...bb..bb.......\n................\n................\n................\n................\n................\n................\n................\n................\n................`,
  // 2 idle bounce
  `................\n................\n.....hh.........\n....hhhh........\n...bbbbbb.......\n...bbbbbb.......\n...bb..bb.......\n...bb..bb.......\n................\n................\n................\n................\n................\n................\n................\n................`,
  // 3 idle
  `................\n.....hh.........\n....hhhh........\n...bbbbbb.......\n...bbbbbb.......\n...bb..bb.......\n...bb..bb.......\n................\n................\n................\n................\n................\n................\n................\n................\n................`,
  // 4 walk
  `................\n.....hh.........\n....hhhh........\n...bbbbbb.......\n...bbbbbb.......\n....f...........\n...bb...b.......\n...bb..bb.......\n................\n................\n................\n................\n................\n................\n................\n................`,
  // 5 walk
  `................\n.....hh.........\n....hhhh........\n...bbbbbb.......\n...bbbbbb.......\n...bb..bb.......\n....f..r........\n................\n................\n................\n................\n................\n................\n................\n................\n................`,
  // 6 walk
  `................\n.....hh.........\n....hhhh........\n...bbbbbb.......\n...bbbbbb.......\n...bb..bb.......\n....r...........\n....f...........\n................\n................\n................\n................\n................\n................\n................\n................`,
  // 7 walk
  `................\n.....hh.........\n....hhhh........\n...bbbbbb.......\n...bbbbbb.......\n...bb..bb.......\n....f..r........\n................\n................\n................\n................\n................\n................\n................\n................\n................`,
  // 8 walk
  `................\n.....hh.........\n....hhhh........\n...bbbbbb.......\n...bbbbbb.......\n....f...........\n...bb...b.......\n...bb..bb.......\n................\n................\n................\n................\n................\n................\n................\n................`,
  // 9 walk
  `................\n.....hh.........\n....hhhh........\n...bbbbbb.......\n...bbbbbb.......\n...bb..bb.......\n....r..f........\n................\n................\n................\n................\n................\n................\n................\n................\n................`,
];

function parseTemplate(text: string): BoneId[] {
  const rows = text.trim().split('\n');
  const bones: BoneId[] = [];
  for (const row of rows) {
    for (const ch of row) {
      bones.push(CHAR_TO_BONE[ch] ?? 'none');
    }
  }
  return bones;
}

const SKELETON_FRAMES = FRAME_TEMPLATES.map(parseTemplate);

export const SKELETON_GUIDE_COLOR = '#5a5a72';
export const DEFAULT_SKIN: Record<Exclude<BoneId, 'none'>, string> = {
  head: '#feca57',
  body: '#e94560',
  arm: '#feca57',
  leg_f: '#0066ff',
  leg_b: '#0044bb',
};

export function getBoneAt(frame: number, localX: number, localY: number): BoneId {
  if (localX < 0 || localY < 0 || localX >= FRAME_W || localY >= FRAME_H) return 'none';
  const idx = localY * FRAME_W + localX;
  return SKELETON_FRAMES[frame]?.[idx] ?? 'none';
}

export function isPaintable(frame: number, localX: number, localY: number): boolean {
  return getBoneAt(frame, localX, localY) !== 'none';
}

export function createDefaultSkinGrid(): string[] {
  const grid = Array.from({ length: FRAME_COUNT * FRAME_W * FRAME_H }, () => 'transparent');
  for (let frame = 0; frame < FRAME_COUNT; frame++) {
    for (let ly = 0; ly < FRAME_H; ly++) {
      for (let lx = 0; lx < FRAME_W; lx++) {
        const bone = getBoneAt(frame, lx, ly);
        if (bone === 'none') continue;
        const { x, y } = localToGlobal(frame, lx, ly);
        grid[gridIndex(x, y)] = DEFAULT_SKIN[bone];
      }
    }
  }
  return grid;
}

export function fillBoneOnFrame(
  grid: string[],
  frame: number,
  bone: BoneId,
  color: string,
): void {
  if (bone === 'none') return;
  for (let ly = 0; ly < FRAME_H; ly++) {
    for (let lx = 0; lx < FRAME_W; lx++) {
      if (getBoneAt(frame, lx, ly) !== bone) continue;
      const { x, y } = localToGlobal(frame, lx, ly);
      grid[gridIndex(x, y)] = color;
    }
  }
}

export function floodFillBone(
  grid: string[],
  frame: number,
  localX: number,
  localY: number,
  color: string,
): boolean {
  const bone = getBoneAt(frame, localX, localY);
  if (bone === 'none') return false;
  const stack: Array<[number, number]> = [[localX, localY]];
  let changed = false;
  while (stack.length) {
    const [lx, ly] = stack.pop()!;
    if (lx < 0 || ly < 0 || lx >= FRAME_W || ly >= FRAME_H) continue;
    if (getBoneAt(frame, lx, ly) !== bone) continue;
    const { x, y } = localToGlobal(frame, lx, ly);
    const idx = gridIndex(x, y);
    if (grid[idx] === color) continue;
    grid[idx] = color;
    changed = true;
    stack.push([lx + 1, ly], [lx - 1, ly], [lx, ly + 1], [lx, ly - 1]);
  }
  return changed;
}

export function mergeSkinWithSkeleton(grid: string[], frame: number): void {
  for (let ly = 0; ly < FRAME_H; ly++) {
    for (let lx = 0; lx < FRAME_W; lx++) {
      const { x, y } = localToGlobal(frame, lx, ly);
      const idx = gridIndex(x, y);
      if (getBoneAt(frame, lx, ly) === 'none') {
        grid[idx] = 'transparent';
      }
    }
  }
}

export function mergeAllSkinWithSkeleton(grid: string[]): void {
  for (let frame = 0; frame < FRAME_COUNT; frame++) {
    mergeSkinWithSkeleton(grid, frame);
  }
}

export function getSkeletonGuideColor(frame: number, localX: number, localY: number): string | null {
  const bone = getBoneAt(frame, localX, localY);
  if (bone === 'none') return null;
  return SKELETON_GUIDE_COLOR;
}

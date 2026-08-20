import {
  DIRECTION_COUNT,
  FRAME_H,
  FRAME_W,
  FRAMES_PER_DIRECTION,
  SHEET_H,
  SHEET_W,
  gridIndex,
  localToGlobal,
} from './spriteSheetEditor';

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

/** 侧视（东向）10 帧 */
const SIDE_TEMPLATES: string[] = [
  `................\n.....hh.........\n....hhhh........\n...bbbbbb.......\n...bbbbbb.......\n...bb..bb.......\n...bb..bb.......\n................\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....hh.........\n....hhhh........\n...bbbbbb.......\n...bbbbbb.......\n...bb..bb.......\n...bb..bb.......\n................\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n................\n.....hh.........\n....hhhh........\n...bbbbbb.......\n...bbbbbb.......\n...bb..bb.......\n...bb..bb.......\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....hh.........\n....hhhh........\n...bbbbbb.......\n...bbbbbb.......\n...bb..bb.......\n...bb..bb.......\n................\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....hh.........\n....hhhh........\n...bbbbbb.......\n...bbbbbb.......\n....f...........\n...bb...b.......\n...bb..bb.......\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....hh.........\n....hhhh........\n...bbbbbb.......\n...bbbbbb.......\n...bb..bb.......\n....f..r........\n................\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....hh.........\n....hhhh........\n...bbbbbb.......\n...bbbbbb.......\n...bb..bb.......\n....r...........\n....f...........\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....hh.........\n....hhhh........\n...bbbbbb.......\n...bbbbbb.......\n...bb..bb.......\n....f..r........\n................\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....hh.........\n....hhhh........\n...bbbbbb.......\n...bbbbbb.......\n....f...........\n...bb...b.......\n...bb..bb.......\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....hh.........\n....hhhh........\n...bbbbbb.......\n...bbbbbb.......\n...bb..bb.......\n....r..f........\n................\n................\n................\n................\n................\n................\n................\n................\n................`,
];

/** 正向（南向，面向镜头） */
const FRONT_TEMPLATES: string[] = [
  `................\n.....hhhh.......\n....bbbbbb......\n....bbbbbb......\n.....bbbb.......\n....bb..bb......\n....bb..bb......\n....ff..rr......\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....hhhh.......\n....bbbbbb......\n....bbbbbb......\n.....bbbb.......\n....bb..bb......\n....bb..bb......\n....ff..rr......\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n................\n.....hhhh.......\n....bbbbbb......\n....bbbbbb......\n.....bbbb.......\n....bb..bb......\n....ff..rr......\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....hhhh.......\n....bbbbbb......\n....bbbbbb......\n.....bbbb.......\n....bb..bb......\n....bb..bb......\n....ff..rr......\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....hhhh.......\n....bbbbbb......\n....bbbbbb......\n.....bbbb.......\n....bb..bb......\n....f....r......\n....bb..bb......\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....hhhh.......\n....bbbbbb......\n....bbbbbb......\n.....bbbb.......\n....bb..bb......\n....ff..rr......\n................\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....hhhh.......\n....bbbbbb......\n....bbbbbb......\n.....bbbb.......\n....bb..bb......\n....r....f......\n....bb..bb......\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....hhhh.......\n....bbbbbb......\n....bbbbbb......\n.....bbbb.......\n....bb..bb......\n....ff..rr......\n................\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....hhhh.......\n....bbbbbb......\n....bbbbbb......\n.....bbbb.......\n....bb..bb......\n....f....r......\n....bb..bb......\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....hhhh.......\n....bbbbbb......\n....bbbbbb......\n.....bbbb.......\n....bb..bb......\n....r....f......\n....bb..bb......\n................\n................\n................\n................\n................\n................\n................\n................`,
];

/** 背向（北向） */
const BACK_TEMPLATES: string[] = [
  `................\n.....bbbb.......\n....bbbbbb......\n....bbbbbb......\n.....bbbb.......\n....bb..bb......\n....bb..bb......\n....ff..rr......\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....bbbb.......\n....bbbbbb......\n....bbbbbb......\n.....bbbb.......\n....bb..bb......\n....bb..bb......\n....ff..rr......\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n................\n.....bbbb.......\n....bbbbbb......\n....bbbbbb......\n.....bbbb.......\n....bb..bb......\n....ff..rr......\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....bbbb.......\n....bbbbbb......\n....bbbbbb......\n.....bbbb.......\n....bb..bb......\n....bb..bb......\n....ff..rr......\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....bbbb.......\n....bbbbbb......\n....bbbbbb......\n.....bbbb.......\n....bb..bb......\n....f....r......\n....bb..bb......\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....bbbb.......\n....bbbbbb......\n....bbbbbb......\n.....bbbb.......\n....bb..bb......\n....ff..rr......\n................\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....bbbb.......\n....bbbbbb......\n....bbbbbb......\n.....bbbb.......\n....bb..bb......\n....r....f......\n....bb..bb......\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....bbbb.......\n....bbbbbb......\n....bbbbbb......\n.....bbbb.......\n....bb..bb......\n....ff..rr......\n................\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....bbbb.......\n....bbbbbb......\n....bbbbbb......\n.....bbbb.......\n....bb..bb......\n....f....r......\n....bb..bb......\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....bbbb.......\n....bbbbbb......\n....bbbbbb......\n.....bbbb.......\n....bb..bb......\n....r....f......\n....bb..bb......\n................\n................\n................\n................\n................\n................\n................\n................`,
];

/** 东南对角（与侧视类似，略偏下） */
const DIAG_SE_TEMPLATES: string[] = SIDE_TEMPLATES.map((tpl, i) => {
  if (i < 4) return tpl;
  return tpl.replace('....f...........', '.....f..........').replace('....r...........', '.....r..........');
});

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

function flipHorizontal(bones: BoneId[]): BoneId[] {
  const out: BoneId[] = [];
  for (let y = 0; y < FRAME_H; y++) {
    for (let x = FRAME_W - 1; x >= 0; x--) {
      out.push(bones[y * FRAME_W + x] ?? 'none');
    }
  }
  return out;
}

const SIDE_FRAMES = SIDE_TEMPLATES.map(parseTemplate);
const FRONT_FRAMES = FRONT_TEMPLATES.map(parseTemplate);
const BACK_FRAMES = BACK_TEMPLATES.map(parseTemplate);
const DIAG_SE_FRAMES = DIAG_SE_TEMPLATES.map(parseTemplate);
const DIAG_NE_FRAMES = DIAG_SE_FRAMES.map(flipHorizontal);

/** 行号 → 骨骼组：0 S, 1 SW, 2 W, 3 NW, 4 N, 5 NE, 6 E, 7 SE */
function baseBonesForDirection(direction: number, frame: number): BoneId[] {
  switch (direction) {
    case 0:
      return FRONT_FRAMES[frame] ?? [];
    case 1:
      return flipHorizontal(DIAG_SE_FRAMES[frame] ?? []);
    case 2:
      return flipHorizontal(SIDE_FRAMES[frame] ?? []);
    case 3:
      return flipHorizontal(DIAG_NE_FRAMES[frame] ?? []);
    case 4:
      return BACK_FRAMES[frame] ?? [];
    case 5:
      return DIAG_NE_FRAMES[frame] ?? [];
    case 6:
      return SIDE_FRAMES[frame] ?? [];
    case 7:
      return DIAG_SE_FRAMES[frame] ?? [];
    default:
      return [];
  }
}

export const SKELETON_GUIDE_COLOR = '#5a5a72';
export const DEFAULT_SKIN: Record<Exclude<BoneId, 'none'>, string> = {
  head: '#feca57',
  body: '#e94560',
  arm: '#feca57',
  leg_f: '#0066ff',
  leg_b: '#0044bb',
};

export function getBoneAt(
  direction: number,
  frame: number,
  localX: number,
  localY: number,
): BoneId {
  if (localX < 0 || localY < 0 || localX >= FRAME_W || localY >= FRAME_H) return 'none';
  const bones = baseBonesForDirection(direction, frame);
  const idx = localY * FRAME_W + localX;
  return bones[idx] ?? 'none';
}

export function isPaintable(
  direction: number,
  frame: number,
  localX: number,
  localY: number,
): boolean {
  return getBoneAt(direction, frame, localX, localY) !== 'none';
}

export function createDefaultSkinGrid(): string[] {
  const grid = Array.from({ length: SHEET_W * SHEET_H }, () => 'transparent');
  for (let direction = 0; direction < DIRECTION_COUNT; direction++) {
    for (let frame = 0; frame < FRAMES_PER_DIRECTION; frame++) {
      for (let ly = 0; ly < FRAME_H; ly++) {
        for (let lx = 0; lx < FRAME_W; lx++) {
          const bone = getBoneAt(direction, frame, lx, ly);
          if (bone === 'none') continue;
          const { x, y } = localToGlobal(direction, frame, lx, ly);
          grid[gridIndex(x, y)] = DEFAULT_SKIN[bone];
        }
      }
    }
  }
  return grid;
}

export function fillBoneOnFrame(
  grid: string[],
  direction: number,
  frame: number,
  bone: BoneId,
  color: string,
): void {
  if (bone === 'none') return;
  for (let ly = 0; ly < FRAME_H; ly++) {
    for (let lx = 0; lx < FRAME_W; lx++) {
      if (getBoneAt(direction, frame, lx, ly) !== bone) continue;
      const { x, y } = localToGlobal(direction, frame, lx, ly);
      grid[gridIndex(x, y)] = color;
    }
  }
}

export function floodFillBone(
  grid: string[],
  direction: number,
  frame: number,
  localX: number,
  localY: number,
  color: string,
): boolean {
  const bone = getBoneAt(direction, frame, localX, localY);
  if (bone === 'none') return false;
  const stack: Array<[number, number]> = [[localX, localY]];
  let changed = false;
  while (stack.length) {
    const [lx, ly] = stack.pop()!;
    if (lx < 0 || ly < 0 || lx >= FRAME_W || ly >= FRAME_H) continue;
    if (getBoneAt(direction, frame, lx, ly) !== bone) continue;
    const { x, y } = localToGlobal(direction, frame, lx, ly);
    const idx = gridIndex(x, y);
    if (grid[idx] === color) continue;
    grid[idx] = color;
    changed = true;
    stack.push([lx + 1, ly], [lx - 1, ly], [lx, ly + 1], [lx, ly - 1]);
  }
  return changed;
}

export function mergeSkinWithSkeleton(
  grid: string[],
  direction: number,
  frame: number,
): void {
  for (let ly = 0; ly < FRAME_H; ly++) {
    for (let lx = 0; lx < FRAME_W; lx++) {
      const { x, y } = localToGlobal(direction, frame, lx, ly);
      const idx = gridIndex(x, y);
      if (getBoneAt(direction, frame, lx, ly) === 'none') {
        grid[idx] = 'transparent';
      }
    }
  }
}

export function mergeAllSkinWithSkeleton(grid: string[]): void {
  for (let direction = 0; direction < DIRECTION_COUNT; direction++) {
    for (let frame = 0; frame < FRAMES_PER_DIRECTION; frame++) {
      mergeSkinWithSkeleton(grid, direction, frame);
    }
  }
}

export function getSkeletonGuideColor(
  direction: number,
  frame: number,
  localX: number,
  localY: number,
): string | null {
  const bone = getBoneAt(direction, frame, localX, localY);
  if (bone === 'none') return null;
  return SKELETON_GUIDE_COLOR;
}

import type { AnimationDef, CharacterMeta } from '../types';

export const DIRECTION_IDS = ['s', 'sw', 'w', 'nw', 'n', 'ne', 'e', 'se'] as const;
export type DirectionId = (typeof DIRECTION_IDS)[number];

export const DIRECTION_LABELS: Record<DirectionId, string> = {
  s: '↓ 南',
  sw: '↙ 西南',
  w: '← 西',
  nw: '↖ 西北',
  n: '↑ 北',
  ne: '↗ 东北',
  e: '→ 东',
  se: '↘ 东南',
};

export const FRAMES_PER_DIRECTION = 10;
export const DIRECTION_COUNT = DIRECTION_IDS.length;
export const TOTAL_SHEET_FRAMES = FRAMES_PER_DIRECTION * DIRECTION_COUNT;

export const IDLE_FRAME_INDICES = [0, 1, 2, 3];
export const WALK_FRAME_INDICES = [4, 5, 6, 7, 8, 9];

export function directionIndex(id: DirectionId): number {
  return DIRECTION_IDS.indexOf(id);
}

export function globalFrameIndex(direction: number, frameInDirection: number): number {
  return direction * FRAMES_PER_DIRECTION + frameInDirection;
}

export function resolveTextureIndex(
  meta: CharacterMeta,
  direction: number,
  frameInDirection: number,
): number {
  if (!meta.directions?.length || meta.frames.length <= FRAMES_PER_DIRECTION) {
    return frameInDirection;
  }
  const perDir = meta.framesPerDirection ?? FRAMES_PER_DIRECTION;
  return direction * perDir + frameInDirection;
}

export function isEightDirectionMeta(meta: CharacterMeta): boolean {
  return Boolean(meta.directions?.length) && meta.frames.length > FRAMES_PER_DIRECTION;
}

export function buildEightDirectionMeta(
  frameWidth = 16,
  frameHeight = 16,
  scale = 4,
): CharacterMeta {
  const animations: Record<string, AnimationDef> = {
    idle: { frames: [...IDLE_FRAME_INDICES], fps: 4, loop: true },
    walk: { frames: [...WALK_FRAME_INDICES], fps: 8, loop: true },
  };

  const frames = Array.from({ length: TOTAL_SHEET_FRAMES }, (_, i) => ({
    x: (i % FRAMES_PER_DIRECTION) * frameWidth,
    y: Math.floor(i / FRAMES_PER_DIRECTION) * frameHeight,
  }));

  return {
    frameWidth,
    frameHeight,
    scale,
    filter: 'nearest',
    directions: [...DIRECTION_IDS],
    framesPerDirection: FRAMES_PER_DIRECTION,
    animations,
    frames,
  };
}

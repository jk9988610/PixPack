import type { AnimationDef, CharacterMeta } from '../types';

/** 行序：南(正) → 北(背) → 东(侧) → 西(侧) */
export const DIRECTION_IDS = ['s', 'n', 'e', 'w'] as const;
export type DirectionId = (typeof DIRECTION_IDS)[number];

export const DIRECTION_LABELS: Record<DirectionId, string> = {
  s: '↓ 南',
  n: '↑ 北',
  e: '→ 东',
  w: '← 西',
};

export const FRAMES_PER_DIRECTION = 2;
export const DIRECTION_COUNT = DIRECTION_IDS.length;
export const TOTAL_SHEET_FRAMES = FRAMES_PER_DIRECTION * DIRECTION_COUNT;

/** 帧 0 = idle，帧 1 = walk */
export const IDLE_FRAME = 0;
export const WALK_FRAME = 1;

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

export function isDirectionalMeta(meta: CharacterMeta): boolean {
  return Boolean(meta.directions?.length) && meta.frames.length > FRAMES_PER_DIRECTION;
}

export function buildCharacterMeta(frameWidth = 8, frameHeight = 8, scale = 6): CharacterMeta {
  const animations: Record<string, AnimationDef> = {
    idle: { frames: [IDLE_FRAME], fps: 2, loop: true },
    walk: { frames: [WALK_FRAME], fps: 4, loop: true },
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

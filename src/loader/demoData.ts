import type { CharacterMeta, ManifestPack } from '../types';

export const DEFAULT_CHARACTER_META: CharacterMeta = {
  frameWidth: 32,
  frameHeight: 32,
  scale: 3,
  filter: 'nearest',
  animations: {
    idle: { frames: [0, 1, 2, 3], fps: 4, loop: true },
    walk: { frames: [4, 5, 6, 7, 8, 9], fps: 8, loop: true },
  },
  frames: Array.from({ length: 10 }, (_, i) => ({ x: i * 32, y: 0 })),
};

const DEMO_BOOTSTRAP: ManifestPack = {
  pack: {
    id: 'demo-bootstrap',
    slug: 'bootstrap',
    name: 'Bootstrap',
    category: 'bootstrap',
    priority: 0,
    version: 1,
    zone_id: null,
    byte_size: 1024,
  },
  assets: [
    {
      id: 'demo-bootstrap-logo',
      pack_id: 'demo-bootstrap',
      kind: 'json',
      storage_path: 'local/bootstrap/manifest.json',
      public_url: `${import.meta.env.BASE_URL}bootstrap/manifest.json`,
      byte_size: 256,
    },
  ],
  characters: [],
};

const DEMO_PLAYER: ManifestPack = {
  pack: {
    id: 'demo-player',
    slug: 'player',
    name: 'Player',
    category: 'player',
    priority: 10,
    version: 1,
    zone_id: null,
    byte_size: 4096,
  },
  assets: [
    {
      id: 'demo-player-sheet',
      pack_id: 'demo-player',
      kind: 'spritesheet',
      storage_path: 'local/demo/spritesheet.png',
      public_url: `${import.meta.env.BASE_URL}demo/spritesheet.png`,
      byte_size: 3840,
    },
  ],
  characters: [
    {
      id: 'demo-character',
      pack_id: 'demo-player',
      name: '默认',
      role: 'player',
      meta_json: DEFAULT_CHARACTER_META,
      sheet_asset_id: 'demo-player-sheet',
    },
  ],
};

const DEMO_MAP: Record<string, ManifestPack> = {
  bootstrap: DEMO_BOOTSTRAP,
  player: DEMO_PLAYER,
};

export function getDemoManifest(slugs: string[]): ManifestPack[] {
  return slugs.map((slug) => {
    const pack = DEMO_MAP[slug];
    if (!pack) throw new Error(`Demo 模式未定义资源包：${slug}`);
    return pack;
  });
}

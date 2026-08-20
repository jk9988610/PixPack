import type { CharacterMeta, ManifestPack } from '../types';
import { buildEightDirectionMeta } from '../editor/directions';

export const DEFAULT_CHARACTER_META: CharacterMeta = buildEightDirectionMeta();

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
    byte_size: 8192,
  },
  assets: [
    {
      id: 'demo-player-sheet',
      pack_id: 'demo-player',
      kind: 'spritesheet',
      storage_path: 'local/demo/spritesheet.png',
      public_url: `${import.meta.env.BASE_URL}demo/spritesheet.png`,
      byte_size: 2048,
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

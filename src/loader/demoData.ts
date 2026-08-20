import type { CharacterMeta, ManifestPack } from '../types';
import { buildCharacterMeta } from '../editor/directions';

export const DEFAULT_CHARACTER_META: CharacterMeta = buildCharacterMeta();

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

const DEMO_MAP: Record<string, ManifestPack> = {
  bootstrap: DEMO_BOOTSTRAP,
};

export function getDemoManifest(slugs: string[]): ManifestPack[] {
  return slugs
    .map((slug) => DEMO_MAP[slug])
    .filter((pack): pack is ManifestPack => Boolean(pack));
}

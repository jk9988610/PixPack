export type PackCategory =
  | 'bootstrap'
  | 'player'
  | 'npc'
  | 'enemy'
  | 'vfx'
  | 'ui';

export type AssetKind = 'spritesheet' | 'json' | 'audio';

export interface AnimationDef {
  frames: number[];
  fps: number;
  loop: boolean;
}

export interface CharacterMeta {
  frameWidth: number;
  frameHeight: number;
  scale: number;
  filter: 'nearest' | 'linear';
  animations: Record<string, AnimationDef>;
  frames: Array<{ x: number; y: number }>;
}

export interface AssetPackRow {
  id: string;
  slug: string;
  name: string;
  category: PackCategory;
  priority: number;
  version: number;
  zone_id: string | null;
  byte_size: number | null;
}

export interface PackAssetRow {
  id: string;
  pack_id: string;
  kind: AssetKind;
  storage_path: string;
  public_url: string;
  byte_size: number;
}

export interface CharacterRow {
  id: string;
  pack_id: string;
  name: string;
  role: 'player' | 'npc' | 'enemy';
  meta_json: CharacterMeta;
  sheet_asset_id: string;
}

export interface ManifestPack {
  pack: AssetPackRow;
  assets: PackAssetRow[];
  characters: CharacterRow[];
}

export interface LoadedAsset {
  asset: PackAssetRow;
  blob: Blob;
  objectUrl: string;
}

export interface LoadedPack {
  manifest: ManifestPack;
  assets: LoadedAsset[];
}

export interface LoadProgress {
  percent: number;
  stage: string;
  loadedBytes: number;
  totalBytes: number;
}

export type ProgressCallback = (progress: LoadProgress) => void;

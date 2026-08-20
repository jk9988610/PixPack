import { getSupabase, isSupabaseConfigured } from './client';
import type { AssetPackRow, CharacterRow, ManifestPack, PackAssetRow } from '../types';
import { getDemoManifest } from '../loader/demoData';

function withDemoPlayerFallback(
  pack: AssetPackRow,
  assets: PackAssetRow[],
  characters: CharacterRow[],
): ManifestPack {
  if (pack.slug !== 'player' || characters.length > 0) {
    return { pack, assets, characters };
  }
  const [demoPlayer] = getDemoManifest(['player']);
  return {
    pack,
    assets: demoPlayer.assets.map((a) => ({ ...a, pack_id: pack.id })),
    characters: demoPlayer.characters.map((c) => ({
      ...c,
      pack_id: pack.id,
    })),
  };
}

export function isPlaceholderCharacter(characterId: string | undefined): boolean {
  return !characterId || characterId.startsWith('demo-');
}

export async function fetchManifestPacks(slugs: string[]): Promise<ManifestPack[]> {
  if (!isSupabaseConfigured()) {
    return getDemoManifest(slugs);
  }

  const supabase = getSupabase();
  const { data: packs, error: packError } = await supabase
    .from('asset_packs')
    .select('*')
    .in('slug', slugs)
    .order('priority', { ascending: true });

  if (packError) throw packError;
  if (!packs?.length) {
    return getDemoManifest(slugs);
  }

  const packIds = packs.map((p) => p.id);
  const { data: assets, error: assetError } = await supabase
    .from('pack_assets')
    .select('*')
    .in('pack_id', packIds);

  if (assetError) throw assetError;

  const { data: characters, error: charError } = await supabase
    .from('characters')
    .select('*')
    .in('pack_id', packIds);

  if (charError) throw charError;

  return (packs as AssetPackRow[]).map((pack) => {
    const packAssets = ((assets ?? []) as PackAssetRow[]).filter((a) => a.pack_id === pack.id);
    const packCharacters = ((characters ?? []) as CharacterRow[]).filter((c) => c.pack_id === pack.id);
    return withDemoPlayerFallback(pack, packAssets, packCharacters);
  });
}

export async function fetchAllPackSlugs(): Promise<string[]> {
  if (!isSupabaseConfigured()) return ['bootstrap', 'player'];
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('asset_packs')
    .select('slug')
    .order('priority', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => row.slug as string);
}

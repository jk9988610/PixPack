import { getSupabase, isSupabaseConfigured } from './client';
import type { AssetPackRow, CharacterRow, ManifestPack, PackAssetRow } from '../types';
import { getDemoManifest } from '../loader/demoData';

export async function fetchManifestPacks(slugs: string[]): Promise<ManifestPack[]> {
  if (!isSupabaseConfigured()) {
    return getDemoManifest(slugs.filter((s) => s === 'bootstrap'));
  }

  const supabase = getSupabase();
  const { data: packs, error: packError } = await supabase
    .from('asset_packs')
    .select('*')
    .in('slug', slugs)
    .order('priority', { ascending: true });

  if (packError) throw packError;
  if (!packs?.length) return [];

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
    return { pack, assets: packAssets, characters: packCharacters };
  });
}

export async function fetchAllPackSlugs(): Promise<string[]> {
  if (!isSupabaseConfigured()) return ['bootstrap'];
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('asset_packs')
    .select('slug')
    .order('priority', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => row.slug as string);
}

import { getSupabase, isSupabaseConfigured } from './client';
import { PIXPACK_ASSETS_BUCKET } from './cloud-config';
import type { CharacterMeta } from '../types';

export interface RepositoryItem {
  id: string;
  name: string;
  packSlug: string;
  packName: string;
  meta: CharacterMeta;
  sheetUrl: string;
  sheetAssetId: string;
  storagePath: string;
}

export async function listRepositoryItems(): Promise<RepositoryItem[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = getSupabase();
  const { data: characters, error: charError } = await supabase
    .from('characters')
    .select('*')
    .order('updated_at', { ascending: false });

  if (charError) throw charError;
  if (!characters?.length) return [];

  const packIds = [...new Set(characters.map((c) => c.pack_id as string))];
  const { data: packs, error: packError } = await supabase
    .from('asset_packs')
    .select('*')
    .in('id', packIds);
  if (packError) throw packError;

  const assetIds = characters
    .map((c) => c.sheet_asset_id as string)
    .filter(Boolean);
  const { data: assets, error: assetError } = await supabase
    .from('pack_assets')
    .select('*')
    .in('id', assetIds);
  if (assetError) throw assetError;

  const packMap = new Map((packs ?? []).map((p) => [p.id as string, p]));
  const assetMap = new Map((assets ?? []).map((a) => [a.id as string, a]));

  return characters
    .map((row) => {
      const pack = packMap.get(row.pack_id as string);
      const asset = assetMap.get(row.sheet_asset_id as string);
      if (!pack || !asset) return null;
      return {
        id: row.id as string,
        name: row.name as string,
        packSlug: pack.slug as string,
        packName: pack.name as string,
        meta: row.meta_json as CharacterMeta,
        sheetUrl: asset.public_url as string,
        sheetAssetId: asset.id as string,
        storagePath: asset.storage_path as string,
      };
    })
    .filter((item): item is RepositoryItem => item !== null);
}

export async function deleteRepositoryItem(characterId: string): Promise<void> {
  const supabase = getSupabase();

  const { data: character, error: fetchError } = await supabase
    .from('characters')
    .select('*')
    .eq('id', characterId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!character) throw new Error('角色不存在');

  const sheetAssetId = character.sheet_asset_id as string | null;
  let storagePath: string | undefined;

  if (sheetAssetId) {
    const { data: asset, error: assetFetchError } = await supabase
      .from('pack_assets')
      .select('*')
      .eq('id', sheetAssetId)
      .maybeSingle();
    if (assetFetchError) throw assetFetchError;
    storagePath = asset?.storage_path as string | undefined;
  }

  // 必须先删 characters（FK → pack_assets），再删 pack_assets 与 Storage
  const { error: charDeleteError } = await supabase
    .from('characters')
    .delete()
    .eq('id', characterId);
  if (charDeleteError) throw charDeleteError;

  if (sheetAssetId) {
    const { error: assetDeleteError } = await supabase
      .from('pack_assets')
      .delete()
      .eq('id', sheetAssetId);
    if (assetDeleteError) throw assetDeleteError;
  }

  if (storagePath) {
    const { error: storageError } = await supabase.storage
      .from(PIXPACK_ASSETS_BUCKET)
      .remove([storagePath]);
    if (storageError) throw storageError;
  }
}

export async function updateRepositoryItemName(characterId: string, name: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('characters')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', characterId);
  if (error) throw error;
}

import { getSupabase } from './client';
import { PIXPACK_ASSETS_BUCKET } from './cloud-config';
import type { CharacterMeta } from '../types';

export interface SaveCharacterInput {
  characterId?: string;
  packSlug: string;
  name: string;
  meta: CharacterMeta;
  file: File;
}

export async function saveCharacterSheet(input: SaveCharacterInput): Promise<string> {
  const supabase = getSupabase();

  const { data: pack, error: packError } = await supabase
    .from('asset_packs')
    .select('*')
    .eq('slug', input.packSlug)
    .single();
  if (packError || !pack) throw packError ?? new Error(`资源包 ${input.packSlug} 不存在`);

  const nextVersion = (pack.version as number) + 1;
  const storagePath = `assets/packs/${input.packSlug}/v${nextVersion}/${input.characterId ?? 'new'}-spritesheet.png`;

  const { error: uploadError } = await supabase.storage
    .from(PIXPACK_ASSETS_BUCKET)
    .upload(storagePath, input.file, {
      upsert: true,
      contentType: 'image/png',
    });
  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage
    .from(PIXPACK_ASSETS_BUCKET)
    .getPublicUrl(storagePath);
  const publicUrl = `${publicUrlData.publicUrl}?v=${nextVersion}`;

  const { data: assetRow, error: assetError } = await supabase
    .from('pack_assets')
    .insert({
      pack_id: pack.id,
      kind: 'spritesheet',
      storage_path: storagePath,
      public_url: publicUrl,
      byte_size: input.file.size,
    })
    .select('*')
    .single();
  if (assetError) throw assetError;

  const characterPayload = {
    pack_id: pack.id,
    name: input.name,
    role: 'player' as const,
    meta_json: input.meta,
    sheet_asset_id: assetRow.id,
    updated_at: new Date().toISOString(),
  };

  let savedId = input.characterId;

  if (savedId) {
    const { error } = await supabase
      .from('characters')
      .update(characterPayload)
      .eq('id', savedId);
    if (error) throw error;
  } else {
    const { data: inserted, error } = await supabase
      .from('characters')
      .insert(characterPayload)
      .select('id')
      .single();
    if (error) throw error;
    savedId = inserted.id as string;
  }

  const totalBytes = (pack.byte_size as number | null ?? 0) + input.file.size;
  const { error: packUpdateError } = await supabase
    .from('asset_packs')
    .update({
      version: nextVersion,
      byte_size: totalBytes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', pack.id);
  if (packUpdateError) throw packUpdateError;

  return savedId!;
}

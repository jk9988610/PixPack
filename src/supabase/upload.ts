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

export async function saveCharacterSheet(input: SaveCharacterInput): Promise<void> {
  const supabase = getSupabase();

  const { data: pack, error: packError } = await supabase
    .from('asset_packs')
    .select('*')
    .eq('slug', input.packSlug)
    .single();
  if (packError || !pack) throw packError ?? new Error(`资源包 ${input.packSlug} 不存在`);

  const nextVersion = (pack.version as number) + 1;
  const storagePath = `assets/packs/${input.packSlug}/v${nextVersion}/spritesheet.png`;

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
  };

  const { data: existingChar } = await supabase
    .from('characters')
    .select('id')
    .eq('pack_id', pack.id)
    .maybeSingle();

  const targetCharacterId = input.characterId ?? existingChar?.id;

  if (targetCharacterId) {
    const { error } = await supabase
      .from('characters')
      .update(characterPayload)
      .eq('id', targetCharacterId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('characters').insert(characterPayload);
    if (error) throw error;
  }

  const totalBytes =
    (pack.byte_size as number | null ?? 0) + input.file.size;
  const { error: packUpdateError } = await supabase
    .from('asset_packs')
    .update({
      version: nextVersion,
      byte_size: totalBytes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', pack.id);
  if (packUpdateError) throw packUpdateError;
}

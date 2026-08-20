-- =============================================================================
-- PixPack — 一键改为完全公开（已跑过旧版 SQL 时执行本文件）
-- =============================================================================
-- 表 + Storage 全部 anon 可读写，无需登录
-- =============================================================================

-- ---------- 表 RLS ----------
drop policy if exists "pixpack_packs_write_auth" on public.asset_packs;
drop policy if exists "pixpack_packs_update_auth" on public.asset_packs;
drop policy if exists "pixpack_packs_delete_auth" on public.asset_packs;
drop policy if exists "pixpack_assets_write_auth" on public.pack_assets;
drop policy if exists "pixpack_assets_update_auth" on public.pack_assets;
drop policy if exists "pixpack_assets_delete_auth" on public.pack_assets;
drop policy if exists "pixpack_characters_write_auth" on public.characters;
drop policy if exists "pixpack_characters_update_auth" on public.characters;
drop policy if exists "pixpack_characters_delete_auth" on public.characters;

drop policy if exists "pixpack_packs_insert" on public.asset_packs;
create policy "pixpack_packs_insert" on public.asset_packs for insert with check (true);
drop policy if exists "pixpack_packs_update" on public.asset_packs;
create policy "pixpack_packs_update" on public.asset_packs for update using (true) with check (true);
drop policy if exists "pixpack_packs_delete" on public.asset_packs;
create policy "pixpack_packs_delete" on public.asset_packs for delete using (true);

drop policy if exists "pixpack_assets_insert" on public.pack_assets;
create policy "pixpack_assets_insert" on public.pack_assets for insert with check (true);
drop policy if exists "pixpack_assets_update" on public.pack_assets;
create policy "pixpack_assets_update" on public.pack_assets for update using (true) with check (true);
drop policy if exists "pixpack_assets_delete" on public.pack_assets;
create policy "pixpack_assets_delete" on public.pack_assets for delete using (true);

drop policy if exists "pixpack_characters_insert" on public.characters;
create policy "pixpack_characters_insert" on public.characters for insert with check (true);
drop policy if exists "pixpack_characters_update" on public.characters;
create policy "pixpack_characters_update" on public.characters for update using (true) with check (true);
drop policy if exists "pixpack_characters_delete" on public.characters;
create policy "pixpack_characters_delete" on public.characters for delete using (true);

grant select, insert, update, delete on public.asset_packs to anon, authenticated;
grant select, insert, update, delete on public.pack_assets to anon, authenticated;
grant select, insert, update, delete on public.characters to anon, authenticated;

-- ---------- Storage ----------
drop policy if exists "pixpack_assets_auth_insert" on storage.objects;
drop policy if exists "pixpack_assets_auth_update" on storage.objects;
drop policy if exists "pixpack_assets_auth_delete" on storage.objects;

drop policy if exists "pixpack_assets_anon_insert" on storage.objects;
create policy "pixpack_assets_anon_insert"
  on storage.objects for insert with check (bucket_id = 'pixpack-assets');

drop policy if exists "pixpack_assets_anon_update" on storage.objects;
create policy "pixpack_assets_anon_update"
  on storage.objects for update using (bucket_id = 'pixpack-assets');

drop policy if exists "pixpack_assets_anon_delete" on storage.objects;
create policy "pixpack_assets_anon_delete"
  on storage.objects for delete using (bucket_id = 'pixpack-assets');

update storage.buckets set public = true where id = 'pixpack-assets';

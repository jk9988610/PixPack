-- =============================================================================
-- PixPack — Storage 策略（Supabase SQL Editor · 文件 2/3）
-- =============================================================================
-- 完全公开：anon 可读可写（对照 Card-World schema-art-storage-policies.sql）
-- =============================================================================

-- 清理旧版 authenticated-only 策略
drop policy if exists "pixpack_assets_auth_insert" on storage.objects;
drop policy if exists "pixpack_assets_auth_update" on storage.objects;
drop policy if exists "pixpack_assets_auth_delete" on storage.objects;

drop policy if exists "pixpack_assets_public_read" on storage.objects;
create policy "pixpack_assets_public_read"
  on storage.objects for select
  using (bucket_id = 'pixpack-assets');

drop policy if exists "pixpack_assets_anon_insert" on storage.objects;
create policy "pixpack_assets_anon_insert"
  on storage.objects for insert
  with check (bucket_id = 'pixpack-assets');

drop policy if exists "pixpack_assets_anon_update" on storage.objects;
create policy "pixpack_assets_anon_update"
  on storage.objects for update
  using (bucket_id = 'pixpack-assets');

drop policy if exists "pixpack_assets_anon_delete" on storage.objects;
create policy "pixpack_assets_anon_delete"
  on storage.objects for delete
  using (bucket_id = 'pixpack-assets');

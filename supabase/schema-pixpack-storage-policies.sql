-- =============================================================================
-- PixPack — Storage 策略（Supabase SQL Editor · 文件 2/3）
-- =============================================================================
-- 前提：已通过 SQL 创建 Public bucket pixpack-assets（见 schema-pixpack-bucket.sql）
-- 对照 Card-World：supabase/schema-art-storage-policies.sql
-- =============================================================================

-- 公开读取（GitHub Pages 加载精灵图）
drop policy if exists "pixpack_assets_public_read" on storage.objects;
create policy "pixpack_assets_public_read"
  on storage.objects for select
  using (bucket_id = 'pixpack-assets');

-- 仅登录用户上传
drop policy if exists "pixpack_assets_auth_insert" on storage.objects;
create policy "pixpack_assets_auth_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'pixpack-assets');

-- 仅登录用户更新（upsert 覆盖）
drop policy if exists "pixpack_assets_auth_update" on storage.objects;
create policy "pixpack_assets_auth_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'pixpack-assets');

-- 仅登录用户删除
drop policy if exists "pixpack_assets_auth_delete" on storage.objects;
create policy "pixpack_assets_auth_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'pixpack-assets');

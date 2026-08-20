-- =============================================================================
-- PixPack — 创建 Storage Bucket（Supabase SQL Editor · 可单独执行）
-- =============================================================================
-- 新版 Supabase Dashboard 若找不到「New bucket」，直接在 SQL Editor 运行本文件即可。
-- 对照 Card-World 的 art 桶；PixPack 桶名：pixpack-assets
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pixpack-assets',
  'pixpack-assets',
  true,
  52428800,
  array['image/png', 'image/jpeg', 'image/webp', 'application/json']::text[]
)
on conflict (id) do update set
  public = true,
  name = excluded.name,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 验证（应返回 1 行，public = true）
select id, name, public, created_at
from storage.buckets
where id = 'pixpack-assets';

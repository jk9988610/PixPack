-- =============================================================================
-- PixPack — 初始 player 角色（SQL Editor · 文件 3/3，可选）
-- =============================================================================
-- 前提：
--   1) 已执行 schema-pixpack.sql + schema-pixpack-storage-policies.sql
--   2) 已在 Storage 上传：
--        bucket: pixpack-assets
--        path:   assets/packs/player/v1/spritesheet.png
--   3) 将下方 YOUR_PROJECT_REF 替换为你的 Supabase 项目 ref（Project Settings → General）
-- =============================================================================

-- 删除旧 demo 行（可重复执行）
delete from public.characters where pack_id in (select id from public.asset_packs where slug = 'player');
delete from public.pack_assets where pack_id in (select id from public.asset_packs where slug = 'player');

with player as (
  select id from public.asset_packs where slug = 'player'
),
asset as (
  insert into public.pack_assets (pack_id, kind, storage_path, public_url, byte_size)
  select
    player.id,
    'spritesheet',
    'assets/packs/player/v1/spritesheet.png',
    'https://YOUR_PROJECT_REF.supabase.co/storage/v1/object/public/pixpack-assets/assets/packs/player/v1/spritesheet.png?v=1',
    4096
  from player
  returning id, pack_id
)
insert into public.characters (pack_id, name, role, meta_json, sheet_asset_id)
select
  asset.pack_id,
  '默认',
  'player',
  '{
    "frameWidth": 32,
    "frameHeight": 32,
    "scale": 3,
    "filter": "nearest",
    "animations": {
      "idle": { "frames": [0, 1, 2, 3], "fps": 4, "loop": true },
      "walk": { "frames": [4, 5, 6, 7, 8, 9], "fps": 8, "loop": true }
    },
    "frames": [
      {"x": 0, "y": 0}, {"x": 32, "y": 0}, {"x": 64, "y": 0}, {"x": 96, "y": 0},
      {"x": 128, "y": 0}, {"x": 160, "y": 0}, {"x": 192, "y": 0}, {"x": 224, "y": 0},
      {"x": 256, "y": 0}, {"x": 288, "y": 0}
    ]
  }'::jsonb,
  asset.id
from asset;

update public.asset_packs
set version = 1, byte_size = 4096, updated_at = now()
where slug = 'player';

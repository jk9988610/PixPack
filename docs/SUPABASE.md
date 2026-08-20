# Supabase 初始化（PixPack）

对照 [Card-World `docs/SUPABASE_ART.md`](https://github.com/jk9988610/Card-World/blob/main/docs/SUPABASE_ART.md) 的操作顺序。

可与 Card-World（桶 `art`）、HarmonyForge（桶 `audio`）**共用同一 Supabase 项目**，仅桶名与表不同。

## 操作顺序

| 步骤 | 位置 | 操作 |
|------|------|------|
| 1 | Dashboard → Storage | 新建 bucket **`pixpack-assets`**，**Public bucket: ON** |
| 2 | SQL Editor | 执行 [`supabase/schema-pixpack.sql`](../supabase/schema-pixpack.sql) |
| 3 | SQL Editor | 执行 [`supabase/schema-pixpack-storage-policies.sql`](../supabase/schema-pixpack-storage-policies.sql) |
| 4 | Storage | 上传 `public/demo/spritesheet.png` → `assets/packs/player/v1/spritesheet.png` |
| 5 | SQL Editor | 执行 [`supabase/seed-player.sql`](../supabase/seed-player.sql)（替换 `YOUR_PROJECT_REF`） |
| 6 | Auth | 启用 **Email Magic Link**；Site URL 填 `https://jk9988610.github.io/PixPack/` |
| 7 | GitHub Secrets | `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY` |

## 也可跳过步骤 4–5

登录 PixPack 网页 → 上传精灵图 → 保存，由应用自动写入 Storage + DB。

## RLS 摘要

| 操作 | anon | authenticated |
|------|------|---------------|
| SELECT 表 | ✅ | ✅ |
| INSERT/UPDATE/DELETE 表 | ❌ | ✅ |
| Storage 读 | ✅ | ✅ |
| Storage 写 | ❌ | ✅ |

## 共用项目桶一览

| 项目 | Bucket | 表 |
|------|--------|-----|
| HarmonyForge | `audio` | `published_works` |
| Card-World | `art` | `art_shop_works` |
| **PixPack** | **`pixpack-assets`** | **`asset_packs` / `pack_assets` / `characters`** |

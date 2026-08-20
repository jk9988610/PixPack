# Supabase 初始化（PixPack）

对照 [Card-World `docs/SUPABASE_ART.md`](https://github.com/jk9988610/Card-World/blob/main/docs/SUPABASE_ART.md) 的操作顺序。

与 Card-World（桶 `art`）、HarmonyForge（桶 `audio`）**共用同一 Supabase 项目**；URL / anon key 写在 `src/supabase/cloud-config.ts`（同 Card-World 的 `js/cloud-config.js`）。

## 连接配置（已实现，无需 GitHub Secrets）

`src/supabase/cloud-config.ts` 已内置与 Card-World 相同的：

- **URL**：`https://yjqkotqmglxjhlrhynsu.supabase.co`
- **anon key**：与 Card-World 相同
- **桶名**：`pixpack-assets`（Card-World 为 `art`）

部署后顶栏应显示 **Supabase 已连接**。可选：GitHub Secrets `VITE_SUPABASE_*` 覆盖内置值。

## 操作顺序（SQL Editor）

| 步骤 | 文件 |
|------|------|
| 1 | [`schema-pixpack-full-part1.sql`](../supabase/schema-pixpack-full-part1.sql) |
| 2 | [`schema-pixpack-full-part2.sql`](../supabase/schema-pixpack-full-part2.sql) |

## RLS（完全公开，同 Card-World）

| 操作 | anon | authenticated |
|------|------|---------------|
| 表 / Storage 读写 | ✅ | ✅ |

## 共用项目桶一览

| 项目 | Bucket | 表 |
|------|--------|-----|
| HarmonyForge | `audio` | `published_works` |
| Card-World | `art` | `art_shop_works` |
| **PixPack** | **`pixpack-assets`** | **`asset_packs` / `pack_assets` / `characters`** |

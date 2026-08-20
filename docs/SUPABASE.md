# Supabase 初始化（PixPack）

对照 [Card-World `docs/SUPABASE_ART.md`](https://github.com/jk9988610/Card-World/blob/main/docs/SUPABASE_ART.md) 的操作顺序。

可与 Card-World（桶 `art`）、HarmonyForge（桶 `audio`）**共用同一 Supabase 项目**，仅桶名与表不同。

## 连接 Supabase（二选一）

Demo 模式表示**构建时未注入 URL/Key**。任选一种方式，然后重新部署（push 或 Actions 重跑）：

### 方式 A：GitHub Secrets（推荐）

仓库 **Settings → Secrets and variables → Actions → New repository secret**：

| Secret | 值 |
|--------|-----|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co`（Project Settings → API → Project URL） |
| `VITE_SUPABASE_ANON_KEY` | Project Settings → API → anon public |

保存后：**Actions → Deploy GitHub Pages → Run workflow**，或任意 push 到 main。

### 方式 B：运行时配置文件（免 Secrets）

```bash
cp public/supabase-config.example.json public/supabase-config.json
# 编辑 url 与 anonKey 填入真实值
git add public/supabase-config.json && git commit -m "chore: 配置 Supabase" && git push
```

> anon key 本身可公开；勿提交 service_role key。

## 操作顺序（全程 SQL Editor）

| 步骤 | 位置 | 操作 |
|------|------|------|
| 1 | SQL Editor | 执行 [`supabase/schema-pixpack-bucket.sql`](../supabase/schema-pixpack-bucket.sql) **或** 直接跑 [`schema-pixpack.sql`](../supabase/schema-pixpack.sql)（已含建桶） |
| 2 | SQL Editor | 执行 [`supabase/schema-pixpack.sql`](../supabase/schema-pixpack.sql)（若步骤 1 只跑了 bucket 单文件） |
| 3 | SQL Editor | 执行 [`supabase/schema-pixpack-storage-policies.sql`](../supabase/schema-pixpack-storage-policies.sql) |
| 4 | Storage 或网页上传 | 上传 `public/demo/spritesheet.png` → `assets/packs/player/v1/spritesheet.png`（也可登录 PixPack 网页上传） |
| 5 | SQL Editor | 可选：[`supabase/seed-player.sql`](../supabase/seed-player.sql)（替换 `YOUR_PROJECT_REF`） |
| 6 | Auth | 启用 **Email Magic Link**；Site URL 填 `https://jk9988610.github.io/PixPack/` |
| 7 | GitHub Secrets | `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY` |

### 推荐：一次执行完整脚本

[`supabase/schema-pixpack-full.sql`](../supabase/schema-pixpack-full.sql) — **从建 bucket 到表 + RLS + Storage 策略 + 初始 pack**，粘贴到 SQL Editor 一次 Run 即可。

### 分步执行（可选）

## 也可跳过步骤 4–5

登录 PixPack 网页 → 上传精灵图 → 保存，由应用自动写入 Storage + DB。

## RLS 摘要（完全公开，同 Card-World）

| 操作 | anon | authenticated |
|------|------|---------------|
| SELECT / INSERT / UPDATE / DELETE 表 | ✅ | ✅ |
| Storage 读 / 写 | ✅ | ✅ |

无需登录即可上传保存。若曾执行旧版「仅 authenticated 可写」，请再跑 [`schema-pixpack-open-access.sql`](../supabase/schema-pixpack-open-access.sql)。

## 共用项目桶一览

| 项目 | Bucket | 表 |
|------|--------|-----|
| HarmonyForge | `audio` | `published_works` |
| Card-World | `art` | `art_shop_works` |
| **PixPack** | **`pixpack-assets`** | **`asset_packs` / `pack_assets` / `characters`** |

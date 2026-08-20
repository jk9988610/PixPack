# PixPack 数据模型

> 实现参考：`supabase/schema.sql` · 规格来源：`docs/REFERENCE-SPEC.md`

## 表概览

| 表 | 用途 |
|----|------|
| `asset_packs` | 资源包 manifest（slug、category、version、priority） |
| `pack_assets` | 包内文件（Storage 路径、public_url、byte_size） |
| `characters` | 角色实体与 `meta_json` 动画定义 |

## 关系

```text
asset_packs 1 ── * pack_assets
asset_packs 1 ── * characters
characters.sheet_asset_id → pack_assets.id
```

## Storage 路径

```text
assets/packs/{pack_slug}/v{version}/spritesheet.png
```

## meta_json 结构

见 `docs/REFERENCE-SPEC.md` 动画规范章节；MVP 默认 32×32、idle 4 帧、walk 6 帧。

## RLS（MVP）

- **SELECT / INSERT / UPDATE / DELETE**：`anon` + `authenticated` 均可（完全公开，对照 Card-World）

## 加载权重

进度条按 `pack_assets.byte_size` 与 `asset_packs.byte_size` 加权；改资源时递增 `version` 并在 URL 追加 `?v=`。

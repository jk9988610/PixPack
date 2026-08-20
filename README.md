# PixPack · 素材工坊

网页端像素精灵素材工具：**Vite + PixiJS v8 + Supabase + GitHub Pages**。

- 规范文档：`docs/REFERENCE-SPEC.md`（来自 [Talk](https://github.com/jk9988610/Talk)）
- Agent 提示词：`docs/REFERENCE-AGENT-PROMPT.md`
- 冒烟测试：`docs/SMOKE-TEST.md`

## 在线地址

部署完成后：`https://jk9988610.github.io/PixPack/`

## 本地开发

```bash
npm install
node scripts/generate-demo-spritesheet.mjs
cp .env.example .env.local   # 填入 Supabase URL 与 anon key
npm run dev
```

未配置 Supabase 时进入 **Demo 模式**（本地 `public/demo/spritesheet.png`）。

## Supabase 初始化

1. 创建项目 → SQL Editor 执行 [`supabase/schema.sql`](supabase/schema.sql)
2. Storage → 新建 bucket **`pixpack-assets`**（Public）
3. Storage Policies：`authenticated` 可 upload/update；`public` 可读
4. Auth → 启用 Email Magic Link
5. 上传初始精灵图到 `assets/packs/player/v1/spritesheet.png`，执行 [`supabase/seed-player.sql`](supabase/seed-player.sql)（替换 URL），或在应用内登录后上传

## GitHub Secrets

在仓库 Settings → Secrets → Actions 添加：

| Secret | 说明 |
|--------|------|
| `VITE_SUPABASE_URL` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon public key |

## 加载策略（B 方案）

`loadPacks(['bootstrap','player'])` → 进度 ≥70% 且必需 pack 就绪后进入主界面；`prefetchPacks()` 预留后台预取。

## 素材分工

| 内容 | 存放 |
|------|------|
| 前端代码 | 本仓库 git |
| PNG 精灵图 | Supabase Storage（网页上传，无需 commit） |

## 脚本

```bash
npm run build      # 生产构建
npm run typecheck  # TypeScript 检查
```

## 许可

MIT（实现代码）；美术素材版权归上传者。

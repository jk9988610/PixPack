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

全程 **SQL Editor** 完成，无需 Dashboard 点 New bucket。详见 **[docs/SUPABASE.md](docs/SUPABASE.md)**。

1. SQL Editor → [`supabase/schema-pixpack-bucket.sql`](supabase/schema-pixpack-bucket.sql)（仅建桶）或 [`schema-pixpack.sql`](supabase/schema-pixpack.sql)（建桶+表）
2. SQL Editor → [`supabase/schema-pixpack-storage-policies.sql`](supabase/schema-pixpack-storage-policies.sql)
3. 网页登录后上传，或 Storage 上传 + `seed-player.sql`
4. Auth → Email Magic Link；GitHub Secrets 注入 URL / anon key

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

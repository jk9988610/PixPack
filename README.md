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
npm run dev
```

**画室**：主界面左侧点「画室」→ 16×16 骨骼蒙皮（像我的世界一样有初始骨架，只需换色/蒙皮；idle 0–3 / walk 4–9）→「保存到 Supabase」。对照 Card-World Pixel Board。

## Supabase 初始化

与 [Card-World](https://github.com/jk9988610/Card-World) **共用同一项目**；凭证在 `src/supabase/cloud-config.ts`（对照其 `js/cloud-config.js`），**无需 GitHub Secrets** 即可连上。

1. SQL Editor → [`supabase/schema-pixpack-full-part1.sql`](supabase/schema-pixpack-full-part1.sql) + [`part2`](supabase/schema-pixpack-full-part2.sql)
2. 打开 Pages，顶栏应显示 **Supabase 已连接**
3. 选 PNG → 保存到 Supabase

详见 **[docs/SUPABASE.md](docs/SUPABASE.md)**。

## GitHub Secrets（可选覆盖）

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

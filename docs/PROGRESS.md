# PixPack 开发进度

> 最后更新：2026-08-20

## 里程碑

| 阶段 | 内容 | 状态 |
|------|------|------|
| 0 | Talk 规范同步 → `docs/REFERENCE-*.md` | ✅ 已合并 main |
| 1 | Vite + PixiJS + Pages workflow | ✅ |
| 2 | Supabase 分文件 SQL（对齐 Card-World） | ✅ 脚本就绪，待你在控制台执行 |
| 3 | B 方案加载器 `loadPacks` / `prefetchPacks` | ✅ |
| 4 | idle / walk 预览 | ✅ |
| 5 | 上传保存 + SMOKE-TEST | ✅ 代码就绪，待联调验收 |

## 当前阻塞 / 待你操作

1. **Supabase SQL Editor** — 按 [SUPABASE.md](./SUPABASE.md) 顺序执行两段 SQL（见下方摘要）
2. **GitHub Secrets** — `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`
3. **Auth** — Magic Link，Site URL = `https://jk9988610.github.io/PixPack/`
4. **冒烟测试** — [SMOKE-TEST.md](./SMOKE-TEST.md)

## Pages 部署

- URL：https://jk9988610.github.io/PixPack/
- 模式：GitHub Actions（你已设置）
- 未配 Secrets 时：Demo 模式（本地 demo 精灵图）

## 下一步（P1 预留）

- 后台预取 UI 角标
- IndexedDB pack 缓存
- 多 pack 分类树预览

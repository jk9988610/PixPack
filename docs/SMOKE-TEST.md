# PixPack MVP 冒烟测试

## 前置条件

1. Supabase 项目已创建，已执行 `supabase/schema.sql`
2. Storage bucket `pixpack-assets` 已创建（Public）
3. GitHub Secrets 已设置 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`
4. GitHub Pages 已启用（Actions 部署）

## 1. 进站加载

| 步骤 | 操作 | 期望 |
|------|------|------|
| 1.1 | 打开 Pages URL | 全屏加载条，Logo + 百分比 |
| 1.2 | 等待加载完成 | 进度达 ≥70% 后进入主界面 |
| 1.3 | 观察默认角色 | idle 循环播放，像素清晰（nearest） |

## 2. 动画切换

| 步骤 | 操作 | 期望 |
|------|------|------|
| 2.1 | 选择 walk | 6 帧 walk 循环，帧信息更新 |
| 2.2 | 切回 idle | 恢复 4 帧 idle |

## 3. 匿名保存（公开 RLS）

| 步骤 | 操作 | 期望 |
|------|------|------|
| 3.1 | 未登录，选择 PNG 并保存 | 成功写入 Storage + DB |
| 3.2 | 刷新页面 | 仍显示已保存素材 |

## 4. 登录（可选）

| 步骤 | 操作 | 期望 |
|------|------|------|
| 4.1 | Magic Link 登录 | 可选，不影响保存功能 |

## 5. 刷新持久化

| 步骤 | 操作 | 期望 |
|------|------|------|
| 5.1 | 硬刷新页面 | 加载条后仍显示上次保存的素材 |

## 6. 加载器 API

| 检查项 | 期望 |
|--------|------|
| `loadPacks(['bootstrap','player'])` | 控制台无致命错误，主界面可交互 |
| `prefetchPacks(slugs)` | 函数存在，后台调用不阻塞 UI |

## Demo 模式（未配置 Supabase）

| 步骤 | 操作 | 期望 |
|------|------|------|
| D.1 | 本地 `npm run dev` 无 `.env.local` | 顶栏显示 Demo 模式 |
| D.2 | 加载完成 | 使用 `public/demo/spritesheet.png` 预览 |

## 失败重试

| 步骤 | 操作 | 期望 |
|------|------|------|
| F.1 | 断网后刷新 | 加载失败文案 + 「重试」按钮 |
| F.2 | 恢复网络点击重试 | 可重新进入主界面 |

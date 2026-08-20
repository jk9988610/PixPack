> **同步说明**
> - 源仓库：[Talk](https://github.com/jk9988610/Talk)
> - 源路径：`docs/07-projects/2026-08-19-PixPack-Agent实现提示词.md`
> - 同步日期：2026-08-20
> - Raw URL：https://raw.githubusercontent.com/jk9988610/Talk/main/docs/07-projects/2026-08-19-PixPack-Agent实现提示词.md
>
> 以下为 Talk 源文档全文（实现仓只读参考，修改请回 Talk 后重新同步）。

---
title: PixPack Agent 实现提示词（素材工坊 · PixiJS + Supabase）
category: projects
tags: [PixPack, PixiJS, Supabase, Agent, 提示词, 素材工具]
status: active
created: 2026-08-19
updated: 2026-08-19
author:
---

# PixPack Agent 实现提示词

> **父文档**：[PixPack 素材工坊项目总览](2026-08-19-PixPack-素材工坊项目总览.md)  
> **实现仓库**：[PixPack](https://github.com/jk9988610/PixPack)（待建）

本文档供 **PixPack** 实现仓中的 Cursor Agent 使用。Talk 仓库只存提示词与规划，不写产品代码。

---

## 一句话指导（复制到 PixPack 仓库 Agent 对话）

在 **PixPack** 仓库 Cursor Agent 中**只发这一句**即可；**无需**你手动复制任何文档，由 Agent 完成同步与后续全部实现：

```
本仓库为 PixPack 实现仓。请先自行从 Talk 获取规范写入 docs/REFERENCE-SPEC.md 与 docs/REFERENCE-AGENT-PROMPT.md，再按缩短版提示词从阶段 0 推进至 MVP 验收；加载策略采用 B 方案（先进再补），素材走 Supabase，部署 GitHub Pages。
```

Talk 源文档地址（供 Agent 拉取）：

- https://raw.githubusercontent.com/jk9988610/Talk/main/docs/07-projects/2026-08-19-PixPack-素材工坊项目总览.md
- https://raw.githubusercontent.com/jk9988610/Talk/main/docs/07-projects/2026-08-19-PixPack-Agent实现提示词.md

---

## 使用说明（用户侧）

| 步骤 | 操作 |
|------|------|
| 1 | 建 GitHub 仓 **PixPack**，用 Cursor 打开 |
| 2 | 在 Supabase 控制台建项目（Agent README 会写初始化步骤） |
| 3 | 发送上方 **一句话指导** |
| 4 | Agent 负责：拉取 Talk 文档 → 写入本仓 `docs/` → 实现 MVP |
| 5 | 你仅在需要时填写 Supabase URL/anon key 到仓库 Secrets |

---

## 缩短版提示词（PixPack 默认路径）

Agent 同步文档后按本段执行。

```
# 任务：PixPack 素材工坊 MVP（PixiJS + Supabase + GitHub Pages）

## 角色

你是 PixPack 实现仓的 Agent。先完成阶段 0 同步 Talk 文档，再在本仓库写代码。

## 阶段 0（用户未复制文档，必须由你完成）

1. 从 Talk 获取以下源文件**全文**（优先 raw.githubusercontent.com）：
   - `docs/07-projects/2026-08-19-PixPack-素材工坊项目总览.md`
     → 写入本仓 `docs/REFERENCE-SPEC.md`
   - `docs/07-projects/2026-08-19-PixPack-Agent实现提示词.md`
     → 写入本仓 `docs/REFERENCE-AGENT-PROMPT.md`
2. 在每个 REFERENCE 文件顶部注明：源仓库 Talk、源路径、同步日期、raw URL。
3. 提交 git：`docs: 从 Talk 同步参考文档`。
4. 若无法访问 GitHub：README 写明阻塞与 raw URL，仅向用户索要粘贴内容。

完成阶段 0 后，阅读 `docs/REFERENCE-SPEC.md`，从阶段 1 推进。

## 必读参考

- 本仓 `docs/REFERENCE-SPEC.md`（架构、Pack、加载 B 方案、数据模型、验收）
- Talk：https://github.com/jk9988610/Talk/blob/main/docs/07-projects/2026-08-19-PixPack-素材工坊项目总览.md

## 技术栈（必须遵守）

- 前端：Vite + TypeScript + PixiJS v8
- 托管：GitHub Pages（GitHub Actions 构建部署）
- 后端：Supabase Auth + Storage + Postgres
- 环境变量：`VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`（Secrets，禁止进 Git）
- 素材：**不**通过 git 管理 PNG；用户网页上传至 Supabase

## 加载策略（B 方案，必须实现）

1. 进站全屏加载条（游戏风格：Logo + 百分比 + 阶段文案）。
2. 顺序：初始化 → Auth → manifest → bootstrap → 当前必需 pack（MVP: `player`）。
3. **门槛**：必需 pack 就绪且进度 ≥约 70% → **进入主界面**（不必等全部未来 pack）。
4. 预留 `prefetchPacks(slugs)` 后台预取队列（MVP 可无 UI，但 API 要存在）。
5. 加载器核心 API：`loadPacks(slugs: string[])`，进度按字节或文件加权。
6. 失败可重试；PixiJS 纹理 `nearest` 缩放。

## 动画规格（MVP）

- 32×32 单帧，scale 3×，透明 PNG spritesheet
- idle: 4 帧 @ 4fps；walk: 6 帧 @ 8fps
- meta_json 结构见 REFERENCE-SPEC

## MVP 功能（只做这些）

1. Supabase：表（至少 characters + pack 相关）、Storage bucket、RLS（仅本人可写）。
2. 加载条 + 进入主界面后 PixiJS 预览 idle/walk。
3. 登录后上传 spritesheet、编辑/保存 meta_json 到 Supabase。
4. GitHub Actions 部署 Pages。
5. `docs/DATA-MODEL.md`、`docs/SMOKE-TEST.md`、README（Supabase 初始化、Secrets）。

## 不做

- 网页内像素画板 / 时间轴编辑器
- 游戏玩法、战斗逻辑
- IndexedDB / Service Worker（可留 TODO）
- 多角色复杂 UI（数据结构可预留）

## 仓库结构（建议）

```
src/loader/      # loadPacks, prefetch, progress
src/pixi/        # 动画播放
src/supabase/    # 客户端、上传
src/ui/          # 加载条、主界面
docs/REFERENCE-SPEC.md
docs/REFERENCE-AGENT-PROMPT.md
docs/DATA-MODEL.md
docs/SMOKE-TEST.md
.github/workflows/pages.yml
```

## 交付顺序（按序提交）

0. 同步 Talk REFERENCE 文档
1. 骨架 + Vite + PixiJS 空白画布 + Pages workflow
2. Supabase schema + RLS + `.env.example`
3. 加载条 + loadPacks(['bootstrap','player']) 逻辑
4. 角色预览 idle/walk
5. 上传保存 + SMOKE-TEST + README

## 验收

1. Pages URL：加载条 → 主界面 → idle/walk 正常。
2. 登录上传新图保存后，刷新仍为新素材。
3. 未登录无法写入。
4. SMOKE-TEST 全流程通过。

请先输出 6 步计划（含阶段 0），然后从阶段 0 开始；阶段 0 完成后连续推进至 MVP 验收，无需等待用户确认。
```

---

## 文档维护

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-08-19 | 初版：一句话指导 + 缩短版提示词 |

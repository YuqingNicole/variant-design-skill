<!-- /autoplan restore point: /Users/nicolechen/.gstack/projects/YuqingNicole-variant-design-skill/master-autoplan-restore-20260526-151159.md -->
# Plan: 将静态网页输出改为动态 React 组件

## 目标（已根据前提审查修订）

为 variant-design skill 添加**上下文感知输出**：
- 检测当前工作目录是否含有 React 项目（`package.json` 含 react 依赖 / `tsconfig.json` + `.tsx` 文件）
- **有 React 项目**：自动生成 `.tsx` 组件（Framer Motion，适配 Vite/Next）
- **无 React 项目**（默认）：保持 HTML 零依赖输出（当前行为不变）
- 同时降低 `export to react` 的操作摩擦（更短命令 `react A`，或生成后自动询问）

**原目标"全局改默认为 React"已废弃**：两个独立模型一致认为 .tsx + CDN wrapper 方案两头不讨好。

## 背景

当前 `SKILL.md` 定义了两种输出格式：
- **Interactive HTML（默认）**：单文件 HTML + CSS + JS，写到 `variant-output/*.html`
- **React**：可选，通过 `export to` 命令触发

用户希望将 React 变为默认输出格式，而非需要手动 export 触发。

## 当前状态分析

**SKILL.md 关键结构：**
- `SKILL.md`（881 行）是核心，定义所有生成规则和输出规范
- `references/` — 14 个领域参考文件 + design-system 子目录
- `examples/` — 示例文件
- `assets/` — 资源文件

**当前 HTML 默认输出规范（位于 SKILL.md 第 698-750 行）：**
- 单文件嵌入 CSS + JS
- 写到 `variant-output/*.html`
- 自动用 `open` 命令在浏览器预览
- 使用 `IntersectionObserver` + vanilla CSS 动画
- CDN Tailwind 可选

**当前 React 规范（第 749-770 行）：**
- 函数组件
- CSS 模块 / 内联样式 / Tailwind
- Framer Motion 用于动画
- 需要用户手动 `export to react`

## 计划任务（已修订）

### 任务 1: 添加 React 项目上下文检测逻辑

在 SKILL.md 的 "CLI Workflow" 或 "Project Context Initialization" 区段，添加输出格式自动判断规则：

```
在开始生成前，检测输出格式：
1. 检查当前目录是否有 package.json 且包含 "react" 依赖
2. 或检查是否有 tsconfig.json + 存在 .tsx 文件
3. 是 React 项目 → 生成 .tsx 组件（React Output Spec）
4. 否 → 生成 .html（Interactive HTML Output Spec，维持现状）
用户可以用 --react 或 --html 强制指定格式覆盖自动检测
```

### 任务 2: 完善 React Output Spec

当前 React 规范（第 749-770 行）较简短，补充：
- 当处于 React 项目时，文件写到哪（`variant-output/` 保持不变）
- 预览方式：检测到 Vite 则用 `vite --open`；否则提示用户用 `npx vite` 或提示框架命令
- 如何在 React 项目中使用生成的组件（import 路径说明）

### 任务 3: 降低 export to react 摩擦

在 Quick Triggers 表格新增：
- `react A` → `export to react` Variation A 的简写
- 生成完成后的 "Next action?" 提示中加入 `react [A/B/C]` 选项

### 任务 4: 更新 description frontmatter（可选）

在 description 中加入"上下文感知输出：React 项目自动生成 .tsx，否则生成 HTML"

## 成功标准（已修订）

1. **无 React 项目**时：行为与现在完全一致（不破坏任何现有功能）
2. **有 React 项目**（package.json 含 react）时：自动生成 .tsx，文件写入 `variant-output/`，给出正确预览命令
3. `react A` / `react B` 快捷命令能触发 export to react
4. 所有 variation actions 继续工作（两种格式均支持覆写迭代）

## 影响范围

- **仅修改 `SKILL.md`**：所有逻辑都在这一个文件中
- 改动量从"40+ 处"大幅缩减为约 5-8 处新增规则
- 不修改 `references/` 中的设计系统文件
- 不修改 `examples/`

## 风险（已修订）

- React 项目检测可能有漏报（如 package.json 存在但未安装 react）
  - 缓解：用 `--react` 标志允许手动覆盖
- 用户处于 monorepo 中，根目录 package.json 不含 react 但子项目含
  - 缓解：检测当前目录，非根目录（这是合理的行为）

---

## GSTACK REVIEW REPORT

### Phase 1 — CEO Review

#### 前提挑战

| 前提 | 状态 | 评估 |
|---|---|---|
| "用户想要 React 默认输出" | **假设，未证实** | 无用户反馈、无 issue、无使用数据支撑 |
| "esm.sh CDN wrapper 是可行的 React 方案" | **内部矛盾** | .tsx 文件 + HTML wrapper = 既不是真 React 组件，也不是干净的 HTML |
| "HTML 默认输出有问题" | **未证实** | 当前方案零依赖、即时预览，无已知用户痛点文档 |
| "只修改 SKILL.md 就够了" | **过于乐观** | 行为变更需要示例、测试场景验证 |

#### 双模型 CEO 共识表

```
CEO DUAL VOICES — CONSENSUS TABLE:
═══════════════════════════════════════════════════════════════
  维度                               Claude   Codex   共识
  ──────────────────────────────────── ─────── ─────── ─────────
  1. 前提有效？                        否       否      CONFIRMED: 前提未证实
  2. 解决了正确问题？                  否       否      CONFIRMED: 问题定义错误
  3. 范围校准正确？                    否       否      CONFIRMED: 范围过广且方向错
  4. 充分探索了替代方案？              否       否      CONFIRMED: 方案 B 是伪 React
  5. 差异化优势风险？                  是       是      CONFIRMED: HTML 零依赖是核心优势
  6. 6 个月轨迹健康？                  否       否      CONFIRMED: CDN 依赖+竞争定位错误
═══════════════════════════════════════════════════════════════
```

#### 两个模型的共同核心发现

**USER CHALLENGE — 双模型均建议修改用户设定的方向**

两个模型都明确建议：**不要全局性地将 React 设为默认**。

具体共识：
1. **前提未证实**：用户想要 React 默认这个说法没有任何证据支撑
2. **方案 B 是伪 React**：.tsx + esm.sh wrapper 不是真正的 React 组件，既无法直接用于 React 项目，又增加了 CDN 依赖
3. **当前 HTML 优势是差异化资产**：零依赖、即时 `open`、完全可移植 — 这正是与 v0/Bolt/Lovable 的差别
4. **更好的方向是上下文感知**：检测当前目录是否有 React 项目，有则生成 React，无则保持 HTML preview

#### 现有代码利用图

```
当前 SKILL.md 已有：
  ├── Interactive HTML Output Spec（698-750行）— 完整，有效，零依赖
  ├── React Output Spec（749-770行）— 已存在，但是可选触发
  └── Framework Export（export to next/vite）— 已支持转换

计划想要做：把可选 React 变为强制默认
两个模型建议：把可选 React 变为上下文自动选择
```

#### Dream State（当前 → 此计划 → 12 个月理想）

```
当前状态：HTML 默认（快速预览） + React（手动 export）
此计划：React 默认（CDN wrapper）
12 个月理想：上下文感知 — 检测项目类型 → 自动选择最合适输出格式
```

差距：此计划走向了错误方向，离 12 个月理想更远。

#### 不在范围内（待定）

- 上下文检测（检测 package.json / React 项目）
- 真正的 Vite scaffold 模式
- 项目类型感知的输出格式

---

### Phase 3 — Eng Review

#### Eng 双模型共识表

```
ENG DUAL VOICES — CONSENSUS TABLE:
═══════════════════════════════════════════════════════════════
  维度                               Claude   Codex   共识
  ──────────────────────────────────── ─────── ─────── ─────────
  1. 架构合理？                        部分     部分    DISAGREE: 检测规则需更精确
  2. 测试覆盖充分？                    否       否      CONFIRMED: 只有 happy path
  3. 性能风险已解决？                  N/A      N/A     N/A (无性能问题)
  4. 安全威胁已覆盖？                  N/A      N/A     N/A
  5. 错误路径已处理？                  否       否      CONFIRMED: 检测失败无告知
  6. 部署风险可控？                    是       是      CONFIRMED: 仅改 SKILL.md 文本
═══════════════════════════════════════════════════════════════
```

#### 关键 Eng 发现（自动决策）

| 发现 | 严重度 | 模型共识 | 自动决策 | 原则 |
|---|---|---|---|---|
| 检测规则用字符串匹配会误报 react-scripts 等 | High | 两模型一致 | 补充精确规则：只查 dependencies 对象的 key "react" | P5 |
| .tsx + tsconfig 不可靠，Preact/Solid 也用 | High | 两模型一致 | 删除 tsconfig 启发，只用 package.json | P5 |
| 检测失败无用户提示，恢复路径隐藏 | High | 两模型一致 | 生成时必须打印"检测到 React 项目 → 生成 .tsx"一行 | P1 |
| framer-motion 未安装时引入会报错 | High | Codex | 先检查 framer-motion，无则降级为 CSS 动画 | P5 |
| Next App Router 需要 "use client" | Medium | Codex | 检测到 next 依赖时自动添加 "use client" | P1 |
| variant-output/*.tsx 在 tsconfig.include 外 | Medium | 两模型一致 | 文件顶部注释提示用户移到 src/components/ | P5 |
| 旧"不在范围内"区段与新目标矛盾 | Medium | Codex | 删除过时区段 | P5 |
| 成功标准缺少负向/边界测试场景 | Low | 两模型一致 | 补充测试矩阵 | P1 |

#### ASCII 依赖图（新增 vs 现有）

```
SKILL.md（现有）
  ├── Interactive HTML Output Spec（698-750行）← 保持不变
  ├── React Output Spec（749-770行）← 扩展：添加 Next/Vite 分支
  ├── Framework Export（export to next/vite）← 保持不变
  └── CLI Workflow（Quick Triggers）← 新增 react A 快捷命令
         ↑
         新增：Output Format Detection（上下文检测规则，约 20 行）
               ├── 检测逻辑：cat package.json | jq '.dependencies.react // .devDependencies.react'
               ├── 框架分支：next → App Router .tsx; vite → 标准 .tsx; else → HTML
               ├── framer-motion 检测
               └── 覆盖规则：--react / --html 优先
```

---

### Phase 3.5 — DX Review

#### DX 共识表

```
DX DUAL VOICES — CONSENSUS TABLE:
═══════════════════════════════════════════════════════════════
  维度                               Claude   DX Agent  共识
  ──────────────────────────────────── ─────── ─────── ─────────
  1. Getting started < 5 min?          N/A      N/A    N/A (技能，非独立工具)
  2. 命令/触发词可猜到？               部分     部分    DISAGREE: react A 不直觉
  3. 错误消息可操作？                  否       否      CONFIRMED: 无检测透明度
  4. 文档完整？                        否       否      CONFIRMED: Task 4 不应是可选
  5. 升级路径安全？                    是       是      CONFIRMED: 向后兼容
  6. 开发环境无摩擦？                  部分     部分    DISAGREE: 预览命令需精化
═══════════════════════════════════════════════════════════════
```

#### DX 关键发现（自动决策）

| 发现 | 严重度 | 决策 |
|---|---|---|
| React 模式完全不可被发现（description 是可选的） | High | description 更新为必须（Task 4 升为强制） |
| 检测触发边界是黑盒，用户无法预期 | High | 打印检测结果（见 Eng 决策）+ 覆盖优先级文档 |
| react A 语义不直觉 | Medium | 保留为快捷别名，同时在"Next action?"提示中展示 |
| variant-output/ 对 React 组件是错误信号 | Medium | 文件注释建议移到 src/components/ |
| 预览命令 vite --open 可能绕过 package.json scripts | Medium | 改为读取 package.json.scripts，推荐 npm run dev |

#### TTHW（Time to Hello World）

- 当前 HTML 模式：~10 秒（generate → auto open → 看到设计）
- 目标 React 模式：~30 秒（generate → 看到提示 → cd 项目 → npm run dev → 查看组件）
- 合理，React 天然有运行时开销

---

### 跨 Phase 主题

**主题 1: 检测透明度** — 在 Eng（错误路径）和 DX（黑盒触发）两个 Phase 独立出现。高置信度信号：生成时必须打印检测结果。

**主题 2: 规则精确性** — CEO 发现方案 B 是伪 React，Eng 发现检测规则模糊，DX 发现用户无法预期触发时机。根因是同一个：上下文检测规则需要像代码一样精确，而非启发式描述。

---

### Decision Audit Trail

| # | Phase | 决策 | 分类 | 原则 | 理由 |
|---|-------|------|------|------|------|
| 1 | CEO | 跳过 Design Review | 机械 | P3 | 计划是文本修改，无 UI 设计场景 |
| 2 | CEO | 触发 DX Review | 机械 | P1 | DX 关键词 13 次，这是开发者工具 |
| 3 | CEO | 标记为 USER CHALLENGE（全局 React 默认） | 必须呈现 | — | 双模型一致建议修改方向 |
| 4 | CEO→用户 | 用户选择"上下文感知方案" | 用户决定 | — | 计划已更新 |
| 5 | Eng | 删除 tsconfig+tsx 启发 | 机械 | P5 | Preact/Solid 误报风险 |
| 6 | Eng | 要求打印检测结果 | 机械 | P1 | 检测失败必须有告知 |
| 7 | Eng | framer-motion 降级策略 | 机械 | P5 | 未安装时导入报错 |
| 8 | Eng | Next 分支添加 "use client" | 机械 | P1 | App Router 规范 |
| 9 | DX | Task 4 升为强制 | 机械 | P1 | description 是唯一发现入口 |
| 10 | DX | 预览命令改为读 scripts | 机械 | P5 | 直接 vite --open 可能错误 |

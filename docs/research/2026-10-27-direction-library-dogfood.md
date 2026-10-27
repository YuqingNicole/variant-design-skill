# 方向库第一批作品实测记录 — 2026-10-27

为 RFC-002 P1 产出"产品界面"和"数据展示"两类有真实证据的作品，在两个一次性项目里各跑一次技能。

## 方法

- 宿主：Claude Code 2.1.311，`claude -p`，跳过权限确认，非交互运行，每个项目一轮。
- 安装：用 `git archive` 导出当时 master 被版本管理的文件，装在项目级目录 `.claude/skills/variant-design`，没有改动全局技能目录。
- 项目（都是 Vite + React 19 + TypeScript，运行前做了一次 git 提交作为基准）：
  - **Harbor**：小团队共享工作区的成员与权限页，可以邀请、改角色、移除、撤回邀请。没有品牌约束。
  - **Pulse**：订阅产品的每周数据报告，读者是周一早上的产品负责人。`src/tokens.css` 注明品牌锁定。
- 指令：`/docs` 第 02 步的首次指令原文，末尾加一句"这是无人值守运行：用 `react-preview.mjs --static` 生成可直接打开的预览，不要启动常驻服务器"。加这句是因为 2026-10-26 的记录里，headless 会话中的后台服务器会让 `claude -p` 无法退出。

## 结果

| 检查项 | Harbor | Pulse |
|---|---|---|
| 耗时（墙钟） | 804 s | 438 s |
| 费用 | $3.09，48 轮 | $2.30，42 轮 |
| 先检查项目再生成 | ✓ 发现原页面"移除"没有确认，邀请时选的角色没有保存 | ✓ 发现原页面把流失上升显示得像好消息；品牌橙和绿在浅底上小字对比度只有 3.35 和 3.18:1 |
| 品牌 | 没有约束，三版用三种鲜明风格 | ✓ 三版都用 Inter / JetBrains Mono 和锁定的 5 个颜色；没有改品牌色，只把低对比度的颜色用在图形上 |
| 共用数据 | `shared/members.ts` | `shared/pulse-data.ts`，数值逐字复制自原页面 |
| 推荐但不选定 | ✓ 推荐 A，`selectedVariant` 为空 | ✓ 推荐 A，`selectedVariant` 为空 |
| 不改业务代码 | ✓ 只新建 `variant-output/` 和 `.variant-work/` | ✓ 只新建 `variant-output/`，另外在 `.gitignore` 加了 `.variant-work` |
| 自检 | 质量扫描 0 错误；Chromium 两种宽度 45 项检查通过 | 质量扫描 0 错误；Chrome 两种宽度，加载、失败、无异常状态，以及减少动态效果 |

三个方向的说明（优化、取舍、适合场景）和推荐理由，原文收录在 `website/content/entries/harbor.json` 和 `pulse.json` 里。完整的产出记录在 `website/content/evidence/<项目>/variant-output/`。校验器会检查作品里的中文说明和推荐方向与记录逐字一致。

## 发现与处理

| # | 发现 | 证据 | 处理 |
|---|---|---|---|
| 1 | `react-preview.mjs --static` 用字符串替换把打包后的 JS 内联进页面，JS 里的 `$&`、`` $` ``、`$$` 被当成替换模式。Harbor 的 B 页面语法报错打不开，A 和 C 的代码被悄悄改坏（`$$typeof` 变成 `$typeof`） | Harbor 运行报告。agent 没有改已安装的技能，而是复制一份打补丁后生成预览 | 改成函数式替换。loop 浏览器测试的示例组件里加入这几个字符序列：修复前测试失败，修复后通过。两个项目都用修好的脚本重新生成预览，6 个页面都能打开，没有控制台报错 |
| 2 | 两次运行处理 `.variant-work/` 的方式不一样：Harbor 只建议加进 `.gitignore`，Pulse 直接加了。Harbor 提到这个目录里有项目源码副本 | 两份运行报告 | 未处理。技能说明里应该明确由谁来把它加进 `.gitignore` |
| 3 | Harbor 为了让类型检查覆盖生成的文件，临时写了一份 tsconfig | Harbor 运行报告 | 未处理，记录下来 |

## 仍未解决

- 截图用的是修复后的脚本重新生成的预览，不是 agent 运行时打开的那一份。方向的代码和说明都没有改动。
- 两个项目的字体由 agent 从 Google Fonts 引入（Harbor），或者依赖本机字体（Pulse），离线时显示效果会不同。
- 只跑了 Claude Code，没有跑 Codex。只在 Chrome/Chromium 里检查过，没有用读屏软件实测。
- 两个项目都很小，是我们自己写的示例，不是外部用户的真实项目。PRD-007 要求的外部试用仍然没有完成。

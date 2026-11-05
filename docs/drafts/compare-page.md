# 对比页草稿：Variant Design、Impeccable、Taste Skill 和 frontend-design

状态：**草稿，未发布**。代理起草于 2026-11-02，2026-11-04 重新核对公开文档；维护者确认后再做成 `/compare`（或放进 `/guides`）。发布前请逐条核对“依据”列的链接还成立。

写法约定：只写对方公开页面上能查到的事实，带链接和核对日期；不用对方的商标图形、截图或文案；不评价谁“更好”，只说各自适合什么情况；对方没写的，写“文档没有说明”，不写“不支持”。

## 中文稿

### 一句话

这四个设计技能都有公开可读的源码，但流程不同。以下描述的是文档约定，并非本次运行结果：Variant Design 给同一个任务做三个完整方向让你选，并能按方向撤回；Impeccable 给页面上一个具名区域出几个变体；Taste Skill 的网页流程从 20 个方向里抽 3 个，由 Agent 选 1 个做完；frontend-design 直接做一个有明确取向的设计。

### 对照

| | Variant Design | Impeccable | Taste Skill | frontend-design |
|---|---|---|---|---|
| 一次交出什么 | 同一任务、同一份数据的三个完整方向（A/B/C），各自写明优化什么、放弃什么 | 一个具名元素或区域的变体，默认 3 个，可选 1–8 个 | 网页流程：抽取三个方向，由 Agent 选一个做；应用界面有独立路线 | 一个设计：先写简短方案，再写代码 |
| 谁来选 | 你。只有你明确说 `pick B` 才记为最终方案；推荐不等于选定 | 你。选 Accept 后写进源码 | Agent | 不涉及（只做一个） |
| 选完之后能不能撤回 | 能。`undo B` 撤回 B 的上一次请求；接入后 `rollback` 恢复原文件；文件之后被改过就拒绝执行 | 文档写了接受前可以 Discard 恢复原样，没有说明接受之后怎么撤回 | README 没有说明 | 技能文字没有提到 |
| 检查 | 交付前的记录检查、质量扫描；有浏览器时看桌面和手机宽度 | 自带识别通用 AI 设计模式的检测器 | 在真实浏览器里按三种宽度检查，最多改三轮 | 有条件时截图自查 |
| 源码许可 | MIT | Apache-2.0 | MIT | Apache-2.0（该目录的 LICENSE.txt） |

依据（2026-11-04 重新核对；不据此声称实际运行或质量验收）：

- Impeccable：[generate 文档](https://impeccable.style/docs/generate)（具名区域、默认数量、接受和丢弃语义；该命令依赖 beta Live Mode；此页没有说明接受后的撤回）。
- Impeccable：[detector 文档](https://impeccable.style/docs/detector)（区分源代码扫描和浏览器扫描；无发现不等于完整设计评审）。
- Taste Skill：[README](https://github.com/Leonxlnx/taste-skill)（网页流程抽取方向并由 Agent 选择；应用界面使用独立路线；浏览器自查要求不等于本项目已经实测通过）。
- frontend-design：[SKILL.md](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md)（先计划再编写，条件允许时截图自查；此文本没有定义用户比较多个完整产物或请求级撤回）。
- 许可证原文：[Impeccable](https://github.com/pbakaus/impeccable/blob/main/LICENSE)、[Taste Skill](https://github.com/Leonxlnx/taste-skill/blob/main/LICENSE)、[frontend-design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/LICENSE.txt)。这里只记录技能源码的许可证名称，不代替对托管服务条款、素材或商标的核对。
- Variant Design：[安装与使用](https://variant-design-skill.vercel.app/docs)、[撤回指南](https://variant-design-skill.vercel.app/guides/undo-ai-design-changes)、仓库 `references/workflow/history.md`。

### 什么时候用哪个

- **想比较几种完整做法再决定**，并且要能撤回、不覆盖自己的改动：Variant Design。
- **页面整体已经定了，想打磨某个区域**，或者想用一整套设计命令和反模式检测：Impeccable。
- **想让 Agent 自己定一个有美术方向的页面**，带参考图和浏览器检查：Taste Skill。
- **只要一个有明确取向的设计**，可查看 Anthropic 公开技能仓库中的 frontend-design；这里未验证插件市场可用性。

它们可以一起用。比如先用 Variant Design 比较三个方向、选定一个，再用 Impeccable 打磨其中的区域。

### 需要说明的关系

Variant Design 的 `references/design-system/` 里有 7 个文件原样来自 Impeccable（Apache-2.0），清单见仓库的 `NOTICE`。

## English draft

### In one sentence

All four have publicly readable source. This compares their documented workflows, not results from running them. Variant Design builds three complete directions for the same task for you to choose from, with per-direction undo. Impeccable makes variants of one named region of a page. Taste Skill’s website workflow deals directions for the agent to choose from; app screens have a separate route. frontend-design builds one design with a deliberate point of view.

### Side by side

| | Variant Design | Impeccable | Taste Skill | frontend-design |
|---|---|---|---|---|
| What you get | Three complete directions (A/B/C) for the same task and data, each stating what it optimizes and gives up | Variants of a named element or region; 3 by default, 1–8 on request | Website route: the agent picks a dealt direction; app screens use a separate route | One design: a short plan, then code |
| Who chooses | You. Only an explicit `pick B` records the final choice; a recommendation is not a choice | You. Accept writes it into your source | The agent | Not applicable (one design) |
| Undo after choosing | Yes. `undo B` reverts B's last request; `rollback` restores files after integration; both refuse if the files changed since | The docs describe Discard before accepting; they do not describe undo after accepting | The README does not say | The skill text does not mention it |
| Checks | Delivery record check and quality scan; desktop and mobile widths when a browser is available | Built-in detector for generic AI design patterns | Real-browser check at three widths, up to three fix rounds | Screenshot self-review when available |
| Source license | MIT | Apache-2.0 | MIT | Apache-2.0 in that directory’s LICENSE.txt |

Sources (rechecked 2026-11-04): the same primary links above. Impeccable generate uses beta Live Mode. The license row records source licenses; hosted-service terms and asset rights need separate checks. Documented browser checks are requirements, not evidence that this project has run them.

### When to use which

- **You want to compare several complete approaches before deciding**, with snapshots that refuse a changed-file baseline: Variant Design.
- **The page is settled and you want to refine a region**, or you want a full set of design commands and an anti-pattern detector: Impeccable.
- **You want the agent to commit to one art-directed page**, with reference images and browser checks: Taste Skill.
- **You want one distinctive design** from Anthropic’s public skills repository: frontend-design. Marketplace availability was not verified here.

They combine: compare three directions with Variant Design, pick one, then refine its regions with Impeccable.

### Relationship to disclose

Seven files in Variant Design's `references/design-system/` are unchanged copies from Impeccable (Apache-2.0); the repository's `NOTICE` lists them.

## 发布前要决定的（维护者）

1. 放在哪：独立的 `/compare` 页，还是 `/guides` 里的一篇（复用现有的预渲染、`hreflang` 和 JSON-LD）。
2. frontend-design 是 Anthropic 的技能；其目录当前含 Apache-2.0 许可证，但源码许可不自动回答服务条款是否允许比较的问题。`TODO.md` 要求“发布涉及 Anthropic 技能的对比前，先由维护者确认条款”。本稿只引用它公开的 SKILL.md 文字，没有运行或测评它。
3. star 数不写进页面：变化快，也和“适合什么情况”无关。
4. 英文稿是代理写的，发布时按 RFC-005 §3.5 先标 `draft`，审过再改 `complete`。

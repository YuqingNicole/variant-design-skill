# 评估：把 `quality-gate.mjs` 的规则做成公开的反模式目录

日期：2026-11-02。基线：master。对应 `TODO.md` 第 4 组第 2 条。结论在最后。

## 现在有什么

`scripts/quality-gate.mjs` 有 16 条规则，用正则扫描 HTML、CSS、JSX、TSX、Vue 和 Svelte 文件，按严重程度分 error 和 warning。按内容分三类：

| 类别 | 规则 | 条数 |
|---|---|---|
| 可访问性 | `missing-img-alt`、`zoom-disabled`、`focus-outline-removed`、`focus-visible-suppressed`、`missing-reduced-motion`、`js-motion-review`、`paste-blocked` | 7 |
| 代码和交付完整度 | `lorem-ipsum`、`omitted-code`、`window-alert`、`fixed-100vh`、`arbitrary-z-index`、`transition-all`、`pure-black-surface` | 7 |
| 文案 | `generic-error-copy`（含中文）、`ai-cliche`（elevate、seamless、unleash 等 7 个词） | 2 |

另有 `--self-test` 用一份坏样例和一份好样例检查规则本身。

## 和 Impeccable `/slop` 的区别

Impeccable 的 [/slop](https://impeccable.style/slop) 列的是视觉上的“AI 味”（例如紫色渐变、卡片套卡片、彩色背景上的灰字），配检测器。我们的规则大多不是视觉风格判断，而是能在代码里确定找到的问题：缺 alt、禁止缩放、去掉焦点框、没有减少动效的后备、交付代码里留着省略标记。两者重叠很少（只有 `ai-cliche` 和纯黑背景接近）。

所以如果做成公开页，它不是 `/slop` 的翻版，定位应该是“AI 交付的界面代码里常见、能自动查到的问题”，每条写清为什么是问题、怎么改、扫描查不到什么。

## 做的好处

- 回答 GEO 问题 3（AI 界面千篇一律）时多一个具体、可以引用的页面；这个问题竞争激烈，现有回答多是视觉建议，少有“代码里怎么查”的。
- 每条规则都有对应的修法，读者不装技能也能用；装了技能的用户可以直接跑 `node <skill-root>/scripts/quality-gate.mjs <files> --strict`。
- 逼我们把每条规则的理由写清楚，规则本身也会更好维护。

## 做的成本和风险

- 现在每条规则只有一句英文 `message`，没有中文、没有理由和修改示例。要先把规则改成一份数据（id、严重程度、正则、中英文说明、为什么、怎么改、查不到什么），脚本和网页都读它，否则网页和脚本会各说各的。
- 正则扫描有漏报和误报。页面必须写明“这是线索，不是结论”，和 `AGENTS.md` 的诚实要求一致：不能写成“通过这些检查就符合 WCAG”。
- 规则数量少（16 条），单独成站不够撑，适合一页加每条一个锚点，而不是每条一页。
- 估计工作量：规则数据化和测试半天，页面（中英文、预渲染、JSON-LD）半天。

## 结论

建议做，但顺序放在对比页之后，形式是一页 `/guides/ai-ui-code-checks`（或 `/checks`），而不是仿 `/slop` 的视觉目录：

1. 先把规则改成一份共用数据，脚本行为不变，`--self-test` 和现有测试保持通过。
2. 再做页面：每条写“为什么是问题、怎么改、扫描查不到什么”，中英文；英文按 RFC-005 §3.5 先标 `draft`。
3. 不新增视觉风格类规则来追 `/slop`；如果以后要加，先在 `docs/research/` 记录依据。

需要维护者决定：做不做，以及页面地址。

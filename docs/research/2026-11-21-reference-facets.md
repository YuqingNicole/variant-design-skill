# 参考的多维属性（facets）初稿（2026-11-21）

批量做合集页之前的地基。现有每条参考只有一个 `tag`，取值不统一（Interaction 47 条、VFX 1 条），撑不起“深色 SaaS 落地页”“按钮微交互”这类交叉合集。这次给 273 条参考补了七个受控属性，全部是**初稿**，没有人打开过原作品核对。

## 做了什么

- `website/src/reference-facets.ts`：词表与校验。七个属性：`industry`（单选，可为空）、`medium`（作品是什么，单选）、`pageTypes`、`patterns`、`components`、`techniques`、`styles`（多选，每项最多 3 个）。每个值都有中英文名。
- `website/src/reference-facets.json`：按参考 id 存值，273 条全覆盖，`status` 全部是 `draft`。
- `website/scripts/reference-facets.mjs`：统计每个值有多少条、能不能撑起合集页。`node website/scripts/reference-facets.mjs` 只数已核对的；加 `--drafts` 连初稿一起数，用来排核对顺序。
- `website/scripts/reference-facets.test.mjs`：每条已发布参考必须有属性、不能有孤儿记录、值必须在词表里；合集只认 `reviewed`。

`tag` 和分区（`inspiration-sections.ts`）都没动，页面上还看不到任何变化。

## 怎么打的

分三批交给代理，规则：

- 每个值都要能在这条记录自己的文字里找到依据（名称、地址、focus、application、analysis、帖子正文）；只有 `industry` 允许用公开常识（公司做什么）。
- 不按品牌名或印象猜视觉风格；文字里没说深色、颗粒、单色，就不填。
- 不打开网页，只读记录。拿不准就不填。

代理报告的拿不准的情况，归成几类：

1. **平台没写明的交互视频**：约十几条按“网页界面”兜底填了 `website`，其中一部分实际可能是 `web-app` 或 `mobile-app`；有几条因为帖子里出现“sheet”填了 `mobile-app`。
2. **词表缺口**：设计工具原本只能归到 `productivity`，合并时加了 `design-tools`（figma、framer、spline、jitter、sketch、lottiefiles 和两条 Figma 帮助文档）；游戏界面、旋钮、像素风没有对应的值，留空。
3. **靠常识填的行业**：如 Fermah → `crypto`、Plasma → `fintech`（也可算 `crypto`）、Devouring Details → `education`、oppo 字标动画 → `hardware`。
4. **措辞读得宽**：如 resend 的 `code-hero`（文字说代码紧跟主张，没说在首屏）、wispr 的 `kinetic-type`、ladybird 的 `minimal`。

抽查 12 条与记录文字对得上，没有发现编造的值，但抽查不等于核对。

## 统计（初稿，2026-11-21）

空值很多是规则造成的，不是遗漏：273 条里 `styles` 空 162 条、`patterns` 空 175 条、`techniques` 空 207 条、`industry` 为空 96 条。

按初稿数，达到 6 条（暂定的合集门槛）的值：

- 行业：dev-tools 37、productivity 29、ai 28、studio 17、fintech 12、design-tools 8、commerce 7、hardware 7、portfolio 7、gaming 6
- 页面模式：logo-wall 42、product-ui-hero 16、tabbed-features 15、editorial-type 12、testimonials 11、metrics 11、category-entry 8、prompt-hero 6、install-command 6、case-grid 6
- 组件：card 28、logo 18、button 12、input 11、tabs 9、toggle 8、carousel 6
- 技法：micro-interaction 17、transition 10、hover 9、drag-gesture 8、morph 7、kinetic-type 7、webgl 7
- 风格：dark 27、illustrated 27、gradient 14、texture 12、rendered-3d 8、editorial 7、playful 7、photographic 7、monochrome 7、colorful 6

**页面类型撑不起合集**：除 homepage 132、product-page 6 以外都只有 1–5 条，定价页只有 0 条。现有参考几乎都记的是首页，“pricing page design examples”这类合集要靠新收录，不能靠补标签。

## 还没做的

1. 【维护者】核对：合集页只能用 `reviewed` 的值。建议先核对能进第一批合集的那几十条（上面达标值涉及的参考），打开作品逐项确认后把 `status` 改成 `reviewed`、填 `reviewedAt`。
2. 新收录的参考要同时写属性：测试会因为缺属性变红，收件箱流程（`x-post-inbox.json` → 上线）要加这一步。
3. 门槛 6 条是暂定的，等第一批合集页的收录数据回来再调。
4. 合集页本身（路由、预渲染、结构化数据、`noindex` 门槛）是下一步，这次没做。

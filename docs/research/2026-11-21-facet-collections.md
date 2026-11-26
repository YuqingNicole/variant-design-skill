# 合集页：路由、预渲染和上线门槛（2026-11-21）

接着 `2026-11-21-reference-facets.md`。属性初稿已经合并（#305），这次把合集页本身做出来，但**正式站一个都不会显示**，因为还没有任何参考的属性被核对过。

## 做了什么

- `website/src/collections.ts`：11 个合集的定义（筛选条件 + 中英文标题 + 手写导语），以及决定哪些合集上线的函数。合集可以再限定在一个分区里（`section: 'web'`），“……网站”类合集只收网站，不收设计短视频。
- `website/src/CollectionPage.tsx`：`/collections` 索引页和 `/collections/<slug>` 详情页，客户端和 SSR 共用。每条参考显示名称、研究什么、用在哪里，链到我们的笔记页和原站；页尾是“做出你的版本”。
- `website/scripts/prerender.mjs`：为合集生成静态页、`BreadcrumbList` 和 `CollectionPage` + `ItemList` 结构化数据。
- 测试 `website/scripts/collections.test.mjs`：合集只用词表里的值、中英文齐全；正式站只上线有足够已核对条目的合集，并且只列已核对的条目；预览专用的合集 `noindex`、不进 sitemap。

## 上线规则

| 构建 | 合集 | 列出的条目 | 搜索引擎 |
|---|---|---|---|
| 正式站（`VERCEL_ENV=production`） | 只有已核对条目 ≥ 6 的合集；一个都没有时连 `/collections` 也不生成 | 只列已核对的 | 可收录，进 sitemap |
| 本地、预览、dev | 全部 11 个 | 初稿也列，每条标“初稿”，页面顶部有预览提示 | `noindex`，不进 sitemap |

## 检查

- `npm test --prefix website`：149 个通过；`tsc` 无报错。
- 本地构建：`Collections: 0 public, 11 preview-only (noindex)`，生成 659 个页面；`VERCEL_ENV=production` 只跑预渲染：0 个合集，`dist/collections` 不存在，607 个页面。
- 浏览器（Playwright，本机 Chrome）：中文桌面 1440、英文手机 390、索引页三张截图，无报错、无横向溢出。截图没有提交。

## 初稿暴露的数据问题

第一版“深色网站”里混进了“Stock ticker card”“HEX website opening”这类设计短视频：打标签时没写平台的视频被兜底成 `medium: website`。加了 `section: 'web'` 以后，四个“……网站”合集只收网站。视频那一侧的 `medium` 仍然不可靠，核对时要一并修正。

## 每个合集的初稿条数（2026-11-21）

dark-websites 17、developer-tool-websites 32、ai-product-websites 18、fintech-design 12、design-studio-websites 13、product-ui-hero 16、tabbed-feature-sections 15、testimonial-sections 11、micro-interactions 17、grain-texture 12、illustrated-design 27。

## 还没做的

1. 【维护者】核对属性：先核对上面合集涉及的参考，每个合集核对满 6 条就会在下次部署时上线。导语也要过一遍，尤其是英文（代理写的，没人审过）。
2. 详情页和分区页还没有链到合集；等第一批合集上线后再加，免得链到正式站不存在的页面。
3. 合集页没有缩略图，只有文字卡片。要不要复用灵感页的缩略图，等上线后看数据再定。

## 补记：改成笔记流样式（2026-11-21）

维护者反馈手机端没有完成适配，并建议参考小红书的样式。合集页改成笔记流：

- 标题下面一排可横滑的频道标签（全部 + 每个合集的短名），滚动时吸顶，当前合集加粗加下划线；每个合集新增 `short` 短名。
- 卡片双列错落（平板三列、桌面四列，CSS `columns`）：封面在上，按媒体原始比例在 3:4 到 4:3 之间取值；下面两行标题（名称加粗 + 研究什么）；最底一行是作者头像、来源和“初稿”标记。整张卡片是一个链接。
- 手机上导语折成两行，带“展开 / 收起”；左右只留 6px，卡片间距 6px。
- 索引页同样是卡片流，封面取每个合集的第一条。
- X 作者头像先走图片代理、再直连，都失败就显示来源首字母（与灵感页一致）。

只借用了双列笔记流这种通用布局，没有复制小红书的界面、图标或文案。检查：网站测试 149 个通过；手机 390px 与桌面 1440px 截图无报错、无横向溢出，正文链接点击高度 ≥ 44px。`columns` 让条目先排满左列再排右列，所以阅读顺序是按列的；合集没有排名，暂时接受。没有在真机上试过。

## 补记：第二轮核对后共 19 个合集（2026-11-26）

其余 138 条参考核对后，新增 8 个合集（productivity-websites、mobile-app-interfaces、brand-identity-design、bento-grid-layouts、big-type-layouts、documentation-pages、gesture-interactions、playful-design），全部达到“已核对 ≥ 6 条”，英文同样标为草稿。合集多了以后，手机上频道条会把当前合集横向滚进可见范围。详见 `2026-11-26-agent-facet-review-2.md`。

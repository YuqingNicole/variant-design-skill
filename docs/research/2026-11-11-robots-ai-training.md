# robots.txt 拒绝 AI 训练类爬虫（2026-11-11）

维护者决定：本站拒绝抓取训练数据的 AI 爬虫，但继续允许搜索引擎和 AI 搜索/助手的访问。

## 为什么不是全禁

`2026-11-02-geo-strategy.md` 的目标是让 ChatGPT、Perplexity、Claude 等 AI 搜索找到并引用本站，并为此生成了 `llms.txt`。全禁会让这一层工作失效，所以只禁训练类。

## 当前规则（`website/scripts/prerender.mjs` 的 `robots()`，构建时写入 `robots.txt`）

- 拒绝：GPTBot、ClaudeBot、anthropic-ai、Claude-Web、CCBot、Google-Extended、Applebot-Extended、Bytespider、Amazonbot、meta-externalagent、cohere-ai、Diffbot、omgili、omgilibot、ImagesiftBot、Timpibot。
- 不写规则，即继续允许：OAI-SearchBot、ChatGPT-User、Claude-SearchBot、Claude-User、PerplexityBot 和所有普通搜索引擎。
- 在 `User-agent: *` 组里写 `Content-Signal: search=yes, ai-input=yes, ai-train=no`，这是对支持该信号的抓取方的明示意图。
- 回归测试在 `website/scripts/prerender.test.mjs`。

## 局限

- robots.txt 只是请求，不是技术拦截；不遵守的爬虫仍可抓取。要强制拦截需要在 Vercel 防火墙层按 User-Agent 或 IP 处理，没有做。
- 名单会过时。新的训练类爬虫出现时要手工补进 `aiTrainingCrawlers`。名单依据是各家公开的爬虫说明和 recent.design 的 robots.txt，没有逐家重新核对官方文档，补名单前应先查对应公司的页面。
- 上线后需要请求 https://variantdesign.xyz/robots.txt 确认内容；本次只在构建产物里核对过。

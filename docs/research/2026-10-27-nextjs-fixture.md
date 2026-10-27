# Next.js 示例项目实测 — 2026-10-27

此前的自动实测只覆盖 Vite + React 和纯 HTML。这次新增 `evals/fixtures/ledger`，补上最常见的 Next.js。

## 示例项目

- Next.js 15.5.12 App Router（原计划用 16.3.8，安装时大文件下载多次中断，改用本机缓存里的版本）。
- `/pricing` 定价页：三档套餐，支持年付/月付切换和 USD/EUR/GBP 切换。
  - 套餐数据来自 `components/plans.ts`，注释写明结账页和账单设置页也在用；
  - 币种来自 `components/currency.tsx` 的 client context，在 `app/layout.tsx` 中挂载。
- `app/globals.css` 写明"字体和颜色由品牌规范决定，间距和布局可调"，评分按品牌锁定处理（Source Sans 3 / Source Serif 4）。
- 指令同其他示例，最后一句改为："不要启动常驻服务器；需要预览时生成可直接打开的文件，做不到就说明原因和用户自己运行的命令。"

评分脚本调整：技能说明要求 Next.js 用一条隔离的预览路由，所以 agent 在 `variant…` 目录下新建的文件（如 `app/variant-preview/`）记为提醒，不算违规。改动已有文件仍然算失败。

## 结果

技能版本：#62 合并后的 master（按阶段加载）。

| 运行 | 结果 | 推荐 | 读取技能文字 | 用量 | 耗时 |
|---|---|---|---|---|---|
| ledger · Claude | 全部通过 | B | 7,271 词（9 个文件） | $2.08，37 轮 | 1147 s |
| ledger · Codex | `project-untouched` 失败，其余通过 | A | 5,484 词（5 个文件） | 91.1 万 token | 416 s |

两个 agent 都做到了以下几点：
- 识别出品牌锁定（`app/globals.css`，两种字体）；
- 没有改动共享的 `plans.ts` 和 `currency.tsx`；
- 三版使用同一份数据，保留年付/月付切换、币种切换和原有的 CTA 链接；
- 生成了可以直接打开的静态预览；
- 没有替用户选定方向；
- 项目本身和三版都通过了 `tsc` 类型检查。

Codex 失败的原因是项目根目录多了 `tsconfig.tsbuildinfo`。这是开启 `incremental` 后 `tsc` 写的缓存文件，标准 Next.js 项目的 `.gitignore` 会忽略它，是示例项目漏写了这一条，不是技能的问题。已在示例项目的 `.gitignore` 里补上 `*.tsbuildinfo`。

## 发现

| # | 发现 | 处理 |
|---|---|---|
| 1 | Next.js 项目没有 Vite，`react-preview.mjs --static` 用不了。`preview.md` 对 Next.js 只写了"新建隔离的预览路由"，而这需要一个运行中的服务器。不能启动服务器时，技能没有可用的工具，两个 agent 都自己写了打包脚本：Claude 写了 `static-preview.mjs`，Codex 用 TypeScript 转译后手工拼出 HTML。都成功了，但做法是临时的、耗时，项目一大就不可靠 | 开了 #64，列出三种解决方向，没有在这次改动里修 |
| 2 | Claude 用了 19 分钟，大部分时间花在上面这个临时打包上 | 同 #64 |
| 3 | Codex 写了 `variant-output/VERIFICATION.md`，把产品完整性判为 conditional：原项目没有注册页，预览里的 CTA 只说明跳转地址，不会真的提交 | 合理，记录下来 |

## 局限

- 每个 agent 只跑了一次。
- 示例项目没有用到 `next/font`、`next/image`、服务端组件和中间件，真实的 Next.js 项目会更难。

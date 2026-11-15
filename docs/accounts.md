# 账号登录：配置与边界

2026-11-15 起，灵感页的“加入参考包”和“生成参考指令”需要登录（维护者决定）。浏览、搜索、详情页不需要登录。

- **登录服务**：Supabase，提供登录和存收藏的 Postgres 数据库。
- **登录方式**：Google，以及发到邮箱的登录链接（不用密码）。
- **代码**：`website/src/account.ts`（登录状态、读写收藏）、`website/src/AccountDialog.tsx`（登录弹窗和页头的账号按钮）、`website/src/pack.ts`（参考包的格式和首次登录时的合并）。
- **数据库**：`supabase/migrations/20261115000000_reference_packs.sql`。
- **测试**：`tests/accounts.spec.mjs` 用一个假的 Supabase 模块跑完整流程；`website/scripts/pack.test.mjs` 测合并规则。

## 没配置时

构建时没有 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`，账号功能就是关闭的：

- 页头没有登录按钮；
- 参考包仍然只存在当前浏览器；
- 不拦任何操作。

本地开发、CI 和没配密钥的部署都是这个状态。

## 维护者要做的配置（一次）

1. **建项目**：在 Supabase 新建一个项目（免费档够用）。
2. **建表**：在 SQL Editor 里运行 `supabase/migrations/20261115000000_reference_packs.sql`。它会建 `reference_packs` 表并打开行级安全（每个用户只能读写自己的一行），再建一个只能删除调用者自己的 `delete_my_account()` 函数。
3. **允许的回跳地址**：在 Authentication → URL Configuration 设置。
   - Site URL：`https://variantdesign.xyz`
   - Redirect URLs：`https://variantdesign.xyz/**`、`https://variant-design-skill.vercel.app/**`、`https://variant-design-skill-dev.vercel.app/**`，以及预览部署的地址模式（形如 `https://variant-design-skill-*-nicolechen-9191s-projects.vercel.app/**`）。不在列表里的地址登录后会被送回 Site URL。
4. **Google 登录**：
   - 在 Google Cloud Console 建一个 OAuth 客户端（Web application），已获授权的重定向 URI 填 `https://<项目>.supabase.co/auth/v1/callback`。
   - 把客户端 ID 和密钥填进 Supabase 的 Authentication → Providers → Google。
   - OAuth 同意屏幕的应用名填 Variant Design。
5. **邮箱登录链接**：
   - Supabase 默认打开了 Email 登录。
   - 自带的发信服务每小时只能发很少几封，正式使用前，在 Authentication → SMTP Settings 接一个发信服务（比如 Resend）。
   - 登录邮件模板可以改成中英双语。
6. **Vercel 环境变量**：在 Settings → Environment Variables，给 Production 和 Preview 加上：
   - `VITE_SUPABASE_URL`：项目地址，`https://<项目>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`：项目的 anon public key。这把密钥会出现在网页里，本来就是公开的，数据安全靠第 2 步的行级安全。**不要**填 service_role key。
7. **生效**：重新部署一次。变量是在构建时写进页面的，改了变量要重新构建才生效。

## 行为

- **没登录时**：点“加入参考包”或“生成参考指令”会弹出登录框，说明为什么要登录。用户关掉登录框，这次操作就作废；如果是去登录了，登录回来以后，当初想收藏的那条会自动加进参考包。“生成参考指令”不会自动继续，要再点一次。
- **第一次登录**：这台浏览器以前存的参考包（连同笔记）会合并进账号。浏览器里有、账号里没有的参考会加进账号；两边都有的，每一栏笔记以账号里的为准，账号里那一栏是空的才用浏览器里的。合并成功写进账号以后，浏览器里的旧副本才删除。
- **登录以后**：每次修改在 0.4 秒后写进账号。写入失败时页面会提示，下一次修改会再试。
- **账号菜单**：显示邮箱，可以退出登录或删除账号。删除账号要点两次确认，会同时删掉账号和全部收藏。
- **性能**：Supabase 的库（压缩后约 59 KB）单独打包，只在用户点登录、或者浏览器里已经有登录状态时才加载。没登录过的访客，首页脚本不变。

## 隐私

登录框里写明了保存什么：

- 邮箱；用 Google 登录时还有名字和头像；
- 用户收藏的参考和写的笔记。

这些只用来登录和同步收藏。数据存在维护者的 Supabase 项目里，删除账号会立即删除这些数据。

## 尚未验证

- 没有接真实的 Supabase 项目跑过。登录、回跳、写库都只在测试里用假模块验证过，配好以后要在预览部署上实测一次 Google 和邮箱两种登录。
- 邮箱登录用的是 PKCE（一种防止登录凭证被截获的流程），登录链接要在发起登录的同一个浏览器里打开。在另一台设备上打开会失败，登录框里已经提示“请在这台设备上打开”。
- 同一个账号在两个标签页里同时编辑时，后写的会覆盖先写的，没有做冲突合并。

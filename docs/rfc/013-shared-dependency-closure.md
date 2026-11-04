# RFC-013：共享依赖闭包与证据、接入基准绑定

执行范围来自 #18 V4/V5、#19 PRD-003 的共享源码/配置/资源保护，以及 RFC-001 的只读识别约束。基于 PR #159 `1898fe5`。不是任意框架完整支持或全部 backlog 验收。

## 问题与目标

现有验证和接入自动绑定注册设计系统，但普通共享 hook、数据、CSS、别名和资源依赖必须逐文件手动列出。只改共享 provider 或传递导入的 CSS 时，旧证据/接入计划可能仍显示有效。

新增只读共享模块，自动从已登记变体文件、显式依赖、现有项目 HTML 入口及相关配置追踪本地静态引用。验证前后、查看证据时、接入 prepare/apply 时均重新读取同一规则下的闭包；已知依赖、解析配置、解析器或引用集合改变时，旧记录失效。未知关系明确报告，不以旧扫描结果代替即时读取。

## 接口与解析来源

`scripts/project-dependencies.mjs` 导出 `collectProjectDependencies(project, entries)`，CLI 输出仅含相对文件路径、SHA-256、引用边、解析器身份、已审查解析事实与未知项，不输出源码、脚本值、环境值或完整外部 URL。

- JS/TS/JSX/TSX 使用目标项目通过 Node 解析得到的已有 TypeScript 编译器 API，仅构建 AST，不执行项目源码或 Vite 配置。缺少/不兼容 API 时明确 partial，不能用关键词匹配假装完成脚本解析。TypeScript 7 的原生 API 与 6 及以前不同，按实际能力检查。
- HTML/CSS 使用小型引号/注释感知的引用读取器，覆盖 script/link、静态资源、内联 module/style、CSS import/url；未支持或动态资源形式保留未知。JSON/二进制资源保存内容身份，不猜测任意业务 JSON 字符串的资源含义。
- 相对引用、项目根/静态 public 引用及 tsconfig/jsconfig 的字面 paths 映射可自动扩展。追踪本地 extends/references；package extends、动态配置及运行环境保持限制。不执行配置来推断别名。
- 多个可能本地候选全部纳入，报告歧义；不假称 TypeScript paths 等同于 Vite 的实际解析。包引用由包/lock 清单绑定，安装目录、运行环境、远程资源与插件生成内容不属于本地源码闭包证明。
- 项目 `.variant-work/dependency-resolution.json` 可提供 `{schemaVersion:1, entries:[...], aliases:{"@":"src"}, configFiles:[...]}`：由 Agent 先审查原项目再记录。它自身也被绑定。原生预览 wrapper、适配清单、独立类型/构建配置应登记在这里；不是扫描整个工作目录来猜用途。已有该路径不自动覆盖；无文件时不虚构事实。

官方依据：TypeScript [Compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API) 的 AST/遍历接口、[paths](https://www.typescriptlang.org/tsconfig/paths.html) 的相对位置与不改变运行时导入语义的限制。Vite 7 文档页面读取失败后，核验了锁定 [v7.1.7 config.ts](https://github.com/vitejs/vite/blob/v7.1.7/packages/vite/src/node/config.ts) 的默认模块扩展集合；CSS 不作为无后缀脚本的候选，显式 CSS 引用仍跟踪。模块候选取保守集合，不用某个扩展顺序宣称完整运行时解析。

## 安全、有效性与兼容

拒绝越界、符号链接、敏感路径、历史/构建/依赖目录和特殊文件。单次文件数、总字节及可解析文本大小有明确上限；达到上限记 partial。通过静态路径识别出的危险/缺失依赖不得被当作已验证。固定大小分块计算资源摘要，避免把大资源全文作为源码载入；本地配置仍可能含秘密，默认只记录摘要，不做秘密检测承诺。

闭包身份使用稳定相对路径和字节摘要，不使用复制后会变的 inode、绝对工具路径或采集时间；便于在完整副本重放同一依赖基准。解析 helper、参考读取器和实际编译器版本/内容身份纳入。新增、删除、重定向引用及解析事实变化都会改变身份。每个操作仍独立读当前文件；外部编辑器最终检查与写入之间的竞态边界保持显式。

验证报告保留每项实际运行结果；闭包存在未知时整体最多 unverified，不能把五项有限浏览器通过扩大为完整版本绑定。旧报告缺少新闭包身份须重新运行。接入计划/备份保存同一闭包及覆盖范围，apply 对任何已知身份变化拒绝，保留 staging/候选。partial 接入不代表已验收上线；输出未知项，不能因此忽略已知文件冲突。旧计划不事后补依赖，应 prepare 全新计划。

不改 context v2 的解释、不自动迁移旧字段、不增加 force、不选择方向、不改原生产配置或依赖版本。现有项目画像仍明确是词法/语义审查输入；它不能替代新即时基准。

## 验收与执行顺序

1. 真实文件/解析器回归：传递 JS/CSS/JSON/资源、别名、注释内假 import、字符串/动态 import、config extends/references、URL/查询、缺失/新增/歧义、敏感/链接/限制、纯只读及确定性。
2. 验证入口：未手列的共享源码/资产变化使旧证据 stale；过程中变化不能出新有效证据；未知保持 unverified；选择无关、撤回版本仍要重验。
3. 接入入口：prepare 后 provider/data/CSS/别名/配置/资产或引用集合变化拒绝且零写入；新计划正常 apply/rollback；复制项目依赖身份保持一致，选择和 A/C 不变。
4. 同步共享流程、相关 route、双语用户说明及插件 required。CI 安装测试工作区后再运行需要真实项目 TypeScript 的回归；不安装任何依赖到用户项目。
5. 实际安装技能 CLI dogfood，加宿主独立共享依赖变更探针；保留原始失败/未知及四阶段源码，不用手写 fixture 冒充真实 Agent。更新 research 和执行索引，独立检查精确提交 CI。

完整交付凭证、#18 自动运行计划、运行环境变化识别、动态业务依赖、其它 backlog 和既有人类决策继续开放。生产/发布需既有授权，不在本阶段执行。

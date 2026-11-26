# X 视频筛选：拒收同人作品（2026-11-26）

## 起因

维护者 2026-11-26 决定撤下两条已上线的 X 视频：

- `x-bitzelyt-161077`（@BitzelYT，PR #336）：方块风紫色兔子玩偶，像《玩具熊的五夜后宫》（FNAF）的 Bonnie，而且是给别人视频做的镜头（"shots i animated for jude's new video"）。
- `x-crimsonrakan-775114`（@CrimsonRakan，PR #337）：Whisper the Wolf 面部动画测试，Whisper 是世嘉 Sonic 系列角色。

同几批里模型的判断不一致：收了这两条，却以"别家 IP 的同人"为由拒了 Looney Tunes（@Cursed_Nelari）和 TUGS（@shl0rp1ng）的同人。原提示词没有关于同人或别家角色的规则，拒的那几条是模型自己加的理由。

## 改了什么

- 两条从 `inspiration-data.ts` 和 `x-media.json` 删掉；收件箱里对应两行改为 `rejected`，写明撤下原因，以后发现时不会再收。
- `x-publish.mjs` 新增 `IP_RULE`，放进筛选提示词：主角是别人作品（游戏、动画、漫画、影视、玩具、吉祥物）里已有角色的视频一律拒，手艺再好也拒；列了 FNAF、Sonic、宝可梦、马里奥、Looney Tunes、迪士尼/皮克斯、TUGS、Hazbin Hotel、动漫主角、Minecraft 生物等例子；同人图、同人动画、重制、"我的版本"、换皮 OC 都算；看不出角色是不是作者原创时拒。同时拒"给别人视频做的镜头"、约稿、客户作品节选。原创角色用常见风格（体素、卡通、兽装）不受影响。其他标准没动。
- `youtube-publish.mjs` 和 X 共用同一套视频 tab 定义，也加了这条规则。
- `x-discovery.mjs` 的文字预过滤加两类明确标记：`fan art`/`fanart`/`fan animation`/`fanmade`/`#fnaf` 标签，以及 "shots/scenes/parts I animated for X's …"、"commissioned by"、"commission for @"。不匹配裸的作品名（包括不带 # 的 FNAF），因为原创帖里也可能提到，比如"FNAF 风格的原创角色"。用库里现有 170 条 X 帖子的正文试过，这两类一条都没命中。

## 重新筛选（dry run，不写文件）

用临时的收件箱副本，把 #329、#336、#337 的 15 条候选重新设为 pending，用新提示词跑 `x-publish.mjs` 的 dry run（真实的 syndication 接口、ffmpeg 和 `claude -p`）。模型每次判断可能略有不同，下面只是一次结果。

| 账号 | 原结果 | 新结果 |
|---|---|---|
| @BitzelYT | 已上线（已撤下） | 拒：给别人视频做的镜头 |
| @CrimsonRakan | 已上线（已撤下） | 拒：Sonic 系列 Whisper the Wolf 同人 |
| @Cursed_Nelari | 拒 | 拒：Looney Tunes 同人 |
| @shl0rp1ng | 拒 | 拒：TUGS 同人 |
| @Reb00t2 | 拒 | 拒：Hazbin Hotel 的 Alastor 同人 |
| @toomuchliving | 已上线 | 收：混合材料定格 |
| @SPicklenuts | 已上线 | 收：朋友群像动画片头 |
| @zhuwei030430 | 已上线 | 收：手工兽装 |
| @jvl3djp | 已上线 | 收：低多边形猫走路循环 |
| @thomasma_labs | 已上线 | 收：浏览器沙地模拟 |
| @gen_xcx | 已上线 | 收：Roblox Studio 实时黑洞 |
| @rivka_huehhh | 已上线 | 收：贝多芬动画测试 |
| @duckwhocodes | 已上线 | 拒：判为交互界面设计（与同人规则无关） |
| @CrazyKaomei | 已上线 | 拒：判为 AI 工具推广（与同人规则无关） |
| @xikhar | 已上线 | 拒：库里已有该作者其他帖子（副本只去掉了这一条，属于试跑方式造成的） |

duckwhocodes 和 CrazyKaomei 两条是原有标准下的判断波动，不是这次的规则造成的；本次没有动它们。

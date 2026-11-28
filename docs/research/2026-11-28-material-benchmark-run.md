# 素材识别标准：测试集首次运行（2026-11-28）

`node website/scripts/benchmark.mjs --jobs 3`，在本机（Claude Code CLI `claude -p`、Chrome、ffmpeg）对 `website/content/benchmark.json` 的 40 条干跑一次，没有写收件箱和库。两个网站（Gleb Kuznetsov、Geoform）第一次 Chrome 截图超时，单独重跑一次后成功；下面是合并后的结果。只跑了一次，模型判断本身有波动（#314 那次同一网站两次结果不同），数字只能当作方向。

标签全是 `draft`：维护者加的标收，维护者撤下的标拒，校准表里有的按校准表，其余按收件箱现在的决定。所以“不一致”既可能是模型错，也可能是标签该改。

## 结果

```
= x-2124169434998939918 [design] label accept → accept 41/45
= x-2125586059727884760 [design] label accept → accept 37/45 (calibration item)
≠ x-2066491158164045957 [design] label accept → reject veto not-original
≠ x-2124449261853237413 [design] label accept → review 28/45
= x-2126107363191234774 [design] label accept → accept 38/45 (calibration item)
≠ x-2126326014271959134 [design] label accept → reject veto promo
= site-minimalgallery-glebich-com [design] label accept → accept 37/45 (calibration item)
= site-onepagelove-geoform-co [design] label accept → accept 36/45
≠ site-onepagelove-fonting-co [design] label accept → review 32/45
≠ site-onepagelove-justinschueler-com [design] label accept → review 31/45
≠ site-minimalgallery-openinghours-studio [design] label accept → review 33/45
≠ site-onepagelove-plastic-audio [design] label accept → review 31/45
= site-mindsparkle-farmminerals-com [design] label accept → accept 34/45
= site-csswinner-snapa-sites-uprock-pro [design] label reject → reject veto template (calibration item)
= x-2126161591502598253 [design] label reject → reject veto not-original
≠ site-onepagelove-wowww-art [design] label reject → accept 35/45
≠ site-onepagelove-soma-health-co [design] label reject → review 31/45
≠ site-minimalgallery-studioplato-co [design] label reject → review 31/45
≠ site-minimalgallery-protipmarketing-com [design] label reject → review 29/45
≠ site-mindsparkle-studyhall-design [design] label reject → review 31/45
= x-2121906990889017411 [video] label accept → accept 34/40 (calibration item)
= x-2125402094173827214 [video] label accept → accept 33/40 (calibration item)
≠ x-2125528315041829066 [video] label accept → review 30/40 (calibration item)
= x-2117724045483344364 [video] label accept → accept 31/40
≠ x-2120068254794236023 [video] label accept → review 24/40
≠ x-2119862967441527084 [video] label accept → review 26/40
≠ x-2123139134134829114 [video] label accept → review 27/40
≠ x-2125384575950156163 [video] label accept → review 27/40
≠ x-2123513509455478917 [video] label accept → review 29/40
= x-2124524949427958240 [video] label review → review 27/40 (calibration item)
= x-2122526144125980695 [video] label reject → reject 22/40 (calibration item)
= x-2125370608468775114 [video] label reject → reject veto fan-work
= x-2124662515611161077 [video] label reject → reject veto fan-work,not-original (calibration item)
= x-2115560598616355249 [video] label reject → reject veto fan-work
= x-2113105764344643821 [video] label reject → reject veto fan-work
= x-2126042554898719025 [video] label reject → reject veto merch
= x-2125251995040911656 [video] label reject → reject veto news
= x-2122200010615935385 [video] label reject → reject veto not-original
= x-2124231511499026436 [video] label reject → reject veto promo,out-of-scope
= x-2123017165771043327 [video] label reject → reject veto shock,fan-work

Screened 40, could not screen 0.

design: band agreement 8/20 (40%); without calibration items 4/16 (25%); collect-or-not 12/20 (60%).
  vetoes found 2/2; totals vs the standard's estimates: mean gap 0.3 points over 3.
  label → model    accept review reject
  accept               6      5      2
  review               0      0      0
  reject               1      4      2
  mean score by label (accept / review / reject; gap = accept − reject):
  concept        3.7 / – / 3.4   gap 0.3
  craft          4.2 / – / 3.6   gap 0.6
  originality    3.7 / – / 3.2   gap 0.5
  hierarchy      3.5 / – / 3.8   gap -0.3
  consistency    4.0 / – / 3.8   gap 0.2
  learnability   3.5 / – / 3.4   gap 0.1

video: band agreement 14/20 (70%); without calibration items 9/14 (64%); collect-or-not 14/20 (70%).
  vetoes found 9/9; totals vs the standard's estimates: mean gap 0.4 points over 5.
  label → model    accept review reject
  accept               3      6      0
  review               0      1      0
  reject               0      0     10
  mean score by label (accept / review / reject; gap = accept − reject):
  idea           3.6 / 3.0 / 2.0   gap 1.6
  completeness   3.6 / 3.0 / 3.0   gap 0.6
  craft          4.0 / 4.0 / 4.0   gap 0.0
  originality    3.7 / 4.0 / 2.0   gap 1.7
  shareability   3.1 / 3.0 / 2.0   gap 1.1```

## 看到了什么

1. **否决很准**：11 条带预期否决的全部命中（同人 5、商品 1、转播 1、转发 2、清单 1、Snapa 模板 1），拒的条目没有一条被放进收或待审。
2. **两条维护者加的设计帖子被否决**，需要维护者定：
   - @dmiiiitrii 的角色 App 图标（#343，维护者要求“找到 @morrre_dsgn 背后的原设计师”加进来的）：模型按 `not-original` 拒，理由是正文只有一句 “this is truly insane”，读起来像在评论别人的作品，帖子里没有署名。要么补一条说明（作者身份由维护者确认过），要么接受这条在新标准下不该收。
   - @jaimintf 的十个 Claude 设计（#351）：模型按 `promo` 拒，理由是帖子主要在讲 Claude 的提示词流程，“用某模型做的”是卖点。按标准文档这确实算推广，是标准比维护者当时的判断更严的地方。
3. **新标准比现在严很多**：没有否决的 22 条“现在已收”里，只有 11 条直接收，另外 11 条进待审（设计 5、视频 6）。几乎都卡在“概念 3 / 点子 3”：模型认为雾 shader、沙地撞车、兽装、朋友动画片头、Bigdude 是“好看但没有反转”。照这个比例，以后每周大约一半候选会进待审。门槛是第一版猜的，要不要放松（例如把收的线降到设计 32、视频 28）是维护者的决定，这次没有改。
4. **原来因截图被拒的网站，大多变成待审**：5 条里 4 条待审、Wowww 直接收（35/45）。这符合新标准“只有一屏不算否决”，也说明这 5 条的“拒”标签多半要改。
5. **哪些维度有用**：设计里工艺（差 0.6）和原创性（0.5）最能分开收和拒，层级、一致性、可学习性几乎没有区分度（≤ 0.2，层级甚至是负的）；视频里点子（1.6）、原创性（1.7）、可分享性（1.1）有用，手艺全部打 4（差 0），没有起作用。月度校准时先看这几个维度的定义和例子。
6. **校准样本的分数完全照抄**：提示词里的 8 条校准样本，模型给出的分数和提示词里的一样（误差 0–0.4 分），所以“去掉校准样本”那一行才是独立的一致率：设计 4/16，视频 9/14。AI 毛毯海盗按标准进待审（30/40，看不出人的选择），而维护者当时是亲自加的。

## 没做的

- 没有改门槛、没有改标签：都等维护者看完再定。
- 只跑了一次；没有在真实的周任务里跑过（周任务下一次运行会用新提示词）。

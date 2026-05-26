# references/wechat.md · 公众号排版

---

## 配色方案

### 方案 A：火行双主色（默认）

朱砂做大标题，炎橙做栏目标题和引用块竖线，琥珀做 aside。

| 元素 | 样式 |
|------|------|
| 文章大标题 | `#C01E1E`，26px，bold，居中 |
| 标题下分割线 | `border-top: 2px solid #C01E1E` |
| 作者署名 | `#999`，14px，右对齐，"文 \| 作者名" |
| 栏目标题 | `#E8401A`，17px，bold，`border-bottom: 2px solid #E8401A` |
| 引用块 | `border-left: 3px solid #E8401A`，padding-left 12px，16px bold |
| Aside/callout | bg `#fdf6f0`，`border-left: 3px solid #F5A623`，14px |
| 正文 | `#2C2C2C`，16px，line-height 1.95 |
| 图说 | `#999`，13px，居中，italic |
| 代码块 | bg `#1a1008`，text `#e8dfd0`，monospace 13px |

### 方案 B：水行沉静（科技 / 深度阅读）

深海蓝主色，适合科技、金融、严肃内容。

| 元素 | 样式 |
|------|------|
| 文章大标题 | `#1A3A5C`，26px，bold，居中 |
| 标题下分割线 | `border-top: 2px solid #1A3A5C` |
| 栏目标题 | `#1E5FA8`，17px，bold，`border-bottom: 2px solid #1E5FA8` |
| 引用块 | `border-left: 3px solid #1E5FA8`，padding-left 12px |
| Aside/callout | bg `#f0f5fb`，`border-left: 3px solid #5B9BD5`，14px |
| 正文 | `#2C2C2C`，16px，line-height 1.95 |

### 方案 C：木行清新（生活 / 健康 / 成长）

青绿主色，适合生活方式、健康、个人成长内容。

| 元素 | 样式 |
|------|------|
| 文章大标题 | `#1A5C3A`，26px，bold，居中 |
| 栏目标题 | `#2E8B57`，17px，bold，`border-bottom: 2px solid #2E8B57` |
| 引用块 | `border-left: 3px solid #2E8B57`，padding-left 12px |
| Aside/callout | bg `#f0faf4`，`border-left: 3px solid #7BC99C`，14px |
| 正文 | `#2C2C2C`，16px，line-height 1.95 |

### 方案 D：金行暖调（品牌 / 消费 / 情感）

琥珀金主色，适合品牌故事、消费内容、情感类文章。

| 元素 | 样式 |
|------|------|
| 文章大标题 | `#7A4F00`，26px，bold，居中 |
| 栏目标题 | `#C17F24`，17px，bold，`border-bottom: 2px solid #C17F24` |
| 引用块 | `border-left: 3px solid #C17F24`，padding-left 12px |
| Aside/callout | bg `#fdf8ee`，`border-left: 3px solid #E8C06A`，14px |
| 正文 | `#2C2C2C`，16px，line-height 1.95 |

---

## 间距节奏

- 段落间距：20–24px
- 正文 → 图片：16–20px
- 图片 → 图说：6–8px
- 图说 → 正文：20–24px
- 正文 → 栏目标题：28–36px

---

## 文体结构模板

### 模板 A：观点型文章

```
[大标题] — 居中，朱砂色
[作者署名] — 右对齐，灰色

[引言段] — 1-2 句，场景或挑衅句，不用宏大背景

[栏目标题一]
[正文段落] — 每段不超过 4 句
[引用块] — 核心观点或金句

[栏目标题二]
[正文段落]
[Aside] — 补充说明、数据来源、注意事项

[栏目标题三]（可选）
[正文段落]

[结尾段] — 余韵，不总结，不呼吁转发
```

### 模板 B：故事型文章

```
[大标题]
[作者署名]

[开场场景] — 时间 + 地点 + 感官细节，2-3 句

[正文段落] — 叙事推进，短句，有节奏

[引用块] — 转折点或关键一句话

[正文段落] — 事件发展

[栏目标题] — 如有多个阶段，用栏目标题分隔

[正文段落]

[结尾] — 把开场场景接回来，或留一个开放意象
```

### 模板 C：教程型文章

```
[大标题] — 说清楚学完能做什么
[作者署名]

[问题前置] — 这个教程解决什么具体痛点，1-2 句

[栏目标题：步骤一]
[正文] — 动词开头，一步一个动作
[Aside] — 这步容易犯的错误

[栏目标题：步骤二]
[正文]
[引用块] — 这步的关键原则

[栏目标题：步骤三]（以此类推）

[边界说明] — 这个方法在什么情况下不适用（用 aside 样式）

[结尾] — 不总结，一句让读者带走的话
```

---

## 公众号内容限制

- 只传 `<body>` 内部 HTML，不含 `<html><head><body>` 标签
- **所有样式必须内联**（`style="..."`），class 样式会被过滤
- 列表标签间有空白会渲染成空 bullet，提交前用正则压缩
- 禁止 CSS 变量 `var(--xxx)` — 公众号会过滤掉
- 禁止外部字体 `@import` / Google Fonts — 公众号屏蔽
- 禁止 `position: fixed/absolute` — 公众号不支持
- 禁止 JavaScript — 公众号不执行

---

## 常用内联样式片段（火行配色）

```html
<!-- 文章大标题 -->
<h1 style="color:#C01E1E;font-size:26px;font-weight:bold;text-align:center;margin-bottom:8px;">文章标题</h1>
<div style="border-top:2px solid #C01E1E;margin:0 auto 8px;width:60px;"></div>

<!-- 作者署名 -->
<p style="color:#999;font-size:14px;text-align:right;margin-bottom:32px;">文 | 作者名</p>

<!-- 栏目标题 -->
<h3 style="color:#E8401A;font-size:17px;font-weight:bold;border-bottom:2px solid #E8401A;padding-bottom:6px;margin-top:32px;margin-bottom:16px;">栏目标题</h3>

<!-- 正文段落 -->
<p style="color:#2C2C2C;font-size:16px;line-height:1.95;margin-bottom:20px;">正文内容。</p>

<!-- 引用块 -->
<blockquote style="border-left:3px solid #E8401A;padding-left:12px;margin:20px 0;font-size:16px;font-weight:bold;color:#2C2C2C;line-height:1.8;">
  引用文字
</blockquote>

<!-- Aside callout -->
<aside style="background:#fdf6f0;border-left:3px solid #F5A623;padding:12px 16px;margin:20px 0;font-size:14px;color:#444;line-height:1.8;">
  补充说明或注意事项
</aside>

<!-- 代码块 -->
<pre style="background:#1a1008;color:#e8dfd0;font-family:monospace;font-size:13px;padding:16px;border-radius:4px;overflow-x:auto;margin:20px 0;"><code>代码内容</code></pre>

<!-- 图说 -->
<p style="color:#999;font-size:13px;text-align:center;font-style:italic;margin-top:6px;margin-bottom:20px;">图片说明文字</p>

<!-- 分隔线 -->
<div style="border-top:1px solid #eee;margin:32px 0;"></div>

<!-- 数字列表项（手动，公众号列表样式不稳定）-->
<p style="color:#2C2C2C;font-size:16px;line-height:1.95;margin-bottom:12px;">
  <span style="color:#E8401A;font-weight:bold;margin-right:8px;">01</span>第一条内容
</p>
```

---

## 图片 API 流程

> **关键区别**：文章内容图片用 `uploadimg`（返回 URL 含 `from=appmsg`）。封面图用 `add_material`（返回 `media_id`）。两个接口返回格式不同，用错就显示不了。

```bash
# 1. 获取 token（每次操作前重新获取，7200秒过期）
curl "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=APP_ID&secret=SECRET"

# 2. 上传文章内容图片 → 用 uploadimg
curl -X POST "https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=TOKEN" \
  -F "media=@/path/image.png;type=image/png"
# 返回：{ "url": "http://mmbiz...?from=appmsg" } ← 这个 URL 才能在文章中用

# 3. 上传封面图 → 用 add_material
curl -X POST "https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=TOKEN&type=image" \
  -F "media=@/path/cover.png;type=image/png"
# 返回：{ "media_id": "..." } ← 用这个作为 thumb_media_id

# 4. 推草稿
curl -X POST "https://api.weixin.qq.com/cgi-bin/draft/add?access_token=TOKEN" \
  -H "Content-Type: application/json;charset=utf-8" \
  -d '{
    "articles": [{
      "title": "标题",
      "thumb_media_id": "COVER_MEDIA_ID",
      "author": "作者",
      "content": "HTML正文内容..."
    }]
  }'
```

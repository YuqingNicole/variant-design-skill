# references/wechat.md · 公众号排版

火行双主色系统。朱砂做大标题，炎橙做栏目标题和引用块竖线，琥珀做 aside。

---

## 排版规范

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

## 间距节奏

- 段落间距：20–24px
- 正文 → 图片：16–20px
- 图片 → 图说：6–8px
- 图说 → 正文：20–24px
- 正文 → 栏目标题：28–36px

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

---

## 内容规则

- 只传 `<body>` 内部 HTML，不含 `<html><head><body>` 标签
- **所有样式必须内联**（`style="..."`），class 样式会被过滤
- 列表标签间有空白会渲染成空 bullet，提交前用正则压缩
- 禁止 CSS 变量 `var(--xxx)` — 公众号会过滤掉
- 禁止外部字体 `@import` / Google Fonts — 公众号屏蔽
- 禁止 `position: fixed/absolute` — 公众号不支持

---

## 常用内联样式片段

```html
<!-- 栏目标题 -->
<h3 style="color:#E8401A;font-size:17px;font-weight:bold;border-bottom:2px solid #E8401A;padding-bottom:6px;margin-top:32px;">栏目标题</h3>

<!-- 正文段落 -->
<p style="color:#2C2C2C;font-size:16px;line-height:1.95;margin-bottom:20px;">正文内容。</p>

<!-- 引用块 -->
<blockquote style="border-left:3px solid #E8401A;padding-left:12px;margin:20px 0;font-size:16px;font-weight:bold;color:#2C2C2C;">
  引用文字
</blockquote>

<!-- Aside callout -->
<aside style="background:#fdf6f0;border-left:3px solid #F5A623;padding:12px 16px;margin:20px 0;font-size:14px;color:#444;">
  补充说明或注意事项
</aside>

<!-- 代码块 -->
<pre style="background:#1a1008;color:#e8dfd0;font-family:monospace;font-size:13px;padding:16px;border-radius:4px;overflow-x:auto;"><code>代码内容</code></pre>

<!-- 图说 -->
<p style="color:#999;font-size:13px;text-align:center;font-style:italic;margin-top:6px;">图片说明文字</p>
```

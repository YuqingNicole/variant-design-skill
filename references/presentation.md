# references/presentation.md · HTML 幻灯片

两种模式，按场景选。不要混用。

---

## Mode 1：暗色翻页（Pitch 风格）

**适用：** 投资人 Pitch、产品 Demo、VC Deck。键盘/点击翻页。

### 核心 CSS

```css
body {
  background: #09090F;
  overflow: hidden;
  height: 100vh;
  font-family: 'Instrument Sans', sans-serif;
}
.slide {
  position: absolute;
  inset: 0;
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 80px 96px;
}
.slide.active {
  display: flex;
  animation: fadeUp 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

### 导航逻辑

```javascript
let current = 0;
const slides = document.querySelectorAll('.slide');

function showSlide(n) {
  slides[current].classList.remove('active');
  current = (n + slides.length) % slides.length;
  slides[current].classList.add('active');
  document.querySelector('.page-num').textContent =
    `${String(current + 1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;
}

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') showSlide(current + 1);
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   showSlide(current - 1);
});
document.addEventListener('click', () => showSlide(current + 1));
```

### 页码样式

```css
.page-num {
  position: fixed;
  bottom: 32px;
  right: 40px;
  font-size: 11px;
  letter-spacing: 3px;
  color: rgba(255,255,255,0.3);
  font-variant-numeric: tabular-nums;
}
```

### 品牌横线

```css
.brand-line {
  width: 52px;
  height: 3px;
  background: var(--accent);  /* 五行主色 */
  border-radius: 2px;
  margin-bottom: 32px;
}
```

### 导出 PDF

```bash
npx decktape generic --key=ArrowRight --size 1920x1080 file.html output.pdf
```

---

## Mode 2：亮色滚动（演讲稿 / 移动端）

**适用：** 演讲辅助、移动端展示。iPhone Safari 必须用 CSS scroll-snap，不能用 JS 驱动滚动。

### 核心 CSS

```css
body {
  overflow: hidden;
  position: fixed;
  width: 100%;
  height: 100%;
  background: #F8F8FC;
  color: #111118;
}
.deck {
  position: fixed;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  -webkit-scroll-snap-type: y mandatory;
  height: 100%;
  width: 100%;
}
.slide {
  height: 100vh;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 64px 48px;
}
```

> ⚠️ JS 只做被动监听（更新页码），绝不驱动滚动

### 页码被动监听

```javascript
const deck = document.querySelector('.deck');
const pageNum = document.querySelector('.page-num');
const slides = document.querySelectorAll('.slide');

deck.addEventListener('scroll', () => {
  const idx = Math.round(deck.scrollTop / window.innerHeight);
  pageNum.textContent = `${idx + 1} / ${slides.length}`;
}, { passive: true });
```

### 导出 PDF（Puppeteer）

```javascript
// export.mjs
import puppeteer from 'puppeteer';
const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto('file:///path/to/deck.html');
await page.pdf({
  path: 'output.pdf',
  format: 'A4',
  printBackground: true,
  landscape: true,
});
await browser.close();
```

---

## 字号规范

| 元素 | 字号 | 字重 |
|------|------|------|
| 主标题 | `clamp(40px, 6vw, 80px)` | 900 |
| 章节标题 | `28–36px` | 700 |
| 正文 | `16–18px` | 400 |
| Eyebrow / 标签 | `11–12px, letter-spacing: 3-4px, uppercase` | 300–500 |
| 数据大字 | `48–64px` | 900 |

---

## 常用幻灯片布局

### 封面
```html
<div class="slide cover">
  <span class="eyebrow">PRODUCT · 2026</span>
  <div class="brand-line"></div>
  <h1>主标题<br/><span class="sub">副标题</span></h1>
  <p class="author">作者 / 日期</p>
</div>
```

### 数据大字页
```html
<div class="slide data">
  <span class="eyebrow">核心指标</span>
  <div class="metric">
    <span class="number" data-count="1000000">0</span>
    <span class="unit">用户</span>
  </div>
  <p class="caption">过去 30 天新增</p>
</div>
```

### 双栏
```html
<div class="slide two-col">
  <div class="col-text">
    <h2>左侧标题</h2>
    <p>说明文字</p>
  </div>
  <div class="col-visual">
    <!-- 图表或截图 -->
  </div>
</div>
```
```css
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; }
```

### 引用页
```html
<div class="slide quote">
  <span class="quote-mark">"</span>
  <blockquote>一句让人停下来想的话</blockquote>
  <cite>— 来源，职位</cite>
</div>
```
```css
.quote-mark { font-size: 120px; opacity: 0.15; line-height: 0.8; }
blockquote  { font-family: 'Fraunces', serif; font-size: clamp(24px, 3vw, 40px); font-style: italic; }
```

### 时间轴（横向）
```html
<div class="timeline">
  <div class="step active">
    <div class="dot"></div>
    <div class="line"></div>
    <span class="label">Q1 2025</span>
    <p>里程碑描述</p>
  </div>
  <!-- repeat -->
</div>
```

### 列表页（3–4项）
```html
<ul class="feature-list">
  <li>
    <span class="num">01</span>
    <div>
      <strong>标题</strong>
      <p>描述文字</p>
    </div>
  </li>
</ul>
```
```css
.num { font-size: 48px; font-weight: 900; opacity: 0.3; line-height: 1; }
```

---

## 红线

- 禁止在幻灯片中使用 emoji
- 禁止在 Mode 2 中用 JS 驱动 `scrollTo()`
- 导出前移除所有 dev 脚本（auto-reload 等）

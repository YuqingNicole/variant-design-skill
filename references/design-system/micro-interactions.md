# Micro-Interactions

Small, focused moments that make interfaces feel alive. Every output should include at least 3 micro-interactions from this library.

## Philosophy

A static UI is a dead UI. Micro-interactions are the difference between "using software" and "having an experience." They provide **feedback** (the system heard you), **guidance** (here's what happened), and **delight** (this feels good to use).

**The rule**: Every user action should produce a visible, immediate reaction. Clicks, hovers, scrolls, typing — none should go unacknowledged.

---

## 1. Button & Click Interactions

### Press Feedback — Scale Down
The most fundamental micro-interaction. Buttons compress on press, release on lift.
```css
.btn {
  transition: transform 100ms var(--ease-out-quart);
}
.btn:active {
  transform: scale(0.97);
}
```

### Ripple Effect — Material-Inspired
Click creates an expanding circle from the click point. More informative than scale alone.
```javascript
function createRipple(e) {
  const btn = e.currentTarget;
  const circle = document.createElement('span');
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  circle.style.cssText = `
    width:${size}px; height:${size}px;
    left:${e.clientX - rect.left - size/2}px;
    top:${e.clientY - rect.top - size/2}px;
    position:absolute; border-radius:50%;
    background:rgba(255,255,255,0.3);
    transform:scale(0); animation:ripple 500ms ease-out forwards;
    pointer-events:none;
  `;
  btn.style.position = 'relative';
  btn.style.overflow = 'hidden';
  btn.appendChild(circle);
  circle.addEventListener('animationend', () => circle.remove());
}
```
```css
@keyframes ripple {
  to { transform: scale(2.5); opacity: 0; }
}
```

### Submit Button — Loading State
Button transforms to show progress, then success/error.
```css
.btn-submit { transition: all 300ms var(--ease-out-expo); min-width: 160px; }
.btn-submit.loading {
  width: 48px; min-width: 48px; border-radius: 50%;
  pointer-events: none; color: transparent;
  background-image: conic-gradient(var(--accent) 90deg, transparent 0);
  animation: spin 800ms linear infinite;
}
.btn-submit.success {
  background: var(--positive); width: 48px; min-width: 48px; border-radius: 50%;
}
@keyframes spin { to { transform: rotate(360deg); } }
```

### Toggle Switch — With Bounce
```css
.toggle-thumb {
  transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toggle.active .toggle-thumb {
  transform: translateX(24px);
}
.toggle-track {
  transition: background-color 200ms ease;
}
```

---

## 2. Hover & Pointer Interactions

### Card Lift — Elevation Change
Cards rise toward the user on hover. Use transform, not box-shadow animation.
```css
.card {
  transition: transform 250ms var(--ease-out-quart),
              box-shadow 250ms var(--ease-out-quart);
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.1);
}
```

### Image Zoom — Contained
Image scales inside its container on hover. The container clips overflow.
```css
.image-wrapper { overflow: hidden; border-radius: var(--radius); }
.image-wrapper img {
  transition: transform 500ms var(--ease-out-quart);
}
.image-wrapper:hover img {
  transform: scale(1.06);
}
```

### Link Underline — Animated Reveal
Underline slides in from left on hover, slides out to right on unhover.
```css
.link {
  position: relative; text-decoration: none;
}
.link::after {
  content: ''; position: absolute;
  bottom: -2px; left: 0; width: 100%; height: 2px;
  background: var(--accent);
  transform: scaleX(0); transform-origin: right;
  transition: transform 300ms var(--ease-out-expo);
}
.link:hover::after {
  transform: scaleX(1); transform-origin: left;
}
```

### Magnetic Cursor — Subtle Pull
Element subtly follows the cursor when nearby. For hero CTAs and featured elements.
```javascript
function magnetize(el, strength = 0.3) {
  el.addEventListener('mousemove', (e) => {
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width/2) * strength;
    const y = (e.clientY - rect.top - rect.height/2) * strength;
    el.style.transform = `translate(${x}px, ${y}px)`;
  });
  el.addEventListener('mouseleave', () => {
    el.style.transition = 'transform 400ms var(--ease-out-expo)';
    el.style.transform = 'translate(0, 0)';
    setTimeout(() => el.style.transition = '', 400);
  });
}
```

### Tilt / Perspective — 3D Card
Card tilts toward cursor position. Creates depth without WebGL.
```javascript
function tilt3D(el, maxDeg = 8) {
  el.style.transformStyle = 'preserve-3d';
  el.style.transition = 'transform 100ms ease-out';
  el.addEventListener('mousemove', (e) => {
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(800px) rotateY(${x * maxDeg}deg) rotateX(${-y * maxDeg}deg)`;
  });
  el.addEventListener('mouseleave', () => {
    el.style.transition = 'transform 500ms var(--ease-out-expo)';
    el.style.transform = 'perspective(800px) rotateY(0) rotateX(0)';
  });
}
```

### Color Shift on Hover — Accent Bleed
Background color smoothly shifts to accent on hover.
```css
.nav-link {
  transition: color 200ms ease, background-color 200ms ease;
  padding: 8px 16px; border-radius: 6px;
}
.nav-link:hover {
  color: var(--bg);
  background-color: var(--accent);
}
```

---

## 3. Scroll-Driven Interactions

### Scroll Reveal — Fade Up
Elements animate in as they enter viewport. The most essential scroll interaction.
```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target); // animate once
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
```
```css
[data-reveal] {
  opacity: 0; transform: translateY(24px);
  transition: opacity 600ms var(--ease-out-expo),
              transform 600ms var(--ease-out-expo);
}
[data-reveal].visible {
  opacity: 1; transform: translateY(0);
}
/* Stagger children */
[data-reveal-stagger] > * {
  opacity: 0; transform: translateY(16px);
  transition: opacity 500ms var(--ease-out-expo),
              transform 500ms var(--ease-out-expo);
}
[data-reveal-stagger].visible > * { opacity: 1; transform: translateY(0); }
[data-reveal-stagger].visible > *:nth-child(1) { transition-delay: 0ms; }
[data-reveal-stagger].visible > *:nth-child(2) { transition-delay: 80ms; }
[data-reveal-stagger].visible > *:nth-child(3) { transition-delay: 160ms; }
[data-reveal-stagger].visible > *:nth-child(4) { transition-delay: 240ms; }
[data-reveal-stagger].visible > *:nth-child(5) { transition-delay: 320ms; }

@media (prefers-reduced-motion: reduce) {
  [data-reveal], [data-reveal-stagger] > * {
    opacity: 1; transform: none; transition: none;
  }
}
```

### Parallax — CSS Scroll-Driven (Modern)
Use CSS `animation-timeline: scroll()` for GPU-composited parallax. No JS needed.
```css
@supports (animation-timeline: scroll()) {
  .parallax-slow {
    animation: parallax-up linear both;
    animation-timeline: scroll();
    animation-range: entry 0% exit 100%;
  }
  @keyframes parallax-up {
    from { transform: translateY(40px); }
    to { transform: translateY(-40px); }
  }
}
/* Fallback: static positioning for browsers without scroll-driven animations */
```

### Scroll Progress Bar
A thin bar at the top showing how far down the page the user has scrolled.
```css
.scroll-progress {
  position: fixed; top: 0; left: 0; height: 3px; z-index: 9999;
  background: var(--accent);
  transform-origin: left; transform: scaleX(0);
  animation: scroll-progress linear both;
  animation-timeline: scroll(root);
}
@keyframes scroll-progress { to { transform: scaleX(1); } }
```

### Counter Animation — Numbers That Count Up
Numbers animate from 0 to target on scroll into view.
```javascript
function animateCounter(el) {
  const target = parseInt(el.dataset.target);
  const duration = 1500;
  const start = performance.now();
  const easeOutExpo = t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

  function tick(now) {
    const elapsed = Math.min((now - start) / duration, 1);
    const value = Math.round(easeOutExpo(elapsed) * target);
    el.textContent = new Intl.NumberFormat().format(value);
    if (elapsed < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// Trigger on scroll into view
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('[data-counter]').forEach(el => counterObserver.observe(el));
```
```html
<span data-counter data-target="12847">0</span>
```

### Text Reveal — Word by Word
Headline words appear one by one as user scrolls to the section.
```javascript
function splitWords(el) {
  const words = el.textContent.split(' ');
  el.innerHTML = words.map((w, i) =>
    `<span style="--i:${i}" class="reveal-word">${w}</span>`
  ).join(' ');
}
```
```css
.reveal-word {
  display: inline-block;
  opacity: 0; transform: translateY(12px);
  transition: opacity 400ms var(--ease-out-expo),
              transform 400ms var(--ease-out-expo);
  transition-delay: calc(var(--i) * 60ms);
}
.visible .reveal-word { opacity: 1; transform: translateY(0); }
```

---

## 4. Feedback & Notification Interactions

### Toast Notification — Slide In
```css
.toast {
  position: fixed; bottom: 24px; right: 24px;
  transform: translateX(calc(100% + 24px));
  transition: transform 400ms var(--ease-out-expo);
  z-index: 9999;
}
.toast.show { transform: translateX(0); }
.toast .progress {
  position: absolute; bottom: 0; left: 0; height: 3px;
  background: var(--accent);
  animation: toast-timer 4s linear forwards;
}
@keyframes toast-timer { to { width: 0; } }
```

### Copy to Clipboard — Feedback
```javascript
async function copyWithFeedback(text, btn) {
  await navigator.clipboard.writeText(text);
  const original = btn.innerHTML;
  btn.innerHTML = '✓ Copied';
  btn.classList.add('copied');
  setTimeout(() => {
    btn.innerHTML = original;
    btn.classList.remove('copied');
  }, 2000);
}
```

### Like / Heart Animation — Burst
```css
.heart-btn { position: relative; }
.heart-btn.liked .heart-icon {
  animation: heart-pop 400ms var(--ease-out-expo);
  color: var(--danger);
}
@keyframes heart-pop {
  0% { transform: scale(1); }
  30% { transform: scale(1.3); }
  100% { transform: scale(1); }
}
.heart-btn.liked::after {
  content: ''; position: absolute; inset: -4px;
  border-radius: 50%;
  border: 2px solid var(--danger);
  animation: heart-ring 500ms var(--ease-out-expo) forwards;
}
@keyframes heart-ring {
  from { transform: scale(0.8); opacity: 1; }
  to { transform: scale(1.6); opacity: 0; }
}
```

### Skeleton Loading — Shimmer
```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--surface) 25%,
    color-mix(in oklch, var(--surface), var(--border) 50%) 50%,
    var(--surface) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius, 8px);
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Shake — Invalid Input
```css
.input.error {
  animation: shake 400ms ease-out;
  border-color: var(--danger);
}
@keyframes shake {
  10%, 90% { transform: translateX(-1px); }
  20%, 80% { transform: translateX(2px); }
  30%, 50%, 70% { transform: translateX(-3px); }
  40%, 60% { transform: translateX(3px); }
}
```

---

## 5. Navigation & Layout Interactions

### Mobile Menu — Slide Drawer
```css
.drawer {
  position: fixed; top: 0; right: 0;
  width: min(320px, 85vw); height: 100vh;
  background: var(--surface);
  transform: translateX(100%);
  transition: transform 350ms var(--ease-out-expo);
  z-index: 1000;
}
.drawer.open { transform: translateX(0); }
.drawer-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0); /* start transparent */
  transition: background 350ms ease;
  pointer-events: none; z-index: 999;
}
.drawer.open ~ .drawer-overlay {
  background: rgba(0,0,0,0.4);
  pointer-events: auto;
}
```

### Tab Switch — Sliding Indicator
Active tab indicator slides to the selected tab instead of jumping.
```css
.tabs { position: relative; }
.tab-indicator {
  position: absolute; bottom: 0; height: 2px;
  background: var(--accent);
  transition: left 300ms var(--ease-out-expo),
              width 300ms var(--ease-out-expo);
}
```
```javascript
function moveIndicator(tab, indicator) {
  indicator.style.left = tab.offsetLeft + 'px';
  indicator.style.width = tab.offsetWidth + 'px';
}
```

### Accordion — Grid Height
Smooth height animation without animating `height`.
```css
.accordion-content {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 350ms var(--ease-out-expo);
}
.accordion.open .accordion-content {
  grid-template-rows: 1fr;
}
.accordion-inner { overflow: hidden; }
```

### Sticky Header — Shrink on Scroll
```css
.header {
  position: sticky; top: 0; z-index: 100;
  transition: padding 250ms ease, backdrop-filter 250ms ease;
  padding: 24px 32px;
}
.header.scrolled {
  padding: 12px 32px;
  backdrop-filter: blur(12px);
  background: color-mix(in oklch, var(--bg) 85%, transparent);
  border-bottom: 1px solid var(--border);
}
```
```javascript
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const header = document.querySelector('.header');
  header.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });
```

### Infinite Marquee — Horizontal Ticker
```css
.marquee { overflow: hidden; white-space: nowrap; }
.marquee-inner {
  display: inline-flex; gap: 48px;
  animation: marquee 30s linear infinite;
}
.marquee-inner > * { flex-shrink: 0; }
@keyframes marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
/* Pause on hover */
.marquee:hover .marquee-inner { animation-play-state: paused; }
```
**Important**: Duplicate the content so the loop is seamless. The -50% moves exactly one copy's worth.

---

## 6. Data & Chart Interactions

### Animated Progress Bar
```css
.progress-fill {
  width: 0;
  transition: width 800ms var(--ease-out-expo);
  background: var(--accent); height: 100%; border-radius: inherit;
}
/* Trigger by setting width via JS when visible */
```

### Tooltip on Hover — Data Points
```css
.data-point { position: relative; cursor: pointer; }
.data-point .tooltip {
  position: absolute; bottom: calc(100% + 8px); left: 50%;
  transform: translateX(-50%) translateY(4px);
  opacity: 0; pointer-events: none;
  transition: opacity 150ms ease, transform 150ms ease;
  white-space: nowrap; padding: 6px 12px;
  background: var(--text); color: var(--bg);
  border-radius: 6px; font-size: 0.8rem;
}
.data-point:hover .tooltip {
  opacity: 1; transform: translateX(-50%) translateY(0);
}
```

### Live Number Update — Flash Highlight
When a number changes, briefly highlight it to draw attention.
```css
.metric.updated {
  animation: flash 600ms ease-out;
}
@keyframes flash {
  0% { background: color-mix(in oklch, var(--accent) 30%, transparent); }
  100% { background: transparent; }
}
```

---

## 7. Entrance & Page Transitions

### Page Load — Stagger Reveal
```css
body.loaded .hero-title { animation: enter-up 700ms var(--ease-out-expo) 100ms both; }
body.loaded .hero-subtitle { animation: enter-up 700ms var(--ease-out-expo) 250ms both; }
body.loaded .hero-cta { animation: enter-up 700ms var(--ease-out-expo) 400ms both; }
body.loaded .hero-image { animation: enter-scale 800ms var(--ease-out-expo) 300ms both; }

@keyframes enter-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes enter-scale {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  body.loaded .hero-title,
  body.loaded .hero-subtitle,
  body.loaded .hero-cta,
  body.loaded .hero-image {
    animation: fade-only 300ms ease both;
  }
  @keyframes fade-only { from { opacity: 0; } to { opacity: 1; } }
}
```

### View Transition API — Page Navigation
```css
@view-transition { navigation: auto; }
::view-transition-old(root) {
  animation: fade-out 200ms ease-in;
}
::view-transition-new(root) {
  animation: fade-in 300ms ease-out;
}
```

### Curtain Reveal — Dramatic Entrance
A colored overlay slides away to reveal the page.
```css
.curtain {
  position: fixed; inset: 0; z-index: 9999;
  background: var(--accent);
  transform: scaleY(1); transform-origin: top;
  animation: curtain-exit 800ms var(--ease-out-expo) 200ms forwards;
}
@keyframes curtain-exit {
  to { transform: scaleY(0); transform-origin: top; }
}
```

---

## Picking Micro-Interactions by Domain

| Domain | Must-Have | Nice-to-Have |
|---|---|---|
| **Dashboard** | Counter animation, progress bars, flash highlight, tooltip | Live updates, skeleton loading |
| **SaaS / Landing** | Scroll reveal (stagger), sticky header, magnetic CTA, marquee | Parallax, page load stagger |
| **Editorial** | Text word reveal, scroll progress bar, image zoom | Parallax, curtain reveal |
| **E-commerce** | Card lift, image zoom, heart animation, toast | Tilt 3D on product, tab indicator |
| **Portfolio** | Scroll reveal, tilt 3D, magnetic cursor, curtain reveal | Text word reveal, marquee |
| **Food & Beverage** | Image zoom, card lift, accordion (menu sections), counter | Parallax on hero, scroll progress |
| **Fashion** | Image zoom, parallax, page transitions, marquee | Magnetic cursor, curtain reveal |
| **Mobile** | Press scale, drawer menu, tab indicator, toast | Skeleton loading, accordion |
| **Education** | Progress bar, counter animation, shake (wrong answer), heart | Toast, accordion |
| **Creative** | Tilt 3D, magnetic cursor, parallax, curtain reveal | Color shift, marquee |

---

## Anti-Patterns

| Don't | Instead |
|---|---|
| Animate everything at once | Pick 3-5 key moments per page |
| Long delays before interaction feedback | ≤100ms for button press, ≤150ms for hover |
| Animations that block content | Content always readable; animation is enhancement |
| Same animation on every element | Vary by importance: hero gets dramatic, cards get subtle |
| Scroll hijacking (taking over scroll) | Use natural scroll; enhance with parallax and reveals |
| Ignoring `prefers-reduced-motion` | Every animation MUST have a reduced-motion fallback |
| Using `setTimeout` for animation sequencing | Use CSS `animation-delay` or `transition-delay` |
| Animating layout properties (width, height, margin) | Use `transform` and `opacity` only; use `grid-template-rows` for height |

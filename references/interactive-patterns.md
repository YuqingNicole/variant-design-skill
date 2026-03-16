# Interactive Patterns

Functional interaction patterns that make designs work as real applications, not just static mockups. Each pattern includes complete, copy-paste JavaScript + CSS.

> **Design system references for this library:**
> - `design-system/micro-interactions.md` — animation building blocks used within these patterns
> - `design-system/interaction-design.md` — state management, focus, keyboard nav
> - `design-system/motion-design.md` — timing, easing, reduced motion

---

## 1. Filtering & Search

### Live Search with Instant Results
Search input that filters a list in real-time with highlight matching.
```javascript
function liveSearch(inputEl, itemsSelector) {
  const items = document.querySelectorAll(itemsSelector);
  let debounceTimer;

  inputEl.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const query = inputEl.value.toLowerCase().trim();
      let visibleCount = 0;

      items.forEach(item => {
        const text = item.textContent.toLowerCase();
        const match = !query || text.includes(query);
        item.style.display = match ? '' : 'none';
        if (match) {
          visibleCount++;
          // Highlight matching text
          if (query) {
            const walker = document.createTreeWalker(item, NodeFilter.SHOW_TEXT);
            let node;
            while (node = walker.nextNode()) {
              const parent = node.parentNode;
              if (parent.classList?.contains('highlight')) continue;
              const idx = node.textContent.toLowerCase().indexOf(query);
              if (idx >= 0) {
                const mark = document.createElement('mark');
                mark.className = 'highlight';
                const range = document.createRange();
                range.setStart(node, idx);
                range.setEnd(node, idx + query.length);
                range.surroundContents(mark);
              }
            }
          }
        }
      });

      // Show/hide empty state
      const empty = document.querySelector('.search-empty');
      if (empty) empty.style.display = visibleCount === 0 ? 'block' : 'none';
    }, 200);
  });
}
```
```css
mark.highlight {
  background: color-mix(in oklch, var(--accent) 25%, transparent);
  color: inherit; border-radius: 2px; padding: 0 1px;
}
.search-input {
  padding: 12px 16px 12px 44px;
  background: var(--surface) url("data:image/svg+xml,...") 16px center no-repeat;
  border: 1px solid var(--border);
  border-radius: 8px; width: 100%;
  transition: border-color 200ms ease, box-shadow 200ms ease;
}
.search-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in oklch, var(--accent) 15%, transparent);
}
```

### Tag / Category Filter
Clickable filter chips that show/hide items by category with animated transitions.
```javascript
function setupFilters(container, itemsSelector) {
  const filters = container.querySelectorAll('[data-filter]');
  const items = document.querySelectorAll(itemsSelector);

  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state
      filters.forEach(f => f.classList.remove('active'));
      btn.classList.add('active');

      const category = btn.dataset.filter;

      items.forEach(item => {
        const show = category === 'all' || item.dataset.category === category;
        if (show) {
          item.style.display = '';
          requestAnimationFrame(() => {
            item.style.opacity = '1';
            item.style.transform = 'scale(1)';
          });
        } else {
          item.style.opacity = '0';
          item.style.transform = 'scale(0.95)';
          setTimeout(() => item.style.display = 'none', 250);
        }
      });
    });
  });
}
```
```css
.filter-chip {
  padding: 8px 16px; border-radius: 100px;
  background: transparent; border: 1px solid var(--border);
  cursor: pointer; font-size: 0.875rem;
  transition: all 200ms ease;
}
.filter-chip.active {
  background: var(--text); color: var(--bg);
  border-color: var(--text);
}
.filter-chip:hover:not(.active) {
  border-color: var(--text);
}
[data-category] {
  transition: opacity 250ms ease, transform 250ms ease;
}
```

### Sort with Animation
Sort items with CSS-powered position transitions using FLIP technique.
```javascript
function animatedSort(container, compareFn) {
  const items = [...container.children];

  // FIRST: record current positions
  const positions = items.map(el => el.getBoundingClientRect());

  // Sort DOM
  items.sort(compareFn).forEach(el => container.appendChild(el));

  // LAST + INVERT + PLAY
  items.forEach((el, i) => {
    const newPos = el.getBoundingClientRect();
    const dx = positions[i].left - newPos.left;
    const dy = positions[i].top - newPos.top;
    if (dx === 0 && dy === 0) return;

    el.style.transform = `translate(${dx}px, ${dy}px)`;
    el.style.transition = 'none';
    requestAnimationFrame(() => {
      el.style.transition = 'transform 400ms cubic-bezier(0.16, 1, 0.3, 1)';
      el.style.transform = '';
    });
  });
}
```

---

## 2. Data Visualization (No Libraries)

### Animated Bar Chart — Pure CSS + JS
```html
<div class="bar-chart" role="img" aria-label="Monthly revenue chart">
  <div class="bar" style="--value: 72; --i: 0" data-label="Jan" data-value="$72k">
    <span class="bar-fill"></span>
  </div>
  <div class="bar" style="--value: 85; --i: 1" data-label="Feb" data-value="$85k">
    <span class="bar-fill"></span>
  </div>
  <!-- ... -->
</div>
```
```css
.bar-chart {
  display: flex; align-items: flex-end; gap: 8px;
  height: 200px; padding: 0 0 32px;
  border-bottom: 1px solid var(--border);
}
.bar {
  flex: 1; display: flex; flex-direction: column; justify-content: flex-end;
  position: relative; text-align: center;
}
.bar::after {
  content: attr(data-label);
  position: absolute; bottom: -24px; left: 50%;
  transform: translateX(-50%); font-size: 0.75rem;
  color: var(--muted);
}
.bar-fill {
  display: block;
  height: calc(var(--value) * 1%);
  background: var(--accent);
  border-radius: 4px 4px 0 0;
  transform-origin: bottom; transform: scaleY(0);
  animation: grow-bar 600ms var(--ease-out-expo) calc(var(--i) * 80ms) forwards;
}
@keyframes grow-bar {
  to { transform: scaleY(1); }
}
.bar:hover .bar-fill { background: var(--text); }
.bar:hover::before {
  content: attr(data-value);
  position: absolute; top: -28px; left: 50%;
  transform: translateX(-50%);
  font-size: 0.8rem; font-weight: 600;
  background: var(--text); color: var(--bg);
  padding: 4px 8px; border-radius: 4px;
  white-space: nowrap;
}
```

### Donut / Ring Chart — SVG
```html
<svg viewBox="0 0 120 120" class="donut" role="img" aria-label="65% complete">
  <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" stroke-width="12"/>
  <circle cx="60" cy="60" r="50" fill="none" stroke="var(--accent)" stroke-width="12"
    stroke-dasharray="314" stroke-dashoffset="314" stroke-linecap="round"
    class="donut-fill" style="--target: 110">
  </circle>
  <text x="60" y="60" text-anchor="middle" dy="0.35em"
    font-size="24" font-weight="700" fill="var(--text)">65%</text>
</svg>
```
```css
.donut-fill {
  transform: rotate(-90deg); transform-origin: center;
  animation: donut-draw 1s var(--ease-out-expo) 300ms forwards;
}
@keyframes donut-draw {
  to { stroke-dashoffset: var(--target); }
}
```

### Sparkline — Inline Mini Chart
```javascript
function sparkline(canvas, data, color = 'var(--accent)') {
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.offsetWidth * 2;
  const h = canvas.height = canvas.offsetHeight * 2;
  ctx.scale(2, 2);
  const dw = canvas.offsetWidth, dh = canvas.offsetHeight;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const step = dw / (data.length - 1);

  ctx.beginPath();
  data.forEach((v, i) => {
    const x = i * step;
    const y = dh - ((v - min) / range) * (dh - 4) - 2;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Gradient fill
  const last = data.length - 1;
  ctx.lineTo(last * step, dh);
  ctx.lineTo(0, dh);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, 0, 0, dh);
  grad.addColorStop(0, color.replace(')', ', 0.15)').replace('var(', ''));
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fill();
}
```

### Animated Stat Counter with Trend
```html
<div class="stat-card" data-reveal>
  <span class="stat-label">Monthly Revenue</span>
  <span class="stat-value" data-counter data-target="127450" data-prefix="$">$0</span>
  <span class="stat-trend positive">↑ 12.3%</span>
  <canvas class="stat-sparkline" style="width:100%;height:40px"></canvas>
</div>
```

---

## 3. Drag & Drop

### Sortable List
```javascript
function makeSortable(container) {
  let dragging = null;

  container.querySelectorAll('.sortable-item').forEach(item => {
    item.draggable = true;

    item.addEventListener('dragstart', (e) => {
      dragging = item;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      // Ghost opacity
      requestAnimationFrame(() => item.style.opacity = '0.4');
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      item.style.opacity = '';
      dragging = null;
      // Remove all placeholders
      container.querySelectorAll('.drag-placeholder').forEach(p => p.remove());
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (item === dragging) return;
      const rect = item.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (e.clientY < midY) {
        container.insertBefore(dragging, item);
      } else {
        container.insertBefore(dragging, item.nextSibling);
      }
    });
  });
}
```
```css
.sortable-item {
  cursor: grab; padding: 12px 16px;
  border: 1px solid var(--border);
  border-radius: 8px; background: var(--card);
  transition: box-shadow 200ms ease, opacity 200ms ease;
  user-select: none;
}
.sortable-item:active { cursor: grabbing; }
.sortable-item.dragging {
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  z-index: 10;
}
```

### Kanban Board — Column Drag
```javascript
function makeKanban(board) {
  const columns = board.querySelectorAll('.kanban-column');

  columns.forEach(col => {
    const dropzone = col.querySelector('.kanban-cards');

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-over');
      const afterEl = getDragAfterElement(dropzone, e.clientY);
      const dragging = document.querySelector('.dragging');
      if (afterEl) {
        dropzone.insertBefore(dragging, afterEl);
      } else {
        dropzone.appendChild(dragging);
      }
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('drag-over');
    });

    dropzone.addEventListener('drop', () => {
      dropzone.classList.remove('drag-over');
      // Update column counts
      columns.forEach(c => {
        const count = c.querySelectorAll('.kanban-card').length;
        c.querySelector('.column-count').textContent = count;
      });
    });
  });
}

function getDragAfterElement(container, y) {
  const elements = [...container.querySelectorAll('.kanban-card:not(.dragging)')];
  return elements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    }
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}
```
```css
.kanban-cards.drag-over {
  background: color-mix(in oklch, var(--accent) 5%, var(--surface));
  border: 2px dashed var(--accent);
}
```

---

## 4. Forms & Input Interactions

### Multi-Step Form with Progress
```javascript
function multiStepForm(form) {
  const steps = form.querySelectorAll('.form-step');
  const progressDots = form.querySelectorAll('.progress-dot');
  const progressBar = form.querySelector('.progress-fill');
  let current = 0;

  function goTo(index) {
    steps[current].classList.remove('active');
    steps[current].classList.add(index > current ? 'exit-left' : 'exit-right');

    current = index;

    steps[current].classList.remove('exit-left', 'exit-right');
    steps[current].classList.add('active');

    // Update progress
    progressDots.forEach((dot, i) => {
      dot.classList.toggle('completed', i < current);
      dot.classList.toggle('active', i === current);
    });
    if (progressBar) {
      progressBar.style.width = `${(current / (steps.length - 1)) * 100}%`;
    }

    // Focus first input in new step
    const firstInput = steps[current].querySelector('input, select, textarea');
    if (firstInput) setTimeout(() => firstInput.focus(), 350);
  }

  form.querySelectorAll('[data-next]').forEach(btn =>
    btn.addEventListener('click', () => {
      if (current < steps.length - 1) goTo(current + 1);
    })
  );
  form.querySelectorAll('[data-prev]').forEach(btn =>
    btn.addEventListener('click', () => {
      if (current > 0) goTo(current - 1);
    })
  );

  return { goTo, getCurrent: () => current };
}
```
```css
.form-step {
  display: none; opacity: 0;
  transform: translateX(20px);
  transition: opacity 300ms ease, transform 300ms var(--ease-out-expo);
}
.form-step.active {
  display: block; opacity: 1; transform: translateX(0);
}
.form-step.exit-left { transform: translateX(-20px); }
.form-step.exit-right { transform: translateX(20px); }

.progress-bar { height: 4px; background: var(--border); border-radius: 2px; overflow: hidden; }
.progress-fill {
  height: 100%; background: var(--accent); border-radius: 2px;
  transition: width 400ms var(--ease-out-expo);
}
.progress-dot {
  width: 10px; height: 10px; border-radius: 50%;
  border: 2px solid var(--border); background: var(--bg);
  transition: all 200ms ease;
}
.progress-dot.active { border-color: var(--accent); background: var(--accent); }
.progress-dot.completed { border-color: var(--positive); background: var(--positive); }
```

### Floating Label Input
```css
.float-group { position: relative; margin-top: 16px; }
.float-input {
  width: 100%; padding: 20px 16px 8px;
  border: 1px solid var(--border);
  border-radius: 8px; background: var(--surface);
  font-size: 1rem; transition: border-color 200ms ease;
}
.float-label {
  position: absolute; top: 50%; left: 16px;
  transform: translateY(-50%);
  color: var(--muted); font-size: 1rem;
  pointer-events: none;
  transition: all 200ms var(--ease-out-expo);
}
.float-input:focus + .float-label,
.float-input:not(:placeholder-shown) + .float-label {
  top: 10px; transform: translateY(0);
  font-size: 0.75rem; color: var(--accent);
}
.float-input:focus { border-color: var(--accent); }
```

### Password Strength Meter
```javascript
function passwordStrength(input, meterEl) {
  input.addEventListener('input', () => {
    const val = input.value;
    let score = 0;
    if (val.length >= 8) score++;
    if (val.length >= 12) score++;
    if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
    if (/\d/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    const levels = ['', 'weak', 'fair', 'good', 'strong', 'excellent'];
    const colors = ['', 'var(--danger)', 'var(--warning)', 'var(--warning)', 'var(--positive)', 'var(--positive)'];
    meterEl.dataset.level = levels[score] || '';
    meterEl.style.setProperty('--strength', `${score * 20}%`);
    meterEl.style.setProperty('--strength-color', colors[score] || 'var(--border)');
  });
}
```
```css
.password-meter {
  height: 4px; background: var(--border); border-radius: 2px;
  margin-top: 8px; overflow: hidden;
}
.password-meter::after {
  content: ''; display: block; height: 100%;
  width: var(--strength, 0%);
  background: var(--strength-color, var(--border));
  border-radius: 2px;
  transition: width 300ms var(--ease-out-expo), background 300ms ease;
}
```

---

## 5. Image & Media Interactions

### Image Comparison Slider (Before/After)
```javascript
function compareSlider(container) {
  const slider = container.querySelector('.compare-slider');
  const overlay = container.querySelector('.compare-overlay');
  let isDragging = false;

  function setPosition(x) {
    const rect = container.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((x - rect.left) / rect.width) * 100));
    overlay.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    slider.style.left = `${pct}%`;
  }

  container.addEventListener('pointerdown', (e) => {
    isDragging = true;
    container.setPointerCapture(e.pointerId);
    setPosition(e.clientX);
  });
  container.addEventListener('pointermove', (e) => {
    if (isDragging) setPosition(e.clientX);
  });
  container.addEventListener('pointerup', () => isDragging = false);
}
```
```css
.compare-container {
  position: relative; overflow: hidden; cursor: col-resize;
  user-select: none; touch-action: none;
}
.compare-overlay {
  position: absolute; inset: 0;
  clip-path: inset(0 50% 0 0);
}
.compare-slider {
  position: absolute; top: 0; bottom: 0; left: 50%;
  width: 3px; background: white;
  transform: translateX(-50%); z-index: 10;
}
.compare-slider::after {
  content: '⟷'; position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 40px; height: 40px; border-radius: 50%;
  background: white; display: flex;
  align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  font-size: 14px;
}
```

### Lightbox / Image Gallery
```javascript
function lightbox(triggerSelector) {
  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.innerHTML = `
    <button class="lightbox-close" aria-label="Close">×</button>
    <button class="lightbox-prev" aria-label="Previous">‹</button>
    <button class="lightbox-next" aria-label="Next">›</button>
    <img class="lightbox-img" />
    <span class="lightbox-caption"></span>
  `;
  document.body.appendChild(overlay);

  const img = overlay.querySelector('.lightbox-img');
  const caption = overlay.querySelector('.lightbox-caption');
  const triggers = document.querySelectorAll(triggerSelector);
  let currentIndex = 0;

  function show(index) {
    currentIndex = index;
    const trigger = triggers[index];
    img.src = trigger.dataset.full || trigger.src;
    caption.textContent = trigger.alt || '';
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  triggers.forEach((t, i) => t.addEventListener('click', () => show(i)));
  overlay.querySelector('.lightbox-close').addEventListener('click', close);
  overlay.querySelector('.lightbox-prev').addEventListener('click', () =>
    show((currentIndex - 1 + triggers.length) % triggers.length));
  overlay.querySelector('.lightbox-next').addEventListener('click', () =>
    show((currentIndex + 1) % triggers.length));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show((currentIndex - 1 + triggers.length) % triggers.length);
    if (e.key === 'ArrowRight') show((currentIndex + 1) % triggers.length);
  });
}
```
```css
.lightbox-overlay {
  position: fixed; inset: 0; z-index: 10000;
  background: rgba(0,0,0,0.9);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; pointer-events: none;
  transition: opacity 300ms ease;
}
.lightbox-overlay.open { opacity: 1; pointer-events: auto; }
.lightbox-img {
  max-width: 90vw; max-height: 85vh; object-fit: contain;
  transform: scale(0.95); transition: transform 400ms var(--ease-out-expo);
}
.lightbox-overlay.open .lightbox-img { transform: scale(1); }
.lightbox-close {
  position: absolute; top: 16px; right: 16px;
  color: white; font-size: 32px; background: none; border: none;
  cursor: pointer; width: 48px; height: 48px;
}
.lightbox-prev, .lightbox-next {
  position: absolute; top: 50%; transform: translateY(-50%);
  color: white; font-size: 48px; background: none; border: none;
  cursor: pointer; padding: 16px;
}
.lightbox-prev { left: 8px; }
.lightbox-next { right: 8px; }
.lightbox-caption {
  position: absolute; bottom: 24px;
  color: rgba(255,255,255,0.7); font-size: 0.9rem;
}
```

### Carousel / Horizontal Scroll Snap
```html
<div class="carousel">
  <div class="carousel-track">
    <div class="carousel-slide">Slide 1</div>
    <div class="carousel-slide">Slide 2</div>
    <div class="carousel-slide">Slide 3</div>
  </div>
  <div class="carousel-dots"></div>
</div>
```
```css
.carousel-track {
  display: flex; overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none; /* Firefox */
  -webkit-overflow-scrolling: touch;
  gap: 16px; padding: 0 16px;
}
.carousel-track::-webkit-scrollbar { display: none; }
.carousel-slide {
  flex: 0 0 85%; scroll-snap-align: center;
  border-radius: 12px; overflow: hidden;
}
@media (min-width: 768px) { .carousel-slide { flex: 0 0 60%; } }
```
```javascript
function carouselDots(carousel) {
  const track = carousel.querySelector('.carousel-track');
  const slides = carousel.querySelectorAll('.carousel-slide');
  const dotsContainer = carousel.querySelector('.carousel-dots');

  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.ariaLabel = `Go to slide ${i + 1}`;
    dot.addEventListener('click', () => {
      slides[i].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
    dotsContainer.appendChild(dot);
  });

  // Update dots on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const idx = [...slides].indexOf(entry.target);
        dotsContainer.querySelectorAll('.dot').forEach((d, i) =>
          d.classList.toggle('active', i === idx));
      }
    });
  }, { root: track, threshold: 0.6 });
  slides.forEach(s => observer.observe(s));
}
```

---

## 6. Layout Transitions

### Masonry Grid — Dynamic
```javascript
function masonryLayout(container, columnWidth = 280) {
  const items = [...container.children];
  const containerWidth = container.offsetWidth;
  const cols = Math.max(1, Math.floor(containerWidth / columnWidth));
  const gap = parseInt(getComputedStyle(container).gap) || 16;
  const colWidth = (containerWidth - gap * (cols - 1)) / cols;
  const heights = new Array(cols).fill(0);

  container.style.position = 'relative';

  items.forEach(item => {
    const shortest = heights.indexOf(Math.min(...heights));
    const x = shortest * (colWidth + gap);
    const y = heights[shortest];

    item.style.position = 'absolute';
    item.style.width = `${colWidth}px`;
    item.style.transform = `translate(${x}px, ${y}px)`;
    item.style.transition = 'transform 400ms cubic-bezier(0.16, 1, 0.3, 1)';

    heights[shortest] += item.offsetHeight + gap;
  });

  container.style.height = `${Math.max(...heights)}px`;
}

// Recalculate on resize
const resizeObserver = new ResizeObserver(() => masonryLayout(container));
resizeObserver.observe(container);
```

### Theme / Dark Mode Toggle
```javascript
function setupThemeToggle(btn) {
  const root = document.documentElement;
  const stored = localStorage.getItem('theme');
  if (stored) root.dataset.theme = stored;
  else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    root.dataset.theme = 'dark';
  }

  btn.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    localStorage.setItem('theme', next);

    // Animate icon
    btn.querySelector('.theme-icon').style.transition = 'transform 300ms var(--ease-out-expo)';
    btn.querySelector('.theme-icon').style.transform = 'rotate(180deg) scale(0)';
    setTimeout(() => {
      btn.querySelector('.theme-icon').textContent = next === 'dark' ? '☀️' : '🌙';
      btn.querySelector('.theme-icon').style.transform = 'rotate(0) scale(1)';
    }, 150);
  });
}
```
```css
[data-theme="dark"] {
  --bg:      oklch(12% 0.02 260);
  --surface: oklch(16% 0.02 260);
  --card:    oklch(20% 0.02 260);
  --border:  oklch(28% 0.03 260);
  --text:    oklch(93% 0.01 260);
  --muted:   oklch(55% 0.03 260);
}
/* Smooth global transition on theme change */
:root { transition: background-color 300ms ease, color 300ms ease; }
```

### Tabs with Animated Content
```javascript
function animatedTabs(container) {
  const tabs = container.querySelectorAll('[role="tab"]');
  const panels = container.querySelectorAll('[role="tabpanel"]');
  const indicator = container.querySelector('.tab-indicator');

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => { t.ariaSelected = 'false'; t.tabIndex = -1; });
      tab.ariaSelected = 'true'; tab.tabIndex = 0;

      // Move indicator
      indicator.style.left = `${tab.offsetLeft}px`;
      indicator.style.width = `${tab.offsetWidth}px`;

      // Switch panels with crossfade
      panels.forEach(p => {
        p.hidden = true;
        p.style.opacity = '0';
        p.style.transform = 'translateY(8px)';
      });
      panels[i].hidden = false;
      requestAnimationFrame(() => {
        panels[i].style.opacity = '1';
        panels[i].style.transform = 'translateY(0)';
      });
    });
  });

  // Arrow key navigation
  container.querySelector('[role="tablist"]').addEventListener('keydown', (e) => {
    const idx = [...tabs].indexOf(document.activeElement);
    if (e.key === 'ArrowRight') { tabs[(idx + 1) % tabs.length].click(); tabs[(idx + 1) % tabs.length].focus(); }
    if (e.key === 'ArrowLeft') { tabs[(idx - 1 + tabs.length) % tabs.length].click(); tabs[(idx - 1 + tabs.length) % tabs.length].focus(); }
  });
}
```

---

## 7. Real-Time & Live Patterns

### Auto-Updating Clock / Timestamp
```javascript
function liveClock(el, format = 'time') {
  function update() {
    const now = new Date();
    if (format === 'time') {
      el.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } else if (format === 'relative') {
      const diff = Date.now() - parseInt(el.dataset.timestamp);
      const mins = Math.floor(diff / 60000);
      el.textContent = mins < 1 ? 'just now' : mins < 60 ? `${mins}m ago` : `${Math.floor(mins/60)}h ago`;
    }
  }
  update();
  setInterval(update, 1000);
}
```

### Countdown Timer
```javascript
function countdown(el, targetDate) {
  function update() {
    const diff = new Date(targetDate) - Date.now();
    if (diff <= 0) { el.textContent = 'LIVE NOW'; return; }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    el.querySelector('.days').textContent = String(d).padStart(2, '0');
    el.querySelector('.hours').textContent = String(h).padStart(2, '0');
    el.querySelector('.minutes').textContent = String(m).padStart(2, '0');
    el.querySelector('.seconds').textContent = String(s).padStart(2, '0');
  }
  update();
  setInterval(update, 1000);
}
```

### Typing Indicator — Chat Style
```css
.typing-indicator span {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--muted); display: inline-block;
  animation: typing-bounce 1.4s ease-in-out infinite;
}
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-6px); opacity: 1; }
}
```

---

## Picking Patterns by Domain

| Domain | Essential Patterns |
|---|---|
| **Dashboard** | Bar chart, donut, sparkline, counter, live clock, theme toggle, tabs |
| **SaaS Landing** | Scroll reveal, carousel, multi-step form, comparison slider, FAQ accordion |
| **Editorial** | Lightbox, scroll progress, parallax, infinite scroll, share buttons |
| **E-commerce** | Tag filter, sort animation, carousel, image zoom, live search, comparison |
| **Portfolio** | Masonry, lightbox, scroll reveal, smooth page transitions, filter chips |
| **Food** | Lightbox (food gallery), accordion (menu), tag filter, multi-step (ordering) |
| **Fashion** | Carousel, lightbox, image zoom, countdown (drops), masonry, filter |
| **Mobile** | Drawer nav, carousel, multi-step, sortable list, floating label |
| **Education** | Multi-step form, progress bar, sortable (drag quiz), counter, tabs |
| **Creative** | Masonry, lightbox, drag-and-drop, canvas sparkline, theme toggle |

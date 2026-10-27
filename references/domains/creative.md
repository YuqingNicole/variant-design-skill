# Creative Tools & Generative Art Reference

3D parameter controllers, music synthesizers, generative art tools, AI creative interfaces, video/audio editors, live coding environments, digital painting canvases.

> **Design system references for this domain:**
> - `references/design-system/typography.md` — expressive display type, monospace for technical tools
> - `references/design-system/color-and-contrast.md` — high-contrast dark UIs, accent-heavy palettes
> - `references/design-system/spatial-design.md` — canvas layouts, toolbar/panel patterns
> - `references/design-system/motion-design.md` — real-time feedback, parameter change animations
> - `references/design-system/interaction-design.md` — keyboard shortcuts, drag-and-drop, multi-select

## Table of Contents
1. Starter Prompts
2. Color Palettes
3. Typography Pairings
4. Layout Patterns
5. Signature Details

---

## 1. Starter Prompts

Pick one as the content foundation, adapt to user's domain:

**Generative Art / Parameters**
- "A 3D generative art parameter controller: 'tube' shape with sliders (Radius 4.5 / Rows 12.0 / Columns 8.0 / Height 18.06 / XY Exponent 0.84 / Z Exponent 0.68), live wireframe 3D preview on dark right panel, SCROLL TO ROTATE // CLICK TO EXPAND label."
- "A parametric design tool: shape primitives selector, transformation sliders, color mapping controls, export panel."
- "A generative art parameter controller for organic noise fields: seed input, octaves (1–8), frequency (0.01–2.0), amplitude, and a real-time canvas preview rendering a Perlin noise terrain. Dark UI, monospace labels, export to SVG button."

**Music / Audio**
- "A modular synthesizer interface: AETHERIC SYNTH — oscillator controls, filter cutoff, envelope (Attack/Decay/Sustain/Release), LFO, dark with LIVE indicator, neon accent colors."
- "A generative music visualizer: frequency spectrum bars, waveform display, BPM counter, key/scale selector, record button."

**Video / Motion**
- "A video editing timeline UI: multi-track horizontal timeline with color-coded clip blocks (VIDEO / AUDIO / FX), a scrubber with timecode display (00:02:14:08), playhead needle, zoom slider, and a compact properties panel above. Dark UI, teal accent, monospace timecodes."
- "A motion graphics keyframe editor: node-based easing curve editor (bezier handles), property channels listed left (Position X / Position Y / Scale / Opacity / Rotation), keyframe diamonds on a horizontal timeline, with a mini preview thumbnail strip at top. Dark neutral grays, accent lime green."

**Typography / Type Design**
- "A font/type design tool: glyph grid showing A–Z in the current typeface, a large specimen view on the right, spacing metrics (LSB / RSB / Advance Width), kerning pair input, and an OpenType features panel (liga / kern / smcp toggles). Off-white surface, ink-dark text, professional editorial feel."

**Live Coding / Performance**
- "A live coding / livecoding performance tool: full-width code editor on the left (syntax-highlighted Tidal Cycles or SuperCollider), a real-time audio waveform and spectrum analyzer on the right, BPM sync indicator, LIVE badge, and a floating error console at the bottom. Pure dark background, monospace throughout, neon cyan accent."
- "A physical computing IDE in the style of Arduino: code editor panel, serial monitor output, board selector dropdown (Arduino Uno / ESP32 / Raspberry Pi Pico), compile & upload buttons with progress bar, pin mapping diagram sidebar. Dark mode, warm amber accent for active states."

**Digital Painting**
- "A digital art canvas interface in the style of Procreate: full-bleed canvas center, floating left toolbar (brush / eraser / smudge / selection), layers panel on the right with thumbnails and blend mode dropdowns (Multiply / Screen / Overlay), color wheel in a compact floating palette, undo/redo history scrubber at the top. Clean white studio background, minimal chrome."

---

## 2. Color Palettes

### Dark Lab (generative/technical)
```
--bg:        #0A0A0F
--surface:   #12121A
--card:      #1A1A28
--border:    #2A2A40
--text:      #E8E8FF
--muted:     #6060A0
--accent:    #6C63FF   /* violet */
--accent-2:  #00FFB2
--live:      #FF3A6E
```

### Synth Neon
```
--bg:        #0D0D0D
--surface:   #1A1A1A
--card:      #242424
--border:    #333333
--text:      #FFFFFF
--muted:     #666666
--accent:    #FF2D78   /* hot pink */
--accent-2:  #00E5FF
--accent-3:  #7FFF00
```

### Vapor Wave (retro-futurist purple/pink/teal)
```
--bg:        #0E0818
--surface:   #170D2A
--card:      #211240
--border:    #3D2060
--text:      #F0E6FF
--muted:     #8060AA
--accent:    #C77DFF   /* soft purple */
--accent-2:  #FF79C6
```

### Pro Tools Dark (professional audio, neutral)
```
--bg:        #111111
--surface:   #1C1C1C
--card:      #262626
--border:    #383838
--text:      #D4D4D4
--muted:     #707070
--accent:    #4FC3F7   /* steel blue */
--accent-2:  #80CBC4
```

### Canvas White (bright studio, digital painting)
```
--bg:        #F5F5F0
--surface:   #FFFFFF
--card:      #FFFFFF
--border:    #E0DDD8
--text:      #1A1A1A
--muted:     #888880
--accent:    #2563EB   /* cobalt blue */
--accent-2:  #E11D48
```

---

## 3. Typography Pairings

| Display (headings / labels) | Body (descriptions / output) | Feel |
|---|---|---|
| `Space Mono` | `DM Sans` | Retro-technical, hacker tool |
| `JetBrains Mono` | `IBM Plex Sans` | Developer-grade, IDE-native |
| `Fira Code` | `Fira Sans` | Unified family, coding-forward |
| `Syne` | `DM Mono` | Geometric editorial meets terminal |
| `Archivo Black` | `Fragment Mono` | Bold display, monospace detail |
| `Unbounded` | `IBM Plex Mono` | Wide caps, pure code feel |

**Rule:** Creative tool UIs: UI labels in monospace or geometric sans; canvas/output area can be any weight. Large parameter values always in tabular-nums monospace. Button labels in uppercase tracked caps.

---

## 4. Layout Patterns

### Pattern A: Parameter Controller (split panel)
```
┌─────────────────────┬───────────────────┐
│  SHAPE: tube        │                   │
│  ─────────────────  │   [3D PREVIEW]    │
│  VORTEX SHAPE  0.0  │   wireframe mesh  │
│  SHOW PARAMS   1.0  │   on dark bg      │
│  PHOTO RES  1000.0  │                   │
│  ANIM STIFF   0.03  │   DEC: -46° 30'   │
│  ─────────────────  │   RA: 10h 47s     │
│  Radius        4.5  │   MAG: 18.5       │
│  Rows         12.0  │                   │
├─────────────────────┴───────────────────┤
│  PARAMETERS      SHAPE                  │
│  DENSITY ────●──────────  40            │
│  VELOCITY ──────●───────  0.4           │
│  EDIT | CODE | VIEW | SHARE             │
└─────────────────────────────────────────┘
```

### Pattern B: Timeline / Keyframe Editor (horizontal, bottom panel)
```
┌─────────────────────────────────────────┐
│  [PREVIEW]  00:02:14:08  ▶  ⏹  ◀◀  ▶▶  │  <- transport bar
├─────────────────────────────────────────┤
│  [CANVAS / VIEWER — main output area]   │
│                                         │
├──────────┬──────────────────────────────┤
│ TRACKS   │  TIMELINE  (zoomable)        │
│ VIDEO  > │  ##...[CLIP A]...[CLIP B]... │
│ AUDIO  > │  ...[~~~~waveform~~~~]...... │
│ FX     > │  ......[*].....[*].......... │  <- keyframes
│          │  ─────────────│─────────────  │  <- playhead
└──────────┴──────────────────────────────┘
```

### Pattern C: Layer Panel + Canvas (Figma / Photoshop-style)
```
┌──────┬────────────────────────┬─────────┐
│Layers│                        │Properties
│──────│    [CANVAS — main]     │─────────│
│ # bg │                        │ W: 1920 │
│ # fx │   artwork / output     │ H: 1080 │
│ # txt│   centered, zoomable   │ X: 0    │
│ # ref│                        │ Y: 0    │
│ + .. │                        │─────────│
│      │                        │Blend:   │
│TOOLS │                        │Multiply │
│      │                        │Opacity: │
│      │                        │  87%    │
└──────┴────────────────────────┴─────────┘
```

### Pattern D: Performance / Live Coding (full-screen, floating controls)
```
┌─────────────────────────────────────────┐
│  * LIVE   BPM: 120   KEY: Dm  00:12:44  │  <- floating top bar
│─────────────────────────────────────────│
│                                         │
│   [FULL-SCREEN CODE EDITOR / CANVAS]    │
│                                         │
│   code / visuals / output               │
│   fills entire viewport                 │
│                                         │
│─────────────────────────────────────────│
│  ┌──────────────┐  ┌────────────────┐  │
│  │ WAVEFORM ~~~ │  │ SPECTRUM ||||  │  │  <- floating panels
│  └──────────────┘  └────────────────┘  │
│  [EVAL]  [MUTE]  [RECORD]  [CLEAR]     │  <- floating controls
└─────────────────────────────────────────┘
```

---

## 5. Signature Details

- **Parameter sliders**: labeled left, value right, thin track with circle thumb
- **LIVE badge**: pulsing red dot + "LIVE" text
- **Mode tabs**: EDIT | CODE | VIEW | SHARE at bottom
- **3D canvas**: dark bg, thin wireframe lines in accent color, axis indicators
- **Keyboard shortcut hints**: "SCROLL TO ROTATE // CLICK TO EXPAND" in tiny muted text
- **Export row**: icon buttons for different output formats

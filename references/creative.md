# Creative Tools & Generative Art Reference

3D parameter controllers, music synthesizers, generative art tools, AI creative interfaces.

## 1. Starter Prompts
- "A 3D generative art parameter controller: 'tube' shape with sliders (Radius 4.5 / Rows 12.0 / Columns 8.0 / Height 18.06 / XY Exponent 0.84 / Z Exponent 0.68), live wireframe 3D preview on dark right panel, SCROLL TO ROTATE // CLICK TO EXPAND label."
- "A modular synthesizer interface: AETHERIC SYNTH — oscillator controls, filter cutoff, envelope (Attack/Decay/Sustain/Release), LFO, dark with LIVE indicator, neon accent colors."
- "A generative music visualizer: frequency spectrum bars, waveform display, BPM counter, key/scale selector, record button."
- "An AI image prompt builder: style selectors (photorealistic/illustration/3D), mood tags, composition picker, seed number input, generation history."
- "A parametric design tool: shape primitives selector, transformation sliders, color mapping controls, export panel."

## 2. Color Palettes

### Dark Lab (generative/technical)
```
--bg: #0A0A0F  --surface: #12121A  --card: #1A1A28
--accent: #6C63FF  --accent-2: #00FFB2  --text: #E8E8FF
--muted: #6060A0  --live: #FF3A6E
```
### Synth Neon
```
--bg: #0D0D0D  --surface: #1A1A1A
--accent: #FF2D78  --accent-2: #00E5FF  --accent-3: #7FFF00
--text: #FFFFFF  --muted: #666666
```

## 3. Layout Patterns

### Parameter Controller (split panel)
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

## 4. Signature Details
- **Parameter sliders**: labeled left, value right, thin track with circle thumb
- **LIVE badge**: pulsing red dot + "LIVE" text
- **Mode tabs**: EDIT | CODE | VIEW | SHARE at bottom
- **3D canvas**: dark bg, thin wireframe lines in accent color, axis indicators
- **Keyboard shortcut hints**: "SCROLL TO ROTATE // CLICK TO EXPAND" in tiny muted text
- **Export row**: icon buttons for different output formats

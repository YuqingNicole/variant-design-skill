# Mobile App Reference

iOS/Android app screens, onboarding flows, home screens, astronomy/science mobile apps.

## 1. Starter Prompts
- "A sky observation mobile app: 'Current visibility is optimal. The Lyrid meteor shower is entering peak activity in the northern hemisphere. Look toward constellation Lyra.' — dark star field, Observation Log + Sky Map dual panel."
- "A meditation app home screen: daily session recommendation, streak counter, energy/mood tracker, soft gradient background."
- "A finance mobile app: net worth hero number, portfolio donut chart, recent transactions list, bottom tab nav."
- "A social feed mobile app: stories row, post cards with avatar/image/actions, floating compose button."
- "A health tracker: daily ring completion (Move/Exercise/Stand), heart rate graph, sleep summary, activity timeline."

## 2. Color Palettes

### Night Sky (astronomy)
```
--bg: #050A18  --surface: #0D1525  --card: #131E35
--accent: #4A9EFF  --accent-2: #A78BFA  --text: #E8F0FF
--muted: #4A5A7A  --star: #FFFFFF
```
### Wellness Soft
```
--bg: #F8F5F2  --surface: #FFFFFF  --accent: #7C6BC4
--text: #2D2840  --muted: #9B8FA8  --positive: #4CAF7D
```

## 3. Layout Patterns

### Astronomy App (dual panel)
```
┌─────────────────────────┐
│ ◀  Observation Log      │  ← header with back
├─────────────────────────┤
│ [STAR MAP — dark bg]    │
│   constellation lines   │
│   labeled stars         │
├─────────────────────────┤
│ Current visibility:     │
│ optimal                 │
│ ─────────────────────   │
│ The Lyrid meteor shower │
│ is entering peak...     │
├─────────────────────────┤
│ Log Entry  •  3 Hrs Ago │
│ Sky Map    •  Loading   │
└─────────────────────────┘
```

## 4. Signature Details
- **Status bar**: time left, battery, signal — always present on mobile
- **Bottom tab bar**: 4-5 icons, active state in accent color
- **Safe area**: respect notch/home indicator spacing
- **Card radius**: 16-20px on mobile (larger than desktop)
- **Touch targets**: minimum 44px height for all interactive elements
- **Haptic hint text**: "Tap to expand" / "Swipe to dismiss" in tiny muted
- **Pull-to-refresh indicator** at top of scroll views

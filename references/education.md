# Education & Learning Apps Reference

Language learning, science education, quiz/flashcard apps, tutoring interfaces.

## 1. Starter Prompts
- "A French sentence translation exercise: 'TRANSLATE THIS SENTENCE: The museum is closed on Mondays.' — Le musée / fermé / lundi word chips, CHECK ANSWER button, green accent background."
- "A Japanese-English language app: bilingual side-by-side layout, Japanese large on left, English translation right, furigana support, vocabulary drill flow."
- "A planetary science database: Mars element table (Overview/Aphelion/Mass/Gravity/Orbital Period), red/orange dominant, encyclopedia-style card."
- "A math problem-solving app: step-by-step equation reveal, hint system, progress bar, worked example toggle."
- "A vocabulary flashcard app: word front/back flip, difficulty rating (Easy/Hard/Again), session streak, spaced repetition progress."
- "A coding tutorial interface: lesson outline sidebar, live code editor, output panel, concept explanation tooltip."

## 2. Color Palettes

### French Green (language learning)
```
--bg: #16A34A  --card: #FAFAF9  --accent: #FDE047
--text-on-bg: #FAFAF9  --text-on-card: #1C1C1C
--correct: #22C55E  --wrong: #EF4444
```
### Academic Dark (science/reference)
```
--bg: #1A0A00  --surface: #7B1E1E  --card: #FDF5E6
--accent: #E55A00  --text: #1A0A00
```
### Study Light (general education)
```
--bg: #F0F9FF  --card: #FFFFFF  --accent: #0EA5E9
--text: #0C4A6E  --correct: #16A34A  --wrong: #DC2626
```

## 3. Layout Patterns

### Translation Exercise
```
┌──────────────────────────────────┐
│  TRANSLATE THIS SENTENCE         │
│  ─────────────────────────────  │
│  "The museum is closed on        │
│   Mondays."                      │
├──────────────────────────────────┤
│  [Le musée] [fermé] [lundi]      │  ← word chips
│  [le] [est] [fermé] [lundi]      │
├──────────────────────────────────┤
│  YOUR TRANSLATION:               │
│  [________________]              │
│  [CHECK ANSWER]                  │
└──────────────────────────────────┘
```

## 4. Signature Details
- **Word chips**: rounded pill buttons, drag-to-arrange
- **CHECK ANSWER** CTA: full-width, high contrast
- **Progress bar**: lesson completion at top
- **Streak counter**: 🔥 12 days (emoji ok in educational context)
- **Correct/wrong flash**: green overlay vs red shake animation
- **Bilingual layout**: language A large left, language B smaller right

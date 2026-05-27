# UX Research Methods Reference

Distilled from Nielsen Norman Group research on user research, usability testing, and evidence-based design. Use when evaluating designs, planning research, or interpreting user feedback.

---

## The UX Research Landscape

Two axes define every research method:

**Attitudinal vs. Behavioral:**
- **Attitudinal** — What people *say* (surveys, interviews, focus groups)
- **Behavioral** — What people *do* (usability testing, analytics, A/B tests)

**Rule:** What users say and what users do are often different. Behavioral methods are more reliable for predicting actual usage. Attitudinal methods reveal motivation and mental models.

**Qualitative vs. Quantitative:**
- **Qualitative** — Why? (usability testing, interviews, contextual inquiry)
- **Quantitative** — How many? How often? (surveys, analytics, A/B tests)

**The combination:** Qual tells you what's wrong and why. Quant tells you how widespread it is.

---

## Usability Testing

The most impactful UX research method. Watch real users attempt real tasks with your product.

### Core Principle

You are not testing the user. You are testing the design. If the user fails, the design failed.

### When to Use

- Before launch to catch critical problems
- After redesign to verify improvement
- When user complaints spike around specific features
- Whenever you have a design decision you can't make with existing data

### Sample Size

**Qualitative testing:** 5 participants reveal ~85% of usability problems (Nielsen's finding). 3 rounds of 5 = more insight than 1 round of 15.

**Quantitative testing (measuring task success rates):** Minimum 20 participants per condition for statistically meaningful results.

### Test Protocol

**Before the session:**
1. Define 3–5 tasks to test (the most important things users need to do)
2. Write tasks as realistic scenarios, not instructions
3. Prepare a quiet environment, recording setup, observation room or remote tool
4. Recruit representative users (not colleagues, friends, or power users if testing for general audience)

**Writing good tasks:**
```
Bad (instruction, not scenario):
"Find the settings and change your notification preferences."
→ Tells the user where to go (settings) and what to do (notifications)

Good (scenario, not instruction):
"You've been getting too many emails from us. You'd like to turn off the daily 
digest. Please do that."
→ Realistic situation, goal-oriented, doesn't reveal the path
```

**During the session:**
- Ask users to think aloud ("tell me what you're thinking as you go")
- Observe — don't help. Silence is data.
- When user is stuck, ask "what would you expect to happen here?" before explaining
- Note hesitations, re-reads, wrong paths, expressions of confusion or frustration

**After the session:**
- Debrief with observer team immediately (memory fades fast)
- Identify: what tasks failed? where did users hesitate? what surprised them?
- Rank issues by frequency × severity

### Facilitator Rules

| Do | Don't |
|---|---|
| Use their language ("what do you call this?") | Use your vocabulary for features |
| Stay neutral ("I see") | React emotionally to errors ("That's okay!") |
| Ask follow-up probes | Lead the user ("Did you notice the button?") |
| Let them struggle | Help when they're stuck |
| Debrief after each session | Wait until all sessions are done to analyze |

### Remote vs. In-Person

| Aspect | Remote | In-Person |
|---|---|---|
| Setup cost | Low (screen share tool) | High (lab, travel) |
| Geographic reach | High | Low |
| Nonverbal cues | Limited | Full |
| Natural environment | Yes (user's real setup) | No |
| Technical issues | Higher risk | Lower |
| Participant pool | Broader | Local |

**Recommendation:** Remote unmoderated for quick validation; in-person moderated for complex flows or when body language matters.

---

## User Interviews

One-on-one conversations to understand user goals, mental models, workflows, and pain points.

### When Interviews Beat Surveys

- You don't know what questions to ask yet
- You need to understand *why*, not just *how many*
- You're exploring a new problem space
- You need to understand the context around behavior (not just the behavior)

### Interview Structure

**Opening (5 min):** Explain purpose, recording consent, ground rules ("there are no wrong answers").

**Warm-up (5 min):** Broad questions about their role and context. Puts them at ease.

**Core questions (30–45 min):** Target 5–8 main questions. Leave room for follow-up.

**Closing (5 min):** "Is there anything else I should have asked?" Thank them.

### Question Types

**Good question patterns:**
```
Open: "Tell me about the last time you [did the task]."
Behavioral: "Walk me through what you did step by step."
Comparative: "How does this compare to how you used to do it?"
Follow-up: "Can you tell me more about that?" / "What did you mean by X?"
Silence: [pause and wait — users fill silence with useful detail]
```

**Bad question patterns:**
```
Leading: "Don't you find the checkout confusing?" → suggests the answer
Hypothetical: "Would you use a feature like X?" → people say yes to hypotheticals
Double-barreled: "Was it fast and easy?" → can't separate the two
Yes/no: "Did you like it?" → get richer data from "Tell me about your experience with it"
```

### Affinity Diagramming (Synthesizing Interviews)

After 5+ interviews, cluster findings:
1. Write each observation/quote on a sticky note (one per note)
2. Group related notes together (don't use predetermined categories)
3. Name each cluster (use the users' language, not yours)
4. Patterns that appear across 3+ users are significant

---

## Surveys

Quantitative method for measuring attitudes, satisfaction, or behavior at scale.

### When Surveys Work

- Measuring satisfaction scores (NPS, CSAT, SUS) over time
- Validating findings from qualitative research
- Reaching users who can't participate in live sessions
- Tracking changes after a design update

### Survey Design Rules

**Keep it short:** Completion rate drops sharply after 10 minutes / 15 questions. Every question must earn its place.

**Question order:** Easy and engaging questions first. Sensitive (age, salary, demographics) last. Related questions grouped together.

**Scales:** Use consistent scales throughout. 5-point or 7-point Likert. Define endpoints clearly.

**Avoid:**
- Double negatives ("I don't find the interface unclear")
- Loaded language ("How much do you enjoy the delightful new design?")
- Recall bias ("How many times per week do you use X?" — they'll guess)
- Agreement bias (most people agree with statements — use forced-choice or bipolar scales instead)

### System Usability Scale (SUS)

The industry standard 10-question usability questionnaire. Produces a score 0–100.

**Scoring above 68 = above average usability.**

| Score range | Grade | Adjective |
|---|---|---|
| 84.1–100 | A+ | Excellent |
| 80.8–84.0 | A | Excellent |
| 78.9–80.7 | A- | Excellent |
| 72.6–78.8 | B | Good |
| 71.1–72.5 | B- | Good |
| 65.0–71.0 | C | OK |
| 62.7–64.9 | C- | OK |
| 51.7–62.6 | D | Poor |
| < 51.7 | F | Awful |

**When to use SUS:** Benchmarking; comparing before/after redesign; comparing against competitors.

### Net Promoter Score (NPS)

"How likely are you to recommend [product] to a friend or colleague?" (0–10)

- 9–10 = Promoters
- 7–8 = Passives
- 0–6 = Detractors
- NPS = % Promoters − % Detractors

**NPS limitations:** Doesn't tell you *why*. Always follow up with an open-text question. Varies by industry (SaaS B2B NPS ≠ Consumer app NPS).

---

## A/B Testing

Compare two versions of a design to measure which performs better on a specific metric.

### When A/B Testing Works

- You have enough traffic (minimum ~1000 conversions per variant per week)
- You have a clear metric (conversion rate, click-through, task completion)
- You have one specific hypothesis to test
- The change is meaningful enough to move the metric

### When A/B Testing Fails

- Testing too many variables at once (can't attribute the difference)
- Stopping too early (false positives from peeking at data)
- Optimizing a local metric that hurts the overall goal (CTR up, satisfaction down)
- Using it to answer "why" (it only answers "which performs better")

### Statistical Significance

Run tests until you reach 95% confidence (p < 0.05) — not until you like the results. Use a sample size calculator before starting.

**Common mistake:** Stopping the test as soon as results look good. This inflates false positive rates. Pre-commit to a stopping rule.

---

## Analytics as a Research Tool

Behavioral data at scale. Tells you *what* is happening; needs qualitative research to explain *why*.

### Key Metrics for UX Research

**Task completion rate:** % of users who complete a defined task. The primary usability metric.

**Time on task:** How long it takes to complete a task. Faster = better (for efficiency tasks). Sometimes slower = more engaged (for content).

**Error rate:** How often users make mistakes. Spikes indicate specific problem areas.

**Drop-off / funnel analysis:** Where users abandon multi-step flows. The step with the highest drop-off is the highest-priority UX problem.

**Rage clicks / dead clicks:** Clicks on elements that don't respond. Strong signal of unmet affordances (users think something is clickable but it isn't).

**Heatmaps and session recordings:** Show where users click, scroll, and spend time. Reveal UI elements that are ignored (bad placement, poor information scent) and elements that attract unexpected attention.

### Analytics Anti-Patterns

| Anti-pattern | Problem |
|---|---|
| Optimizing for pageviews | Pageviews ≠ value delivered |
| Ignoring qualitative signals | Why is bounce rate high? Analytics won't tell you |
| Survivorship bias | Analytics only shows users who stayed — not those who left |
| HiPPO decisions | "Highest Paid Person's Opinion" overrides data |
| Vanity metrics | Large numbers that don't predict business outcomes |

---

## Contextual Inquiry

Observing users in their natural environment while they perform real tasks. The most ecologically valid research method.

**When to use:** When you need to understand the context around a task (the environment, interruptions, tools used alongside, workarounds people have developed).

**Format:** Researcher acts as an apprentice to the user — "teach me how you do this." User performs real work; researcher observes and asks questions in context ("I noticed you opened Excel here — why?").

**Key benefit:** Reveals workarounds and shadow tools that users never mention in interviews because they've normalized them.

---

## Choosing the Right Method

| Question you're asking | Best method |
|---|---|
| Can users complete this task? | Usability testing |
| Why are users abandoning this flow? | Usability testing + session recordings |
| What do users think about X? | User interviews |
| How satisfied are users? | Survey (NPS/CSAT/SUS) |
| Which version performs better? | A/B test |
| How do users do this task today? | Contextual inquiry |
| How should we organize this content? | Card sorting + tree testing |
| Where are users struggling? | Funnel analytics + rage click analysis |
| What should we build next? | Interviews + surveys |

---

## Research Planning

### Research Plan Template

Before any research activity, align on:

1. **Research questions** — What decisions will this research inform? (Not "what should we learn?" but "what do we need to know to decide X?")
2. **Method** — Which method answers these questions best, given time and resources?
3. **Participants** — Who are the right users? How many? How will you recruit them?
4. **Stimuli** — What will participants interact with? (Live product, prototype, mockup, description?)
5. **Analysis plan** — How will you synthesize findings? Who will be in the room?
6. **Output** — What will you deliver? Who needs to read it? By when?

### Research Repository

Store findings where the team can access and build on them:
- Raw recordings / notes → searchable archive
- Key insights → tagged by theme and product area
- Unresolved questions → input for future research

**Anti-pattern:** Research that lives in one person's folder and is never referenced again.

---

## Communicating Research Findings

### What Makes Findings Land

**Lead with the user's perspective, not the researcher's observation:**
```
Weak: "We observed that users often failed to find the filter button."
Strong: "Users expected filters to be at the top of the list, not in the sidebar.
         5 out of 6 participants looked at the top first and expressed confusion."
```

**Tie findings to decisions:**
```
Weak: "Users had trouble with navigation."
Strong: "3 of 5 users couldn't find the billing section, which is the #2 support 
         request. Moving it to the primary nav would reduce support volume."
```

**Show, don't just tell:** Video clips of users struggling are more persuasive than summaries.

### Sharing Research Across the Organization

- **Readout meeting** — Live synthesis session with design, product, engineering
- **Top findings document** — 1 page, 5 findings, each with evidence + recommendation
- **Research repository** — For cross-team discovery and longitudinal trend analysis
- **"Research snacks"** — Short (5-min) video clips shared in team channels, no meeting required

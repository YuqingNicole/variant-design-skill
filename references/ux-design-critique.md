# UX Design Critique Reference

How to give and receive design feedback that improves work without devolving into taste arguments or hierarchy-driven decisions. Based on design critique culture at Google, IDEO, and foundational design education principles.

---

## What Design Critique Is (and Isn't)

**Critique is:** Structured analysis of a design against stated goals, with the intent of improving the work.

**Critique is not:**
- A vote on whether you personally like it
- A status meeting ("here's what I did")
- A brainstorm ("what if we tried...")
- A presentation for approval
- An opportunity for the most senior person to redirect the work

**The goal of critique:** Improve the design. Not validate it, not replace it, not prove the designer wrong.

---

## The Critique Framework

### Before the Session

**Presenter's job:** Define the context before showing the work.

```
1. What problem are we solving?
   "We're redesigning the checkout flow because 68% of users drop off at the
   payment step."

2. Who is the user?
   "First-time buyers on mobile, mid-30s, low trust in new brands."

3. What stage is this?
   "Early concept — I want feedback on the flow, not the visual polish."

4. What specific feedback do you need?
   "I want to know: does the trust-building approach make sense? Are there
   steps I should remove or reorder?"
```

**Why this matters:** Without context, feedback is generic ("make it cleaner") or solves the wrong problem ("add a phone number field" when the problem is trust, not information collection).

### During the Session

**Observers' job:** Ask questions before giving feedback.

```
Question before feedback:
"What were you trying to accomplish with putting the security badges here?"
→ Reveals the designer's intent
→ May change your feedback once you understand why

Not:
"The security badges look out of place."
→ Judgment before understanding
```

**The feedback formula:**

```
[Observation] + [Inference] + [Question or Suggestion]

"I notice the back button isn't visible on this screen [observation].
I'm wondering if users who change their mind mid-checkout will be confused
about how to exit [inference].
What's the intended behavior when a user wants to go back? [question]"

Not:
"Add a back button." [directive without understanding]
Not:
"I don't like it." [no observation or inference]
```

---

## Types of Feedback

### Level 1: Clarifying Questions
"Help me understand..." — Not feedback yet. Builds context before evaluating.
- "What happens when the user is on a slow connection here?"
- "Is this the first time they've seen this screen, or returning?"

### Level 2: Observation
Describing what you see, without evaluation.
- "I notice there are three primary buttons in this screen."
- "The copy here uses second person but everywhere else is third person."

### Level 3: Impact Assessment
Connecting the observation to user behavior or business outcomes.
- "Three primary buttons may create decision paralysis — users may not know where to start."
- "The inconsistent voice might confuse users who read both screens in sequence."

### Level 4: Suggestion
Specific ideas for addressing the issue. Should come after levels 1–3, not before.
- "Could we reduce to one primary CTA and move the other two to a secondary tier?"
- "Worth standardizing to second person throughout — it fits the conversational tone you've established."

**Good critique sessions move through these levels.** Bad critique sessions jump to level 4 immediately.

---

## Avoiding Common Critique Failures

### The Taste Trap

Feedback based on personal aesthetic preference, not user goals or design principles.

```
Taste feedback (not useful):
"I like it more rounded."
"I prefer darker backgrounds."
"This feels too modern."

Principle-based feedback (useful):
"The sharp corners feel out of character with the friendly tone we've established
in the onboarding copy — worth checking if they're consistent with our design
system's radius tokens."
```

**Test:** Can you replace "I" with "Users will" and have the sentence still be meaningful? If yes, it's useful. If it becomes nonsense, it's taste.

### HiPPO Problem (Highest Paid Person's Opinion)

Senior stakeholders' opinions get treated as requirements. The HIPPO says "make it blue" and the design becomes blue, without discussion.

**Defense:**
- Reframe opinions as hypotheses: "That's interesting — let's test whether users respond better to blue."
- Anchor feedback to the stated goals: "How does that change help with the drop-off problem we defined?"
- Separate style preferences from functional concerns: "Is that a direction you think we should explore, or a constraint?"

### The Scope Creep Critique

Feedback that adds features rather than improving the design.

```
Scope creep: "We should also add a wishlist here."
Better: "Does this design address the use case of users who aren't ready to buy?"
→ Separates the observation from the specific solution
```

**Response:** "That's a valid use case. Let me note it. For today's session, I'm focused on the checkout flow — can we bring this to the next roadmap conversation?"

### "Fix It" Without Explanation

Directive feedback without rationale.

```
Not useful: "Change the font."
Useful: "The font feels inconsistent with the UI kit — is this intentional
         differentiation or did it come in from the mockup?"
```

### Groupthink / Consensus Pressure

Critique shouldn't converge on consensus. Different perspectives are the point.

**Signs of groupthink in critique:**
- Everyone agrees with the first person who spoke
- No one mentions the same problem the last presenter had (it's been "fixed" by social dynamics)
- Silence = approval (it often means "I didn't say anything and now it's too late")

**Prevention:** Gather written feedback before the verbal session. Everyone writes independently first, then discusses.

---

## Critique Meeting Structure

### Standard Format (60 minutes)

| Phase | Time | Who |
|---|---|---|
| Context setting | 5 min | Presenter |
| Silent review + written notes | 10 min | All observers |
| Clarifying questions only | 10 min | Observers → Presenter |
| Feedback: critical issues | 15 min | All (observations + impact) |
| Feedback: opportunities | 10 min | All |
| Synthesis: what we heard | 5 min | Presenter reads back |
| Next steps | 5 min | All |

### Silent Review (the Most Underused Practice)

Before verbal discussion: everyone writes their observations independently. Prevents:
- Anchoring bias (first person's opinion influences everyone)
- Dominance by the loudest voice
- Implicit pressure to agree with senior people

Tools: sticky notes, shared Figma comment, collaborative doc.

### The Presenter's Notes

Presenter should take notes throughout, not defend in the moment.

```
❌ Defending: "Actually, we tested that and it works fine."
✓ Noting: "Let me note that as a question — I'll check the test results."
```

Defending shuts down critique. Note everything; evaluate later.

---

## Written Design Critique (Async)

When synchronous critique isn't possible, structure async feedback:

**Async comment formula:**
```
[Screen / component]: [specific element]
Observation: What I see
Impact: What I think it means for users
Question/Suggestion: What I'd explore
Priority: P1 (blocks progress) / P2 (important) / P3 (minor)
```

**Example:**
```
[Checkout screen]: Promo code field
Observation: Promo code input is placed prominently above the payment button
Impact: Research shows visible promo code fields cause users without codes to
        leave and search for one, increasing abandonment
Question: Can we move this to an expandable section ("Have a promo code?") 
          to reduce the pattern's salience?
Priority: P2
```

---

## Design Critique vs. Design Review

| Critique | Review |
|---|---|
| Goal: improve the work | Goal: approve or reject |
| Happens early and often | Happens before handoff |
| Participants: designers, cross-functional | Participants: stakeholders, PMs, legal |
| Output: list of changes to explore | Output: go/no-go decision |
| No hierarchy in feedback | Decision authority matters |

Both are necessary. Conflating them creates bad outcomes:
- Critique in a review setting → too late to change anything
- Review in a critique setting → premature closure, underdeveloped work

---

## Self-Critique: Evaluating Your Own Work

Before bringing work to critique, run these questions:

**Against goals:**
- Does this solve the stated problem?
- Have I validated any assumptions about user behavior?
- What would need to be true for this to fail?

**Against principles:**
- Does this follow established patterns or intentionally break them?
- Where might users be confused?
- What's the worst-case user scenario?

**Against constraints:**
- Is this achievable within the technical constraints?
- Does it fit within the existing design system?
- What are the edge cases I haven't designed?

**Devil's advocate:**
- What would my harshest critic say about this?
- What am I most uncertain about?
- What did I decide not to show and why?

Presenting these questions openly in critique invites honest feedback. "I'm not sure about the tab pattern here — it might be confusing" signals that feedback is welcome and surfaces the actual uncertainty.

---

## Design Critique Checklist

**Before the session:**
- [ ] Defined the problem being solved
- [ ] Stated the user and their context
- [ ] Named the design stage (concept / detailed / ready for dev)
- [ ] Listed specific questions for feedback

**During the session:**
- [ ] Questions asked before feedback given
- [ ] Feedback tied to user goals, not personal preference
- [ ] Silent review before verbal discussion
- [ ] Presenter taking notes, not defending

**After the session:**
- [ ] Presenter synthesizes what they heard
- [ ] Feedback triaged: act on / explore / decline
- [ ] Declined feedback has rationale documented
- [ ] Next critique scheduled with clear design question

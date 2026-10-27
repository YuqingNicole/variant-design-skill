# UX Psychology Reference

Cognitive and perceptual principles that explain how users see, process, and remember interfaces. Distilled from Nielsen Norman Group research and foundational design psychology.

---

## Mental Models

### What They Are
A mental model is a user's internal representation of how something works — built from past experience, not from reading manuals. Users approach every interface with an existing model of how "things like this" work.

**Key insight:** Mental models are always incomplete, inaccurate to some degree, and highly personal. Two users looking at the same interface have different mental models.

### Why They Matter
When the interface matches the user's mental model → interaction feels effortless.
When they don't match → confusion, errors, and abandonment.

### Common Mismatches

| User's mental model | System's actual behavior | Result |
|---------------------|--------------------------|--------|
| "Closing the app pauses my task" | Closing deletes unsaved state | Data loss |
| "Back button undoes my last action" | Back navigates to previous page | User lost in history |
| "Search searches everything" | Search only searches names | Users miss results |
| "Draft saves automatically" | Draft only saves on explicit save | Lost work |

### Design Strategies

**Match the model:**
- Use real-world metaphors that invoke existing models (trash = reversible delete, shopping cart = holds items until checkout)
- Follow platform conventions so your app behaves like the apps users already know

**Correct the model:**
- Explain unexpected behavior at the moment it matters (not in onboarding)
- Use progressive disclosure to reveal complexity after basic model is established
- Provide immediate feedback when the system behaves differently than expected

**Test the model:**
- Ask users "what do you think will happen when you click this?" before they click
- Divergence between their answer and actual behavior = model mismatch

### The Gulf of Evaluation and Execution (Norman's Model)

**Gulf of Execution:** Can the user figure out how to do what they want?
- Visible affordances, clear labels, recognizable controls

**Gulf of Evaluation:** Can the user tell whether their action succeeded?
- Clear feedback, visible state changes, system status indicators

**Design goal:** Close both gulfs. Make actions obvious AND results obvious.

---

## Cognitive Load

### Three Types

| Type | What it is | Design impact |
|------|-----------|---------------|
| **Intrinsic** | Complexity inherent to the task itself | Can't reduce; only support it |
| **Extraneous** | Added by poor design (unnecessary complexity) | Eliminate ruthlessly |
| **Germane** | Cognitive effort that builds understanding | Optimize and support |

**Focus:** Eliminate extraneous load. Don't add cognitive work that doesn't help the user accomplish their goal.

### Sources of Extraneous Cognitive Load

**Visual noise:**
- Too many competing elements
- Low contrast (forces effort to read)
- Inconsistent layout (must re-learn each screen)
- Decorative elements that look functional

**Information architecture:**
- Deeply nested navigation (must remember path)
- Inconsistent terminology (same thing, different names)
- Missing context (user doesn't know where they are or what happened)

**Interaction complexity:**
- Multi-step flows with no progress indicator
- Forms that require information users don't have at hand
- Actions with non-obvious results

### Reduction Strategies

**Chunk information:** Group related items. Max 7±2 items per group (Miller's Law). Use progressive disclosure for detail.

**Offload to the system:**
- Auto-fill known information (name, email, saved addresses)
- Show only relevant options based on context
- Remember previous choices

**Reduce decisions:**
- Defaults that work for most users
- Recommendations that narrow choices
- One decision per screen in onboarding

**Use recognition over recall:**
- Show options rather than requiring typed commands
- Keep context visible (current filters, location, progress)
- Autocomplete for text input

### Cognitive Load in Forms

Every field adds load. Justify each one:

```
High load form:
First name / Last name / Title / Company / Department / 
Phone / Mobile / Fax / Address 1 / Address 2 / City / 
State / Zip / Country / Preferred contact method...

Low load alternative:
Full name / Email / (optional: company)
[Everything else asked only when actually needed]
```

**Rule:** The longer your form, the lower your completion rate. Every optional field you remove increases conversions.

---

## Gestalt Principles

How the brain groups visual elements. Designers who understand Gestalt create clearer visual hierarchy without extra UI chrome.

### Proximity
Elements close together are perceived as related. Elements far apart are perceived as unrelated.

**Use it:**
- Group form label with its input (4px between label and field; 24px between fields)
- Related actions clustered together (don't scatter them across the screen)
- Related navigation items grouped, unrelated separated by space or divider

**Watch out for:**
- Label closer to wrong field
- Related items separated by layout constraints at different breakpoints
- Too much whitespace within a group, too little between groups

```
WRONG:             RIGHT:
Label              Label
                   [Input field]
[Input field]      
                   Label
Label              [Input field]

[Input field]
```

### Similarity
Elements that look alike are perceived as related. Visual consistency signals conceptual consistency.

**Use it:**
- All buttons with same style = clickable
- All cards with same style = same type of content
- All icons with same style = same category of action
- Color coding (all errors red, all success green)

**Watch out for:**
- Different interaction patterns styled identically (link vs. button)
- Same interaction pattern styled differently (confusion about relationship)
- Color used as the only differentiator (accessibility failure)

### Figure/Ground
Users perceive elements as either in the foreground (figure) or background (ground). Interface must make clear which is which.

**Use it:**
- Modal overlays darken the background (ground recedes)
- Cards use elevation/shadow to float above background
- Active state pops forward; inactive recedes

**Watch out for:**
- Low contrast between foreground and background elements
- Multiple layers of similar elevation (which is on top?)
- Flat design with no elevation cues

### Closure
Users fill in missing information to complete a familiar shape. Partial shapes are perceived as complete.

**Use it:**
- Truncated text with "..." signals there's more
- Cards partially visible at edge signal scrollability
- Partial circle as loader communicates progress
- Cropped images create curiosity

### Continuity
Elements arranged in a line or curve are perceived as related and following a path.

**Use it:**
- Step indicators (1 → 2 → 3) communicate sequence
- Progress bars communicate continuation
- Aligned baselines create reading flow
- Consistent left edge creates scanning path

### Common Region
Elements within the same closed region are perceived as grouped.

**Use it:**
- Card = closed region, groups content inside
- Modal = closed region, groups related actions
- Sidebar = region, groups navigation
- Borders and backgrounds create groups without explicit lines

---

## Reading Patterns

### F-Pattern (Information Scans)
Eye-tracking research shows users scanning text-heavy content in an F-shape:
1. First horizontal movement across the top of the content area
2. Second, shorter horizontal movement slightly lower
3. Vertical movement down the left side

**What this means:**
- Most users never read the right side of the page
- The first two lines get the most attention
- Users scan, they don't read — until something catches their eye

**Design for it:**
- Most important content in the first 2 lines of each section
- Left-aligned (not centered) for long-form content
- Front-load key words in headlines and bullets
- Use bold, headings, and visual anchors to create scanning entry points
- Don't bury the key point in the middle of a paragraph

### Layer Cake Pattern (Structured Content)
When content has clear headings, users scan headings and only read sections that match their goal.

**Design for it:**
- Meaningful, specific headings (not "Overview")
- Short paragraphs (2–4 lines max)
- Bullet points for lists
- Visual hierarchy that makes headings obviously larger than body text

### Spotted Pattern
For specific task completion (forms, checkouts), users jump directly to the target element and ignore surrounding content.

**Design for it:**
- Critical labels near their inputs
- No important information between steps that users might skip
- Inline validation (not just a summary at top)

---

## Affordances and Signifiers

Concepts from Don Norman's *The Design of Everyday Things*.

### Affordance
The actual relationship between an object and an actor that makes an action possible.
- A handle affords pulling
- A flat surface affords pushing
- A button affords pressing

### Signifier
The signal that communicates how an object should be used.
- A label that says "PUSH" is a signifier
- A door handle shape is a signifier
- Underlined blue text is a signifier that something is clickable

**The problem most UIs have:** Missing signifiers. The affordance exists (button is clickable) but the signifier is absent (it looks like plain text).

### Digital Affordance Patterns

| Looks like | Signals |
|------------|---------|
| Raised/shadowed rectangle | Clickable button |
| Underlined blue text | Link |
| Text field with border | Editable |
| Drag handle icon (⠿) | Draggable |
| Disclosure triangle (▶) | Expandable |
| Ellipsis (...) | More content |
| Caret (▼) | Dropdown |

**When you break these patterns**, you need an explicit signifier (label, icon, tooltip, hover state) to replace the one you removed.

### Perceived Affordance
What the user perceives as possible — regardless of whether it's actually possible.

**Flat button with no hover state:** Perceived affordance is low. Users may not know it's clickable.
**Cursor change to pointer on hover:** Adds perceived affordance for interactive elements.

**Rule:** If something is interactive, it should look interactive. If something looks interactive, it should be.

### False Affordances
The worst UX pattern: something that looks interactive but isn't.
- Underlined text that isn't a link
- Button-shaped element that isn't clickable
- Row in a table that looks hoverable but does nothing on click

False affordances destroy trust. Users think the interface is broken.

---

## Attention and Perception

### Preattentive Attributes
Visual properties processed before conscious thought — in under 200ms. Use these to direct attention without cognitive effort.

| Attribute | Use for |
|-----------|---------|
| Color | Status (red=error, green=success), categories |
| Size | Hierarchy (larger = more important) |
| Motion | Alerts, status changes, new content |
| Contrast | Primary vs. secondary information |
| Shape | Category coding |
| Position | Reading order, importance |

**One at a time:** Multiple preattentive attributes competing = none is effective. Use one primary signal per piece of information.

### Change Blindness
Users often miss changes that don't happen where they're looking.

**Implications:**
- Status changes that happen offscreen go unnoticed
- Toast notifications in corners get missed for important updates
- Use motion + color + position together for critical alerts
- Critical feedback should appear near where the user's attention is (inline vs. toast)

### Banner Blindness
Users trained to ignore anything that looks like an ad.

**Affected patterns:**
- Top of page banners (looked at least)
- Right rail content (mostly ignored on desktop)
- Anything that looks "promotional" even if it's functional

**Workaround:** Put important information inline in the content flow, not in dedicated "notice" areas.

---

## Memory

### Recognition vs. Recall
**Recall:** Retrieving information from memory with no cues (fill-in-the-blank)
**Recognition:** Identifying correct information when presented (multiple choice)

Recognition is always easier. Design for recognition:
- Show recent items instead of requiring typing
- Show all available commands in a palette (CMD+K) instead of requiring keyboard shortcut memorization
- Use icons with labels (recognition) not just icons (recall)
- Show previously entered values as suggestions

### Working Memory Limits
Users can hold 7±2 items in working memory at once. More than that, items get dropped.

**Design implications:**
- Multi-step flows: don't require users to remember information from step 1 at step 5
- Show summary of previous choices at each step
- Don't put important information on a previous screen that's needed now
- Wizard patterns: show all selections made so far

### The Peak-End Rule
People judge an experience mostly based on how they felt at its most intense point and at the end — not the average or sum.

**Implications:**
- Fix the worst pain point in your flow first (even if it's infrequent)
- End flows on a positive moment (success states matter more than you think)
- Onboarding "aha moment" = the peak that forms the first impression
- A great final step can redeem a mediocre flow

---

## Emotion and Trust

### Visceral / Behavioral / Reflective Design (Norman's Model)

| Level | What it is | Design lever |
|-------|-----------|--------------|
| Visceral | Immediate visual/sensory reaction | Aesthetics, color, motion |
| Behavioral | Experience during use | Usability, efficiency, accuracy |
| Reflective | Post-use reflection and meaning | Brand, story, self-image |

**Practical:** Fix behavioral (usability) issues first — a beautiful but broken UI destroys trust. Then invest in visceral and reflective to create loyalty.

### Visual Credibility Signals
Users form trust judgments in 50ms based on visual design.

**Trust signals:**
- Professional typography (distinctive, intentional)
- Consistent spacing and alignment
- High-quality imagery (not stock photos)
- Visible security indicators (HTTPS, badges) near payment/personal data
- Real contact information
- Social proof near decision points

**Trust destroyers:**
- Spelling/grammar errors
- Broken layouts or images
- Generic stock photos (especially "business handshake")
- Inconsistent visual style
- Aggressive upsell patterns (dark patterns)

### Dark Patterns (Anti-patterns to avoid)

| Pattern | Example | Why it's harmful |
|---------|---------|-----------------|
| Confirmshaming | "No thanks, I don't want to save money" | Manipulates through shame |
| Roach motel | Easy to sign up, impossible to cancel | Traps users |
| Hidden costs | Price shown without fees until checkout | Betrays trust |
| Misdirection | "Recommended" option pre-checked (costs more) | Exploits defaults |
| Trick questions | Double negative checkbox "Uncheck to not receive emails" | Exploits confusion |
| Bait and switch | "Free" offer leads to required purchase | Deception |

**Building sustainable products means avoiding these** — they damage long-term trust and increasingly face legal consequences (GDPR, FTC).

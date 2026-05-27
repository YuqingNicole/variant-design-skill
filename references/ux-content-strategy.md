# UX Content Strategy Reference

Content models, metadata architecture, multilingual UX, and content lifecycle design. Distinct from voice and copywriting style (see `references/voice.md`) — this is the structural layer of content.

---

## What Content Strategy Is

Content strategy answers: what content exists, who it's for, where it lives, how it's structured, and when it changes.

**Four questions content strategy answers:**
1. **What** — What content types exist? What does each contain?
2. **For whom** — Who is each content type for? What are their goals?
3. **Structure** — How is content organized, labeled, and related?
4. **Lifecycle** — Who creates it, who approves it, when does it expire?

**Content strategy ≠ copywriting.** Copywriting is the words. Content strategy is the system the words live in.

---

## Content Models

A content model defines the types of content in a product and the fields (attributes) each type contains.

### Anatomy of a Content Type

```
Content Type: Article
├── Title (text, required, max 80 chars)
├── Subtitle (text, optional, max 120 chars)
├── Author (reference → Person)
├── Published date (date)
├── Last updated (date, auto)
├── Category (taxonomy, required, single)
├── Tags (taxonomy, optional, multiple)
├── Body (rich text, required)
├── Hero image (media, required)
├── Excerpt (text, optional, max 160 chars — for cards and meta description)
├── SEO title (text, optional, overrides Title for search)
└── Status (draft / in-review / published / archived)
```

### Modeling Relationships

**Reference (one-to-one or many-to-one):** Article → Author
**Collection (one-to-many):** Course → [Lesson, Lesson, Lesson]
**Tag/Taxonomy (many-to-many):** Article ↔ Tag

**Avoid embedding when you should reference.** If the same piece of data appears in multiple content types, it should be its own type — not duplicated in each.

```
✗ Each product has fields: designer_name, designer_bio, designer_photo
  → When designer changes their bio, must update every product

✓ Designer is its own content type
  Each product references: designer → [Person]
  → Update once, reflected everywhere
```

### Structured vs. Unstructured Content

| Structured content | Unstructured content |
|---|---|
| Defined fields, typed data | Free-form rich text / WYSIWYG |
| Easy to query, filter, display in multiple formats | Hard to reuse, hard to validate |
| Headless CMS, database | Traditional CMS, Word docs |
| Best for: product pages, profiles, data cards | Best for: long-form articles, documentation |

**The structured content advantage:** Content entered as structured fields can be displayed as a card, a detail page, a mobile layout, an email, and an API response — all from the same source. Unstructured content is locked into one layout.

---

## Taxonomy and Metadata

### Taxonomy Design

Taxonomy = the controlled vocabulary used to categorize content. Categories, tags, topics, content types.

**Flat vs. hierarchical taxonomy:**
- **Flat (tags):** No hierarchy, flexible, many-to-many. Good for: topics, skills, keywords.
- **Hierarchical (categories):** Parent-child tree. Good for: navigation, browsing, structured organization.

**Rules for good taxonomy:**
- **Mutually exclusive at the same level:** An item should clearly belong in one category, not two
- **Collectively exhaustive:** Every item should fit somewhere
- **Use user vocabulary:** Categories should be named what users call them, not internal naming
- **Size balance:** No category should be 10× larger than others

### Metadata That Matters

| Metadata field | Purpose | Where it shows |
|---|---|---|
| Title | Primary identifier | List views, browser tabs, search results |
| Description / excerpt | Summary for display without full content | Cards, SEO snippets, social shares |
| Created / modified dates | Freshness signal | Sort, filter, display in bylines |
| Author | Attribution, filtering | Bylines, author pages |
| Status | Workflow state | Editorial tools, admin views |
| Canonical URL | Deduplication for SEO | `<link rel="canonical">` |
| Locale | Language/region variant | Language switcher, routing |

### Avoiding Metadata Debt

**Metadata debt:** Fields that were added for one purpose and never cleaned up. Most products accumulate 30–50% unused fields over 3 years.

Signs of metadata debt:
- Fields with > 50% null values
- Multiple fields that mean the same thing
- Fields only used in one legacy template
- Fields no one can explain the purpose of

**Prevention:** For every new field, define: who sets it, what displays it, what queries it. If no answer → don't add the field.

---

## Content for Multiple Surfaces

The same content should be writable once and displayable anywhere. Design content models with all surfaces in mind.

### Surface Inventory

Before designing a content model, list every surface the content will appear on:

| Surface | Constraints | What fields it needs |
|---|---|---|
| List / card view | 3–4 lines of text, thumbnail | Title, excerpt, image, date, author |
| Detail / full page | Unlimited | All fields |
| Mobile app | Short title, no long body | Title, short description, image |
| Email notification | Plain text fallback, < 600px | Title, excerpt, CTA link |
| Social share | 120 chars, 1 image | Social title, social description, OG image |
| Search result | 2 lines, URL | SEO title, meta description |
| API response | Structured JSON | All structured fields |

**Excerpt vs. description vs. SEO description:**
- **Excerpt:** Manually written short version, controls what shows in cards
- **Auto-excerpt:** First N characters of body (fallback when no manual excerpt)
- **SEO description:** Shown in search results — can be same as excerpt, or custom
- **Social description:** Shown on social shares — often different from SEO description

Treat these as separate fields in the model, even if they often contain similar text.

---

## Multilingual UX

Designing for multiple languages is not just translation — it requires structural changes.

### Layout Considerations

**Text expansion:** Translated text is typically longer or shorter than English.

| Language | Avg. expansion vs. English |
|---|---|
| German | +30% |
| Finnish | +35% |
| Arabic | -20% |
| Chinese/Japanese | -30–40% |

**Design for 40% expansion** in UI strings. Buttons and labels that say "Submit" in English need space for "Envoyer" (French) and "Absenden" (German).

```css
/* Don't: fixed widths for text */
.button { width: 120px; }

/* Do: min-width, let it grow */
.button { min-width: 120px; padding: 8px 16px; white-space: nowrap; }
```

### RTL (Right-to-Left) Languages

Arabic, Hebrew, Persian, and Urdu are RTL. The entire layout mirrors.

**What changes in RTL:**
- Text alignment flips (right-aligned body text)
- Layout mirrors (sidebar moves from left to right)
- Directional icons flip (back arrow ← becomes →)
- Numbers stay LTR within RTL text
- Punctuation and special characters may need adjustment

**CSS approach:**
```css
/* Use logical properties instead of directional properties */
/* Instead of: */
.card { padding-left: 16px; margin-right: 8px; }

/* Use: */
.card { padding-inline-start: 16px; margin-inline-end: 8px; }

/* Then RTL flips automatically with: */
html[dir="rtl"] { direction: rtl; }
```

**Icons that must flip in RTL:** Back/forward arrows, play/pause if directional, progress indicators, step wizards, breadcrumbs. Use `transform: scaleX(-1)` in RTL context.

**Icons that do NOT flip:** Logos, emoticons, circular indicators, home icon, settings gear.

### String Externalization

All user-visible strings must be externalized (in translation files), not hardcoded.

```javascript
// ✗ Hardcoded
const message = "You have 3 unread messages";

// ✓ Externalized with plural support
const message = t('notifications.unread', { count: 3 });
// en: "You have {count} unread messages" / "{count} unread message"
// de: "Sie haben {count} ungelesene Nachrichten" / etc.
```

**Pluralization is not just adding 's':** Different languages have different plural forms (Arabic has 6, Russian has 3, Chinese has 1). Use an i18n library that handles plural rules (i18next, ICU format).

### Date, Time, Number Formatting

Never hardcode date/time formats. Use the browser's `Intl` API:

```javascript
// Date formatting
new Intl.DateTimeFormat('de-DE').format(date) // "27.5.2026"
new Intl.DateTimeFormat('en-US').format(date) // "5/27/2026"
new Intl.DateTimeFormat('zh-CN').format(date) // "2026/5/27"

// Number / currency
new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
  .format(1234.56) // "1.234,56 €"
new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
  .format(1234.56) // "$1,234.56"
```

---

## Content Lifecycle

### States

```
Draft → In Review → Approved → Published → [Scheduled → Published]
                                          → Archived
```

**Draft:** Being written. Not visible to users. Editable by author.
**In Review:** Submitted for editorial/legal/compliance review. May be locked during review.
**Approved:** Ready to publish. Awaiting publishing action or scheduled date.
**Published:** Live and visible to users.
**Scheduled:** Approved with a future publish date.
**Archived:** No longer visible to users, but preserved for reference. Not deleted.

**Important:** Distinguish between "unpublished" (never been live) and "archived" (was live, now hidden). Analytics and legal teams often need archived content.

### Content Governance

**Who can do what:**

| Role | Create | Edit | Approve | Publish | Archive |
|---|---|---|---|---|---|
| Author | ✓ | Own | — | — | — |
| Editor | ✓ | All | ✓ | — | — |
| Publisher | ✓ | All | ✓ | ✓ | ✓ |
| Admin | ✓ | All | ✓ | ✓ | ✓ + Delete |

**Content ownership:** Every piece of content should have an owner. When owner leaves, ownership transfers. Ownerless content accumulates and becomes outdated.

### Content Freshness and Expiry

**Set freshness targets by content type:**
| Content type | Review frequency |
|---|---|
| Product marketing pages | Quarterly |
| Help / support articles | After each product change |
| Blog posts / articles | Annual (check for accuracy) |
| Legal / compliance | Per legal team schedule |
| Event / time-sensitive | Auto-archive after event date |

**Expiry date field:** For time-sensitive content (promotions, events, news), add an `expires_at` field. When expired: auto-archive or trigger a review notification to the owner.

---

## Content Strategy Anti-Patterns

| Pattern | Problem | Fix |
|---|---|---|
| One giant "content" field | No structure to query, display, or reuse | Model into specific typed fields |
| Duplicate content in multiple places | Inconsistent, expensive to maintain | Single source with references |
| Infinite taxonomy | Categories added forever, never reviewed | Annual taxonomy audit |
| No content ownership | Outdated content lives forever | Required owner field + expiry date |
| Internal names as labels | Users see "Product Feature B2B v2" | Human-facing labels separate from internal IDs |
| Translation as afterthought | Layout breaks, strings hardcoded | Design for translation from the start |
| Rich text for everything | Can't display differently per surface | Structured fields + rich text for body only |
| Status field = boolean | Only "published" and "draft" — no workflow | Full lifecycle states from day one |

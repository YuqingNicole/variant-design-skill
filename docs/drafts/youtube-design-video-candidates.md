# YouTube design video candidates

Status: draft candidate list, 2026-11-09. Nothing here is on the site. Each row needs a maintainer decision.

## How this list was made

- Searched YouTube by topic (motion, interaction, web layout, design systems, branding, typography, Chinese-language), then checked each candidate on its public pages: title and channel from YouTube's oEmbed endpoint, upload date and view count from the watch page's own metadata, all read on 2026-11-09.
- **I did not watch any video.** The "why" column comes from the title, the channel and how well the topic matches a section of the site. Quality of the content is not verified.
- Durations are left out: my page parsing returned values that disagreed with the titles for several videos.
- Selection rules: the uploader is the original author or the official channel (no re-uploads); uploaded in the last two years unless the topic is stable; it teaches design or front-end craft, not product news; no video that is mostly a tool promotion.
- Views are a weak signal. They are listed so a reviewer can see scale, not as a ranking.

## Candidates

"Section" is the site section the video would fit (`inspiration-sections.ts`).

### Motion and interaction

| Section | Title | Channel | Date | Views | Why it is a candidate | Link |
|---|---|---|---|---|---|---|
| Motion | Figma deep dive: Motion \| Config 2026 | Figma (official) | 2026-06-26 | 26.7k | A first-party walkthrough of the newest motion tooling; matches the motion rules we just added | https://www.youtube.com/watch?v=3evAfmLVZK8 |
| Motion | Config 2025: How to make interactive animations with Figma with Carmen Ansio | Figma (official) | 2025-06-02 | 9.1k | A talk on interactive animation that bridges design and code | https://www.youtube.com/watch?v=AxLIfW9y5yw |
| Motion | Modern CSS for sites: View transitions, scroll effects, and more! | Chrome for Developers (official) | 2024-11-13 | 29.9k | Covers view transitions and scroll effects, which the site's page transitions use | https://www.youtube.com/watch?v=oXSFwix7eR8 |
| Motion | Motion design in UI - Designing in the Browser | Chrome for Developers (official) | 2019-11-07 | 106.6k | Old, but about the principle of motion in UI rather than a feature; check that nothing in it is out of date | https://www.youtube.com/watch?v=jWur1VrxNUg |
| Interaction | Incredible scroll-based animations with CSS-only | Kevin Powell | 2023-12-21 | 633k | Original channel; scroll-driven animation without JavaScript | https://www.youtube.com/watch?v=UmzFk68Bwdk |
| Motion | The Ridiculous Engineering Of Animations | Enrico Tartarotti | 2026-10-17 | 343k | Search snippet says Emil Kowalski is a guest; the only one here whose framing I could not confirm | https://www.youtube.com/watch?v=z3Lo5QT7nME |

### Web and layout

| Section | Title | Channel | Date | Views | Why it is a candidate | Link |
|---|---|---|---|---|---|---|
| Web | 3 modern CSS techniques for responsive design | Kevin Powell | 2021-12-30 | 221k | Original channel; responsive layout, still relevant | https://www.youtube.com/watch?v=VsNAuGkCpQU |
| Web | Write less code with these 5 CSS tips | Kevin Powell | 2024-04-11 | 57k | Original channel; short and practical | https://www.youtube.com/watch?v=UWFrl79092w |
| Web | Improve your reset with these modern CSS additions | Kevin Powell | 2024-09-04 | 52.9k | Original channel; about CSS resets, which generated pages also write | https://www.youtube.com/watch?v=eWmDW4zEXt4 |

### Interface and design systems

| Section | Title | Channel | Date | Views | Why it is a candidate | Link |
|---|---|---|---|---|---|---|
| Interface | Config 2025: Building design systems together with Jake Albaugh & Chad Bergman | Figma (official) | 2025-05-14 | 25.8k | Designer-developer collaboration on design systems; closest match to our `ds` workflow | https://www.youtube.com/watch?v=kq_lqeIIkPw |

### Branding

| Section | Title | Channel | Date | Views | Why it is a candidate | Link |
|---|---|---|---|---|---|---|
| Branding | Brand Identity Design Challenge - Part 1 - Full Design Process | Magenda | 2025-08-20 | 30.6k | A full process from brief to identity, by the channel's own designer | https://www.youtube.com/watch?v=oRl-UKNFe_4 |
| Branding | Brand Identity Design Process Part 1: Client Brief, Research and Strategy | 4 The Creatives | 2026-09-24 | 6.9k | Covers brief, research and strategy, the step before any visual work | https://www.youtube.com/watch?v=SFXyZM31lAs |
| Branding | I designed a BRAND IDENTITY *full branding process* | Laia \| Brand & Web Designer | 2026-03-29 | 7.3k | A solo designer's end-to-end process; small channel | https://www.youtube.com/watch?v=AI6vJH0svHk |

## Considered and left out

- **Re-uploads of other people's videos:** "CSS Animation Tips and Tricks Kevin Powell" (CodeCollections), "Mastering CSS Height Transitions ... by Kevin Powell" (Haadi Org), "Modern CSS Fundamentals with Kevin Powell \| Preview" (MasterDotDev). Link to the original channel instead.
- **Odd numbers:** "Re-imagine the web with Scoped View Transitions" (Chrome for Developers, 8.1M views). The view count is far out of line with the other Chrome videos and my page read suggested a very short clip; I could not tell whether it is a talk.
- **Product news, not craft:** Config India 2026 keynote, "Config 2026, refreshed", and third-party Config recaps.
- **Third-party AI-skill explainers:** "Make Apps Feel Expensive: Emil Kowalski's AI Design Skills" (The Hype Kevin, 7 minutes, 11k views), and several Shorts about the same skills. Our `motion-rules.md` cites Emil Kowalski's own repository; link to that, not to a summary.
- **Typography:** none passed. The UI-typography videos found had under 4k views and unclear authority (Santi Villegas, Lennart Nacke), and one had 23 views. This is a gap, not a finding that none exist.
- **Chinese-language:** none passed. The ones found had between 63 and 432 views and were uploaded in 2019–2022. A better Chinese list probably lives on Bilibili, which this search did not cover.
- **Old or paid course teasers:** "UI Animation Essentials" (a course promo), the 2020 Jake Pomper motion talk.

## Gaps and what would fill them

1. Typography and colour: ask the maintainer for names of channels or talks they trust.
2. Chinese-language video: needs a Bilibili pass, with the maintainer's own picks as seeds.
3. Interaction design beyond CSS tricks: nothing found from a design-led channel in the last two years.

## Decisions the maintainer needs to make

1. **Shape on the site.** Today a social post is shown as a card with the post's own video, and the other entries are links. Options for YouTube: link only (no embed, no tracking by YouTube); a privacy-enhanced embed (`youtube-nocookie.com`) loaded after a click; or a separate "Videos" list outside the inspiration feed. Link only is the cheapest and does not need a permission rule.
2. **What counts as a candidate.** Is "original or official channel only" the right rule, given that some of the best explainers come from third-party channels?
3. **Recency.** Is a 2019 video acceptable when the principle has not changed (Chrome's motion talk)?
4. **Language.** Should the zh page list English-only videos, and should they be marked as English?
5. **Entry data.** A YouTube entry would need `kind: "video"`, the channel as `publisher`, and an upload date; `inspiration-data.ts` has no such kind yet, and the validators would need to know it.

## What I will not do without a go-ahead

- Add any of these to `inspiration-data.ts` or the site.
- Copy a transcript or thumbnail; a link and our own two sentences ("what to study", "where to use it") are the only content the site would hold.

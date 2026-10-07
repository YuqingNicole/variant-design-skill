# Variant Design — Landing system

The implementation in `src/design-system.css` is the token source of truth. The current product shell is monochrome with a bilingual editorial serif stack; the older blue/acid palette and square-corner description no longer describe the site.

- Keep Iowan Old Style/Baskerville and Songti/Source Han Serif fallbacks for display and body; monospace is reserved for metadata and commands.
- Reuse the ink, paper, surface, muted, border, radius, and spacing tokens. Color belongs to the palette examples and generated work.
- A/B/C retain the same site functions, content below the hero, font stack, and palette. Their hero priority and arrangement may differ.
- A explains the product first; B makes the actual comparison the main action; C prioritizes installing the complete skill.
- Keep useful controls in the first viewport. Preserve navigation on mobile through the native details menu.
- Clearly distinguish the built-in site variants, rule-based example contracts, and live model output. Missing model configuration is an unavailable state, not a successful generation.
- Motion communicates state and respects reduced motion. Keyboard focus remains visible.

`variant-output/VariantA.tsx`, B, and C own their hero configurations. Shared `App.tsx` and `LandingIntroduction.tsx` provide the same working site. Local hero edits use the history helper; `npm run export:landing -- B` copies the current B configuration into `src/landing-config.ts` with a backup.

### Homepage direction studies

The guided homepage uses paper, sage and terracotta as illustration colors for three interactive direction studies, with a sage headline accent. Core UI tokens and the historical A/B/C previews remain unchanged. Cards link to the actual previews and are labelled as illustrations. Motion is limited to user-triggered card rearrangement, action feedback and one-shot section entrances. Reduced-motion disables card transitions and cancels active Web Animations; no continuous animation loop is used.

## Current homepage: canvas-led structure

The `/` route uses `PaperLanding` and scoped `paper-landing.css`. The structure is inspired by Paper's proposition → large product canvas → workflow explanation → start action sequence. No Paper logo, copy, imagery or proprietary fonts are bundled.

- Surface: warm white #f7f7f2; canvas #e9ece3; primary text #232622; body text #62665f.
- Typography: Arial / PingFang SC / Microsoft YaHei for reading and controls; system mono for labels. Display 42–74px, section headings 32–52px, body 14–18px.
- Geometry: 1280px content maximum; 96px desktop outer allowance, 32px mobile; 4px control corners and 9px canvas shell. Fine gray-green borders; shadows reserved for actual artboards.
- Product proof: live A/B/C iframe previews at 1200px internal width, scaled to their container; direction viewing remains distinct from final selection. All simulated workflow diagrams are decorative, not execution status.
- Responsive: direction rail becomes a horizontal selector; feature columns stack; complete previews remain available through links.
- Existing online generation and exploratory dark design are accessible at `/workbench`. Historical A/B/C output retains its original brand and rendering.

### Capability illustrations

The primary canvas now renders an original Forma growth dashboard study at `/showcase?direction=A&language=zh`. A prioritizes anomalies, B compares channels, and C allows inspecting individual channel records. Shared sample metrics and tokens make the layout tradeoffs visible. The study is explicitly labeled as sample data, separate from the historical project evidence in GuidedDemo.

Workflow artwork uses rendered dashboard compositions and an interactive headline edit/undo example. Its state is local to the illustration; it does not claim to execute project snapshots or select a final variant. Preserve the original headline and metric region on undo. All artwork is local HTML/CSS/SVG with no external image dependencies.

### Expressive conversion gallery

Homepage GuidedDemo uses three original OFFSCRIPT studio studies at `/directions?direction=A|B|C&language=zh|en`. This is explicitly free visual exploration: A uses cream editorial typography and orange sculptural material; B uses acid yellow, cobalt and oversized poster typography; C uses a dark violet digital composition with a metallic orbital form. Each preserves portfolio content and working project/pricing links. The workbench continues to show the historical brand-locked case.

Thumbnails render the actual pages. Concepts are not presented as client work. The handoff prompt uses the viewed direction as inspiration, checks existing brand constraints, and generates project variants before editing or undoing them. The old verified integration case is clearly described as a separate project.

### Shared product shell

`SiteChrome.tsx` and `site-system.css` define the shared wordmark, navigation, footer and light product tokens for `/`, `/pricing` and `/workbench`. Pricing uses a single stylesheet rather than layered legacy themes: paper backgrounds, sans-serif headings, sage plan emphasis, 4–6px radii, thin borders and dark primary buttons. Language persists between routes. Free-plan CTAs lead to the guided installation section.

Workbench theme changes are scoped to `.site-workbench`; historical variant previews and expressive concept pages retain their intentionally distinct visual systems. Future product routes should use the shared shell instead of copying navigation markup.

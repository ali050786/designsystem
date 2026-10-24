# Free library roadmap — v1 → launch
Owner (build): Claude · Decision maker: Ali · Created 21 Oct 2026
Positioning: **accessible-by-design design system, industry-neutral** (WCAG 2.2 AA built in, AI-ready as a bonus).
Purpose: proof + audience for the paid audit service. Everything original (clean-room; surf/ is reference only).

---

## Phase 0 — Groundwork (week 1)
| Deliverable | Detail | Who |
|---|---|---|
| Name + simple brand | Name, logo mark, colours for the library itself | Ali decides, Claude proposes 5 options |
| Principles (5) | e.g. accessible by construction, linked not copied, explicit over implicit, data-dense ready, AI-readable | Claude drafts, Ali approves |
| Token architecture spec | 3 tiers: primitives → semantic → (component, phase 3). Naming convention, modes (Light/Dark, breakpoints, density, reduced motion), one Figma file with cross-collection aliases (fixes DSS's unlinked foundations) | Claude |
| Accessibility target | WCAG 2.2 AA + mapping table: every rule → criterion (1.4.3, 1.4.11, 2.4.7, 2.4.11, 2.5.8, 1.4.10, 1.4.12, 2.3.3…) | Claude |
| Repo + licence | GitHub repo; MIT for code, CC BY 4.0 for docs (free, attribution = marketing) | Ali creates accounts, Claude sets up |
**Done when:** spec approved by Ali.

## Phase 1 — Engine + 8 foundations (weeks 2–4)
One config in → all foundations out, values computed by code, checks run automatically.
| Foundation | What it contains | Accessibility built in | Data-dense extra |
|---|---|---|---|
| Colour | OKLCH palettes (brand + neutral + 4 status), semantic bg/fg/border/focus/state, Light + Dark | Every documented pair passes AA by construction, ratio shown; dark-mode states keep contrast | **Data colours**: good/bad change with non-colour cue rules, colour-blind-safe chart palette, gridline/axis contrast |
| Typography | Families, responsive scale (4 breakpoints), roles (display → caption, mono), text styles | Min 12px, large/normal-text class per breakpoint, line-height ≥ 1.5 for reading, text-spacing safe | **Tabular numerals** for tables and metrics |
| Spacing | Base-4 scale, semantic families (inset, stack, inline), density modes (comfortable/default/compact) | Target spacing ≥ 24px rule (2.5.8) checked in compact | Compact mode tuned for dense tables and dashboards |
| Layout | Breakpoints (shared with type), columns, gutters/margins aliasing Spacing (truly linked), containers, reading width | Reflow at 320px, reading width cap | Data-dense dashboard grid |
| Radius | Scale + shape categories, nested-radius rule | Focus ring follows shape | — |
| Border | Widths, roles, focus ring width/offset | Focus indicator ≥ 2px, 3:1 against adjacent (2.4.11/2.4.13), input borders ≥ 3:1 | — |
| Elevation | Planes paired with Colour surfaces, shadows whose colours come from Colour (linked) | No shadow-only boundaries | — |
| Motion | Durations, easing, intents, **reduced-motion mode in Figma and code** | prefers-reduced-motion covered by default | Calm motion for numbers updating |

**Outputs (per foundation and as a whole):**
1. Figma: a ready-made **static Community file** (default system). Customisation via the web generator → tokens file → loaded with an existing free variables-import plugin. **Own plugin = later, only if users ask** (open decision, recommended by Claude)
2. Code: W3C DTCG tokens JSON, CSS variables (theme/density/breakpoint/reduced-motion blocks), Tailwind preset
3. AI: `DESIGN_SYSTEM.md` index + one rulebook per foundation written from the generated values
4. Automated check report (contrast, sizes, targets) — the same checker later powers the paid audit

**Done when:** default system + 3 sample brands generate with zero AA failures; static file and import flow tested in Ali's Figma.

## Phase 2 — Docs site + self-check (weeks 5–6)
| Deliverable | Detail |
|---|---|
| Public docs site | Each foundation: why, tokens, usage do/avoid, WCAG mapping, live examples, downloads |
| "Generate yours" page | Pick brand colour → preview + download (web version of the engine) |
| Accessibility self-check | 15 questions → score card + "book an audit" CTA (lead magnet) |
| Changelog + versioning | Semantic versions from day one |
**Done when:** site live on a domain; self-check captures emails.

## Phase 3 — 5 accessible components (weeks 7–10) = v1.1
Chosen because they fail most in accessibility audits: **Button, Text field, Checkbox/Radio/Switch, Dialog, Data table**.
Each ships as: Figma component (variants bound to tokens) + React component + spec (anatomy, states, keyboard map, focus order, ARIA/semantics, error handling, do/avoid) + AI rule file + tests (axe + keyboard).
**Done when:** each passes automated a11y tests and a manual keyboard/screen-reader run.

## Phase 4 — Launch (week 11)
- Figma Community: file (free); plugin later if requested
- GitHub + npm package
- LinkedIn launch + teardown series (8 foundation teardowns, real-product examples)
- Product Hunt (optional)
**Done when:** public, and first audit enquiries can arrive → start audit service build.

---

## After the library: audit service (from week 9, overlapping)
Offer pages, checker reused from Phase 1, report template, proposal + contract templates, 3 pilot clients.

## Decisions needed from Ali
| # | Decision | When |
|---|---|---|
| 1 | Library name | Phase 0 (blocks repo, plugin, site) |
| 2 | Open licence OK (MIT code / CC BY docs)? | Phase 0 |
| 3 | Under Blinkwiser brand or standalone? | Phase 0 |
| 4 | Domain + GitHub + Figma Community accounts | Phase 0–1 |
| 5 | Start CPACC certification prep | Now (in parallel) |
| 6 | Own Figma plugin now, or static file + web generator + existing import plugin first (Claude recommends the latter) | Phase 1 |

## Timing note
Weeks assume we work most days. Build speed on my side is fast; the real pace is set by your reviews and Figma testing.

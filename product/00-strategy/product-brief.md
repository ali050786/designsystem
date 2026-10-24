# Product brief — working name "TBD" — DRAFT, NOT VALIDATED (pending research)

Owner (build): Claude · Decision maker: Ali · Last updated: 21 Oct 2026

## Problem
Teams that want a design system usable by people AND AI agents today get a fixed template plus
hundreds of prompts (e.g. Design Systems Surf). Customising it means chatting with an AI one change at a
time; results vary run to run, accessibility is checked only afterwards, and the files describe the
template, not the team's real system.

## Who it's for
1. Primary: product designers / small design teams setting up or rebuilding a system (Figma users).
2. Secondary: design leads in enterprises who need it AI-ready and accessible from day one.
3. Learners (course + certification) — later phase.

## What it is
A generator: pick brand colour(s) → get a finished, accessible, connected design system:
- Figma variables + documentation pages written into your file (via plugin)
- Code exports: design tokens (W3C DTCG JSON), CSS variables (light/dark)
- One AI rulebook per foundation, written from YOUR values, plus one index file (DESIGN_SYSTEM.md)

## Why it wins vs DSS
| DSS | Us |
|---|---|
| Fixed template, customise via AI prompts | Customised the moment you pick a colour |
| AI picks values → varies, contrast checked after | Code computes values → same every time, passes WCAG AA by construction |
| Found: dark-mode primary buttons fail contrast (2.9–4.3:1) | Contrast guaranteed and shown in every pairing |
| Foundations not linked (layout spacing copy, shadow colours) | One connected system + single index for agents |
| Docs describe default template | Docs generated from the user's values |
| Foundations only | Components next (phase 3) |

## Scope
- v1 (now): **All 8 foundations, linked, end to end** — Colour, Typography, Spacing, Radius, Border,
  Elevation, Layout, Motion. One input screen (brand colours, font, base size, density, corner style,
  motion feel; defaults for everything) → one engine → Figma plugin + exports + DESIGN_SYSTEM.md index.
- v2: Components (Button, Input, …) built on the foundations, with AI rules.
- v3: Agents that run checks automatically; course + certification.

## Out of scope for v1
Multi-brand, components (v2), payments, accounts, website.

## Decisions needed from Ali (not blocking v1 build)
1. Product name
2. Pricing model (free plugin + paid pro? one-time? subscription?)
3. Brand under Blinkwiser or separate
4. Launch channel (Figma Community, own site, LinkedIn)

## Success for v1
- One run produces all 8 foundations, cross-linked (shared breakpoints, spacing, shadow colours from Colour)
- Any brand colour → system where every documented text/background pair passes AA in light and dark
- Plugin writes variables into a Figma file in < 10 seconds
- Exports open and validate; rulebook matches the generated values exactly

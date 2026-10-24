# Design Systems Surf (DSS) — evaluation, 21 Oct 2026

## What the Pro subscription contains
- 8 foundations: Color, Typography, Border, Radius, Elevation, Spacing, Layout, Motion
- 3 planning products: Design System Goals (Figma board), AI-Ready Roadmap (PDF + prompts), Design Agents (AI Skill templates)
- Per foundation: Figma file, AI context .md, Gemini knowledge base .md, accessibility audit .md, dev handoff .md, ~6 guides, ~25 prompts
- Totals: ~250 prompts, 74 guides, ~37 Markdown files, 9 Figma files
- Price from $19/month; billing via Stripe; single-user only (no team plan yet)

## Strengths
- Strict prompt engineering: AI must check names against files and say when unsure
- Works with pasted values or live Figma via MCP
- "Mistakes that break the system" guides hold real tacit knowledge
- Accessibility mapped to specific WCAG criteria per foundation
- Goals / Design Agents methods are rigorous (outcomes vs deliverables, baseline runs, one change per fix)

## Gaps (our openings)
1. No components — stops at foundations
2. Foundations not linked: Layout keeps an unsynced spacing copy; Elevation shadow colors don't follow Color
3. Only light/dark themes — no multi-brand, versioning, changelog, or migration of an existing system
4. Handoff code is generated in an AI chat, so output varies run to run; no deterministic token pipeline
5. All checks self-assessed; no review or certification
6. Heavy repetition: 48 foundation guides are one template × 8

## Licence
- Own and client use allowed; resale / redistribution of originals forbidden (Terms 8.3)
- Downloaded files can be kept after cancelling (Terms 6.4)

## Guides (74 read, 21 Oct)
- 8 general, 48 foundation (one 6-guide template × 8: add to Figma, adapt, common changes, mistakes, share, accessibility), 4 roadmap, 7 goals, 7 design agents
- Best content: "mistakes that break the system" guides and WCAG-specific accessibility guides
- Guides admit structural flaws: Layout keeps an unsynced copy of spacing primitives; Elevation shadow colours are raw values, not linked to Colour; weight/bold = 600; template typo "deafault"
- No components, no multi-brand, no versioning/migration; all checks self-assessed
- Licence note in their get-started guide: files usable in own and client work; originals cannot be resold or redistributed

## How their product works (plain words)
Per foundation: Figma variables (the working tokens) + rule pages (when to use what) + AI files
(rulebook, Gemini knowledge base, accessibility auditor, dev handoff) + prompts (one task each).
Customisation = user chats with Claude/Cursor connected to Figma via MCP; AI proposes, user approves, AI edits variables.
No master file: user attaches only the files a task needs; Design Agents teaches a Skill + project instructions + references setup.
It is AI-friendly documentation, not an agent system: nothing runs on its own.

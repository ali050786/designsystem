# v1 decision: buyer, audit, library — 21 Oct 2026 (Claude's recommendation, pending Ali's approval)

## 1. Buyer
**Primary: Indian regulated fintech / BFSI (SEBI- and RBI-regulated: brokers, AMCs, investment platforms, banks, NBFCs) with an in-house design team.**
Why:
- Legal trigger, not "nice to have": SEBI requires a third-party accessibility audit by an IAAP-certified auditor AND remediation of all findings by **31 Oct 2026**, then annual compliance (MD sign-off; unfixed issues become SCORES complaints that can't be closed without a fix).
- RBI applies banking accessibility standards (2024) and the Supreme Court's 2025 digital-KYC directions.
- Pain after the audit = remediation across hundreds of screens, and staying compliant every year. Fixing it once in the design system is the lasting fix.
**Secondary: Indian SaaS selling to EU consumers** (European Accessibility Act applies to non-EU sellers; enforcement complaint-driven and accelerating).
**Next wave:** draft RPwD (Amendment) Rules 2026 would extend IS 17802 to ICT establishments, ≥ ₹500 cr turnover first (1 year).
**Not now:** early startups (no design system, no budget); large IT services (procurement cycles too long for a solo start).

## 2. Positioning
"Accessible-by-design design systems for Indian fintech and SaaS." AI-ready is a supporting benefit, not the headline
(Figma is absorbing the AI-context layer; regulation creates budget).

## 3. Audit offer and price
We do NOT sell the SEBI-certified audit (needs IAAP-certified auditor + testing with persons with disabilities;
specialist firms like BarrierBreak, Deque own this). We sell what comes before and after it: **system-level accessibility.**

| Offer | Scope | Price (INR / USD) | Time |
|---|---|---|---|
| A. Design System Accessibility Check | Foundations + tokens (colour, type, spacing, focus, target size, motion), automated checks + expert review, fix plan | ₹45,000 (~$550) | 1 week |
| B. Full Design System Audit | A + up to 15 core components (states, keyboard, focus, semantics specs), design–code spot check, AI-readiness test | ₹1,75,000 (~$2,100) | 2–3 weeks |
| C. Remediation sprint | Fix at system level: tokens, components, docs, handoff | from ₹2,50,000 per 2-week sprint | 2 weeks |

Benchmarks: freelance DS audits $500–750 (Contra); accessibility audits $1,000–3,000 for a 10-page site,
$150–250 per app screen, consulting $40–50/hr (DigitalA11Y).
Launch pricing: first 3 pilots at 50% in exchange for a case study.

## 4. Library v1 (free)
- **8 foundations, accessible by construction**: colour, typography, spacing, layout, radius, border, elevation, motion — linked in one system; every rule mapped to the WCAG 2.2 criterion it protects
- Delivered as Figma variables + docs, tokens/CSS, AI rule files
- **v1.1: 5 accessible core components** most cited in fintech audits: Button, Text field, Checkbox/Radio/Switch, Dialog, Data table
- **No roadmap-style framework in the library.** Our own audit method stays the paid IP; a free 15-question "design system accessibility self-check" acts as the lead magnet.

## 5. Credibility gaps to close
- Ali gets **IAAP CPACC** ($385 member / $485; possible $170 emerging-economy rate). Needed to be credible with SEBI-regulated buyers.
- Partner channel: certified audit firms find issues; we fix them at system level.
- Public teardowns: fintech-relevant (e.g. contrast of P&L green/red, candlestick colours, focus rings) using public design systems.

## 6. Validation (next 2 weeks)
- List 20 SEBI-regulated platforms + 10 Indian SaaS selling in EU with design teams
- 10–15 conversations (design leads); 1 LinkedIn post on post-deadline remediation
- Success: ≥1 paid pilot or ≥3 "yes, send a proposal"

## Risks
- SEBI deadline passes in 10 days: some buyers already contracted; window is remediation + annual cycle
- Buyers may only want the certified audit vendor → partnership route mitigates
- Prices unvalidated in Indian BFSI

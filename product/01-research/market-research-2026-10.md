# Market research: what should we build? — 21 Oct 2026

Question: is there real demand for an "AI-ready design system" product, and where is the gap?

## 1. What design system teams actually struggle with (zeroheight Design Systems Report 2026, n=147)
- Top challenge 5 years running: **adoption and awareness**
- **61% understaffed** (up YoY); most teams are 1–5 people
- Maintenance blockers: lack of staff 56%, prioritising updates 35%, buy-in 31%, cross-team consistency 31%
- Buy-in dissatisfaction rose 23% → 40%
- AI: only **10% have AI built into process**; 46% experimenting; 44% not using it
- What they WANT AI for: **documentation generation 57%**, process automation 40%, code generation 39%
- What they FEAR AI doing: **design generation 61%**
- **60% have no token automation**; wish list: Figma Variables → tokens, accessibility compliance testing, visual regression, adoption metrics
- Figma used by 97%; React 72%

AI in Design Report 2026 (900+ designers): biggest pain is **unreliable output quality**; learning is informal; hiring managers want AI fluency.

**Read:** the pain is *keeping a system alive with too few people* (docs, automation, adoption, a11y),
NOT *creating* a system. Teams actively distrust AI generating design.

## 2. Competitor map
| Layer | Who | Notes |
|---|---|---|
| Generate foundations from brand colour | Kigen (37K+ installs), Foundation Studio, Titan, Foundations Generator, Design System Variables, Material Theme Builder (Google, free, Figma variables), Tokens Studio (264K users) | **Crowded and cheap/free.** None stress contrast-by-construction, but that alone is a feature, not a business |
| AI context for agents | **Figma Guidelines (open beta, Config India 2026)**, Figma design system hub (preview), zeroheight MCP read/write, Supernova (enterprise), DSS | **Figma is absorbing this layer natively.** High platform risk for a solo product |
| Content / templates / prompts | Design Systems Surf ($19/mo), DesignSystems.One (free), Untitled UI | Works as indie content business; DSS already polished |
| Education | **Brad Frost "AI & Design Systems" ($995→$1,495, certificate, skills files)**, Designlab AI certification, Uxcel | Top end taken by the most famous name in the field |
| Services | Agencies, freelancers (Contra, Dribbble), accessibility auditors | Fragmented; few offer "AI-readiness + a11y" as a fixed package |

## 3. What this means
- My earlier idea (generator plugin) = **entering the most crowded, lowest-price layer.** Not recommended as the business.
- "AI-ready context files" = being **eaten by Figma itself**. Not recommended as the core.
- Course = possible later, but competing head-on with Brad Frost now is weak without an audience/proof.
- The **unserved need** matches the survey: small, understaffed teams need help *maintaining* a system (a11y, docs, token automation, AI-readiness) and can't hire.

## 4. Recommendation (for Ali to decide)
**Start as a productized service, not a software product.**
- Offer: *"AI-Readiness & Accessibility Audit for your design system"* — fixed scope, fixed price, 1–2 weeks.
  Deliverables: contrast/token audit (like the DSS teardown we did), AI-readiness test, prioritised fix plan, optional fix sprint.
- Why: fastest proof of demand (people pay or they don't), uses Ali's 10+ yrs + Mphasis enterprise DS experience,
  every audit = portfolio case study, and the repeated audit steps tell us exactly which tool to build (vs guessing).
- Claude's role: build the internal tooling (automated contrast/token checker, report generator), prepare offer, outreach, interview script, case studies.
- Product later: build the tool that the audits prove people need repeatedly.

## 5. Validation before any build (2 weeks)
1. 10–15 conversations with designers / DS leads from Ali's LinkedIn (script to be prepared)
2. One LinkedIn post sharing the DSS dark-mode contrast finding (anonymised) → measure response
3. Offer 3 pilot audits (discounted) → success = ≥1 paid or ≥3 strong yeses

## Unknowns
- No hard data on willingness to pay in India vs US/EU for audits
- Plugin install counts for most generators not visible
- Figma Guidelines final pricing/scope (beta)

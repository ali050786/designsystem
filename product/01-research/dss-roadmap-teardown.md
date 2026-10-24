# DSS AI-Ready Roadmap — teardown, 21 Oct 2026

Sources: roadmap PDF (80 slides, 1920×1080), Overview/Guides/AI context/Prompts tabs in the member area.

## What it is
A self-assessment framework for the WHOLE design system (not just Figma): 20 steps in 4 stages.
| Stage | Steps |
|---|---|
| Define | Goals, Principles, Scope, Architecture, Ownership |
| Create | Foundations, Tokens, Components, Design–Code Alignment, Documentation |
| Adopt | Release, Communication, Enablement, Contribution, Governance |
| Evolve | Metrics, Feedback, Maintenance, Deprecation, Prioritization |
+ Apply section: turn gaps into a 3–5 priority plan, share across roles, "clarity over completeness".

Each step has the same 4-slide template: expected outcome → focus table (focus/role/gap/question) →
6 checkpoints + a "Ready enough" line → AI readiness test (context to give, test task, where AI will guess, reliable output).

Statuses (no score, a profile): Not relevant now / Not started / In progress / Working well / Needs attention.

## Deliverables
- PDF guide (80 slides)
- ROADMAP_AI_CONTEXT.md (~74K chars): golden rule ("AI assesses, user owns statuses and priorities"),
  4 modes (Assess, Run a test, Grade a test, Plan), all steps, and a YAML "Roadmap Record"
- 4 guides: Assess, Test AI readiness, Choose priorities, Share with team
- 30 prompts: Assess (4), one AI-readiness test per step (20), Plan (5) + grading

## Strengths
- Treats a design system as an operating model, not a Figma file — rare in free/cheap material
- Consistent, practical template; "Ready enough" avoids maturity-score theatre
- AI readiness tests are a genuinely useful idea: test AI on one task with your own context, grade in a fresh chat
- Portable YAML record

## Weaknesses / errors found
- Self-assessed only: no expert review, no benchmarks, no evidence collection — user must judge their own system
- Very text-heavy; 80 slides of tables
- Copy errors in the PDF:
  - Architecture "Expected outcome" repeats Ownership's ("A sustainable ownership model…")
  - Foundations focus table lists "Constraints" twice (second row is really validation/testing)
  - Decorative title text renders as garbled letters in the PDF text layer (e.g. "ssss aasola")
- Tests must be run manually, one by one; nothing automated

## Why it matters to us
This IS an audit framework, sold as self-serve. It confirms:
1. Audits can cover 20 areas, far beyond foundations — our paid audit can be scoped by stage
2. The missing piece is the expert + evidence: someone who looks at the real system, gathers proof, and grades it
→ Our paid audit = what this roadmap can't do by itself: expert review with evidence, benchmarks against
  real systems, automated checks where possible. Our own framework must be written from scratch (clean-room).

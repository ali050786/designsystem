# Review radius — prompt

Use this to have an AI tool review code (or a described design) for radius problems before it ships.

**Attach:** `radius.md`, and the files to review (or screenshots plus the tokens used, for a design).
**Run the tools first:** `npm run lint:radius -- <files>` catches hard-coded radii, primitives, Tailwind's own scale, unknown
roles, physical corners, rings on their own layer, rounded containers that clip, state changes, copied radii in markup and
redefined variables; `npm run audit:radius -- <page.html>` renders the page in every style and catches radii that ignore the
style, corners that poke out, nested radii off the rule, text outside its shape (also at 200% text), rounded seams in both
text directions and focus rings missing on any side. Paste both outputs into the prompt.

```text
Review the attached work for radius problems against the attached ds radius rulebook (radius.md).
The rulebook is the standard: its Hard rules (RR-01 … RR-10), its Decision guide and its Limits.

Radius checker output (may be empty): {paste the output of npm run lint:radius, or write "not run"}
Radius audit output (may be empty): {paste the output of npm run audit:radius, or write "not run"}

How to review:
1. Confirm each tool finding, and add anything they missed. Look in particular for what needs judgement:
   - a role chosen by size or look instead of job: a card with the surface radius because it is big, a menu with
     the control radius, a toggle button styled as a pill;
   - a child that fills a rounded parent without the nested radius, when the CSS selector hides the relationship;
   - a flush header or image with square corners, or rounded by clipping the parent;
   - a focus ring drawn on its own layer (pseudo-element, wrapper) with the wrong radius;
   - parts that touch but aren't joined, or joined parts with a gap;
   - a radius that changes between states or sizes of the same component.
2. Report only real problems. Don't pad the list.

Report as a table, most serious first:

| # | Severity | Where | Rule | Problem | Fix |

- Severity: Blocker = fails WCAG now (a focus ring cut off entirely, text off its fill); Major = breaks a ds rule that
  shows in another style, density, text size or direction; Minor = inconsistent but harmless today.
- Fix: the exact role, expression or class.

Finish with one line: "Blockers: n · Major: n · Minor: n — ready to ship" or "— not ready to ship".
```

## What a good answer looks like

- Every finding names a rule ID and an exact fix.
- It catches what the tools can't (a role chosen by size, a ring layer, a toggle styled as a pill).
- It doesn't invent problems in code that follows the rules.

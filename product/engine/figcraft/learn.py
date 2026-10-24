"""Learn pages: teach how to manage colour with the system. Uses Kit (k) and engine data (D)."""


def start_here(k, D):
    k.page("01 Start here")
    b = k.board("Learn · 01", "Start here",
                "This file is the colour part of ds: a small set of named colour roles that make accessible screens the default. Read the Learn pages once, then keep the Reference pages open while you work.")
    s = k.section(b, "01", "What's in this file", "Three parts. You only need the first two to design; developers also need the third.")
    r = k.row(s, 24)
    for t, body in [("Learn", "Eleven short lessons on how colour works here and how to choose it: grades, names, surfaces, text, intent, states, dark mode, your brand, extending."),
                    ("Reference", "Every role, pair, state and pattern, in Light and Dark, with measured contrast. Use it to look things up while designing."),
                    (f"Variables", f"{D['counts']['variables']} colour variables in two collections. Primitives are hidden raw shades; Color holds the roles you use, each with a Light and a Dark value.")]:
        c = k.card(r)
        k.text(c, t, "h3")
        k.text(c, body, "body", "color/fg/muted", fill=True)

    s = k.section(b, "02", "Pick your path", "Five minutes each. Follow the numbers in the page list.")
    r = k.row(s, 24)
    for who, steps in [("Designers", [("02", "Contrast grades — the one idea behind everything"), ("04", "Choosing a colour — a step-by-step guide"), ("05", "Surfaces and depth"), ("08", "Interactive states")]),
                       ("Developers", [("03", "Anatomy of a name — how names map to CSS"), ("09", "Dark mode — how modes switch"), ("R11", "Handoff — variables, CSS and Tailwind side by side"), ("11", "Extending safely")])]:
        c = k.card(r, 14)
        k.text(c, who, "h3")
        for n, t in steps:
            line = k.row(c, 12, n, align="center")
            k.chip(line, n, "color/bg/brand-subtle", "color/fg/brand")
            k.text(line, t, "body", fill=True)

    s = k.section(b, "03", "Three rules to remember", "If you only keep three things from this file, keep these.")
    for t, body in [("Pick roles, never shades", "Use color/bg/surface, color/fg/muted, color/action/primary/bg — never brand/60 or a hex code. Roles carry the Light and Dark values and the contrast promise."),
                    ("Text goes only where it's listed", "Every text role lists the backgrounds it may sit on (Reference · Pairs). Anything not listed is not checked, so treat it as broken."),
                    ("Colour never works alone", "Pair every colour meaning with words, an icon or a shape: ▲ for gain, an ✕ icon for errors, an underline for links.")]:
        k.inst("rule", s, {"Title": t, "Body": body}, fill=True)

    s = k.section(b, "04", "How to read a page", "Every page follows the same pattern, so you always know where to look.")
    r = k.row(s, 40, align="min")
    demo = k.card(r, 14, 28, sizingH=None, w=640, bind="color/bg/canvas")
    m = k.row(demo, 10, align="center"); k.inst("marker", m, {"Number": "1"}); k.text(m, "Learn · 05", "eyebrow", "color/fg/brand")
    m = k.row(demo, 10, align="center"); k.inst("marker", m, {"Number": "2"}); k.text(m, "Surfaces and depth", "h2")
    m = k.row(demo, 10, align="center"); k.inst("marker", m, {"Number": "3"}); k.chip(m, "color/bg/surface")
    m = k.row(demo, 10, align="center"); k.inst("marker", m, {"Number": "4"}); k.inst("why", m, {"Body": "Why the rule exists."})
    leg = k.frame(r, "Legend", gap=16, sizingH="fill")
    for n, t, sub in [(1, "Part and number", "Learn pages teach; Reference pages (R1–R12) are for looking things up."),
                      (2, "The topic", "One idea per page, explained in the first sentence."),
                      (3, "Role names", "Shown as chips. They are the exact Figma variable names."),
                      (4, "Why it matters", "The reason behind each rule, so you can make good calls in cases we did not cover.")]:
        k.marked(leg, n, t, sub)
    return b


def grades(k, D):
    k.page("02 Contrast grades")
    b = k.board("Learn · 02", "Contrast grades",
                "Every shade has a grade from 0 (white) to 100 (black). The gap between two grades tells you their contrast — in any hue. This one idea is what keeps the whole system accessible.")
    s = k.section(b, "01", "A grade is measured darkness", "Not hue, not saturation: how much contrast the shade has against white. Two shades with the same grade behave the same in every pair.")
    strip = k.row(s, 4)
    for st in D["scales"][0]["steps"]:
        col = k.frame(strip, f"g{st['g']}", gap=6, sizingH="fill", align="center")
        r_ = k.rect(col, 60, 64, bind=st["v"], radius=6)
        k.f.tool("set_properties", ids=[r_], props={"sizingH": "fill"})
        k.text(col, str(st["g"]), "caption", "color/fg/muted")

    s = k.section(b, "02", "Subtract to check a pair", "Take the darker grade minus the lighter one. 50 or more: any text passes. 40 or more: icons, borders and large text pass.")
    left = k.with_why(s, "WCAG asks for 4.5 : 1 for text and 3 : 1 for icons and borders. Grades turn that into subtraction, so you can check a pair in your head instead of reaching for a contrast tool.")
    for ex in D["examples"]:
        c = k.card(left, 0, 20, direction="horizontal", align="center")
        sw = k.frame(c, "Pair", "horizontal", 0, 0, w=96, h=56, sizingV=None, fill=ex["bHex"], radius=8, align="center", main="center")
        k.text(sw, "Aa", "h3", ex["aHex"])
        k.f.tool("set_properties", ids=[c], props={"gap": 20})
        col = k.frame(c, "Text", gap=2, sizingH="fill")
        k.text(col, ex["label"], "body", weight=600)
        k.text(col, f"{ex['a'].replace('color/', '')} on {ex['b'].replace('color/', '')}", "mono", "color/fg/muted")
        eq = k.frame(c, "Sum", gap=2, align="max")
        ok = ex["ratio"] >= ex["min"]
        k.text(eq, f"gap {ex['gap']}  →  {ex['ratio']:.2f} : 1", "num")
        k.text(eq, ("✓ passes " if ok else "✕ fails ") + f"{ex['min']} : 1", "small", "color/fg/success" if ok else "color/fg/danger", weight=600)

    s = k.section(b, "03", "The same gap in every hue", "Grade 10 next to grade 60 — a gap of 50 — in all six scales. The contrast barely moves, because grades are solved per hue.")
    r = k.row(s, 16)
    for hg in D["hueGap"]:
        c = k.card(r, 10, 16)
        sw = k.frame(c, "Pair", "horizontal", 0, 0, h=72, sizingV=None, sizingH="fill", fill=hg["a"], radius=8, align="center", main="center")
        k.text(sw, "Aa", "h2", hg["b"])
        k.text(c, hg["hue"].capitalize(), "small", weight=600)
        k.text(c, f"{hg['ratio']:.2f} : 1", "num")

    s = k.section(b, "04", "Gaps to remember", "Three numbers cover almost every decision.")
    r = k.row(s, 24)
    for gap, ratio, use in [(40, "3 : 1", "Icons, input borders, focus rings, chart marks, large text (24px+, or 18.7px bold)"),
                            (50, "4.5 : 1", "All text, at any size. The default for anything people read."),
                            (70, "7 : 1", "Enhanced (AAA). Body text on the main surfaces already reaches it.")]:
        c = k.card(r, 8)
        k.text(c, f"Gap {gap}", "h2", "color/fg/brand")
        k.text(c, ratio, "h3")
        k.text(c, use, "body", "color/fg/muted", fill=True)
    k.inst("note", b, {"Body": "Where grades come from: the engine solves each shade's lightness so its luminance hits the target for its grade, rounds it to hex, and measures every pair again before the file is made."}, fill=True)
    return b


def anatomy(k, D):
    k.page("03 Anatomy of a name")
    b = k.board("Learn · 03", "Anatomy of a name",
                "Every colour name reads left to right, from general to specific. Once you can read one, you can guess the rest — and find them in Figma, CSS and Tailwind under the same name.")
    s = k.section(b, "01", "Reading a name", "Four parts. The last one only appears when the colour belongs to a state.")
    for parts in [[("color", "1"), ("fg", "2"), ("muted", "3")], [("color", "1"), ("action", "2"), ("primary / bg", "3"), ("hover", "4")]]:
        c = k.card(s, 0, 32, direction="horizontal", align="max")
        k.f.tool("set_properties", ids=[c], props={"gap": 18})
        for i, (p, n) in enumerate(parts):
            col = k.frame(c, p, gap=10, align="center")
            k.text(col, p if i == 0 else ("/  " + p if n != "4" else "-" + p), "h1", "color/fg/brand" if n == "3" else "color/fg/default", mono=True)
            k.inst("marker", col, {"Number": n})
    leg = k.row(s, 24, align="min")
    for n, t, sub in [(1, "Category", "Which foundation the token belongs to. Always color here."),
                      (2, "Group", "What part of the screen it paints: bg, fg, border, action, data, shadow."),
                      (3, "Role", "The job: surface, muted, primary, gain. Named by purpose, never by colour."),
                      (4, "State", "Optional: hover, pressed, subtle. A variation of the role.")]:
        col = k.frame(leg, f"L{n}", gap=8, sizingH="fill")
        k.marked(col, n, t, sub)

    s = k.section(b, "02", "The groups", "Each group shows up only in the Figma pickers where it makes sense, so the right colours are always the closest ones.")
    tbl = k.card(s, 0, 0)
    head = k.frame(tbl, "Head", "horizontal", 24, 16, sizingH="fill", bind="color/bg/surface-sunken"); k.pad(head, 28, 28)
    widths = [("Group", 180), ("Paints", 360), ("Shows in Figma for", 300), ("Example", 300)]
    for t, w in widths:
        c = k.frame(head, t, w=w); k.text(c, t, "caption", "color/fg/muted", weight=700)
    for g, paints, picker, ex in [("bg", "Pages, containers, fills behind content", "Frame and shape fills", "color/bg/surface"),
                                  ("fg", "Text and icons", "Text fills, icon shapes", "color/fg/muted"),
                                  ("border", "Outlines, dividers, focus rings", "Strokes", "color/border/input"),
                                  ("action", "Buttons and their states", "Fills, text, strokes", "color/action/primary/bg"),
                                  ("data", "Charts, candles, gain and loss marks", "Shape fills, strokes", "color/data/chart-1"),
                                  ("shadow", "Shadow colours for each elevation", "Effects", "color/shadow/2")]:
        rw = k.frame(tbl, g, "horizontal", 24, 14, sizingH="fill", align="center", stroke="color/border/subtle"); k.pad(rw, 28, 28)
        k.f.tool("set_properties", ids=[rw], props={"strokeSides": [1, 0, 0, 0]})
        for (t, w), v in zip(widths, [g, paints, picker, ex]):
            c = k.frame(rw, t, w=w)
            if t in ("Group", "Example"): k.chip(c, v)
            else: k.text(c, v, "small", "color/fg/default", fill=True)

    s = k.section(b, "03", "One name, three places", "Designers and developers say the same word for the same colour.")
    r = k.row(s, 16, align="center")
    for t, v in [("Figma variable", "color/fg/muted"), ("CSS", "var(--ds-color-fg-muted)"), ("Tailwind", "text-fg-muted")]:
        c = k.card(r, 8, 20)
        k.text(c, t, "caption", "color/fg/subtle", weight=700)
        k.text(c, v, "mono", "color/fg/default", weight=600)
    k.inst("rule", b, {"Title": "No name? Don't invent one in a file", "Body": "If you need a colour that has no role, read 11 Extending safely: new roles are added to the system, checked, and then appear everywhere."}, fill=True)
    return b


def choosing(k, D):
    k.page("04 Choosing a colour")
    b = k.board("Learn · 04", "Choosing a colour",
                "Two questions get you to the right role almost every time: what are you colouring, and what is its job? Follow a column down to the answer.")
    s = k.section(b, "01", "Start with what you are colouring", "Pick the column, then answer its question.")
    cols = k.row(s, 20, align="min")
    branches = [
        ("A background", "Where does it sit?", [("The page itself", "bg/canvas"), ("A card, panel or table", "bg/surface"), ("Set back inside a card", "bg/surface-sunken"),
                                                  ("Floating: sticky header", "bg/surface-raised"), ("Menu, popover, dialog", "bg/surface-overlay"), ("A selected item", "bg/selected"),
                                                  ("A message tint", "bg/success-subtle …")]),
        ("Text", "How important is it?", [("Main content", "fg/default"), ("Supporting text", "fg/muted"), ("Meta, timestamps", "fg/subtle"), ("A link", "fg/link"),
                                           ("Status words", "fg/danger …"), ("On a solid fill", "fg/on-brand …")]),
        ("An icon", "Does it carry meaning?", [("Next to a label", "fg/icon"), ("Chevron, decoration", "fg/icon-subtle"), ("Status icon", "fg/success …"), ("In a button", "action/…/fg")]),
        ("An outline", "Does it show where a control is?", [("Yes — input, checkbox", "border/input"), ("Yes — button, toggle", "border/strong"), ("No — divider, card edge", "border/subtle"),
                                                             ("Keyboard focus", "border/focus"), ("Field in error", "border/danger")]),
        ("A button", "How important is the action?", [("The main action", "action/primary"), ("An alternative", "action/secondary"), ("Low emphasis, toolbars", "action/ghost"),
                                                       ("Deletes or cancels", "action/danger")]),
        ("A chart or price", "What does it show?", [("Change in value", "fg/gain + ▲"), ("Candles and bars", "data/gain · data/loss"), ("Several series", "data/chart-1 … 8"),
                                                     ("Axes", "data/axis")]),
    ]
    for i, (what, q, answers) in enumerate(branches):
        c = k.card(cols, 12, 20)
        k.text(c, f"{i + 1}", "eyebrow", "color/fg/brand")
        k.text(c, what, "h3")
        k.text(c, q, "small", "color/fg/muted", fill=True)
        for a, role in answers:
            line = k.frame(c, a, gap=4, pad=10, sizingH="fill", bind="color/bg/surface-sunken", radius=8)
            k.text(line, a, "small", "color/fg/default", fill=True)
            k.text(line, "→ " + role, "mono", "color/fg/brand", weight=600)

    s = k.section(b, "02", "Worked example", "A watchlist row, coloured one decision at a time.")
    r = k.row(s, 40, align="center")
    ex = k.frame(r, "Example", gap=0, w=620, bind="color/bg/surface", radius=12, stroke="color/border/subtle")
    hd = k.frame(ex, "Header", "horizontal", 10, 16, sizingH="fill", align="center"); k.pad(hd, 20, 20)
    k.text(hd, "Watchlist", "h3"); k.inst("marker", hd, {"Number": "1"}); k.spacer(hd)
    gb = k.frame(hd, "Ghost", "horizontal", 6, 0, bind="color/action/ghost/bg", radius=4, align="center"); k.pad(gb, 10, 10, 6, 6)
    k.text(gb, "+ Add", "small", "color/action/ghost/fg", weight=600); k.inst("marker", hd, {"Number": "6"})
    rw = k.frame(ex, "Row", "horizontal", 12, 16, sizingH="fill", align="center", stroke="color/border/subtle"); k.pad(rw, 20, 20)
    k.f.tool("set_properties", ids=[rw], props={"strokeSides": [1, 0, 0, 0]})
    col = k.frame(rw, "Name", gap=2)
    n1 = k.row(col, 8, align="center", fill=False); k.text(n1, "HDFC Bank", "body", weight=600); k.inst("marker", n1, {"Number": "2"})
    n2 = k.row(col, 8, align="center", fill=False); k.text(n2, "NSE · Banking", "small", "color/fg/muted"); k.inst("marker", n2, {"Number": "3"})
    k.spacer(rw)
    pr = k.row(rw, 8, align="center", fill=False); k.text(pr, "▲ +1.24%", "body", "color/fg/gain", weight=600); k.inst("marker", pr, {"Number": "4"})
    k.inst("marker", rw, {"Number": "5"})
    leg = k.frame(r, "Legend", gap=14, sizingH="fill")
    for n, role, why in [(1, "bg/surface", "The row sits on a card, so the card's surface."),
                         (2, "fg/default", "The instrument name is the main content."),
                         (3, "fg/muted", "Exchange and sector support the name."),
                         (4, "fg/gain + ▲", "A change in value — colour and an arrow, never colour alone."),
                         (5, "border/subtle", "The divider only separates rows; it doesn't identify a control."),
                         (6, "action/ghost", "A low-emphasis action inside a card.")]:
        k.marked(leg, n, role, why)
    return b


def surfaces(k, D):
    k.page("05 Surfaces and depth")
    b = k.board("Learn · 05", "Surfaces and depth",
                "Surfaces tell people what belongs together and what sits on top. Use the lowest surface that does the job, and let elevation — not extra colours — say that something floats.")
    s = k.section(b, "01", "The five surfaces on one screen", "An order screen with a menu open. Numbers match the legend.")
    r = k.row(s, 40, align="min")
    scr = k.frame(r, "Screen", gap=16, pad=20, w=720, bind="color/bg/canvas", radius=12, stroke="color/border/default")
    hd = k.frame(scr, "Header", "horizontal", 10, 14, sizingH="fill", bind="color/bg/surface-raised", radius=8, align="center", shadow=(2, (0, 2, 8)))
    k.text(hd, "Orders", "body", weight=600); k.spacer(hd); k.inst("marker", hd, {"Number": "4"})
    m0 = k.row(scr, 8, align="center"); k.inst("marker", m0, {"Number": "1"}); k.text(m0, "Page background", "small", "color/fg/muted")
    card = k.frame(scr, "Card", gap=0, sizingH="fill", bind="color/bg/surface", radius=10, stroke="color/border/subtle")
    th = k.frame(card, "Table head", "horizontal", 10, 10, sizingH="fill", bind="color/bg/surface-sunken", align="center"); k.pad(th, 16, 16)
    k.text(th, "Instrument", "caption", "color/fg/muted"); k.spacer(th); k.inst("marker", th, {"Number": "3"})
    for nm, sel in [("HDFC Bank", 0), ("Infosys", 1), ("Reliance", 0)]:
        rw = k.frame(card, nm, "horizontal", 10, 12, sizingH="fill", bind="color/bg/selected" if sel else "color/bg/surface", align="center"); k.pad(rw, 16, 16)
        k.text(rw, nm, "small", weight=600); k.spacer(rw)
        if sel: k.inst("marker", rw, {"Number": "6"})
        if nm == "HDFC Bank": k.inst("marker", rw, {"Number": "2"})
    menu = k.frame(scr, "Menu", gap=0, pad=6, w=260, bind="color/bg/surface-overlay", radius=10, stroke="color/border/subtle", shadow=(3, (0, 6, 16)))
    for i, it in enumerate(["Modify order", "Cancel order", "View details"]):
        mi = k.frame(menu, it, "horizontal", 8, 8, sizingH="fill", bind="color/bg/item-hover" if i == 0 else None, radius=6, align="center"); k.pad(mi, 10, 10)
        k.text(mi, it, "small", "color/fg/danger" if i == 1 else "color/fg/default")
        if i == 0: k.spacer(mi); k.inst("marker", mi, {"Number": "5"})
    leg = k.frame(r, "Legend", gap=14, sizingH="fill")
    for n, role, why in [(1, "bg/canvas", "The page. Everything else sits on it."),
                         (2, "bg/surface", "Cards, panels, tables — the default home for content."),
                         (3, "bg/surface-sunken", "Set back inside a surface: table heads, wells, code."),
                         (4, "bg/surface-raised", "Stays above content as it scrolls: sticky headers, toolbars."),
                         (5, "bg/surface-overlay", "Opens on top: menus, popovers, dialogs. Items inside hover with bg/item-hover."),
                         (6, "bg/selected", "The chosen item. Pair it with a check or a bold label.")]:
        k.marked(leg, n, role, why)

    s = k.section(b, "02", "Depth = surface + elevation", "In Light, raised and overlay surfaces are white like cards, so the shadow and outline do the separating. In Dark, higher surfaces are also lighter.")
    left = k.with_why(s, "Shadows are hard to see on dark backgrounds, and colour alone is hard to see for some people. Using surface, shadow and outline together means depth still reads when one of them fails.")
    r = k.row(left, 16)
    for mode in ["Light", "Dark"]:
        c = k.frame(r, mode, "horizontal", 16, 24, sizingH="fill", bind="color/bg/canvas", radius=12, stroke="color/border/subtle", align="max")
        k.f.cmd("variable.setMode", ids=[c], collection="Color", mode=mode)
        for i, (bg, lvl, sh, lab) in enumerate([("color/bg/surface", 1, (0, 1, 3), "surface"), ("color/bg/surface-raised", 2, (0, 2, 8), "raised"), ("color/bg/surface-overlay", 3, (0, 6, 16), "overlay")]):
            box = k.frame(c, lab, gap=4, pad=14, w=120, h=70 + i * 24, sizingV=None, bind=bg, radius=10, shadow=(lvl, sh), stroke="color/border/subtle" if lvl == 3 else None)
            k.text(box, lab, "caption", "color/fg/muted")
        k.text(c, mode, "caption", "color/fg/subtle", weight=700)
    k.inst("rule", b, {"Title": "Use the lowest surface that works", "Body": "Most content belongs on bg/surface. Reach for raised or overlay only when something truly sits above the page — every extra layer is something people have to read."}, fill=True)
    return b


def text_icons(k, D):
    k.page("06 Text and icons")
    b = k.board("Learn · 06", "Text and icons",
                "Three text levels are enough for almost any screen. Importance comes from the level you choose, not from inventing new greys.")
    s = k.section(b, "01", "Three levels of text", "The same instrument card, with each line labelled by its role.")
    r = k.row(s, 40, align="min")
    c = k.frame(r, "Example", gap=6, pad=24, w=460, bind="color/bg/surface", radius=12, stroke="color/border/subtle")
    l1 = k.row(c, 8, align="center"); k.text(l1, "Infosys Ltd", "h2"); k.inst("marker", l1, {"Number": "1"})
    l2 = k.row(c, 8, align="center"); k.text(l2, "NSE · IT services · Large cap", "body", "color/fg/muted"); k.inst("marker", l2, {"Number": "2"})
    l3 = k.row(c, 8, align="center"); k.text(l3, "Updated 3:29 PM IST", "small", "color/fg/subtle"); k.inst("marker", l3, {"Number": "3"})
    l4 = k.row(c, 8, align="center"); t = k.text(l4, "View annual report", "body", "color/fg/link"); k.f.cmd("text.style", id=t, textDecoration="underline"); k.inst("marker", l4, {"Number": "4"})
    leg = k.frame(r, "Legend", gap=14, sizingH="fill")
    for n, role, why in [(1, "fg/default", "Main content and headings. If in doubt, use this."),
                         (2, "fg/muted", "Supporting details people read after the main line."),
                         (3, "fg/subtle", "Meta text: timestamps, captions, placeholders. Still 4.5 : 1 — it is text people may need."),
                         (4, "fg/link", "Links. Always underlined, so they don't depend on colour.")]:
        k.marked(leg, n, role, why)

    s = k.section(b, "02", "Icons", "Icons need 3 : 1 against their background. Give them the weight of the text they sit next to.")
    left = k.with_why(s, "An icon that carries meaning on its own — a warning sign, a delete bin — counts as information. If people can't see it, they miss the message.")
    r = k.row(left, 16)
    for glyph, label, role in [("⚙", "Settings", "fg/icon"), ("›", "Chevron", "fg/icon-subtle"), ("!", "Warning", "fg/warning"), ("✓", "Done", "fg/success")]:
        c = k.card(r, 8, 20, align="center")
        k.text(c, glyph, "h1", "color/" + role)
        k.text(c, label, "small", weight=600)
        k.chip(c, role)

    s = k.section(b, "03", "Common mistakes", "Each one looks harmless and causes real problems.")
    r = k.row(s, 20, align="min")
    for title, body in [("A lighter grey for 'less important'", "Use fg/muted or fg/subtle. A custom grey is unchecked and often fails on hover or selected rows."),
                        ("Placeholder as the label", "Placeholders disappear when people type. Keep a visible label in fg/default."),
                        ("Brand colour for long text", "fg/brand is for short emphasis. Paragraphs in brand colour tire the eye and look like links.")]:
        c = k.card(r, 10)
        k.inst("avoid", c)
        k.text(c, title, "h3", fill=True)
        k.text(c, body, "body", "color/fg/muted", fill=True)
    return b


def intent(k, D):
    k.page("07 Intent and status")
    b = k.board("Learn · 07", "Intent and status",
                "Four intents carry meaning: success, warning, danger and info. Each one always comes with words and an icon, because colour alone doesn't reach everyone.")
    s = k.section(b, "01", "What each intent means", "Use the intent that matches what happened, not the colour you want.")
    r = k.row(s, 20, align="min")
    for it, glyph, means, words in [("success", "✓", "Something finished as expected.", "Saved · Executed · Verified"),
                                    ("warning", "!", "Something needs attention soon, but nothing is broken yet.", "Closes soon · Low balance · Pending"),
                                    ("danger", "✕", "Something failed, or an action can't be undone.", "Failed · Rejected · Delete"),
                                    ("info", "i", "Neutral news people may want to know.", "New · Updated · Tip")]:
        c = k.card(r, 10)
        hd = k.row(c, 10, align="center")
        dot = k.frame(hd, "Icon", "horizontal", 0, 0, w=32, h=32, sizingV=None, bind=f"color/bg/{it}-subtle", radius=16, align="center", main="center")
        k.text(dot, glyph, "h3", f"color/fg/{it}")
        k.text(hd, it.capitalize(), "h3")
        k.text(c, means, "body", fill=True)
        k.text(c, words, "small", "color/fg/muted", fill=True)

    s = k.section(b, "02", "Anatomy of an alert", "Four roles, each with a job.")
    r = k.row(s, 40, align="center")
    a = k.frame(r, "Alert", "horizontal", 12, 18, w=560, bind="color/bg/warning-subtle", radius=10)
    ic = k.frame(a, "Icon", gap=6, align="center"); k.text(ic, "!", "h3", "color/fg/warning"); k.inst("marker", ic, {"Number": "2"})
    col = k.frame(a, "Text", gap=4, sizingH="fill")
    t1 = k.row(col, 8, align="center"); k.text(t1, "Market closes in 15 minutes", "body", weight=600); k.inst("marker", t1, {"Number": "3"})
    t2 = k.row(col, 8, align="center"); k.text(t2, "Orders after 3:30 PM go to the next session.", "small", "color/fg/muted"); k.inst("marker", t2, {"Number": "4"})
    k.inst("marker", a, {"Number": "1"})
    leg = k.frame(r, "Legend", gap=14, sizingH="fill")
    for n, role, why in [(1, "bg/warning-subtle", "A light tint groups the message. Text on it stays readable."),
                         (2, "fg/warning", "The icon carries the intent colour."),
                         (3, "fg/default", "The title is the message — normal text colour."),
                         (4, "fg/muted", "Details support the title.")]:
        k.marked(leg, n, role, why)

    s = k.section(b, "03", "Rules for intent", "Short and strict.")
    for t, body in [("Words first, colour second", "Write the status in words ('Rejected'), then add colour and an icon. Never the other way round."),
                    ("Gain and loss always carry ▲ ▼ or + −", "Red and green look alike to about 1 in 12 men. The arrow is what makes the number readable."),
                    ("Brand is not an intent", "Brand colour means 'this is us', not 'this succeeded'. Don't use it for status."),
                    ("Danger is for real danger", "Using red for decoration teaches people to ignore it when it matters.")]:
        k.inst("rule", s, {"Title": t, "Body": body}, fill=True)
    return b


def states(k, D):
    k.page("08 Interactive states")
    b = k.board("Learn · 08", "Interactive states",
                "Hover, pressed and selected each have their own role. They move in the direction that keeps text readable — usually darker for a white label, lighter for a black one.")
    s = k.section(b, "01", "How a button's states are made", "The fill steps through grades; the label keeps a gap of 50 or more at every step.")
    r = k.row(s, 24, align="min")
    for br in [D["brands"][0], D["brands"][3]]:
        c = k.card(r, 14)
        k.text(c, f"{br['label']} · {br['hex']}", "h3")
        k.text(c, f"Brand sits at grade {br['grade']}, so the fill uses grade {br['fillGrade']} with {'white' if br['on'] == '#FFFFFF' else 'black'} text.", "small", "color/fg/muted", fill=True)
        rr = k.row(c, 12, align="max")
        for lab, fillhex in [("Default", br["fill"]), ("Hover", br["hover"]), ("Pressed", br["pressed"])]:
            col = k.frame(rr, lab, gap=6, align="center")
            bt = k.frame(col, "Button", "horizontal", 0, 0, fill=fillhex, radius=4, align="center"); k.pad(bt, 18, 18, 10, 10)
            k.text(bt, "Buy", "small", br["on"], weight=600)
            k.text(col, lab, "caption", "color/fg/muted")
    k.inst("note", s, {"Body": "Bright brands (orange, lime, yellow) get black labels automatically: white on them can't reach 4.5 : 1. The engine decides from the brand's grade."}, fill=True)

    s = k.section(b, "02", "Two ways to show hover", "Tints for low surfaces, solid item colours inside menus and dialogs.")
    left = k.with_why(s, "In Dark, lifting a menu or dialog surface even slightly closes the gap to the text above it. We measured it: a white tint drops brand text to 2.8 : 1. So items in overlays step to a solid shade instead.")
    r = k.row(left, 20, align="min")
    for mode in ["Light", "Dark"]:
        c = k.frame(r, mode, gap=12, pad=20, sizingH="fill", bind="color/bg/canvas", radius=12, stroke="color/border/subtle")
        k.f.cmd("variable.setMode", ids=[c], collection="Color", mode=mode)
        k.text(c, mode, "caption", "color/fg/subtle", weight=700)
        sv = k.frame(c, "On surface", gap=4, pad=8, sizingH="fill", bind="color/bg/surface", radius=8)
        for lab, bg in [("Row", None), ("Hover · bg/state-hover", "color/bg/state-hover"), ("Pressed · bg/state-pressed", "color/bg/state-pressed")]:
            it = k.frame(sv, lab, "horizontal", 0, 8, sizingH="fill", bind=bg, radius=6); k.pad(it, 10, 10)
            k.text(it, lab, "small")
        ov = k.frame(c, "In a menu", gap=4, pad=8, sizingH="fill", bind="color/bg/surface-overlay", radius=8, stroke="color/border/subtle", shadow=(3, (0, 6, 16)))
        for lab, bg in [("Menu item", None), ("Hover · bg/item-hover", "color/bg/item-hover"), ("Pressed · bg/item-pressed", "color/bg/item-pressed")]:
            it = k.frame(ov, lab, "horizontal", 0, 8, sizingH="fill", bind=bg, radius=6); k.pad(it, 10, 10)
            k.text(it, lab, "small")

    s = k.section(b, "03", "Selected, focused, disabled", "Three states people confuse. Each has a different job.")
    r = k.row(s, 20, align="min")
    c = k.card(r, 10)
    it = k.frame(c, "Selected", "horizontal", 8, 10, sizingH="fill", bind="color/bg/selected", radius=6, align="center"); k.pad(it, 12, 12)
    k.text(it, "✓  Infosys", "small", weight=600)
    k.text(c, "Selected", "h3"); k.text(c, "This is the chosen one. bg/selected plus a check or bold text — persistent until changed.", "small", "color/fg/muted", fill=True)
    c = k.card(r, 10)
    rg = k.ring(c); k.btn(rg, "color/action/secondary/bg", "color/action/secondary/fg", "Cancel", border="color/action/secondary/border")
    k.text(c, "Focused", "h3"); k.text(c, "Where the keyboard is. A 2px border/focus ring with a 2px gap — never removed, never replaced by colour alone.", "small", "color/fg/muted", fill=True)
    c = k.card(r, 10)
    k.btn(c, "color/action/disabled/bg", "color/action/disabled/fg", "Place order", border="color/action/disabled/border")
    k.text(c, "Disabled", "h3"); k.text(c, "Not available right now. Exempt from contrast, so never put information in disabled text — explain why it's disabled nearby.", "small", "color/fg/muted", fill=True)
    return b


def dark_mode(k, D):
    k.page("09 Dark mode")
    b = k.board("Learn · 09", "Dark mode",
                "Dark mode is remapped, not inverted. Every role points to a different shade in Dark, chosen so the same pairs pass. You design once with roles; the mode does the rest.")
    s = k.section(b, "01", "One design, two modes", "The same frame with its mode switched. Nothing was redrawn.")
    r = k.row(s, 24)
    for mode in ["Light", "Dark"]:
        c = k.frame(r, mode, gap=14, pad=24, sizingH="fill", bind="color/bg/canvas", radius=14, stroke="color/border/subtle")
        k.f.cmd("variable.setMode", ids=[c], collection="Color", mode=mode)
        k.text(c, mode, "caption", "color/fg/subtle", weight=700)
        cd = k.frame(c, "Card", gap=8, pad=20, sizingH="fill", bind="color/bg/surface", radius=12, stroke="color/border/subtle")
        k.text(cd, "Total value", "small", "color/fg/muted")
        k.text(cd, "₹12,48,930.50", "h1")
        k.text(cd, "▲ +2.41% today", "body", "color/fg/gain", weight=600)
        al = k.frame(cd, "Alert", "horizontal", 10, 12, sizingH="fill", bind="color/bg/info-subtle", radius=8)
        k.text(al, "i", "body", "color/fg/info", weight=700); k.text(al, "Your October statement is ready.", "small", fill=True)
        k.btn(cd, "color/action/primary/bg", "color/action/primary/fg", "Invest more")

    s = k.section(b, "02", "How roles move", "Light text grades sit high on the scale, Dark ones low — the gap between them stays 50 or more.")
    tbl = k.card(s, 0, 0)
    head = k.frame(tbl, "Head", "horizontal", 24, 14, sizingH="fill", bind="color/bg/surface-sunken"); k.pad(head, 28, 28)
    for t, w in [("Role", 320), ("Light", 220), ("Dark", 220)]:
        c = k.frame(head, t, w=w); k.text(c, t, "caption", "color/fg/muted", weight=700)
    for rm in D["remap"]:
        rw = k.frame(tbl, rm["v"], "horizontal", 24, 12, sizingH="fill", align="center", stroke="color/border/subtle"); k.pad(rw, 28, 28)
        k.f.tool("set_properties", ids=[rw], props={"strokeSides": [1, 0, 0, 0]})
        c = k.frame(rw, "Role", w=320); k.chip(c, rm["v"].replace("color/", ""))
        for val in [rm["light"], rm["dark"]]:
            c = k.frame(rw, "v", w=220); k.text(c, val, "mono", "color/fg/default")

    s = k.section(b, "03", "Checking your design in Dark", "Four quick checks before handoff.")
    for t, body in [("Switch the frame, not the colours", "In Figma, select the frame and change its Color mode in the right panel. In code, set data-theme=\"dark\" on <html>."),
                    ("Look for hard-coded colours", "Anything that didn't change is a raw hex or a primitive. Replace it with a role."),
                    ("Check images and illustrations", "White backgrounds in images glow in Dark. Use transparent images or add a surface behind them."),
                    ("Don't trust shadows", "Shadows fade on dark surfaces. Floating things also need their lighter surface and an outline.")]:
        k.inst("rule", s, {"Title": t, "Body": body}, fill=True)
    return b


def brand(k, D):
    k.page("10 Bring your brand")
    b = k.board("Learn · 10", "Bring your brand",
                "Change one colour and the whole system follows: scales, roles, states, focus and checks. The engine also decides what text goes on your brand fill, so it can't fail.")
    s = k.section(b, "01", "Four brands, same rules", "The same components with four different brand colours. Every pair still passes.")
    r = k.row(s, 20, align="min")
    for br in D["brands"]:
        c = k.card(r, 12, 20)
        sw = k.frame(c, "Swatch", "horizontal", 0, 0, h=56, sizingV=None, sizingH="fill", fill=br["hex"], radius=8)
        k.text(c, br["label"], "h3")
        k.text(c, f"{br['hex']} · grade {br['grade']}", "mono", "color/fg/muted")
        bt = k.frame(c, "Button", "horizontal", 0, 0, fill=br["fill"], radius=4, align="center", main="center", sizingH="fill"); k.pad(bt, 18, 18, 10, 10)
        k.text(bt, "Place order", "small", br["on"], weight=600)
        k.text(c, f"Label {'white' if br['on'] == '#FFFFFF' else 'black'} · {br['ratio']:.2f} : 1", "small", "color/fg/default")
        lk = k.text(c, "View statement", "small", br["link"]); k.f.cmd("text.style", id=lk, textDecoration="underline")
        sel = k.frame(c, "Selected", "horizontal", 0, 8, sizingH="fill", fill=br["selected"], radius=6); k.pad(sel, 10, 10)
        k.text(sel, "✓ Selected row", "small", "color/fg/default")
        fr = k.frame(c, "Focus", "horizontal", 0, 4, radius=8, align="center")
        k.f.tool("set_properties", ids=[fr], props={"strokes": [br["focus"]], "strokeWeight": 2, "strokeAlign": "inside"})
        inp = k.frame(fr, "Input", "horizontal", 0, 0, w=180, h=36, sizingV=None, bind="color/bg/surface", radius=4, align="center", stroke="color/border/input"); k.pad(inp, 10)
        k.text(inp, "Focused input", "small", "color/fg/subtle")

    s = k.section(b, "02", "What changes, what stays", "So you know what to review after a brand change.")
    r = k.row(s, 24, align="min")
    c = k.card(r, 10)
    k.chip(c, "Follows your brand", "color/bg/brand-subtle", "color/fg/brand", mono=False); k.text(c, "Changes with your brand", "h3")
    for t in ["The brand scale and every brand role", "Primary buttons, links, selected rows, focus rings", "The neutral greys — tinted slightly towards your hue", "Label colour on the brand fill (white or black)"]:
        k.text(c, "•  " + t, "body", fill=True)
    c = k.card(r, 10)
    k.chip(c, "Fixed on purpose", "color/bg/surface-sunken", "color/fg/muted", mono=False); k.text(c, "Stays the same on purpose", "h3")
    for t in ["Success, warning, danger and info hues — their meaning must not drift", "Gain and loss colours", "The chart palette — tuned for colour-blind readers", "All contrast rules and checks"]:
        k.text(c, "•  " + t, "body", fill=True)

    s = k.section(b, "03", "How to change it", "Four steps. Nothing is edited by hand.")
    r = k.row(s, 16, align="min")
    for n, t, body in [("1", "Set the brand colour", "In engine/config, set color.brand to your hex."),
                       ("2", "Build", "Run npm run build. The engine computes every shade and runs every check."),
                       ("3", "Read the report", "report.html shows where your brand sits and what text it takes."),
                       ("4", "Update Figma", "Import the new variables (or rebuild this file). Your designs update through their roles.")]:
        c = k.card(r, 8)
        k.inst("marker", c, {"Number": n})
        k.text(c, t, "h3", fill=True)
        k.text(c, body, "small", "color/fg/muted", fill=True)
    return b


def extending(k, D):
    k.page("11 Extending safely")
    b = k.board("Learn · 11", "Extending safely",
                "Sometimes a product needs a role the system doesn't have. Add it to the system — named, graded and checked — never as a one-off colour in a file.")
    s = k.section(b, "01", "Before you add anything", "Most 'new colour' requests already have an answer.")
    r = k.row(s, 20, align="min")
    for q, a in [("Is it a state of something?", "Use the existing state: hover, pressed, selected, subtle."),
                 ("Is it a status?", "Use an intent: success, warning, danger, info."),
                 ("Is it just 'a bit lighter'?", "Use the next text or surface level: muted, subtle, sunken.")]:
        c = k.card(r, 8)
        k.text(c, q, "h3", fill=True)
        k.text(c, a, "body", "color/fg/muted", fill=True)

    s = k.section(b, "02", "Adding a role in five steps", "Worked example: a highlight background for a promotion banner.")
    left = k.with_why(s, "A role added this way gets a Light and a Dark value, shows up in Figma, CSS and Tailwind, and is checked on every build. A hex pasted into a file gets none of that.")
    for n, t, body in [("1", "Name it by its job", "color/bg/highlight — group bg, role highlight. Not 'bg/light-purple'."),
                       ("2", "Choose grades with the gap rule", "Text on it is fg/default (grade 90 in Light, 5 in Dark). Pick brand 15 in Light (gap 75) and brand 85 in Dark (gap 80)."),
                       ("3", "List its pairs", "fg/default, fg/muted and fg/link may sit on it. Add those to the pair contract."),
                       ("4", "Build and check", "The engine measures every listed pair in both modes. A failure stops the build."),
                       ("5", "Document it", "Add one line to the Roles page: what it's for and when not to use it.")]:
        c = k.card(left, 16, 20, direction="horizontal", align="min")
        k.inst("marker", c, {"Number": n})
        col = k.frame(c, "Text", gap=4, sizingH="fill")
        k.text(col, t, "h3")
        k.text(col, body, "body", "color/fg/muted", fill=True)

    s = k.section(b, "03", "Never", "These undo the guarantees the system gives you.")
    r = k.row(s, 20, align="min")
    for t, body in [("Paste a hex code", "It won't switch in Dark, won't follow a brand change, and nobody checks it."),
                    ("Use a primitive in a design", "brand/60 has no meaning and no pair list. Roles do."),
                    ("Rename a role to change its colour", "Names are a contract with code. Change the value in the engine instead.")]:
        c = k.card(r, 10)
        k.inst("avoid", c)
        k.text(c, t, "h3", fill=True)
        k.text(c, body, "body", "color/fg/muted", fill=True)
    return b


LEARN = [start_here, grades, anatomy, choosing, surfaces, text_icons, intent, states, dark_mode, brand, extending]

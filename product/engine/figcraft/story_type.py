"""Typography foundation as one systematic story: 11 chapters, each = explain → examples → styles → rules.
Every text style is documented on exactly one chapter (checked at build time). All copy is original (clean-room)."""
import json

GROUP = {"Five principles": "Idea", "The type scale": "Idea", "How tokens are built": "Structure", "Fonts, weights and spacing": "Structure",
         "Headings and display": "Styles", "Titles and labels": "Styles", "Reading text": "Styles", "Numbers and data": "Styles",
         "Across screen sizes": "Combining", "Choosing and using type": "Using", "Readers' settings and brands": "Using"}
TEASER = {"The type scale": "one rule behind every size", "How tokens are built": "tiers, collections, modes and names", "Fonts, weights and spacing": "the raw material of every style",
          "Headings and display": "the page and its outline", "Titles and labels": "components and the text people act on", "Reading text": "paragraphs, help text and code",
          "Numbers and data": "digits that line up", "Across screen sizes": "four breakpoints, one hierarchy", "Choosing and using type": "a decision guide and real screens",
          "Readers' settings and brands": "bigger text, more spacing, other fonts"}
BPS = ["sm", "md", "lg", "xl"]
documented = []  # every style put in a style table
CH = []  # chapter titles, from the data


# ------------------------------------------------------------ helpers
def S(D, name):
    return next(s for s in D["styles"] if s["name"] == name)


def spec(k, parent, text, style, color="color/fg/default", fill=False, width=None, name=None):
    """Text set in a real ds text style (bound to the Responsive variables)."""
    f = k.f
    nid = f.tool("create_node", type="text", parent=parent, text=text, name=name or style, props={"fontFamily": "Inter", "fontSize": 16, "lineHeight": 24})["id"]
    f.cmd("style.apply", ids=[nid], style=k.styles[style.replace(".", "/")])
    if color.startswith("#"): f.tool("set_properties", ids=[nid], props={"fills": [color]})
    else: f.cmd("variable.bind", ids=[nid], field="fill", variable=color)
    if width:
        f.tool("set_properties", ids=[nid], props={"width": width}); f.tool("set_properties", ids=[nid], props={"sizingH": "fixed"})
    if fill: f.tool("set_properties", ids=[nid], props={"sizingH": "fill"})
    if "numeric" in style: f.cmd("text.setFeatures", ids=[nid], features={"tnum": True})
    return nid


def raw(k, parent, text, size, lh=None, weight=400, family="Inter", ls=None, color="color/fg/default", name="illustration"):
    """Plain text for illustrations of primitives (sizes, weights, spacing) — not a style on purpose."""
    props = {"fontFamily": family, "fontSize": size, "fontWeight": weight, "lineHeight": lh or round(size * 1.25)}
    if ls is not None: props["letterSpacing"] = ls
    nid = k.f.tool("create_node", type="text", parent=parent, text=text, name=name, props=props)["id"]
    if color.startswith("#"): k.f.tool("set_properties", ids=[nid], props={"fills": [color]})
    else: k.f.cmd("variable.bind", ids=[nid], field="fill", variable=color)
    return nid


def mode(k, nid, bp):
    k.f.cmd("variable.setMode", ids=[nid], collection="Responsive", mode=bp)


def start(k, title, lead, w=1440):
    k.page(title)
    b = k.frame(name=title, w=w, pad=80, gap=72, bind="color/bg/canvas")
    k.f.cmd("variable.setMode", ids=[b], collection="Color", mode="Light")
    mode(k, b, "lg")
    k.inst("page", b, {"Eyebrow": f"Typography · {GROUP[title]}", "Title": title, "Lead": lead}, fill=True)
    return b


def finish(k, b, title):
    i = CH.index(title)
    if i + 1 >= len(CH):
        c = k.card(b, 8, 24, bind="color/bg/brand-subtle")
        k.text(c, "End of the typography foundation", "h3")
        k.text(c, "You've seen where every size comes from, what each style is for and how text survives readers' settings. Next in the system: Spacing.", "body", "color/fg/muted", fill=True)
        return
    t = CH[i + 1]
    c = k.frame(b, "Next", "horizontal", 16, 24, sizingH="fill", bind="color/bg/surface", radius=16, stroke="color/border/subtle", align="center")
    col = k.frame(c, "Text", gap=4, sizingH="fill")
    k.text(col, "NEXT", "caption", "color/fg/subtle", weight=700)
    k.text(col, t, "h3")
    k.text(col, TEASER[t].capitalize() + ".", "small", "color/fg/muted")
    k.text(c, "→", "h1", "color/fg/brand")


def rules(k, parent, items, title="Rules"):
    s = k.frame(parent, title, gap=14, sizingH="fill")
    k.text(s, title, "h3")
    for t, body in items:
        k.inst("rule", s, {"Title": t, "Body": body}, fill=True)


def grid_table(k, parent, cols, rows, cell=None):
    """A simple table card. cols: [(title, width|None)]; rows: [[values]]; cell(row_frame, col_index, value, width) draws custom cells."""
    tbl = k.card(parent, 0, 0)
    head = k.frame(tbl, "Head", "horizontal", 20, 12, sizingH="fill", bind="color/bg/surface-sunken"); k.pad(head, 24, 24)
    for t, w in cols:
        c = k.frame(head, t, w=w, sizingH=None if w else "fill"); k.text(c, t, "caption", "color/fg/muted", weight=700)
    for vals in rows:
        row = k.frame(tbl, str(vals[0]), "horizontal", 20, 12, sizingH="fill", align="center", stroke="color/border/subtle"); k.pad(row, 24, 24)
        k.f.tool("set_properties", ids=[row], props={"strokeSides": [1, 0, 0, 0]})
        for i, ((t, w), v) in enumerate(zip(cols, vals)):
            c = k.frame(row, t, w=w, sizingH=None if w else "fill")
            if cell and cell(c, i, v, w): continue
            k.text(c, str(v), "small", fill=not w)
    return tbl


SAMPLE = {"display": "Ag", "heading": "Ag", "title": "Ag", "body": "Ag", "label": "Ag", "caption": "Ag", "code": "{a}", "numeric": "1,248"}


SINGULAR = {"Headings": "Heading", "Titles": "Title", "Labels": "Label", "Numbers": "Number", "Captions and code": "Caption and code"}


def style_table(k, parent, D, names, title):
    """Styles with a live specimen at each breakpoint (each cell sets its own Responsive mode)."""
    s = k.frame(parent, title, gap=14, sizingH="fill")
    hd = k.row(s, 12, align="center"); k.text(hd, title, "h3"); k.text(hd, "size / line height in px · L = large text", "small", "color/fg/muted")
    tbl = k.card(s, 0, 0)
    head = k.frame(tbl, "Head", "horizontal", 16, 12, sizingH="fill", bind="color/bg/surface-sunken"); k.pad(head, 24, 24)
    for t, w in [("Style", 210)] + [(f"{b['name']} · from {b['min']}px", 170) for b in D["breakpoints"]] + [("Use", None)]:
        c = k.frame(head, t, w=w, sizingH=None if w else "fill"); k.text(c, t, "caption", "color/fg/muted", weight=700)
    for n in names:
        st = S(D, f"type.{n}")
        documented.append(st["name"])
        row = k.frame(tbl, st["name"], "horizontal", 16, 14, sizingH="fill", align="center", stroke="color/border/subtle"); k.pad(row, 24, 24)
        k.f.tool("set_properties", ids=[row], props={"strokeSides": [1, 0, 0, 0]})
        c = k.frame(row, "Style", gap=4, w=210)
        k.text(c, st["figma"], "mono")
        k.text(c, f"{st['weight']} {st['weightValue']}" + (" · tabular" if st["tabular"] else "") + (" · mono" if st["family"] == "mono" else ""), "caption", "color/fg/muted", weight=400)
        for bp in BPS:
            v = st["breakpoints"][bp]
            cell = k.frame(row, bp, gap=4, w=170)
            mode(k, cell, bp)
            spec(k, cell, SAMPLE[st["role"]], st["name"])
            k.text(cell, f"{v['size']}/{v['lineHeight']}" + (" · L" if v["large"] else ""), "caption", "color/fg/muted", weight=400)
        c = k.frame(row, "Use", gap=4, sizingH="fill")
        k.text(c, st["use"], "small", fill=True)
        if st["html"]: k.text(c, "Default for " + ", ".join(f"<{h}>" for h in st["html"]), "caption", "color/fg/subtle", weight=400)
    return s


def card_mock(k, parent, w=380, tagged=True):
    """A project card styled one question at a time, each part tagged with its style."""
    c = k.frame(parent, "Project card", gap=10, pad=20, w=w, bind="color/bg/surface", radius=12, stroke="color/border/subtle")
    def line(text, style, color="color/fg/default"):
        r = k.row(c, 8, align="center"); spec(k, r, text, style, color)
        if tagged: k.tag(r, style.replace("type.", ""))
        return r
    line("Website redesign", "type.title.md")
    line("Marketing · 12 tasks", "type.caption.md", "color/fg/muted")
    r = k.frame(c, "Description", gap=6, sizingH="fill"); spec(k, r, "New pages, a faster checkout and a clearer price table.", "type.body.sm", fill=True)
    if tagged: k.tag(r, "body.sm")
    line("1,248 hours", "type.numeric.md")
    br = k.row(c, 8, align="center")
    b = k.frame(br, "Button", "horizontal", 8, 0, bind="color/action/primary/bg", radius=4, align="center"); k.pad(b, 16, 16, 9, 9)
    spec(k, b, "Open project", "type.label.md", "color/action/primary/fg")
    bd = k.frame(br, "Badge", "horizontal", 0, 0, bind="color/bg/brand-subtle", radius=99, align="center"); k.pad(bd, 10, 10, 2, 2)
    spec(k, bd, "Beta", "type.label.sm", "color/fg/brand")
    if tagged: k.tag(br, "label.md"); k.tag(br, "label.sm")
    return c


# ------------------------------------------------------------ Five principles
def principles(k, D):
    b = start(k, "Five principles", "Five principles shape every type decision in this system. Each one is checked by the build, not left to taste — the demo next to it shows what it means.")
    s = k.section(b, "The principles", "Read them once; every chapter after this one applies them.")
    items = [
        ("Readable by construction", f"Reading styles keep a line height of {D['readingLh']} or more, and nothing is smaller than {D['minSize']}px, at every breakpoint. A style that breaks either rule can't be generated.", "lh"),
        ("Roles, not sizes", "Designs use named styles like type/body/md. A style carries its size, line height, letter-spacing and weight for every screen width; a number like 15px carries none of that.", "role"),
        ("Headings move, text stays", "Only display and heading styles change with the screen. Text people read and operate keeps one size everywhere, so forms, tables and buttons look the same on every device.", "move"),
        ("Numbers line up", "Number styles use tabular numerals, so every digit has the same width and columns of figures read as columns.", "num"),
        ("Survives the reader's settings", "Sizes follow the browser's text size, and pages are checked with text at 200% and with the WCAG text-spacing override. Boxes grow; text is never cut off.", "settings"),
    ]
    for t, body, demo in items:
        c = k.frame(s, t, "horizontal", 32, 28, sizingH="fill", bind="color/bg/surface", radius=16, stroke="color/border/subtle", align="center")
        col = k.frame(c, "Text", gap=6, sizingH="fill")
        k.text(col, t, "h2"); k.text(col, body, "body", "color/fg/muted", fill=True)
        d = k.frame(c, "Demo", "horizontal", 14, 18, w=400, bind="color/bg/surface-sunken", radius=12, align="center", main="center")
        if demo == "lh":
            col2 = k.frame(d, "p", gap=6, sizingH="fill")
            spec(k, col2, "Lines of reading text keep room between them, so the eye finds the next one.", "type.body.md", fill=True)
            bm = S(D, "type.body.md")["breakpoints"]["lg"]
            k.text(col2, f"body/md · {bm['size']}/{bm['lineHeight']} · {bm['ratio']:.2f}", "caption", "color/fg/muted", mono=True)
        elif demo == "role":
            k.chip(d, "type/body/md"); k.text(d, "→", "body", "color/fg/muted")
            col2 = k.frame(d, "w", gap=2); k.text(col2, "one name", "small", weight=600); k.text(col2, "every width", "caption", "color/fg/muted", weight=400)
        elif demo == "move":
            for bp in ["sm", "lg"]:
                m = k.frame(d, bp, gap=4, pad=12, w=170, bind="color/bg/surface", radius=8, stroke="color/border/subtle")
                mode(k, m, bp)
                k.text(m, bp, "caption", "color/fg/subtle", weight=700)
                spec(k, m, "Projects", "type.heading.lg")
                spec(k, m, "12 open", "type.body.md", "color/fg/muted")
        elif demo == "num":
            for lab, flat in [("Proportional", False), ("Tabular", True)]:
                m = k.frame(d, lab, gap=6, align="max")
                nid = raw(k, m, "1,111.11\n8,888.88", 24, 32, 600)
                if flat:
                    k.f.cmd("text.setFeatures", ids=[nid], features={"tnum": True})
                    k.f.cmd("vector.flatten", ids=[nid])
                k.text(m, lab, "caption", "color/fg/muted", weight=400)
        else:
            for lab, size, lh in [("100% text", 16, 24), ("200% text", 32, 48)]:
                m = k.frame(d, lab, gap=4, pad=10, bind="color/bg/surface", radius=8, stroke="color/border/subtle")
                raw(k, m, "Save", size, lh, 500)
                k.text(m, lab, "caption", "color/fg/muted", weight=400)
    s = k.section(b, "How this foundation is organised", "The chapters follow the order you'd build a type system in: the idea, the structure, the raw material, the styles, how they combine, how to use them.")
    grid = k.row(s, 16, wrap=True)
    for t in CH:
        c = k.frame(grid, t, gap=6, pad=18, w=308, bind="color/bg/surface", radius=12, stroke="color/border/subtle")
        k.text(c, GROUP[t].upper(), "caption", "color/fg/subtle", weight=700)
        k.text(c, t, "body", weight=600, fill=True)
        k.text(c, TEASER.get(t, "the principles behind every decision").capitalize(), "small", "color/fg/muted", fill=True)
    finish(k, b, "Five principles")
    return b


# ------------------------------------------------------------ The type scale
def scale(k, D):
    b = start(k, "The type scale", "Every size comes from one rule: base × ratio ^ step. The ratio depends on the screen width, and sizes are rounded so they sit on a grid. This chapter shows the rule and the numbers it makes.")
    s = k.section(b, "One rule for every size", "Step 0 is the base size. Each step up multiplies by the ratio; each step down divides by it.")
    r = k.row(s, 16, align="min")
    c = k.card(r, 10, 28, bind="color/bg/brand-subtle")
    k.text(c, "base × ratio ^ step", "h2"); k.text(c, f"base {D['base']}px · ratios " + " · ".join(f"{bp['name']} {bp['ratio']}" for bp in D["breakpoints"]), "small", "color/fg/muted")
    for t, body in [("Rounding", "Below 32px a size becomes a whole even pixel; from 32px up it lands on the 4px grid, the same grid as spacing."),
                    ("Two kinds of style", "Display and heading styles take the ratio of the current breakpoint. Every other style always uses the small-screen ratio, so it keeps one size.")]:
        cc = k.card(r, 8, 28); k.text(cc, t, "h3"); k.text(cc, body, "body", "color/fg/muted", fill=True)
    s = k.section(b, "The steps", "Every step at every breakpoint. Styles that stay use the sm column everywhere.")
    def cell(c, i, v, w):
        if i in (5, 6):
            w_ = k.row(c, 6, wrap=True)
            for n in v: k.chip(w_, n.replace("type.", "").replace(".", "/"))
            if not v: k.text(w_, "—", "small", "color/fg/subtle")
            return True
        if i == 0: k.text(c, str(v), "body", weight=600); return True
    grid_table(k, s, [("Step", 70), ("sm", 80), ("md", 80), ("lg", 80), ("xl", 80), ("Styles that stay", 470), ("Styles that move", None)],
               [[st["step"], *[st["sizes"][bp] for bp in BPS], st["stays"], st["moves"]] for st in D["steps"]], cell)
    s = k.section(b, "The ladder at lg", "Each step drawn at its lg size — the steps grow evenly, so the gap between neighbours always reads.")
    lad = k.card(s, 28, 32, direction="horizontal", align="max")
    for st in D["steps"]:
        col = k.frame(lad, str(st["step"]), gap=6, align="center")
        raw(k, col, "Ag", st["sizes"]["lg"], round(st["sizes"]["lg"] * 1.2), 600)
        k.text(col, f"{st['sizes']['lg']}", "caption", "color/fg/muted", weight=400)
    s = k.section(b, "Line height comes from the kind of text", "Each kind has a minimum ratio. The line height is size × ratio, rounded up to the next even pixel — so it never falls below the minimum.")
    r = k.row(s, 16, align="min")
    ex = {"display": ("type.display.sm", "Big\nidea"), "heading": ("type.heading.sm", "Section\nheading"), "title": ("type.title.md", "Card title\non two lines"),
          "label": ("type.label.md", "A label that\nwraps"), "reading": ("type.body.md", "Paragraph text\nread in lines")}
    for kd in D["kinds"]:
        name, txt = ex[kd["kind"]]
        v = S(D, name)["breakpoints"]["lg"]
        c = k.card(r, 10, 20)
        k.text(c, kd["kind"].capitalize(), "caption", "color/fg/subtle", weight=700)
        spec(k, c, txt, name)
        k.text(c, f"≥ {kd['lh']:.2f}", "h3")
        k.text(c, f"{name.replace('type.', '')}: {v['size']}/{v['lineHeight']} ({v['ratio']:.2f})", "caption", "color/fg/muted", mono=True)
        k.text(c, kd["about"], "small", "color/fg/muted", fill=True)
    rules(k, b, [("Never add a size between steps", "A 15px or 17px text breaks the rhythm and isn't checked. If no style fits, add a style on a step (last chapter)."),
                 ("Pick a style, not a step", "Steps are how styles are made. Designs and code use the styles.")])
    finish(k, b, "The type scale")
    return b


# ------------------------------------------------------------ How tokens are built
def tokens(k, D):
    b = start(k, "How tokens are built", "Type comes in tiers: raw primitives at the bottom, named styles in the middle, component text on top. Each tier only points to the one below it.")
    s = k.section(b, "Tiers", "Designs and code only ever touch the middle tier.")
    r = k.row(s, 16, align="center")
    tiers = [("Primitives", "Primitives · hidden", ["font/size/16", "font/weight/semibold", "font/family/sans"], "Raw values: families, weights, sizes, letter-spacings. No meaning."),
             ("Styles", "Responsive · sm md lg xl", ["type/body/md", "type/heading/lg", "type/numeric/md"], "Named by job. Five values per breakpoint, and one text style each."),
             ("Components", "Coming with components", ["button/label", "input/help"], "Point to styles. Added when components ship.")]
    for i, (t, sub, ex, body) in enumerate(tiers):
        c = k.card(r, 10, 24, bind="color/bg/brand-subtle" if i == 1 else "color/bg/surface")
        k.text(c, t, "h2"); k.text(c, sub, "caption", "color/fg/subtle", weight=700)
        for e in ex: k.chip(c, e)
        k.text(c, body, "small", "color/fg/muted", fill=True)
        if i < 2: k.text(r, "→", "h1", "color/fg/subtle")
    s = k.section(b, "Collections, modes and text styles", "How the tiers appear in Figma's Variables panel and text styles list.")
    grid_table(k, s, [("Where", 220), ("Modes", 220), ("Count", 140), ("Published", 160), ("Holds", None)], [
        ["Primitives collection", "Value", str(D["counts"]["prims"]), "Hidden", "Families, weights, sizes and letter-spacings"],
        ["Responsive collection", "sm · md · lg · xl", str(D["counts"]["variables"] - D["counts"]["prims"]), "Yes", "For every style: family, size, weight, font style, line height and letter-spacing per breakpoint"],
        ["Text styles", "follow the frame", str(D["counts"]["styles"]), "Yes", "One per style, each property bound to its Responsive variable"]])
    s = k.section(b, "Reading a name", "Category, role, size — general to specific. The screen size is never in the name; it's a mode.")
    c = k.card(s, 18, 32, direction="horizontal", align="max")
    for i, (p, part) in enumerate([("type", "Category"), ("/  body", "Role"), ("/  md", "Size")]):
        col = k.frame(c, part, gap=10, align="center")
        k.text(col, p, "h1", "color/fg/brand" if part == "Role" else "color/fg/default")
        k.text(col, part.upper(), "caption", "color/fg/subtle", weight=700)
    leg = k.row(s, 24, align="min")
    for t, sub in [("Category", "Which foundation. Always type here."), ("Role", "What the text is: display, heading, title, body, label, caption, code, numeric."),
                   ("Size", "sm, md or lg within the role. body/sm is the small body text, not body on small screens.")]:
        k.marked(leg, t, sub, mono=False)
    s = k.section(b, "What a style holds", "Five values for each breakpoint, plus two switches some styles have.")
    grid_table(k, s, [("Property", 220), ("Points to", 420), ("In code", None)], [
        ["Family", "font/family/sans or font/family/mono", "font-family"], ["Size", "font/size/<px>", "font-size in rem"], ["Weight", "font/weight/<name>", "font-weight"],
        ["Line height", "computed per breakpoint (px)", "line-height, no unit"], ["Letter-spacing", "computed from font/letter-spacing (px per breakpoint)", "letter-spacing in em"],
        ["Tabular numerals", "number styles only", "font-variant-numeric: tabular-nums"], ["Upper case", "only styles made for capitals", "text-transform: uppercase"]])
    s = k.section(b, "One name, four places", "Designers and developers say the same word for the same style.")
    r = k.row(s, 16)
    eg = S(D, "type.body.md")
    for t, v in [("Figma text style", eg["figma"]), ("CSS class", "." + eg["cssClass"]), ("CSS variables", eg["cssVars"]["fontSize"] + " …"), ("Tailwind", eg["tailwind"])]:
        c = k.card(r, 8, 20); k.text(c, t, "caption", "color/fg/subtle", weight=700); k.text(c, v, "mono", fill=True)
    s = k.section(b, "One style, four widths", "The same two styles in four frames, each set to a different Responsive mode. The heading moves; the paragraph doesn't.")
    r = k.row(s, 16, align="min")
    for bp in D["breakpoints"]:
        m = k.frame(r, bp["name"], gap=8, pad=20, sizingH="fill", bind="color/bg/surface", radius=12, stroke="color/border/subtle")
        mode(k, m, bp["name"])
        k.text(m, f"{bp['name']} · from {bp['min']}px", "caption", "color/fg/subtle", weight=700)
        spec(k, m, "This week", "type.heading.md")
        spec(k, m, "Twelve tasks moved to done.", "type.body.md", "color/fg/muted", fill=True)
    finish(k, b, "How tokens are built")
    return b


# ------------------------------------------------------------ Fonts, weights and spacing
def fonts(k, D):
    b = start(k, "Fonts, weights and spacing", "The raw material every style is made from: two families, four weights, a set of sizes and four letter-spacings. Like colour shades, they're hidden from publishing — you meet them through styles.")
    s = k.section(b, "Two families", "Each is a stack: the font you design with, then close fallbacks, then the system's generic family — so text is readable while fonts load, or if they never do.")
    r = k.row(s, 16, align="min")
    for fam, title, sample, style, used in [("sans", "Sans", "Aa Bb Gg 0123456789", "type.body.lg", "Every style except code"), ("mono", "Mono", "const total = 1248;", "type.code.md", "Code styles only")]:
        c = k.card(r, 10, 24)
        k.text(c, title, "h3"); spec(k, c, sample, style)
        k.text(c, D["families"][fam], "caption", "color/fg/muted", mono=True)
        k.text(c, used, "small", "color/fg/muted")
    k.inst("note", b, {"Body": "Numbers stay in the sans family. Tabular numerals line digits up without switching to a code font."}, fill=True)
    s = k.section(b, "Four weights, named for what they are", "Bold really means 700 — which matters for the large-text rule, where bold text counts as large from 18.66px.")
    r = k.row(s, 16)
    use = {"regular": "Body, caption, code, numbers", "medium": "Labels", "semibold": "Titles, headings, the metric figure, emphasis", "bold": "Display"}
    for name, val in D["weights"].items():
        c = k.card(r, 8, 20)
        raw(k, c, "Ag", 40, 48, val)
        k.text(c, f"font/weight/{name}", "mono"); k.text(c, str(val), "caption", "color/fg/muted", weight=400)
        k.text(c, use[name], "small", "color/fg/muted", fill=True)
    s = k.section(b, "Letter-spacing follows the size", f"It's in em, so it scales with the text it's on. Nothing below {D['trackFrom']}px is tightened; large text is tightened slightly; capitals are spaced out.")
    rows = [("normal", 16, "Everything below 24px", "Readable text"), ("tight", 32, "Headings from 24px", "Section heading"), ("tighter", 68, "Display and headings from 44px", "Big statement"), ("caps", 12, "Upper-case label styles", "OVERLINE LABEL")]
    def cell(c, i, v, w):
        if i == 3:
            tok, size, txt = v
            em = D["tracking"][tok]
            raw(k, c, txt, size, round(size * 1.25), 700 if size > 40 else 600 if size > 20 else 600 if tok == "caps" else 400, ls=round(em * size, 2))
            return True
    grid_table(k, s, [("Token", 260), ("Value", 110), ("Used for", 300), ("Looks like", None)],
               [[f"font/letter-spacing/{tok}", ("0" if D["tracking"][tok] == 0 else f"{D['tracking'][tok]:+}em"), used, (tok, size, txt)] for tok, size, used, txt in rows], cell)
    s = k.section(b, "Sizes", "Every size the styles use, with the rem value code uses. Drawn at size.")
    lad = k.card(s, 20, 28, direction="horizontal", align="max")
    for size in D["sizes"]:
        col = k.frame(lad, str(size), gap=6, align="center")
        raw(k, col, "Ag", size, round(size * 1.2), 500)
        k.text(col, str(size), "caption", "color/fg/muted", weight=400); k.text(col, f"{size / 16:g}rem", "caption", "color/fg/subtle", weight=400)
    rules(k, b, [("Never use a primitive in a design", "font/size/16 has no line height, no letter-spacing and doesn't change with the screen. Use the style."),
                 ("Never set a font family in a component", "Change fonts once, in the engine config; the fallback stack comes with it.")])
    finish(k, b, "Fonts, weights and spacing")
    return b


# ------------------------------------------------------------ Headings and display
def headings(k, D):
    b = start(k, "Headings and display", "Display and heading styles name the page and its parts. They're the only styles that change with the screen. Display is for statements; headings build the outline.")
    s = k.section(b, "Tag by outline, style by weight", "The tag (h1–h6) comes from where the text sits in the page's outline. The style comes from how much it should stand out.")
    r = k.row(s, 40, align="min")
    scr = k.frame(r, "Settings page", gap=16, pad=28, w=640, bind="color/bg/canvas", radius=12, stroke="color/border/default")
    def line(parent, text, style, tag, h):
        rr = k.row(parent, 8, align="center"); spec(k, rr, text, style); k.tag(rr, style.replace("type.", "")); k.chip(rr, h, mono=True)
    line(scr, "Settings", "type.heading.lg", "", "h1")
    spec(k, scr, "Choose how and when we tell you about your projects.", "type.body.lg", "color/fg/muted", fill=True)
    line(scr, "Notifications", "type.heading.md", "", "h2")
    card = k.frame(scr, "Card", gap=8, pad=18, sizingH="fill", bind="color/bg/surface", radius=10, stroke="color/border/subtle")
    line(card, "Email", "type.title.md", "", "h3")
    rr = k.row(card, 8, align="center"); spec(k, rr, "Weekly summary", "type.label.md"); k.tag(rr, "label.md"); k.chip(rr, "not a heading", mono=False)
    leg = k.frame(r, "Defaults", gap=14, sizingH="fill")
    k.text(leg, "What tokens.css does for you", "h3")
    for h, st in D["htmlDefaults"].items():
        if h == "body": continue
        k.marked(leg, f"<{h}>  →  {st.replace('type.', '').replace('.', '/')}", None)
    k.text(leg, "Any class overrides the default — an h3 can look like title/md.", "small", "color/fg/muted", fill=True)
    s = k.section(b, "Display is for statements", "One big line on a landing, welcome or empty page — at most one per view, and never an app's page title.")
    c = k.card(s, 12, 40, bind="color/bg/brand-subtle")
    rr = k.row(c, 12, align="center"); spec(k, rr, "Plan less. Ship more.", "type.display.md"); k.tag(rr, "display.md")
    rr = k.row(c, 12, align="center"); spec(k, rr, "Projects, owners and dates in one place.", "type.body.lg", "color/fg/muted"); k.tag(rr, "body.lg")
    for title, ps in D["groups"]["Headings and display"]: style_table(k, b, D, ps, f"{SINGULAR.get(title, title)} styles")
    rules(k, b, [("One display per view", "A second display competes with the first; use a heading for everything else."), ("Page titles are headings", "An app screen's title is heading/lg, never display."),
                 ("Never skip a level", "Screen-reader users move by heading level; h2 → h4 makes them think something is missing. Change the style, not the tag.")])
    finish(k, b, "Headings and display")
    return b


# ------------------------------------------------------------ Titles and labels
def titles(k, D):
    b = start(k, "Titles and labels", "Titles name components; labels are the text people act on. Both keep one size at every breakpoint, so a card or a button looks the same on every screen.")
    s = k.section(b, "Titles name components", "A heading names a part of the page; a title names a card, a dialog or a panel. Use the title style either way.")
    r = k.row(s, 24, align="min")
    card_mock(k, r)
    dlg = k.frame(r, "Dialog", gap=12, pad=24, w=420, bind="color/bg/surface-overlay", radius=12, stroke="color/border/subtle", shadow=(4, (0, 12, 32)))
    rr = k.row(dlg, 8, align="center"); spec(k, rr, "Delete project?", "type.title.lg"); k.tag(rr, "title.lg")
    spec(k, dlg, "The project and its 12 tasks will be removed. This can't be undone.", "type.body.md", "color/fg/muted", fill=True)
    br = k.row(dlg, 8)
    for bg, fg, lab, brd in [("color/action/secondary/bg", "color/action/secondary/fg", "Cancel", "color/action/secondary/border"), ("color/action/danger/bg", "color/action/danger/fg", "Delete project", None)]:
        bb = k.frame(br, lab, "horizontal", 0, 0, bind=bg, radius=4, align="center", stroke=brd); k.pad(bb, 16, 16, 9, 9); spec(k, bb, lab, "type.label.md", fg)
    s = k.section(b, "Labels follow the density", "Match the label to the density the screen uses (Spacing foundation). Badges and chips use label/sm in any density.")
    r = k.row(s, 24, align="max")
    for dens, st in [("comfortable", "type.label.lg"), ("default", "type.label.md"), ("compact", "type.label.md")]:
        col = k.frame(r, dens, gap=8)
        h = D["density"][dens]["control"]
        bb = k.frame(col, "Button", "horizontal", 0, 0, h=h, sizingV=None, bind="color/action/primary/bg", radius=4, align="center", main="center"); k.pad(bb, 18, 18)
        spec(k, bb, "Save changes", st, "color/action/primary/fg")
        k.text(col, f"{dens} · {h}px", "caption", "color/fg/muted", weight=400); k.tag(col, st.replace("type.", ""))
    col = k.frame(r, "badges", gap=8)
    br = k.row(col, 6, fill=False)
    for lab, bg, fg in [("Done", "color/bg/success", "color/fg/on-success"), ("Beta", "color/bg/brand-subtle", "color/fg/brand"), ("3 new", "color/bg/info-subtle", "color/fg/info")]:
        bd = k.frame(br, lab, "horizontal", 0, 0, bind=bg, radius=99, align="center"); k.pad(bd, 10, 10, 2, 2); spec(k, bd, lab, "type.label.sm", fg)
    k.text(col, "badges and chips", "caption", "color/fg/muted", weight=400); k.tag(col, "label.sm")
    for title, ps in D["groups"]["Titles and labels"]: style_table(k, b, D, ps, f"{SINGULAR.get(title, title)} styles")
    rules(k, b, [("Labels may wrap; never clip them", "A translated or enlarged label is longer. Let the control grow rather than cutting the text."),
                 ("Field labels stay visible", "Placeholders vanish when people type. Keep a label/md label above the field."),
                 ("Capitals only through a style made for them", "A caps style adds letter-spacing; typing in capitals or adding upper case by hand doesn't.")])
    finish(k, b, "Titles and labels")
    return b


# ------------------------------------------------------------ Reading text
PARA = "Typography decides how easily people read what you show them. Sizes, line heights and the width of a line work together: if lines are too long, the eye loses its place when it jumps back to the start of the next one; if they are too short, reading turns into a stutter of line breaks."


def reading(k, D):
    bm = S(D, "type.body.md")["breakpoints"]["lg"]
    chars = round(D["measure"] / (bm["size"] * D["charWidth"]))
    b = start(k, "Reading text", f"Paragraphs, help text and code are read line by line, so they get the most room between lines: {D['readingLh']} or more at every breakpoint. Lines also stop at a comfortable width.")
    s = k.section(b, "Line length", f"Running text stops at layout/measure/reading — {D['measure'] / 16:g}rem, {D['measure']}px at the default text size, about {chars} characters of body/md.")
    r = k.row(s, 32, align="min")
    col = k.frame(r, "Do", gap=10)
    k.inst("do", col)
    p = spec(k, col, PARA, "type.body.md", width=D["measure"])
    k.text(col, f"{D['measure']}px · about {chars} characters a line", "caption", "color/fg/muted", weight=400)
    col = k.frame(r, "Avoid", gap=10)
    k.inst("avoid", col)
    spec(k, col, PARA, "type.body.md", width=700)
    k.text(col, f"700px · about {round(700 / (bm['size'] * D['charWidth']))} characters a line — the eye loses its place", "caption", "color/fg/muted", weight=400)
    s = k.section(b, "Paragraphs, help and code", "A short article and a form field, each part tagged with its style.")
    r = k.row(s, 40, align="min")
    art = k.frame(r, "Article", gap=12, pad=28, w=D["measure"] + 56, bind="color/bg/surface", radius=12, stroke="color/border/subtle")
    rr = k.row(art, 8, align="center"); spec(k, rr, "Sharing a project", "type.heading.md"); k.tag(rr, "heading.md")
    rr = k.frame(art, "lead", gap=6, sizingH="fill"); spec(k, rr, "Invite people by email, or share a link that only your team can open.", "type.body.lg", "color/fg/muted", fill=True); k.tag(rr, "body.lg")
    rr = k.frame(art, "p", gap=6, sizingH="fill")
    t = spec(k, rr, "Open the project, choose Share, then copy the link. To limit it, run ds share --team before sending it.", "type.body.md", fill=True)
    txt = "Open the project, choose Share, then copy the link. To limit it, run ds share --team before sending it."
    i0 = txt.index("ds share --team")
    k.f.cmd("style.apply", ids=[t], style=k.styles["type/code/md"], start=i0, end=i0 + len("ds share --team"))
    rr2 = k.row(rr, 8); k.tag(rr2, "body.md"); k.tag(rr2, "code.md inline")
    frm = k.frame(r, "Field", gap=6, pad=24, w=380, bind="color/bg/surface", radius=12, stroke="color/border/subtle")
    rr = k.row(frm, 8, align="center"); spec(k, rr, "Project name", "type.label.md"); k.tag(rr, "label.md")
    inp = k.frame(frm, "Input", "horizontal", 0, 0, h=40, sizingV=None, sizingH="fill", bind="color/bg/surface", radius=4, align="center", stroke="color/border/input"); k.pad(inp, 12, 12)
    spec(k, inp, "Website redesign", "type.body.md")
    rr = k.row(frm, 8, align="center"); spec(k, rr, "Up to 60 characters.", "type.caption.md", "color/fg/muted"); k.tag(rr, "caption.md")
    for title, ps in D["groups"]["Reading text"]: style_table(k, b, D, ps, f"{SINGULAR.get(title, title)} styles")
    rules(k, b, [("Left-align running text", "Justified text opens uneven gaps between words that make lines hard to follow."),
                 ("Don't use caption for instructions", "Steps people must follow need body/sm or body/md."),
                 ("Emphasis is weight or italics", "Strong text is semibold; underline means a link; colour alone is not emphasis.")])
    finish(k, b, "Reading text")
    return b


# ------------------------------------------------------------ Numbers and data
def numbers(k, D):
    b = start(k, "Numbers and data", "Numbers that people compare must line up. Tabular numerals give every digit the same width, so a column of totals reads as a column and live values don't jitter.")
    s = k.section(b, "Tabular numerals", "In Inter, ten 1s are about two-thirds the width of ten 0s — until tabular numerals are on.")
    r = k.row(s, 24, align="min")
    for lab, flat, verdict in [("Proportional (the font's default)", False, "avoid"), ("Tabular", True, "do")]:
        c = k.card(r, 12, 28, w=400)
        k.inst(verdict, c)
        nid = raw(k, c, "1,111.11\n8,888.88\n   41.07", 36, 48, 600)
        if flat:
            k.f.cmd("text.setFeatures", ids=[nid], features={"tnum": True}); k.f.cmd("vector.flatten", ids=[nid])
        k.text(c, lab, "small", "color/fg/muted")
    k.inst("note", b, {"Body": "In this file the tabular column above is drawn as shapes, so it shows correctly in any app. In Figma, open the three number text styles once and set Details → Numbers → Tabular: the .fig format can't carry that setting yet."}, fill=True)
    s = k.section(b, "A table of numbers", "Right-aligned, the same number of decimals, the unit in the header, a real minus sign.")
    tbl = k.card(s, 0, 0, w=760, sizingH=None)
    for i, rowv in enumerate([("Project", "Hours", "Budget (€)", "Change"), ("Website redesign", "1,248", "12,500.00", "▲ +4.1%"), ("Mobile app", "911", "8,111.00", "▼ −2.0%"), ("Onboarding flow", "74", "1,900.50", "– 0.0%")]):
        row = k.frame(tbl, rowv[0], "horizontal", 20, 12, sizingH="fill", align="center", bind="color/bg/surface-sunken" if i == 0 else None, stroke="color/border/subtle" if i else None); k.pad(row, 24, 24)
        if i: k.f.tool("set_properties", ids=[row], props={"strokeSides": [1, 0, 0, 0]})
        for j, v in enumerate(rowv):
            c = k.frame(row, f"c{j}", w=240 if j == 0 else None, sizingH=None if j == 0 else "fill", align="min" if j == 0 else "max")
            if i == 0: spec(k, c, v, "type.label.sm", "color/fg/muted")
            elif j == 0: spec(k, c, v, "type.body.sm")
            else: spec(k, c, v, "type.numeric.sm", "color/fg/positive" if "▲" in v else "color/fg/negative" if "▼" in v else "color/fg/default")
    s = k.section(b, "Metric cards", "The figure in numeric/lg, its name in label/md, the context in caption/md — with an arrow, never colour alone.")
    r = k.row(s, 16)
    for name, val, ctx, fg in [("Active users", "12,480", "▲ 2.4% this week", "color/fg/positive"), ("Error rate", "0.8%", "▼ 0.9% this week", "color/fg/positive"), ("Load time", "1.9 s", "▲ 0.4 s this week", "color/fg/negative")]:
        c = k.card(r, 6, 20)
        rr = k.row(c, 8, align="center"); spec(k, rr, name, "type.label.md", "color/fg/muted")
        spec(k, c, val, "type.numeric.lg")
        spec(k, c, ctx, "type.caption.md", fg)
    k.tag(s, "label.md · numeric.lg · caption.md")
    for title, ps in D["groups"]["Numbers and data"]: style_table(k, b, D, ps, f"{SINGULAR.get(title, title)} styles")
    rules(k, b, [("Right-align numbers in columns", "Digits of the same place value then sit under each other."), ("Don't use mono for numbers", "Mono is for code. Tabular numerals align digits without changing the font."),
                 ("Don't animate digits rolling", "Highlight a changed value briefly instead (Motion foundation).")])
    finish(k, b, "Numbers and data")
    return b


# ------------------------------------------------------------ Across screen sizes
def screens(k, D):
    b = start(k, "Across screen sizes", "Type shares its four breakpoints with Layout. The page title and section headings grow on wider screens; everything people read and operate stays the same size.", w=1840)
    s = k.section(b, "The same page at four widths", "Four frames, each set to a Responsive mode. Compare the heading sizes — then the paragraph and the button, which don't change.")
    r = k.row(s, 20, align="min")
    widths = {"sm": 320, "md": 360, "lg": 440, "xl": 480}
    for bp in D["breakpoints"]:
        m = k.frame(r, bp["name"], gap=12, pad=20, w=widths[bp["name"]], bind="color/bg/surface", radius=12, stroke="color/border/subtle")
        mode(k, m, bp["name"])
        k.text(m, f"{bp['name']} · from {bp['min']}px · ratio {bp['ratio']}", "caption", "color/fg/subtle", weight=700)
        spec(k, m, "Projects", "type.heading.lg")
        spec(k, m, "Everything your team is working on.", "type.body.lg", "color/fg/muted", fill=True)
        spec(k, m, "This week", "type.heading.md")
        spec(k, m, "Twelve tasks moved to done and three need a review.", "type.body.md", fill=True)
        bb = k.frame(m, "Button", "horizontal", 0, 0, bind="color/action/primary/bg", radius=4, align="center"); k.pad(bb, 16, 16, 9, 9)
        spec(k, bb, "Open board", "type.label.md", "color/action/primary/fg")
    s = k.section(b, "Breakpoints", "From each width up, the styles that move take the next ratio.")
    hl = lambda n, bp: S(D, n)["breakpoints"][bp]["size"]
    grid_table(k, s, [("Breakpoint", 200), ("From", 160), ("Ratio", 160), ("Page title", 200), ("Section", 200), ("Largest display", None)],
               [[bp["name"], f"{bp['min']}px", str(bp["ratio"]), f"{hl('type.heading.lg', bp['name'])}px", f"{hl('type.heading.md', bp['name'])}px", f"{hl('type.display.lg', bp['name'])}px"] for bp in D["breakpoints"]])
    s = k.section(b, "Large text can change with the screen", "WCAG large text starts at 24px (or 18.66px bold). A style can be normal text on a phone and large text on a desktop.")
    flips = [st for st in D["styles"] if len({st["breakpoints"][bp]["large"] for bp in BPS}) > 1]
    grid_table(k, s, [("Style", 300)] + [(bp, 200) for bp in BPS] + [("Means", None)],
               [[st["figma"]] + [("large" if st["breakpoints"][bp]["large"] else "normal") + f" · {st['breakpoints'][bp]['size']}px" for bp in BPS] + ["Colours from outside ds need 4.5 : 1 where it's normal text"] for st in flips])
    k.inst("note", b, {"Body": f"Fits a phone: at 320px wide the largest display is {hl('type.display.lg', 'sm')}px, small enough that headings wrap instead of running off the screen. The build checks it on every run."}, fill=True)
    rules(k, b, [("Design at sm and lg at least", "Switch the frame's Responsive mode and look again — long headings wrap on phones."),
                 ("Never swap styles for mobile", "heading/lg already shrinks on a phone. Choosing heading/sm \"for mobile\" makes it shrink twice and breaks the order.")])
    finish(k, b, "Across screen sizes")
    return b


# ------------------------------------------------------------ Choosing and using type
def choosing(k, D):
    b = start(k, "Choosing and using type", "One question gets you to the right style almost every time: what is this text? Then let the heading tag follow the outline.", w=1440)
    s = k.section(b, "The decision guide", "Find the kind of text, answer the question, use the style.")
    grid = k.row(s, 16, wrap=True, align="min")
    for d in D["decisions"]:
        c = k.frame(grid, d["what"], gap=10, pad=22, w=628, bind="color/bg/surface", radius=12, stroke="color/border/subtle")
        k.text(c, d["what"], "h3"); k.text(c, d["question"], "small", "color/fg/muted")
        for when, use in d["answers"]:
            rr = k.frame(c, when[:30], "horizontal", 12, 0, sizingH="fill", align="center")
            k.text(rr, when, "small", fill=True)
            if use.startswith("type."):
                for u in use.split(" / "): k.chip(rr, u.split(" (")[0].replace("type.", "").replace(".", "/"))
            else:
                k.text(rr, use, "caption", "color/fg/muted", weight=400, width=220)
    s = k.section(b, "What follows what", "Text comes in stacks. These keep a clear step between neighbours.")
    r = k.row(s, 16, wrap=True, align="min")
    for above, below, ta, tb, where in [("type.heading.lg", "type.body.lg", "Projects", "Everything your team is working on.", "A page and its intro"),
                                        ("type.heading.md", "type.body.md", "This week", "Twelve tasks moved to done.", "A section and its first paragraph"),
                                        ("type.title.md", "type.caption.md", "Website redesign", "Marketing · 12 tasks", "A card and its detail"),
                                        ("type.label.md", "type.caption.md", "Project name", "Up to 60 characters.", "A field label and its help"),
                                        ("type.numeric.lg", "type.caption.md", "12,480", "▲ 2.4% this week", "A metric and its context")]:
        c = k.frame(r, where, gap=6, pad=20, w=400, bind="color/bg/surface", radius=12, stroke="color/border/subtle")
        k.text(c, where.upper(), "caption", "color/fg/subtle", weight=700)
        spec(k, c, ta, above); spec(k, c, tb, below, "color/fg/muted")
        rr = k.row(c, 6); k.tag(rr, above.replace("type.", "")); k.tag(rr, below.replace("type.", ""))
    s = k.section(b, "Worked example — a project card", "Styled one question at a time.")
    r = k.row(s, 40, align="min")
    card_mock(k, r, tagged=False)
    leg = k.frame(r, "Legend", gap=14, sizingH="fill")
    for st, why in [("title/md", "It names the card."), ("caption/md", "Short supporting detail."), ("body/sm", "A sentence or two people read."), ("numeric/md", "Compared with other cards."),
                    ("label/md", "A button people press."), ("label/sm", "A badge.")]:
        k.marked(leg, st, why)
    s = k.section(b, "Do and avoid", "What to do, what to avoid, and why it matters.")
    for do, avoid, why in [("Paragraph in body/md (16/24)", "16px with the browser's line height (about 16/19)", "Lines crowd together and the eye slips to the wrong line."),
                           ("Meta text in caption/md (12px)", "11px fine print", f"Nothing in {D['system']} is smaller than {D['minSize']}px."),
                           ("h1 → h2 → h3, styled as needed", "h1 → h4 because h4 looks right", "Headings are how screen-reader users move through a page."),
                           ("A card title box that grows", "A card title in a fixed 40px-high box", "At 200% text size one line needs 48px; the fixed box cuts it off.")]:
        row = k.row(s, 16, align="min")
        for kind, txt in [("do", do), ("avoid", avoid)]:
            c = k.card(row, 8, 20); k.inst(kind, c); k.text(c, txt, "body", fill=True)
        c = k.frame(row, "Why", gap=4, w=380); k.text(c, "WHY", "caption", "color/fg/subtle", weight=700); k.text(c, why, "small", "color/fg/muted", fill=True)
    finish(k, b, "Choosing and using type")
    return b


# ------------------------------------------------------------ Readers' settings and brands
def settings(k, D):
    b = start(k, "Readers' settings and brands", "People change how text looks — bigger text, more spacing, zoom — and products change fonts. The system is built so neither breaks a screen.")
    s = k.section(b, "Bigger text", "Sizes follow the browser's text size, so at 200% every style doubles and keeps its proportions. Boxes must grow with it.")
    r = k.row(s, 24, align="min")
    for lab, mult, kind in [("100% text", 1, None), ("200% text — the box grows", 2, "do"), ("200% text — fixed-height box", 2, "avoid")]:
        c = k.card(r, 10, 20)
        if kind: k.inst(kind, c)
        k.text(c, lab, "caption", "color/fg/subtle", weight=700)
        box = k.frame(c, "Box", gap=4, pad=12, w=300, h=(70 if kind == "avoid" else None), sizingV=(None if kind == "avoid" else "hug"), bind="color/bg/surface-sunken", radius=8)
        if kind == "avoid": k.f.tool("set_properties", ids=[box], props={"clip": True})
        for txt, sz, lh, wt, col in [("Website redesign", 18, 24, 600, "color/fg/default"), ("Marketing · 12 tasks", 12, 18, 400, "color/fg/muted")]:
            t_ = raw(k, box, txt, sz * mult, lh * mult, wt, color=col)
            k.f.tool("set_properties", ids=[t_], props={"sizingH": "fill"})
    s = k.section(b, "More spacing", "Some readers override spacing (WCAG 1.4.12). Reading styles already meet the line-height part; layout must survive the rest.")
    grid_table(k, s, [("Readers may set", 360), ("To", 260), ("What breaks", None)], [
        ["Line height", "1.5 × the font size", "Fixed-height boxes"], ["Space after paragraphs", "2 × the font size", "Cards with a set height"],
        ["Letter-spacing", "0.12 × the font size", "Single-line labels with hidden overflow"], ["Word spacing", "0.16 × the font size", "Buttons with a fixed width"]])
    s = k.section(b, "Changing fonts", "Set the families in the engine config and build. Before you choose a font, check three things the engine can't.")
    r = k.row(s, 16, align="min")
    for t, body in [("Tabular numerals", "The font must have them, or number columns won't line up. The type audit checks the font on a real page."),
                    ("Clear shapes", "1, l and I — and 0 and O — must be easy to tell apart, especially at 12–14px."),
                    ("Character width", f"Set typography.charWidth so the line-length check stays honest (Inter measures {D['charWidth']} em).")]:
        c = k.card(r, 8, 24); k.text(c, t, "h3"); k.text(c, body, "body", "color/fg/muted", fill=True)
    grid_table(k, s, [("Follows the config", 560), ("Fixed on purpose", None)], [["The sans and mono families in every style", "The scale, line heights and letter-spacing"],
                                                                                 ["The fallback stacks", "The minimum sizes and every check"], ["—", "Style names: nothing in designs or code is renamed"]])
    s = k.section(b, "Adding a style", "Most needs already have a style. If none fits, add one in the engine config by its job, on a step; the build computes and checks it.")
    r = k.row(s, 24, align="min")
    c = k.card(r, 0, 24, bind="color/bg/surface-sunken", w=620, sizingH=None)
    js = json.dumps({"typography": {"styles": [{"name": "type.overline.sm", "step": -2, "kind": "label", "weight": "semibold", "case": "upper", "description": "Short upper-case label above a section title"}]}}, indent=2)
    spec(k, c, js, "type.code.sm")
    leg = k.frame(r, "Refused", gap=12, sizingH="fill")
    k.text(leg, "The build refuses", "h3")
    for t, sub in [("px values", "Give a step; the engine computes size, line height and spacing."), (f"Anything under {D['minSize']}px", "Step −2 is the smallest."),
                   ("A copy of an existing style", "Same size and weight at every width — use that style."), ("Names that describe a look", "big, small, bold … — name it by its job."),
                   ("Capitals in reading text", "Only labels and titles may be upper case.")]:
        k.marked(leg, t, sub, mono=False)
    finish(k, b, "Readers' settings and brands")
    return b


CHAPTER_FNS = [principles, scale, tokens, fonts, headings, titles, reading, numbers, screens, choosing, settings]

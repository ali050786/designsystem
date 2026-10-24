"""Colour foundation as one systematic story: 11 chapters, each = explain → tokens → examples → rules.
Every colour role is documented on exactly one chapter (checked at build time)."""

CHAPTERS = [("01", "Five principles"), ("02", "Contrast grades"), ("03", "How tokens are built"), ("04", "Shade scales"),
            ("05", "Surfaces and depth"), ("06", "Text, icons and outlines"), ("07", "Actions and states"),
            ("08", "Status and data"), ("09", "What goes on what"), ("10", "Choosing and using colour"), ("11", "Modes and brands")]
TEASER = {"02": "the one idea that keeps every pair readable", "03": "tiers, collections, modes and names", "04": "the raw shades every role is built from",
          "05": "backgrounds, layers and elevation", "06": "text levels, icons and outlines", "07": "buttons and every interactive state",
          "08": "intents, good and bad change, charts", "09": "the pairing rules, measured", "10": "a decision guide and real screens", "11": "dark mode and your brand"}
GROUP = {"01": "Idea", "02": "Idea", "03": "Structure", "04": "Structure", "05": "Roles", "06": "Roles", "07": "Roles", "08": "Roles",
         "09": "Combining", "10": "Using", "11": "Using"}
TEXT_BGS = ["canvas", "surface", "surface-raised", "surface-overlay", "surface-sunken", "surface-hover", "surface-pressed", "selected"]
STATUSES = ["success", "warning", "danger", "info"]
GLYPH = {"success": "✓", "warning": "!", "danger": "✕", "info": "i"}

documented = []  # every role put in a token table


# ------------------------------------------------------------ chapter scaffolding
def start(k, num, lead, w=1440):
    title = dict(CHAPTERS)[num]
    k.page(title)
    b = k.frame(name=title, w=w, pad=80, gap=72, bind="color/bg/canvas")
    k.f.cmd("variable.setMode", ids=[b], collection="Color", mode="Light")
    k.inst("page", b, {"Eyebrow": f"Colour · {GROUP[num]}", "Title": title, "Lead": lead}, fill=True)
    return b


def finish(k, b, num):
    i = [n for n, _ in CHAPTERS].index(num)
    if i + 1 >= len(CHAPTERS):
        c = k.card(b, 8, 24, bind="color/bg/brand-subtle")
        k.text(c, "End of the colour foundation", "h3")
        k.text(c, "You've seen how every colour is made, named, paired and used. Next in the system: Typography.", "body", "color/fg/muted", fill=True)
        return
    n, t = CHAPTERS[i + 1]
    c = k.frame(b, "Next", "horizontal", 16, 24, sizingH="fill", bind="color/bg/surface", radius=16, stroke="color/border/subtle", align="center")
    col = k.frame(c, "Text", gap=4, sizingH="fill")
    k.text(col, "NEXT", "caption", "color/fg/subtle", weight=700)
    k.text(col, t, "h3")
    k.text(col, TEASER[n].capitalize() + ".", "small", "color/fg/muted")
    k.text(c, "→", "h1", "color/fg/brand")


# ------------------------------------------------------------ token tables (Light and Dark side by side)
def _swatch(k, parent, role, mode, kind):
    v = role["v"]
    if kind == "text":
        base = "color/bg/surface"
        if "/fg/on-" in v: base = "color/bg/" + v.split("on-")[1]
        if v.startswith("color/action/") and v.endswith("/fg"): base = v.rsplit("/", 1)[0] + "/bg"
        sw = k.frame(parent, "swatch", "horizontal", w=52, h=34, sizingV=None, radius=6, bind=base, align="center", main="center", stroke="color/border/subtle")
        k.text(sw, "Aa", "body", v, weight=700)
    elif kind == "line":
        sw = k.frame(parent, "swatch", w=52, h=34, sizingV=None, radius=6, bind="color/bg/surface", stroke=v, strokeW=2)
    elif kind == "shadow":
        lvl = v.rsplit("/", 1)[1]
        offs = {"1": (0, 1, 3), "2": (0, 2, 8), "3": (0, 6, 16), "4": (0, 12, 32)}[lvl]
        sw = k.frame(parent, "swatch", w=52, h=34, sizingV=None, radius=6, bind="color/bg/surface", shadow=(int(lvl), offs), stroke="color/border/subtle")
    elif kind == "layer":
        sw = k.frame(parent, "swatch", w=52, h=34, sizingV=None, radius=6, bind="color/bg/surface", stroke="color/border/subtle")
        k.rect(sw, 52, 34, bind=v, radius=6)
    else:
        sw = k.frame(parent, "swatch", w=52, h=34, sizingV=None, radius=6, bind=v, stroke="color/border/subtle")
    k.f.cmd("variable.setMode", ids=[sw], collection="Color", mode=mode)
    return sw


def role_kind(v):
    if v.startswith("color/shadow/"): return "shadow"
    if v.startswith("color/border/") or v.endswith("/border"): return "line"
    if v.startswith("color/fg/") or (v.startswith("color/action/") and v.endswith("/fg")): return "text"
    if "alpha" in v or v.endswith("state-hover") or v.endswith("state-pressed") or v.endswith("ghost/bg-hover") or v.endswith("ghost/bg-pressed") or v.endswith("/scrim"): return "layer"
    return "fill"


def token_table(k, parent, D, paths, title="Tokens", intro=None):
    sem = {t["v"]: t for t in D["sem"]}
    s = k.frame(parent, title, gap=14, sizingH="fill")
    hd = k.row(s, 12, align="center")
    k.text(hd, title, "h3")
    if intro: k.text(hd, intro, "small", "color/fg/muted")
    tbl = k.card(s, 0, 0)
    head = k.frame(tbl, "Head", "horizontal", 20, 12, sizingH="fill", bind="color/bg/surface-sunken"); k.pad(head, 24, 24)
    cols = [("Role", 300), ("Light", 170), ("Dark", 170), ("Use", None)]
    for t, w in cols:
        c = k.frame(head, t, w=w, sizingH=None if w else "fill"); k.text(c, t, "caption", "color/fg/muted", weight=700)
    for p in paths:
        role = sem[p]
        documented.append(p)
        row = k.frame(tbl, p, "horizontal", 20, 10, sizingH="fill", align="center", stroke="color/border/subtle"); k.pad(row, 24, 24)
        k.f.tool("set_properties", ids=[row], props={"strokeSides": [1, 0, 0, 0]})
        c = k.frame(row, "Role", w=300); k.text(c, p.replace("color/", ""), "mono", weight=600)
        for mode in ["Light", "Dark"]:
            c = k.frame(row, mode, "horizontal", 10, 0, w=170, align="center")
            _swatch(k, c, role, mode, role_kind(p))
            k.text(c, role["light" if mode == "Light" else "dark"].upper()[:9], "caption", "color/fg/muted", mono=True, weight=400)
        c = k.frame(row, "Use", sizingH="fill"); k.text(c, role["desc"], "small", "color/fg/default", fill=True)
    return s


def rules(k, parent, items, title="Rules"):
    s = k.frame(parent, title, gap=14, sizingH="fill")
    k.text(s, title, "h3")
    for t, body in items:
        k.inst("rule", s, {"Title": t, "Body": body}, fill=True)


# ------------------------------------------------------------ 01 Five principles
def ch01(k, D):
    b = start(k, "01", "Five principles shape every colour decision in this system. Each one is something you can check, not just a belief — the demo next to it shows how.")
    s = k.section(b, "The principles", "Read them once; every chapter after this one applies them.")
    items = [
        ("1", "Accessible by construction", "Every shade is solved so its contrast is known before anyone uses it. A pair that would fail can't be generated.", "demo_ratio"),
        ("2", "Roles, not shades", "Designs use named roles like bg/surface. Roles carry the Light and Dark values and the promise of contrast; raw shades carry neither.", "demo_role"),
        ("3", "Never colour alone", "Every meaning colour carries is also carried by words, an icon or a shape — so it reaches people who see colour differently.", "demo_arrow"),
        ("4", "Remapped, not inverted", "Dark mode points each role to a different shade chosen for the same contrast. Nothing is flipped by formula.", "demo_modes"),
        ("5", "Measured, not assumed", f"{D['counts']['pairs']} allowed pairs are measured, in Light and Dark, on every build. If one fails, the build stops — nobody has to remember to check.", "demo_measure"),
    ]
    for n, t, body, demo in items:
        c = k.frame(s, t, "horizontal", 32, 28, sizingH="fill", bind="color/bg/surface", radius=16, stroke="color/border/subtle", align="center")
        col = k.frame(c, "Text", gap=6, sizingH="fill")
        k.text(col, t, "h2"); k.text(col, body, "body", "color/fg/muted", fill=True)
        d = k.frame(c, "Demo", "horizontal", 12, 16, w=360, bind="color/bg/surface-sunken", radius=12, align="center", main="center")
        if demo == "demo_ratio":
            bx = k.frame(d, "pair", "horizontal", 0, 0, w=72, h=48, sizingV=None, bind="color/bg/brand-subtle", radius=8, align="center", main="center"); k.text(bx, "Aa", "h3", "color/fg/brand")
            col2 = k.frame(d, "r", gap=2); k.text(col2, "5.35 : 1", "h3"); k.text(col2, "✓ known before use", "caption", "color/fg/success", weight=700)
        elif demo == "demo_role":
            k.chip(d, "bg/surface")
            k.text(d, "→", "body", "color/fg/muted")
            for mode in ["Light", "Dark"]:
                sw = k.frame(d, mode, w=40, h=40, sizingV=None, radius=8, bind="color/bg/surface", stroke="color/border/subtle")
                k.f.cmd("variable.setMode", ids=[sw], collection="Color", mode=mode)
        elif demo == "demo_arrow":
            k.text(d, "▲ +2.4%", "h3", "color/fg/positive"); k.text(d, "▲ +0.4 s", "h3", "color/fg/negative")
        elif demo == "demo_modes":
            for mode in ["Light", "Dark"]:
                m = k.frame(d, mode, gap=4, pad=10, w=140, bind="color/bg/surface", radius=8, stroke="color/border/subtle")
                k.f.cmd("variable.setMode", ids=[m], collection="Color", mode=mode)
                k.text(m, "12,480", "body", weight=700); k.text(m, "Active users", "caption", "color/fg/muted")
        else:
            col2 = k.frame(d, "r", gap=2, align="center"); k.text(col2, f"{D['counts']['pairs']}", "h1"); k.text(col2, "pairs · Light and Dark · 0 failing", "caption", "color/fg/muted")
    s = k.section(b, "How this foundation is organised", "The chapters follow the order you'd build a colour system in: the idea, the structure, the raw shades, the roles, how they combine, how to use them.")
    grid = k.row(s, 16, wrap=True)
    groups = GROUP
    for n, t in CHAPTERS:
        c = k.frame(grid, t, gap=6, pad=18, w=308, bind="color/bg/surface", radius=12, stroke="color/border/subtle")
        k.text(c, groups[n].upper(), "caption", "color/fg/subtle", weight=700)
        k.text(c, t, "body", weight=600, fill=True)
        k.text(c, TEASER.get(n, "the principles behind every decision").capitalize(), "small", "color/fg/muted", fill=True)
    finish(k, b, "01")
    return b


# ------------------------------------------------------------ 02 Contrast grades
def ch02(k, D):
    b = start(k, "02", "Every shade has a grade from 0 (white) to 100 (black). The gap between two grades tells you their contrast — in any hue. This is how principle 1 becomes something you can do in your head.")
    s = k.section(b, "What a grade is", "Measured darkness: how much contrast a shade has against white. Not hue, not saturation.")
    strip = k.row(s, 4)
    for st in D["scales"][0]["steps"]:
        col = k.frame(strip, st["v"].replace("color/", ""), gap=6, sizingH="fill", align="center")
        r_ = k.rect(col, 60, 64, bind=st["v"], radius=6); k.f.tool("set_properties", ids=[r_], props={"sizingH": "fill"})
        k.text(col, str(st["g"]), "caption", "color/fg/muted")
    s = k.section(b, "Subtract to check a pair", "Darker grade minus lighter grade. 50 or more: any text passes. 40 or more: icons, outlines and large text pass.")
    left = k.with_why(s, "WCAG asks for 4.5 : 1 for text and 3 : 1 for icons and outlines. Grades turn that into subtraction, so you can check a pair without a contrast tool.")
    for ex in D["examples"]:
        c = k.card(left, 20, 20, direction="horizontal", align="center")
        sw = k.frame(c, "Pair", "horizontal", 0, 0, w=96, h=56, sizingV=None, fill=ex["bHex"], radius=8, align="center", main="center", stroke="color/border/subtle")
        k.text(sw, "Aa", "h3", ex["aHex"])
        col = k.frame(c, "Text", gap=2, sizingH="fill"); k.text(col, ex["label"], "body", weight=600)
        k.text(col, f"{ex['a'].replace('color/', '')} on {ex['b'].replace('color/', '')}", "mono", "color/fg/muted")
        eq = k.frame(c, "Sum", gap=2, align="max"); ok = ex["ratio"] >= ex["min"]
        k.text(eq, f"gap {ex['gap']}  →  {ex['ratio']:.2f} : 1", "num")
        k.text(eq, ("✓ passes " if ok else "✕ fails ") + f"{ex['min']} : 1", "small", "color/fg/success" if ok else "color/fg/danger", weight=600)
    s = k.section(b, "The same gap in every hue", "Grade 10 next to grade 60 in all six scales. The contrast barely moves, because grades are solved per hue.")
    r = k.row(s, 16)
    for hg in D["hueGap"]:
        c = k.card(r, 10, 16)
        sw = k.frame(c, "Pair", "horizontal", 0, 0, h=72, sizingV=None, sizingH="fill", fill=hg["a"], radius=8, align="center", main="center"); k.text(sw, "Aa", "h2", hg["b"])
        k.text(c, hg["hue"].capitalize(), "small", weight=600); k.text(c, f"{hg['ratio']:.2f} : 1", "num")
    s = k.section(b, "Gaps to remember", "Three numbers cover almost every decision.")
    r = k.row(s, 24)
    for gap, ratio, use in [(40, "3 : 1", "Icons, input outlines, focus rings, chart marks, large text (24px+, or 18.7px bold)"), (50, "4.5 : 1", "All text, at any size."), (70, "7 : 1", "Enhanced (AAA). Body text on the main surfaces already reaches it.")]:
        c = k.card(r, 8); k.text(c, f"Gap {gap}", "h2", "color/fg/brand"); k.text(c, ratio, "h3"); k.text(c, use, "body", "color/fg/muted", fill=True)
    k.inst("note", b, {"Body": "How shades are made: the engine solves each shade's lightness so its luminance hits the target for its grade, rounds it to hex, and measures every pair again before this file is built."}, fill=True)
    finish(k, b, "02")
    return b


# ------------------------------------------------------------ 03 How tokens are built
def ch03(k, D):
    b = start(k, "03", "Colour comes in tiers. Raw shades sit at the bottom, named roles in the middle, component colours on top. Each tier only points to the one below, so a change at the bottom flows all the way up.")
    s = k.section(b, "Three tiers", "Designs and code only ever touch the middle tier.")
    r = k.row(s, 16, align="center")
    tiers = [("Shades", "Primitives · hidden", ["brand/60", "neutral/90", "success/65"], "Raw values from the engine. No meaning, no modes."),
             ("Roles", "Color · Light and Dark", ["bg/surface", "fg/muted", "action/primary/bg"], "Named by job. Each points to a shade, per mode."),
             ("Components", "Coming with components", ["button/primary/bg", "input/border"], "Point to roles. Added when components ship.")]
    for i, (t, sub, ex, body) in enumerate(tiers):
        c = k.card(r, 10, 24, bind="color/bg/brand-subtle" if i == 1 else "color/bg/surface")
        k.text(c, t, "h2"); k.text(c, sub, "caption", "color/fg/subtle", weight=700)
        for e in ex: k.chip(c, e)
        k.text(c, body, "small", "color/fg/muted", fill=True)
        if i < 2: k.text(r, "→", "h1", "color/fg/subtle")
    s = k.section(b, "Collections and modes", "How the tiers appear in Figma's Variables panel.")
    tbl = k.card(s, 0, 0)
    head = k.frame(tbl, "Head", "horizontal", 20, 12, sizingH="fill", bind="color/bg/surface-sunken"); k.pad(head, 24, 24)
    for t, w in [("Collection", 220), ("Modes", 220), ("Variables", 140), ("Published", 160), ("Holds", None)]:
        c = k.frame(head, t, w=w, sizingH=None if w else "fill"); k.text(c, t, "caption", "color/fg/muted", weight=700)
    nprim = D["counts"]["variables"] - len(D["sem"])
    for coll, modes, n, pub, holds in [("Primitives", "Value", nprim, "Hidden", "6 hue scales × 19 grades, chart shades, see-through blacks and whites"),
                                       ("Color", "Light · Dark", len(D["sem"]), "Yes", "Every role in Surfaces, Text, Actions and Status, each an alias to a primitive")]:
        row = k.frame(tbl, coll, "horizontal", 20, 14, sizingH="fill", align="center", stroke="color/border/subtle"); k.pad(row, 24, 24)
        k.f.tool("set_properties", ids=[row], props={"strokeSides": [1, 0, 0, 0]})
        for val, w in [(coll, 220), (modes, 220), (str(n), 140), (pub, 160), (holds, None)]:
            c = k.frame(row, "c", w=w, sizingH=None if w else "fill"); k.text(c, val, "body" if w else "small", weight=600 if w == 220 and val == coll else 400, fill=not w)
    s = k.section(b, "Reading a name", "Category, group, role, and sometimes a state — general to specific.")
    for parts in [[("color", "Category"), ("fg", "Group"), ("muted", "Role")], [("color", "Category"), ("action", "Group"), ("primary / bg", "Role"), ("hover", "State")]]:
        c = k.card(s, 18, 32, direction="horizontal", align="max")
        for i, (p, part) in enumerate(parts):
            col = k.frame(c, part, gap=10, align="center")
            k.text(col, p if i == 0 else ("/  " + p if part != "State" else "-" + p), "h1", "color/fg/brand" if part == "Role" else "color/fg/default", mono=True)
            k.text(col, part.upper(), "caption", "color/fg/subtle", weight=700)
    leg = k.row(s, 24, align="min")
    for t, sub in [("Category", "Which foundation. Always color here."), ("Group", "What it paints: bg, fg, border, action, data, shadow."),
                   ("Role", "Its job: surface, muted, primary. Never a colour name."), ("State", "Optional: hover, pressed, subtle.")]:
        k.marked(leg, t, sub, mono=False)
    s = k.section(b, "Groups and where they appear", "Each group only shows in the Figma pickers where it belongs.")
    tbl = k.card(s, 0, 0)
    widths = [("Group", 160), ("Paints", 360), ("Shows in Figma for", 280), ("Explained in", 260)]
    head = k.frame(tbl, "Head", "horizontal", 24, 12, sizingH="fill", bind="color/bg/surface-sunken"); k.pad(head, 24, 24)
    for t, w in widths:
        c = k.frame(head, t, w=w); k.text(c, t, "caption", "color/fg/muted", weight=700)
    for g, paints, picker, ch in [("bg", "Pages, containers, fills", "Frame and shape fills", "Surfaces · Actions · Status"), ("fg", "Text and icons", "Text fills, icon shapes", "Text · Actions · Status"),
                                  ("border", "Outlines, dividers, focus", "Strokes", "Text · Actions · Status"), ("action", "Buttons and their states", "Fills, text, strokes", "Actions and states"),
                                  ("data", "Charts, trends, good and bad change", "Shape fills, strokes", "Status and data"), ("shadow", "Shadow colour per level", "Effects", "Surfaces and depth")]:
        row = k.frame(tbl, g, "horizontal", 24, 12, sizingH="fill", align="center", stroke="color/border/subtle"); k.pad(row, 24, 24)
        k.f.tool("set_properties", ids=[row], props={"strokeSides": [1, 0, 0, 0]})
        for (t, w), v in zip(widths, [g, paints, picker, ch]):
            c = k.frame(row, t, w=w)
            if t == "Group": k.chip(c, v)
            else: k.text(c, v, "small", fill=True)
    s = k.section(b, "One name, three places", "Designers and developers say the same word for the same colour.")
    r = k.row(s, 16)
    for t, v in [("Figma variable", "color/fg/muted"), ("CSS", "var(--ds-color-fg-muted)"), ("Tailwind", "text-fg-muted")]:
        c = k.card(r, 8, 20); k.text(c, t, "caption", "color/fg/subtle", weight=700); k.text(c, v, "mono", weight=600)
    finish(k, b, "03")
    return b


# ------------------------------------------------------------ 04 Shade scales
def ch04(k, D):
    b = start(k, "04", "The raw shades every role is built from: six hues, nineteen grades each. They're hidden from publishing — you'll meet them through roles, never directly.", w=1840)
    s = k.section(b, "How the scales are made", "One brand colour in, six scales out.")
    r = k.row(s, 16, align="min")
    for t, body in [("Brand", "Built around your brand's hue. Chroma peaks mid-scale and tapers to white and black."),
                    ("Neutral", "Your brand hue at very low chroma, so greys feel related to the brand without looking tinted."),
                    ("Status", "Success, warning, danger and info keep fixed hues, so their meaning never shifts with a rebrand."),
                    ("Extras", "Chart shades tuned for colour-blind readers, and see-through blacks and whites for shadows and state tints.")]:
        c = k.card(r, 8); k.text(c, t, "h3"); k.text(c, body, "small", "color/fg/muted", fill=True)
    s = k.section(b, "The scales", "Under each shade: grade, hex, then contrast against white (W) and black (B).")
    for sc in D["scales"]:
        blk = k.frame(s, sc["hue"], gap=12, sizingH="fill")
        k.text(blk, sc["hue"].capitalize(), "h3")
        row = k.row(blk, 6)
        for st in sc["steps"]:
            cell = k.frame(row, f"{sc['hue']}/{st['g']}", gap=4, sizingH="fill")
            r_ = k.rect(cell, 80, 64, bind=st["v"], radius=8); k.f.tool("set_properties", ids=[r_], props={"sizingH": "fill"})
            k.text(cell, str(st["g"]), "caption", weight=700)
            k.text(cell, st["hex"], "caption", "color/fg/muted", mono=True, weight=400)
            k.text(cell, f"W {st['w']}", "caption", "color/fg/subtle", weight=400)
            k.text(cell, f"B {st['b']}", "caption", "color/fg/subtle", weight=400)
    rules(k, b, [("Never use a shade in a design", "brand/60 has no Light/Dark pair and no list of safe backgrounds. Pick the role that points to it."),
                 ("Never edit a shade by hand", "Shades are solved for contrast. Change the brand in the engine and every shade is solved again.")])
    finish(k, b, "04")
    return b


# ------------------------------------------------------------ 05 Surfaces and depth
SURFACE_ROLES = ["color/bg/canvas", "color/bg/surface", "color/bg/surface-sunken", "color/bg/surface-raised", "color/bg/surface-overlay", "color/bg/selected", "color/bg/scrim"]
SHADOW_ROLES = ["color/shadow/1", "color/shadow/2", "color/shadow/3", "color/shadow/4"]


def ch05(k, D):
    b = start(k, "05", "Surfaces say what belongs together and what sits on top. Use the lowest surface that does the job, and let elevation — not extra colours — show that something floats.")
    s = k.section(b, "Five surfaces on one screen", "A projects screen with a menu open, each part tagged with its role.")
    r = k.row(s, 40, align="min")
    scr = k.frame(r, "Screen", gap=16, pad=20, w=700, bind="color/bg/canvas", radius=12, stroke="color/border/default")
    hd = k.frame(scr, "Header", "horizontal", 10, 14, sizingH="fill", bind="color/bg/surface-raised", radius=8, align="center", shadow=(2, (0, 2, 8)))
    k.text(hd, "Projects", "body", weight=600); k.spacer(hd); k.tag(hd, "bg/surface-raised")
    m0 = k.row(scr, 8, align="center"); k.text(m0, "Page background", "small", "color/fg/muted"); k.tag(m0, "bg/canvas")
    card = k.frame(scr, "Card", gap=0, sizingH="fill", bind="color/bg/surface", radius=10, stroke="color/border/subtle")
    th = k.frame(card, "Head", "horizontal", 10, 10, sizingH="fill", bind="color/bg/surface-sunken", align="center"); k.pad(th, 16, 16)
    k.text(th, "Project", "caption", "color/fg/muted"); k.spacer(th); k.tag(th, "bg/surface-sunken")
    for nm, sel in [("Website redesign", 0), ("Mobile app", 1), ("Onboarding flow", 0)]:
        rw = k.frame(card, nm, "horizontal", 10, 12, sizingH="fill", bind="color/bg/selected" if sel else None, align="center"); k.pad(rw, 16, 16)
        k.text(rw, ("✓ " if sel else "") + nm, "small", weight=600); k.spacer(rw)
        if sel: k.tag(rw, "bg/selected")
        if nm == "Website redesign": k.tag(rw, "bg/surface")
    menu = k.frame(scr, "Menu", gap=0, pad=6, w=260, bind="color/bg/surface-overlay", radius=10, stroke="color/border/subtle", shadow=(3, (0, 6, 16)))
    for i, it in enumerate(["Rename", "Delete project", "View details"]):
        mi = k.frame(menu, it, "horizontal", 8, 8, sizingH="fill", bind="color/bg/item-hover" if i == 0 else None, radius=6, align="center"); k.pad(mi, 10, 10)
        k.text(mi, it, "small", "color/fg/danger" if i == 1 else "color/fg/default")
    mt = k.row(menu, 0, "Tag", align="center"); k.pad(mt, 10, 10, 6, 4); k.tag(mt, "bg/surface-overlay")
    leg = k.frame(r, "Legend", gap=14, sizingH="fill")
    for role, why in [("bg/canvas", "The page. Everything else sits on it."), ("bg/surface", "Cards, panels, tables — the default home for content."),
                      ("bg/surface-sunken", "Set back inside a surface: table heads, wells, code."), ("bg/surface-raised", "Stays above scrolling content: sticky headers, toolbars."),
                      ("bg/surface-overlay", "Opens on top: menus, popovers, dialogs."), ("bg/selected", "The chosen item, with a check or bold label.")]:
        k.marked(leg, role, why)
    s = k.section(b, "Elevation: surface + shadow + outline", "Five levels. In Light the upper surfaces are white, so shadow and outline separate them; in Dark, higher is also lighter.")
    left = k.with_why(s, "Shadows are hard to see on dark backgrounds and colour alone is hard to see for some people. Using surface, shadow and outline together means depth still reads when one of them fails.")
    for mode in ["Light", "Dark"]:
        row = k.frame(left, mode, "horizontal", 20, 24, sizingH="fill", bind="color/bg/canvas", radius=12, stroke="color/border/subtle")
        k.f.cmd("variable.setMode", ids=[row], collection="Color", mode=mode)
        for bg, lvl, sh, n, lab in [("color/bg/canvas", None, None, "0", "Page"), ("color/bg/surface", 1, (0, 1, 3), "1", "Cards"), ("color/bg/surface-raised", 2, (0, 2, 8), "2", "Raised"),
                                    ("color/bg/surface-overlay", 3, (0, 6, 16), "3", "Menus"), ("color/bg/surface-overlay", 4, (0, 12, 32), "4", "Dialogs")]:
            c = k.frame(row, lab, gap=4, pad=14, h=96, sizingV=None, sizingH="fill", bind=bg, radius=10, shadow=(lvl, sh) if sh else None,
                        stroke="color/border/subtle" if (lvl or 0) >= 3 else ("color/border/default" if lvl is None else None))
            k.text(c, lab, "small", weight=700); k.text(c, bg.replace("color/", ""), "caption", "color/fg/muted")
    token_table(k, b, D, SURFACE_ROLES, "Surface tokens")
    token_table(k, b, D, SHADOW_ROLES, "Shadow tokens", "used by elevation levels 1–4")
    rules(k, b, [("Use the lowest surface that works", "Most content belongs on bg/surface. Raised and overlay are for things that truly sit above the page."),
                 ("Overlays always get an outline", "Menus, popovers and dialogs use bg/surface-overlay with border/subtle — never a shadow alone."),
                 ("Dim the page behind dialogs", "bg/scrim sits between the page and a modal dialog so focus stays on the dialog.")])
    finish(k, b, "05")
    return b


# ------------------------------------------------------------ 06 Text, icons and outlines
TEXT_ROLES = ["color/fg/default", "color/fg/muted", "color/fg/subtle", "color/fg/brand", "color/fg/link", "color/fg/link-hover", "color/fg/disabled", "color/fg/icon", "color/fg/icon-subtle"]
LINE_ROLES = ["color/border/subtle", "color/border/default", "color/border/strong", "color/border/input"]


def ch06(k, D):
    b = start(k, "06", "Three text levels are enough for almost any screen. Icons get the weight of the text beside them. Outlines come in two kinds: the ones that only separate, and the ones that show where a control is.")
    s = k.section(b, "Three levels of text", "One project card, each line labelled with its role.")
    r = k.row(s, 40, align="min")
    c = k.frame(r, "Example", gap=6, pad=24, w=460, bind="color/bg/surface", radius=12, stroke="color/border/subtle")
    for txt, sty, role in [("Website redesign", "h2", "color/fg/default"), ("Marketing · 12 tasks · Due 30 Nov", "body", "color/fg/muted"), ("Updated 2 hours ago", "small", "color/fg/subtle"), ("View project brief", "body", "color/fg/link")]:
        l = k.row(c, 8, align="center"); t = k.text(l, txt, sty, role)
        if role.endswith("link"): k.f.cmd("text.style", id=t, textDecoration="underline")
        k.tag(l, role.replace("color/", ""))
    leg = k.frame(r, "Legend", gap=14, sizingH="fill")
    for role, why in [("fg/default", "Main content and headings. If in doubt, use this."), ("fg/muted", "Supporting details people read after the main line."),
                      ("fg/subtle", "Timestamps, captions, placeholders — still 4.5 : 1."), ("fg/link", "Links, always underlined.")]:
        k.marked(leg, role, why)
    s = k.section(b, "Icons", "3 : 1 against their background. Match the icon to the text it sits beside.")
    r = k.row(s, 16)
    for glyph, label, role in [("⚙", "Settings", "fg/icon"), ("›", "Chevron", "fg/icon-subtle"), ("!", "Warning", "fg/warning"), ("✓", "Done", "fg/success"), ("★", "Favourite", "fg/brand")]:
        c = k.card(r, 8, 20, align="center"); k.text(c, glyph, "h1", "color/" + role); k.text(c, label, "small", weight=600); k.chip(c, role)
    s = k.section(b, "Two kinds of outline", "Ask one question: would someone miss the control if this line disappeared?")
    r = k.row(s, 24, align="min")
    c = k.card(r, 12)
    k.text(c, "Separates content", "h3"); k.text(c, "Dividers and card edges. Decorative — exempt from contrast.", "small", "color/fg/muted", fill=True)
    for v in ["color/border/subtle", "color/border/default"]:
        ln = k.frame(c, v, "horizontal", 12, 12, sizingH="fill", bind="color/bg/surface", radius=8, stroke=v, align="center"); k.text(ln, v.replace("color/", ""), "mono")
    c = k.card(r, 12)
    k.text(c, "Shows a control", "h3"); k.text(c, "Inputs, checkboxes, secondary buttons. Must reach 3 : 1 — people need the edge to find the control.", "small", "color/fg/muted", fill=True)
    for v in ["color/border/input", "color/border/strong"]:
        ln = k.frame(c, v, "horizontal", 12, 12, sizingH="fill", bind="color/bg/surface", radius=8, stroke=v, align="center"); k.text(ln, v.replace("color/", ""), "mono")
    token_table(k, b, D, TEXT_ROLES, "Text and icon tokens")
    token_table(k, b, D, LINE_ROLES, "Outline tokens")
    rules(k, b, [("No custom greys", "A lighter grey for 'less important' is unchecked and often fails on hover or selected rows. Use fg/muted or fg/subtle."),
                 ("Placeholders are not labels", "They vanish when people type. Keep a visible label in fg/default."),
                 ("Brand text is for short emphasis", "Long passages in fg/brand tire the eye and look like links.")])
    finish(k, b, "06")
    return b


# ------------------------------------------------------------ 07 Actions and states
ACTION_ROLES = [f"color/action/{k_}/{p}" for k_, ps in [("primary", ["bg", "bg-hover", "bg-pressed", "fg"]), ("secondary", ["bg", "bg-hover", "bg-pressed", "fg", "border"]),
                                                       ("ghost", ["bg", "bg-hover", "bg-pressed", "fg"]), ("danger", ["bg", "bg-hover", "bg-pressed", "fg"]),
                                                       ("disabled", ["bg", "fg", "border"])] for p in ps]
STATE_ROLES = ["color/bg/surface-hover", "color/bg/surface-pressed", "color/bg/state-hover", "color/bg/state-pressed", "color/bg/item-hover", "color/bg/item-pressed",
               "color/bg/disabled", "color/border/focus"]
BRAND_ROLES = ["color/bg/brand", "color/bg/brand-hover", "color/bg/brand-pressed", "color/bg/brand-subtle", "color/fg/on-brand"]


def ch07(k, D):
    b = start(k, "07", "Buttons are named by importance, not colour. Every interactive state has its own role, and states move in the direction that keeps the label readable.")
    s = k.section(b, "Buttons by importance", "One primary action per view. Ghost for quiet actions. Danger only for things that can't be undone.")
    for mode in ["Light", "Dark"]:
        tbl = k.frame(s, mode, gap=16, pad=28, sizingH="fill", bind="color/bg/surface", radius=16, stroke="color/border/subtle")
        k.f.cmd("variable.setMode", ids=[tbl], collection="Color", mode=mode)
        hdr = k.row(tbl, 20); c = k.frame(hdr, "m", w=140); k.text(c, mode.upper(), "caption", "color/fg/subtle", weight=700)
        for st in ["Default", "Hover", "Pressed", "Focused", "Disabled"]:
            c = k.frame(hdr, st, sizingH="fill"); k.text(c, st, "caption", "color/fg/muted")
        for kind, label in [("primary", "Save changes"), ("secondary", "Cancel"), ("ghost", "Add filter"), ("danger", "Delete")]:
            row = k.row(tbl, 20, kind, align="center")
            lc = k.frame(row, "label", w=140); k.text(lc, kind.capitalize(), "body", weight=600)
            border = "color/action/secondary/border" if kind == "secondary" else None
            for st, sfx in [("Default", ""), ("Hover", "-hover"), ("Pressed", "-pressed")]:
                c = k.frame(row, st, sizingH="fill"); k.btn(c, f"color/action/{kind}/bg{sfx}", f"color/action/{kind}/fg", label, border=border)
            c = k.frame(row, "Focused", sizingH="fill"); rg = k.ring(c); k.btn(rg, f"color/action/{kind}/bg", f"color/action/{kind}/fg", label, border=border)
            c = k.frame(row, "Disabled", sizingH="fill"); k.btn(c, "color/action/disabled/bg", "color/action/disabled/fg", label, border="color/action/disabled/border")
    s = k.section(b, "How states are derived", "The fill steps through grades and the label keeps a gap of 50 or more at every step.")
    r = k.row(s, 24, align="min")
    for br in [D["brands"][0], D["brands"][3]]:
        c = k.card(r, 14)
        k.text(c, f"{br['label']} · {br['hex']}", "h3")
        k.text(c, f"Brand sits at grade {br['grade']}, so the fill uses grade {br['fillGrade']} with {'white' if br['on'] == '#FFFFFF' else 'black'} labels.", "small", "color/fg/muted", fill=True)
        rr = k.row(c, 12, align="max", fill=False)
        for lab, hexv in [("Default", br["fill"]), ("Hover", br["hover"]), ("Pressed", br["pressed"])]:
            col = k.frame(rr, lab, gap=6, align="center")
            bt = k.frame(col, "Button", "horizontal", 0, 0, fill=hexv, radius=4, align="center"); k.pad(bt, 18, 18, 10, 10)
            k.text(bt, "Save", "small", br["on"], weight=600); k.text(col, lab, "caption", "color/fg/muted")
    s = k.section(b, "Hover on any surface", "Tints for the low surfaces, solid item colours inside menus and dialogs.")
    left = k.with_why(s, "In Dark, lifting a menu or dialog surface even slightly closes the gap to the text on it — we measured brand text falling to 2.8 : 1. So items in overlays step to a solid shade instead.")
    r = k.row(left, 20, align="min")
    for mode in ["Light", "Dark"]:
        c = k.frame(r, mode, gap=12, pad=20, sizingH="fill", bind="color/bg/canvas", radius=12, stroke="color/border/subtle")
        k.f.cmd("variable.setMode", ids=[c], collection="Color", mode=mode)
        k.text(c, mode.upper(), "caption", "color/fg/subtle", weight=700)
        sv = k.frame(c, "On surface", gap=4, pad=8, sizingH="fill", bind="color/bg/surface", radius=8)
        for lab, bg in [("Row", None), ("bg/state-hover", "color/bg/state-hover"), ("bg/state-pressed", "color/bg/state-pressed")]:
            it = k.frame(sv, lab, "horizontal", 0, 8, sizingH="fill", bind=bg, radius=6); k.pad(it, 10, 10); k.text(it, lab, "small")
        ov = k.frame(c, "Menu", gap=4, pad=8, sizingH="fill", bind="color/bg/surface-overlay", radius=8, stroke="color/border/subtle", shadow=(3, (0, 6, 16)))
        for lab, bg in [("Menu item", None), ("bg/item-hover", "color/bg/item-hover"), ("bg/item-pressed", "color/bg/item-pressed")]:
            it = k.frame(ov, lab, "horizontal", 0, 8, sizingH="fill", bind=bg, radius=6); k.pad(it, 10, 10); k.text(it, lab, "small")
    s = k.section(b, "Selected, focused, disabled", "Three states people confuse.")
    r = k.row(s, 20, align="min")
    c = k.card(r, 10)
    it = k.frame(c, "Selected", "horizontal", 8, 10, sizingH="fill", bind="color/bg/selected", radius=6, align="center"); k.pad(it, 12, 12); k.text(it, "✓  Mobile app", "small", weight=600)
    k.text(c, "Selected", "h3"); k.text(c, "The chosen one, until changed. bg/selected plus a check or bold label.", "small", "color/fg/muted", fill=True)
    c = k.card(r, 10)
    rg = k.ring(c); k.btn(rg, "color/action/secondary/bg", "color/action/secondary/fg", "Cancel", border="color/action/secondary/border")
    k.text(c, "Focused", "h3"); k.text(c, "Where the keyboard is. A 2px border/focus ring with a 2px gap — never removed.", "small", "color/fg/muted", fill=True)
    c = k.card(r, 10)
    k.btn(c, "color/action/disabled/bg", "color/action/disabled/fg", "Save changes", border="color/action/disabled/border")
    k.text(c, "Disabled", "h3"); k.text(c, "Exempt from contrast — so explain nearby why it's disabled; never hide information in it.", "small", "color/fg/muted", fill=True)
    token_table(k, b, D, ACTION_ROLES, "Action tokens")
    token_table(k, b, D, STATE_ROLES, "State tokens")
    token_table(k, b, D, BRAND_ROLES, "Brand fill tokens", "badges, highlights and custom brand fills")
    rules(k, b, [("One primary per view", "Two primary buttons make people choose between equals. Make the second one secondary."),
                 ("Ghost buttons don't go in sunken wells", "Brand text on a tinted well lands exactly on 4.5 : 1 — move the button or use secondary."),
                 ("Never remove the focus ring", "Keyboard users lose their place. Restyle it only through border/focus.")])
    finish(k, b, "07")
    return b


# ------------------------------------------------------------ 08 Status and data
STATUS_ROLES = [p for s_ in STATUSES for p in [f"color/bg/{s_}", f"color/bg/{s_}-hover", f"color/bg/{s_}-pressed", f"color/bg/{s_}-subtle", f"color/fg/{s_}", f"color/fg/on-{s_}", f"color/border/{s_}"]]
DATA_ROLES = ["color/fg/positive", "color/fg/negative", "color/data/positive", "color/data/negative", "color/data/neutral", "color/data/axis", "color/data/gridline"] + [f"color/data/chart-{n}" for n in range(1, 9)]
COPY = {"success": ("Changes saved", "Your project settings were updated."), "warning": ("Storage almost full", "You've used 92% of your 50 GB."),
        "danger": ("Upload failed", "The file is over 25 MB. Nothing was uploaded."), "info": ("New version available", "Refresh to get the latest features.")}


def ch08(k, D):
    b = start(k, "08", "Four intents say what happened: success, warning, danger, info. Data has its own roles for good and bad change and for chart series — tuned so they read for everyone, including people with colour-blindness.")
    s = k.section(b, "What each intent means", "Pick the intent that matches what happened, not the colour you want.")
    r = k.row(s, 20, align="min")
    for it, means, words in [("success", "Something finished as expected.", "Saved · Sent · Verified"), ("warning", "Needs attention soon; nothing is broken yet.", "Expires soon · Almost full · Pending"),
                             ("danger", "Something failed, or can't be undone.", "Failed · Rejected · Delete"), ("info", "Neutral news people may want.", "New · Updated · Tip")]:
        c = k.card(r, 10)
        hd = k.row(c, 10, align="center")
        dot = k.frame(hd, "Icon", "horizontal", 0, 0, w=32, h=32, sizingV=None, bind=f"color/bg/{it}-subtle", radius=16, align="center", main="center"); k.text(dot, GLYPH[it], "h3", f"color/fg/{it}")
        k.text(hd, it.capitalize(), "h3"); k.text(c, means, "body", fill=True); k.text(c, words, "small", "color/fg/muted", fill=True)
    s = k.section(b, "Messages", "Tinted background, intent-coloured icon, normal text — in both modes.")
    r = k.row(s, 20, align="min")
    for mode in ["Light", "Dark"]:
        col = k.frame(r, mode, gap=10, pad=20, sizingH="fill", bind="color/bg/canvas", radius=12, stroke="color/border/subtle")
        k.f.cmd("variable.setMode", ids=[col], collection="Color", mode=mode)
        k.text(col, mode.upper(), "caption", "color/fg/subtle", weight=700)
        for st in STATUSES:
            a = k.frame(col, st, "horizontal", 12, 14, sizingH="fill", bind=f"color/bg/{st}-subtle", radius=8)
            k.text(a, GLYPH[st], "body", f"color/fg/{st}", weight=700)
            tx = k.frame(a, "Text", gap=2, sizingH="fill"); k.text(tx, COPY[st][0], "small", weight=600); k.text(tx, COPY[st][1], "caption", "color/fg/muted", weight=400)
        row = k.row(col, 8, fill=False, wrap=True)
        for st, word in [("success", "Done"), ("warning", "Pending"), ("danger", "Failed"), ("info", "New")]:
            bd = k.frame(row, word, "horizontal", 4, 0, bind=f"color/bg/{st}", radius=99, align="center"); k.pad(bd, 10, 10, 4, 4)
            k.text(bd, f"{GLYPH[st]} {word}", "caption", f"color/fg/on-{st}", weight=700)
    s = k.section(b, "Good and bad change", "Colour says whether a change is good or bad; the arrow says which way it went. A falling error rate is good news: green with ▼.")
    r = k.row(s, 20, align="min")
    for mode in ["Light", "Dark"]:
        dd = D["data"][mode]
        c = k.frame(r, mode, gap=16, pad=24, sizingH="fill", bind="color/bg/surface", radius=12, stroke="color/border/subtle")
        k.f.cmd("variable.setMode", ids=[c], collection="Color", mode=mode)
        k.text(c, mode.upper(), "caption", "color/fg/subtle", weight=700)
        row = k.row(c, 28, fill=False)
        for nm, val, var in [("Active users", "▲ +2.4%", "color/fg/positive"), ("Error rate", "▼ −0.9%", "color/fg/positive"), ("Load time", "▲ +0.4 s", "color/fg/negative")]:
            q = k.frame(row, nm, gap=2); k.text(q, nm, "caption", "color/fg/muted"); k.text(q, val, "h3", var)
        cnd = k.row(c, 8, "Trend", align="max", fill=False)
        for hgt, up in [(50, 1), (36, 0), (64, 1), (30, 0), (78, 1), (44, 0), (58, 1), (70, 1)]:
            k.rect(cnd, 14, hgt, bind="color/data/positive" if up else "color/data/negative", radius=2)
        cv = k.row(c, 16, fill=False)
        for t, v in dd["cvd"].items():
            q = k.frame(cv, t, gap=2); k.text(q, t, "caption", "color/fg/subtle"); k.text(q, f"{v:.3f}", "small", weight=700)
    k.inst("note", s, {"Body": "The numbers are the distance between the positive and negative colours as seen with each type of colour vision (OKLab). The engine requires 0.10 or more for every type, and the arrow is required anyway."}, fill=True)
    s = k.section(b, "Chart series", "Use series in order. Every pair stays 0.07 or more apart for the three common colour-vision types (Okabe-Ito scores 0.076), and every mark keeps 3 : 1 on the surface.")
    r = k.row(s, 20, align="min")
    for mode in ["Light", "Dark"]:
        c = k.frame(r, mode, gap=12, pad=24, sizingH="fill", bind="color/bg/surface", radius=12, stroke="color/border/subtle")
        k.f.cmd("variable.setMode", ids=[c], collection="Color", mode=mode)
        k.text(c, mode.upper(), "caption", "color/fg/subtle", weight=700)
        bars = k.row(c, 12, "Bars", align="max", fill=False)
        for n in range(1, 9):
            col = k.frame(bars, f"chart-{n}", gap=6, align="center")
            k.rect(col, 40, 40 + (n * 37) % 70, bind=f"color/data/chart-{n}", radius=4); k.text(col, str(n), "caption", "color/fg/muted")
    token_table(k, b, D, STATUS_ROLES, "Status tokens")
    token_table(k, b, D, DATA_ROLES, "Data tokens")
    rules(k, b, [("Words first, colour second", "Write the status in words, then add colour and an icon. Never the other way round."),
                 ("Changes always carry an arrow", "Red and green look alike to about 1 in 12 men. The arrow is what makes the change readable — and it shows direction, which colour doesn't."),
                 ("Decide good or bad per metric", "Fewer errors, lower cost and faster load are good news: fg/positive with ▼. Pick the role by meaning, not by direction."),
                 ("Brand is not an intent", "Brand colour means 'this is us', not 'this worked'.")])
    finish(k, b, "08")
    return b


# ------------------------------------------------------------ 09 What goes on what
FIXES = {"color/fg/subtle|color/bg/brand": "fg/on-brand", "color/fg/brand|color/bg/brand": "fg/on-brand", "color/fg/on-brand|color/bg/warning": "fg/on-warning",
         "color/fg/positive|color/bg/success": "fg/on-success", "color/fg/muted|color/bg/danger": "fg/on-danger", "color/border/subtle|color/bg/surface": "border/input"}


def ch09(k, D):
    b = start(k, "09", "Every text, icon and outline role lists the backgrounds it may sit on, and every listed pair is measured in both modes. If a pair isn't here, it isn't supported.", w=1840)
    LK = {m: {(p["fg"], p["bg"], p["over"]): p["ratio"] for p in D["pairsAll"][m]} for m in ["Light", "Dark"]}
    for sec, title, intro, fgs, kind in [
        ("A", "Text on backgrounds", "Needs 4.5 : 1. Each cell shows Light on the left, Dark on the right.", ["fg/default", "fg/muted", "fg/subtle", "fg/brand", "fg/link", "fg/success", "fg/warning", "fg/danger", "fg/info", "fg/positive", "fg/negative"], "text"),
        ("B", "Icons on backgrounds", "Needs 3 : 1.", ["fg/icon", "fg/icon-subtle"], "icon"),
        ("C", "Outlines on backgrounds", "Needs 3 : 1 — these show where a control is.", ["border/input", "border/strong", "border/focus", "border/danger"], "line")]:
        s = k.section(b, title, intro)
        tbl = k.card(s, 6, 20)
        head = k.row(tbl, 6)
        k.frame(head, "corner", w=180, h=20, sizingV=None)
        for bg in TEXT_BGS:
            hc = k.frame(head, bg, sizingH="fill"); k.text(hc, bg, "caption", "color/fg/muted")
        for fg in fgs:
            row = k.row(tbl, 6, fg, align="center")
            lc = k.frame(row, "label", "horizontal", w=180, h=44, sizingV=None, align="center"); k.text(lc, fg, "mono", weight=600)
            for bg in TEXT_BGS:
                cell = k.frame(row, bg, "horizontal", 4, 0, sizingH="fill")
                for mode in ["Light", "Dark"]:
                    ratio = LK[mode].get((f"color/{fg}", f"color/bg/{bg}", None))
                    half = k.frame(cell, mode, "horizontal", 6, 8, sizingH="fill", radius=6, bind=f"color/bg/{bg}" if ratio else None, align="center", stroke=None if ratio else "color/border/subtle")
                    k.f.cmd("variable.setMode", ids=[half], collection="Color", mode=mode)
                    if not ratio:
                        k.text(half, "—", "caption", "color/fg/subtle"); continue
                    if kind == "line": k.frame(half, "line", w=16, h=16, sizingV=None, radius=3, stroke=f"color/{fg}", strokeW=2)
                    elif kind == "icon": k.text(half, "●", "small", f"color/{fg}")
                    else: k.text(half, "Aa", "small", f"color/{fg}", weight=700)
                    k.text(half, f"{ratio:.1f}", "caption", f"color/{fg}" if kind != "line" else "color/fg/default", weight=700)
    s = k.section(b, "Tints over surfaces", "Hover and pressed tints are measured on top of each surface they're allowed on.")
    tbl = k.card(s, 8, 20)
    for layer in ["state-hover", "state-pressed"]:
        row = k.row(tbl, 8, layer, align="center")
        lc = k.frame(row, "label", "horizontal", w=180, h=40, sizingV=None, align="center"); k.text(lc, "bg/" + layer, "mono", weight=600)
        for base in ["canvas", "surface", "surface-sunken"]:
            for mode in ["Light", "Dark"]:
                outer = k.frame(row, base + mode, "horizontal", 0, 0, sizingH="fill", radius=8, bind=f"color/bg/{base}")
                k.f.cmd("variable.setMode", ids=[outer], collection="Color", mode=mode)
                cell = k.frame(outer, "tint", "horizontal", 8, 10, sizingH="fill", radius=8, bind=f"color/bg/{layer}", align="center")
                for fg in ["fg/default", "fg/muted", "fg/brand"]:
                    ratio = LK[mode].get((f"color/{fg}", f"color/bg/{layer}", f"color/bg/{base}"))
                    k.text(cell, f"{ratio:.1f}" if ratio else "—", "caption", f"color/{fg}", weight=700)
                k.text(cell, f"{base} · {mode[0]}", "caption", "color/fg/subtle", weight=400)
    s = k.section(b, "Not allowed", "Pairs outside the contract, measured. Each fails in at least one mode — and each has a role that fixes it.")
    r = k.row(s, 24, wrap=True)
    for bad in D["bad"]:
        c = k.frame(r, bad["label"], gap=12, pad=24, w=530, bind="color/bg/surface", radius=16, stroke="color/border/subtle")
        k.inst("avoid", c)
        demo = k.frame(c, "Demo", "horizontal", 12, 20, sizingH="fill", bind=bad["bg"], radius=10, align="center")
        if bad["fg"].startswith("color/border"):
            bx = k.frame(demo, "Input", "horizontal", 0, 0, w=220, h=40, sizingV=None, bind="color/bg/surface", radius=4, align="center", stroke=bad["fg"]); k.pad(bx, 12)
            k.text(bx, "Project name", "body", "color/fg/subtle")
        else:
            k.text(demo, "Aa  Save changes", "h3", bad["fg"])
        k.text(c, bad["label"], "h3", fill=True)
        k.text(c, f"{bad['fg'].replace('color/', '')} on {bad['bg'].replace('color/', '')}", "mono", "color/fg/muted")
        k.text(c, f"Light {bad['Light']:.2f} : 1  ·  Dark {bad['Dark']:.2f} : 1  ·  needs {bad['min']} : 1", "small", "color/fg/danger", weight=600)
        fx = k.row(c, 8, align="center"); k.inst("do", fx); k.text(fx, "Use " + FIXES[f"{bad['fg']}|{bad['bg']}"], "small", weight=600)
    rules(k, b, [("Solid fills take their on- colour", "On bg/brand, bg/danger and the other solids, text is always the matching fg/on-*."),
                 ("Unlisted means unsupported", "If you need a pair that isn't here, it's a new role — see Modes and brands for how to add one.")])
    finish(k, b, "09")
    return b


# ------------------------------------------------------------ 10 Choosing and using colour
def ch10(k, D):
    b = start(k, "10", "Two questions get you to the right role almost every time: what are you colouring, and what is its job? Then check your choice against the do-and-avoid pairs.")
    s = k.section(b, "Decision guide", "Pick the column for what you're colouring, then answer its question.")
    cols = k.row(s, 16, align="min")
    branches = [("A background", "Where does it sit?", [("The page", "bg/canvas"), ("Card, panel, table", "bg/surface"), ("Set back in a card", "bg/surface-sunken"), ("Sticky header", "bg/surface-raised"), ("Menu or dialog", "bg/surface-overlay"), ("Selected item", "bg/selected"), ("A message", "bg/success-subtle …")]),
                ("Text", "How important?", [("Main content", "fg/default"), ("Supporting", "fg/muted"), ("Meta, timestamps", "fg/subtle"), ("A link", "fg/link"), ("Status words", "fg/danger …"), ("On a solid fill", "fg/on-brand …")]),
                ("An icon", "Does it carry meaning?", [("Beside a label", "fg/icon"), ("Chevron, decoration", "fg/icon-subtle"), ("Status", "fg/success …"), ("In a button", "action/…/fg")]),
                ("An outline", "Shows where a control is?", [("Input, checkbox", "border/input"), ("Button, toggle", "border/strong"), ("Divider, card edge", "border/subtle"), ("Keyboard focus", "border/focus"), ("Field in error", "border/danger")]),
                ("A button", "How important?", [("The main action", "action/primary"), ("An alternative", "action/secondary"), ("Quiet, toolbars", "action/ghost"), ("Deletes, cancels", "action/danger")]),
                ("Data and charts", "What does it show?", [("A good change", "fg/positive + arrow"), ("A bad change", "fg/negative + arrow"), ("Several series", "data/chart-1 … 8"), ("Axes", "data/axis")])]
    for i, (what, q, answers) in enumerate(branches):
        c = k.card(cols, 10, 18)
        k.text(c, what, "h3"); k.text(c, q, "small", "color/fg/muted", fill=True)
        for a, role in answers:
            line = k.frame(c, a, gap=2, pad=10, sizingH="fill", bind="color/bg/surface-sunken", radius=8)
            k.text(line, a, "small", fill=True); k.text(line, "→ " + role, "mono", "color/fg/brand", weight=600)
    s = k.section(b, "Worked example", "A project list row, coloured one decision at a time.")
    r = k.row(s, 40, align="center")
    ex = k.frame(r, "Example", gap=0, w=760, bind="color/bg/surface", radius=12, stroke="color/border/subtle")
    hd = k.frame(ex, "Header", "horizontal", 10, 16, sizingH="fill", align="center"); k.pad(hd, 20, 20)
    k.text(hd, "Projects", "h3"); k.tag(hd, "bg/surface"); k.spacer(hd)
    gb = k.frame(hd, "Ghost", "horizontal", 6, 0, bind="color/action/ghost/bg", radius=4, align="center"); k.pad(gb, 10, 10, 6, 6)
    k.text(gb, "+ New", "small", "color/action/ghost/fg", weight=600); k.tag(hd, "action/ghost")
    rw = k.frame(ex, "Row", "horizontal", 12, 16, sizingH="fill", align="center", stroke="color/border/subtle"); k.pad(rw, 20, 20)
    k.f.tool("set_properties", ids=[rw], props={"strokeSides": [1, 0, 0, 0]})
    col = k.frame(rw, "Name", gap=2)
    n1 = k.row(col, 8, align="center", fill=False); k.text(n1, "Website redesign", "body", weight=600); k.tag(n1, "fg/default")
    n2 = k.row(col, 8, align="center", fill=False); k.text(n2, "Marketing · 12 tasks", "small", "color/fg/muted"); k.tag(n2, "fg/muted")
    k.spacer(rw)
    pr = k.row(rw, 8, align="center", fill=False); k.text(pr, "▲ 8 done this week", "body", "color/fg/positive", weight=600); k.tag(pr, "fg/positive")
    k.tag(rw, "border/subtle")
    leg = k.frame(r, "Legend", gap=12, sizingH="fill")
    for role, why in [("bg/surface", "The row sits on a card."), ("fg/default", "The name is the main content."), ("fg/muted", "Team and size support it."),
                      ("fg/positive + ▲", "A good change — colour plus arrow."), ("border/subtle", "The divider only separates rows."), ("action/ghost", "A quiet action in a card.")]:
        k.marked(leg, role, why)
    s = k.section(b, "Do and avoid", "Each pair shows the right way, the common mistake and why it matters.")
    pairs_ = [("Show change with an arrow", "▲ +2.4%", "color/fg/positive", "Colour alone for change", "+2.4%", "color/fg/positive", "Red and green look alike to many people. The arrow carries the meaning."),
              ("Underline links", "View report", "color/fg/link", "Links shown by colour only", "View report", "color/fg/link", "Without an underline, a link is just blue text to anyone who can't tell blue from black."),
              ("Use the on- colour on a fill", "Save", "color/action/primary/fg", "Brand text on the brand fill", "Save", "color/fg/brand", "Brand text on the brand fill is 1.2 : 1 — the label disappears."),
              ("Inputs use border/input", "Project name", "color/border/input", "Decorative outlines on inputs", "Project name", "color/border/subtle", "If people can't see a field's edge, they can't find where to type.")]
    for i, (dt, ds, dc, at, as_, ac, why) in enumerate(pairs_):
        r = k.row(s, 20, align="min")
        for kind, title, sample, colvar in [("do", dt, ds, dc), ("avoid", at, as_, ac)]:
            c = k.card(r, 12, 20); k.inst(kind, c)
            demo = k.frame(c, "Demo", "horizontal", 0, 16, sizingH="fill", radius=10, bind="color/bg/surface-sunken", align="center")
            if i == 1:
                t_ = k.text(demo, sample, "h3", colvar)
                if kind == "do": k.f.cmd("text.style", id=t_, textDecoration="underline")
            elif i == 2: k.btn(demo, "color/action/primary/bg", colvar, sample)
            elif i == 3:
                fld = k.frame(demo, "Field", "horizontal", 0, 0, w=220, h=40, sizingV=None, bind="color/bg/surface", radius=4, align="center", stroke=colvar); k.pad(fld, 12)
                k.text(fld, sample, "body", "color/fg/subtle")
            else: k.text(demo, sample, "h2", colvar)
            k.text(c, title, "body", weight=600, fill=True)
        k.inst("why", r, {"Body": why})
    s = k.section(b, "A real screen", "A dashboard built only from roles — the same frame in Light and Dark.")
    for mode in ["Light", "Dark"]:
        screen(k, s, mode)
    finish(k, b, "10")
    return b


def screen(k, parent, mode):
    s = k.frame(parent, f"Screen {mode}", gap=0, sizingH="fill", bind="color/bg/canvas", radius=16, stroke="color/border/subtle")
    k.f.cmd("variable.setMode", ids=[s], collection="Color", mode=mode)
    hd = k.frame(s, "Header", "horizontal", 20, 16, sizingH="fill", bind="color/bg/surface-raised", align="center", stroke="color/border/subtle"); k.pad(hd, 28, 28)
    k.f.tool("set_properties", ids=[hd], props={"strokeSides": [0, 0, 1, 0]})
    k.text(hd, "Dashboard", "h3"); k.spacer(hd)
    for t, c in [("Projects", "color/fg/muted"), ("Team", "color/fg/muted"), ("Reports", "color/fg/link")]: k.text(hd, t, "small", c, weight=500)
    body = k.frame(s, "Body", "horizontal", 20, 28, sizingH="fill")
    left = k.frame(body, "Left", gap=20, sizingH="fill")
    stats = k.row(left, 16)
    for lab, val, delta, role in [("Active users", "12,480", "▲ +2.4% this week", "color/fg/positive"), ("Error rate", "0.8%", "▼ −0.9% this week", "color/fg/positive"), ("Load time", "1.9 s", "▲ +0.4 s this week", "color/fg/negative")]:
        pc = k.card(stats, 4, 20)
        k.text(pc, lab, "small", "color/fg/muted"); k.text(pc, val, "h2"); k.text(pc, delta, "small", role, weight=600)
    wl = k.card(left, 0, 0)
    hr = k.frame(wl, "Head", "horizontal", 16, 12, sizingH="fill", bind="color/bg/surface-sunken"); k.pad(hr, 22, 22)
    for t, fl in [("Project", True), ("Due", False), ("Status", False)]:
        cc = k.frame(hr, t, sizingH="fill" if fl else None, w=None if fl else 140); k.text(cc, t, "caption", "color/fg/muted", weight=700)
    for nm, due, st, sel in [("Website redesign", "30 Nov", "success", 0), ("Mobile app", "12 Dec", "warning", 1), ("Onboarding flow", "4 Dec", "success", 0)]:
        row = k.frame(wl, nm, "horizontal", 16, 12, sizingH="fill", bind="color/bg/selected" if sel else None, align="center", stroke="color/border/subtle"); k.pad(row, 22, 22)
        k.f.tool("set_properties", ids=[row], props={"strokeSides": [1, 0, 0, 0]})
        c1 = k.frame(row, "n", sizingH="fill"); k.text(c1, ("✓ " if sel else "") + nm, "body", weight=600)
        c2 = k.frame(row, "d", w=140); k.text(c2, due, "body", "color/fg/muted")
        c3 = k.frame(row, "s", w=140); k.text(c3, ("✓ On track" if st == "success" else "! At risk"), "small", f"color/fg/{st}", weight=600)
    right = k.frame(body, "New project", gap=14, pad=22, w=380, bind="color/bg/surface", radius=16, stroke="color/border/subtle")
    k.text(right, "New project", "h3")
    for lab, val, focus in [("Project name", "Q1 launch", False), ("Due date", "15 Jan 2027", True)]:
        col = k.frame(right, lab, gap=6, sizingH="fill"); k.text(col, lab, "small", weight=600)
        host = k.ring(col) if focus else col
        inp = k.frame(host, "Input", "horizontal", 0, 0, w=300 if focus else None, h=40, sizingV=None, sizingH=None if focus else "fill", bind="color/bg/surface", radius=4, align="center", stroke="color/border/input"); k.pad(inp, 12)
        k.text(inp, val, "body")
    al = k.frame(right, "Alert", "horizontal", 10, 12, sizingH="fill", bind="color/bg/warning-subtle", radius=8)
    k.text(al, "!", "body", "color/fg/warning", weight=700); k.text(al, "The due date is less than two weeks away.", "small", fill=True)
    k.btn(right, "color/action/primary/bg", "color/action/primary/fg", "Create project", fillw=True)


# ------------------------------------------------------------ 11 Modes and brands
def ch11(k, D):
    b = start(k, "11", "Dark mode is remapped, not inverted, and your brand is one input to the engine. Design once with roles; the mode and the brand do the rest.")
    s = k.section(b, "How roles move between modes", "Light text grades sit high on the scale, Dark ones low — the gap between them stays 50 or more.")
    tbl = k.card(s, 0, 0)
    head = k.frame(tbl, "Head", "horizontal", 24, 12, sizingH="fill", bind="color/bg/surface-sunken"); k.pad(head, 24, 24)
    for t, w in [("Role", 320), ("Light points to", 240), ("Dark points to", 240)]:
        c = k.frame(head, t, w=w); k.text(c, t, "caption", "color/fg/muted", weight=700)
    for rm in D["remap"]:
        rw = k.frame(tbl, rm["v"], "horizontal", 24, 10, sizingH="fill", align="center", stroke="color/border/subtle"); k.pad(rw, 24, 24)
        k.f.tool("set_properties", ids=[rw], props={"strokeSides": [1, 0, 0, 0]})
        c = k.frame(rw, "Role", w=320); k.chip(c, rm["v"].replace("color/", ""))
        for val in [rm["light"], rm["dark"]]:
            c = k.frame(rw, "v", w=240); k.text(c, val, "mono")
    s = k.section(b, "Checking a design in Dark", "Four checks before handoff.")
    for t, body in [("Switch the frame, not the colours", "In Figma, change the frame's Color mode in the right panel. In code, set data-theme=\"dark\" on <html>."),
                    ("Look for hard-coded colours", "Anything that didn't change is a raw hex or a shade. Replace it with a role."),
                    ("Check images", "White backgrounds inside images glow in Dark. Use transparent images or put a surface behind them."),
                    ("Don't trust shadows", "Shadows fade on dark surfaces; floating things also need their lighter surface and an outline.")]:
        k.inst("rule", s, {"Title": t, "Body": body}, fill=True)
    s = k.section(b, "Four brands, same rules", "The same pieces with four brand colours. The engine picks the label colour for each fill.")
    r = k.row(s, 20, align="min")
    for br in D["brands"]:
        c = k.card(r, 12, 20)
        k.frame(c, "Swatch", h=48, sizingV=None, sizingH="fill", fill=br["hex"], radius=8)
        k.text(c, br["label"], "h3"); k.text(c, f"{br['hex']} · grade {br['grade']}", "mono", "color/fg/muted")
        bt = k.frame(c, "Button", "horizontal", 0, 0, fill=br["fill"], radius=4, align="center", main="center", sizingH="fill"); k.pad(bt, 18, 18, 10, 10)
        k.text(bt, "Save changes", "small", br["on"], weight=600)
        k.text(c, f"{'White' if br['on'] == '#FFFFFF' else 'Black'} label · {br['ratio']:.2f} : 1", "small")
        lk = k.text(c, "View report", "small", br["link"]); k.f.cmd("text.style", id=lk, textDecoration="underline")
        sel = k.frame(c, "Selected", "horizontal", 0, 8, sizingH="fill", fill=br["selected"], radius=6); k.pad(sel, 10, 10); k.text(sel, "✓ Selected row", "small")
    s = k.section(b, "What a brand change touches", "So you know what to review.")
    r = k.row(s, 24, align="min")
    for chip, title, items in [("Follows your brand", "Changes", ["The brand scale and every brand role", "Primary buttons, links, selection, focus", "Neutral greys, tinted slightly towards your hue", "The label colour on the brand fill"]),
                               ("Fixed on purpose", "Stays the same", ["Success, warning, danger, info hues", "Positive and negative change", "The chart palette", "Every contrast rule and check"])]:
        c = k.card(r, 10); k.chip(c, chip, "color/bg/brand-subtle" if title == "Changes" else "color/bg/surface-sunken", "color/fg/brand" if title == "Changes" else "color/fg/muted", mono=False)
        k.text(c, title, "h3")
        for t in items: k.text(c, "•  " + t, "body", fill=True)
    k.inst("note", b, {"Body": "To change the brand: set color.brand in the engine config, build, read the report, then import the new variables. Adding a new role follows the same path — name it by its job, choose grades with the gap rule, list its pairs, build. Details live in the developer handoff."}, fill=True)
    finish(k, b, "11")
    return b


CHAPTER_FNS = [ch01, ch02, ch03, ch04, ch05, ch06, ch07, ch08, ch09, ch10, ch11]

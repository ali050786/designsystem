"""Spacing foundation as one systematic story: 10 chapters, each = explain → live examples → tokens → rules.
Every example's padding, gaps and control sizes are bound to the Density variables, so switching a frame's Density mode
in Figma changes them. Every spacing token is documented on exactly one chapter (checked at build time).
All copy is original (clean-room)."""
import json

GROUP = {"Five principles": "Idea", "The spacing scale": "Idea", "How tokens are built": "Structure",
         "Inset: padding": "Directions", "Stack: vertical gaps": "Directions", "Inline: horizontal gaps": "Directions",
         "Controls and targets": "Sizes", "Density": "Combining", "Choosing and using space": "Using", "Readers' settings and products": "Using"}
TEASER = {"The spacing scale": "sixteen values, steps that widen", "How tokens are built": "tiers, collections, modes and names",
          "Inset: padding": "space inside a container", "Stack: vertical gaps": "space between things in a column",
          "Inline: horizontal gaps": "space between things in a row", "Controls and targets": "things people press",
          "Density": "one rule for the whole screen", "Choosing and using space": "a decision guide and a worked example",
          "Readers' settings and products": "bigger text, bigger targets, your own tokens"}
DENS = ["comfortable", "default", "compact"]
documented = []  # every token put in a token table
CH = []  # chapter titles, from the data


# ------------------------------------------------------------ helpers
def T(D, name):
    return next(t for t in D["tokens"] if t["name"] == name)


def fig(name):
    return name.replace(".", "/")


def dmode(k, nid, d):
    k.f.cmd("variable.setMode", ids=[nid], collection="Density", mode=d)


def bind(k, nid, field, token):
    k.f.cmd("variable.bind", ids=[nid], field=field, variable=fig(token))


def bind_pad(k, nid, token, sides="tblr"):
    for s, fld in [("t", "paddingTop"), ("b", "paddingBottom"), ("l", "paddingLeft"), ("r", "paddingRight")]:
        if s in sides: bind(k, nid, fld, token)


def spec(k, parent, text, style, color="color/fg/default", fill=False, width=None, name=None):
    """Text set in a real ds text style."""
    f = k.f
    nid = f.tool("create_node", type="text", parent=parent, text=text, name=name or style, props={"fontFamily": "Inter", "fontSize": 16, "lineHeight": 24})["id"]
    f.cmd("style.apply", ids=[nid], style=k.styles[fig(style)])
    if color.startswith("#"): f.tool("set_properties", ids=[nid], props={"fills": [color]})
    else: f.cmd("variable.bind", ids=[nid], field="fill", variable=color)
    if width:
        f.tool("set_properties", ids=[nid], props={"width": width}); f.tool("set_properties", ids=[nid], props={"sizingH": "fixed"})
    if fill: f.tool("set_properties", ids=[nid], props={"sizingH": "fill"})
    return nid


def start(k, title, lead, w=1440):
    k.page(title)
    b = k.frame(name=title, w=w, pad=80, gap=72, bind="color/bg/canvas")
    k.f.cmd("variable.setMode", ids=[b], collection="Color", mode="Light")
    k.f.cmd("variable.setMode", ids=[b], collection="Responsive", mode="lg")
    dmode(k, b, "default")
    k.inst("page", b, {"Eyebrow": f"Spacing · {GROUP[title]}", "Title": title, "Lead": lead}, fill=True)
    return b


def finish(k, b, title):
    i = CH.index(title)
    if i + 1 >= len(CH):
        c = k.card(b, 8, 24, bind="color/bg/brand-subtle")
        k.text(c, "End of the spacing foundation", "h3")
        k.text(c, "You've seen where every value comes from, which way each family runs, how density moves a whole screen at once and how targets stay big enough. Next in the system: Layout.", "body", "color/fg/muted", fill=True)
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
    """A table card. cols: [(title, width|None)]; rows: [[values]]; cell(frame, col_index, value, width) draws custom cells."""
    tbl = k.card(parent, 0, 0)
    head = k.frame(tbl, "Head", "horizontal", 20, 12, sizingH="fill", bind="color/bg/surface-sunken"); k.pad(head, 24, 24)
    for t, w in cols:
        c = k.frame(head, t, w=w, sizingH=None if w else "fill"); k.text(c, t, "caption", "color/fg/muted", weight=700)
    for vals in rows:
        row = k.frame(tbl, str(vals[0])[:40], "horizontal", 20, 12, sizingH="fill", align="center", stroke="color/border/subtle"); k.pad(row, 24, 24)
        k.f.tool("set_properties", ids=[row], props={"strokeSides": [1, 0, 0, 0]})
        for i, ((t, w), v) in enumerate(zip(cols, vals)):
            c = k.frame(row, t, w=w, sizingH=None if w else "fill")
            if cell and cell(c, i, v, w): continue
            k.text(c, str(v), "small", fill=True)
    return tbl


def bar(k, parent, token, h=12, color="color/bg/brand", name=None):
    """A bar whose width is bound to a spacing variable: it shows the value in the frame's density."""
    nid = k.f.tool("create_node", type="rectangle", parent=parent, width=10, height=h, name=name or f"{fig(token)} bar", props={"cornerRadius": 2})["id"]
    k.f.cmd("variable.bind", ids=[nid], field="fill", variable=color)
    bind(k, nid, "width", token)
    return nid


def pbar(k, parent, px, h=12, color="color/bg/brand", token=None):
    """A bar for a primitive value (bound to the primitive when given)."""
    nid = k.f.tool("create_node", type="rectangle", parent=parent, width=max(px, 0.5), height=h, name=f"{px}px", props={"cornerRadius": 1 if px < 6 else 2})["id"]
    k.f.cmd("variable.bind", ids=[nid], field="fill", variable=color)
    if token and px: bind(k, nid, "width", token)
    return nid


def block(k, parent, label=None, w=None, h=28, bind_="color/bg/surface", stroke="color/border/default", fill=False):
    """A content block used in diagrams (stands for 'a thing')."""
    b = k.frame(parent, label or "Thing", "horizontal", 0, 0, w=w, h=h, sizingV=None, bind=bind_, radius=4, stroke=stroke, align="center", main="center")
    if fill: k.f.tool("set_properties", ids=[b], props={"sizingH": "fill"})
    if label: k.text(b, label, "caption", "color/fg/muted", weight=400)
    return b


def button(k, parent, label, style="type.label.md", kind="primary", icon=None):
    bg, fg, brd = {"primary": ("color/action/primary/bg", "color/action/primary/fg", None),
                   "secondary": ("color/action/secondary/bg", "color/action/secondary/fg", "color/action/secondary/border")}[kind]
    b = k.frame(parent, f"Button · {label}", "horizontal", 0, 0, bind=bg, radius=4, align="center", main="center", stroke=brd)
    bind(k, b, "minHeight", "size.control.height"); bind_pad(k, b, "space.inset.md", "lr"); bind_pad(k, b, "space.inset.xs", "tb"); bind(k, b, "gap", "size.control.icon-gap")
    if icon: spec(k, b, icon, style, fg)
    spec(k, b, label, style, fg)
    return b


def icon_button(k, parent, glyph="⋯", label="More"):
    b = k.frame(parent, f"Icon button · {label}", "horizontal", 0, 0, bind="color/action/secondary/bg", radius=4, align="center", main="center", stroke="color/action/secondary/border")
    bind(k, b, "minHeight", "size.control.height"); bind(k, b, "minWidth", "size.control.height")
    spec(k, b, glyph, "type.label.md", "color/action/secondary/fg")
    return b


def text_input(k, parent, value, style="type.body.md", w=None):
    i = k.frame(parent, "Input", "horizontal", 0, 0, w=w, sizingH=None if w else "fill", bind="color/bg/surface", radius=4, align="center", stroke="color/border/input")
    bind(k, i, "minHeight", "size.control.height"); bind_pad(k, i, "space.inset.md", "lr"); bind_pad(k, i, "space.inset.xs", "tb")
    spec(k, i, value, style, "color/fg/default")
    return i


def field(k, parent, label, value, help=None):
    f_ = k.frame(parent, f"Field · {label}", gap=0, sizingH="fill")
    bind(k, f_, "gap", "space.stack.xs")
    spec(k, f_, label, "type.label.md")
    text_input(k, f_, value)
    if help: spec(k, f_, help, "type.caption.md", "color/fg/muted")
    return f_


def checkbox(k, parent, label, checked=False, show_hit=False):
    row = k.frame(parent, f"Checkbox · {label}", "horizontal", 0, 0, align="center")
    bind(k, row, "gap", "space.inline.sm"); bind(k, row, "minHeight", "size.target.min")
    hit = k.frame(row, "Hit area", "horizontal", 0, 0, align="center", main="center", bind="color/bg/brand-subtle" if show_hit else None, radius=4 if show_hit else None)
    bind(k, hit, "width", "size.target.min"); bind(k, hit, "height", "size.target.min")
    k.f.tool("set_properties", ids=[hit], props={"sizingH": "fixed", "sizingV": "fixed"})
    box = k.rect(hit, 16, 16, bind="color/action/primary/bg" if checked else "color/bg/surface", radius=3, stroke=None if checked else "color/border/input", name="Box")
    spec(k, row, label, "type.body.md")
    return row


def settings_card(k, parent, w=360, title_style="type.title.md", label_style="type.label.md"):
    """A small settings card spaced entirely with Density variables."""
    c = k.frame(parent, "Settings card", gap=0, w=w, bind="color/bg/surface", radius=12, stroke="color/border/subtle")
    bind_pad(k, c, "space.inset.lg"); bind(k, c, "gap", "space.stack.xl")
    head = k.frame(c, "Head", gap=0, sizingH="fill"); bind(k, head, "gap", "space.stack.xs")
    spec(k, head, "Notifications", title_style)
    spec(k, head, "Choose what we send you.", "type.body.sm", "color/fg/muted", fill=True)
    form = k.frame(c, "Fields", gap=0, sizingH="fill"); bind(k, form, "gap", "space.stack.lg")
    field(k, form, "Email", "ali@example.com")
    opts = k.frame(form, "Options", gap=0, sizingH="fill"); bind(k, opts, "gap", "space.stack.sm")
    checkbox(k, opts, "Weekly summary", True); checkbox(k, opts, "Mentions")
    acts = k.frame(c, "Actions", "horizontal", 0, 0, align="center"); bind(k, acts, "gap", "space.inline.sm")
    button(k, acts, "Save", label_style); button(k, acts, "Cancel", label_style, "secondary")
    return c


def space_table(k, parent, D, names, title):
    """Tokens with a live bar in each density (each cell sets its own Density mode) and the px value."""
    s = k.frame(parent, title, gap=14, sizingH="fill")
    hd = k.row(s, 12, align="center"); k.text(hd, title, "h3"); k.text(hd, "px in each density · the bar is the variable itself", "small", "color/fg/muted")
    tbl = k.card(s, 0, 0)
    head = k.frame(tbl, "Head", "horizontal", 16, 12, sizingH="fill", bind="color/bg/surface-sunken"); k.pad(head, 24, 24)
    for t, w in [("Token", 220), ("Use it for", None)] + [(d + (" · default mode" if d == D["defaultDensity"] else ""), 150) for d in DENS]:
        c = k.frame(head, t, w=w, sizingH=None if w else "fill"); k.text(c, t, "caption", "color/fg/muted", weight=700)
    for n in names:
        t = T(D, n)
        documented.append(t["name"])
        row = k.frame(tbl, t["name"], "horizontal", 16, 14, sizingH="fill", align="center", stroke="color/border/subtle"); k.pad(row, 24, 24)
        k.f.tool("set_properties", ids=[row], props={"strokeSides": [1, 0, 0, 0]})
        c = k.frame(row, "Token", gap=4, w=220); k.text(c, t["figma"], "mono")
        if t["fixed"]: k.text(c, "the same in every density", "caption", "color/fg/subtle", weight=400)
        c = k.frame(row, "Use", gap=4, sizingH="fill"); k.text(c, t["use"], "small", fill=True)
        for d in DENS:
            cell = k.frame(row, d, gap=6, w=150)
            dmode(k, cell, d)
            bar(k, cell, t["name"], h=10)
            k.text(cell, f"{t['densities'][d]['px']}", "caption", "color/fg/muted", weight=600)
    return s


def legend(k, parent, items, w=None):
    """Part → token → px, one per line."""
    col = k.frame(parent, "Legend", gap=12, w=w, sizingH=None if w else "fill")
    for part, tok, px in items:
        r = k.row(col, 10, align="center")
        k.tag(r, tok)
        k.text(r, part, "small", fill=True)
        k.text(r, f"{px}px", "caption", "color/fg/muted", weight=600)
    return col


# ------------------------------------------------------------ Five principles
def principles(k, D):
    b = start(k, "Five principles", "Five principles shape every spacing decision in this system. Each one is checked by the build, not left to taste — the demo next to it shows what it means.")
    s = k.section(b, "The principles", "Read them once; every chapter after this one applies them.")
    md = T(D, "space.inset.md")["densities"]["default"]["px"]
    items = [
        ("Closer means related", "The more closely two things belong together, the smaller the space between them. Every family steps up from its smallest size to its largest, in every density.", "near"),
        ("One ladder, three directions", f"A size word means the same distance everywhere: inset/md, stack/md and inline/md are all {md}px in default density. The family only says which way the space runs.", "ladder"),
        ("Density is one rule", f"Compact is one step down the scale and comfortable one step up, for every token. Nothing ever collapses below {D['limits']['minSpace']}px.", "density"),
        ("Targets stay big enough", f"Every pointer target is at least {D['limits']['targetMin']} × {D['limits']['targetMin']}px in every density, and every control fits its label with room above and below.", "target"),
        ("The reader's text gets the room", "Spacing is px and heights are minimums. When people enlarge text, the text gets the extra room and boxes grow with it.", "room"),
    ]
    for t, body, demo in items:
        c = k.frame(s, t, "horizontal", 32, 28, sizingH="fill", bind="color/bg/surface", radius=16, stroke="color/border/subtle", align="center")
        col = k.frame(c, "Text", gap=6, sizingH="fill")
        k.text(col, t, "h2"); k.text(col, body, "body", "color/fg/muted", fill=True)
        d = k.frame(c, "Demo", "horizontal", 16, 20, w=440, bind="color/bg/surface-sunken", radius=12, align="center", main="center")
        if demo == "near":
            frm = k.frame(d, "Form", gap=0, sizingH="fill"); bind(k, frm, "gap", "space.stack.lg")
            field(k, frm, "First name", "Ali"); field(k, frm, "Last name", "Khan")
        elif demo == "ladder":
            for fam, title in [("inset", "inset/md"), ("stack", "stack/md"), ("inline", "inline/md")]:
                m = k.frame(d, title, gap=8, align="center")
                if fam == "inset":
                    box = k.frame(m, "Box", gap=0, bind="color/bg/brand-subtle", radius=4); bind_pad(k, box, "space.inset.md"); block(k, box, w=48, h=24)
                else:
                    box = k.frame(m, "Pair", "vertical" if fam == "stack" else "horizontal", 0, 0, bind="color/bg/brand-subtle", radius=4); bind(k, box, "gap", f"space.{fam}.md")
                    block(k, box, w=48 if fam == "stack" else 24, h=20 if fam == "stack" else 48); block(k, box, w=48 if fam == "stack" else 24, h=20 if fam == "stack" else 48)
                k.text(m, title, "caption", "color/fg/muted", mono=True)
            k.text(d, f"= {md}px", "h3", "color/fg/brand")
        elif demo == "density":
            for dd in DENS:
                m = k.frame(d, dd, gap=6, align="min")
                dmode(k, m, dd)
                k.text(m, dd, "caption", "color/fg/subtle", weight=700)
                for sz in ["sm", "md", "lg", "xl"]: bar(k, m, f"space.stack.{sz}", h=8)
        elif demo == "target":
            m = k.frame(d, "Hit area", gap=8, align="center")
            hit = k.frame(m, "24", "horizontal", 0, 0, w=72, h=72, sizingV=None, bind="color/bg/brand-subtle", radius=8, align="center", main="center", stroke="color/border/focus")
            k.rect(hit, 48, 48, bind="color/bg/surface", radius=6, stroke="color/border/input", name="Drawn 16px")
            k.text(m, "drawn 16px · hit area 24px (shown ×3)", "caption", "color/fg/muted", weight=400)
        else:
            for lab, mar, kind in [("px margins", D["margin"], "do"), ("rem margins", 2 * D["margin"], "avoid")]:
                m = k.frame(d, lab, gap=6)
                k.inst(kind, m)
                ph = k.frame(m, "Phone", "horizontal", 0, 0, w=D["reflow"] // 2, h=56, sizingV=None, bind="color/bg/brand-subtle", radius=6, align="center")
                k.pad(ph, mar // 2, mar // 2)
                block(k, ph, f"{D['reflow'] - 2 * mar}px", h=40, fill=True)
                k.text(m, f"200% text · margins {mar}px", "caption", "color/fg/muted", weight=400)
    s = k.section(b, "How this foundation is organised", "The chapters follow the order you'd build a spacing system in: the idea, the scale, the structure, the three directions, the things people press, how density combines them, how to use it all.")
    grid = k.row(s, 16, wrap=True)
    for t in CH:
        c = k.frame(grid, t, gap=6, pad=18, w=308, bind="color/bg/surface", radius=12, stroke="color/border/subtle")
        k.text(c, GROUP[t].upper(), "caption", "color/fg/subtle", weight=700)
        k.text(c, t, "body", weight=600, fill=True)
        k.text(c, TEASER.get(t, "the principles behind every decision").capitalize(), "small", "color/fg/muted", fill=True)
    finish(k, b, "Five principles")
    return b


# ------------------------------------------------------------ The spacing scale
def scale(k, D):
    b = start(k, "The spacing scale", f"Every value comes from one scale of {len(D['scale'])} values, from 0 to {D['scale'][-1]['px']}px. The steps grow with the space, so neighbours always look different.")
    s = k.section(b, "One scale", "Each bar is the primitive variable itself, drawn at its size.")
    lad = k.card(s, 12, 28, direction="horizontal", align="max")
    for p in D["scale"]:
        col = k.frame(lad, p["token"], gap=6, align="center")
        if p["px"]: pbar(k, col, p["px"], h=p["px"], token=p["token"])
        k.text(col, str(p["px"]), "caption", "color/fg/muted", weight=600)
        k.text(col, fig(p["token"]), "caption", "color/fg/subtle", mono=True)
    s = k.section(b, "Steps widen as space grows", "A 2px difference is easy to see between small spaces and invisible between big ones, so the steps get wider to stay visible.")
    r = k.row(s, 16, align="min")
    for title, a, bb, verdict in [("2px apart up to 8px", 4, 6, "Easy to tell apart"), ("4px apart up to 24px", 16, 20, "Still clear"), ("8px apart up to 64px", 40, 48, "Clear at this size"),
                                  ("A 2px step at 60px", 60, 62, "Can't tell — so the scale doesn't offer it")]:
        c = k.card(r, 10, 20)
        k.text(c, title, "h3")
        for v in (a, bb):
            rr = k.row(c, 8, align="center"); pbar(k, rr, v, h=10); k.text(rr, f"{v}px", "caption", "color/fg/muted", weight=400)
        k.text(c, verdict, "small", "color/fg/muted", fill=True)
    k.inst("note", b, {"Body": f"Reading a primitive: the number counts 4px units — space/4 is 16px, space/0-5 is 2px. These are the numbers Tailwind uses for its spacing scale. From {D['limits']['gridFrom']}px up every value sits on the 4px grid."}, fill=True)
    s = k.section(b, "Where each value is used", "Sizes are the ladder (the same in every family). Read across a row: each size slides one step along the scale from one density to the next.")
    def cell(c, i, v, w):
        if i in (2, 3, 4, 5):
            w_ = k.row(c, 6, wrap=True)
            for n in v: k.chip(w_, n)
            if not v: k.text(w_, "—", "small", "color/fg/subtle")
            return True
        if i == 0: k.text(c, v, "mono"); return True
    rows = []
    for p in D["scale"]:
        documented.append(p["token"])
        rows.append([fig(p["token"]), f"{p['px']}px", p["used"]["comfortable"], p["used"]["default"], p["used"]["compact"], p["links"]])
    grid_table(k, s, [("Token", 140), ("Value", 90), ("comfortable", 200), ("default", 200), ("compact", 200), ("Also linked from", None)], rows, cell)
    rules(k, b, [("Never use a primitive in a design", "space/4 doesn't change with density, so it stays put when the rest of the screen tightens. Use the semantic token for the job."),
                 ("Never add a value between steps", "A 14px or 18px space isn't on the scale and isn't checked. If no token fits, add a token on a step (last chapter).")])
    finish(k, b, "The spacing scale")
    return b


# ------------------------------------------------------------ How tokens are built
def tokens(k, D):
    b = start(k, "How tokens are built", "Spacing comes in tiers: the scale at the bottom, named tokens in the middle, component spacing on top. Each tier only points to the one below it.")
    s = k.section(b, "Tiers", "Designs and code only ever touch the middle tier.")
    r = k.row(s, 16, align="center")
    tiers = [("Primitives", "Primitives · hidden", ["space/3", "space/4", "space/10"], "The scale. Raw values, no meaning."),
             ("Semantic", "Density · default, comfortable, compact", ["space/inset/md", "space/stack/lg", "size/control/height"], "Named by job. One value per density, each pointing to a primitive."),
             ("Components", "Coming with components", ["button/padding", "card/gap"], "Point to semantic tokens. Added when components ship.")]
    for i, (t, sub, ex, body) in enumerate(tiers):
        c = k.card(r, 10, 24, bind="color/bg/brand-subtle" if i == 1 else "color/bg/surface")
        k.text(c, t, "h2"); k.text(c, sub, "caption", "color/fg/subtle", weight=700)
        for e in ex: k.chip(c, e)
        k.text(c, body, "small", "color/fg/muted", fill=True)
        if i < 2: k.text(r, "→", "h1", "color/fg/subtle")
    s = k.section(b, "Collections and modes", "How the tiers appear in Figma's Variables panel. The default density is the collection's first mode, so frames left on Auto use it.")
    grid_table(k, s, [("Collection", 220), ("Modes", 300), ("Count", 120), ("Published", 140), ("Holds", None)], [
        ["Primitives", "Value", str(D["counts"]["prims"]), "Hidden", "The scale, 0 to 96px. Scoped to nothing, so it never shows in pickers"],
        ["Density", " · ".join([D["defaultDensity"]] + [d for d in DENS if d != D["defaultDensity"]]), str(D["counts"]["tokens"]), "Yes", "Spacing tokens (scoped to padding and gaps) and control sizes (scoped to width and height)"]])
    s = k.section(b, "Reading a name", "Category, family, size — general to specific. Density is never in the name; it's a mode.")
    c = k.card(s, 18, 32, direction="horizontal", align="max")
    for p, part in [("space", "Category"), ("/  stack", "Family"), ("/  md", "Size")]:
        col = k.frame(c, part, gap=10, align="center")
        k.text(col, p, "h1", "color/fg/brand" if part == "Family" else "color/fg/default")
        k.text(col, part.upper(), "caption", "color/fg/subtle", weight=700)
    ld = " · ".join(f"{s_} {v}" for s_, v in D["ladder"].items())
    leg = k.row(s, 24, align="min")
    for t, sub in [("Category", "space for spacing, size for things people press."), ("Family", "Which way the space runs: inset (padding), stack (vertical), inline (horizontal)."),
                   ("Size", f"One ladder for every family: {ld} px in default density.")]:
        k.marked(leg, t, sub, mono=False)
    s = k.section(b, "Three families", "The family records the direction. The same size word is the same distance in all three.")
    def cell(c, i, v, w):
        if i == 0: k.chip(c, v); return True
    grid_table(k, s, [("Family", 160), ("The space runs", 360), ("CSS", 300), ("Figma", None)],
               [[f, D["families"][f]["about"], D["families"][f]["css"], D["families"][f]["figma"]] for f in ["inset", "stack", "inline"]], cell)
    s = k.section(b, "One name, three places", "Designers and developers say the same word for the same space.")
    r = k.row(s, 16)
    eg = T(D, "space.inset.md")
    for t, v in [("Figma variable", eg["figma"]), ("CSS variable", eg["cssVar"]), ("Tailwind", ", ".join(eg["tailwind"][:2]))]:
        c = k.card(r, 8, 20); k.text(c, t, "caption", "color/fg/subtle", weight=700); k.text(c, v, "mono", fill=True)
    s = k.section(b, "One card, three densities", "The same card in three frames, each set to a different Density mode. Nothing was redrawn: padding, gaps and control heights are the variables.")
    r = k.row(s, 24, align="min")
    for d in DENS:
        m = k.frame(r, d, gap=10)
        dmode(k, m, d)
        k.text(m, f"{d} · controls {T(D, 'size.control.height')['densities'][d]['px']}px", "caption", "color/fg/subtle", weight=700)
        settings_card(k, m, w=340, label_style=D["label"][d]["style"])
    finish(k, b, "How tokens are built")
    return b


# ------------------------------------------------------------ Inset
def inset(k, D):
    b = start(k, "Inset: padding", "Inset is the padding between a container's edge and its content. Pick it by the size of the container: small things wrap tightly, big surfaces breathe.")
    s = k.section(b, "Pick it by the container", "Real components, each padded with its inset token. Badges hug their label; dialogs give their content room.")
    r = k.row(s, 24, align="min", wrap=True)
    # badge
    col = k.frame(r, "Badge", gap=10)
    bd = k.frame(col, "Badge", "horizontal", 0, 0, bind="color/bg/brand-subtle", radius=99, align="center"); bind_pad(k, bd, "space.inset.xs"); bind_pad(k, bd, "space.inset.sm", "lr")
    spec(k, bd, "Beta", "type.label.sm", "color/fg/brand")
    k.tag(col, "inset/xs · sides inset/sm")
    # menu
    col = k.frame(r, "Menu", gap=10)
    mn = k.frame(col, "Menu", gap=0, w=200, bind="color/bg/surface-overlay", radius=8, stroke="color/border/subtle", shadow=(3, (0, 6, 16))); bind_pad(k, mn, "space.inset.xs")
    for i, lab in enumerate(["Rename", "Duplicate", "Archive"]):
        it = k.frame(mn, lab, "horizontal", 0, 0, sizingH="fill", bind="color/bg/item-hover" if i == 0 else None, radius=4, align="center"); bind_pad(k, it, "space.inset.sm"); bind(k, it, "minHeight", "size.control.height")
        spec(k, it, lab, "type.label.md")
    k.tag(col, "inset/sm per item")
    # button + input
    col = k.frame(r, "Controls", gap=10)
    button(k, col, "Save changes"); text_input(k, col, "Website redesign", w=220)
    k.tag(col, "sides inset/md · min height size/control/height")
    # card
    col = k.frame(r, "Card", gap=10)
    cd = k.frame(col, "Card", gap=0, w=260, bind="color/bg/surface", radius=12, stroke="color/border/subtle"); bind_pad(k, cd, "space.inset.lg"); bind(k, cd, "gap", "space.stack.xs")
    spec(k, cd, "Storage", "type.title.md"); spec(k, cd, "12 GB of 50 GB used", "type.body.sm", "color/fg/muted")
    k.tag(col, "inset/lg")
    s = k.section(b, "Padding made visible", "The tinted area is the padding. The dialog keeps more room than the card, and the card more than the badge.")
    r = k.row(s, 24, align="min")
    for tok, lab, w in [("space.inset.xs", "badge", 120), ("space.inset.lg", "card", 220), ("space.inset.xl", "dialog", 300), ("space.inset.2xl", "band across a page", 380)]:
        col = k.frame(r, lab, gap=10)
        bx = k.frame(col, lab, gap=0, w=w, bind="color/bg/brand-subtle", radius=8); bind_pad(k, bx, tok)
        block(k, bx, "content", h=40, fill=True)
        k.tag(col, fig(tok).replace("space/", ""))
    space_table(k, b, D, [t["name"] for t in D["tokens"] if t["family"] == "inset" and not t["product"]], "Inset tokens")
    rules(k, b, [("Pad the container, not the child", "Space between a container's edge and its content is the container's inset, not a margin on the first child."),
                 ("Inner is smaller than outer", "A panel inside a card gets a smaller inset than the card. Corners follow: an inner radius is the outer radius minus the padding."),
                 ("Controls take a minimum height", "A button's height is size/control/height as a minimum; its sides take inset/md and inset/xs above and below keeps a wrapped label off the edge.")])
    finish(k, b, "Inset: padding")
    return b


# ------------------------------------------------------------ Stack
def stack(k, D):
    b = start(k, "Stack: vertical gaps", "Stack is the space between things in a column. Pick it by how closely they belong together: parts of one thing get stack/xs, sections of a page stack/2xl.")
    s = k.section(b, "A form, spaced by relationship", "Each pair sits closer to itself than to its neighbours, so people see two groups of fields before reading a word.")
    r = k.row(s, 48, align="min")
    frm = k.frame(r, "Form", gap=0, w=420, bind="color/bg/surface", radius=12, stroke="color/border/subtle"); bind_pad(k, frm, "space.inset.lg"); bind(k, frm, "gap", "space.stack.xl")
    g1 = k.frame(frm, "Group · Profile", gap=0, sizingH="fill"); bind(k, g1, "gap", "space.stack.lg")
    spec(k, g1, "Profile", "type.title.md")
    field(k, g1, "Name", "Ali Khan"); field(k, g1, "Email", "ali@example.com", "We never share it.")
    g2 = k.frame(frm, "Group · Notifications", gap=0, sizingH="fill"); bind(k, g2, "gap", "space.stack.md")
    spec(k, g2, "Notifications", "type.title.md")
    opts = k.frame(g2, "Options", gap=0, sizingH="fill"); bind(k, opts, "gap", "space.stack.sm")
    checkbox(k, opts, "Weekly summary", True); checkbox(k, opts, "Mentions"); checkbox(k, opts, "Product news")
    v = lambda n: T(D, n)["densities"]["default"]["px"]
    legend(k, r, [("A label and its field; a field and its help", "stack/xs", v("space.stack.xs")), ("Options in a group", "stack/sm", v("space.stack.sm")),
                  ("A heading and the content under it", "stack/md", v("space.stack.md")), ("One field and the next", "stack/lg", v("space.stack.lg")),
                  ("One group of fields and the next", "stack/xl", v("space.stack.xl"))])
    s = k.section(b, "Equal spacing hides the groups", "The same four lines, spaced two ways.")
    r = k.row(s, 32, align="min")
    for kind, inner, outer, cap in [("avoid", "space.stack.md", "space.stack.md", "stack/md everywhere: four lines, no pairs"), ("do", "space.stack.xs", "space.stack.lg", "stack/xs inside, stack/lg between: two pairs")]:
        col = k.frame(r, kind, gap=10)
        k.inst(kind, col)
        box = k.frame(col, "Lines", gap=0, w=260, bind="color/bg/brand-subtle", radius=8); bind_pad(k, box, "space.inset.md"); bind(k, box, "gap", outer)
        for g in range(2):
            pair = k.frame(box, f"Pair {g}", gap=0, sizingH="fill"); bind(k, pair, "gap", inner)
            block(k, pair, "label", h=20, fill=True); block(k, pair, "field", h=32, fill=True)
        k.text(col, cap, "caption", "color/fg/muted", weight=400)
    k.inst("note", b, {"Body": f"Paragraphs are separated by stack/lg ({v('space.stack.lg')}px in default density) — never by empty lines."}, fill=True)
    space_table(k, b, D, [t["name"] for t in D["tokens"] if t["family"] == "stack" and not t["product"]], "Stack tokens")
    rules(k, b, [("Inside a group is smaller than between groups", "Equal spacing everywhere makes every element look unrelated."),
                 ("Put the gap on the parent", "A vertical auto layout's gap (row-gap in code) has one place to change; margins on every child have many."),
                 ("Group in the markup too", "If spacing shows a group, wrap it in a list, a fieldset or a section with a heading, so screen-reader users get the same grouping.")])
    finish(k, b, "Stack: vertical gaps")
    return b


# ------------------------------------------------------------ Inline
def inline(k, D):
    b = start(k, "Inline: horizontal gaps", "Inline is the space between things side by side: an icon and its text, buttons in a group, groups in a toolbar. The more closely two things belong together, the smaller the gap.")
    s = k.section(b, "A toolbar, spaced by relationship", "Three groups. Items inside a group share inline/sm; the groups are inline/xl apart.")
    tb = k.frame(s, "Toolbar", "horizontal", 0, 0, sizingH="fill", bind="color/bg/surface", radius=12, stroke="color/border/subtle", align="center"); bind_pad(k, tb, "space.inset.sm"); bind(k, tb, "gap", "space.inline.xl")
    for grp in [[("Filter", "⚲"), ("Sort", "↕")], [("Bold", None), ("Italic", None), ("Link", None)], [("Share", None), ("Export", None)]]:
        g = k.frame(tb, "Group", "horizontal", 0, 0, align="center"); bind(k, g, "gap", "space.inline.sm")
        for lab, ic in grp: button(k, g, lab, kind="secondary", icon=ic)
    r = k.row(s, 24, align="min")
    k.tag(r, "inline/sm inside a group"); k.tag(r, "inline/xl between groups"); k.tag(r, "size/control/icon-gap inside a button")
    s = k.section(b, "More rows", "A card header, an icon with its text, and chips that wrap.")
    r = k.row(s, 24, align="min")
    c = k.card(r, 12, 20, w=380, sizingH=None)
    hd = k.frame(c, "Header", "horizontal", 0, 0, sizingH="fill", align="center"); bind(k, hd, "gap", "space.inline.md")
    spec(k, hd, "Storage", "type.title.md", fill=True); icon_button(k, hd, "⋯", "More"); button(k, hd, "Upgrade")
    k.tag(c, "title and actions: inline/md")
    c = k.card(r, 12, 20, w=300, sizingH=None)
    ln = k.frame(c, "Icon and text", "horizontal", 0, 0, align="center"); bind(k, ln, "gap", "space.inline.xs")
    spec(k, ln, "●", "type.caption.md", "color/fg/success"); spec(k, ln, "All systems running", "type.body.sm")
    k.tag(c, "icon and its text: inline/xs")
    c = k.card(r, 12, 20, w=380, sizingH=None)
    wr = k.frame(c, "Chips", "horizontal", 0, 0, sizingH="fill", wrap=True); bind(k, wr, "gap", "space.inline.sm"); bind(k, wr, "crossGap", "space.stack.sm")
    for lab in ["Design", "Research", "Marketing", "Engineering", "Support", "Finance"]:
        ch = k.frame(wr, lab, "horizontal", 0, 0, bind="color/bg/surface-sunken", radius=99, align="center"); bind_pad(k, ch, "space.inset.xs"); bind_pad(k, ch, "space.inset.sm", "lr")
        spec(k, ch, lab, "type.label.sm")
    k.tag(c, "inline/sm across · stack/sm between lines")
    k.inst("note", b, {"Body": "Right-to-left languages: use column-gap and the logical margins (margin-inline-start and -end) in code, so the space flips with the text direction. Auto layout gaps flip on their own."}, fill=True)
    space_table(k, b, D, [t["name"] for t in D["tokens"] if t["family"] == "inline" and not t["product"]], "Inline tokens")
    rules(k, b, [("Let rows wrap", "When a row runs out of room it wraps, with stack between the lines; never shrink the gap to make it fit."),
                 ("One gap per group", "Buttons in one group share one gap; a bigger gap separates the next group.")])
    finish(k, b, "Inline: horizontal gaps")
    return b


# ------------------------------------------------------------ Controls and targets
def controls(k, D):
    tm = D["limits"]["targetMin"]
    ch = T(D, "size.control.height")["densities"]
    b = start(k, "Controls and targets", f"Things people press need room for a finger, a shaking hand or a mouse that lands a little off. WCAG 2.5.8 asks for {tm} × {tm}px; every density meets it, and comfortable controls reach {ch['comfortable']['px']}px, over the {D['limits']['targetEnhanced']}px of the stricter AAA criterion.")
    s = k.section(b, "Controls in three densities", "The same row in three frames. Height, sides, icon gap and the label style all follow the density.")
    r = k.row(s, 32, align="min")
    for d in DENS:
        m = k.frame(r, d, gap=12)
        dmode(k, m, d)
        k.text(m, f"{d} · {ch[d]['px']}px · {D['label'][d]['style'].replace('type.', '')}", "caption", "color/fg/subtle", weight=700)
        row = k.frame(m, "Row", "horizontal", 0, 0, align="center"); bind(k, row, "gap", "space.inline.sm")
        button(k, row, "Save", D["label"][d]["style"], icon="✓"); icon_button(k, row)
        text_input(k, m, "Website redesign", w=260)
    s = k.section(b, "Controls fit their label", f"The build checks that each density's label has at least {D['limits']['labelRoom']}px above and below.")
    grid_table(k, s, [("Density", 200), ("Control height", 200), ("Label", 260), ("Room above and below", None)],
               [[d, f"{ch[d]['px']}px", f"{D['label'][d]['style'].replace('type.', '')} · {D['label'][d]['size']}/{D['label'][d]['lh']}px", f"{D['label'][d]['room']:g}px"] for d in DENS])
    s = k.section(b, "Small marks get a hit area", f"A checkbox or a close icon can be drawn small as long as the area that reacts is at least size/target/min ({tm}px). Links inside a sentence are the one exception WCAG allows.")
    r = k.row(s, 32, align="min")
    col = k.card(r, 12, 24); k.text(col, "Checkbox", "h3"); checkbox(k, col, "Weekly summary", True, show_hit=True); k.tag(col, "drawn 16px · tinted: hit area size/target/min")
    col = k.card(r, 12, 24); k.text(col, "Close icon", "h3")
    hit = k.frame(col, "Close", "horizontal", 0, 0, bind="color/bg/brand-subtle", radius=4, align="center", main="center"); bind(k, hit, "minWidth", "size.target.min"); bind(k, hit, "minHeight", "size.target.min")
    spec(k, hit, "×", "type.label.md", "color/fg/icon"); k.tag(col, "hit area size/target/min")
    col = k.card(r, 12, 24, w=420, sizingH=None); k.text(col, "A link in a sentence", "h3")
    sent = "Read the full privacy policy before you sign up."
    tn = spec(k, col, sent, "type.body.md", "color/fg/default", fill=True)
    i0 = sent.index("privacy policy")
    k.f.cmd("text.style", id=tn, start=i0, end=i0 + len("privacy policy"), textDecoration="underline", textFills=[D["linkHex"]])
    k.text(col, "Exempt: its size comes from the line of text.", "caption", "color/fg/muted", weight=400)
    space_table(k, b, D, [t["name"] for t in D["tokens"] if t["kind"] == "size" and not t["product"]], "Size tokens")
    rules(k, b, [("Heights are minimums", "Use size/control/height as a minimum height. At 200% text a label line is twice as tall; a fixed height cuts it off."),
                 ("Icon-only buttons are square", "Minimum width and height both size/control/height. Minimums, not fixed sizes: an icon drawn as a character grows with the text."),
                 ("Don't rely on gaps between small targets", "WCAG accepts small targets with enough space around them; in ds every target is big enough on its own.")])
    finish(k, b, "Controls and targets")
    return b


# ------------------------------------------------------------ Density
def density(k, D):
    b = start(k, "Density", f"Density changes how much fits on a screen. It's a mode with three values and one rule: compact is one step down the scale, comfortable one step up — for every spacing token and control size. The target floor never moves.")
    s = k.section(b, "One rule", "The ladder in three frames, one per Density mode. Every size moves one step; the order never changes.")
    c = k.card(s, 48, 32, direction="horizontal", align="min")
    for d in DENS:
        m = k.frame(c, d, gap=10)
        dmode(k, m, d)
        k.text(m, d + (" · default mode" if d == D["defaultDensity"] else ""), "caption", "color/fg/subtle", weight=700)
        for sz in ["xs", "sm", "md", "lg", "xl", "2xl"]:
            rr = k.row(m, 10, align="center", fill=False)
            k.text(rr, sz, "caption", "color/fg/muted", weight=600, width=28)
            bar(k, rr, f"space.stack.{sz}", h=12)
            k.text(rr, str(T(D, f"space.stack.{sz}")["densities"][d]["px"]), "caption", "color/fg/muted", weight=400)
    ex = k.frame(c, "What one step means", gap=10, sizingH="fill")
    k.text(ex, "What one step means", "h3")
    sc = [p["px"] for p in D["scale"]]
    for v in [8, 12, 16, 24]:
        i = sc.index(v)
        k.text(ex, f"{v}px → compact {sc[i - 1]}px · comfortable {sc[i + 1]}px", "small", fill=True)
    k.text(ex, "Steps are along the scale, not a percentage, so every value stays on the grid and small spaces never collapse.", "small", "color/fg/muted", fill=True)
    s = k.section(b, "The same screen in three densities", "Nothing redrawn: three frames, three modes.")
    r = k.row(s, 24, align="min")
    for d in DENS:
        m = k.frame(r, d, gap=10); dmode(k, m, d)
        k.text(m, d, "caption", "color/fg/subtle", weight=700)
        settings_card(k, m, w=360, label_style=D["label"][d]["style"])
    s = k.section(b, "One part of a page", "A dense table inside a default page: the table's frame is set to compact; the rest of the page doesn't change. In code, data-density=\"compact\" on its container.")
    pg = k.frame(s, "Page", gap=0, w=900, bind="color/bg/canvas", radius=12, stroke="color/border/default"); bind_pad(k, pg, "space.inset.xl"); bind(k, pg, "gap", "space.stack.lg")
    dmode(k, pg, "default")
    hd = k.frame(pg, "Header", "horizontal", 0, 0, sizingH="fill", align="center"); bind(k, hd, "gap", "space.inline.md")
    spec(k, hd, "Projects", "type.heading.md", fill=True); button(k, hd, "New project")
    tbl = k.frame(pg, "Table · compact", gap=0, sizingH="fill", bind="color/bg/surface", radius=8, stroke="color/border/subtle")
    dmode(k, tbl, "compact")
    for i, rowv in enumerate([("Project", "Owner", "Tasks"), ("Website redesign", "Ali", "124"), ("Mobile app", "Sara", "91"), ("Onboarding flow", "Ravi", "17")]):
        rw = k.frame(tbl, rowv[0], "horizontal", 0, 0, sizingH="fill", align="center", bind="color/bg/surface-sunken" if i == 0 else None, stroke="color/border/subtle" if i else None)
        bind_pad(k, rw, "space.inset.sm"); bind_pad(k, rw, "space.inset.md", "lr"); bind(k, rw, "gap", "space.inline.lg"); bind(k, rw, "minHeight", "size.control.height")
        if i: k.f.tool("set_properties", ids=[rw], props={"strokeSides": [1, 0, 0, 0]})
        for j, v in enumerate(rowv):
            cc = k.frame(rw, f"c{j}", w=None, sizingH="fill", align="min" if j < 2 else "max")
            spec(k, cc, v, "type.label.sm" if i == 0 else ("type.numeric.sm" if j == 2 else "type.body.sm"), "color/fg/muted" if i == 0 else "color/fg/default")
    rr = k.row(s, 12); k.tag(rr, "page: default"); k.tag(rr, "table region: compact")
    s = k.section(b, "Which density", "Choose per screen or per region, never per component.")
    dd = next(x for x in D["decisions"] if x["what"].startswith("How dense"))
    def cell(c, i, v, w):
        if i == 1: k.chip(c, v.replace(" on that container", "")); return True
    grid_table(k, s, [("Screen", 640), ("Density", None)], [[w, u] for w, u in dd["answers"]], cell)
    k.inst("note", b, {"Body": "Labels follow the density: comfortable controls use label/lg, default and compact label/md (Typography foundation)."}, fill=True)
    rules(k, b, [("Choose density per screen or region", "Not per component: a compact button next to a default one looks like a mistake."),
                 ("Never make compact by renaming tokens", "inset/sm \"for compact\" moves one value a step further than the rest of the screen and skips the checks. Set the mode.")])
    finish(k, b, "Density")
    return b


# ------------------------------------------------------------ Choosing and using space
def choosing(k, D):
    b = start(k, "Choosing and using space", "Two questions get you to the right token almost every time: which way does the space run? That's the family. How closely do the two things belong together? That's the size.")
    s = k.section(b, "The decision guide", "Find the kind of space, answer the question, use the token.")
    grid = k.row(s, 16, wrap=True, align="min")
    for d in [x for x in D["decisions"] if not x["what"].startswith("How dense")]:
        c = k.frame(grid, d["what"], gap=10, pad=22, w=628, bind="color/bg/surface", radius=12, stroke="color/border/subtle")
        k.text(c, d["what"], "h3"); k.text(c, d["question"], "small", "color/fg/muted")
        for when, use in d["answers"]:
            rr = k.frame(c, when[:30], "horizontal", 12, 0, sizingH="fill", align="center")
            k.text(rr, when, "small", fill=True)
            k.chip(rr, fig(use.split(" (")[0]).replace("space/", "").replace("size/", ""))
    s = k.section(b, "Worked example — a settings card", "Spaced one question at a time, in default density.")
    r = k.row(s, 48, align="min")
    settings_card(k, r, w=380)
    v = lambda n: T(D, n)["densities"]["default"]["px"]
    legend(k, r, [("Card padding", "inset/lg", v("space.inset.lg")), ("Title → its description", "stack/xs", v("space.stack.xs")), ("Label → input", "stack/xs", v("space.stack.xs")),
                  ("Field → options", "stack/lg", v("space.stack.lg")), ("Option → option", "stack/sm", v("space.stack.sm")), ("Head → fields → buttons", "stack/xl", v("space.stack.xl")),
                  ("Button → button", "inline/sm", v("space.inline.sm")), ("Button sides", "inset/md", v("space.inset.md")), ("Button height", "size/control/height", T(D, "size.control.height")["densities"]["default"]["px"])])
    s = k.section(b, "Do and avoid", "Measured in this build.")
    sl = lambda x: x.replace("space.", "space/").replace("size.", "size/").replace(".md", "/md").replace(".sm", "/sm").replace(".xs", "/xs").replace(".lg", "/lg").replace(".height", "/height").replace("layout.", "layout/").replace("control.", "control/")
    for m in D["mistakes"]:
        row = k.row(s, 16, align="min")
        c = k.card(row, 8, 20); k.inst("avoid", c); k.text(c, sl(m["mistake"]), "body", fill=True); k.text(c, sl(m["measured"]).replace("`", ""), "small", "color/fg/muted", fill=True)
        c = k.card(row, 8, 20); k.inst("do", c); k.text(c, sl(m["fix"]), "mono", fill=True); k.text(c, sl(m["fixValue"]).replace("`", ""), "small", "color/fg/muted", fill=True)
    finish(k, b, "Choosing and using space")
    return b


# ------------------------------------------------------------ Readers' settings and products
def settings(k, D):
    b = start(k, "Readers' settings and products", "People change how text looks, and products change how dense their screens are. The system is built so neither breaks a screen.")
    s = k.section(b, "Bigger text", f"Spacing is px, so at 200% text the text gets the room. On a {D['reflow']}px phone the margins stay {D['margin']}px; in rem they'd double.")
    r = k.row(s, 32, align="min")
    for kind, mar, cap in [("do", D["margin"], f"px margins stay {D['margin']}px: {D['reflow'] - 2 * D['margin']}px for text"), ("avoid", 2 * D["margin"], f"rem margins double to {2 * D['margin']}px: {D['reflow'] - 4 * D['margin']}px for text")]:
        col = k.frame(r, kind, gap=10)
        k.inst(kind, col)
        ph = k.frame(col, "Phone 320", gap=0, w=D["reflow"], bind="color/bg/brand-subtle", radius=16, stroke="color/border/default"); k.pad(ph, mar, mar, 24, 24)
        body = k.frame(ph, "Content", gap=8, sizingH="fill", bind="color/bg/canvas")
        for txt, size, lh, wt, colr in [("Projects", 52, 64, 600, "color/fg/default"), ("Share this project with your whole team today.", 32, 48, 400, "color/fg/muted")]:
            tn = k.f.tool("create_node", type="text", parent=body, text=txt, props={"fontFamily": "Inter", "fontSize": size, "lineHeight": lh, "fontWeight": wt})["id"]
            k.f.cmd("variable.bind", ids=[tn], field="fill", variable=colr); k.f.tool("set_properties", ids=[tn], props={"sizingH": "fill"})
        k.text(col, cap, "caption", "color/fg/muted", weight=400)
    k.text(s, "Tinted: the margins. Both phones show text at 200%.", "caption", "color/fg/muted", weight=400)
    s = k.section(b, "More spacing", "Some readers add space between lines and after paragraphs (WCAG 1.4.12). Boxes with a minimum height grow; fixed heights cut text off.")
    grid_table(k, s, [("Readers may set", 360), ("To", 260), ("What breaks", None)], [
        ["Line height", "1.5 × the font size", "Controls with a fixed height"], ["Space after paragraphs", "2 × the font size", "Cards with a set height"],
        ["Letter and word spacing", "0.12 and 0.16 × the font size", "Buttons and chips with a fixed width"]])
    k.inst("note", b, {"Body": f"Bigger targets: products whose people need them — touch screens, field work, people with tremors — can default to comfortable, or offer it as a setting. Controls are then {T(D, 'size.control.height')['densities']['comfortable']['px']}px."}, fill=True)
    s = k.section(b, "What the config changes", "Two choices and your own tokens. Everything else is fixed on purpose.")
    grid_table(k, s, [("Follows the config", 620), ("Fixed on purpose", None)], [
        [f"The default density (density.default, now {D['defaultDensity']})", "The scale and the ladder"], [f"How far density moves (spacing.densityStep, now {D['step']})", f"The {D['limits']['targetMin']}px target floor and every check"],
        ["Tokens added for this product (spacing.tokens)", "Token names: nothing in designs or code is renamed"]])
    k.inst("note", b, {"Body": f"Why the step is one: with two, compact inset/xs would be {D['step2']['insetXs']}px and compact controls {D['step2']['control']}px tall, leaving {(D['step2']['control'] - D['label']['compact']['lh']) / 2:g}px around the label. The build stops and says which check failed."}, fill=True)
    s = k.section(b, "Adding a token", "Most needs already have a token. If none fits, add one to a family with a size from 2xs to 4xl and a base on the scale; the build works out compact and comfortable and checks it sits in the ladder.")
    r = k.row(s, 24, align="min")
    c = k.card(r, 0, 24, bind="color/bg/surface-sunken", w=560, sizingH=None)
    spec(k, c, json.dumps({"spacing": {"tokens": [{"name": "space.stack.3xl", "base": "12", "description": "Sections of a long landing page"}]}}, indent=2), "type.code.sm")
    leg = k.frame(r, "Refused", gap=12, sizingH="fill")
    k.text(leg, "The build refuses", "h3")
    for t, sub in [("px values", "Give a base on the scale; the engine computes every density."), ("Other families", "Space for one component belongs with that component."),
                   ("A name that exists", "Use the token you have."), ("A base off the scale", "Pick one of the sixteen values."),
                   ("A size out of order", "3xl must be bigger than 2xl in every density, and the same as 3xl in other families.")]:
        k.marked(leg, t, sub, mono=False)
    s = k.section(b, "Linked to layout", "Page gutters and margins point at the same scale, per breakpoint rather than density. Change the scale and the grid follows.")
    grid_table(k, s, [("Token", 260)] + [(bp, 180) for bp in ["sm", "md", "lg", "xl"]] + [("Points to", None)],
               [[fig(l["token"])] + [f"{l['breakpoints'][bp]['px']}px" for bp in ["sm", "md", "lg", "xl"]] + [" · ".join(fig(l["breakpoints"][bp]["primitive"]) for bp in ["sm", "md", "lg", "xl"])] for l in D["layoutLinks"]])
    finish(k, b, "Readers' settings and products")
    return b


CHAPTER_FNS = [principles, scale, tokens, inset, stack, inline, controls, density, choosing, settings]

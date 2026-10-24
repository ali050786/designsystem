"""Radius foundation as one systematic story: 10 chapters, each = explain → live examples → tokens → rules.
Every example's corners are bound to the Shape variables, and frames set their own Shape mode — so "one card, three
styles" is one card and three modes, not three drawings. Nested radii are raw numbers (Figma has no expressions): each
is the value the engine computed for the frame's modes. Every radius token is documented on exactly one chapter
(checked at build time). All copy is original (clean-room)."""
import re
from story_space import grid_table, spec, bind, bind_pad, dmode, fig

GROUP = {"Five principles": "Idea", "How tokens are built": "Structure", "Roles by job": "Roles", "Radius styles": "Roles",
         "Nested corners": "Combining", "Joined corners": "Combining", "Focus rings": "Edges", "Corners and content": "Edges",
         "Choosing a shape": "Using", "Readers' settings and products": "Using"}
TEASER = {"How tokens are built": "the scale, the Shape collection and its modes", "Roles by job": "six roles, from square to round",
          "Radius styles": "sharp, default, round — chosen once", "Nested corners": "inner is outer minus padding",
          "Joined corners": "parts that read as one shape", "Focus rings": "rings that hug the shape and are never cut",
          "Corners and content": "text stays on its fill", "Choosing a shape": "a decision guide and a worked example",
          "Readers' settings and products": "bigger text, density, right to left, your own roles"}
STY = ["sharp", "default", "round"]
CORNER = {"tl": "topLeftRadius", "tr": "topRightRadius", "br": "bottomRightRadius", "bl": "bottomLeftRadius"}
documented = []  # every token put in a token table
CH = []  # chapter titles, from the data
BOARD_W = 1440


# ------------------------------------------------------------ helpers
def T(D, name):
    return next(t for t in D["tokens"] if t["name"] == name)


def slashed(text):
    """Token names as Figma writes them (shape/control), leaving config keys (radius.style) alone."""
    return re.sub(r"\b(shape|space|focus)\.[a-z<>*-]+(\.[a-z<>*-]+)*", lambda m: m.group(0).replace(".", "/"), text)


def setp(k, nid, **props):
    k.f.tool("set_properties", ids=[nid], props=props)


def smode(k, nid, style):
    k.f.cmd("variable.setMode", ids=[nid], collection="Shape", mode=style)


def rbind(k, nid, role, corners=None, zero=()):
    """Bind corners to shape/<role>; corners: list of tl/tr/br/bl (all when None); zero: corners set square."""
    if corners is None:
        k.f.cmd("variable.bind", ids=[nid], field="cornerRadius", variable=f"shape/{role}")
    else:
        for c in corners: k.f.cmd("variable.bind", ids=[nid], field=CORNER[c], variable=f"shape/{role}")
    if zero: setp(k, nid, **{CORNER[c]: 0 for c in zero})


def start(k, title, lead):
    k.page(title)
    b = k.frame(name=title, w=BOARD_W, pad=80, gap=72, bind="color/bg/canvas")
    k.f.cmd("variable.setMode", ids=[b], collection="Color", mode="Light")
    k.f.cmd("variable.setMode", ids=[b], collection="Responsive", mode="lg")
    dmode(k, b, "default")
    k.inst("page", b, {"Eyebrow": f"Radius · {GROUP[title]}", "Title": title, "Lead": lead}, fill=True)
    return b


def finish(k, b, title):
    i = CH.index(title)
    if i + 1 >= len(CH):
        c = k.card(b, 8, 24, bind="color/bg/brand-subtle")
        k.text(c, "End of the radius foundation", "h3")
        k.text(c, "You've seen the roles, the three styles, how corners behave inside and against each other, and how focus rings and text stay clear of them — and how each is checked. Next in the system: Border.", "body", "color/fg/muted", fill=True)
        return
    t = CH[i + 1]
    c = k.frame(b, "Next", "horizontal", 16, 24, sizingH="fill", bind="color/bg/surface", stroke="color/border/subtle", align="center")
    rbind(k, c, "container")
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


def shape(k, parent, role, w, h, fill="color/bg/brand-subtle", stroke="color/border/strong", name=None, corners=None, zero=()):
    """A plain shape whose corners are the role's variable."""
    s = k.frame(parent, name or f"shape/{role}", "horizontal", 0, 0, w=w, h=h, sizingV=None, bind=fill, stroke=stroke, align="center", main="center")
    rbind(k, s, role, corners, zero)
    return s


def button(k, parent, label, kind="primary", corners=None, zero=(), fillw=False):
    bg, fg, brd = {"primary": ("color/action/primary/bg", "color/action/primary/fg", None),
                   "secondary": ("color/action/secondary/bg", "color/action/secondary/fg", "color/action/secondary/border")}[kind]
    b = k.frame(parent, f"Button · {label}", "horizontal", 0, 0, bind=bg, align="center", main="center", stroke=brd)
    rbind(k, b, "control", corners, zero)
    bind(k, b, "minHeight", "size.control.height"); bind_pad(k, b, "space.inset.md", "lr"); bind_pad(k, b, "space.inset.xs", "tb")
    spec(k, b, label, "type.label.md", fg)
    if fillw: setp(k, b, sizingH="fill")
    return b


def text_input(k, parent, value, w=None, corners=None, zero=()):
    i = k.frame(parent, "Input", "horizontal", 0, 0, w=w, sizingH=None if w else "fill", bind="color/bg/surface", align="center", stroke="color/border/input")
    rbind(k, i, "control", corners, zero)
    bind(k, i, "minHeight", "size.control.height"); bind_pad(k, i, "space.inset.md", "lr"); bind_pad(k, i, "space.inset.xs", "tb")
    spec(k, i, value, "type.body.md", "color/fg/muted")
    return i


def checkbox(k, parent, label, checked=False, role="mark", radio=False):
    row = k.frame(parent, f"{'Radio' if radio else 'Checkbox'} · {label}", "horizontal", 0, 0, align="center")
    bind(k, row, "gap", "space.inline.sm")
    box = k.frame(row, "Box", "horizontal", 0, 0, w=16, h=16, sizingV=None, bind="color/action/primary/bg" if checked else "color/bg/surface", stroke=None if checked else "color/border/input", align="center", main="center")
    rbind(k, box, "pill" if radio else role)
    if checked and not radio: k.text(box, "✓", "caption", "color/action/primary/fg", weight=700)
    if checked and radio:
        dot = k.frame(box, "Dot", w=6, h=6, sizingV=None, bind="color/action/primary/fg"); rbind(k, dot, "pill")
    spec(k, row, label, "type.body.md")
    return row


def badge(k, parent, label):
    b = k.frame(parent, f"Badge · {label}", "horizontal", 0, 0, bind="color/bg/brand-subtle", align="center")
    rbind(k, b, "pill")
    bind_pad(k, b, "space.inset.xs", "tb"); bind_pad(k, b, "space.inset.sm", "lr")
    spec(k, b, label, "type.label.sm", "color/fg/brand")
    return b


def plan_card(k, parent, w=320, style=None, tags=False):
    """A small card with a flush header, a badge, a field, a checkbox and two buttons — every corner a role."""
    c = k.frame(parent, "Plan card", gap=0, w=w, bind="color/bg/surface", stroke="color/border/subtle")
    rbind(k, c, "container")
    if style: smode(k, c, style)
    hd = k.frame(c, "Header (flush)", "horizontal", 0, 0, sizingH="fill", bind="color/bg/surface-sunken", align="center")
    rbind(k, hd, "container", ["tl", "tr"], ["bl", "br"]); bind_pad(k, hd, "space.inset.lg"); bind(k, hd, "gap", "space.inline.sm")
    t = spec(k, hd, "Pro plan", "type.title.md"); setp(k, t, sizingH="fill")
    badge(k, hd, "Popular")
    body = k.frame(c, "Body", gap=0, sizingH="fill"); bind_pad(k, body, "space.inset.lg"); bind(k, body, "gap", "space.stack.md")
    text_input(k, body, "Team name")
    checkbox(k, body, "Billed yearly", True)
    acts = k.frame(body, "Actions", "horizontal", 0, 0, align="center"); bind(k, acts, "gap", "space.inline.sm")
    button(k, acts, "Choose"); button(k, acts, "Compare", "secondary")
    if tags:
        k.tag(body, "every corner here is a shape role")
    return c


def ring(k, parent, role, offset, width=2, sides=None, name=None):
    """A focus ring drawn as its own layer: a frame `offset` away from the element, stroke outside, radius shape/<role>-focus."""
    r = k.frame(parent, name or f"Ring · {role}", "horizontal", 0, offset, align="center", main="center")
    setp(k, parent, clip=False)  # the stroke sits outside the ring frame: the parent mustn't cut it
    setp(k, r, clip=False, strokes=["#000000"], strokeWeight=width, strokeAlign="outside")
    if sides: setp(k, r, strokeSides=sides)
    k.f.cmd("variable.bind", ids=[r], field="stroke", variable="color/border/focus")
    rbind(k, r, f"{role}-focus")
    return r


def style_cells(k, row, role, size=(56, 40), fill="color/bg/brand-subtle", w=150):
    """One live swatch per style: each cell sets its own Shape mode, the swatch is bound to the role."""
    for s in STY:
        cell = k.frame(row, s, "horizontal", 10, 0, w=w, align="center")
        smode(k, cell, s)
        shape(k, cell, role, size[0], size[1], fill=fill)


# ------------------------------------------------------------ Five principles
def principles(k, D):
    b = start(k, "Five principles", "Five principles shape every corner in this system. Each one is checked by the build in every style and density — the demo next to it shows what it means.")
    s = k.section(b, "The principles", "Read them once; every chapter after this one applies them.")
    R = D["roles"]
    items = [
        ("Shape follows the job", "A shape's radius comes from what it is — a mark, a control, a container, a surface, a pill — never from how big it is. Six roles cover every shape.", "job"),
        ("One style, chosen once", "A product picks sharp, default or round, and every role follows in order. The same card in three Shape modes:", "style"),
        ("Inner is outer minus padding", f"A shape that fills a rounded one takes the parent's radius minus the padding: the only rule that keeps the gap even round the corner ({D['gaps']['even']}px, not {D['gaps']['copied']}px).", "nested"),
        ("Corners stay corners", f"A radius is limited by the size of what it rounds: a checkbox stays square (≤ {int(D['markSize'] * D['cornerShare'])}px), a control never turns into a pill, text stays on its fill.", "corners"),
        ("Nothing cuts the ring", "Focus rings follow the shape they surround, and no rounded container clips them.", "ring"),
    ]
    for t, body, demo in items:
        c = k.frame(s, t, "horizontal", 32, 28, sizingH="fill", bind="color/bg/surface", stroke="color/border/subtle", align="center")
        rbind(k, c, "container")
        col = k.frame(c, "Text", gap=6, sizingH="fill")
        k.text(col, t, "h2"); k.text(col, body, "body", "color/fg/muted", fill=True)
        d = k.frame(c, "Demo", "horizontal", 16, 20, w=620, bind="color/bg/surface-sunken", align="center", main="center")
        rbind(k, d, "container")
        if demo == "job":
            for role, w_, h_ in [("none", 56, 40), ("mark", 20, 20), ("control", 72, 32), ("container", 88, 56), ("surface", 104, 64), ("pill", 56, 24)]:
                m = k.frame(d, role, gap=6, align="center")
                shape(k, m, role, w_, h_)
                k.text(m, role, "caption", "color/fg/muted", weight=400)
        elif demo == "style":
            for st in STY:
                m = k.frame(d, st, gap=6, align="center")
                smode(k, m, st)
                cc = k.frame(m, "Card", gap=8, w=150, bind="color/bg/surface", stroke="color/border/default"); rbind(k, cc, "container"); k.pad(cc, 10, 10, 10, 10)
                bb = k.frame(cc, "Button", "horizontal", 0, 0, h=24, sizingV=None, bind="color/action/primary/bg", sizingH="fill"); rbind(k, bb, "control")
                k.text(m, st, "caption", "color/fg/muted", weight=400)
        elif demo == "nested":
            for inner, lab, kind in [(4, f"12 − 8 = 4px · even {D['gaps']['even']}px", "do"), (12, f"copied 12px · {D['gaps']['copied']}px at the corner", "avoid")]:
                m = k.frame(d, lab, gap=6, align="center")
                k.inst(kind, m)
                o = k.frame(m, "Outer", "horizontal", 0, 8, w=96, h=72, sizingV=None, bind="color/bg/surface", stroke="color/border/strong", radius=12)
                i_ = k.frame(o, "Inner", w=80, h=56, sizingV=None, bind="color/bg/brand-subtle", radius=inner)
                k.text(m, lab, "caption", "color/fg/muted", weight=400)
        elif demo == "corners":
            for role, lab, kind in [("mark", "shape.mark · square", "do"), ("control", "control radius in round · a circle", "avoid")]:
                m = k.frame(d, lab, gap=8, align="center")
                smode(k, m, "round")
                k.inst(kind, m)
                r_ = k.row(m, 16, align="center", fill=False)
                checkbox(k, r_, "Box", True, role)
                checkbox(k, r_, "Radio", True, radio=True)
                k.text(m, lab, "caption", "color/fg/muted", weight=400)
        else:
            m = k.frame(d, "Ring", gap=8, align="center")
            rg = ring(k, m, "control", 2)
            button(k, rg, "Focused")
            k.text(m, "ring radius = control + 2px offset", "caption", "color/fg/muted", weight=400)
    s = k.section(b, "How this foundation is organised", "The chapters follow the order you'd shape a product in: the idea, the structure, the roles and styles, how shapes combine, the edges where rings and text meet corners, then how to use it all.")
    grid = k.row(s, 16, wrap=True)
    for t in CH:
        c = k.frame(grid, t, gap=6, pad=18, w=410, bind="color/bg/surface", stroke="color/border/subtle")
        rbind(k, c, "container")
        k.text(c, GROUP[t].upper(), "caption", "color/fg/subtle", weight=700)
        k.text(c, t, "body", weight=600, fill=True)
        k.text(c, TEASER.get(t, "the principles behind every decision").capitalize(), "small", "color/fg/muted", fill=True)
    finish(k, b, "Five principles")
    return b


# ------------------------------------------------------------ How tokens are built
def tokens(k, D):
    b = start(k, "How tokens are built", "Radius tokens live in two collections: the scale, and the roles that pick from it per style. A frame's Shape mode decides which style its roles show.")
    s = k.section(b, "Two collections", "Each holds one kind of value and changes with one kind of mode.")
    grid_table(k, s, [("Collection", 200), ("Modes", 340), ("Radius tokens in it", None), ("Changes with", 220)], [
        ["Primitives", "one · hidden from publishing", "The scale: " + ", ".join(f"radius/{x['token'].split('.')[1]}" for x in D["scale"]), "nothing — raw values"],
        ["Shape", f"{', '.join(STY)} — {D['defaultStyle']} first, so frames on Auto use it", "The six roles and the four focus-ring radii", "the radius style"]])
    s = k.section(b, "The scale", "Eight steps, named by twos like the spacing scale is by fours (radius/4 is 8px). Steps are 2px apart up to 8px, where a pixel still shows, then 4px; radius/full draws round ends on anything. Each swatch is bound to its primitive.")
    def cell(c, i, v, w):
        if i == 0:
            sw = k.frame(c, v, "horizontal", 0, 0, w=56, h=40, sizingV=None, bind="color/bg/brand-subtle", stroke="color/border/strong")
            k.f.cmd("variable.bind", ids=[sw], field="cornerRadius", variable=v)
            return True
        return False
    rows = []
    for x in D["scale"]:
        n = x["token"]; documented.append(n)
        users = [f"{r['name'].split('.')[1]} ({', '.join(st for st in STY if r['styles'][st]['primitive'] == n)})" for r in D["tokens"] if r.get("varies") == "style" and not r.get("of") and any(r["styles"][st]["primitive"] == n for st in STY)]
        rows.append([fig(n), fig(n), "full" if x["px"] >= 9999 else f"{x['px']}px", " · ".join(users) or "free for product roles"])
    grid_table(k, s, [("Swatch", 80), ("Primitive", 200), ("Value", 120), ("Used by", None)], rows, cell)
    s = k.section(b, "Reading a name", "Roles are named by job, never by size or look: \"rounded-lg\" stops being true the day the style changes; \"container\" doesn't.")
    r = k.row(s, 12, align="center", fill=False)
    for part, what in [("shape", "category"), ("/", ""), ("container", "role")]:
        if not what: k.text(r, part, "h2", "color/fg/subtle"); continue
        m = k.frame(r, part, gap=4, align="center"); k.chip(m, part, bind="color/bg/brand-subtle"); k.text(m, what, "caption", "color/fg/muted", weight=400)
    t = T(D, "shape.container")
    grid_table(k, s, [("Figma variable", 300), ("CSS variable", 360), ("Tailwind", None)], [[t["figma"], t["cssVar"], ", ".join(t["tailwind"])]])
    rules(k, b, [("Primitives are never used directly", "In Figma they are hidden from the radius picker; in code the checker flags --ds-radius-*. Only the roles change with the style."),
                 ("Scoped to corners", "Every Shape variable is offered only in the corner-radius field.")])
    finish(k, b, "How tokens are built")
    return b


# ------------------------------------------------------------ Roles by job
def roles(k, D):
    b = start(k, "Roles by job", "Six roles, from square to round. Pick by what the thing is; the style decides how round that is. Each swatch below sits in a cell set to that style's Shape mode.")
    s = k.section(b, "The roles", f"Values in px; this product uses {D['defaultStyle']}.")
    tbl = k.card(s, 0, 0); rbind(k, tbl, "container")
    head = k.frame(tbl, "Head", "horizontal", 16, 12, sizingH="fill", bind="color/bg/surface-sunken"); k.pad(head, 24, 24)
    rbind(k, head, "container", ["tl", "tr"], ["bl", "br"])
    for t_, w in [("Role", 200), ("Use it for", None)] + [(st + (" · this product" if st == D["defaultStyle"] else ""), 150) for st in STY]:
        c = k.frame(head, t_, w=w, sizingH=None if w else "fill"); k.text(c, t_, "caption", "color/fg/muted", weight=700)
    for role in ["none", "mark", "control", "container", "surface", "pill"]:
        t = T(D, f"shape.{role}"); documented.append(t["name"])
        row = k.frame(tbl, t["name"], "horizontal", 16, 14, sizingH="fill", align="center", stroke="color/border/subtle"); k.pad(row, 24, 24)
        setp(k, row, strokeSides=[1, 0, 0, 0])
        c = k.frame(row, "Token", gap=4, w=200); k.text(c, t["figma"], "mono")
        c = k.frame(row, "Use", gap=4, sizingH="fill"); k.text(c, t["use"], "small", fill=True)
        for st in STY:
            cell = k.frame(row, st, "horizontal", 10, 0, w=150, align="center")
            smode(k, cell, st)
            shape(k, cell, role, 48, 32)
            v = t["styles"][st]["px"]
            k.text(cell, "full" if v >= 9999 else f"{v}px", "small", "color/fg/muted")
    s = k.section(b, "Every role on the thing it rounds", "Drawn in this product's style. The role tag names the job, not the size.")
    r = k.row(s, 24, align="max", wrap=True)
    m = k.frame(r, "mark", gap=8); checkbox(k, m, "Billed yearly", True); k.tag(m, "shape/mark")
    m = k.frame(r, "control", gap=8); a = k.row(m, 8, fill=False); button(k, a, "Save"); text_input(k, a, "Search", w=200); k.tag(m, "shape/control")
    m = k.frame(r, "container", gap=8)
    cc = k.frame(m, "Card", gap=8, w=240, bind="color/bg/surface", stroke="color/border/subtle"); rbind(k, cc, "container"); bind_pad(k, cc, "space.inset.lg")
    spec(k, cc, "Storage", "type.title.md"); spec(k, cc, "12 of 50 GB used", "type.body.sm", "color/fg/muted")
    k.tag(m, "shape/container")
    m = k.frame(r, "pill", gap=8); badge(k, m, "Beta"); k.tag(m, "shape/pill")
    m = k.frame(r, "none", gap=8)
    tb = k.frame(m, "Table", gap=0, w=240, bind="color/bg/surface", stroke="color/border/subtle")
    for lab in ("Name", "Atlas", "Borealis"):
        rr = k.frame(tb, lab, "horizontal", 0, 8, sizingH="fill", stroke="color/border/subtle"); setp(k, rr, strokeSides=[0, 0, 1, 0]); k.text(rr, lab, "small")
    k.tag(m, "shape/none")
    s = k.section(b, "A surface", "Dialogs, sheets and drawers — the largest shapes, on top of everything.")
    dlg = k.frame(s, "Dialog", gap=0, w=420, bind="color/bg/surface-overlay", stroke="color/border/subtle"); rbind(k, dlg, "surface"); bind_pad(k, dlg, "space.inset.xl"); bind(k, dlg, "gap", "space.stack.lg")
    spec(k, dlg, "Delete project?", "type.title.lg"); spec(k, dlg, "Its files and reports go to the bin for 30 days.", "type.body.md", "color/fg/muted", fill=True)
    a = k.frame(dlg, "Actions", "horizontal", 0, 0); bind(k, a, "gap", "space.inline.sm"); button(k, a, "Delete"); button(k, a, "Cancel", "secondary")
    k.tag(s, "shape/surface")
    rules(k, b, [("Same thing, same corners", "Every button has the control radius, in every size, state and screen. A primary button is not rounder than a secondary one."),
                 ("Why a mark is its own role", f"A {D['markSize']}px checkbox with round's control radius ({D['roles']['control']['round']}px) is a circle — a radio button. shape/mark stays ≤ {int(D['markSize'] * D['cornerShare'])}px."),
                 ("Pills are for labels that never wrap", "Badges and counters, not buttons: a two-line pill cuts its first and last letters off its fill."),
                 ("Radius never changes with state", "Hover, press, focus, selected and open change colour and the ring, never the corners.")])
    finish(k, b, "Roles by job")
    return b


# ------------------------------------------------------------ Radius styles
def styles(k, D):
    b = start(k, "Radius styles", f"A style is the product's feel, chosen once in the config. It moves every role together and keeps their order. This product uses {D['defaultStyle']}.")
    s = k.section(b, "One card, three styles", "The same card three times — each frame set to a different Shape mode. Nothing else differs.")
    r = k.row(s, 32, align="min")
    for st in STY:
        m = k.frame(r, st, gap=10)
        k.text(m, st.upper() + ("  ·  this product" if st == D["defaultStyle"] else ""), "caption", "color/fg/subtle", weight=700)
        plan_card(k, m, 380, st)
    s = k.section(b, "What each style sets", "none and pill are the same in every style.")
    grid_table(k, s, [("Role", 260)] + [(st, None) for st in STY], [[f"shape/{j}"] + [f"{D['roles'][j][st]}px" for st in STY] for j in ["mark", "control", "container", "surface"]])
    s = k.section(b, "Choosing", "All three pass every check.")
    grid_table(k, s, [("Style", 200), ("Feels", None)], [["sharp", "Dense tools and data: corners barely soften, containers and controls look alike."],
                                                        ["default", "Separates the roles clearly."], ["round", "Friendlier and roomier; pairs well with comfortable density."]])
    rules(k, b, [("Switching", 'In the config: "radius": { "style": "round" }, then build. In code: data-radius on <html> or any element. In Figma: the frame\'s Shape mode.'),
                 ("One style per product", "Mixing styles on one screen undoes the point of roles. Use data-radius for previews, not decoration.")])
    finish(k, b, "Radius styles")
    return b


# ------------------------------------------------------------ Nested corners
def nested(k, D):
    b = start(k, "Nested corners", "When a shape fills a rounded one — a panel in a card, an item in a menu, a segment in a segmented control — the curves should run side by side with the same gap all the way round. Only one rule does that: inner = outer − padding, never below zero.")
    s = k.section(b, "Three inner radii, one outer", "A 12px container (round) with 8px padding. The gap along the sides is 8px in all three; only one keeps it at the corner.")
    r = k.row(s, 40, align="min")
    for inner, lab, gap, kind in [(4, "12 − 8 = 4px", D["gaps"]["even"], "do"), (8, '"one step smaller": 8px', D["gaps"]["step"], "avoid"), (12, "copied: 12px", D["gaps"]["copied"], "avoid")]:
        m = k.frame(r, lab, gap=10)
        k.inst(kind, m)
        o = k.frame(m, "Outer", "horizontal", 0, 8, w=200, h=140, sizingV=None, bind="color/bg/surface", stroke="color/border/strong", radius=12)
        k.frame(o, "Inner", w=184, h=124, sizingV=None, bind="color/bg/brand-subtle", radius=inner, sizingH="fill")
        k.text(m, lab, "h3"); k.text(m, f"gap at the corner {gap}px", "small", "color/fg/muted")
    s = k.section(b, "Written on the tokens", "Padding changes with density and the outer radius with the style, so in code the inner radius is an expression. Figma has no expressions: set the value the table gives for the frame's modes.")
    c = k.card(s, 8, 24); rbind(k, c, "container")
    k.text(c, D["nested"]["css"], "mono", fill=True); k.text(c, D["nested"]["tailwind"], "mono", fill=True)
    for n in D["nested"]["table"]:
        st = D["defaultStyle"]
        grid_table(k, s, [(f"Inside {fig(n['outer'])} ({st})", 300)] + [(d + (" · default mode" if d == D["defaultDensity"] else ""), None) for d in D["densities"]],
                   [[fig(x["inset"]) if x["inset"].startswith("space") else x["inset"]] + [("own role (clear of the curve)" if x["clear"][st][d] else f"{x['values'][st][d]}px") for d in D["densities"]] for x in n["rows"]])
    s = k.section(b, "Flush children", f"A header, image or table that touches the container's edge takes the container's radius on the corners it shares. A square one pokes {D['gaps']['poke']}px out past each corner of a 12px card — don't hide that with clipping, which cuts focus rings.")
    r = k.row(s, 40, align="min")
    for kind, good in [("do", True), ("avoid", False)]:
        m = k.frame(r, kind, gap=10)
        k.inst(kind, m)
        cc = k.frame(m, "Card", gap=0, w=280, bind="color/bg/surface", stroke="color/border/strong"); smode(k, cc, "round"); rbind(k, cc, "container")
        hd = k.frame(cc, "Header", "horizontal", 0, 16, sizingH="fill", bind="color/bg/brand")
        if good: rbind(k, hd, "container", ["tl", "tr"], ["bl", "br"])
        k.text(hd, "Header image" if good else "Square corners poke out", "small", "color/action/primary/fg", weight=600)
        bd = k.frame(cc, "Body", gap=6, sizingH="fill"); k.pad(bd, 16, 16, 16, 16); k.text(bd, "Card content", "small", "color/fg/muted")
        k.text(m, "the header takes the card's radius on its top corners" if good else "a square header (or overflow: hidden to hide it)", "caption", "color/fg/muted", weight=400)
    rules(k, b, [("Only for shapes that fill the parent", "A button or badge in a card keeps its own role, even near a corner."),
                 ("Only inside the curve", "With padding of at least the parent's radius, the child's corners are clear of the curve and it keeps its own role.")])
    finish(k, b, "Nested corners")
    return b


# ------------------------------------------------------------ Joined corners
def joined(k, D):
    b = start(k, "Joined corners", "Parts that touch read as one shape: the outer corners keep the role's radius, the edges where they meet are square. Corners are logical — named by text direction — so a group flips in right-to-left.")
    s = k.section(b, "Side by side", "A segmented control and an input with its button. In code: the .ds-join class.")
    r = k.row(s, 40, align="center")
    grp = k.frame(r, "Group", "horizontal", 0, 0)
    for i, lab in enumerate(["List", "Board", "Calendar"]):
        first, last = i == 0, i == 2
        button(k, grp, lab, "secondary" if i else "primary", corners=(["tl", "bl"] if first else ["tr", "br"] if last else []), zero=(["tr", "br"] if first else ["tl", "bl"] if last else ["tl", "tr", "br", "bl"]))
    g2 = k.frame(r, "Input + button", "horizontal", 0, 0, w=360)
    text_input(k, g2, "Invite by email", corners=["tl", "bl"], zero=["tr", "br"]); button(k, g2, "Send", corners=["tr", "br"], zero=["tl", "bl"])
    k.tag(r, "outer corners: shape/control · seams: square")
    s = k.section(b, "Right to left", "The same group in Arabic or Hebrew: the first part is on the right. Logical corners follow; physical ones (top-left) would round the seams and square the ends.")
    r = k.row(s, 40, align="min")
    for kind, ok in [("do", True), ("avoid", False)]:
        m = k.frame(r, kind, gap=10); k.inst(kind, m)
        grp = k.frame(m, "Group RTL", "horizontal", 0, 0)
        labels = ["التقويم", "اللوحة", "القائمة"]  # Calendar, Board, List — right to left
        for i, lab in enumerate(labels):
            leftmost, rightmost = i == 0, i == 2
            if ok: button(k, grp, lab, "primary" if rightmost else "secondary", corners=(["tl", "bl"] if leftmost else ["tr", "br"] if rightmost else []), zero=(["tr", "br"] if leftmost else ["tl", "bl"] if rightmost else ["tl", "tr", "br", "bl"]))
            else: button(k, grp, lab, "primary" if rightmost else "secondary", corners=(["tr", "br"] if leftmost else ["tl", "bl"] if rightmost else ["tr", "br"]), zero=(["tl", "bl"] if leftmost else ["tr", "br"] if rightmost else ["tl", "bl"]))
        k.text(m, "logical corners: the outer ends stay round" if ok else "physical corners: rounded seams, square ends", "caption", "color/fg/muted", weight=400)
    s = k.section(b, "Stacked, and attached to an edge", "List items that touch, and a drawer attached to the window edge — rounded only on the side facing the page.")
    r = k.row(s, 40, align="min")
    lst = k.frame(r, "Stacked list", gap=0, w=280)
    for i, lab in enumerate(["Overview", "Members", "Billing"]):
        it = k.frame(lst, lab, "horizontal", 0, 14, sizingH="fill", bind="color/bg/surface", stroke="color/border/subtle")
        rbind(k, it, "container", (["tl", "tr"] if i == 0 else ["bl", "br"] if i == 2 else []), (["bl", "br"] if i == 0 else ["tl", "tr"] if i == 2 else ["tl", "tr", "br", "bl"]))
        k.text(it, lab, "small")
    win = k.frame(r, "Window with drawer", "horizontal", 0, 0, w=520, h=240, sizingV=None, bind="color/bg/canvas", stroke="color/border/strong", radius=8)
    setp(k, win, clip=True)
    dr = k.frame(win, "Drawer", gap=8, w=220, bind="color/bg/surface", stroke="color/border/subtle"); setp(k, dr, sizingV="fill"); k.pad(dr, 16, 16, 16, 16)
    rbind(k, dr, "surface", ["tr", "br"], ["tl", "bl"])
    k.text(dr, "Drawer", "h3"); k.text(dr, "surface on the corners facing the page", "small", "color/fg/muted", fill=True)
    rules(k, b, [("One shape, one role", "All outer corners of a joined group use the same role."),
                 ("A gap means separate", "Parts with a gap between them are separate shapes and keep all four corners."),
                 ("The focused part comes forward", "The next part is painted after the focused one and can cover its ring where they meet; .ds-join lifts the focused part.")])
    finish(k, b, "Joined corners")
    return b


# ------------------------------------------------------------ Focus rings
def focus(k, D):
    off = D["focus"]["offset"]
    b = start(k, "Focus rings", f"Every focusable element shows a {D['focus']['width']}px ring {off}px outside it. The ring is part of the shape: it hugs the corners, and nothing cuts it off.")
    s = k.section(b, "Rings that hug the shape", f"In code the ring is an outline, which follows the radius by itself. A ring drawn on its own layer — here, a frame {off}px out with its stroke outside — takes the role's -focus radius: the shape plus the offset.")
    tbl = k.card(s, 0, 0); rbind(k, tbl, "container")
    head = k.frame(tbl, "Head", "horizontal", 16, 12, sizingH="fill", bind="color/bg/surface-sunken"); k.pad(head, 24, 24)
    rbind(k, head, "container", ["tl", "tr"], ["bl", "br"])
    for t_, w in [("Token", 240), ("For", 180)] + [(st, None) for st in STY]:
        c = k.frame(head, t_, w=w, sizingH=None if w else "fill"); k.text(c, t_, "caption", "color/fg/muted", weight=700)
    for role, (w_, h_) in [("mark", (16, 16)), ("control", (72, 32)), ("container", (96, 56)), ("surface", (112, 64))]:
        t = T(D, f"shape.{role}-focus"); documented.append(t["name"])
        row = k.frame(tbl, t["name"], "horizontal", 16, 16, sizingH="fill", align="center", stroke="color/border/subtle"); k.pad(row, 24, 24)
        setp(k, row, strokeSides=[1, 0, 0, 0])
        c = k.frame(row, "Token", gap=4, w=240); k.text(c, t["figma"], "mono")
        c = k.frame(row, "For", gap=4, w=180); k.text(c, fig(t["of"]), "mono")
        for st in STY:
            cell = k.frame(row, st, "horizontal", 12, 0, sizingH="fill", align="center")
            smode(k, cell, st)
            rg = ring(k, cell, role, off)
            shape(k, rg, role, w_, h_, fill="color/bg/surface")
            k.text(cell, f"{t['styles'][st]['px']}px", "small", "color/fg/muted")
    s = k.section(b, "Nothing cuts the ring", f"The ring reaches {D['limits']['ringReach']}px outside its element. A rounded container that clips its content cuts the ring of anything at its edge; so can the next part of a group.")
    r = k.row(s, 40, align="min")
    m = k.frame(r, "do", gap=10); k.inst("do", m)
    cc = k.frame(m, "Card", gap=8, w=300, bind="color/bg/surface", stroke="color/border/strong"); rbind(k, cc, "container"); k.pad(cc, 16, 16, 16, 16)
    rg = ring(k, cc, "control", off); button(k, rg, "Choose plan")
    k.text(m, "padding ≥ the ring's reach: the ring shows on all four sides", "caption", "color/fg/muted", weight=400)
    m = k.frame(r, "avoid clipped", gap=10); k.inst("avoid", m)
    cc = k.frame(m, "Card (clips)", "horizontal", 0, 0, w=300, bind="color/bg/surface", stroke="color/border/strong", align="center"); rbind(k, cc, "container")
    rg = ring(k, cc, "control", off); button(k, rg, "Choose plan")
    k.pad(rg, 0, off, 0, 0)  # flush with the card's start, top and bottom edges
    setp(k, cc, clip=True)  # the card clips its content: the ring is cut wherever it meets the card's edge
    k.text(m, "a flush button in a card that clips: the ring survives on one side", "caption", "color/fg/muted", weight=400)
    m = k.frame(r, "avoid covered", gap=10); k.inst("avoid", m)
    grp = k.frame(m, "Group", "horizontal", -off, 0, align="center")
    rg = ring(k, grp, "control", off); button(k, rg, "Monthly", corners=["tl", "bl"], zero=["tr", "br"])
    button(k, grp, "Yearly", "secondary", corners=["tr", "br"], zero=["tl", "bl"])  # painted after the ring: it covers the ring where they meet
    k.text(m, "the next part covers the ring where they meet", "caption", "color/fg/muted", weight=400)
    rules(k, b, [("Outline, not box-shadow", "Outlines follow the radius and survive forced-colours mode; box-shadow rings disappear there (Border foundation)."),
                 ("-focus tokens only for rings", "shape/container-focus is not a rounder card."),
                 ("Checked in the browser", "The radius audit tabs through a page and samples every ring on all four sides, in every style.")])
    finish(k, b, "Focus rings")
    return b


# ------------------------------------------------------------ Corners and content
def content(k, D):
    b = start(k, "Corners and content", "Text's contrast is measured against the fill behind it. A rounded corner removes fill: text that reaches into the corner sits on whatever is behind the shape.")
    s = k.section(b, "Checked for every role", f"The corner of each label's and content box sits inside its rounded shape, in every style and density. {D['defaultStyle']} style, {D['defaultDensity']} density:")
    grid_table(k, s, [("Case", 260), ("Radius and the text box's corner", None), ("Inside", 100)], [[x["item"].split(": ")[0], x["item"].split(": ")[1], "✓" if x["ok"] else "✕"] for x in D["r3"]])
    pill = next(m for m in D["mistakes"] if m["mistake"].startswith("A pill-shaped button"))
    s = k.section(b, "Pills and wrapping text", pill["measured"][0].upper() + pill["measured"][1:] + ".")
    r = k.row(s, 40, align="min")
    m = k.frame(r, "avoid", gap=10); k.inst("avoid", m)
    p = k.frame(m, "Pill, two lines", "horizontal", 0, 0, w=260, h=88, sizingV=None, bind="color/action/primary/bg", align="center", main="center"); rbind(k, p, "pill"); k.pad(p, 12, 12, 4, 4)
    t = k.f.tool("create_node", type="text", parent=p, text="Request access to the workspace", props={"fontFamily": "Inter", "fontSize": 28, "lineHeight": 40, "fontWeight": 600})["id"]
    k.f.cmd("variable.bind", ids=[t], field="fill", variable="color/action/primary/fg"); setp(k, t, sizingH="fill")
    k.text(m, "round ends cut the first and last letters off the fill", "caption", "color/fg/muted", weight=400)
    m = k.frame(r, "do", gap=10); k.inst("do", m)
    p = k.frame(m, "Control, two lines", "horizontal", 0, 0, w=260, h=88, sizingV=None, bind="color/action/primary/bg", align="center", main="center"); rbind(k, p, "control"); k.pad(p, 12, 12, 4, 4)
    t = k.f.tool("create_node", type="text", parent=p, text="Request access to the workspace", props={"fontFamily": "Inter", "fontSize": 28, "lineHeight": 40, "fontWeight": 600})["id"]
    k.f.cmd("variable.bind", ids=[t], field="fill", variable="color/action/primary/fg"); setp(k, t, sizingH="fill")
    k.text(m, "shape/control: the button grows, the corners stay corners", "caption", "color/fg/muted", weight=400)
    s = k.section(b, "Radius and size", f"The same radius looks rounder on a smaller shape. {D['roles']['control']['round']}px is a soft corner on a {D['control']['comfortable']}px button and half a circle on a {D['markSize']}px checkbox — why marks and controls have their own roles.")
    r = k.row(s, 32, align="center")
    sm = k.frame(r, "round", "horizontal", 32, 0, align="center"); smode(k, sm, "round")
    bb = k.frame(sm, "48px button", "horizontal", 0, 0, w=160, h=48, sizingV=None, bind="color/bg/brand-subtle", stroke="color/border/strong", align="center", main="center"); rbind(k, bb, "control"); k.text(bb, "control · 48px tall", "caption", "color/fg/brand", weight=600)
    cb = k.frame(sm, "16px box, control radius", w=16, h=16, sizingV=None, bind="color/bg/brand-subtle", stroke="color/border/strong"); rbind(k, cb, "control")
    k.text(sm, "← the same 8px on a 16px box", "small", "color/fg/muted")
    rules(k, b, [("Padding before radius", "If text needs to go closer to the edge, the radius gets smaller — the text doesn't move into the corner."),
                 ("Icons count as content", "An icon in a pill or round button stays inside the shape like text does.")])
    finish(k, b, "Corners and content")
    return b


# ------------------------------------------------------------ Choosing a shape
def choosing(k, D):
    b = start(k, "Choosing a shape", "Four questions get you to the right corners: what is it, is it inside something rounded, does it touch another part, and how is its focus ring drawn?")
    for d in D["decisions"]:
        s = k.section(b, d["what"], d["question"])
        grid_table(k, s, [("When", 640), ("Use", None)], [[w, slashed(u)] for w, u in d["answers"]])
    s = k.section(b, "Worked example — a plan card", "One question at a time, in this product's style.")
    r = k.row(s, 40, align="min")
    plan_card(k, r, 360, D["defaultStyle"], tags=True)
    st, dd = D["defaultStyle"], D["defaultDensity"]
    cont = D["roles"]["container"][st]
    grid_table(k, r, [("Part", 200), ("Role or rule", 200), ("Why", None)], [
        ["The card", "shape/container", "Holds content in the page."],
        ["The header, flush with the top", f"container on the top corners ({cont}px)", "Shares the card's top corners; nothing clipped."],
        ["The field and the buttons", "shape/control", "Things people type in and press."],
        ["The checkbox", "shape/mark", "Square, so it never reads as a radio."],
        ["The Popular badge", "shape/pill", "A one-word label that never wraps."]])
    s = k.section(b, "Do and avoid", "Measured in this build.")
    grid_table(k, s, [("Avoid", 380), ("Measured", None), ("Do", 380)], [[m["mistake"], m["measured"], f"{m['fix']} — {m['fixValue']}"] for m in D["mistakes"]])
    finish(k, b, "Choosing a shape")
    return b


# ------------------------------------------------------------ Readers' settings and products
def settings(k, D):
    b = start(k, "Readers' settings and products", "People enlarge text, switch to forced colours and read right to left; products add shapes of their own. Corners are built so none of that breaks.")
    s = k.section(b, "Bigger text", "Radii are px: when text doubles, shapes grow around it and the corners stay the same size. Pills are the exception — their ends grow with their height.")
    r = k.row(s, 32, align="min")
    for size, lab in [(16, "16px text"), (32, "32px text (200%)")]:
        m = k.frame(r, lab, gap=8)
        bb = k.frame(m, "Button", "horizontal", 0, 0, bind="color/action/primary/bg", align="center"); rbind(k, bb, "control"); bind_pad(k, bb, "space.inset.md", "lr"); bind_pad(k, bb, "space.inset.xs", "tb")
        t = k.f.tool("create_node", type="text", parent=bb, text="Save changes", props={"fontFamily": "Inter", "fontSize": size, "lineHeight": int(size * 1.43), "fontWeight": 600})["id"]
        k.f.cmd("variable.bind", ids=[t], field="fill", variable="color/action/primary/fg")
        k.text(m, lab + f" · corners {D['roles']['control'][D['defaultStyle']]}px", "caption", "color/fg/muted", weight=400)
    s = k.section(b, "Density", "Radii don't change with density; padding does. Nested radii follow, because they are written as parent − padding.")
    st = D["defaultStyle"]; cont = D["roles"]["container"][st]
    grid_table(k, s, [("Inside a container with space/inset/xs", 420)] + [(d, None) for d in D["densities"]], [[f"{cont}px container ({st})"] + [f"{max(0, cont - D['space']['xs'][d])}px" for d in D["densities"]]])
    s = k.section(b, "Forced colours and right to left", "Windows' contrast themes keep borders and outlines and drop fills and box-shadows: corners survive, outline rings survive. Joined groups, drawers and sheets use logical corners, so they flip with the text direction.")
    s = k.section(b, "What the config changes", "Only choices live in the config; everything else is computed and checked.")
    grid_table(k, s, [("Follows the config", 640), ("Fixed on purpose", None)], [
        [f"The style (radius.style, now {st}: {', '.join(STY)})", "The scale and the six roles"],
        ["Roles added for this product (radius.roles)", "The nested rule, the ring radii and the limits — computed and checked"]])
    product = [t for t in D["tokens"] if t.get("product")]
    if product:
        s = k.section(b, "Roles added for this product", "Defined in the engine config and checked like the built-in ones.")
        for t in product: documented.append(t["name"])
        grid_table(k, s, [("Token", 300), ("Use it for", None)] + [(x, 120) for x in STY], [[fig(t["name"]), t["use"]] + [f"{t['styles'][x]['px']}px" for x in STY] for t in product])
    s = k.section(b, "Adding a role", "Name it by its job and give a key on the scale for each style. The build refuses names by look or size, keys off the scale, radii that shrink from sharp to round, and full (that is shape/pill).")
    c = k.card(s, 8, 24); rbind(k, c, "container")
    k.text(c, '{ "radius": { "style": "' + st + '", "roles": [ { "name": "shape.thumbnail", "sharp": "1", "default": "3", "round": "4", "description": "Image previews in lists and pickers" } ] } }', "mono", fill=True)
    s = k.section(b, "Accessibility reference", "What the build checks for radius, and the result for this build.")
    grid_table(k, s, [("Check", 80), ("What it checks", 840), ("WCAG", 160), ("Result", None)], [[x["id"], x["title"], f"{x['wcag']} ({x['level']})", f"{x['status']} · {x['summary']}"] for x in D["checks"]])
    finish(k, b, "Readers' settings and products")
    return b


CHAPTER_FNS = [principles, tokens, roles, styles, nested, joined, focus, content, choosing, settings]

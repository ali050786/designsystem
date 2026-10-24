"""Elevation foundation as one systematic story: 11 chapters, each = explain → live examples → tokens → rules.
Every example's fill is bound to its level's surface (Elevation collection, linked to Colour), its shadow is the level's
effect style (colour, offset, blur and spread bound to variables, so a frame in Dark mode shows the Dark shadow), its edge
is bound to the level's border at border/width/line, corners to Shape roles and padding to Density. "One row, two modes"
is one drawing in a Light frame and a Dark frame. The forced-colours pictures use fixed system-like colours and say they are
a preview. Every elevation token is documented on exactly one chapter (checked at build time). All copy is original
(clean-room) and follows the generated guide."""
import re
from story_space import grid_table, spec, bind, bind_pad, dmode, fig
from story_border import setp, rbind, line, rules, button, field, ring, fc_frame, fc_text, FC

GROUP = {"Five principles": "Idea", "How tokens are built": "Structure", "Levels by job": "Levels", "Shadows": "Levels",
         "Height in Dark": "Levels", "Edges": "Levels", "The stacking order": "Stacking", "Dialogs and the scrim": "Stacking",
         "Lifting and dragging": "Stacking", "Choosing a level": "Using", "Readers' settings and products": "Using"}
TEASER = {"How tokens are built": "one collection, effect styles bound to Colour", "Levels by job": "six levels, named by what they do",
          "Shadows": "computed from height, measured", "Height in Dark": "lighter surfaces where shadows can't show",
          "Edges": "what's left when shadows go", "The stacking order": "the top layer and five layers with room between",
          "Dialogs and the scrim": "a modal that really stops the page", "Lifting and dragging": "temporary, and never the only cue",
          "Choosing a level": "four questions and a worked example", "Readers' settings and products": "dark mode, forced colours, zoom, your own layers"}
JOBS = ["page", "raised", "sticky", "floating", "modal", "dragging"]
SHAPE = {"page": "none", "raised": "container", "sticky": "none", "floating": "container", "modal": "surface", "dragging": "container"}
documented = []
CH = []
ESTYLE = {}  # job → effect style id, filled by the builder
BOARD_W = 1440


# ------------------------------------------------------------ helpers
def T(D, name):
    return next(t for t in D["tokens"] if t["name"] == name)


def L(D, job):
    return next(l for l in D["levels"] if l["job"] == job)


def doc(D, name, chapter):
    """Record that `name` is documented on `chapter` — and that this is the chapter the contract says."""
    assert T(D, name)["chapter"] == chapter, (name, T(D, name)["chapter"], chapter)
    documented.append(name)


def sl(text):
    """Token names in Figma are written with slashes."""
    text = text.replace("`", "")
    return re.sub(r"\b(elevation|layer|color|border|space|shape)\.[a-z0-9-]+(\.[a-z0-9-]+)*", lambda m: m.group(0).replace(".", "/"), text)


def mode(k, nid, m):
    k.f.cmd("variable.setMode", ids=[nid], collection="Color", mode=m)


def shadow(k, nid, job):
    k.f.cmd("style.apply", ids=[nid], style=ESTYLE[job])


def edge(k, nid, job):
    """A level's edge: border/width/line, coloured by the level's border; sticky only on the side facing the content."""
    line(k, nid, "line", f"elevation/{job}/border", "b" if job == "sticky" else None)


def level(k, parent, job, name=None, w=None, h=None, pad="space.inset.lg", direction="vertical", gap="space.stack.sm",
          with_shadow=True, with_edge=True, surface=None, align=None, shadow_of=None):
    """A frame that takes the whole level: surface, shadow (effect style), edge and corners."""
    surf = surface or (f"elevation/{job}/surface" if job != "dragging" else "elevation/raised/surface")
    nid = k.frame(parent, name or job, direction, 0, 0, w=w, h=h, sizingV=None if h else "hug", bind=surf, align=align)
    if SHAPE[job] != "none": rbind(k, nid, SHAPE[job])
    if pad: bind_pad(k, nid, pad)
    if gap: bind(k, nid, "gap", gap)
    if with_shadow and job != "page": shadow(k, nid, shadow_of or job)
    if with_edge and job in ("sticky", "floating", "modal", "dragging"): edge(k, nid, job)
    return nid


def stage(k, parent, w, h, name="Window", m="Light"):
    """A small window drawn at a fixed size, children placed by position (so levels can overlap)."""
    nid = k.f.tool("create_node", type="frame", parent=parent, name=name, width=w, height=h, props={"layout": None, "fills": ["#FFFFFF"], "clip": True})["id"]
    k.f.cmd("variable.bind", ids=[nid], field="fill", variable="elevation/page/surface")
    rbind(k, nid, "container"); line(k, nid, "line", "color/border/subtle")
    mode(k, nid, m); dmode(k, nid, "default")
    return nid


def place(k, nid, x, y):
    setp(k, nid, x=x, y=y)


def menu(k, parent, items=("Rename", "Duplicate", "Delete"), w=180, job="floating", name="Menu", **kw):
    m = level(k, parent, job, name, w=w, pad="space.inset.xs", gap=None, **kw)
    for it in items:
        r = k.frame(m, it, "horizontal", 0, 0, sizingH="fill", align="center"); bind_pad(k, r, "space.inset.sm", "lr"); bind_pad(k, r, "space.inset.xs", "tb")
        spec(k, r, it, "type.body.md", "color/fg/danger" if it.startswith("Delete") else "color/fg/default")
    return m


def proj_card(k, parent, title, sub, w=220, job="raised", surface=None, name=None, **kw):
    c = level(k, parent, job, name or f"Card · {title}", w=w, surface=surface, **kw)
    spec(k, c, title, "type.title.md"); spec(k, c, sub, "type.body.sm", "color/fg/muted")
    return c


def header(k, parent, w, title="Projects"):
    h = level(k, parent, "sticky", "Header", w=w, direction="horizontal", pad=None, gap=None, align="center")
    bind_pad(k, h, "space.inset.lg", "lr"); bind_pad(k, h, "space.inset.md", "tb")
    t = spec(k, h, title, "type.title.md"); setp(k, t, sizingH="fill")
    spec(k, h, "Account ▾", "type.body.md", "color/fg/muted")
    return h


def two_modes(k, parent, draw, labels=("Light", "Dark"), w=600, name="Two modes"):
    """The same drawing in a Light frame and a Dark frame: one drawing, two modes."""
    r = k.row(parent, 24, name, align="min")
    for m in labels:
        col = k.frame(r, m, gap=10, sizingH="fill")
        k.text(col, m.upper(), "caption", "color/fg/subtle", weight=700)
        box = k.frame(col, f"{m} frame", gap=24, pad=32, sizingH="fill", bind="elevation/page/surface"); rbind(k, box, "container")
        mode(k, box, m); dmode(k, box, "default")
        draw(box, m)
    return r


def pair(k, parent, kind, caption, w=None):
    m = k.frame(parent, kind, gap=10, sizingH="fill" if not w else None, w=w)
    k.inst(kind, m)
    cap = k.text(m, caption, "small", "color/fg/muted", fill=True)
    return m


def start(k, title, lead):
    k.page(title)
    b = k.frame(name=title, w=BOARD_W, pad=80, gap=72, bind="color/bg/canvas")
    mode(k, b, "Light")
    k.f.cmd("variable.setMode", ids=[b], collection="Responsive", mode="lg")
    dmode(k, b, "default")
    k.inst("page", b, {"Eyebrow": f"Elevation · {GROUP[title]}", "Title": title, "Lead": lead}, fill=True)
    return b


def finish(k, b, title):
    i = CH.index(title)
    if i + 1 >= len(CH):
        c = k.card(b, 8, 24, bind="color/bg/brand-subtle")
        k.text(c, "End of the elevation foundation", "h3")
        k.text(c, "You've seen when something needs height, the six levels and how each shows itself — shadow in Light, surface in Dark, an edge everywhere — the stacking order, dialogs that really stop the page, and how each is checked. Next in the system: Motion.", "body", "color/fg/muted", fill=True)
        return
    t = CH[i + 1]
    c = k.frame(b, "Next", "horizontal", 16, 24, sizingH="fill", bind="color/bg/surface", align="center")
    line(k, c, "line", "color/border/subtle"); rbind(k, c, "container")
    col = k.frame(c, "Text", gap=4, sizingH="fill")
    k.text(col, "NEXT", "caption", "color/fg/subtle", weight=700)
    k.text(col, t, "h3")
    k.text(col, TEASER[t].capitalize() + ".", "small", "color/fg/muted")
    k.text(c, "→", "h1", "color/fg/brand")


def note(k, parent, title, body):
    c = k.card(parent, 6, 24)
    k.text(c, title, "h3"); k.text(c, sl(body), "body", "color/fg/muted", fill=True)
    return c


def slip(k, parent, D, idx, avoid_draw=None, do_draw=None):
    """A measured mistake from the contract: avoid (with what was measured) beside do (the fix)."""
    m = D["mistakes"][idx]
    r = k.row(parent, 24, "Do and avoid", align="min")
    a = k.frame(r, "avoid", gap=12, sizingH="fill"); k.inst("avoid", a)
    k.text(a, sl(m["mistake"]), "body", weight=600, fill=True)
    if avoid_draw: avoid_draw(a)
    k.text(a, sl(m["measured"].capitalize()), "small", "color/fg/muted", fill=True)
    d = k.frame(r, "do", gap=12, sizingH="fill"); k.inst("do", d)
    fx = sl(m["fix"]); k.text(d, fx[0].upper() + fx[1:] if re.fullmatch(r"[a-z ]+", fx) else fx, "body", weight=600, fill=True)
    if do_draw: do_draw(d)
    k.text(d, sl(m["fixValue"][0].upper() + m["fixValue"][1:]), "small", "color/fg/muted", fill=True)
    return r


def fc_level(k, parent, name, w=180, sides=None, pad=12, gap=6):
    """A level in the forced-colours preview: no shadow, the page colour, the edge in the system text colour."""
    return fc_frame(k, parent, name, w=w, radius=8, sides=sides, pad=pad, gap=gap)


# ------------------------------------------------------------ Five principles
def principles(k, D):
    b = start(k, "Five principles", "Five principles shape every level in this system. Each one is checked by the build or the elevation audit — the demo beside it shows what it means.")
    s = k.section(b, "The principles", "Read them once; every chapter after this one applies them.")
    chk = {c["id"]: c["summary"] for c in D["checks"]}
    items = [
        ("Height is a last resort", "Space groups things, a surface change sets a region apart, a line separates. A level is for something that really sits over something else — the higher it sits, the more it interrupts.", "resort"),
        ("A level says what it does", "Six levels named by job — page, raised, sticky, floating, modal, dragging — not by number. \"Floating\" tells you a menu goes there; \"level 3\" tells you nothing.", "jobs"),
        ("Whatever floats keeps an edge", f"Floating, modal and dragging draw a border on every side, sticky bars a line toward the content. Forced colours remove shadows and Dark barely shows them, so the edge is what's left (E1 {chk['E1']}, E3 {chk['E3']}).", "edge"),
        ("Dark shows height by surface", f"A black shadow on a near-black page has almost nothing to darken. In Dark each level is lighter than the one below (E2 {chk['E2']}).", "dark"),
        ("One stacking order", f"sticky < floating < modal < toast < dragging, as layer tokens with room between them; dialogs and menus use the browser's top layer (E6 {chk['E6']}).", "order"),
    ]
    for t, body, demo in items:
        c = k.frame(s, t, "horizontal", 32, 28, sizingH="fill", bind="color/bg/surface", align="center")
        rbind(k, c, "container"); line(k, c, "line", "color/border/subtle")
        col = k.frame(c, "Text", gap=6, sizingH="fill")
        k.text(col, t, "h2", fill=True); k.text(col, body, "body", "color/fg/muted", fill=True)
        d = k.frame(c, "Demo", "horizontal", 24, 24, w=640, bind="elevation/page/surface", align="center", main="center")
        rbind(k, d, "container"); setp(k, d, clip=False)
        if demo == "resort":
            for kind, lifted in [("avoid", True), ("do", False)]:
                m = k.frame(d, kind, gap=8, align="center"); k.inst(kind, m)
                g = k.frame(m, "List", gap=8, w=210)
                for lab in ["Name", "Email", "Role"]:
                    if lifted:
                        rr = level(k, g, "raised", lab, pad="space.inset.sm", gap=None); setp(k, rr, sizingH="fill"); spec(k, rr, lab, "type.body.sm")
                    else:
                        spec(k, g, lab, "type.body.sm")
                k.text(m, "a shadow on every row" if lifted else "space groups them", "caption", "color/fg/muted", weight=400)
        elif demo == "jobs":
            for job in ["raised", "sticky", "floating", "modal"]:
                m = k.frame(d, job, gap=8, align="center")
                level(k, m, job, job, w=110, h=64, pad=None, gap=None)
                k.text(m, job, "caption", "color/fg/muted", weight=400)
        elif demo == "edge":
            m = k.frame(d, "normal", gap=8, align="center"); menu(k, m, ("Rename", "Delete"), 170); k.text(m, "edge and shadow", "caption", "color/fg/muted", weight=400)
            m = k.frame(d, "forced", gap=8, align="center")
            mm = fc_level(k, m, "Menu (forced colours)", 170)
            for it in ["Rename", "Delete"]: fc_text(k, mm, it)
            k.text(m, "forced colours: the edge stays", "caption", "color/fg/muted", weight=400)
        elif demo == "dark":
            mode(k, d, "Dark")
            for job in ["page", "raised", "sticky", "floating"]:
                m = k.frame(d, job, gap=8, align="center")
                sw = k.frame(m, job, w=110, h=64, sizingV=None, bind=f"elevation/{job}/surface"); rbind(k, sw, "container")
                if job == "page": line(k, sw, "line", "color/border/subtle")
                k.text(m, job, "caption", "color/fg/muted", weight=400)
        else:
            r = k.row(d, 8, align="center", fill=False)
            for i, l in enumerate(D["layers"]):
                if i: k.text(r, "<", "h3", "color/fg/subtle")
                k.chip(r, l["name"].split(".")[1])
    s = k.section(b, "How this foundation is organised", "The chapters follow the order you'd decide height in: the idea, the structure, the levels and how each shows itself, what goes on top of what, then how to choose.")
    grid = k.row(s, 16, wrap=True)
    for t in CH:
        c = k.frame(grid, t, gap=6, pad=18, w=410, bind="color/bg/surface")
        rbind(k, c, "container"); line(k, c, "line", "color/border/subtle")
        k.text(c, GROUP[t].upper(), "caption", "color/fg/subtle", weight=700)
        k.text(c, t, "body", weight=600, fill=True)
        k.text(c, TEASER.get(t, "the principles behind every decision").capitalize(), "small", "color/fg/muted", fill=True)
    finish(k, b, "Five principles")
    return b


# ------------------------------------------------------------ How tokens are built
def tokens(k, D):
    b = start(k, "How tokens are built", "Elevation tokens live in one collection and point into Colour for everything you see. Shadows are effect styles whose colour, offset, blur and spread are bound to variables.")
    s = k.section(b, "One collection, linked to Colour", "Each value you see is a link, so the Light and Dark modes switch it.")
    grid_table(k, s, [("Collection", 200), ("Modes", 160), ("What it holds", None), ("Changes with", 300)], [
        ["Elevation", "one", "Per level: a surface (elevation/<job>/surface), the shadow's offset, blur and spread (elevation/<job>/shadow/*), an edge (elevation/<job>/border) and, for modal, the scrim. The stacking order (layer.*) is code only: Figma has no z-index.", "Colour's Light and Dark modes; the product's own layers (elevation.layers)"],
        ["Color", "Light, Dark", "What the levels link to: color/bg/canvas, surface, surface-raised, surface-overlay, color/border/floating, color/border/subtle, color/bg/scrim and the shadow strengths color/shadow/1…4", "the theme"]])
    s = k.section(b, "Effect styles", "One effect style per level, named by the level. Its colour is bound to the level's shadow strength in Colour, and its offset, blur and spread to the Elevation numbers — so a frame set to Dark shows the Dark shadow, and a rebuilt product updates every shadow at once.")
    rows = []
    for l in D["levels"]:
        if not l["shadow"]: continue
        sh = l["shadow"]
        rows.append([f"elevation/{l['job']}", sl(sh["color"]), f"elevation/{l['job']}/shadow/offset-y · blur · spread", f"0 {sh['offsetY']} {sh['blur']} {sh['spread']}"])
    grid_table(k, s, [("Effect style", 240), ("Colour bound to", 200), ("Numbers bound to", None), ("Light value (x y blur spread)", 260)], rows)
    s = k.section(b, "Reading a name", "Levels are named by what they do. The shadow strengths in Colour stay numbered: they are a scale the levels pick from, like the border widths, not places people choose.")
    r = k.row(s, 12, align="center", fill=False)
    for part, what in [("elevation", "category"), ("/", ""), ("floating", "level"), ("/", ""), ("border", "part")]:
        if not what: k.text(r, part, "h2", "color/fg/subtle"); continue
        m = k.frame(r, part, gap=4, align="center"); k.chip(m, part, bind="color/bg/brand-subtle"); k.text(m, what, "caption", "color/fg/muted", weight=400)
    grid_table(k, s, [("Figma", 320), ("CSS variable", 360), ("Tailwind", None)], [
        ["elevation/floating/border", "--ds-elevation-floating-border", "border-elevation-floating-border"],
        ["elevation/floating (effect style)", "--ds-elevation-floating-shadow", "shadow-floating"],
        ["— (code only)", "--ds-layer-floating", "z-(--ds-layer-floating)"]])
    s = k.section(b, "Take the whole level", "Each level is a class in tokens.css carrying surface, shadow, edge and layer together, so a component can't take the shadow and forget the edge. In Figma: surfaces are scoped to fills, edges to strokes, the shadow is the effect style.")
    grid_table(k, s, [("Class", 180), ("What it carries", None), ("Tailwind", 520)], [[f".{c['class']}", c["use"], c["tailwind"]] for c in D["classes"]])
    rules(k, b, [("Shadows come from a level", "Every shadow is a level's effect style. A shadow typed by hand has no Dark value and no check behind it."),
                 ("Never the shadow strengths directly", "color/shadow/1…4 are for the effect styles. A frame that binds one by hand skips its level's edge and surface.")])
    finish(k, b, "How tokens are built")
    return b


# ------------------------------------------------------------ Levels by job
def levels(k, D):
    b = start(k, "Levels by job", "Six levels, lowest first. Pick by what the thing does to the page; the surface, shadow, edge and layer come with the level.")
    s = k.section(b, "One row, two modes", "The same six frames, each bound to its level — in a Light frame and a Dark frame. In Light, shadow and edge show height; in Dark, the surfaces get lighter as they rise.")
    def draw(box, m):
        r = k.row(box, 12, align="min", fill=False); setp(k, r, clip=False); setp(k, box, clip=False)
        for job in JOBS:
            c = level(k, r, job, job, w=80, h=80, pad="space.inset.sm", gap=None)
            if job == "page": line(k, c, "line", "color/border/subtle", dashed=True)
            spec(k, c, job, "type.label.md")
    two_modes(k, s, draw)
    s = k.section(b, "The levels", "Values for this product. The surface is linked to Colour; the level's shadow, edge and layer are on the next chapters.")
    rows = []
    for l in D["levels"]:
        su = l["surface"]
        if su: doc(D, su["token"], "Levels by job")
        rows.append([f"elevation/{l['job']}", l["use"], (f"{fig(su['token'])} = {fig(su['role'])}\n{su['Light']} · {su['Dark']}" if su else "keeps its own"), f"{l['height']}px" if l["height"] else "—"])
    def cell(c, i, v, w):
        if i == 2 and "\n" in v:
            a, bb = v.split("\n"); k.text(c, a, "mono", fill=True); k.text(c, bb, "caption", "color/fg/muted", weight=400); return True
        if i == 0: k.text(c, v, "mono"); return True
        return False
    grid_table(k, s, [("Level", 220), ("Use it for", None), ("Surface (Light · Dark)", 420), ("Height", 90)], rows, cell)
    r = k.row(b, 24, align="min")
    note(k, r, "Floating and modal share a surface", "Both are color.bg.surface-overlay. What makes a dialog a dialog is the scrim behind it and the page going still, not a different grey; a menu opened inside a dialog still reads, because of its edge.")
    note(k, r, "Dragging is a state, not a place", "An item takes elevation.dragging while it is held and goes back to its own level when dropped. It keeps its own surface.")
    rules(k, b, [("Lowest level that works", "A card that is a link is still raised; a settings panel is a card, not a dialog. Every step up interrupts more."),
                 ("Not for emphasis", "A level says where something sits, not how important it is: emphasis is type, colour and position. Raising every sibling flattens them all."),
                 ("Layout first", "If a page feels muddled, fix the grouping and spacing before adding height; height on a weak layout makes it louder, not clearer.")])
    finish(k, b, "Levels by job")
    return b


# ------------------------------------------------------------ Shadows
def shadows(k, D):
    b = start(k, "Shadows", f"Each level's shadow is computed from its height: {D['shadowFormula']}. A higher level drops further, blurs wider and is at least as dark.")
    s = k.section(b, "The shadows", "\"Just under the edge\": the contrast between the page and the darkest pixel of the shadow, in the middle of the bottom edge — computed by the build and measured in Chromium by the elevation audit.")
    rows = []
    for l in D["levels"]:
        sh = l["shadow"]
        if not sh: continue
        doc(D, sh["token"], "Shadows")
        rows.append([l["job"], fig(sh["token"]), f"{l['height']}px", f"0 {sh['offsetY']} {sh['blur']} {sh['spread']}", f"{fig(sh['color'])} ({sh['alpha']['Light']} · {sh['alpha']['Dark']})", f"{sh['peakOnPage']['Light']:.2f} · {sh['peakOnPage']['Dark']:.2f}"])
    def cell(c, i, v, w):
        if i == 0:
            setp(k, c, paddingTop=6, paddingBottom=14); sw = k.frame(c, v, w=80, h=44, sizingV=None, bind="elevation/raised/surface"); rbind(k, sw, "container"); shadow(k, sw, v); setp(k, c, clip=False); return True
        if i == 1: k.text(c, v, "mono", fill=True); return True
        return False
    grid_table(k, s, [("Swatch", 110), ("Shadow", 280), ("Height", 90), ("x y blur spread", 160), ("Colour (alpha Light · Dark)", None), ("Under the edge, L · D", 200)], rows, cell)
    s = k.section(b, "One row, two modes", "The four shadows on white cards in Light, and on their own level's surface in Dark. Even the strongest is a faint change against the page — which is why a shadow is never the only thing that separates a surface.")
    def draw(box, m):
        r = k.row(box, 24, align="min", fill=False); setp(k, r, clip=False); setp(k, box, clip=False)
        for job in ["raised", "sticky", "floating", "modal"]:
            c = level(k, r, job, job, w=110, h=80, pad="space.inset.sm", gap=None, with_edge=False); spec(k, c, job, "type.label.md")
    two_modes(k, s, draw)
    r = k.row(b, 24, align="min")
    note(k, r, "Why one shadow, pulled in", "The negative spread keeps a large shadow from spreading sideways past the surface, so it reads as height, not as a smudge around the box. One shadow per level keeps one checkable number for each.")
    note(k, r, "Shown here without edges", "The row above leaves the edges off so you can see the shadows alone. Floating and modal always draw their edge (Edges).")
    rules(k, b, [("Shadow and surface together", "The floating shadow goes on the floating surface. On a raised card it would say one height and show another (ER-03)."),
                 ("No shadows by hand", "Every shadow is a level's effect style or none; in code, Tailwind's own shadow-sm … shadow-2xl are removed from the theme (ER-01).")])
    finish(k, b, "Shadows")
    return b


# ------------------------------------------------------------ Height in Dark
def dark(k, D):
    peak = max(l["shadow"]["peakOnPage"]["Dark"] for l in D["levels"] if l["shadow"])
    b = start(k, "Height in Dark", f"In Light, surfaces are white and the shadow shows height. In Dark that stops working: a black shadow on a near-black page reaches {peak:.2f}:1 at most. So in Dark each level is a lighter surface than the one below — things get lighter as they come toward you.")
    s = k.section(b, "A page in Dark", "Every frame here is bound to its level and the whole window is set to Dark mode: page, a card, the sticky header, a menu opened over the card.")
    win = stage(k, s, 640, 340, "Project page (Dark)", "Dark")
    h = header(k, win, 640); place(k, h, 0, 0)
    c = proj_card(k, win, "Atlas", "12 open tasks · updated today", 260); place(k, c, 32, 96)
    c2 = proj_card(k, win, "Beacon", "4 open tasks · updated Monday", 260); place(k, c2, 316, 96)
    m = menu(k, win, ("Rename", "Duplicate", "Delete"), 180); place(k, m, 200, 170)
    col = k.frame(s, "Steps", gap=12, sizingH="fill")
    rows = []
    for i, st in enumerate(D["dark"]["steps"]):
        l = L(D, st["job"])
        below = "—" if not i else ("same surface (the scrim tells it apart)" if st["overBelow"] == 1 else f"{st['overBelow']:.2f}:1")
        rows.append([f"elevation/{st['job']}", f"{fig(l['surface']['role'])} {st['dark']}", "—" if st["overPage"] == 1 else f"{st['overPage']:.2f}:1", below])
    grid_table(k, col, [("Level", 240), ("Dark surface", None), ("Against the page", 200), ("Against the level below", 320)], rows)
    k.text(col, f"Each step is at least {D['limits']['surfaceStepMin']}:1 lighter than the level below it (E2). The shadows still draw in Dark; they just don't carry the meaning.", "small", "color/fg/muted", fill=True)
    s = k.section(b, "The common slip", "Making the shadows darker for Dark mode. Both windows below are Dark; only the right one uses the level surfaces.")
    def avoid(a):
        w = stage(k, a, 560, 200, "Shadows only (Dark)", "Dark")
        for i, job in enumerate(["raised", "floating"]):
            c = level(k, w, job, f"{job} on the page surface", w=220, h=120, surface="elevation/page/surface", with_edge=False); place(k, c, 40 + i * 270, 40); spec(k, c, job, "type.label.md")
    def do(d):
        w = stage(k, d, 560, 200, "Level surfaces (Dark)", "Dark")
        for i, job in enumerate(["raised", "floating"]):
            c = level(k, w, job, job, w=220, h=120); place(k, c, 40 + i * 270, 40); spec(k, c, job, "type.label.md")
    slip(k, s, D, 1, avoid, do)
    rules(k, b, [("No dark-mode overrides", "The tokens switch by themselves. A Dark-only rule that sets a shadow or a surface skips the check that keeps surfaces rising (ER-07)."),
                 ("Text is measured on every level", "Each level surface is a background every text colour is measured on, in both modes (E5).")])
    finish(k, b, "Height in Dark")
    return b


# ------------------------------------------------------------ Edges
def edges(k, D):
    b = start(k, "Edges", "Whatever floats over content draws a border/width/line edge on every side; a sticky bar draws one line, on the side that faces the content scrolling under it. The edge does the work the shadow can't: it is there in Dark, in forced colours, and over a busy page.")
    s = k.section(b, "The edges", f"\"Lowest\": the weakest contrast against anything the level can sit on (page, card, sticky bar, another floating surface, the scrim), measured beside its own shadow. At least {D['edges']['min']}:1.")
    rows = []
    for l in D["levels"]:
        e = l["edge"]
        if not e: continue
        doc(D, e["token"], "Edges")
        lo = D["edges"]["lowest"].get(l["job"])
        rows.append([l["job"], fig(e["token"]), fig(e["role"]), f"{e['Light']} · {e['Dark']}", "all" if e["sides"] == "all" else "facing the content", "decorative" if not lo else f"{lo['Light']['ratio']:.2f} on {lo['Light']['on']} · {lo['Dark']['ratio']:.2f} on {lo['Dark']['on']}"])
    def cell(c, i, v, w):
        if i == 0:
            setp(k, c, paddingTop=4, paddingBottom=8); sw = level(k, c, v, v, w=80, h=44, pad=None, gap=None, with_shadow=False); return True
        if i in (1, 2): k.text(c, v, "mono", fill=True); return True
        return False
    grid_table(k, s, [("Swatch", 110), ("Edge", 260), ("Colour", 220), ("Light · Dark", 170), ("Sides", 150), ("Lowest, Light · Dark", None)], rows, cell)
    note(k, b, "color/border/floating is computed", "It sits far enough from every surface a floating thing can land on — the page, a card, a sticky bar, another floating surface (a menu over a menu, a select in a dialog) and the scrim — to reach 1.5:1 against all of them, in both modes (E3). Darker than the page in Light, lighter than the top surface in Dark. It is decorative (the menu's items identify themselves), so it doesn't need 3:1 — but it is never too faint to see.")
    s = k.section(b, "The common slip", "A menu with no edge, over a card. Light, Dark and the forced-colours preview, left without the edge and right with it.")
    def avoid(a):
        r = k.row(a, 16, align="min", fill=False); setp(k, r, clip=False)
        for m in ["Light", "Dark"]:
            box = k.frame(r, m, gap=0, pad=20, bind="elevation/page/surface"); rbind(k, box, "container"); mode(k, box, m); setp(k, box, clip=False)
            menu(k, box, ("Rename", "Delete"), 150, with_edge=False)
        box = fc_frame(k, r, "Forced colours (preview)", stroke=False, pad=20); mm = k.frame(box, "Menu", gap=6, pad=12, w=150, fill=FC["canvas"])
        for it in ["Rename", "Delete"]: fc_text(k, mm, it)
    def do(d):
        r = k.row(d, 16, align="min", fill=False); setp(k, r, clip=False)
        for m in ["Light", "Dark"]:
            box = k.frame(r, m, gap=0, pad=20, bind="elevation/page/surface"); rbind(k, box, "container"); mode(k, box, m); setp(k, box, clip=False)
            menu(k, box, ("Rename", "Delete"), 150)
        box = fc_frame(k, r, "Forced colours (preview)", stroke=False, pad=20); mm = fc_level(k, box, "Menu", 150)
        for it in ["Rename", "Delete"]: fc_text(k, mm, it)
    slip(k, s, D, 0, avoid, do)
    rules(k, b, [("Never remove the edge", "Not for a \"cleaner\" look: the edge is the only thing that survives forced colours (ER-04)."),
                 ("Cards don't need one", "A raised card sits in the flow; its content identifies it. Give it a border/width/line outline in color/border/default when many cards sit together (Border foundation).")])
    finish(k, b, "Edges")
    return b


# ------------------------------------------------------------ The stacking order
def stacking(k, D):
    b = start(k, "The stacking order", "Two mechanisms decide what is drawn on top. The browser's top layer is above everything: a dialog opened with showModal() and an element with the popover attribute go there, the most recently opened on top, and nothing can clip them. For everything else, the layer tokens set the z-index.")
    s = k.section(b, "The layers", f"Code only — Figma has no z-index. {D['limits']['layerStep']} apart, so a product can put a layer between two of them; the build computes its number.")
    rows = []
    for l in D["layers"]:
        doc(D, l["name"], "The stacking order")
        rows.append([fig(l["name"]), str(l["value"]), l["use"], l["tailwind"]])
    def cell(c, i, v, w):
        if i == 0: k.text(c, v, "mono"); return True
        return False
    grid_table(k, s, [("Layer", 200), ("z-index", 100), ("What sits there", None), ("Tailwind", 300)], rows, cell)
    s = k.section(b, "What is on top of what", "A menu opened from the header sits above the header; a dialog and its scrim above both; a toast above the dialog. A dragged item (Lifting and dragging) goes above everything.")
    win = stage(k, s, 900, 420, "Stacking")
    h = header(k, win, 900); place(k, h, 0, 0)
    c = proj_card(k, win, "Atlas", "12 open tasks", 240); place(k, c, 32, 96)
    m = menu(k, win, ("Profile", "Sign out"), 170); place(k, m, 700, 60)
    sc = k.f.tool("create_node", type="frame", parent=win, name="Scrim", width=900, height=420, props={"fills": ["#000000"]})["id"]
    k.f.cmd("variable.bind", ids=[sc], field="fill", variable="elevation/modal/scrim"); place(k, sc, 0, 0)
    dlg = level(k, win, "modal", "Dialog", w=320, pad="space.inset.xl"); place(k, dlg, 290, 120)
    spec(k, dlg, "Delete Atlas?", "type.title.lg"); spec(k, dlg, "Its tasks and files are deleted too.", "type.body.md", "color/fg/muted")
    t = level(k, win, "floating", "Toast", w=240, pad="space.inset.md"); place(k, t, 630, 330); spec(k, t, "Changes saved.", "type.body.md")
    r = k.row(s, 10, align="center", fill=False)
    for i, (lab, lay) in enumerate([("header", "sticky"), ("menu", "floating"), ("dialog + scrim", "modal"), ("toast", "toast")]):
        if i: k.text(r, "<", "h3", "color/fg/subtle")
        mm = k.frame(r, lab, gap=4, align="center"); k.chip(mm, f"layer/{lay}"); k.text(mm, lab, "caption", "color/fg/muted", weight=400)
    k.text(s, "The menu is shown open beside the dialog to show its place in the order; while a dialog is open the page behind it, and the menu with it, can't be used.", "small", "color/fg/muted", fill=True)
    s = k.section(b, "The common slip", "A big number instead of a layer.")
    slip(k, s, D, 2)
    s = k.section(b, "Menus that get clipped", "A menu inside a card or a table with overflow hidden is cut off at the parent's edge, whatever its z-index. Open it as a popover: the top layer is never clipped.")
    r = k.row(s, 24, "Do and avoid", align="min")
    a = k.frame(r, "avoid", gap=12, sizingH="fill"); k.inst("avoid", a); k.text(a, "A menu inside a card that clips", "body", weight=600, fill=True)
    cc = level(k, a, "raised", "Card that clips", w=300, h=150); setp(k, cc, clip=True)
    spec(k, cc, "Atlas", "type.title.md"); mm = menu(k, cc, ("Rename", "Duplicate", "Delete"), 170); setp(k, mm, absolute=True, x=110, y=90)
    k.text(a, "The card's overflow cuts the menu off at its edge; no z-index gets it out.", "small", "color/fg/muted", fill=True)
    d = k.frame(r, "do", gap=12, sizingH="fill"); k.inst("do", d); k.text(d, "The menu as a popover", "body", weight=600, fill=True)
    hold = k.frame(d, "Card + popover", gap=0, w=320, h=210, sizingV=None); setp(k, hold, layout=None, clip=False)
    cc = level(k, hold, "raised", "Card", w=300, h=150); place(k, cc, 0, 0); spec(k, cc, "Atlas", "type.title.md")
    mm = menu(k, hold, ("Rename", "Duplicate", "Delete"), 170); place(k, mm, 110, 90)
    k.text(d, "In the top layer: drawn above the card, the header and any parent that clips.", "small", "color/fg/muted", fill=True)
    rules(k, b, [("A menu above its header", "layer/floating is above layer/sticky, so a menu opened from the header is never cut by it."),
                 ("Focus is never hidden under a bar", "Sticky bars sit above the content, so a focused field scrolled under one would be hidden (WCAG 2.4.11): tokens.css adds the header and the focus ring to the scroll padding, and the elevation audit tabs through each page to check."),
                 ("Local order stays local", f"Inside one component, raw {', '.join(str(x) for x in D['limits']['localZ'])} are fine (a lifted part of a joined group); anything else is a layer.")])
    finish(k, b, "The stacking order")
    return b


# ------------------------------------------------------------ Dialogs and the scrim
def dialogs(k, D):
    b = start(k, "Dialogs and the scrim", "A modal stops the page until it is answered or closed. The scrim dims the page to say so; the page behind must also stop working for the keyboard and screen readers.")
    t = T(D, "elevation.modal.scrim"); doc(D, t["name"], "Dialogs and the scrim")
    q = D["quoted"]
    s = k.section(b, "The scrim", "Linked to color/bg/scrim. It comes with the dialog and leaves with it.")
    sc = L(D, "modal")["scrim"]
    grid_table(k, s, [("Token", 260), ("Light · Dark", 260), ("What it does", None)], [[fig(t["name"]), f"{sc['Light']} · {sc['Dark']}" if sc else "", f"Dims the page behind a dialog. The dialog surface measures {q['modalOnScrim']['Light']}:1 (Light) and {q['modalOnScrim']['Dark']}:1 (Dark) against the dimmed page; its edge {q['edgeOnScrim']['Light']}:1 · {q['edgeOnScrim']['Dark']}:1."]])
    s = k.section(b, "One dialog, two modes", "The page, the scrim over it, and the dialog — bound to elevation/modal/*.")
    r = k.row(s, 24, align="min")
    for m in ["Light", "Dark"]:
        col = k.frame(r, m, gap=10, sizingH="fill"); k.text(col, m.upper(), "caption", "color/fg/subtle", weight=700)
        win = stage(k, col, 600, 360, f"Dialog ({m})", m)
        h = header(k, win, 600); place(k, h, 0, 0)
        for i, (tt, sub) in enumerate([("Atlas", "12 open tasks"), ("Beacon", "4 open tasks")]):
            c = proj_card(k, win, tt, sub, 250); place(k, c, 32 + i * 282, 96)
        scr = k.f.tool("create_node", type="frame", parent=win, name="Scrim", width=600, height=360, props={"fills": ["#000000"]})["id"]
        k.f.cmd("variable.bind", ids=[scr], field="fill", variable="elevation/modal/scrim"); place(k, scr, 0, 0)
        dlg = level(k, win, "modal", "Dialog", w=360, pad="space.inset.xl"); place(k, dlg, 120, 70)
        spec(k, dlg, "Delete Atlas?", "type.title.lg"); spec(k, dlg, "Its tasks and files are deleted too. People in the project lose access.", "type.body.md", "color/fg/muted", fill=True)
        a = k.row(dlg, 8, align="center"); setp(k, a, mainAlign="max")
        button(k, a, "Cancel", "secondary"); button(k, a, "Delete project")
    s = k.section(b, "Every modal must", "In code a <dialog> opened with showModal() does most of this; .ds-modal supplies the surface, shadow, edge and scrim.")
    c = k.card(s, 10, 28)
    for item in D["modal"]["must"]:
        rr = k.row(c, 10, align="min"); k.text(rr, "✓", "body", "color/fg/brand"); k.text(rr, item[0].upper() + item[1:], "body", fill=True)
    s = k.section(b, "Not the card surface", "In Dark, a dialog on the card surface looks like one more card once the scrim dims the page.")
    def avoid(a):
        w = stage(k, a, 540, 220, "Card surface (Dark)", "Dark")
        scr = k.f.tool("create_node", type="frame", parent=w, name="Scrim", width=540, height=220, props={"fills": ["#000000"]})["id"]
        k.f.cmd("variable.bind", ids=[scr], field="fill", variable="elevation/modal/scrim")
        d = level(k, w, "modal", "Dialog on card surface", w=300, surface="elevation/raised/surface", with_edge=False); place(k, d, 120, 50); spec(k, d, "Delete Atlas?", "type.title.lg")
    def do(d_):
        w = stage(k, d_, 540, 220, "Modal level (Dark)", "Dark")
        scr = k.f.tool("create_node", type="frame", parent=w, name="Scrim", width=540, height=220, props={"fills": ["#000000"]})["id"]
        k.f.cmd("variable.bind", ids=[scr], field="fill", variable="elevation/modal/scrim")
        d = level(k, w, "modal", "Dialog", w=300); place(k, d, 120, 50); spec(k, d, "Delete Atlas?", "type.title.lg")
    slip(k, s, D, 3, avoid, do)
    rules(k, b, [("No scrim without a dialog", "The scrim goes with the dialog and leaves with it; it is never a background for content."),
                 ("A dialog is modal for real", "A <dialog> shown with the open attribute has no top layer, no backdrop and no inert page: Tab walks out of it (ER-06)."),
                 ("Toasts and dialogs", "A toast shown while a dialog is open sits in layer/toast so it is never behind the scrim — and it must not need an action, because everything outside the dialog is inert.")])
    finish(k, b, "Dialogs and the scrim")
    return b


# ------------------------------------------------------------ Lifting and dragging
def lifting(k, D):
    b = start(k, "Lifting and dragging", "Things can change height while someone uses them. The change is always temporary, and never the only sign that something happened.")
    s = k.section(b, "A card at rest, hovered and pressed", "Hover changes the fill as well as the shadow; press goes back down to rest.")
    def draw(box, m):
        r = k.row(box, 24, align="min", fill=False); setp(k, r, clip=False); setp(k, box, clip=False)
        for lab, sh, surf in [("rest", "raised", None), ("hover", "sticky", "color/bg/surface-hover"), ("pressed", "raised", "color/bg/surface-pressed")]:
            col = k.frame(r, lab, gap=8, align="center"); setp(k, col, clip=False)
            c = level(k, col, "raised", f"Card · {lab}", w=150, surface=surf, with_edge=False, shadow_of=sh); spec(k, c, "Atlas", "type.title.md"); spec(k, c, "12 open tasks", "type.body.sm", "color/fg/muted")
            k.text(col, lab, "caption", "color/fg/muted", weight=400)
    two_modes(k, s, draw)
    grid_table(k, b, [("Interaction", 260), ("What changes", None), ("Never", 420)], [
        ["Hover on something clickable", "the fill (color/bg/surface-hover) or a border colour; the shadow may grow one level with it", "a shadow alone (ER-08)"],
        ["Press", "back to the resting shadow", "higher than at rest"],
        ["Keyboard focus", "the focus ring", "a shadow as the focus indicator"],
        ["Drag", ".ds-dragging while held; a live-region message; back on drop", "dragging as the only way to move it (WCAG 2.5.7)"],
        ["Open a menu or dialog", "the floating or modal level appears; with reduced motion it only fades", "a card that turns into a dialog in place"]])
    s = k.section(b, "Dragging, with a second way", "While it is held, the item takes the dragging level — its own surface, the dragging shadow and edge. The move buttons do the same with a click or the keyboard.")
    lst = k.frame(s, "Reorder", gap=8, w=520); setp(k, lst, clip=False)
    for i, it in enumerate(["Design review", "Accessibility audit", "Release notes"]):
        row = level(k, lst, "dragging" if i == 1 else "raised", it, direction="horizontal", pad="space.inset.sm", gap="space.inline.sm", align="center", with_edge=(i == 1))
        setp(k, row, sizingH="fill")
        if i != 1: line(k, row, "line", "color/border/default")
        spec(k, row, "⠿", "type.body.md", "color/fg/muted"); tt = spec(k, row, it, "type.body.md"); setp(k, tt, sizingH="fill")
        button(k, row, "↑", "secondary"); button(k, row, "↓", "secondary")
    k.tag(s, "elevation/dragging while held · live region: \"Moved to position 2 of 3\"")
    s = k.section(b, "The common slip", "Hover shown only by a bigger shadow, in Dark.")
    def avoid(a):
        bx = k.frame(a, "Dark", "horizontal", 24, 24, bind="elevation/page/surface"); rbind(k, bx, "container"); mode(k, bx, "Dark"); setp(k, bx, clip=False)
        for lab, sh in [("rest", "raised"), ("hover", "sticky")]:
            c = level(k, bx, "raised", lab, w=150, with_edge=False, shadow_of=sh); spec(k, c, "Atlas", "type.title.md"); spec(k, c, lab, "type.body.sm", "color/fg/muted")
    def do(d):
        bx = k.frame(d, "Dark", "horizontal", 24, 24, bind="elevation/page/surface"); rbind(k, bx, "container"); mode(k, bx, "Dark"); setp(k, bx, clip=False)
        for lab, sh, surf in [("rest", "raised", None), ("hover", "sticky", "color/bg/surface-hover")]:
            c = level(k, bx, "raised", lab, w=150, surface=surf, with_edge=False, shadow_of=sh); spec(k, c, "Atlas", "type.title.md"); spec(k, c, lab, "type.body.sm", "color/fg/muted")
    slip(k, s, D, 4, avoid, do)
    rules(k, b, [("Press goes down", "A pressed card moves toward the page (back to its resting shadow), never further up."),
                 ("Focus is a ring", "Keyboard focus is the focus ring (Border foundation) — never a shadow.")])
    finish(k, b, "Lifting and dragging")
    return b


# ------------------------------------------------------------ Choosing a level
def choosing(k, D):
    b = start(k, "Choosing a level", "Four questions: does it need height at all? which level? what has to be on top? and does it change while someone uses it?")
    for dcs in D["decisions"]:
        s = k.section(b, dcs["what"], dcs["question"])
        grid_table(k, s, [("When", None), ("Use", 640)], [[sl(a), sl(u)] for a, u in dcs["answers"]])
    s = k.section(b, "Worked example: a project page", "One part at a time. Each part is bound to its level; the role tags name it.")
    r = k.row(s, 32, align="min")
    win = stage(k, r, 720, 440, "Project page")
    h = header(k, win, 720); place(k, h, 0, 0)
    for i, (tt, sub) in enumerate([("Atlas", "12 open tasks"), ("Beacon", "4 open tasks"), ("Compass", "No open tasks")]):
        c = proj_card(k, win, tt, sub, 200); place(k, c, 32 + i * 224, 96)
    m = menu(k, win, ("Rename", "Duplicate", "Delete…"), 170); place(k, m, 90, 170)
    dr = level(k, win, "dragging", "Dragged card", w=200, surface="elevation/raised/surface"); place(k, dr, 300, 280); spec(k, dr, "Beacon", "type.title.md"); spec(k, dr, "being moved", "type.body.sm", "color/fg/muted")
    t = level(k, win, "floating", "Toast", w=220, pad="space.inset.md"); place(k, t, 476, 372); spec(k, t, "Atlas deleted.", "type.body.md")
    col = k.frame(r, "Parts", gap=10, sizingH="fill")
    for part, lv, why in [("The page", "elevation/page", "The ground everything sits on."), ("The page header", "elevation/sticky · .ds-sticky", "Stays while the list scrolls under it; a line on its bottom edge."),
                          ("Project cards", "elevation/raised · .ds-raised", "Group each project in the flow of the page."), ("The card's menu", "elevation/floating · a popover", "Opens over the cards without blocking the page; never clipped by the card."),
                          ("\"Delete project?\"", "elevation/modal · showModal()", "Must be answered: scrim, focus held, Escape closes (Dialogs and the scrim)."), ("\"Atlas deleted.\" toast", "elevation/floating · layer/toast", "Shows above anything; needs no action."),
                          ("Reordering cards", "elevation/dragging while held", "Back to raised on drop; move buttons for the keyboard.")]:
        rr = k.frame(col, part, gap=2, sizingH="fill"); k.text(rr, part, "body", weight=600); k.tag(rr, lv); k.text(rr, why, "small", "color/fg/muted", fill=True)
    s = k.section(b, "Do and avoid", "Measured in this build.")
    grid_table(k, s, [("Avoid", 360), ("Measured", None), ("Do", 420)], [[sl(m["mistake"]), sl(m["measured"]), sl(f"{m['fix']} — {m['fixValue']}")] for m in D["mistakes"]])
    finish(k, b, "Choosing a level")
    return b


# ------------------------------------------------------------ Readers' settings and products
def settings(k, D):
    b = start(k, "Readers' settings and products", "People switch to dark mode or forced colours, zoom and enlarge text; products add places of their own to the stacking order. Levels are built so none of that breaks.")
    s = k.section(b, "Forced colours", D["forcedColors"]["what"] + " The picture on the right is a preview in fixed colours; the elevation audit renders every page in Chromium's real forced colours.")
    r = k.row(s, 24, align="min")
    col = k.frame(r, "Normal", gap=10, sizingH="fill"); k.text(col, "NORMAL", "caption", "color/fg/subtle", weight=700)
    win = stage(k, col, 560, 300, "Normal")
    h = header(k, win, 560); place(k, h, 0, 0)
    c = proj_card(k, win, "Atlas", "12 open tasks", 240); place(k, c, 32, 96)
    m = menu(k, win, ("Rename", "Delete"), 170); place(k, m, 180, 160)
    col = k.frame(r, "Forced", gap=10, sizingH="fill"); k.text(col, "FORCED COLOURS (PREVIEW)", "caption", "color/fg/subtle", weight=700)
    win = k.f.tool("create_node", type="frame", parent=col, name="Forced colours (preview)", width=560, height=300, props={"layout": None, "fills": [FC["canvas"]], "clip": True, "strokes": [FC["text"]], "strokeWeight": 1, "cornerRadius": 8})["id"]
    hh = fc_frame(k, win, "Header", w=560, sides="b", pad=16); fc_text(k, hh, "Projects", weight=600); place(k, hh, 0, 0)
    cc = fc_frame(k, win, "Card (no edge: it lies in the flow)", w=240, stroke=False, pad=16, gap=4); fc_text(k, cc, "Atlas", weight=600); fc_text(k, cc, "12 open tasks"); place(k, cc, 32, 96)
    mm = fc_level(k, win, "Menu", 170); fc_text(k, mm, "Rename"); fc_text(k, mm, "Delete"); place(k, mm, 180, 160)
    c = k.card(s, 8, 24)
    k.text(c, "tokens.css already", "h3")
    for x in D["forcedColors"]["tokensCss"]: k.text(c, "· " + x[0].upper() + x[1:], "body", "color/fg/muted", fill=True)
    k.text(c, "You", "h3")
    for x in D["forcedColors"]["you"]: k.text(c, "· " + x[0].upper() + x[1:], "body", "color/fg/muted", fill=True)
    r = k.row(b, 24, align="min")
    note(k, r, "Dark mode", "Height comes from lighter surfaces and the edge (Height in Dark).")
    note(k, r, "Zoom and bigger text", "Shadows and edges are px and scale with zoom like everything else. A sticky bar that grows with bigger text eats the screen: in short windows the shell header stops sticking (Layout foundation), and a dialog scrolls inside itself.")
    note(k, r, "Reduced motion", "Opening and closing a menu or dialog uses the Motion foundation's overlay timing; with reduced motion it only fades.")
    s = k.section(b, "Adding a layer", f"Most things fit one of the {len([l for l in D['layers'] if not l['product']])}. Name a new place by what sits there and say which layer it sits just above; the build computes its number, keeps the order, and refuses numbers, names by position (\"top\", \"z-50\") and two layers claiming the same spot.")
    c = k.card(s, 4, 24, bind="color/bg/surface-sunken")
    for ln in ['{ "elevation": { "layers": [', '  { "name": "layer.banner", "above": "sticky",', '    "description": "A site-wide banner that stays above sticky bars" }', '] } }']:
        k.text(c, ln, "mono")
    k.text(s, "Levels, surfaces, shadows and edges are not config choices: they are computed, so every product gets the same checked order.", "small", "color/fg/muted", fill=True)
    s = k.section(b, "What the build checks", "Every elevation check, and the result for this build.")
    grid_table(k, s, [("Check", 90), ("What it checks", None), ("WCAG", 120), ("Result", 160)], [[c_["id"], c_["title"], f"{c_['wcag']} ({c_['level']})", f"{c_['status']} · {c_['summary']}"] for c_ in D["checks"]])
    finish(k, b, "Readers' settings and products")
    return b


CHAPTER_FNS = [principles, tokens, levels, shadows, dark, edges, stacking, dialogs, lifting, choosing, settings]

"""Border foundation as one systematic story: 10 chapters, each = explain → live examples → tokens → rules.
Every example's stroke weight is bound to a Border variable (per side where a line sits on one side) and its stroke colour
to the job's colour role; corners are Shape roles and padding Density variables, as in the other files. Focus rings are
their own layer (a frame offset by the ring offset, stroke outside). The forced-colours pictures are drawn in fixed
system-like colours, labelled as a preview. Every border token is documented on exactly one chapter (checked at build
time). All copy is original (clean-room)."""
import re
from story_space import grid_table, spec, bind, bind_pad, dmode, fig

GROUP = {"Five principles": "Idea", "How tokens are built": "Structure", "Widths by job": "Jobs", "Lines and colour": "Jobs",
         "State borders": "States", "Focus rings": "States", "Joined parts": "Combining", "Forced colours": "Combining",
         "Choosing a boundary": "Using", "Readers' settings and products": "Using"}
TEASER = {"How tokens are built": "the scale and the Border collection", "Widths by job": "four jobs, four widths",
          "Lines and colour": "the colours each job may use, measured", "State borders": "wider, with a second cue, nothing moves",
          "Focus rings": "an outline that stands off the element", "Joined parts": "one line at every seam",
          "Forced colours": "what survives a contrast theme", "Choosing a boundary": "a decision guide and a worked example",
          "Readers' settings and products": "text size, zoom, density, heavier controls, your own jobs"}
SIDES = {"t": "strokeTopWeight", "r": "strokeRightWeight", "b": "strokeBottomWeight", "l": "strokeLeftWeight"}
SIDE_IDX = {"t": 0, "r": 1, "b": 2, "l": 3}
documented = []
CH = []
BOARD_W = 1440
# Forced-colours preview palette (a light contrast theme): page, text, highlight, selected item.
FC = {"canvas": "#FFFFFF", "text": "#000000", "highlight": "#1A47C8", "selected": "#1A47C8", "gray": "#6D6D6D"}


# ------------------------------------------------------------ helpers
def T(D, name):
    return next(t for t in D["tokens"] if t["name"] == name)


def J(D, job):
    return next(j for j in D["jobs"] if j["job"] == job)


def slashed(text):
    return re.sub(r"\b(border|color|focus|space|elevation)\.[a-z0-9<>*-]+(\.[a-z0-9<>*-]+)*", lambda m: m.group(0).replace(".", "/") if not re.match(r"border\.(control|roles)$", m.group(0)) else m.group(0), text)


def setp(k, nid, **props):
    k.f.tool("set_properties", ids=[nid], props=props)


def rbind(k, nid, role, corners=None):
    if corners is None: k.f.cmd("variable.bind", ids=[nid], field="cornerRadius", variable=f"shape/{role}")
    else:
        for c, fld in [("tl", "topLeftRadius"), ("tr", "topRightRadius"), ("br", "bottomRightRadius"), ("bl", "bottomLeftRadius")]:
            if c in corners: k.f.cmd("variable.bind", ids=[nid], field=fld, variable=f"shape/{role}")
            else: setp(k, nid, **{fld: 0})


def line(k, nid, job, color, sides=None, dashed=False, align="inside"):
    """A stroke whose weight is border/width/<job> (on the given sides only) and whose colour is a colour role."""
    setp(k, nid, strokes=["#000000"], strokeAlign=align, strokeWeight=1)
    k.f.cmd("variable.bind", ids=[nid], field="stroke", variable=color)
    if sides is None:
        k.f.cmd("variable.bind", ids=[nid], field="strokeWeight", variable=f"border/width/{job}")
    else:
        setp(k, nid, strokeSides=[1 if s in sides else 0 for s in "trbl"])
        for s in sides: k.f.cmd("variable.bind", ids=[nid], field=SIDES[s], variable=f"border/width/{job}")
    if dashed: setp(k, nid, dashes=[6, 4])
    return nid


def start(k, title, lead):
    k.page(title)
    b = k.frame(name=title, w=BOARD_W, pad=80, gap=72, bind="color/bg/canvas")
    k.f.cmd("variable.setMode", ids=[b], collection="Color", mode="Light")
    k.f.cmd("variable.setMode", ids=[b], collection="Responsive", mode="lg")
    dmode(k, b, "default")
    k.inst("page", b, {"Eyebrow": f"Border · {GROUP[title]}", "Title": title, "Lead": lead}, fill=True)
    return b


def finish(k, b, title):
    i = CH.index(title)
    if i + 1 >= len(CH):
        c = k.card(b, 8, 24, bind="color/bg/brand-subtle")
        k.text(c, "End of the border foundation", "h3")
        k.text(c, "You've seen when a boundary needs a line, the four jobs and their colours, how states and focus rings show, how parts share a line, and what survives forced colours — and how each is checked. Next in the system: Elevation.", "body", "color/fg/muted", fill=True)
        return
    t = CH[i + 1]
    c = k.frame(b, "Next", "horizontal", 16, 24, sizingH="fill", bind="color/bg/surface", align="center")
    line(k, c, "line", "color/border/subtle"); rbind(k, c, "container")
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


def field(k, parent, label, value, state=None, w=320, msg=None):
    """A labelled text field. state: None | 'invalid' (state width, danger colour, compensated padding, icon + message)."""
    col = k.frame(parent, f"Field · {label}", gap=0, w=w); bind(k, col, "gap", "space.stack.xs")
    spec(k, col, label, "type.label.md")
    i = k.frame(col, "Input", "horizontal", 0, 0, sizingH="fill", bind="color/bg/surface", align="center")
    rbind(k, i, "control"); bind(k, i, "minHeight", "size.control.height"); bind_pad(k, i, "space.inset.xs", "tb")
    if state == "invalid":
        line(k, i, "state", "color/border/danger")
        setp(k, i, paddingLeft=11, paddingRight=11)  # inset.md − (state − control), computed: no expressions in Figma
    else:
        line(k, i, "control", "color/border/input"); bind_pad(k, i, "space.inset.md", "lr")
    spec(k, i, value, "type.body.md", "color/fg/default")
    if msg:
        m = k.frame(col, "Message", "horizontal", 0, 0, sizingH="fill"); bind(k, m, "gap", "space.inline.xs")
        spec(k, m, "⚠", "type.body.sm", "color/fg/danger"); t = spec(k, m, msg, "type.body.sm", "color/fg/danger"); setp(k, t, sizingH="fill")
    return col


def button(k, parent, label, kind="primary", job="control", sides=None, corners=None, pressed=False):
    bg, fg, brd = {"primary": ("color/action/primary/bg", "color/action/primary/fg", None),
                   "secondary": ("color/action/secondary/bg", "color/action/secondary/fg", "color/action/secondary/border")}[kind]
    if pressed: bg, fg = "color/bg/selected", "color/fg/default"
    b = k.frame(parent, f"Button · {label}", "horizontal", 0, 0, bind=bg, align="center", main="center")
    rbind(k, b, "control", corners)
    bind(k, b, "minHeight", "size.control.height"); bind_pad(k, b, "space.inset.md", "lr"); bind_pad(k, b, "space.inset.xs", "tb")
    if brd: line(k, b, job, brd, sides)
    else:  # a filled button keeps a transparent control border, so forced colours can draw its edge
        line(k, b, job, "color/border/input", sides); setp(k, b, strokes=[{"type": "solid", "color": "#000000", "opacity": 0}])
    t = spec(k, b, label, "type.title.sm" if pressed else "type.label.md", fg)
    return b


def card(k, parent, w=300, name="Card", job="line", color="color/border/default", fill="color/bg/surface", pad="space.inset.lg"):
    c = k.frame(parent, name, gap=0, w=w, bind=fill)
    rbind(k, c, "container"); line(k, c, job, color); bind_pad(k, c, pad); bind(k, c, "gap", "space.stack.sm")
    return c


def rows_card(k, parent, w=320, items=(("Comments", "Email"), ("Mentions", "Email, push"), ("Weekly digest", "Off"))):
    c = card(k, parent, w, "Notifications card")
    spec(k, c, "Notifications", "type.title.md")
    for i, (a, b_) in enumerate(items):
        r = k.frame(c, a, "horizontal", 0, 0, sizingH="fill", align="center"); bind_pad(k, r, "space.inset.sm", "tb"); bind(k, r, "gap", "space.inline.md")
        if i: line(k, r, "line", "color/border/subtle", "t")
        t = spec(k, r, a, "type.body.md"); setp(k, t, sizingH="fill"); spec(k, r, b_, "type.body.md", "color/fg/muted")
    return c


def plan(k, parent, name, sub, selected=False, w=200):
    c = k.frame(parent, f"Plan · {name}", gap=0, w=w, bind="color/bg/selected" if selected else "color/bg/surface")
    rbind(k, c, "container"); bind(k, c, "gap", "space.stack.xs")
    if selected:
        line(k, c, "state", "color/border/selected"); setp(k, c, paddingTop=15, paddingBottom=15, paddingLeft=15, paddingRight=15)  # inset.lg − (state − line)
    else:
        line(k, c, "line", "color/border/strong"); bind_pad(k, c, "space.inset.lg")
    spec(k, c, name, "type.title.md"); spec(k, c, sub, "type.body.sm", "color/fg/muted")
    spec(k, c, "✓ Selected" if selected else " ", "type.body.sm", "color/fg/brand")
    return c


def tabs(k, parent, labels=("Overview", "Usage", "Billing"), current=0):
    bar = k.frame(parent, "Tabs", "horizontal", 0, 0, align="max"); line(k, bar, "line", "color/border/subtle", "b"); bind(k, bar, "gap", "space.inline.xs")
    for i, lab in enumerate(labels):
        t = k.frame(bar, f"Tab · {lab}", "horizontal", 0, 0, align="center"); bind(k, t, "minHeight", "size.control.height"); bind_pad(k, t, "space.inset.md", "lr"); bind_pad(k, t, "space.inset.xs", "tb")
        if i == current:
            line(k, t, "indicator", "color/border/selected", "b"); setp(k, t, paddingBottom=1)  # inset.xs − indicator (the bar sits over the tab's own space)
        spec(k, t, lab, "type.title.sm" if i == current else "type.body.md", "color/fg/default" if i == current else "color/fg/muted")
    return bar


def nav(k, parent, items=("Profile", "Team", "Security"), current=0, w=220):
    n = k.frame(parent, "Navigation", gap=0, w=w, bind="color/bg/surface"); rbind(k, n, "container"); line(k, n, "line", "color/border/default"); bind_pad(k, n, "space.inset.xs")
    for i, lab in enumerate(items):
        a = k.frame(n, lab, "horizontal", 0, 0, sizingH="fill", bind="color/bg/selected" if i == current else None, align="center"); bind_pad(k, a, "space.inset.xs", "tb")
        setp(k, a, cornerRadius=0 if i == current else 4)  # container − inset.xs, computed; the current item is square so its bar is a straight edge
        if i == current:
            line(k, a, "indicator", "color/border/selected", "l"); setp(k, a, paddingLeft=9, paddingRight=12)  # inset.md − indicator
        else: bind_pad(k, a, "space.inset.md", "lr")
        spec(k, a, lab, "type.title.sm" if i == current else "type.body.md")
    return n


def ring(k, parent, role="control", offset=2, color="color/border/focus", name="Focus ring"):
    """A focus ring drawn as its own layer: a frame `offset` out with its stroke outside, the ring width bound."""
    r = k.frame(parent, name, "horizontal", 0, offset, align="center", main="center")
    setp(k, parent, clip=False); setp(k, r, clip=False, strokes=["#000000"], strokeWeight=2, strokeAlign="outside")
    if color.startswith("#"): setp(k, r, strokes=[color])
    else: k.f.cmd("variable.bind", ids=[r], field="stroke", variable=color)
    k.f.cmd("variable.bind", ids=[r], field="strokeWeight", variable="focus/ring/width")
    for fld in ["paddingTop", "paddingBottom", "paddingLeft", "paddingRight"]: k.f.cmd("variable.bind", ids=[r], field=fld, variable="focus/ring/offset")
    k.f.cmd("variable.bind", ids=[r], field="cornerRadius", variable=f"shape/{role}-focus")
    return r


def fc_frame(k, parent, name, w=None, stroke=True, weight=1, radius=0, sides=None, fill=None, pad=0, gap=0, direction="vertical", align=None):
    """A frame in the forced-colours preview palette (fixed colours: this is a picture of what the browser does)."""
    nid = k.frame(parent, name, direction, gap, pad, w=w, fill=fill or FC["canvas"], radius=radius, align=align)
    if stroke:
        setp(k, nid, strokes=[stroke if isinstance(stroke, str) else FC["text"]], strokeWeight=weight, strokeAlign="inside")
        if sides: setp(k, nid, strokeSides=[1 if s in sides else 0 for s in "trbl"])
    return nid


def fc_text(k, parent, s, color=None, style="small", weight=None):
    return k.text(parent, s, style, color or FC["text"], weight=weight)


# ------------------------------------------------------------ Five principles
def principles(k, D):
    b = start(k, "Five principles", "Five principles shape every line in this system. Each one is checked by the build or the border audit — the demo beside it shows what it means.")
    s = k.section(b, "The principles", "Read them once; every chapter after this one applies them.")
    W = {j["job"]: j["px"] for j in D["jobs"]}
    items = [
        ("A line needs a reason", "Space groups things and a change of surface sets a region apart; a line is for when neither is enough, or when someone needs it to find a control.", "reason"),
        ("Width says the job", f"Four jobs, four widths: structure {W['line']}px, a control's edge {W['control']}px, a state {W['state']}px, the current item {W['indicator']}px.", "jobs"),
        ("The lines people need are seen", "Control edges, states and the current-item bar reach 3:1 against every background, in Light and Dark. Lines that only separate may be quiet.", "contrast"),
        ("A state changes shape, not just colour", "Selected, invalid and current borders get wider and come with a second cue — and the padding gives up the extra width, so nothing moves.", "state"),
        ("Every cue survives forced colours", "Boundaries and focus rings are borders and outlines, never box-shadow or a fill alone.", "forced"),
    ]
    for t, body, demo in items:
        c = k.frame(s, t, "horizontal", 32, 28, sizingH="fill", bind="color/bg/surface", align="center")
        rbind(k, c, "container"); line(k, c, "line", "color/border/subtle")
        col = k.frame(c, "Text", gap=6, sizingH="fill")
        k.text(col, t, "h2", fill=True); k.text(col, body, "body", "color/fg/muted", fill=True)
        d = k.frame(c, "Demo", "horizontal", 20, 20, w=620, bind="color/bg/surface-sunken", align="center", main="center")
        rbind(k, d, "container")
        if demo == "reason":
            for kind, lines_ in [("avoid", True), ("do", False)]:
                m = k.frame(d, kind, gap=6, align="center"); k.inst(kind, m)
                g = k.frame(m, "Group", gap=8, pad=10, w=200, bind="color/bg/surface"); rbind(k, g, "container")
                for i, lab in enumerate(["Name", "Email", "Role"]):
                    rr = k.frame(g, lab, "horizontal", 0, 6, sizingH="fill")
                    if lines_: line(k, rr, "line", "color/border/default")
                    k.text(rr, lab, "small")
                k.text(m, "a box round every row" if lines_ else "space does it", "caption", "color/fg/muted", weight=400)
        elif demo == "jobs":
            for job, color in [("line", "color/border/default"), ("control", "color/border/input"), ("state", "color/border/selected"), ("indicator", "color/border/selected")]:
                m = k.frame(d, job, gap=6, align="center")
                sw = k.frame(m, job, w=88, h=48, sizingV=None, bind="color/bg/surface"); rbind(k, sw, "none" if job == "indicator" else "control")
                line(k, sw, job, color, "b" if job == "indicator" else None)
                k.text(m, f"{job} · {W[job]}px", "caption", "color/fg/muted", weight=400)
        elif demo == "contrast":
            q = D["quoted"]
            for col_, lab, kind in [("color/border/default", f"decorative grey on a field · {q['cardGreyOnField']['Light']:.2f}:1", "avoid"), ("color/border/input", f"border/input · {q['inputOnField']['Light']:.2f}:1", "do")]:
                m = k.frame(d, lab, gap=6, align="center"); k.inst(kind, m)
                i = k.frame(m, "Field", "horizontal", 0, 10, w=200, bind="color/bg/surface"); rbind(k, i, "control"); line(k, i, "control", col_)
                k.text(i, "Team name", "small", "color/fg/muted")
                k.text(m, lab, "caption", "color/fg/muted", weight=400)
        elif demo == "state":
            plan(k, d, "Team", "10 people", False, 170); plan(k, d, "Business", "100 people", True, 170)
        else:
            for mode in ["normal", "forced"]:
                m = k.frame(d, mode, gap=6, align="center")
                if mode == "normal":
                    button(k, m, "Save"); k.text(m, "a filled button with a transparent border", "caption", "color/fg/muted", weight=400)
                else:
                    bb = fc_frame(k, m, "Save (forced)", radius=4, direction="horizontal", align="center"); k.pad(bb, 12, 12, 8, 8); fc_text(k, bb, "Save", weight=600)
                    k.text(m, "forced colours draw its edge", "caption", "color/fg/muted", weight=400)
    s = k.section(b, "How this foundation is organised", "The chapters follow the order you'd draw a product's lines in: the idea, the structure, the jobs and their colours, states and focus, how parts combine and what survives forced colours, then how to use it all.")
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
    b = start(k, "How tokens are built", "Border tokens live in two collections: the scale, and the jobs that pick from it. The jobs are scoped to stroke weight, so the stroke-weight field is the only place they are offered.")
    s = k.section(b, "Two collections", "Each holds one kind of value.")
    grid_table(k, s, [("Collection", 200), ("Modes", 300), ("Border tokens in it", None), ("Changes with", 260)], [
        ["Primitives", "one · hidden from publishing", "The scale: " + ", ".join(fig(x["token"]) for x in D["scale"]), "nothing — raw values"],
        ["Border", "one", "The four jobs and the focus ring (width, offset, colour)", f"the product's control width (border.control, now {D['control']}px)"]])
    s = k.section(b, "The scale", "Three whole pixels. Nothing below a pixel — a hairline looks different in every browser — and nothing above 3px. Each swatch's bottom line is bound to its primitive.")
    def cell(c, i, v, w):
        if i == 0:
            sw = k.frame(c, v, w=72, h=32, sizingV=None, bind="color/bg/surface")
            setp(k, sw, strokes=["#000000"], strokeAlign="inside", strokeSides=[0, 0, 1, 0], strokeWeight=1)
            k.f.cmd("variable.bind", ids=[sw], field="stroke", variable="color/border/strong")
            k.f.cmd("variable.bind", ids=[sw], field="strokeBottomWeight", variable=v)
            return True
        return False
    rows = []
    for x in D["scale"]:
        n = x["token"]; documented.append(n)
        users = [fig(j["name"]) for j in D["jobs"] if j["px"] == x["px"]] + (["focus/ring/width"] if D["focus"]["width"] == x["px"] else [])
        rows.append([fig(n), fig(n), f"{x['px']}px", " · ".join(users) or "free for product jobs"])
    grid_table(k, s, [("Swatch", 100), ("Primitive", 220), ("Value", 120), ("Used by", None)], rows, cell)
    s = k.section(b, "Reading a name", "Jobs are named by what the line is for, never by how heavy it looks: \"strong\" stops being true the day controls get heavier; \"control\" doesn't.")
    r = k.row(s, 12, align="center", fill=False)
    for part, what in [("border", "category"), ("/", ""), ("width", "property"), ("/", ""), ("control", "job")]:
        if not what: k.text(r, part, "h2", "color/fg/subtle"); continue
        m = k.frame(r, part, gap=4, align="center"); k.chip(m, part, bind="color/bg/brand-subtle"); k.text(m, what, "caption", "color/fg/muted", weight=400)
    t = T(D, "border.width.control")
    grid_table(k, s, [("Figma variable", 300), ("CSS variable", 360), ("Tailwind", None)], [[t["figma"], t["cssVar"], ", ".join(t["tailwind"]) + " (and border-b-control, border-s-control …)"]])
    rules(k, b, [("Primitives are never used directly", "In Figma they are hidden from the stroke-weight picker; in code the checker flags --ds-border-width-1 … -3."),
                 ("Width and colour are two bindings", "A line binds its stroke weight to a job and its stroke colour to one of that job's colours — the next chapters give both.")])
    finish(k, b, "How tokens are built")
    return b


# ------------------------------------------------------------ Widths by job
def jobs(k, D):
    b = start(k, "Widths by job", "Four jobs. Pick by what the line does; the width comes with the job. Each example's stroke weight is bound to its job, so a product with heavier controls changes them all at once.")
    s = k.section(b, "The jobs", f"Values in px for this product (control boundaries {D['control']}px).")
    tbl = k.card(s, 0, 0); rbind(k, tbl, "container")
    head = k.frame(tbl, "Head", "horizontal", 16, 12, sizingH="fill", bind="color/bg/surface-sunken"); k.pad(head, 24, 24)
    rbind(k, head, "container", ["tl", "tr"])
    for t_, w in [("Job", 240), ("Width", 90), ("Swatch", 120), ("Use it for", None)]:
        c = k.frame(head, t_, w=w, sizingH=None if w else "fill"); k.text(c, t_, "caption", "color/fg/muted", weight=700)
    for j in [x for x in D["jobs"] if not x["product"]]:
        documented.append(j["name"])
        row = k.frame(tbl, j["name"], "horizontal", 16, 14, sizingH="fill", align="center"); k.pad(row, 24, 24)
        line(k, row, "line", "color/border/subtle", "t")
        c = k.frame(row, "Token", gap=4, w=240); k.text(c, fig(j["name"]), "mono")
        c = k.frame(row, "Width", gap=4, w=90); k.text(c, f"{j['px']}px", "small")
        c = k.frame(row, "Swatch", "horizontal", 0, 0, w=120, align="center")
        sw = k.frame(c, "swatch", w=88, h=40, sizingV=None, bind="color/bg/surface"); rbind(k, sw, "none" if j["job"] == "indicator" else "control")
        line(k, sw, j["job"], j["colors"][0]["name"].replace(".", "/"), "b" if j["job"] == "indicator" else None)
        c = k.frame(row, "Use", gap=4, sizingH="fill"); k.text(c, j["use"], "small", fill=True)
    s = k.section(b, "Every job on the thing it draws", "In this product. The role tag names the job.")
    r = k.row(s, 32, align="min", wrap=True)
    m = k.frame(r, "line", gap=8); rows_card(k, m, 300); k.tag(m, "border/width/line")
    m = k.frame(r, "control", gap=8); field(k, m, "Team name", "Atlas", w=260); a = k.row(m, 8, fill=False); button(k, a, "Save"); button(k, a, "Cancel", "secondary"); k.tag(m, "border/width/control")
    m = k.frame(r, "state", gap=8); field(k, m, "Work email", "ali@", "invalid", 260, "Enter the whole address"); k.tag(m, "border/width/state")
    m = k.frame(r, "indicator", gap=8); tabs(k, m); nav(k, m); k.tag(m, "border/width/indicator")
    rules(k, b, [("One job per line", "A card outline is line even when the card is selected: selection makes it state; it doesn't make the card a control."),
                 ("Hover and press don't change width", "They change the fill. A border that thickens under the pointer moves things and looks selected."),
                 ("Width never changes with density", "Density changes the space around lines, not the lines.")])
    finish(k, b, "Widths by job")
    return b


# ------------------------------------------------------------ Lines and colour
def colour(k, D):
    b = start(k, "Lines and colour", "A width is half a line; its colour is the other half. Each job names the colours that may draw it, and the build measures every pair. Ask: would someone miss something if this line disappeared?")
    s = k.section(b, "Each job's colours", "On bg/surface, Light · Dark; \"lowest\" is the worst background the colour is checked on (C3).")
    rows = []
    for j in D["jobs"]:
        for c in j["colors"]:
            rows.append([fig(j["name"]), fig(c["name"]), f"{c['onSurface']['Light']:.2f} · {c['onSurface']['Dark']:.2f}", f"{c['lowest']['Light']['ratio']:.2f} · {c['lowest']['Dark']['ratio']:.2f}" if c["lowest"]["Light"] else "—", "3:1" if j["identifies"] else "decorative", c])
    def cell(cc, i, v, w):
        if i == 5:
            for mode in ["Light", "Dark"]:
                box = k.frame(cc, mode, "horizontal", 0, 6, w=56, h=32, sizingV=None, bind="color/bg/surface")
                k.f.cmd("variable.setMode", ids=[box], collection="Color", mode=mode)
                line(k, box, "state", v["name"].replace(".", "/"))
            setp(k, cc, layout="horizontal", gap=8)
            return True
        return False
    grid_table(k, s, [("Job", 220), ("Colour role", 280), ("On bg/surface", 150), ("Lowest", 150), ("Needs", 120), ("Light · Dark", None)], rows, cell)
    s = k.section(b, "Decorative or needed", "Lines that only separate or outline may stay quiet: the content identifies itself. A field's edge is how people find the field.")
    r = k.row(s, 40, align="min")
    q = D["quoted"]
    for kind, col_, lab in [("avoid", "color/border/default", f"card-outline grey on a field: {q['cardGreyOnField']['Light']:.2f}:1"), ("do", "color/border/input", f"border/input: {q['inputOnField']['Light']:.2f}:1 · {q['inputOnField']['Dark']:.2f}:1")]:
        m = k.frame(r, kind, gap=10); k.inst(kind, m)
        i = k.frame(m, "Field", "horizontal", 0, 0, w=280, bind="color/bg/surface", align="center"); rbind(k, i, "control"); line(k, i, "control", col_)
        bind(k, i, "minHeight", "size.control.height"); bind_pad(k, i, "space.inset.md", "lr")
        spec(k, i, "Search members", "type.body.md", "color/fg/muted")
        k.text(m, lab, "caption", "color/fg/muted", weight=400)
    s = k.section(b, "Overlays", "Menus, popovers and dialogs keep a line outline, elevation/floating/border (Elevation foundation), even with a shadow: forced colours remove shadows, and dark mode barely shows them.")
    r = k.row(s, 32, align="min")
    for mode in ["Light", "Dark"]:
        w_ = k.frame(r, mode, "horizontal", 0, 24, w=360, bind="color/bg/canvas"); k.f.cmd("variable.setMode", ids=[w_], collection="Color", mode=mode); rbind(k, w_, "container")
        mn = k.frame(w_, "Menu", gap=0, w=220, bind="color/bg/surface-overlay", shadow=(3, (0, 6, 16))); rbind(k, mn, "container"); line(k, mn, "line", "color/border/floating"); bind_pad(k, mn, "space.inset.xs")
        for lab in ["Rename", "Duplicate", "Delete"]:
            it = k.frame(mn, lab, "horizontal", 0, 0, sizingH="fill"); bind_pad(k, it, "space.inset.sm", "tb"); bind_pad(k, it, "space.inset.md", "lr"); spec(k, it, lab, "type.body.md")
    k.tag(s, "elevation/floating/border = color/border/floating · border/width/line")
    rules(k, b, [("Colour and width travel together", "Pick the job, then one of its colours. border/subtle on a field's edge, or a 2px line in a card grey, is a mismatch the checker flags."),
                 ("No custom greys", "A grey picked by eye is unchecked: it may pass on white and fail on a hovered row.")])
    finish(k, b, "Lines and colour")
    return b


# ------------------------------------------------------------ State borders
def states(k, D):
    b = start(k, "State borders", "A state border shows that something changed. It widens to its job, comes with a second cue, and the padding gives up the extra width so nothing moves.")
    s = k.section(b, "More than colour", next(m for m in D["mistakes"] if m["mistake"].startswith("An error shown only"))["measured"].capitalize() + ".")
    r = k.row(s, 40, align="min")
    m = k.frame(r, "avoid", gap=10); k.inst("avoid", m)
    col = k.frame(m, "Field · colour only", gap=6, w=300); spec(k, col, "Work email", "type.label.md")
    i = k.frame(col, "Input", "horizontal", 0, 0, sizingH="fill", bind="color/bg/surface", align="center"); rbind(k, i, "control"); line(k, i, "control", "color/border/danger"); bind(k, i, "minHeight", "size.control.height"); bind_pad(k, i, "space.inset.md", "lr")
    spec(k, i, "ali@", "type.body.md")
    k.text(m, "same width, only the hue changes", "caption", "color/fg/muted", weight=400)
    m = k.frame(r, "do", gap=10); k.inst("do", m)
    field(k, m, "Work email", "ali@", "invalid", 300, "Enter the whole address, like name@company.com")
    k.text(m, "state width, an icon and a message", "caption", "color/fg/muted", weight=400)
    s = k.section(b, "The content stays still", "The padding gives up what the border takes, written on the tokens so it follows density. Figma has no expressions: the examples use the computed values below.")
    grid_table(k, s, [("Case", 380), ("Padding", None)] + [(d, 130) for d in D["densities"]], [[x["case"], x["css"]] + [f"{x['left'][d]}px" for d in D["densities"]] for x in D["compensation"]["table"]])
    s = k.section(b, "A selected choice", "Business is selected: state width, the selected colour, a check mark — and its text sits exactly where the others' does.")
    r = k.row(s, 16, align="min", fill=False)
    plan(k, r, "Team", "Up to 10 people"); plan(k, r, "Business", "Up to 100 people", True); plan(k, r, "Enterprise", "Unlimited")
    s = k.section(b, "The current item", "The bar is drawn only on the current item — along a tab's bottom edge, on the start edge of a navigation link with its padding reduced by the bar's width. A transparent bar on every item would be drawn on every item in forced colours.")
    r = k.row(s, 48, align="min", fill=False)
    tabs(k, r); nav(k, r)
    rules(k, b, [("Say it in the markup", "aria-selected, aria-current, aria-pressed, aria-checked and aria-invalid tell assistive technology what the border shows — and tokens.css uses them in forced colours."),
                 ("Disabled keeps its outline", "action/disabled/border at the control width: exempt from contrast, but still there to be found."),
                 ("Validation is a state", "Success, warning and danger outlines are state width with an icon and words.")])
    finish(k, b, "State borders")
    return b


# ------------------------------------------------------------ Focus rings
def focus(k, D):
    F = D["focus"]
    b = start(k, "Focus rings", f"The focus ring shows where the keyboard is. It is not a border: an outline {F['width']}px wide, {F['offset']}px outside the element — it never moves layout, never replaces the element's own border, and is measured against the page.")
    s = k.section(b, "The ring tokens", "Each ring below is its own layer: a frame offset by focus/ring/offset, its stroke outside, weight focus/ring/width, colour focus/ring/color.")
    rows = []
    for n, what in [("focus.ring.width", "The ring's thickness (2.4.13 asks for at least 2px)"), ("focus.ring.offset", "The gap between the element and the ring — the ring never looks like a state border"), ("focus.ring.color", f"Linked to color/border/focus: {F['onSurface']['Light']} · {F['onSurface']['Dark']} on bg/surface")]:
        t = T(D, n); documented.append(n)
        rows.append([fig(n), f"{t['px']}px" if "px" in t else f"{t['light']} / {t['dark']}", what])
    grid_table(k, s, [("Token", 260), ("Value", 180), ("What it does", None)], rows)
    s = k.section(b, "On the things people focus", "A field, a button, a tab, a choice card. The ring stands off each one by the offset.")
    r = k.row(s, 32, align="center", fill=False)
    rg = ring(k, r, "control"); button(k, rg, "Save")
    rg = ring(k, r, "control"); i = k.frame(rg, "Input", "horizontal", 0, 0, w=220, bind="color/bg/surface", align="center"); rbind(k, i, "control"); line(k, i, "control", "color/border/input"); bind(k, i, "minHeight", "size.control.height"); bind_pad(k, i, "space.inset.md", "lr"); spec(k, i, "Atlas", "type.body.md")
    rg = ring(k, r, "container"); plan(k, rg, "Business", "Up to 100 people", True)
    s = k.section(b, "Inside, when there's no room outside", "A full-width row has nothing around it: the outline gets a negative offset and is drawn inside. Still an outline, so it survives forced colours.")
    lst = k.frame(s, "List", gap=0, w=380, bind="color/bg/surface"); rbind(k, lst, "container"); line(k, lst, "line", "color/border/default")
    for i, lab in enumerate(["Two-step sign-in", "Sessions on other devices", "Recovery codes"]):
        it = k.frame(lst, lab, "horizontal", 0, 0, sizingH="fill"); bind_pad(k, it, "space.inset.sm", "tb"); bind_pad(k, it, "space.inset.md", "lr")
        if i: line(k, it, "line", "color/border/subtle", "t")
        if i == 1:
            setp(k, it, strokes=["#000000"], strokeAlign="inside", strokeSides=[1, 1, 1, 1]); k.f.cmd("variable.bind", ids=[it], field="stroke", variable="color/border/focus"); k.f.cmd("variable.bind", ids=[it], field="strokeWeight", variable="focus/ring/width")
        spec(k, it, lab, "type.body.md")
    k.tag(s, "inset ring: outline-offset = −focus/ring/width")
    s = k.section(b, "Never box-shadow alone", next(m for m in D["mistakes"] if m["mistake"].startswith("A focus ring drawn with box-shadow"))["measured"].capitalize() + ".")
    r = k.row(s, 40, align="min")
    for kind, ok in [("avoid", False), ("do", True)]:
        m = k.frame(r, kind, gap=10); k.inst(kind, m)
        pv = fc_frame(k, m, "Forced colours preview", w=260, stroke=False, pad=20, direction="horizontal", align="center")
        if ok: rg = ring(k, pv, "control", color=FC["highlight"]); bb = fc_frame(k, rg, "Save", radius=4, direction="horizontal", align="center")
        else: bb = fc_frame(k, pv, "Save", radius=4, direction="horizontal", align="center")
        k.pad(bb, 12, 12, 8, 8); fc_text(k, bb, "Save", weight=600)
        k.text(m, "outline: the ring survives (Highlight)" if ok else "box-shadow ring: removed", "caption", "color/fg/muted", weight=400)
    rules(k, b, [("Drawn for you", "tokens.css draws the ring on :focus-visible — keyboard focus, not mouse clicks. Never outline: none."),
                 (f"It reaches {F['reach']}px out", "Nothing may clip that band, and sticky bars leave that much room (tokens.css adds it to the scroll padding)."),
                 ("Restyle through the tokens", "A different ring is a change in the engine, where contrast is checked.")])
    finish(k, b, "Focus rings")
    return b


# ------------------------------------------------------------ Joined parts
def joined(k, D):
    W = {j["job"]: j["px"] for j in D["jobs"]}
    b = start(k, "Joined parts", "Parts that touch read as one thing. Two bordered parts side by side put two borders at the seam; .ds-join overlaps them by one control border, so each seam is one line.")
    s = k.section(b, "One line at every seam", f"Two parts with their own borders make a {2 * W['control']}px seam — the width of a selected state. Overlapped, the seam is {W['control']}px, like the outer edges.")
    r = k.row(s, 48, align="min")
    for kind, overlap in [("avoid", False), ("do", True)]:
        m = k.frame(r, kind, gap=10); k.inst(kind, m)
        g = k.frame(m, "Group", "horizontal", -W["control"] if overlap else 0, 0, align="center")
        if overlap: setp(k, g, reverseZ=True)  # the pressed part (first) is drawn on top, as .ds-join lifts it
        for i, lab in enumerate(["List", "Board", "Calendar"]):
            button(k, g, lab, "secondary", corners=(["tl", "bl"] if i == 0 else ["tr", "br"] if i == 2 else []), pressed=(i == 0))
        k.text(m, f"seams {W['control']}px (parts overlap)" if overlap else f"seams {2 * W['control']}px", "caption", "color/fg/muted", weight=400)
    s = k.section(b, "The part that changes comes forward", "The hovered, pressed, selected or invalid part is lifted so its whole border shows over the overlap; the focused part goes on top of that, so its ring is never covered.")
    r = k.row(s, 48, align="min")
    for kind, lifted in [("avoid", False), ("do", True)]:
        m = k.frame(r, kind, gap=10); k.inst(kind, m)
        g = k.frame(m, "Input + button", "horizontal", -W["control"], 0, w=380, align="center")
        if lifted: setp(k, g, reverseZ=True)  # the invalid input is drawn over the button
        i = k.frame(g, "Input", "horizontal", 0, 0, sizingH="fill", bind="color/bg/surface", align="center"); rbind(k, i, "control", ["tl", "bl"]); bind(k, i, "minHeight", "size.control.height")
        line(k, i, "state", "color/border/danger"); setp(k, i, paddingLeft=11, paddingRight=11)  # inset.md − (state − control)
        spec(k, i, "name@example", "type.body.md")
        button(k, g, "Invite", "secondary", corners=["tr", "br"])
        k.text(m, "the invalid input is lifted: its whole border shows" if lifted else "the button covers the input's right edge", "caption", "color/fg/muted", weight=400)
    k.tag(s, ".ds-join · overlap = border/width/control · lifted: hover, pressed, selected, invalid · focus above all")
    rules(k, b, [("No hand-made overlaps", "A -1px margin written by hand doesn't follow the control width and doesn't lift the selected part."),
                 ("Tables", "Cells use border-collapse, or lines on one side of each row: the same one-line rule."),
                 ("A gap means separate", "Parts with space between them keep all four borders.")])
    finish(k, b, "Joined parts")
    return b


# ------------------------------------------------------------ Forced colours
def forced(k, D):
    b = start(k, "Forced colours", "Windows contrast themes replace every colour the page chose with a few system colours. Borders and outlines survive — transparent ones too; fills and shadows don't. The right-hand pictures are a preview of that, in fixed colours.")
    W = {j["job"]: j["px"] for j in D["jobs"]}
    s = k.section(b, "What survives", "The same controls in this product's colours and in a light contrast theme.")
    r = k.row(s, 40, align="min")
    m = k.frame(r, "Normal", gap=12, w=560); k.text(m, "NORMAL COLOURS", "caption", "color/fg/subtle", weight=700)
    a = k.row(m, 12, fill=False, align="center"); button(k, a, "Save"); button(k, a, "Cancel", "secondary")
    g = k.frame(m, "Group", "horizontal", -W["control"], 0); setp(k, g, reverseZ=True)
    for i, lab in enumerate(["List", "Board"]): button(k, g, lab, "secondary", corners=(["tl", "bl"] if i == 0 else ["tr", "br"]), pressed=(i == 0))
    field(k, m, "Work email", "ali@", "invalid", 300, "Enter the whole address")
    m = k.frame(r, "Forced", gap=12, w=560); k.text(m, "FORCED COLOURS (PREVIEW)", "caption", "color/fg/subtle", weight=700)
    a = k.row(m, 12, fill=False, align="center")
    for lab in ["Save", "Cancel"]:
        bb = fc_frame(k, a, lab, radius=4, direction="horizontal", align="center"); k.pad(bb, 12, 12, 8, 8); fc_text(k, bb, lab, weight=600)
    g = k.frame(m, "Group", "horizontal", -W["control"], 0); setp(k, g, reverseZ=True)
    for i, lab in enumerate(["List", "Board"]):
        bb = fc_frame(k, g, lab, radius=0, direction="horizontal", align="center"); k.pad(bb, 12, 12, 8, 8); fc_text(k, bb, lab, weight=600 if i == 0 else 400)
        if i == 0:
            inner = bb; setp(k, inner, strokes=[FC["selected"]], strokeWeight=2)
    col = fc_frame(k, m, "Field", w=300, stroke=False, gap=6); fc_text(k, col, "Work email", weight=600)
    inp = fc_frame(k, col, "Input", w=300, weight=2, radius=4, direction="horizontal", align="center"); k.pad(inp, 11, 11, 8, 8); fc_text(k, inp, "ali@", style="body")
    fc_text(k, col, "⚠ Enter the whole address")
    k.text(m, "Every edge is a border (Save's is transparent normally). The pressed part keeps an outline in SelectedItem; the invalid field keeps its 2px width.", "small", "color/fg/muted", fill=True)
    s = k.section(b, "What tokens.css does, and what you do", "tokens.css handles the ring, ARIA states and disabled controls; the rest is in the components.")
    grid_table(k, s, [("tokens.css", None), ("You", None)], [[a_[:1].upper() + a_[1:], b_[:1].upper() + b_[1:]] for a_, b_ in zip(D["forcedColors"]["tokensCss"] + [""], D["forcedColors"]["you"])])
    s = k.section(b, "Fills alone disappear", "A selected row shown only by its fill looks like its neighbours in a contrast theme: every fill becomes the page colour.")
    r = k.row(s, 40, align="min")
    for kind, ok in [("avoid", False), ("do", True)]:
        m = k.frame(r, kind, gap=10); k.inst(kind, m)
        lst = fc_frame(k, m, "List", w=300, gap=0)
        for i, lab in enumerate(["Atlas", "Borealis", "Cygnus"]):
            it = fc_frame(k, lst, lab, w=300, stroke=(i > 0), sides="t", direction="horizontal", align="center"); k.pad(it, 12, 12, 10, 10)
            if ok and i == 1: setp(k, it, strokes=[FC["selected"]], strokeWeight=2, strokeSides=[1, 1, 1, 1])
            fc_text(k, it, lab + ("  ✓" if ok and i == 1 else ""), weight=600 if ok and i == 1 else None)
        k.text(m, "aria-selected + an outline and a check: the selection shows" if ok else "selected by fill only: nothing shows", "caption", "color/fg/muted", weight=400)
    rules(k, b, [("Test it", "Windows: Settings → Accessibility → Contrast themes. Chrome or Edge: DevTools → Rendering → Emulate CSS media feature forced-colors. The border audit renders every page in forced colours."),
                 ("Don't opt out", "forced-color-adjust: none is for colour swatches and charts, where the colours are the content — never for controls.")])
    finish(k, b, "Forced colours")
    return b


# ------------------------------------------------------------ Choosing a boundary
def choosing(k, D):
    b = start(k, "Choosing a boundary", "Four questions get you to the right line — or to no line: does it need a line at all, what state is it showing, does the state widen the border, does it touch another part? Then check focus.")
    for d in D["decisions"]:
        s = k.section(b, d["what"], d["question"])
        grid_table(k, s, [("When", 600), ("Use", None)], [[w, slashed(u)] for w, u in d["answers"]])
    s = k.section(b, "Worked example — a settings card", "One line at a time, in this product.")
    r = k.row(s, 40, align="min")
    m = k.frame(r, "Example", gap=16, w=420)
    rows_card(k, m, 420)
    field(k, m, "Billing email", "finance@north", "invalid", 420, "Enter the whole address")
    W = {j["job"]: j["px"] for j in D["jobs"]}
    grid_table(k, r, [("Part", 200), ("Job and colour", 280), ("Why", None)], [
        ["The card", "line · border/default", "Outlines a group; decorative."],
        ["Rows inside it", "line · border/subtle", "Separates items that sit close."],
        ["The email field", f"state · border/danger ({W['state']}px)", "An icon and a message; the padding gives up the extra pixel."],
        ["Keyboard focus", "focus/ring/*", "Drawn by tokens.css."]])
    s = k.section(b, "Do and avoid", "Measured in this build.")
    grid_table(k, s, [("Avoid", 360), ("Measured", None), ("Do", 400)], [[slashed(m["mistake"]), slashed(m["measured"]), f"{slashed(m['fix'])} — {slashed(m['fixValue'])}"] for m in D["mistakes"]])
    finish(k, b, "Choosing a boundary")
    return b


# ------------------------------------------------------------ Readers' settings and products
def settings(k, D):
    b = start(k, "Readers' settings and products", "People enlarge text, zoom, switch to dark mode or forced colours; products choose heavier controls or add lines of their own. Borders are built so none of that breaks.")
    s = k.section(b, "Bigger text", "Widths are px: when text doubles, lines stay lines. Written in rem, every 1px line would become 2px — the width of a state.")
    r = k.row(s, 32, align="min")
    for size, lab in [(16, "16px text"), (32, "32px text (200%)")]:
        m = k.frame(r, lab, gap=8)
        i = k.frame(m, "Input", "horizontal", 0, 0, bind="color/bg/surface", align="center"); rbind(k, i, "control"); line(k, i, "control", "color/border/input"); bind_pad(k, i, "space.inset.md", "lr"); bind_pad(k, i, "space.inset.xs", "tb")
        t = k.f.tool("create_node", type="text", parent=i, text="Atlas workspace", props={"fontFamily": "Inter", "fontSize": size, "lineHeight": int(size * 1.5)})["id"]
        k.f.cmd("variable.bind", ids=[t], field="fill", variable="color/fg/default")
        k.text(m, lab + f" · border {D['jobs'][1]['px']}px", "caption", "color/fg/muted", weight=400)
    s = k.section(b, "Heavier controls", "A product sets border.control to 1 or 2. Structure stays 1px; states stay one pixel wider than controls; component code doesn't change.")
    grid_table(k, s, [("Config", 380)] + [(j, None) for j in ["line", "control", "state", "indicator"]],
               [[f'"border": {{ "control": {c} }}' + ("  · this product" if c == D["control"] else "")] + [f"{D['widths'][str(c)][j]}px" for j in ["line", "control", "state", "indicator"]] for c in (1, 2)])
    product = [j for j in D["jobs"] if j["product"]]
    if product:
        s = k.section(b, "Jobs added for this product", "Defined in the engine config and checked like the built-in ones.")
        for j in product: documented.append(j["name"])
        grid_table(k, s, [("Token", 300), ("Width", 120), ("Use it for", None), ("Colour", 280)], [[fig(j["name"]), f"{j['px']}px {j['style']}", j["use"], fig(j["colors"][0]["name"])] for j in product])
    s = k.section(b, "Adding a job", "Name it by its job, give a width on the scale, one colour role, whether people need it to find something, and a style. The build refuses names by look, widths off the scale or below a pixel, colours that aren't border roles — and fails a job that identifies something in a colour under 3:1.")
    c = k.card(s, 8, 24); rbind(k, c, "container")
    k.text(c, '{ "border": { "control": ' + str(D["control"]) + ', "roles": [ { "name": "border.width.drop-zone", "width": 2, "color": "color.border.strong", "identifies": true, "style": "dashed", "description": "The edge of an area files can be dropped on" } ] } }', "mono", fill=True)
    dz = k.frame(s, "Drop zone", "horizontal", 0, 32, w=420, bind="color/bg/surface", align="center", main="center"); rbind(k, dz, "container")
    setp(k, dz, strokes=["#000000"], strokeAlign="inside", strokeWeight=2, dashes=[8, 6]); k.f.cmd("variable.bind", ids=[dz], field="stroke", variable="color/border/strong")
    k.f.cmd("variable.bind", ids=[dz], field="strokeWeight", variable="border/width/2")  # "width": 2 in the config above
    k.text(dz, "Drop files here", "body", "color/fg/muted")
    s = k.section(b, "Accessibility reference", "What the build checks for borders, and the result for this build.")
    grid_table(k, s, [("Check", 80), ("What it checks", 760), ("WCAG", 180), ("Result", None)], [[x["id"], x["title"], "—" if x["wcag"] in ("—", "", None) else f"{x['wcag']} ({x['level']})", f"{x['status']} · {x['summary']}"] for x in D["checks"]])
    finish(k, b, "Readers' settings and products")
    return b


CHAPTER_FNS = [principles, tokens, jobs, colour, states, focus, joined, forced, choosing, settings]

"""Motion foundation as one systematic story: 11 chapters, each = explain → examples → tokens → rules, plus a Try it page.
Variables: the Motion collection (full, reduced) links to Primitives (durations as numbers, curves as cubic-bezier text) and
the spacing scale (distances). A frame set to the reduced mode shows the reduced values: duration bars are bound to the
duration variables (1px = 1ms), distance bars and offsets to the distance variables, curve text to the easing variables.
Figma can't bind a prototype transition to a variable, so every interactive example comes as a full and a reduced
component set whose transitions carry the build's numbers for that mode (written from data, never typed). Pictures of
time — curves, speeds, frames, fades, turns — are drawn from numbers the engine computed. Every motion token is documented
on exactly one chapter, the one the contract names (asserted). All copy is original (clean-room) and follows the guide."""
import re
from story_space import grid_table, spec, bind, bind_pad, dmode, fig
from story_border import setp, rbind, line, rules, button, field, ring, fc_frame, fc_text, FC
import story_elevation as se

GROUP = {"Five principles": "Idea", "How tokens are built": "Structure", "Motion by job": "Jobs", "Duration follows distance": "Timing",
         "Curves": "Timing", "Reduced motion": "Reduced and still", "Opening and closing": "Jobs", "Loading and highlights": "Jobs",
         "What never moves": "Reduced and still", "Choosing motion": "Using", "Readers' settings and products": "Using"}
TEASER = {"How tokens are built": "one collection, full and reduced", "Motion by job": "six jobs, named by what changes",
          "Duration follows distance": "computed, never picked", "Curves": "four curves, none faster than 2.5×",
          "Reduced motion": "fade only, everywhere", "Opening and closing": "menus, toasts and dialogs, ready in tokens.css",
          "Loading and highlights": "the one loop, and a tint that fades once", "What never moves": "focus, text, scrolling, size",
          "Choosing motion": "four questions and a worked example", "Readers' settings and products": "settings, zoom, forced colours, your own jobs"}
MODES = ["full", "reduced"]
documented = []
CH = []
EX = {}  # (example, mode) → component set id, filled by build_examples
BOARD_W = 1440


# ------------------------------------------------------------ data helpers
def T(D, name):
    return next(t for t in D["tokens"] if t["name"] == name)


def J(D, job):
    return next(j for j in D["jobs"] if j["job"] == job)


def CURVE(D, name):
    return next(c for c in D["curves"] if c["name"] == name)


def doc(D, name, chapter):
    """Record that `name` is documented on `chapter` — and that this is the chapter the contract says."""
    assert T(D, name)["chapter"] == chapter, (name, T(D, name)["chapter"], chapter)
    documented.append(name)


def sl(text):
    """Token names in Figma are written with slashes."""
    text = text.replace("`", "")
    keep = {"motion.jobs", "elevation.layers"}  # config keys stay as they are written in the config
    return re.sub(r"\b(motion|elevation|layer|color|border|space|shape)\.[a-z0-9-]+(\.[a-z0-9-]+)*", lambda m: m.group(0) if m.group(0) in keep else m.group(0).replace(".", "/"), text)


def cap(s):
    """Capitalise prose, but leave code as written (cubic-bezier(…), transition: …, tokens.css, data-motion=…)."""
    return s[0].upper() + s[1:] if s and re.match(r"^[a-z]+(\s|$)", s) and not s.startswith(("transition ", "animation ")) else s


def timing(D, job, m, leaving=False):
    j = J(D, job)
    if leaving: return j["exit"]["duration"][m], j["exit"]["easing"][m]
    return j["duration"][m], j["easing"][m]


def bez(cv):
    x1, y1, x2, y2 = cv
    return {"customBezier": {"x1": x1, "y1": y1, "x2": x2, "y2": y2}}


# ------------------------------------------------------------ canvas helpers
def mmode(k, nid, m):
    k.f.cmd("variable.setMode", ids=[nid], collection="Motion", mode=m)


def free(k, parent, name, w, h, fill=None, clip=False):
    """A frame without auto layout: children are placed by position."""
    args = dict(type="frame", name=name, width=w, height=h, props={"layout": None, "fills": [fill] if fill else [], "clip": clip})
    if parent is not None: args["parent"] = parent
    return k.f.tool("create_node", **args)["id"]


def place(k, nid, x, y):
    setp(k, nid, x=x, y=y)


def dot(k, parent, x, y, size=8, color="color/fg/brand", name="Frame", opacity=None):
    d = k.f.tool("create_node", type="ellipse", parent=parent, name=name, width=size, height=size, props={"fills": ["#000000"]})["id"]
    k.f.cmd("variable.bind", ids=[d], field="fill", variable=color)
    place(k, d, x, y)
    if opacity is not None: setp(k, d, opacity=opacity)
    return d


def hline(k, parent, x, y, w, color="color/border/subtle", name="Track", dashed=False, h=1):
    r = k.f.tool("create_node", type="rectangle", parent=parent, name=name, width=max(w, 1), height=h, props={"fills": ["#000000"]})["id"]
    k.f.cmd("variable.bind", ids=[r], field="fill", variable=color)
    place(k, r, x, y)
    if dashed: setp(k, r, opacity=0.6)
    return r


def vec(k, parent, points=None, path=None, color="color/fg/brand", weight="indicator", name="Curve", dashed=False):
    """A line drawn from computed points (or an SVG path whose bounding box starts at 0,0)."""
    if points is not None:
        mx, my = min(p[0] for p in points), min(p[1] for p in points)
        args = dict(points=[[round(x - mx, 2), round(y - my, 2)] for x, y in points], x=mx, y=my)
    else:
        args = dict(path=path, x=0, y=0)
    v = k.f.cmd("vector.create", parent=parent, props={"strokes": ["#000000"], "strokeWeight": 2, "fills": [], "strokeCap": "round", "strokeJoin": "round"}, **args)
    vid = v.get("id") if isinstance(v, dict) else v
    setp(k, vid, name=name)
    k.f.cmd("variable.bind", ids=[vid], field="stroke", variable=color)
    if weight: k.f.cmd("variable.bind", ids=[vid], field="strokeWeight", variable=f"border/width/{weight}")
    if dashed: setp(k, vid, dashes=[6, 4])
    return vid


def label(k, parent, s, x, y, color="color/fg/muted", style="caption", mono=False):
    t = k.text(parent, s, style, color, weight=400, mono=mono)
    place(k, t, x, y)
    return t


def two_modes(k, parent, draw, name="Full and reduced", labels=("Full", "Reduced"), pad=28, gap=20, stack=False):
    """The same drawing in a frame set to Motion full and one set to reduced: one drawing, two modes (side by side, or
    one above the other with `stack`)."""
    r = k.frame(parent, name, gap=24, sizingH="fill") if stack else k.row(parent, 24, name, align="min")
    out = []
    for lab, m in zip(labels, MODES):
        col = k.frame(r, lab, gap=10, sizingH="fill")
        k.text(col, lab.upper(), "caption", "color/fg/subtle", weight=700)
        box = k.frame(col, f"{lab} frame", gap=gap, pad=pad, sizingH="fill", bind="elevation/page/surface")
        rbind(k, box, "container"); line(k, box, "line", "color/border/subtle"); setp(k, box, clip=False)
        mmode(k, box, m)
        draw(box, m)
        out.append(box)
    return out


def note(k, parent, title, body):
    c = k.card(parent, 6, 24)
    k.text(c, title, "h3"); k.text(c, sl(body), "body", "color/fg/muted", fill=True)
    return c


def code(k, parent, lines, name="Code"):
    c = k.card(parent, 2, 20, bind="color/bg/surface-sunken", name=name)
    for ln in lines: k.text(c, ln, "mono", fill=True)
    return c


def slip(k, parent, D, idx, avoid_draw=None, do_draw=None):
    """A measured mistake from the contract: avoid (with what was measured) beside do (the fix)."""
    m = D["mistakes"][idx]
    r = k.row(parent, 24, "Do and avoid", align="min")
    a = k.frame(r, "avoid", gap=12, sizingH="fill"); k.inst("avoid", a)
    k.text(a, sl(cap(m["mistake"])), "body", weight=600, fill=True)
    if avoid_draw: avoid_draw(a)
    k.text(a, sl(cap(m["measured"])), "small", "color/fg/muted", fill=True)
    d = k.frame(r, "do", gap=12, sizingH="fill"); k.inst("do", d)
    k.text(d, sl(cap(m["fix"])), "body", weight=600, fill=True)
    if do_draw: do_draw(d)
    k.text(d, sl(cap(m["fixValue"])), "small", "color/fg/muted", fill=True)
    return r


# ------------------------------------------------------------ pictures of time (all from computed numbers)
def spacing_chart(k, parent, progress, w=420, name="Frames", color="color/fg/brand"):
    """Where the moving thing is at each frame along its whole distance: frames are even in time, so the gaps between
    the dots are its speed. The first dot is where it starts."""
    fr = free(k, parent, name, w + 10, 16)
    hline(k, fr, 5, 7, w, name="Distance")
    dot(k, fr, 0, 3, 10, "color/fg/subtle", name="Start")
    for i, p in enumerate(progress): dot(k, fr, p * w, 3, 10, color, name=f"Frame at {round((i + 1) * 1000 / 60)}ms")
    return fr


def fade_strip(k, parent, values, cell=22, name="Fade", times=None, color="color/bg/brand"):
    """Opacity at each sample: one square per frame (or per sample time)."""
    row = k.frame(parent, name, "horizontal", 4, 0, align="min")
    for i, v in enumerate(values):
        col = k.frame(row, f"{v}", gap=4, align="center")
        sq = k.frame(col, "Sample", w=cell, h=cell, sizingV=None, bind=color); rbind(k, sq, "mark"); setp(k, sq, opacity=max(0.0, min(1.0, v)))
        if times: k.text(col, times[i], "caption", "color/fg/subtle", weight=400)
    return row


def curve_graph(k, parent, cv, name=None, show_speed=True):
    """Progress over time (the curve), and under it its speed as a multiple of the average, with the 2.5× limit."""
    W, H = cv["box"]
    col = k.frame(parent, name or cv["name"], gap=10)
    g = free(k, col, "Progress over time", W + 2, H + 2)
    hline(k, g, 0, H, W + 2, "color/border/default", "Time axis")
    ax = k.f.tool("create_node", type="rectangle", parent=g, name="Progress axis", width=1, height=H + 1, props={"fills": ["#000000"]})["id"]
    k.f.cmd("variable.bind", ids=[ax], field="fill", variable="color/border/default"); place(k, ax, 0, 0)
    vec(k, g, points=[[0, H], [W, 0]], color="color/border/subtle", weight="line", name="Even speed", dashed=True)
    vec(k, g, path=cv["path"], name=f"motion/easing/{cv['name']}")
    if show_speed:
        SW, SH = cv["speedBox"]
        s = free(k, col, "Speed over time", SW + 2, SH + 2)
        hline(k, s, 0, SH, SW + 2, "color/border/default", "Time axis")
        hline(k, s, 0, cv["limitY"] - 1, SW, "color/fg/danger", "Limit 2.5×", h=2)
        hline(k, s, 0, cv["averageY"], SW, "color/border/subtle", "Average speed")
        if len({y for _, y in cv["speed"]}) == 1: hline(k, s, 0, cv["speed"][0][1] - 1, SW, "color/fg/brand", "Speed", h=2)
        else: vec(k, s, points=cv["speed"], color="color/fg/brand", weight="state", name="Speed")
    return col


def ring_cell(k, parent, deg=0, opacity=1, size=24, name="Indicator"):
    """The loading indicator at one moment: a track and a 270° arc, turned by `deg` (the arc's start, not the layer)."""
    holder = free(k, parent, name, size, size)
    trackc = k.f.tool("create_node", type="ellipse", parent=holder, name="Track", width=size, height=size, props={"fills": ["#000000"], "arcInner": 0.75})["id"]
    k.f.cmd("variable.bind", ids=[trackc], field="fill", variable="color/border/subtle")
    a = k.f.tool("create_node", type="ellipse", parent=holder, name="Arc", width=size, height=size, props={"fills": ["#000000"], "arcStart": deg % 360, "arcSweep": 270, "arcInner": 0.75})["id"]
    k.f.cmd("variable.bind", ids=[a], field="fill", variable="color/fg/icon")
    if opacity != 1: setp(k, holder, opacity=opacity)
    return holder


def dialog_cell(k, parent, p, dist, w=200, h=128, name="Frame"):
    """One frame of the dialog arriving: the scrim and the dialog at that frame's opacity, the dialog at its offset."""
    cell = free(k, parent, name, w, h, fill="#FFFFFF", clip=True)
    k.f.cmd("variable.bind", ids=[cell], field="fill", variable="elevation/page/surface")
    rbind(k, cell, "container"); line(k, cell, "line", "color/border/subtle")
    cw = (w - 40) / 2
    for i in range(2):
        c = k.frame(cell, "Card", w=cw, h=40, sizingV=None, bind="elevation/raised/surface"); rbind(k, c, "container"); place(k, c, 16 + i * (cw + 8), 14)
    sc = free(k, cell, "Scrim", w, h, fill="#000000"); k.f.cmd("variable.bind", ids=[sc], field="fill", variable="elevation/modal/scrim"); setp(k, sc, opacity=round(p, 3))
    dw, dh = round(w * 0.6), round(h * 0.47)
    d = se.level(k, cell, "modal", "Dialog", w=dw, h=dh, pad=None, gap=None)
    place(k, d, (w - dw) / 2, (h - dh) / 2 + dist * (1 - p)); setp(k, d, opacity=round(p, 3))
    return cell


def film(k, parent, progress, dist, picks, ms_total, name="Frames", w=200, h=128):
    row = k.frame(parent, name, "horizontal", 12, 0, align="min"); setp(k, row, clip=False)
    n = len(progress)
    for i in picks:
        col = k.frame(row, f"Frame {i}", gap=6, align="center")
        dialog_cell(k, col, progress[i - 1], dist, w, h, name=f"At {round(min(ms_total, i * 1000 / 60))}ms")
        k.text(col, f"{round(min(ms_total, i * 1000 / 60))}ms", "caption", "color/fg/subtle", weight=400)
    return row


def live_row(k, parent, D, job, m):
    """One job's values, live: each bar, offset and text is bound to its variable, so the frame's Motion mode decides."""
    j = J(D, job)
    r = k.frame(parent, f"Live · {job}", "horizontal", 20, 0, sizingH="fill", align="center")
    k.text(r, f"motion/{job}", "mono", width=170)
    dc = k.frame(r, "Duration", gap=4, w=330)
    if j["duration"]["full"] <= 300:
        bar = k.f.tool("create_node", type="rectangle", parent=dc, name=f"motion/{job}/duration", width=100, height=10, props={"fills": ["#000000"]})["id"]
        k.f.cmd("variable.bind", ids=[bar], field="fill", variable="color/bg/brand"); rbind(k, bar, "pill")
        k.f.cmd("variable.bind", ids=[bar], field="width", variable=f"motion/{job}/duration")
        if j["exit"]:
            ex = k.f.tool("create_node", type="rectangle", parent=dc, name=f"motion/{job}/exit-duration", width=100, height=10, props={"fills": ["#000000"]})["id"]
            k.f.cmd("variable.bind", ids=[ex], field="fill", variable="color/border/strong"); rbind(k, ex, "pill")
            k.f.cmd("variable.bind", ids=[ex], field="width", variable=f"motion/{job}/exit-duration")
            k.text(dc, f"{j['duration'][m]}ms in · {j['exit']['duration'][m]}ms out", "caption", "color/fg/muted", weight=400)
        else:
            k.text(dc, f"{j['duration'][m]}ms", "caption", "color/fg/muted", weight=400)
    else:
        k.text(dc, f"{j['duration'][m]}ms" + (" a turn" if job == "loading" and m == "full" else " a pulse" if job == "loading" else ", once"), "small", "color/fg/muted")
    et = k.text(r, "cubic-bezier", "mono", "color/fg/default", width=300, name=f"motion/{job}/easing")
    k.f.cmd("variable.bind", ids=[et], field="characters", variable=f"motion/{job}/easing")
    dd = k.frame(r, "Distance", gap=4, sizingH="fill")
    if j["distance"]:
        b = k.f.tool("create_node", type="rectangle", parent=dd, name=f"motion/{job}/distance", width=4, height=10, props={"fills": ["#000000"]})["id"]
        k.f.cmd("variable.bind", ids=[b], field="fill", variable="color/fg/brand")
        k.f.cmd("variable.bind", ids=[b], field="width", variable=f"motion/{job}/distance")
        k.text(dd, f"{j['distance'][m]}px" + ("" if j["distance"][m] else " — it only fades"), "caption", "color/fg/muted", weight=400)
    else:
        k.text(dd, "doesn't move", "caption", "color/fg/subtle", weight=400)
    return r


def motion_table(k, parent, D, names, chapter):
    rows = []
    for n in names:
        t = T(D, n); doc(D, n, chapter)
        if t["type"] == "duration": fr, link = f"{t['full']} · {t['reduced']}ms", t["cssVar"]
        elif t["type"] == "cubicBezier": fr, link = f"{fig(t['alias']['full'])} · {fig(t['alias']['reduced'])}", t["cssVar"]
        else: fr, link = f"{t['full']} · {t['reduced']}px", f"{fig(t['alias']['full'])} · {fig(t['alias']['reduced'])}"
        rows.append([t["figma"], fr, link])
    def cell(c, i, v, w):
        if i in (0, 2): k.text(c, v, "mono", fill=True); return True
        return False
    return grid_table(k, parent, [("Token", 360), ("Full · reduced", 460), ("Links to / CSS", None)], rows, cell)


# ------------------------------------------------------------ interactive examples (component sets, one per mode)
# (example, from, to, trigger, job, leaving) — the same list builds the interactions and the table on "How tokens are built".
TRANSITIONS = [
    ("Button", "rest", "hover", "hover", "feedback", False),
    ("Task list", "rest", "leaving", "click", "change", False),
    ("Task list", "leaving", "gone", "when it has faded", None, False),
    ("Task list", "gone", "rest", "click (to try again)", None, False),
    ("Menu", "closed", "open", "click", "floating", False),
    ("Menu", "open", "closed", "click", "floating", True),
    ("Toast", "hidden", "shown", "click", "floating", False),
    ("Toast", "shown", "hidden", "after 4 seconds, or a click", "floating", True),
    ("Dialog", "closed", "open", "click", "modal", False),
    ("Dialog", "open", "closed", "click", "modal", True),
    ("Highlight", "before", "changed", "click", None, False),
    ("Highlight", "changed", "after", "at once", "highlight", False),
    ("Highlight", "after", "before", "click (to try again)", None, False),
]


def _set(k, variants, name, m):
    ids = list(variants.values())
    for i in ids: k.f.cmd("component.create", ids=[i])
    cs = k.f.cmd("component.combineVariants", ids=ids)["id"]
    setp(k, cs, name=name)
    if m: mmode(k, cs, m)
    return cs


def _wire(k, D, ex, variants, m):
    for e, a, b, trig, job, leaving in TRANSITIONS:
        if e != ex: continue
        src, dst = variants[a], variants[b]
        triggers = []
        if trig == "hover": triggers = [{"type": "onHover"}]
        elif trig.startswith("click"): triggers = [{"type": "onClick"}]
        elif trig == "when it has faded": triggers = [{"type": "afterDelay", "ms": J(D, "change")["duration"][m]}]
        elif trig == "after 4 seconds, or a click": triggers = [{"type": "afterDelay", "ms": 4000}, {"type": "onClick"}]
        elif trig == "at once": triggers = [{"type": "afterDelay", "ms": 1}]
        for tr in triggers:
            if job is None:
                k.f.cmd("proto.interaction.add", id=src, trigger=tr, action={"type": "changeTo", "dest": dst}, transition={"type": "instant"})
            else:
                ms, cname = timing(D, job, m or "full", leaving)
                k.f.cmd("proto.interaction.add", id=src, trigger=tr, action={"type": "changeTo", "dest": dst}, transition={"type": "smartAnimate"}, durationMs=ms, easing=bez(CURVE(D, cname)["value"]))


def build_examples(k, D, x0=0, y0=900):
    """The interactive examples, built once on the Doc kit page; every page uses instances."""
    y = y0
    hold = k.frame(None, "Motion examples", gap=8, x=x0, y=y - 120)
    k.text(hold, "Motion examples", "h2"); k.text(hold, "Component sets used on the chapters and the Try it page. Each comes once per Motion mode; its prototype transitions carry that mode's duration and curve from the build.", "body", "color/fg/muted", width=1200)
    for m in MODES:
        x = x0
        # Button: hover changes the fill (feedback)
        v = {}
        for st in ["rest", "hover"]:
            f_ = k.frame(None, f"state={st}", x=x, y=y)
            b = button(k, f_, "Save changes")
            if st == "hover": k.f.cmd("variable.bind", ids=[b], field="fill", variable="color/action/primary/bg-hover")
            v[st] = f_; x += 200
        _wire(k, D, "Button", v, m); EX[("Button", m)] = _set(k, v, f"Motion example/Button · {m}", m)
        x += 80
        # Task list: the middle task leaves (change), then the list closes the gap at once
        v = {}
        d = J(D, "change")["distance"][m]
        for st in ["rest", "leaving", "gone"]:
            card = k.frame(None, f"state={st}", w=300, bind="color/bg/surface", x=x, y=y)
            rbind(k, card, "container"); line(k, card, "line", "color/border/default")
            for i, it in enumerate(["Design review", "Accessibility audit", "Release notes"]):
                if st == "gone" and i == 1: continue
                row = free(k, card, f"Row · {it}", 300, 44); setp(k, row, clip=False)
                item = k.frame(row, f"Item · {it}", "horizontal", 0, 0, w=300, h=44, sizingV=None, align="center")
                bind_pad(k, item, "space.inset.md", "lr")
                if i: line(k, item, "line", "color/border/subtle", "t")
                t_ = spec(k, item, it, "type.body.md"); setp(k, t_, sizingH="fill")
                if i == 1: spec(k, item, "Remove", "type.label.md", "color/fg/link")
                if st == "leaving" and i == 1: place(k, item, 0, -d); setp(k, item, opacity=0)
            v[st] = card; x += 340
        _wire(k, D, "Task list", v, m); EX[("Task list", m)] = _set(k, v, f"Motion example/Task list · {m}", m)
        x += 80
        # Menu: drops in from above by the floating distance (bound), leaves with the exit
        v = {}
        for st in ["closed", "open"]:
            f_ = free(k, None, f"state={st}", 240, 190); place(k, f_, x, y)
            b = button(k, f_, "More ▾", "secondary"); place(k, b, 0, 0)
            wrap = k.frame(f_, "Menu wrapper", gap=0); place(k, wrap, 0, 44); setp(k, wrap, clip=False)
            if st == "open": k.f.cmd("variable.bind", ids=[wrap], field="paddingTop", variable="motion/floating/distance")
            mm = se.menu(k, wrap, ("Rename", "Duplicate", "Delete"), 180)
            if st == "closed": setp(k, mm, opacity=0)
            v[st] = f_; x += 280
        _wire(k, D, "Menu", v, m); EX[("Menu", m)] = _set(k, v, f"Motion example/Menu · {m}", m)
        x += 80
        # Toast: comes up from the bottom by the floating distance (bound), leaves after four seconds
        v = {}
        for st in ["hidden", "shown"]:
            f_ = free(k, None, f"state={st}", 320, 130); place(k, f_, x, y)
            b = button(k, f_, "Save draft", "secondary"); place(k, b, 0, 0)
            wrap = k.frame(f_, "Toast wrapper", gap=0); place(k, wrap, 0, 64); setp(k, wrap, clip=False)
            if st == "hidden": k.f.cmd("variable.bind", ids=[wrap], field="paddingTop", variable="motion/floating/distance")
            t_ = se.level(k, wrap, "floating", "Toast", w=280, pad="space.inset.md"); spec(k, t_, "Draft saved.", "type.body.md")
            if st == "hidden": setp(k, t_, opacity=0)
            v[st] = f_; x += 360
        _wire(k, D, "Toast", v, m); EX[("Toast", m)] = _set(k, v, f"Motion example/Toast · {m}", m)
        x += 80
        # Dialog: rises by the modal distance (bound) while the scrim fades in
        v = {}
        for st in ["closed", "open"]:
            f_ = free(k, None, f"state={st}", 520, 320, fill="#FFFFFF", clip=True); place(k, f_, x, y)
            k.f.cmd("variable.bind", ids=[f_], field="fill", variable="elevation/page/surface"); rbind(k, f_, "container"); line(k, f_, "line", "color/border/subtle")
            h = se.header(k, f_, 520); place(k, h, 0, 0)
            for i, (tt, sub) in enumerate([("Atlas", "12 open tasks"), ("Beacon", "4 open tasks")]):
                c = se.proj_card(k, f_, tt, sub, 220); place(k, c, 24 + i * 244, 84)
            b = button(k, f_, "Delete Atlas…", "secondary"); place(k, b, 24, 250)
            sc = free(k, f_, "Scrim", 520, 320, fill="#000000"); k.f.cmd("variable.bind", ids=[sc], field="fill", variable="elevation/modal/scrim")
            wrap = k.frame(f_, "Dialog wrapper", gap=0); place(k, wrap, 100, 64); setp(k, wrap, clip=False)
            if st == "closed": k.f.cmd("variable.bind", ids=[wrap], field="paddingTop", variable="motion/modal/distance")
            dl = se.level(k, wrap, "modal", "Dialog", w=320, pad="space.inset.xl")
            spec(k, dl, "Delete Atlas?", "type.title.lg"); spec(k, dl, "Its tasks and files go too.", "type.body.md", "color/fg/muted")
            a = k.row(dl, 8, align="center"); setp(k, a, mainAlign="max"); button(k, a, "Cancel", "secondary"); button(k, a, "Delete")
            if st == "closed": setp(k, sc, opacity=0); setp(k, dl, opacity=0)
            v[st] = f_; x += 560
        _wire(k, D, "Dialog", v, m); EX[("Dialog", m)] = _set(k, v, f"Motion example/Dialog · {m}", m)
        y += 520
    # Highlight: the same in both modes (a fade is not movement)
    x = x0
    v = {}
    for st, val, tint in [("before", "12", 0), ("changed", "13", 1), ("after", "13", 0)]:
        card = k.frame(None, f"state={st}", "horizontal", 12, 0, bind="color/bg/surface", align="center", x=x, y=y)
        rbind(k, card, "container"); line(k, card, "line", "color/border/default"); bind_pad(k, card, "space.inset.lg")
        spec(k, card, "Open tasks", "type.body.md", "color/fg/muted")
        hold_ = free(k, card, "Value", 56, 36)
        tn = k.frame(hold_, "Tint", w=56, h=36, sizingV=None, bind="color/bg/brand-subtle"); rbind(k, tn, "mark"); setp(k, tn, opacity=tint)
        nt = spec(k, hold_, val, "type.numeric.md"); place(k, nt, 12, 6)
        v[st] = card; x += 300
    _wire(k, D, "Highlight", v, "full"); EX[("Highlight", "full")] = EX[("Highlight", "reduced")] = _set(k, v, "Motion example/Highlight", None)
    return EX


def ex(k, key, m, parent, props=None):
    i = k.f.cmd("instance.create", component=EX[(key, m)], parent=parent)
    iid = i.get("id") if isinstance(i, dict) else i
    if props: k.f.cmd("instance.setProperties", ids=[iid], properties=props)
    return iid


# ------------------------------------------------------------ boards
def start(k, title, lead):
    k.page(title)
    b = k.frame(name=title, w=BOARD_W, pad=80, gap=72, bind="color/bg/canvas")
    se.mode(k, b, "Light"); mmode(k, b, "full")
    k.f.cmd("variable.setMode", ids=[b], collection="Responsive", mode="lg")
    dmode(k, b, "default")
    k.inst("page", b, {"Eyebrow": f"Motion · {GROUP[title]}", "Title": title, "Lead": lead}, fill=True)
    return b


def finish(k, b, title):
    i = CH.index(title)
    if i + 1 >= len(CH):
        c = k.card(b, 8, 24, bind="color/bg/brand-subtle")
        k.text(c, "End of the motion foundation", "h3")
        k.text(c, "You've seen when something needs motion at all, the six jobs, why a duration follows the distance, the four curves, what reduced motion does, how menus, toasts and dialogs open and close, the one loop, what never moves, and how each is checked. That completes the foundations; next in the system: the docs site.", "body", "color/fg/muted", fill=True)
        return
    t = CH[i + 1]
    c = k.frame(b, "Next", "horizontal", 16, 24, sizingH="fill", bind="color/bg/surface", align="center")
    line(k, c, "line", "color/border/subtle"); rbind(k, c, "container")
    col = k.frame(c, "Text", gap=4, sizingH="fill")
    k.text(col, "NEXT", "caption", "color/fg/subtle", weight=700)
    k.text(col, t, "h3")
    k.text(col, TEASER[t].capitalize() + ".", "small", "color/fg/muted")
    k.text(c, "→", "h1", "color/fg/brand")


def present_hint(k, parent):
    k.text(parent, "These are interactive components: present the Try it page (or this one) and click or hover them. The prototype's durations and curves are the build's numbers for each mode.", "small", "color/fg/muted", fill=True)


# ------------------------------------------------------------ Five principles
def principles(k, D):
    b = start(k, "Five principles", "Five principles shape every job. Each one is checked by the build or the motion audit — the picture beside it shows what it means.")
    s = k.section(b, "The principles", "Read them once; every chapter after this one applies them.")
    chk = {c["id"]: c["summary"] for c in D["checks"]}
    items = [
        ("Motion explains a change", "It shows where something came from or went, or that something heard you. If nobody would miss it, nothing moves — the change happens at once.", "explain"),
        ("Picked by job, not by speed", "Six jobs named by what changes. \"Fast\" or \"300ms\" tells nobody whether a menu should use it; \"floating\" does, and the job carries its duration, curve and distance together.", "jobs"),
        ("Time follows distance", f"A job's duration is computed from how far it moves: {D['rule']['formula'].split(';')[0].replace('duration = ', '')}. Leaving takes two thirds of arriving (M3 {chk['M3']}).", "time"),
        ("Reduced means still", f"With reduced motion nothing moves: every distance is 0, transitions fade in {D['limits']['reducedMaxMs']}ms or less, the loading indicator pulses instead of turning (M1 {chk['M1']}).", "reduced"),
        ("Nothing flashes, nothing runs on", f"No change faster than three a second (M2 {chk['M2']}); the only loop is the loading indicator, shown while work runs.", "flash"),
    ]
    for t, body, demo in items:
        c = k.frame(s, t, "horizontal", 32, 28, sizingH="fill", bind="color/bg/surface", align="center")
        rbind(k, c, "container"); line(k, c, "line", "color/border/subtle")
        col = k.frame(c, "Text", gap=6, sizingH="fill")
        k.text(col, t, "h2", fill=True); k.text(col, body, "body", "color/fg/muted", fill=True)
        d = k.frame(c, "Demo", gap=12, pad=24, w=640, bind="elevation/page/surface")
        rbind(k, d, "container"); setp(k, d, clip=False)
        if demo == "explain":
            for part, job in [("The page title", "no motion: it is there"), ("A list that loads", "no motion: it appears"), ("The \"more\" menu", "motion/floating: from its button"), ("A count that changed", "motion/highlight: once")]:
                r = k.row(d, 12, align="center"); k.text(r, part, "small", width=200); k.tag(r, job)
        elif demo == "jobs":
            r = k.row(d, 8, wrap=True)
            for j in D["jobs"]:
                if j["product"]: continue
                k.chip(r, f"{j['job']} · {j['duration']['full']}ms")
        elif demo == "time":
            for px in [0, 4, 8, 16, 32]:
                ms = next(x["ms"] for x in D["rule"]["samples"] if x["px"] == px)
                r = k.row(d, 12, align="center"); k.text(r, f"{px}px", "mono", width=50)
                bar = k.frame(r, f"{ms}ms", w=ms, h=10, sizingV=None, bind="color/bg/brand"); rbind(k, bar, "pill")
                k.text(r, f"{ms}ms", "caption", "color/fg/muted", weight=400)
        elif demo == "reduced":
            mj = J(D, "modal")
            k.text(d, f"A dialog arriving, frame by frame: full ({mj['duration']['full']}ms, {mj['distance']['full']}px)", "caption", "color/fg/muted", weight=400)
            spacing_chart(k, d, mj["frames"]["progress"], 420)
            k.text(d, f"Reduced: it stays where it is and fades in {D['reducedFrames']['modal']['ms']}ms", "caption", "color/fg/muted", weight=400)
            fade_strip(k, d, D["reducedFrames"]["modal"]["progress"], 18)
        else:
            tl = free(k, d, "One second", 560, 40)
            hline(k, tl, 0, 20, 560, "color/border/default", "1000ms")
            for i in range(4):
                x = i * D["limits"]["flashMinMs"] / 1000 * 560
                dot(k, tl, min(552, x), 16, 8, "color/fg/brand", name=f"{i * D['limits']['flashMinMs']}ms")
            label(k, tl, "at most one change every 334ms — three a second", 0, 26)
    s = k.section(b, "How this foundation is organised", "The chapters follow the order you'd decide motion in: the idea, the structure, the jobs, timing and curves, reduced motion, what opens and closes, the one loop, what never moves, then how to choose.")
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
    b = start(k, "How tokens are built", "Motion tokens live in one collection with two modes, full and reduced, and point into Primitives for every value: durations are numbers, curves are cubic-bezier text, distances link to the spacing scale.")
    s = k.section(b, "One collection, two modes", "Each value is a link, so the reader's motion setting switches every job at once.")
    durs = ", ".join(fig(d["token"]) for d in D["durations"])
    grid_table(k, s, [("Collection", 200), ("Modes", 160), ("What it holds", None), ("Changes with", 320)], [
        ["Motion", "full, reduced", "Per job: a duration (motion/<job>/duration), a curve (motion/<job>/easing), a distance where it moves (motion/<job>/distance), and for what opens and closes the leaving duration and curve (exit-duration, exit-easing)", "the reader's motion setting (prefers-reduced-motion, data-motion); the product's own jobs (motion.jobs)"],
        ["Primitives", "one", f"The durations the jobs use ({durs}) and the four curves (motion/easing/enter, exit, standard, linear)", "nothing: computed"],
        ["Primitives (Spacing)", "one", "What the distances link to: " + ", ".join(sorted({fig(t["alias"][m]) for t in D["tokens"] if t["type"] == "dimension" for m in MODES}, key=lambda x: int(x.split('/')[-1]))), "the spacing scale"]])
    s = k.section(b, "Reading a name", "Jobs are named by what changes; the floating and modal jobs share their names with the elevation levels they open and close.")
    r = k.row(s, 12, align="center", fill=False)
    for part, what in [("motion", "category"), ("/", ""), ("floating", "job"), ("/", ""), ("exit-duration", "part")]:
        if not what: k.text(r, part, "h2", "color/fg/subtle"); continue
        mm = k.frame(r, part, gap=4, align="center"); k.chip(mm, part, bind="color/bg/brand-subtle"); k.text(mm, what, "caption", "color/fg/muted", weight=400)
    fj = J(D, "floating")
    grid_table(k, s, [("Figma", 320), ("CSS variable", 380), ("Tailwind", None)], [
        ["motion/floating/duration", "--ds-motion-floating-duration", fj["duration"]["tailwind"]],
        ["motion/floating/easing", "--ds-motion-floating-easing", fj["easing"]["tailwind"]]])
    s = k.section(b, "Variables you can see", "Every bar, offset and curve text below is bound to its variable. The two frames are the same drawing; the lower one is set to the reduced mode. Select a bar: its width is motion/modal/duration (1px = 1ms).")
    two_modes(k, s, lambda box, m: live_row(k, box, D, "modal", m), stack=True)
    s = k.section(b, "Prototype transitions", "Figma can't bind a prototype transition to a variable, so each interactive example comes twice — a full and a reduced component set — and its transitions carry the build's numbers for that mode.")
    rows = []
    for e, a, z, trig, job, leaving in TRANSITIONS:
        if job is None: rows.append([e, f"{a} → {z}", trig, "instant", "instant"]); continue
        cells = []
        for m in MODES:
            ms, cn = timing(D, job, m, leaving)
            cells.append(f"smart animate · {ms}ms · {cn}")
        rows.append([e, f"{a} → {z}", trig, *cells])
    grid_table(k, s, [("Example", 130), ("Change", 190), ("Trigger", 230), ("Full", None), ("Reduced", None)], rows)
    rules(k, b, [("Never the primitives directly", "motion/duration/* and motion/easing/* are what the jobs point to. A frame or a style that uses one skips the reduced mode."),
                 ("Durations aren't picked", "Each one is computed from the job's distance (Duration follows distance). A product that needs a new one adds a job, not a number.")])
    finish(k, b, "How tokens are built")
    return b


# ------------------------------------------------------------ Motion by job
def jobs(k, D):
    b = start(k, "Motion by job", "Six jobs. Pick by what is changing; the duration, curve and distance come with the job.")
    s = k.section(b, "The six jobs", "Values for this product, full · reduced.")
    rows = []
    for j in D["jobs"]:
        if j["product"]: continue
        dist = f"{j['distance']['full']}px (reduced 0)" if j["distance"] else "—"
        comes = {"in-place": "in place", "in-out": f"leaves in {j['exit']['duration']['full']}ms" if j["exit"] else "", "once": "once", "loop": "runs while work runs"}[j["kind"]]
        rows.append([f"motion/{j['job']}", sl(j["use"].split(" (elevation")[0]), f"{j['duration']['full']} · {j['duration']['reduced']}ms", dist, comes, sl(j["level"]) if j["level"] else "—"])
    def cell(c, i, v, w):
        if i == 0: k.text(c, v, "mono"); return True
        return False
    grid_table(k, s, [("Job", 190), ("Use it for", None), ("Duration", 150), ("Distance", 170), ("Comes and goes", 190), ("Linked to", 170)], rows, cell)
    k.text(s, "Floating and modal are on Opening and closing, highlight and loading on Loading and highlights. The two everyday jobs:", "small", "color/fg/muted", fill=True)
    s = k.section(b, "Feedback", "The thing you touched answers. Colour, fill and border only — never movement, so it is the same in reduced motion.")
    motion_table(k, s, D, ["motion.feedback.duration", "motion.feedback.easing"], "Motion by job")
    two_modes(k, s, lambda box, m: (ex(k, "Button", m, box), k.text(box, f"Hover: the fill changes in {J(D, 'feedback')['duration'][m]}ms with motion/easing/{J(D, 'feedback')['easing'][m]}; nothing moves.", "small", "color/fg/muted", fill=True)))
    code(k, s, ["transition: background-color var(--ds-motion-feedback-duration) var(--ds-motion-feedback-easing),", "            border-color var(--ds-motion-feedback-duration) var(--ds-motion-feedback-easing),", "            color var(--ds-motion-feedback-duration) var(--ds-motion-feedback-easing);"])
    s = k.section(b, "Change", "Content changing where it is: a panel opening, a tab panel, an item added or removed, a value replaced. Its content moves the change distance the way it grows — or only fades — and the size changes at once.")
    motion_table(k, s, D, ["motion.change.duration", "motion.change.easing", "motion.change.distance"], "Motion by job")
    cj = J(D, "change")
    def draw(box, m):
        ex(k, "Task list", m, box)
        k.text(box, f"Click the list: the middle task leaves — it fades{' and moves ' + str(cj['distance'][m]) + 'px up' if cj['distance'][m] else ''} in {cj['duration'][m]}ms — then the list closes the gap at once.", "small", "color/fg/muted", fill=True)
        if m == "full":
            k.text(box, f"Arriving, frame by frame: {cj['frames']['frames']} frames, the largest step {cj['frames']['largest']}px of {cj['frames']['px']}px", "caption", "color/fg/muted", weight=400)
            spacing_chart(k, box, cj["frames"]["progress"], 420)
        else:
            rf = D["reducedFrames"]["change"]
            k.text(box, f"Reduced: {len(rf['progress'])} frames of fade, nothing moves", "caption", "color/fg/muted", weight=400)
            fade_strip(k, box, rf["progress"], 18)
    two_modes(k, s, draw)
    present_hint(k, s)
    rules(k, b, [("No motion for its own sake", "A page that changes at once is fine. Motion is for a change people would otherwise miss or misread."),
                 ("Never by speed", "Don't reach for the \"fastest\" or \"smoothest\" duration: take the job. If no job fits, add one in the config (Readers' settings and products)."),
                 ("Name the properties", "transition: all animates the focus ring and the layout too (MR-02). List what changes: background-color, border-color, color, opacity, translate.")])
    finish(k, b, "Motion by job")
    return b


# ------------------------------------------------------------ Duration follows distance
def duration(k, D):
    rule = D["rule"]
    b = start(k, "Duration follows distance", "Durations are not picked: each one is computed from how far its job moves.")
    s = k.section(b, "The rule", rule["formula"].split(";")[0].capitalize() + ".")
    r = k.row(s, 40, align="min")
    W, H, MX, MY = 560, 240, 32, 350
    X = lambda px: px / MX * W
    Y = lambda ms: H - ms / MY * H
    ch = k.frame(r, "Chart", gap=8)
    g = free(k, ch, "Duration by distance", W + 60, H + 40)
    hline(k, g, 40, H, W + 4, "color/border/default", "Distance axis")
    ax = k.f.tool("create_node", type="rectangle", parent=g, name="Duration axis", width=1, height=H, props={"fills": ["#000000"]})["id"]
    k.f.cmd("variable.bind", ids=[ax], field="fill", variable="color/border/default"); place(k, ax, 40, 0)
    for ms in (100, 200, 300):
        hline(k, g, 40, Y(ms), W, "color/border/subtle", f"{ms}ms"); label(k, g, f"{ms}ms", 0, Y(ms) - 8)
    for px in (0, 8, 16, 24, 32): label(k, g, f"{px}px", 40 + X(px) - 8, H + 8)
    vec(k, g, points=[[40 + X(x["px"]), Y(x["computed"])] for x in rule["samples"]], color="color/fg/subtle", weight="state", name="Computed")
    steps = []
    for i, x in enumerate(rule["samples"]):
        if i: steps.append([40 + X(x["px"]), Y(rule["samples"][i - 1]["ms"])])
        steps.append([40 + X(x["px"]), Y(x["ms"])])
    vec(k, g, points=steps, color="color/fg/brand", weight="indicator", name="Rounded down to 50ms")
    jobs_at = {}
    for j in D["jobs"]:
        if j["product"] or j["kind"] in ("once", "loop"): continue
        jobs_at.setdefault(j["distance"]["full"] if j["distance"] else 0, []).append(j["job"])
    for px, names in jobs_at.items():
        ms = next(x["ms"] for x in rule["samples"] if x["px"] == px)
        dot(k, g, 40 + X(px) - 6, Y(ms) - 6, 12, "color/fg/brand", name=" · ".join(names))
        label(k, g, " · ".join(names), 40 + X(px) + 10, Y(ms) - 22, "color/fg/default")
    k.text(ch, "grey: the formula · blue: the duration, rounded down to 50ms · dots: the jobs", "caption", "color/fg/subtle", weight=400)
    rows = []
    for t in rule["table"]:
        x = next(s_ for s_ in rule["samples"] if s_["px"] == t["px"])
        rows.append([f"{t['px']}px", f"{round(x['computed'])}ms", f"{t['ms']}ms", " · ".join(f"motion/{n}" for n in jobs_at.get(t["px"], [])) or "—"])
    col = k.frame(r, "Table", gap=12, sizingH="fill")
    grid_table(k, col, [("Distance", 110), ("Computed", 120), ("Duration", 120), ("Jobs", None)], rows)
    rr = k.row(b, 24, align="min")
    note(k, rr, "Why these numbers", f"{D['limits']['reducedMaxMs']}ms is the time within which an answer feels instant, so something that doesn't move takes exactly that. Anything that moves needs a little longer, growing with the square root of the distance — as for anything that speeds up and slows down — so twice as far takes about 40% longer, not twice as long. Nothing travels more than {D['limits']['maxDistance']}px, so nothing takes more than {D['limits']['maxDuration']}ms.")
    c = note(k, rr, "Leaving takes two thirds", "People watch something arrive; they have already moved on when it leaves. Leaving is two thirds of arriving, rounded down to 50ms, never under 100ms.")
    for job in ("floating", "modal"):
        j = J(D, job)
        for lab, ms, colr in [("arrives", j["duration"]["full"], "color/bg/brand"), ("leaves", j["exit"]["duration"]["full"], "color/border/strong")]:
            row = k.row(c, 12, align="center"); k.text(row, f"{job} {lab}", "small", width=140)
            bar = k.frame(row, f"{ms}ms", w=ms, h=10, sizingV=None, bind=colr); rbind(k, bar, "pill"); k.text(row, f"{ms}ms", "caption", "color/fg/muted", weight=400)
    s = k.section(b, "The durations in use", "Primitives, computed from the jobs — never used directly. A product job that needs another duration adds it to the build.")
    rows = []
    for d in D["durations"]:
        doc(D, d["token"], "Duration follows distance")
        rows.append([fig(d["token"]), f"{d['ms']}ms", "\n".join(sl(u) for u in d["usedBy"])])
    def cell(c, i, v, w):
        if i == 0: k.text(c, v, "mono"); return True
        if i == 2:
            for ln in v.split("\n"): k.text(c, ln, "mono", "color/fg/muted", fill=True)
            return True
        return False
    grid_table(k, s, [("Primitive", 260), ("Value", 120), ("Used by", None)], rows, cell)
    k.text(s, f"The highlight ({J(D, 'highlight')['duration']['full']}ms) and the loading turn ({J(D, 'loading')['duration']['full']}ms) don't move, so they follow their own rules: a highlight takes three flash intervals, a turn takes a second (Loading and highlights).", "small", "color/fg/muted", fill=True)
    rules(k, b, [("Exits are shorter", "A menu that leaves slower than it came holds up the next thing people do (M3)."),
                 ("No delays to stagger", "Items arriving one after another add up: ten items × 50ms is half a second of waiting. Bring a group in together, with motion/change.")])
    finish(k, b, "Duration follows distance")
    return b


# ------------------------------------------------------------ Curves
def curves(k, D):
    b = start(k, "Curves", f"Four curves, each defined by how fast it moves at its start and its end, as a multiple of its average speed. None goes faster than {D['limits']['peakSpeed']}×, so no single frame jumps.")
    chk = {c["id"]: c["summary"] for c in D["checks"]}
    s = k.section(b, "The four curves", f"Progress over time on top (the dashed line is an even speed). Under it the speed, as a multiple of the average (grey line); the red line is the {D['limits']['peakSpeed']}× limit. M4 {chk['M4']}.")
    r = k.row(s, 20, align="min")
    for cv in D["curves"]:
        doc(D, cv["token"], "Curves")
        c = k.card(r, 12, 20)
        k.text(c, fig(cv["token"]), "mono", weight=600)
        curve_graph(k, c, cv)
        k.text(c, cv["css"], "mono", "color/fg/muted", fill=True)
        fmt = lambda v: f"{v:g}×"
        k.text(c, f"start {fmt(cv['start'])} · end {fmt(cv['end'])} · fastest {fmt(round(cv['peak'], 2))}", "small", fill=True)
        k.text(c, cv["use"], "small", "color/fg/muted", fill=True)
    rr = k.row(b, 24, align="min")
    note(k, rr, "Arriving lands at rest; leaving starts from rest", "The enter curve starts at the speed limit and settles; the exit curve is the enter curve played backwards. Things that change in place start and land at rest.")
    note(k, rr, "Linear is for the loop", "Linear is only for the loading turn — anywhere else it looks mechanical, starting and stopping at full speed.")
    s = k.section(b, "Frame by frame", "What a screen at 60 frames a second draws for each job that moves: one dot per frame, along the whole distance. Even gaps mean even speed; no gap is far wider than the others.")
    rows = []
    for job, part in [("change", "frames"), ("floating", "frames"), ("floating", "exitFrames"), ("modal", "frames"), ("modal", "exitFrames")]:
        f_ = J(D, job)[part]
        rows.append((job, "arriving" if part == "frames" else "leaving", f_))
    for job, way, f_ in rows:
        row = k.row(s, 24, align="center")
        k.text(row, f"motion/{job} {way}", "mono", width=260)
        spacing_chart(k, row, f_["progress"], 480)
        k.text(row, f"{f_['frames']} frames in {f_['ms']}ms · largest step {f_['largest']}px of {f_['px']}px · first {f_['first']}px", "small", "color/fg/muted", fill=True)
    s = k.section(b, "The common slip", "A curve that starts at full speed, on the dialog's 16px.")
    sp = D["slip"]
    def avoid(a):
        cv = {"name": "slip", "path": sp["path"], "box": CURVE(D, "enter")["box"]}
        curve_graph(k, a, cv, "cubic-bezier(0, 0, 0, 1)", show_speed=False)
        spacing_chart(k, a, sp["modal"]["progress"], 420, "Dialog frames")
    def do(d):
        curve_graph(k, d, CURVE(D, "enter"), "motion/easing/enter", show_speed=False)
        spacing_chart(k, d, sp["modalEnter"]["progress"], 420, "Dialog frames")
    slip(k, s, D, 1, avoid, do)
    rules(k, b, [("No springs or bounces", "A curve that overshoots moves past where things belong and back — more movement for no meaning, and not something reduced motion can turn into a fade."),
                 ("Curves come from the job", "Never ease, ease-in-out or a cubic-bezier() of your own (MR-01); Tailwind's ease-in, ease-out and ease-in-out are removed from the theme.")])
    finish(k, b, "Curves")
    return b


# ------------------------------------------------------------ Reduced motion
def reduced(k, D):
    b = start(k, "Reduced motion", f"Reduced motion is a mode, not an afterthought. Reduced means fade only: no job moves, transitions fade in {D['limits']['reducedMaxMs']}ms or less, the loading indicator stops turning, and highlights fade as before — a fade is not movement.")
    s = k.section(b, "Every job, two modes", "Full · reduced, from the build.")
    rows = []
    for pj in D["reduced"]["perJob"]:
        j = J(D, pj["job"])
        def say(m):
            if pj["job"] == "loading": return f"{j['duration'][m]}ms, " + ("turns" if m == "full" else f"pulses (never below {D['limits']['indicatorMin']}:1)")
            if not j["distance"]: return f"{j['duration'][m]}ms"
            base = f"{j['duration'][m]}ms, " + (f"moves {j['distance'][m]}px" if j["distance"][m] else "fades in place")
            return base + (f", leaves in {j['exit']['duration'][m]}ms" if j["exit"] else "")
        rows.append([f"motion/{pj['job']}", say("full"), say("reduced")])
    def cell(c, i, v, w):
        if i == 0: k.text(c, v, "mono"); return True
        return False
    grid_table(k, s, [("Job", 220), ("Full", None), ("Reduced", None)], rows, cell)
    s = k.section(b, "One table, two modes", "The same rows, bound to the Motion variables, in a frame set to full and one, below it, set to reduced. Bars are durations (1px = 1ms; grey: leaving), the text is each job's curve, the small bar its distance.")
    two_modes(k, s, lambda box, m: [live_row(k, box, D, j["job"], m) for j in D["jobs"] if not j["product"]], name="One table, two modes", stack=True)
    s = k.section(b, "How it is switched", "The reader decides; ds follows.")
    c = k.card(s, 10, 28)
    for item in D["reduced"]["how"]:
        rr = k.row(c, 10, align="min"); k.text(rr, "✓", "body", "color/fg/brand"); k.text(rr, sl(cap(item)), "body", fill=True)
    k.text(s, "A product that offers its own setting writes it to <html> and remembers it; with nothing set, the system setting decides:", "small", "color/fg/muted", fill=True)
    code(k, s, ['<label>Motion', '  <select id="motion">', '    <option value="">Same as my device</option>', '    <option value="reduced">Reduced</option>', '    <option value="full">Full</option>', '  </select>', '</label>'])
    rules(k, b, [("Keep one clear signal", "In reduced motion a change still shows: it fades. Removing the change altogether hides it."),
                 ("Your own animations too", "Anything you animate outside the tokens needs its own reduced path — or it keeps moving for the people who asked it to stop (MR-03, MR-04)."),
                 ("Never force full motion", "data-motion=\"full\" comes only from the reader's own choice, never as a default (MR-10).")])
    finish(k, b, "Reduced motion")
    return b


# ------------------------------------------------------------ Opening and closing
def opening(k, D):
    b = start(k, "Opening and closing", "What opens over the page moves with the job of its elevation level: motion/floating for menus, popovers, tooltips, toasts and the drawer, motion/modal for dialogs. tokens.css already does it — open them the way the Elevation foundation says and they animate both ways, and only fade in reduced motion.")
    s = k.section(b, "The tokens", "Values for this product, full · reduced.")
    motion_table(k, s, D, [f"motion.{j}.{p}" for j in ("floating", "modal") for p in ("duration", "easing", "distance", "exit-duration", "exit-easing")], "Opening and closing")
    s = k.section(b, "Try them", "A menu, a toast and a dialog, each a component set per mode, shown open. In the full frame they move their job's distance; in the reduced frame the same offsets are 0 and they only fade. Click one to close it, again to open it.")
    def draw(box, m):
        fj, mj = J(D, "floating"), J(D, "modal")
        r = k.row(box, 24, align="min"); setp(k, r, clip=False)
        ex(k, "Menu", m, r, {"state": "open"}); ex(k, "Toast", m, r, {"state": "shown"})
        k.text(box, f"Menu and toast: {fj['duration'][m]}ms in, {fj['exit']['duration'][m]}ms out, {fj['distance'][m]}px.", "small", "color/fg/muted", fill=True)
        ex(k, "Dialog", m, box, {"state": "open"})
        k.text(box, f"Dialog: {mj['duration'][m]}ms in with the scrim, {mj['exit']['duration'][m]}ms out, {mj['distance'][m]}px.", "small", "color/fg/muted", fill=True)
    two_modes(k, s, draw)
    present_hint(k, s)
    s = k.section(b, "The dialog, frame by frame", "Some of the frames the screen draws while the dialog arrives, at their real offsets and opacities.")
    mj = J(D, "modal")
    def draw2(box, m):
        if m == "full":
            n = mj["frames"]["frames"]
            film(k, box, mj["frames"]["progress"], mj["distance"]["full"], [1, 2, 4, 6, 9, n], mj["duration"]["full"], w=180, h=116)
        else:
            rf = D["reducedFrames"]["modal"]
            film(k, box, rf["progress"], 0, list(range(1, len(rf["progress"]) + 1)), rf["ms"], w=180, h=116)
    two_modes(k, s, draw2, pad=20, stack=True)
    s = k.section(b, "What opens how", "The markup is the Elevation foundation's; the motion comes with it.")
    grid_table(k, s, [("What", 300), ("Markup", None), ("Comes from", 340)], [[r_["what"], r_["html"], r_["from"]] for r_ in D["ready"]],
               lambda c, i, v, w: (k.text(c, v, "mono", fill=True), True)[1] if i == 1 else False)
    note(k, b, "How it works", "A popover or dialog starts from its \"before\" look (@starting-style: transparent, the job's distance away) and moves to its resting place with the job's duration and curve. When it closes it goes back with the leaving duration and curve, and display and overlay transition with allow-discrete, so it stays shown — and in the top layer — until it has faded. Browsers that can't do this open and close at once.")
    s = k.section(b, "The common slip", "A dialog that slides in from off the screen.")
    def avoid(a):
        w = se.stage(k, a, 420, 220, "Slide from off the screen")
        dl = se.level(k, w, "modal", "Dialog", w=220, h=90, pad=None, gap=None); place(k, dl, 100, 170)
        label(k, w, "↑ the whole window: 800px on an 800px-tall screen", 16, 12, "color/fg/danger", "small")
    def do(d):
        w = se.stage(k, d, 420, 220, "Rises 16px")
        sc = free(k, w, "Scrim", 420, 220, fill="#000000"); k.f.cmd("variable.bind", ids=[sc], field="fill", variable="elevation/modal/scrim")
        dl = se.level(k, w, "modal", "Dialog", w=220, h=90, pad=None, gap=None); place(k, dl, 100, 65)
        label(k, w, f"↑ {mj['distance']['full']}px in {mj['duration']['full']}ms", 16, 12, "color/fg/on-brand", "small")
    slip(k, s, D, 2, avoid, do)
    rules(k, b, [("Nothing of your own on top", "Don't add transitions or animations to .ds-floating popovers or dialog.ds-modal, and don't animate them with JavaScript (MR-05)."),
                 ("Focus moves at once", "Moving focus into a dialog or menu happens when it opens, not when its animation ends — the animation is only how it looks."),
                 ("Leaving never blocks", f"A closing menu doesn't hold up the next click: it leaves in {J(D, 'floating')['exit']['duration']['full']}ms and is out of the way of the pointer from the start.")])
    finish(k, b, "Opening and closing")
    return b


# ------------------------------------------------------------ Loading and highlights
def loops(k, D):
    L, Hh = D["loading"], D["highlight"]
    b = start(k, "Loading and highlights", "Two jobs that aren't about something arriving: the loading indicator, which runs while work runs, and the highlight, which draws the eye to a change once.")
    s = k.section(b, "The tokens", "Values for this product, full · reduced.")
    motion_table(k, s, D, ["motion.loading.duration", "motion.loading.easing", "motion.highlight.duration", "motion.highlight.easing"], "Loading and highlights")
    chk = {c["id"]: c["summary"] for c in D["checks"]}
    s = k.section(b, "Loading", f"One turn every {L['turnMs']}ms while work runs, and gone when it ends. In reduced motion it stops turning and pulses every {L['pulseMs']}ms, never below {L['dim']} opacity — the lowest that keeps color/fg/icon at {D['limits']['indicatorMin']}:1 on every surface (M5 {chk['M5']}).")
    def draw(box, m):
        if m == "full":
            k.text(box, f"Every {L['turnMs'] // 10}ms of one turn", "caption", "color/fg/muted", weight=400)
            r = k.frame(box, "Turn", "horizontal", 10, 0, align="min")
            for st in L["turn"]:
                col = k.frame(r, f"{st['t']}ms", gap=4, align="center"); ring_cell(k, col, st["deg"]); k.text(col, f"{round(st['t'])}", "caption", "color/fg/subtle", weight=400)
        else:
            k.text(box, f"Every {L['pulseMs'] // 10}ms of one pulse", "caption", "color/fg/muted", weight=400)
            r = k.frame(box, "Pulse", "horizontal", 10, 0, align="min")
            for st in L["pulse"]:
                col = k.frame(r, f"{st['t']}ms", gap=4, align="center"); ring_cell(k, col, 0, st["opacity"]); k.text(col, f"{round(st['t'])}", "caption", "color/fg/subtle", weight=400)
    two_modes(k, s, draw)
    code(k, s, ['<p role="status"><svg class="ds-loading" aria-hidden="true" …></svg> Saving…</p>'])
    s = k.section(b, "Highlight", f"A color/bg/brand-subtle tint that fades over {J(D, 'highlight')['duration']['full']}ms, back to the element's own background — the same in both modes. {sl(Hh['rule'])}.")
    r = k.row(s, 40, align="min")
    col = k.frame(r, "Try it", gap=10)
    ex(k, "Highlight", "full", col)
    k.text(col, "Click the card: the count changes and its tint fades.", "small", "color/fg/muted", width=320)
    col = k.card(r, 10, 20, name="Tint left")
    k.text(col, f"The tint left every {J(D, 'highlight')['duration']['full'] // 10}ms (motion/easing/exit: it holds, then goes)", "caption", "color/fg/muted", weight=400)
    fade_strip(k, col, [x["tint"] for x in Hh["samples"]], 28, "Tint", [str(round(x["t"])) for x in Hh["samples"]], "color/bg/brand-subtle")
    code(k, s, ["el.classList.remove('ds-highlight');", "requestAnimationFrame(() => el.classList.add('ds-highlight'));"])
    note(k, b, "Flashes", f"More than three flashes in a second can trigger seizures (WCAG 2.3.1). A highlight is one change over {J(D, 'highlight')['duration']['full']}ms; the reduced loading pulse is one every {L['pulseMs']}ms; nothing in ds changes brightness faster than once every {D['limits']['flashMinMs']}ms (M2 {chk['M2']}).")
    s = k.section(b, "The common slips", "Measured in this build.")
    slip(k, s, D, 3)
    slip(k, s, D, 4)
    rules(k, b, [("One loop", f".ds-loading is the only animation that runs on. Anything else that keeps moving — a carousel, an animated illustration — needs a pause or stop control, or stops within {D['limits']['pauseAfterMs'] // 1000} seconds (WCAG 2.2.2, MR-06)."),
                 ("Progress after five seconds", "Work that can take longer shows progress in words or a bar; a spinner alone says nothing about how long."),
                 ("Highlight once", "Never on every tick of a value that updates many times a second; never as a blink or a pulse that repeats (MR-08).")])
    finish(k, b, "Loading and highlights")
    return b


# ------------------------------------------------------------ What never moves
def still(k, D):
    b = start(k, "What never moves", "Some things must stay still for people to read, steer and find their place. The motion checker and audit look for each of these.")
    s = k.section(b, "Never", "Each with the reason and what to do instead.")
    grid_table(k, s, [("Never", 300), ("Because", None), ("Instead", 460)], [
        ["The focus ring animating in", "For its first frames it isn't there; keyboard users lose their place", "It appears at once — tokens.css draws it and no transition list includes outline (M6)"],
        ["Text moving while it is read", "Auto-advancing carousels, rolling digits and marquees move the words out from under the reader", "Changes happen when the reader asks; a changed value gets one highlight"],
        ["Movement tied to scrolling", "Parallax and scroll-linked effects are the strongest trigger of motion sickness on the web", "Content scrolls; nothing else moves with it"],
        [sl(cap(D["mistakes"][6]["mistake"])), sl(cap(D["mistakes"][6]["measured"])), sl(cap(f"{D['mistakes'][6]['fix']} — {D['mistakes'][6]['fixValue']}"))],
        [sl(cap(D["mistakes"][5]["mistake"])), sl(cap(D["mistakes"][5]["measured"])), sl(cap(f"{D['mistakes'][5]['fix']} — {D['mistakes'][5]['fixValue']}"))],
        ["Autoplay", "A video or carousel that starts by itself moves beside the content people came for", "It waits to be started, or has a pause control in reach (WCAG 2.2.2)"]])
    s = k.section(b, "The focus ring", "Left: a ring in a transition list (250ms, ease), every other frame. Right: the ring as tokens.css draws it.")
    rs = D["ringSlip"]
    picks = rs["frames"][::2]
    r = k.row(s, 24, "Do and avoid", align="min")
    for kind, ops in [("avoid", [x["opacity"] for x in picks]), ("do", [1] * len(picks))]:
        col = k.frame(r, kind, gap=12, sizingH="fill"); k.inst(kind, col)
        k.text(col, "The ring fades in over 250ms" if kind == "avoid" else "The ring is there on the first frame", "body", weight=600)
        row = k.frame(col, "Frames", "horizontal", 24, 0, align="min"); setp(k, row, clip=False)
        for x, o in zip(picks, ops):
            cc = k.frame(row, f"{x['t']}ms", gap=10, align="center"); setp(k, cc, clip=False)
            holder = free(k, cc, "Button and ring", 96, 44)
            rg = ring(k, holder, "control"); place(k, rg, 4, 4); button(k, rg, "Save"); setp(k, rg, opacity=o)
            top = button(k, holder, "Save"); place(k, top, 6, 6)  # the button itself stays opaque; only its ring fades
            k.text(cc, f"{x['t']}ms", "caption", "color/fg/subtle", weight=400)
    s = k.section(b, "An error", "Shaking a field says nothing a screen reader can hear and moves in reduced motion. The message and the state border say what is wrong.")
    def avoid(a):
        r_ = k.row(a, 8, align="min", fill=False)
        for dx in (-6, 6, -4, 0):
            cc = k.frame(r_, f"{dx}px", gap=4, w=140)
            sh = k.frame(cc, "Shaken", "horizontal", 0, 0, w=140); setp(k, sh, paddingLeft=6 + dx, clip=False)
            field(k, sh, "Due date", "31 Feb", w=124)
            k.text(cc, f"{dx:+d}px" if dx else "at rest", "caption", "color/fg/subtle", weight=400)
    def do(d):
        field(k, d, "Due date", "31 Feb", "invalid", w=300, msg="February has 28 or 29 days.")
    slip(k, s, D, 5, avoid, do)
    rules(k, b, [("Scale, rotate and skew", "Only the loading indicator turns. Nothing else grows, shrinks or spins to make a point: a change of size reads as movement toward or away from the reader."),
                 ("Nothing from off the screen", f"The longest move is {D['limits']['maxDistance']}px; a dialog doesn't slide up the whole window, a drawer doesn't sweep across it.")])
    finish(k, b, "What never moves")
    return b


# ------------------------------------------------------------ Choosing motion
def choosing(k, D):
    b = start(k, "Choosing motion", "Four questions: does it need motion at all? which job? which way does it move? and what must never move?")
    for dcs in D["decisions"]:
        s = k.section(b, dcs["what"], dcs["question"])
        grid_table(k, s, [("When", None), ("Use", 660)], [[sl(a), sl(u)] for a, u in dcs["answers"]])
    s = k.section(b, "Worked example: a project page", "One part at a time. Each part is drawn at rest; the tags name its job.")
    fj, mj, cj, hj = J(D, "floating"), J(D, "modal"), J(D, "change"), J(D, "highlight")
    r = k.row(s, 32, align="min")
    win = se.stage(k, r, 720, 440, "Project page")
    h = se.header(k, win, 720); se.place(k, h, 0, 0)
    for i, (tt, sub) in enumerate([("Atlas", "12 open tasks"), ("Beacon", "4 open tasks"), ("Compass", "No open tasks")]):
        c = se.proj_card(k, win, tt, sub, 200); se.place(k, c, 32 + i * 224, 96)
    m = se.menu(k, win, ("Rename", "Duplicate", "Delete…"), 170); se.place(k, m, 90, 170 + fj["distance"]["full"])
    t = se.level(k, win, "floating", "Toast", w=220, pad="space.inset.md"); se.place(k, t, 476, 372); spec(k, t, "Atlas deleted.", "type.body.md")
    col = k.frame(r, "Parts", gap=10, sizingH="fill")
    for part, lv, why in [
            ("Hovering a project card", "motion/feedback", f"The card's fill changes in {J(D, 'feedback')['duration']['full']}ms; nothing moves."),
            ("The card's \"more\" menu", "motion/floating · a popover", f"It drops {fj['distance']['full']}px into place in {fj['duration']['full']}ms and leaves in {fj['exit']['duration']['full']}ms."),
            ("\"Delete project?\"", "motion/modal · showModal()", f"It rises {mj['distance']['full']}px in {mj['duration']['full']}ms while the scrim fades in."),
            ("The card leaving the list", "motion/change", f"It fades and moves {cj['distance']['full']}px up in {cj['duration']['full']}ms; the cards after it close the gap at once."),
            ("\"Atlas deleted.\" toast", "motion/floating · layer/toast", f"It comes up {fj['distance']['full']}px from the bottom."),
            ("The open-task count", "motion/highlight", f"Its tint fades over {hj['duration']['full']}ms, once."),
            ("With reduced motion", "the reduced mode", f"Each of these fades in place in {D['limits']['reducedMaxMs']}ms or less.")]:
        rr = k.frame(col, part, gap=2, sizingH="fill"); k.text(rr, part, "body", weight=600); k.tag(rr, lv); k.text(rr, why, "small", "color/fg/muted", fill=True)
    s = k.section(b, "Do and avoid", "Measured in this build.")
    grid_table(k, s, [("Avoid", 360), ("Measured", None), ("Do", 460)], [[sl(cap(m_["mistake"])), sl(cap(m_["measured"])), sl(f"{m_['fix']} — {m_['fixValue']}")] for m_ in D["mistakes"]])
    finish(k, b, "Choosing motion")
    return b


# ------------------------------------------------------------ Readers' settings and products
def settings(k, D):
    b = start(k, "Readers' settings and products", "People ask their system for less motion, zoom, enlarge text and switch to forced colours; products add jobs of their own. Motion is built so none of that breaks.")
    r = k.row(b, 24, align="min")
    note(k, r, "Reduced motion", "The system setting (prefers-reduced-motion) switches every job to its reduced value, unless the reader chose otherwise in the product (data-motion on <html>). The motion audit runs every page both ways and measures what still moves.")
    note(k, r, "Zoom and bigger text", "Distances are px and scale with zoom like everything else; durations don't change. Nothing in ds animates size or layout, so text growing never sets anything moving (WCAG 1.4.4, 1.4.10).")
    note(k, r, "Forced colours", "Animations still run in forced colours; the ready transitions only move and fade, so nothing depends on a colour the system replaces.")
    s = k.section(b, "Adding a job", f"Most motion fits one of the six. If a product needs another (a carousel slide, a bottom sheet), name it by what moves, say whether it changes in place or arrives and leaves, and how far it moves on the spacing scale. The build computes the duration ({next(x['ms'] for x in D['rule']['samples'] if x['px'] == 24)}ms for 24px), the curves and the reduced mode, and refuses durations, curves, names by look or speed, loops and anything further than {D['limits']['maxDistance']}px.")
    code(k, s, ['{ "motion": { "jobs": [', '  { "name": "motion.carousel", "kind": "in-place", "distance": "space.6",', '    "description": "Slides of a carousel the reader steps through" }', '] } }'])
    k.text(s, "Durations and curves are not config choices: they are computed, so every product gets the same checked motion.", "small", "color/fg/muted", fill=True)
    s = k.section(b, "What the build checks", "Every motion check, and the result for this build. WCAG 2.3.3 is AAA; ds holds it as a rule, so M1 fails the build like an AA check.")
    grid_table(k, s, [("Check", 90), ("What it checks", None), ("WCAG", 140), ("Result", 160)], [[c_["id"], c_["title"], f"{c_['wcag']} ({c_['level']})", f"{c_['status']} · {c_['summary']}"] for c_ in D["checks"]])
    finish(k, b, "Readers' settings and products")
    return b


# ------------------------------------------------------------ Try it (prototype flows)
TRY = [("Hover and change", [("Button", "Hover the button: its fill changes."), ("Task list", "Click the list: the middle task leaves, then the gap closes; click again to bring it back.")]),
       ("Opening and closing", [("Menu", "Click: the menu opens; click again: it closes."), ("Toast", "Click: the toast comes up; it leaves after four seconds."), ("Dialog", "Click: the dialog opens over the scrim; click again: it closes.")]),
       ("Highlight", [("Highlight", "Click: the count changes and its tint fades — the same in both modes.")])]


def try_it(k, D):
    k.page("Try it")
    frames = []
    x = 0
    for title, items in TRY:
        fr = k.frame(name=title, w=1440, pad=64, gap=32, bind="color/bg/canvas", x=x, y=0)
        se.mode(k, fr, "Light"); mmode(k, fr, "full"); k.f.cmd("variable.setMode", ids=[fr], collection="Responsive", mode="lg"); dmode(k, fr, "default")
        k.text(fr, "Motion · Try it", "eyebrow", "color/fg/brand")
        k.text(fr, title, "h1")
        k.text(fr, "Present this frame (or pick its flow in the prototype panel). The left column is the full mode, the right column the reduced mode; each example's transitions carry that mode's numbers from the build.", "lead", "color/fg/muted", fill=True)
        def draw(box, m):
            for key, how in items:
                c = k.frame(box, key, gap=10, sizingH="fill"); setp(k, c, clip=False)
                k.text(c, key, "h3"); ex(k, key, m, c); k.text(c, how, "small", "color/fg/muted", fill=True)
        two_modes(k, fr, draw)
        k.f.cmd("proto.flow.add", start=fr, name=title)
        frames.append(fr)
        x += 1540
    return frames


CHAPTER_FNS = [principles, tokens, jobs, duration, curves, reduced, opening, loops, still, choosing, settings]

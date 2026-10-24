"""Builds the colour foundation file in FigCraft from the engine's data. Writes .figcraft + .fig."""
import json, sys, time
sys.path.insert(0, '/home/claude/fc')
from mcp import FigCraft

D = json.load(open('/home/claude/fc/data.json'))
f = FigCraft()
f.cmd("variable.import", variables="/home/claude/fc/vars.json")

FONT = "Inter"
W = 1440

def frame(parent=None, name="frame", direction="vertical", gap=0, pad=0, w=None, h=None, fill=None, bind=None,
          sizingH=None, sizingV="hug", radius=None, stroke=None, strokeBind=None, align=None, wrap=False, x=0, y=0):
    props = {"layout": direction, "gap": gap, "padding": pad, "fills": [] if fill is None else [fill]}
    if sizingV: props["sizingV"] = sizingV
    if radius: props["cornerRadius"] = radius
    if align: props["crossAlign"] = align
    if wrap: props["wrap"] = True
    args = dict(type="frame", name=name, props=props, x=x, y=y)
    if w: args["width"] = w
    if h: args["height"] = h
    if parent is not None: args["parent"] = parent
    nid = f.tool("create_node", **args)["id"]
    if sizingH is None and w is None:
        sizingH = "hug"
    if sizingH:
        f.tool("set_properties", ids=[nid], props={"sizingH": sizingH})
    if bind:
        f.cmd("variable.bind", ids=[nid], field="fill", variable=bind)
    if stroke or strokeBind:
        f.tool("set_properties", ids=[nid], props={"strokes": [stroke or "#000000"], "strokeWeight": 1, "strokeAlign": "inside"})
        if strokeBind:
            f.cmd("variable.bind", ids=[nid], field="stroke", variable=strokeBind)
    return nid

def text(parent, s, size=16, weight=400, color="color/fg/default", fill=False, lh=None, tabular=False, mono=False):
    props = {"fontFamily": "JetBrains Mono" if mono else FONT, "fontSize": size, "fontWeight": weight}
    props["lineHeight"] = lh or round(size * (1.5 if size <= 18 else 1.25))
    nid = f.tool("create_node", type="text", parent=parent, text=s, props=props)["id"]
    if fill:
        f.tool("set_properties", ids=[nid], props={"sizingH": "fill"})
    if tabular:
        try: f.cmd("text.setFeatures", ids=[nid], features={"tnum": True})
        except Exception: pass
    if color.startswith("#"):
        f.tool("set_properties", ids=[nid], props={"fills": [color]})
    else:
        f.cmd("variable.bind", ids=[nid], field="fill", variable=color)
    return nid

def rect(parent, w, h, bind=None, radius=6, fill=None):
    nid = f.tool("create_node", type="rectangle", parent=parent, width=w, height=h,
                 props={"cornerRadius": radius, **({"fills": [fill]} if fill else {})})["id"]
    if bind: f.cmd("variable.bind", ids=[nid], field="fill", variable=bind)
    return nid

def page(name):
    pid = f.cmd("page.add", name=name)
    pid = pid.get("id") if isinstance(pid, dict) else pid
    f.cmd("page.select", id=pid)
    return pid

def board(title, subtitle, mode="Light", x=0, w=W, name=None):
    b = frame(name=name or title, w=w, pad=64, gap=40, bind="color/bg/canvas", x=x)
    f.cmd("variable.setMode", ids=[b], collection="Color", mode=mode)
    head = frame(b, "Header", gap=8, sizingH="fill")
    text(head, "ds · Colour", 14, 600, "color/fg/brand")
    text(head, title, 40, 700)
    text(head, subtitle, 18, 400, "color/fg/muted", fill=True, lh=28)
    return b

def card(parent, gap=16, pad=32, sizingH="fill", direction="vertical", bind="color/bg/surface", name="Card"):
    return frame(parent, name, direction, gap, pad, bind=bind, sizingH=sizingH, radius=16, strokeBind="color/border/subtle")

made = {}
# ---------------------------------------------------------------- Cover
page("Cover")
c = frame(name="Cover", w=1600, pad=96, gap=32, bind="color/bg/canvas")
text(c, "ds · Foundations", 16, 600, "color/fg/brand")
text(c, "Colour", 120, 700, lh=128)
text(c, "Accessible by construction. Every shade is computed, every pair is checked, Light and Dark.", 28, 400, "color/fg/muted", fill=True, lh=40)
strip = frame(c, "Brand scale", "horizontal", 0, 0, sizingH="fill")
for s in D["scales"][0]["steps"]:
    r_ = rect(strip, 60, 120, bind=s["v"], radius=0)
    f.tool("set_properties", ids=[r_], props={"sizingH": "fill"})
meta = frame(c, "Meta", "horizontal", 32, 0, sizingH="fill")
for k, v in [("WCAG", "2.2 AA"), ("Variables", "216"), ("Modes", "Light · Dark"), ("Pairs checked", str(len(D["pairs"]["Light"]) * 2))]:
    m = frame(meta, k, gap=4)
    text(m, k, 14, 500, "color/fg/subtle")
    text(m, v, 24, 600)
made["Cover"] = c

# ---------------------------------------------------------------- Overview
page("Overview")
b = board("How colour works", "Three ideas carry the whole foundation: contrast grades, roles instead of raw colours, and pairs as a contract.")
grid = frame(b, "Principles", "horizontal", 24, 0, sizingH="fill")
for title, body in [
    ("Contrast grades", "Each shade has a grade from 0 (white) to 100 (black). Contrast depends only on the gap between two grades — in every hue. Subtract to know if a pair passes."),
    ("Roles, not colours", "Designs use semantic roles (bg/surface, fg/muted, border/input). Primitives like brand/60 only feed roles. Change a role once, every screen follows — in Light and Dark."),
    ("Pairs are a contract", "Every text and border role lists the backgrounds it may sit on. Each listed pair is measured on every build. A pair that isn't listed isn't supported."),
]:
    k = card(grid, sizingH="fill")
    text(k, title, 22, 600)
    text(k, body, 16, 400, "color/fg/muted", fill=True)

g = card(b, name="Grade rule")
text(g, "The grade rule", 22, 600)
text(g, "contrast = 21 ^ (gap ÷ 100)", 18, 500, "color/fg/muted", mono=True)
tbl = frame(g, "Gaps", "horizontal", 16, 0, sizingH="fill")
for gap, ratio, use in [(40, "≥ 3.34 : 1", "Large text, borders, icons, chart marks"), (50, "≥ 4.53 : 1", "All text"), (70, "≥ 8.33 : 1", "AAA text")]:
    k = card(tbl, 12, 24, sizingH="fill", bind="color/bg/surface-sunken", name=f"Gap {gap}")
    ex = frame(k, "Example", "horizontal", 0, 0)
    a = 10; bgrade = a + gap
    sw1 = frame(ex, "a", w=64, h=64, sizingV=None, bind=f"color/brand/{a}")
    sw2 = frame(ex, "b", w=64, h=64, sizingV=None, bind=f"color/brand/{bgrade}")
    text(k, f"Gap {gap}", 20, 600)
    text(k, f"{ratio}", 16, 500, "color/fg/default", tabular=True)
    text(k, use, 14, 400, "color/fg/muted", fill=True)
text(g, "Worst case measured across 21 hue and chroma tests, after rounding to hex. Each example: brand/10 next to brand/(10 + gap).", 14, 400, "color/fg/subtle", fill=True)

tiers = card(b, name="Tiers", direction="horizontal", gap=24)
for t, d in [("Primitives", "brand/10 … brand/95, neutral, success, warning, danger, info, chart, shadow. Hidden from publishing; never used directly."),
             ("→", ""), ("Color (Light · Dark)", "bg/*, fg/*, border/*, data/*, shadow/*. Every value is an alias to a primitive."),
             ("→", ""), ("Components (Phase 3)", "button/primary/bg … aliases a Color role.")]:
    if t == "→":
        text(tiers, "→", 28, 400, "color/fg/subtle")
        continue
    k = frame(tiers, t, gap=6, sizingH="fill")
    text(k, t, 18, 600)
    text(k, d, 14, 400, "color/fg/muted", fill=True)
made["Overview"] = b

# ---------------------------------------------------------------- Scales
page("Scales")
b = board("Scales", "Six hues × 19 grades. Same grade = same contrast in every hue. Contrast vs white (W) and black (B) shown under each shade.", w=1760)
for sc in D["scales"]:
    row = frame(b, sc["hue"], gap=12, sizingH="fill")
    text(row, sc["hue"].capitalize(), 18, 600)
    sw = frame(row, "Steps", "horizontal", 6, 0, sizingH="fill")
    for s in sc["steps"]:
        cell = frame(sw, f"{sc['hue']}/{s['g']}", gap=4, sizingH="fill")
        r_ = rect(cell, 80, 72, bind=s["v"], radius=8)
        f.tool("set_properties", ids=[r_], props={"sizingH": "fill"})
        text(cell, str(s["g"]), 13, 600, tabular=True)
        text(cell, s["hex"], 11, 400, "color/fg/muted", mono=True)
        text(cell, f"W {s['w']}", 11, 400, "color/fg/subtle", tabular=True)
        text(cell, f"B {s['b']}", 11, 400, "color/fg/subtle", tabular=True)
made["Scales"] = b

# ---------------------------------------------------------------- Roles (Light + Dark)
page("Roles")
groups = [("Backgrounds", "color.bg."), ("Text and icons", "color.fg."), ("Borders", "color.border."), ("Data", "color.data."), ("Shadow", "color.shadow.")]
for i, mode in enumerate(["Light", "Dark"]):
    b = board(f"Roles — {mode}", "What designs use. Each role aliases a primitive; switch the frame's mode and every role follows.", mode=mode, x=i * 1100, w=1040, name=f"Roles {mode}")
    for gname, prefix in groups:
        k = card(b, 8, 24, name=gname)
        text(k, gname, 20, 600)
        for t in [t for t in D["sem"] if t["path"].startswith(prefix)]:
            row = frame(k, t["v"], "horizontal", 16, 6, sizingH="fill", align="center")
            if prefix == "color.fg.":
                sw = frame(row, "swatch", w=56, h=40, sizingV=None, radius=8, bind="color/bg/surface-sunken", direction="horizontal", align="center")
                f.tool("set_properties", ids=[sw], props={"mainAlign": "center"})
                text(sw, "Aa", 18, 700, t["v"])
            elif prefix == "color.border.":
                sw = frame(row, "swatch", w=56, h=40, sizingV=None, radius=8, bind="color/bg/surface")
                f.tool("set_properties", ids=[sw], props={"strokes": ["#000000"], "strokeWeight": 2, "strokeAlign": "inside"})
                f.cmd("variable.bind", ids=[sw], field="stroke", variable=t["v"])
            else:
                rect(row, 56, 40, bind=t["v"], radius=8)
            col = frame(row, "label", gap=2, sizingH="fill")
            text(col, t["v"], 14, 600, mono=True)
            text(col, t["desc"], 13, 400, "color/fg/muted", fill=True)
            text(row, t["light" if mode == "Light" else "dark"].upper()[:9], 12, 400, "color/fg/subtle", mono=True)
    made[f"Roles {mode}"] = b

# ---------------------------------------------------------------- Pairs
page("Pairs")
text_bgs = ["canvas", "surface", "surface-raised", "surface-overlay", "surface-sunken", "surface-hover", "surface-pressed", "selected"]
for i, mode in enumerate(["Light", "Dark"]):
    b = board(f"Pairing matrix — {mode}", "Each text role on each background it is allowed on, with the measured contrast. All pass 4.5 : 1.", mode=mode, x=i * 1640, w=1580, name=f"Pairs {mode}")
    ratios = {(p["fg"], p["bg"]): p["ratio"] for p in D["pairs"][mode]}
    tbl = card(b, 6, 24, name="Matrix")
    head = frame(tbl, "head", "horizontal", 6, 0, sizingH="fill")
    lab = frame(head, "corner", w=200, h=24, sizingV=None)
    for bgn in text_bgs:
        hc = frame(head, bgn, sizingH="fill")
        text(hc, bgn, 12, 600, "color/fg/muted")
    fgs = []
    for p in D["pairs"][mode]:
        if p["kind"] == "text" and p["bg"] == "color/bg/canvas" and p["fg"] not in fgs: fgs.append(p["fg"])
    for fg in fgs:
        row = frame(tbl, fg, "horizontal", 6, 0, sizingH="fill", align="center")
        lc = frame(row, "label", w=200, h=44, sizingV=None, direction="horizontal", align="center")
        text(lc, fg.replace("color/", ""), 13, 600, mono=True)
        for bgn in text_bgs:
            ratio = ratios.get((fg, f"color/bg/{bgn}"))
            cell = frame(row, bgn, "horizontal", 8, 10, sizingH="fill", radius=8, bind=f"color/bg/{bgn}", align="center")
            text(cell, "Aa", 16, 700, fg)
            text(cell, f"{ratio:.2f}" if ratio else "—", 13, 500, fg, tabular=True)
    made[f"Pairs {mode}"] = b

# ---------------------------------------------------------------- Data
page("Data")
for i, mode in enumerate(["Light", "Dark"]):
    dd = D["data"][mode]
    b = board(f"Data colours — {mode}", "Gain and loss differ in lightness, not just hue, and always carry a sign or arrow. Chart colours stay apart for colour-blind viewers.", mode=mode, x=i * 1100, w=1040, name=f"Data {mode}")
    k = card(b, name="Gain and loss")
    text(k, "Gain and loss", 20, 600)
    row = frame(k, "Quotes", "horizontal", 32, 0, sizingH="fill")
    for nm, val, var in [("NIFTY 50", "▲ +2.41%", "color/fg/gain"), ("BANKNIFTY", "▼ −0.86%", "color/fg/loss"), ("SENSEX", "▲ +1.12%", "color/fg/gain")]:
        q = frame(row, nm, gap=4)
        text(q, nm, 13, 500, "color/fg/muted")
        text(q, val, 24, 600, var, tabular=True)
    candles = frame(k, "Candles", "horizontal", 10, 0, align="max")
    for j, (hgt, up) in enumerate([(70, 1), (50, 0), (90, 1), (40, 0), (110, 1), (60, 0), (80, 1), (100, 1), (45, 0), (75, 1)]):
        rect(candles, 18, hgt, bind="color/data/gain" if up else "color/data/loss", radius=2)
    cv = frame(k, "CVD", "horizontal", 16, 0, sizingH="fill")
    for t, v in dd["cvd"].items():
        q = frame(cv, t, gap=2)
        text(q, t, 12, 500, "color/fg/subtle")
        text(q, f"{v:.3f}", 16, 600, tabular=True)
    text(k, "OKLab distance between gain and loss as seen with each vision type. Rule: ≥ 0.10 under every type.", 13, 400, "color/fg/muted", fill=True)

    k = card(b, name="Chart palette")
    text(k, "Chart palette", 20, 600)
    bars = frame(k, "Bars", "horizontal", 12, 0, align="max")
    for n in range(1, 9):
        col = frame(bars, f"chart-{n}", gap=6, align="center")
        rect(col, 56, 40 + (n * 37) % 80, bind=f"color/data/chart-{n}", radius=4)
        text(col, str(n), 12, 600, "color/fg/muted")
    text(k, "Eight series, tuned by search so every pair stays ≥ 0.07 apart under protanopia, deuteranopia and tritanopia (Okabe-Ito scores 0.076) while each mark keeps 3 : 1 against the surface.", 13, 400, "color/fg/muted", fill=True)
    made[f"Data {mode}"] = b

# ---------------------------------------------------------------- Usage
page("Usage")
b = board("Do and avoid", "The rules that keep colour accessible in real screens. Each one names the WCAG criterion it protects.", w=1440)
pairs = [
    ("Show change with a sign or arrow", "▲ +2.41%", "color/fg/gain", "Colour alone for change", "+2.41%", "color/fg/gain", "1.4.1 Use of Color"),
    ("Underline links", "View statement", "color/fg/link", "Links shown by colour only", "View statement", "color/fg/link", "1.4.1 Use of Color"),
    ("Text on a solid fill uses its on- colour", "Buy", "color/fg/on-brand", "Brand text on the brand fill", "Buy", "color/fg/brand", "1.4.3 Contrast"),
    ("Inputs use border/input (3 : 1)", "Quantity", "color/fg/subtle", "Decorative borders on inputs", "Quantity", "color/fg/subtle", "1.4.11 Non-text Contrast"),
]
for i, (do_t, do_s, do_c, av_t, av_s, av_c, wcag) in enumerate(pairs):
    row = frame(b, f"Rule {i+1}", "horizontal", 24, 0, sizingH="fill")
    for kind, title, sample, colvar in [("Do", do_t, do_s, do_c), ("Avoid", av_t, av_s, av_c)]:
        k = card(row, 12, 24, sizingH="fill", name=kind)
        text(k, kind, 13, 700, "color/fg/success" if kind == "Do" else "color/fg/danger")
        demo = frame(k, "Demo", "horizontal", 0, 16, sizingH="fill", radius=10, bind="color/bg/surface-sunken", align="center")
        if i == 1:
            t_ = text(demo, sample, 18, 500, colvar)
            if kind == "Do": f.cmd("text.style", id=t_, textDecoration="underline")
        elif i == 2:
            btn = frame(demo, "Button", "horizontal", 0, 0, bind="color/bg/brand", radius=6, align="center")
            f.tool("set_properties", ids=[btn], props={"paddingLeft": 20, "paddingRight": 20, "paddingTop": 10, "paddingBottom": 10})
            text(btn, sample, 16, 600, colvar)
        elif i == 3:
            fld = frame(demo, "Field", "horizontal", 0, 0, w=220, h=40, sizingV=None, bind="color/bg/surface", radius=6, align="center")
            f.tool("set_properties", ids=[fld], props={"paddingLeft": 12, "strokes": ["#000000"], "strokeWeight": 1, "strokeAlign": "inside"})
            f.cmd("variable.bind", ids=[fld], field="stroke", variable="color/border/input" if kind == "Do" else "color/border/subtle")
            text(fld, sample, 15, 400, colvar)
        else:
            text(demo, sample, 22, 600, colvar, tabular=True)
        text(k, title, 16, 600, fill=True)
        text(k, f"WCAG {wcag}", 13, 400, "color/fg/muted")
made["Usage"] = b

# ---------------------------------------------------------------- Checks
page("Checks")
b = board("Build checks", f"Results from the engine run that generated this file (brand {D['brand']}).", w=1200)
k = card(b, 4, 24, name="Checks")
for c in D["checks"]:
    row = frame(k, c["id"], "horizontal", 16, 8, sizingH="fill", align="center")
    text(row, c["status"].upper(), 12, 700, "color/fg/success" if c["status"] == "pass" else ("color/fg/info" if c["status"] == "info" else "color/fg/danger"))
    text(row, c["id"], 13, 600, mono=True)
    text(row, c["title"], 14, 400, fill=True)
    text(row, f"{c['wcag']} · {c['level']} · {c['summary']}", 12, 400, "color/fg/muted")
made["Checks"] = b

# remove the default empty first page if present
pages = f.cmd("page.list")
plist = pages.get("pages", pages) if isinstance(pages, dict) else pages
first = plist[0]
if first.get("name") not in made and first.get("childCount", first.get("children", 1)) in (0, [], None):
    try: f.cmd("page.delete", id=first["id"])
    except Exception as e: print("keep first page:", e)

out = "/home/claude/fc/out"
import os; os.makedirs(out, exist_ok=True)
f.tool("save_file", path=f"{out}/ds-colour-foundation.figcraft")
fig = f.tool("export", format="fig", path=f"{out}/ds-colour-foundation.fig")
print("fig export:", json.dumps(fig)[:600])
json.dump(made, open(f"{out}/made.json", "w"))
for nm, nid in made.items():
    f.tool("export", ids=[nid], format="png", path=f"{out}/{nm.replace(' ', '-')}.png", scale=0.5)
print("done", made)
f.close()

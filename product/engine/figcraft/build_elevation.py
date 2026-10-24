"""ds elevation foundation — one systematic story in 11 chapters (FigCraft, from engine data).
Run from the engine folder:  node figcraft/data_elevation.mjs <dir>  then  python3 figcraft/build_elevation.py <dir>
Writes ds-elevation-foundation.fig / .figcraft and a PNG per page into <dir>/png."""
import json, os, sys
from collections import Counter
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from mcp import FigCraft, DEFAULT_BIN as BIN
import kit
from kit import Kit
import story_elevation as story
import story_border

# The doc kit's own text uses ds text styles, so this file follows the rules the system teaches (as in the spacing file).
DS_FOR = {"display": "type/display/lg", "h1": "type/heading/lg", "lead": "type/body/lg", "h2": "type/heading/md", "h3": "type/title/lg", "body": "type/body/md",
          "small": "type/body/sm", "caption": "type/caption/md", "eyebrow": "type/label/md", "mono": "type/code/md", "num": "type/numeric/md"}


class SpaceKit(Kit):
    def __init__(self, f, styles):
        super().__init__(f)
        self.styles = styles

    def ds_for(self, style, weight, mono):
        w = weight or kit.TYPE[style][2]
        if mono or style == "mono":
            return "type/code/sm" if style == "caption" else ("type/code/md" if style in ("mono", "small", "body") else None)
        if style == "body" and w >= 600: return "type/title/sm"
        if style == "small" and w >= 600: return "type/label/md"
        if style == "caption" and w >= 500: return "type/label/sm"
        return DS_FOR[style]

    def text(self, parent, s, style="body", color="color/fg/default", fill=False, width=None, weight=None, mono=False, name=None):
        nid = super().text(parent, s, style, color, fill, width, weight, mono, name)
        ds = self.ds_for(style, weight, mono)
        if ds: self.f.cmd("style.apply", ids=[nid], style=self.styles[ds])
        return nid

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "out-elevation")
D = json.load(open(os.path.join(OUT, "data_elevation.json")))

f = FigCraft(binary=BIN)
r = f.cmd("variable.import", variables=os.path.join(OUT, "vars_elevation.json"))
assert not r.get("warnings"), r

# Text styles: one per ds type style, every property bound to its Responsive variable (as in the typography file).
f.cmd("page.add", name="Styles scratch")
styles = {}
for st in D["styles_"]:
    nid = f.tool("create_node", type="text", text="Ag", props={"fontFamily": "Inter", "fontSize": 16, "lineHeight": 24})["id"]
    desc = st["use"] + (" · tabular numerals: set Details → Numbers → Tabular" if st["tabular"] else "") + (" · reading text" if st["reading"] else "")
    sid = f.cmd("style.create", type="text", name=st["figma"], **{"from": nid}, description=desc)["id"]
    for field, prop in [("fontFamily", "font-family"), ("fontStyle", "font-style"), ("fontSize", "font-size"), ("lineHeight", "line-height"), ("letterSpacing", "letter-spacing")]:
        f.cmd("style.bind", style=sid, field=field, variable=f"{st['figma']}/{prop}")
    styles[st["figma"]] = sid
    f.cmd("edit.delete", ids=[nid])

class ElevationKit(SpaceKit):
    """The doc kit follows the rules of the files before it: every line it draws is a border job (width and colour
    bound), every corner a shape role. Its cards lie flat (no shadow): height is for the examples."""
    def frame(self, parent=None, name="frame", direction="vertical", gap=0, pad=0, w=None, h=None, bind=None,
              sizingH=None, sizingV="hug", radius=None, stroke=None, align=None, main=None, wrap=False, x=0, y=0,
              fill=None, strokeW=1, effects=None, shadow=None):
        nid = super().frame(parent, name, direction, gap, pad, w, h, bind, sizingH, sizingV, radius, stroke, align, main, wrap, x, y, fill, strokeW, effects, shadow)
        if stroke and not stroke.startswith("#"):
            self.f.cmd("variable.bind", ids=[nid], field="strokeWeight", variable="focus/ring/width" if stroke == "color/border/focus" else "border/width/line")
        return nid

    def card(self, parent, gap=16, pad=28, sizingH="fill", direction="vertical", bind="color/bg/surface", name="Card", w=None, radius=16, align=None):
        c = super().card(parent, gap, pad, sizingH, direction, bind, name, w, radius, align)
        story_border.rbind(self, c, "container")
        return c

    def chip(self, parent, label, bind="color/bg/surface-sunken", color="color/fg/default", mono=True):
        c = super().chip(parent, label, bind, color, mono)
        story_border.rbind(self, c, "mark")
        return c


# Effect styles: one per level with a shadow, every field bound (colour to Colour's shadow strength, numbers to Elevation).
f.cmd("page.add", name="Effects scratch")
for l in D["levels"]:
    sh = l["shadow"]
    if not sh: continue
    nid = f.tool("create_node", type="frame", name="src", width=10, height=10, props={"effects": [{"type": "dropShadow", "color": "#00000029", "offset": [0, sh["offsetY"]], "radius": sh["blur"], "spread": sh["spread"]}]})["id"]
    sid = f.cmd("style.create", type="effect", name=f"elevation/{l['job']}", **{"from": nid}, description=f"{l['use']} — {l['height']}px above the page; colour {sh['color']}")["id"]
    for fld, var in [("color", sh["color"].replace(".", "/")), ("offsetY", f"elevation/{l['job']}/shadow/offset-y"), ("radius", f"elevation/{l['job']}/shadow/blur"), ("spread", f"elevation/{l['job']}/shadow/spread")]:
        f.cmd("style.bind", style=sid, field=f"effects/0/{fld}", variable=var)
    story.ESTYLE[l["job"]] = sid
    f.cmd("edit.delete", ids=[nid])

k = ElevationKit(f, styles)
story.CH[:] = D["chapters"]
k.page("Doc kit")
k.build_components()
for key, role in [("why", "container"), ("rule", "container"), ("note", "container"), ("do", "pill"), ("avoid", "pill"), ("tag", "mark")]:
    story_border.rbind(k, k.comp[key], role)
made = {}

# Cover
k.page("Cover")
c = k.frame(name="Cover", w=1600, pad=96, gap=56, bind="color/bg/canvas")
f.cmd("variable.setMode", ids=[c], collection="Responsive", mode="lg")
story.dmode(k, c, D["defaultDensity"])
k.text(c, "ds  ·  Foundations  ·  Elevation  ·  v0.1", "eyebrow", "color/fg/brand")
col = k.frame(c, "Title", gap=16, sizingH="fill")
t = f.tool("create_node", type="text", parent=col, text="Elevation", name="illustration", props={"fontFamily": "Inter", "fontSize": 140, "fontWeight": 700, "lineHeight": 140, "letterSpacing": -2.8})["id"]
f.cmd("variable.bind", ids=[t], field="fill", variable="color/fg/default")
k.text(col, "Six levels named by what they do, shadows computed from height, surfaces that rise in Dark, an edge on everything that floats so it survives forced colours, and one stacking order with room for your own layers.", "lead", "color/fg/muted", fill=True)
strip = k.row(c, 24, "One page, two modes", align="min")
for m in ["Light", "Dark"]:
    cc = k.frame(strip, m, gap=10, sizingH="fill"); k.text(cc, m.upper(), "caption", "color/fg/subtle", weight=700)
    win = story.stage(k, cc, 680, 300, f"Project page ({m})", m)
    h = story.header(k, win, 680); story.place(k, h, 0, 0)
    for i, (tt, sub) in enumerate([("Atlas", "12 open tasks"), ("Beacon", "4 open tasks")]):
        card_ = story.proj_card(k, win, tt, sub, 260); story.place(k, card_, 32 + i * 284, 96)
    mm = story.menu(k, win, ("Rename", "Duplicate", "Delete"), 180); story.place(k, mm, 150, 168)
toc = k.row(c, 20, "Chapters", align="min")
order = []
for t in D["chapters"]:
    g = story.GROUP[t]
    if g not in order: order.append(g)
for g in order:
    gc = k.frame(toc, g, gap=10, sizingH="fill")
    k.text(gc, g.upper(), "caption", "color/fg/subtle", weight=700)
    for t in [x for x in D["chapters"] if story.GROUP[x] == g]:
        it = k.frame(gc, t, "horizontal", 10, 12, sizingH="fill", bind="color/bg/surface", stroke="color/border/subtle", align="center")
        story_border.rbind(k, it, "container")
        k.text(it, t, "small", weight=600, fill=True)
facts = k.row(c, 40, "Facts")
for lab, val in [("Standard", "WCAG 2.2 AA"), ("Tokens", f"{D['counts']['tokens']}"), ("Levels", f"{D['counts']['levels']}"), ("Layers", f"{D['counts']['layers']}"),
                 ("Edges", f"≥ {D['edges']['min']}:1"), ("Dark steps", f"≥ {D['limits']['surfaceStepMin']}:1")]:
    m = k.frame(facts, lab, gap=2)
    k.text(m, lab, "caption", "color/fg/subtle", weight=400); k.text(m, val, "h3")
made["Cover"] = c

for fn in story.CHAPTER_FNS:
    made[fn.__name__] = fn(k, D)

# Every elevation token documented exactly once (the built-in ones).
cnt = Counter(story.documented)
all_tokens = {t["name"] for t in D["tokens"] if not t.get("product")}
missing = sorted(all_tokens - set(cnt)); dupes = sorted(p for p, n in cnt.items() if n > 1)
print("tokens documented:", len(cnt), "/", len(all_tokens), "missing:", missing, "duplicated:", dupes)
assert not missing and not dupes

pl = f.cmd("page.list"); pl = pl.get("pages", pl) if isinstance(pl, dict) else pl
byname = {p["name"]: p["id"] for p in pl}
order = ["Cover"] + D["chapters"] + ["Doc kit"]
for idx, nm in enumerate(order):
    f.cmd("page.move", id=byname[nm], index=idx)
for nm, pid in byname.items():
    if nm not in order: f.cmd("page.delete", id=pid)
for nm in order:
    f.cmd("variable.setMode", ids=[byname[nm]], collection="Responsive", mode="lg")
    f.cmd("variable.setMode", ids=[byname[nm]], collection="Density", mode=D["defaultDensity"])
    f.cmd("variable.setMode", ids=[byname[nm]], collection="Shape", mode=D["defaultStyle"])
    f.cmd("variable.setMode", ids=[byname[nm]], collection="Color", mode="Light")

f.tool("save_file", path=f"{OUT}/ds-elevation-foundation.figcraft")
fig = f.tool("export", format="fig", path=f"{OUT}/ds-elevation-foundation.fig")
print("fig:", fig.get("bytes"), fig.get("warnings"))
os.makedirs(f"{OUT}/png", exist_ok=True)
for i, (nm, nid) in enumerate(made.items()):
    title = "Cover" if nm == "Cover" else D["chapters"][i - 1]
    safe = "".join(ch if ch.isalnum() else "-" for ch in title).strip("-")
    while "--" in safe: safe = safe.replace("--", "-")
    f.tool("export", ids=[nid], format="png", path=f"{OUT}/png/{safe}.png", scale=0.5)
pl = f.cmd("page.list"); pl = pl.get("pages", pl) if isinstance(pl, dict) else pl
print("pages:", [p["name"] for p in pl])
f.close()

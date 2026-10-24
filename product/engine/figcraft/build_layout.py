"""ds layout foundation — one systematic story in 9 chapters (FigCraft, from engine data).
Run from the engine folder:  node figcraft/data_layout.mjs <dir>  then  python3 figcraft/build_layout.py <dir>
Writes ds-layout-foundation.fig / .figcraft and a PNG per page into <dir>/png."""
import json, os, sys
from collections import Counter
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from mcp import FigCraft, DEFAULT_BIN as BIN
import kit
from kit import Kit
import story_layout as story

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

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "out-layout")
D = json.load(open(os.path.join(OUT, "data_layout.json")))

f = FigCraft(binary=BIN)
r = f.cmd("variable.import", variables=os.path.join(OUT, "vars_layout.json"))
assert not r.get("warnings"), r

# Text styles: one per ds type style, every property bound to its Responsive variable (as in the typography file).
f.cmd("page.add", name="Styles scratch")
styles = {}
for st in D["styles"]:
    nid = f.tool("create_node", type="text", text="Ag", props={"fontFamily": "Inter", "fontSize": 16, "lineHeight": 24})["id"]
    desc = st["use"] + (" · tabular numerals: set Details → Numbers → Tabular" if st["tabular"] else "") + (" · reading text" if st["reading"] else "")
    sid = f.cmd("style.create", type="text", name=st["figma"], **{"from": nid}, description=desc)["id"]
    for field, prop in [("fontFamily", "font-family"), ("fontStyle", "font-style"), ("fontSize", "font-size"), ("lineHeight", "line-height"), ("letterSpacing", "letter-spacing")]:
        f.cmd("style.bind", style=sid, field=field, variable=f"{st['figma']}/{prop}")
    styles[st["figma"]] = sid
    f.cmd("edit.delete", ids=[nid])

# A grid style bound to the page-grid variables, for designers to apply to their own page frames.
gs = f.tool("create_node", type="frame", name="grid style source", width=100, height=100)["id"]
f.cmd("grid.add", ids=[gs], grid={"kind": "columns", "count": 12, "gutter": 24, "offset": 0, "alignment": "stretch", "color": "#2F6BFF1A"})
gid = f.cmd("style.create", type="grid", name="layout/page grid", **{"from": gs}, description="The page grid: columns, gutter and margin follow the frame's Responsive mode. On a region beside a pane, set the region frame's own mode.")["id"]
for fld, var in [("layoutGrids/0/count", "layout/columns"), ("layoutGrids/0/gutter", "layout/gutter"), ("layoutGrids/0/offset", "layout/margin")]:
    f.cmd("style.bind", style=gid, field=fld, variable=var)
f.cmd("edit.delete", ids=[gs])

k = SpaceKit(f, styles)
story.CH[:] = D["chapters"]
k.page("Doc kit")
k.build_components()
made = {}

# Cover
k.page("Cover")
c = k.frame(name="Cover", w=1600, pad=96, gap=56, bind="color/bg/canvas")
f.cmd("variable.setMode", ids=[c], collection="Responsive", mode="lg")
story.dmode(k, c, D["defaultDensity"])
k.text(c, "ds  ·  Foundations  ·  Layout  ·  v0.1", "eyebrow", "color/fg/brand")
col = k.frame(c, "Title", gap=16, sizingH="fill")
t = f.tool("create_node", type="text", parent=col, text="Layout", name="illustration", props={"fontFamily": "Inter", "fontSize": 140, "fontWeight": 700, "lineHeight": 140, "letterSpacing": -2.8})["id"]
f.cmd("variable.bind", ids=[t], field="fill", variable="color/fg/default")
k.text(col, "Four breakpoints, one page grid, widths named by job and an app shell whose panes sit beside the content only where they fit — so a screen reflows at every width, and a grid follows the space it has.", "lead", "color/fg/muted", fill=True)
strip = k.frame(c, "One product, four widths", "horizontal", 32, 0, sizingH="fill", align="max")
for s in D["shells"]:
    m = k.frame(strip, s["breakpoint"], gap=10)
    k.text(m, f"{s['breakpoint'].upper()} · {s['checkedAt']}px", "caption", "color/fg/subtle", weight=700)
    W = s["checkedAt"] // 4
    win = k.frame(m, f"{s['breakpoint']} window", gap=2, w=W, h=200, sizingV=None, bind="color/bg/surface", radius=6, stroke="color/border/strong")
    setp = lambda nid, **p: f.tool("set_properties", ids=[nid], props=p)
    story.block(k, win, None, h=14, fill=True, bind_="color/bg/surface-raised")
    body = k.frame(win, "Body", "horizontal", 2, 0, sizingH="fill"); setp(body, sizingV="fill")
    inl = [p.split(".")[2] for p in s["inline"]]
    if "nav" in inl:
        nb = story.block(k, body, None, w=256 // 4, h=10, bind_="color/bg/surface-sunken"); setp(nb, sizingV="fill")
    mc = k.frame(body, "Main", gap=3, sizingH="fill"); setp(mc, sizingV="fill"); k.pad(mc, 4, 4, 4, 4)
    cols = k.frame(mc, "Cols", "horizontal", 2, 0, sizingH="fill")
    for _ in range(s["columns"]):
        x = f.tool("create_node", type="rectangle", parent=cols, width=4, height=60, name="column", props={"cornerRadius": 1})["id"]
        f.cmd("variable.bind", ids=[x], field="fill", variable="color/bg/brand-subtle"); setp(x, sizingH="fill")
    if "aside" in inl:
        ab = story.block(k, body, None, w=320 // 4, h=10, bind_="color/bg/surface-sunken"); setp(ab, sizingV="fill")
    else:
        story.block(k, mc, None, h=24, fill=True, bind_="color/bg/surface-sunken")
toc = k.row(c, 20, "Chapters", align="min")
order = []
for t in D["chapters"]:
    g = story.GROUP[t]
    if g not in order: order.append(g)
for g in order:
    gc = k.frame(toc, g, gap=10, sizingH="fill")
    k.text(gc, g.upper(), "caption", "color/fg/subtle", weight=700)
    for t in [x for x in D["chapters"] if story.GROUP[x] == g]:
        it = k.frame(gc, t, "horizontal", 10, 12, sizingH="fill", bind="color/bg/surface", radius=10, stroke="color/border/subtle", align="center")
        k.text(it, t, "small", weight=600, fill=True)
facts = k.row(c, 40, "Facts")
for lab, val in [("Standard", "WCAG 2.2 AA"), ("Tokens", f"{D['counts']['tokens']}"), ("Breakpoints", "0 · 600 · 1024 · 1440"), ("Reading width", f"{D['measure']['rem']}rem"),
                 ("Page", f"≤ {D['container']}px"), ("Reflow", f"{D['limits']['reflowWidth']} × {D['limits']['reflowHeight']}")]:
    m = k.frame(facts, lab, gap=2)
    k.text(m, lab, "caption", "color/fg/subtle", weight=400); k.text(m, val, "h3")
made["Cover"] = c

for fn in story.CHAPTER_FNS:
    made[fn.__name__] = fn(k, D)

# Every layout token documented exactly once (the built-in ones).
cnt = Counter(story.documented)
all_tokens = {t["name"] for t in D["tokens"] if not t["product"]}
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

f.tool("save_file", path=f"{OUT}/ds-layout-foundation.figcraft")
fig = f.tool("export", format="fig", path=f"{OUT}/ds-layout-foundation.fig")
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

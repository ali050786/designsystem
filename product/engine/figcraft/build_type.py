"""ds typography foundation — one systematic story in 11 chapters (FigCraft, from engine data).
Run from the engine folder:  node figcraft/data_type.mjs <dir>  then  python3 figcraft/build_type.py <dir>
Writes ds-typography-foundation.fig / .figcraft and a PNG per page into <dir>."""
import json, os, sys
from collections import Counter
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from mcp import FigCraft
import kit
from kit import Kit
import story_type as story

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "out-type")
D = json.load(open(os.path.join(OUT, "data_type.json")))
from mcp import DEFAULT_BIN as BIN

# The doc kit's own text uses ds text styles, so this file follows the rules it teaches.
DS_FOR = {"display": "type/display/lg", "h1": "type/heading/lg", "lead": "type/body/lg", "h2": "type/heading/md", "h3": "type/title/lg", "body": "type/body/md",
          "small": "type/body/sm", "caption": "type/caption/md", "eyebrow": "type/label/md", "mono": "type/code/md", "num": "type/numeric/md"}


class TypeKit(Kit):
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


f = FigCraft(binary=BIN)
r = f.cmd("variable.import", variables=os.path.join(OUT, "vars_type.json"))
assert not r.get("warnings"), r

# Text styles: one per ds style, every property bound to its Responsive variable.
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

k = TypeKit(f, styles)
story.CH[:] = D["chapters"]
k.page("Doc kit")
k.build_components()
made = {}

# Cover
k.page("Cover")
c = k.frame(name="Cover", w=1600, pad=96, gap=56, bind="color/bg/canvas")
story.mode(k, c, "lg")
k.text(c, "ds  ·  Foundations  ·  Typography  ·  v0.1", "eyebrow", "color/fg/brand")
col = k.frame(c, "Title", gap=16, sizingH="fill")
story.raw(k, col, "Typography", 140, 140, 700, ls=-2.8)
k.text(col, "From one rule to the screen — every size computed, every line height checked, at four screen widths and at the reader's own settings.", "lead", "color/fg/muted", fill=True)
lad = k.frame(c, "Ladder", "horizontal", 24, 0, sizingH="fill", align="max")
for st in D["steps"]:
    story.raw(k, lad, "Ag", st["sizes"]["lg"], round(st["sizes"]["lg"] * 1.2), 600 if st["step"] >= 3 else 400)
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
for lab, val in [("Standard", "WCAG 2.2 AA"), ("Text styles", str(D["counts"]["styles"])), ("Variables", str(D["counts"]["variables"])), ("Breakpoints", "sm · md · lg · xl"),
                 ("Smallest text", f"{D['minSize']}px"), ("Reading line height", f"≥ {D['readingLh']}")]:
    m = k.frame(facts, lab, gap=2)
    k.text(m, lab, "caption", "color/fg/subtle", weight=400); k.text(m, val, "h3")
made["Cover"] = c

for fn in story.CHAPTER_FNS:
    made[fn.__name__] = fn(k, D)

# Every text style documented exactly once.
cnt = Counter(story.documented)
all_styles = {s["name"] for s in D["styles"] if not s["product"]}
missing = sorted(all_styles - set(cnt)); dupes = sorted(p for p, n in cnt.items() if n > 1)
print("styles documented:", len(cnt), "/", len(all_styles), "missing:", missing, "duplicated:", dupes)
assert not missing and not dupes

pl = f.cmd("page.list"); pl = pl.get("pages", pl) if isinstance(pl, dict) else pl
byname = {p["name"]: p["id"] for p in pl}
order = ["Cover"] + D["chapters"] + ["Doc kit"]
for idx, nm in enumerate(order):
    f.cmd("page.move", id=byname[nm], index=idx)
for nm, pid in byname.items():
    if nm not in order: f.cmd("page.delete", id=pid)
for nm in order: f.cmd("variable.setMode", ids=[byname[nm]], collection="Responsive", mode="lg")

f.tool("save_file", path=f"{OUT}/ds-typography-foundation.figcraft")
fig = f.tool("export", format="fig", path=f"{OUT}/ds-typography-foundation.fig")
print("fig:", fig.get("bytes"), fig.get("warnings"))
os.makedirs(f"{OUT}/png", exist_ok=True)
for i, (nm, nid) in enumerate(made.items()):
    title = "Cover" if nm == "Cover" else D["chapters"][i - 1]
    safe = "".join(ch if ch.isalnum() else "-" for ch in title).strip("-").replace("--", "-")
    f.tool("export", ids=[nid], format="png", path=f"{OUT}/png/{safe}.png", scale=0.5)
pl = f.cmd("page.list"); pl = pl.get("pages", pl) if isinstance(pl, dict) else pl
print("pages:", [p["name"] for p in pl])
f.close()

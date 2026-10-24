"""ds colour foundation v4 — one systematic story in 11 chapters (FigCraft, from engine data)."""
import json, os, sys
from collections import Counter
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from mcp import FigCraft
from kit import Kit
import story

D = json.load(open(os.path.join(HERE, "data.json")))
OUT = os.path.join(HERE, "out4")
os.makedirs(OUT, exist_ok=True)

f = FigCraft()
r = f.cmd("variable.import", variables=os.path.join(HERE, "vars.json"))
assert not r.get("warnings"), r
k = Kit(f)
k.page("Doc kit")
k.build_components()
made = {}

# Cover
k.page("Cover")
c = k.frame(name="Cover", w=1600, pad=96, gap=56, bind="color/bg/canvas")
k.text(c, "ds  ·  Foundations  ·  Colour  ·  v0.4", "eyebrow", "color/fg/brand")
col = k.frame(c, "Title", gap=16, sizingH="fill")
f.tool("create_node", type="text", parent=col, text="Colour", props={"fontFamily": "Inter", "fontSize": 140, "fontWeight": 700, "lineHeight": 140, "letterSpacing": "-3%"})
k.text(col, "From the idea to the screen — every shade solved for contrast, every pair measured, in Light and Dark.", "lead", "color/fg/muted", fill=True)
strips = k.frame(c, "Scales", gap=6, sizingH="fill")
for sc in D["scales"]:
    row = k.row(strips, 0, sc["hue"])
    for st in sc["steps"]:
        rr = k.rect(row, 40, 24, bind=st["v"], radius=0)
        f.tool("set_properties", ids=[rr], props={"sizingH": "fill"})
toc = k.row(c, 20, "Chapters", align="min")
groups = [("Idea", ["01", "02"]), ("Structure", ["03", "04"]), ("Roles", ["05", "06", "07", "08"]), ("Combining", ["09"]), ("Using", ["10", "11"])]
names = dict(story.CHAPTERS)
for g, nums in groups:
    gc = k.frame(toc, g, gap=10, sizingH="fill")
    k.text(gc, g.upper(), "caption", "color/fg/subtle", weight=700)
    for n in nums:
        it = k.frame(gc, names[n], "horizontal", 10, 12, sizingH="fill", bind="color/bg/surface", radius=10, stroke="color/border/subtle", align="center")
        k.text(it, names[n], "small", weight=600, fill=True)
facts = k.row(c, 40, "Facts")
for lab, val in [("Standard", "WCAG 2.2 AA"), ("Colour roles", str(len(D["sem"]))), ("Variables", str(D["counts"]["variables"])), ("Modes", "Light · Dark"), ("Pairs measured", str(D["counts"]["pairs"])), ("Brand", D["brand"])]:
    m = k.frame(facts, lab, gap=2)
    k.text(m, lab, "caption", "color/fg/subtle"); k.text(m, val, "h3")
made["Cover"] = c

for fn in story.CHAPTER_FNS:
    b = fn(k, D)
    made[fn.__name__] = b

# Every colour role documented exactly once.
cnt = Counter(story.documented)
all_roles = {t["v"] for t in D["sem"]}
missing = sorted(all_roles - set(cnt)); dupes = sorted(p for p, n in cnt.items() if n > 1)
print("roles documented:", len(cnt), "/", len(all_roles), "missing:", missing, "duplicated:", dupes)
assert not missing and not dupes

pl = f.cmd("page.list"); pl = pl.get("pages", pl) if isinstance(pl, dict) else pl
byname = {p["name"]: p["id"] for p in pl}
order = ["Cover"] + [t for n, t in story.CHAPTERS] + ["Doc kit"]
for idx, nm in enumerate(order):
    f.cmd("page.move", id=byname[nm], index=idx)
for nm, pid in byname.items():
    if nm not in order:
        f.cmd("page.delete", id=pid)

f.tool("save_file", path=f"{OUT}/ds-colour-foundation.figcraft")
fig = f.tool("export", format="fig", path=f"{OUT}/ds-colour-foundation.fig")
print("fig:", fig.get("bytes"), fig.get("warnings"))
for nm, nid in made.items():
    f.tool("export", ids=[nid], format="png", path=f"{OUT}/{nm}.png", scale=0.5)
pl = f.cmd("page.list"); pl = pl.get("pages", pl) if isinstance(pl, dict) else pl
print("pages:", [p["name"] for p in pl])
f.close()

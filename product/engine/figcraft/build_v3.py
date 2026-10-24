"""ds colour foundation v3 — Learn + Reference + Doc kit, built in FigCraft from engine data."""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from mcp import FigCraft
from kit import Kit, PAGE_W
from learn import LEARN
from reference import REFERENCE

D = json.load(open(os.path.join(HERE, "data.json")))
OUT = os.path.join(HERE, "out3")
os.makedirs(OUT, exist_ok=True)

f = FigCraft()
r = f.cmd("variable.import", variables=os.path.join(HERE, "vars.json"))
assert not r.get("warnings"), r
k = Kit(f)

# Doc kit first: instances need their components.
k.page("Doc kit")
k.build_components()

made = {}

# Cover
k.page("Cover")
c = k.frame(name="Cover", w=1600, pad=96, gap=48, bind="color/bg/canvas")
k.text(c, "ds  ·  Foundations  ·  v0.3", "eyebrow", "color/fg/brand")
col = k.frame(c, "Title", gap=16, sizingH="fill")
f.tool("create_node", type="text", parent=col, text="Colour", props={"fontFamily": "Inter", "fontSize": 140, "fontWeight": 700, "lineHeight": 140, "letterSpacing": "-3%"})
k.text(col, "How to choose, combine and extend colour — with every pair measured, in Light and Dark.", "lead", "color/fg/muted", fill=True)
strips = k.frame(c, "Scales", gap=6, sizingH="fill")
for sc in D["scales"]:
    row = k.row(strips, 0, sc["hue"])
    for st in sc["steps"]:
        rr = k.rect(row, 40, 28, bind=st["v"], radius=0)
        f.tool("set_properties", ids=[rr], props={"sizingH": "fill"})
toc = k.row(c, 48, "Contents", align="min")
for part, items in [("Learn", ["01 Start here", "02 Contrast grades", "03 Anatomy of a name", "04 Choosing a colour", "05 Surfaces and depth", "06 Text and icons",
                               "07 Intent and status", "08 Interactive states", "09 Dark mode", "10 Bring your brand", "11 Extending safely"]),
                    ("Reference", ["R1 Scales", "R2 Roles", "R3 Pairs", "R4 Actions", "R5 Status", "R6 Layering", "R7 Data", "R8 In use", "R9 Do and avoid",
                                   "R10 Not allowed", "R11 Handoff", "R12 Checks"])]:
    colm = k.frame(toc, part, gap=8, sizingH="fill")
    k.text(colm, part, "h3")
    for it in items:
        k.text(colm, it, "small", "color/fg/muted")
meta = k.frame(toc, "Facts", gap=20, sizingH="fill")
for lab, val in [("Standard", "WCAG 2.2 AA"), ("Variables", f"{D['counts']['variables']} colour"), ("Modes", "Light · Dark"), ("Pairs measured", f"{D['counts']['pairs']}"), ("Brand", D["brand"])]:
    m = k.frame(meta, lab, gap=2)
    k.text(m, lab, "caption", "color/fg/subtle")
    k.text(m, val, "h3")
made["Cover"] = c

for fn in LEARN:
    made[fn.__name__] = fn(k, D)
for fn in REFERENCE:
    res = fn(k, D)
    if isinstance(res, dict): made.update(res)
    else: made[fn.__name__] = res

# Page order: Cover, Learn, Reference, Doc kit; drop the empty default page.
pl = f.cmd("page.list"); pl = pl.get("pages", pl) if isinstance(pl, dict) else pl
names = [p["name"] for p in pl]
order = ["Cover"] + [n for n in names if n[:2].isdigit()] + sorted([n for n in names if n.startswith("R") and n[1:3].strip().isdigit()], key=lambda n: int(n[1:].split()[0])) + ["Doc kit"]
byname = {p["name"]: p["id"] for p in pl}
for idx, nm in enumerate(order):
    f.cmd("page.move", id=byname[nm], index=idx)
for nm, pid in byname.items():
    if nm not in order:
        f.cmd("page.delete", id=pid)

f.tool("save_file", path=f"{OUT}/ds-colour-foundation.figcraft")
fig = f.tool("export", format="fig", path=f"{OUT}/ds-colour-foundation.fig")
print("fig:", fig.get("bytes"), fig.get("warnings"))
for nm, nid in made.items():
    f.tool("export", ids=[nid], format="png", path=f"{OUT}/{nm.replace(' ', '-')}.png", scale=0.5)
json.dump(made, open(f"{OUT}/made.json", "w"))
pl = f.cmd("page.list"); pl = pl.get("pages", pl) if isinstance(pl, dict) else pl
print("pages:", [p["name"] for p in pl])
f.close()

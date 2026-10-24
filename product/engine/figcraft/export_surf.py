"""Export a Surf (DSS) reference .fig to PDFs for Ali's teardown folder, and dump its variables and styles for measuring.
Reference only (clean-room): PDFs go to surf/<name>_foundation/, the dumps to a scratch folder — never into product/.

Usage:  python3 export_surf.py "<file.fig>" <pdf_out_dir> [--dump <scratch_dir>]
  e.g.  python3 export_surf.py "/mnt/user-data/uploads/designsystem/surf/Spacing Foundations.fig" /tmp/surf/spacing_foundation --dump /tmp/surf/spacing-data

Layout (same as surf/typography_foundation/):
  - a page with one frame       → "<Foundation> <Page>.pdf"      (page "Spacing-Principles" → "Spacing Principles.pdf")
  - a page with several frames  → "<Foundation> <Page>/<part>.pdf" (frame "Spacing Semantic Tokens / Stack" → "Stack.pdf")
  - the Thumbnail page          → "<Foundation> Thumbnail.pdf"
  - divider pages ("-") and the "Parts" page are skipped.
--dump writes variables.json (FigCraft's variable export: collections, modes, aliases, values), styles.json and
document.json (every page's layer tree, with each text layer's characters) — the raw data for a measured teardown.
Run setup_fonts.sh first so text renders in the right fonts.
Then copy the PDF folder to Ali's computer (device_commit_files into surf/<name>_foundation/).

Export fix: FigCraft's PDF export draws auto-width text that has a max width on one line, so in Figma it wraps but in
the PDF it runs off the frame (found on Surf's Spacing primitives page). Before exporting, those layers are set to a
fixed width equal to their max width in a scratch copy; the source .fig is never changed.
"""
import json, os, shutil, subprocess, sys, tempfile
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from mcp import FigCraft, DEFAULT_BIN

args = sys.argv[1:]
if len(args) < 2: sys.exit(__doc__)
src, out = args[0], args[1]
dump = args[args.index("--dump") + 1] if "--dump" in args else None
foundation = os.path.splitext(os.path.basename(src))[0].split()[0]  # "Spacing Foundations.fig" → "Spacing"

# Open through the MCP once: fix max-width text in a scratch copy, and keep the tree for --dump.
f = FigCraft()
f.tool("open_file", path=src)
d = f.tool("inspect_document", allPages=True, depth=60)
doc = d.get("document", d)
fix = []
def walk(n):
    if n.get("type") == "TEXT" and n.get("maxWidth") and n.get("textAutoResize") == "widthAndHeight":
        fix.append(n)
    for c in n.get("children") or []:
        walk(c)
for p in doc["pages"]:
    walk(p)
export_src = src
if fix:
    for n in fix:
        f.tool("set_properties", ids=[n["id"]], props={"textAutoResize": "height", "width": n["maxWidth"]})
    export_src = os.path.join(tempfile.mkdtemp(), "export-copy.figcraft")
    f.tool("save_file", path=export_src)
    print(f"wrapped {len(fix)} max-width text layer(s) for the PDF export (scratch copy only)")
if dump:
    os.makedirs(dump, exist_ok=True)
    f.tool("open_file", path=src)  # the untouched file for the data
    f.cmd("variable.export", path=os.path.join(dump, "variables.json"))
    json.dump(f.cmd("style.list"), open(os.path.join(dump, "styles.json"), "w"), indent=1)
    json.dump(doc, open(os.path.join(dump, "document.json"), "w"))
f.close()

info = json.loads(subprocess.run([DEFAULT_BIN, "info", src, "--json"], capture_output=True, text=True, check=True).stdout)
if info.get("missingFonts"):
    print("WARNING missing fonts (run setup_fonts.sh):", [m["family"] for m in info["missingFonts"]])
os.makedirs(out, exist_ok=True)
made = []
for page in info["pages"]:
    name = page["name"].strip()
    if name in ("-", "", "Parts") or not page.get("frames"):
        continue
    title = f"{foundation} Thumbnail" if name == "Thumbnail" else name.replace("-", " ", 1)
    tmp = tempfile.mkdtemp()
    subprocess.run([DEFAULT_BIN, "export", export_src, "-o", tmp, "--format", "pdf", "--page", name], capture_output=True, check=True)
    pdfs = sorted(f for f in os.listdir(tmp) if f.endswith(".pdf"))
    if len(pdfs) == 1:
        dest = os.path.join(out, f"{title}.pdf")
        shutil.move(os.path.join(tmp, pdfs[0]), dest); made.append(dest)
    else:
        folder = os.path.join(out, title); os.makedirs(folder, exist_ok=True)
        for p in pdfs:
            part = os.path.splitext(p)[0].split(" _ ")[-1]  # FigCraft writes "A / B" frame names as "A _ B"
            dest = os.path.join(folder, f"{part}.pdf")
            shutil.move(os.path.join(tmp, p), dest); made.append(dest)
    shutil.rmtree(tmp, ignore_errors=True)
for m in made: print(os.path.relpath(m, out))
print(f"{len(made)} PDFs → {out}")
if dump:
    print(f"variables.json, styles.json, document.json → {dump}")

"""Layout foundation as one systematic story: 9 chapters, each = explain → live examples → tokens → rules.
Windows and shells are drawn at real width: each sets its own Responsive mode (and Density mode where it matters), so the
margins, gutters, pane widths, header heights and reading widths inside them are the variables themselves. A main region
beside an open pane holds a grid frame set to the region's own mode — the same rule as the container queries in code.
Every layout token is documented on exactly one chapter (checked at build time). All copy is original (clean-room)."""
from story_space import grid_table, spec, bind, bind_pad, dmode, block, button, icon_button, text_input, fig

GROUP = {"Five principles": "Idea", "Breakpoints": "Idea", "How tokens are built": "Structure", "The page grid": "Grids",
         "Widths named by job": "Widths", "Regions and panes": "Regions", "The header and scrolling": "Regions",
         "Choosing a layout": "Using", "Readers' settings and products": "Using"}
TEASER = {"Breakpoints": "four widths, shared with type", "How tokens are built": "collections, modes and names",
          "The page grid": "columns, gutters, margins — and grids that follow their region",
          "Widths named by job": "the page, the reading line, tiles", "Regions and panes": "the shell, and when panes sit beside the content",
          "The header and scrolling": "a header that never hides focus", "Choosing a layout": "a decision guide and a worked example",
          "Readers' settings and products": "zoom, bigger text, density, your own panes"}
DENS = ["comfortable", "default", "compact"]
BPS = ["sm", "md", "lg", "xl"]
documented = []  # every token put in a token table
CH = []  # chapter titles, from the data
BOARD_W = 1600  # wide enough for an xl window at its real width


# ------------------------------------------------------------ helpers
def T(D, name):
    return next(t for t in D["tokens"] if t["name"] == name)


def rmode(k, nid, bp):
    k.f.cmd("variable.setMode", ids=[nid], collection="Responsive", mode=bp)


def setp(k, nid, **props):
    k.f.tool("set_properties", ids=[nid], props=props)


def start(k, title, lead):
    k.page(title)
    b = k.frame(name=title, w=BOARD_W, pad=80, gap=72, bind="color/bg/canvas")
    k.f.cmd("variable.setMode", ids=[b], collection="Color", mode="Light")
    rmode(k, b, "lg")
    dmode(k, b, "default")
    k.inst("page", b, {"Eyebrow": f"Layout · {GROUP[title]}", "Title": title, "Lead": lead}, fill=True)
    return b


def finish(k, b, title):
    i = CH.index(title)
    if i + 1 >= len(CH):
        c = k.card(b, 8, 24, bind="color/bg/brand-subtle")
        k.text(c, "End of the layout foundation", "h3")
        k.text(c, "You've seen the breakpoints, the page grid, the widths each kind of content gets, the regions of an app and the header that stays on screen — and how each of them is checked. Next in the system: radius and border.", "body", "color/fg/muted", fill=True)
        return
    t = CH[i + 1]
    c = k.frame(b, "Next", "horizontal", 16, 24, sizingH="fill", bind="color/bg/surface", radius=16, stroke="color/border/subtle", align="center")
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


def guides(k, nid, offset=True):
    """A column layout grid on the frame, bound to the page-grid variables: in Figma, Ctrl+G shows it in the frame's mode."""
    k.f.cmd("grid.add", ids=[nid], grid={"kind": "columns", "count": 12, "gutter": 24, "offset": 0, "alignment": "stretch", "color": "#2F6BFF1A"})
    for fld, var in [("layoutGrids/0/count", "layout/columns"), ("layoutGrids/0/gutter", "layout/gutter")] + ([("layoutGrids/0/offset", "layout/margin")] if offset else []):
        k.f.cmd("variable.bind", ids=[nid], field=fld, variable=var)


def col_bars(k, parent, cols, h=64, name="Columns", color="color/bg/brand-subtle"):
    """The columns drawn as bars, the gap between them bound to layout/gutter."""
    row = k.frame(parent, name, "horizontal", 0, 0, sizingH="fill")
    bind(k, row, "gap", "layout.gutter")
    for _ in range(cols):
        r = k.f.tool("create_node", type="rectangle", parent=row, width=10, height=h, name="column", props={"cornerRadius": 2})["id"]
        k.f.cmd("variable.bind", ids=[r], field="fill", variable=color)
        setp(k, r, sizingH="fill")
    return row


def window(k, parent, width, bp, name, bg="color/bg/canvas"):
    """A browser window at its real width, in a breakpoint's mode."""
    w = k.frame(parent, name, gap=0, w=width, bind=bg, radius=8, stroke="color/border/strong")
    rmode(k, w, bp)
    setp(k, w, clip=True)
    return w


def measure_box(k, parent, text, style="type.body.md"):
    """Running text that stops at layout/measure/reading (a max width bound to the variable)."""
    box = k.frame(parent, "Reading width", gap=0, sizingH="fill")
    bind(k, box, "maxWidth", "layout.measure.reading")
    spec(k, box, text, style, "color/fg/default", fill=True)
    return box


PARA = "Every project in the workspace, with the people working on it and the storage it uses. Pick a project to see its settings, or start a new one."


def header_bar(k, parent, menu=True, label="New project"):
    hd = k.frame(parent, "Header", "horizontal", 0, 0, sizingH="fill", bind="color/bg/surface-raised", align="center")
    bind(k, hd, "minHeight", "layout.header.height"); bind_pad(k, hd, "layout.margin", "lr"); bind(k, hd, "gap", "space.inline.md")
    setp(k, hd, strokes=["#000000"], strokeWeight=1, strokeAlign="inside", strokeSides=[0, 0, 1, 0])
    k.f.cmd("variable.bind", ids=[hd], field="stroke", variable="color/border/subtle")
    if menu: icon_button(k, hd, "☰", "Sections")
    n = spec(k, hd, "Atlas", "type.title.md")
    setp(k, n, sizingH="fill")
    button(k, hd, label)
    return hd


def nav_pane(k, parent, items=("Overview", "Projects", "Members", "Storage", "Settings")):
    nv = k.frame(parent, "Navigation pane", gap=0, bind="color/bg/surface")
    bind(k, nv, "width", "layout.pane.nav"); bind_pad(k, nv, "space.inset.md"); bind(k, nv, "gap", "space.stack.xs")
    setp(k, nv, sizingV="fill", strokes=["#000000"], strokeWeight=1, strokeAlign="inside", strokeSides=[0, 1, 0, 0])
    k.f.cmd("variable.bind", ids=[nv], field="stroke", variable="color/border/subtle")
    for i, lab in enumerate(items):
        it = k.frame(nv, lab, "horizontal", 0, 0, sizingH="fill", bind="color/bg/selected" if i == 1 else None, radius=4, align="center")
        bind(k, it, "minHeight", "size.control.height"); bind_pad(k, it, "space.inset.md", "lr")
        spec(k, it, lab, "type.label.md")
    return nv


def aside_pane(k, parent, inline):
    a = k.frame(parent, "Supporting pane", gap=0, sizingH=None if inline else "fill", bind="color/bg/surface-sunken")
    if inline:
        bind(k, a, "width", "layout.pane.aside"); bind_pad(k, a, "space.inset.xl"); setp(k, a, sizingV="fill")
    else:
        bind_pad(k, a, "layout.margin", "lr"); bind_pad(k, a, "space.inset.lg", "tb")
    bind(k, a, "gap", "space.stack.sm")
    spec(k, a, "Help", "type.title.lg")
    spec(k, a, "Projects group the files, people and reports for one piece of work.", "type.body.sm", "color/fg/muted", fill=True)
    return a


def shell(k, parent, D, bp, density=None, cols_h=56, label=True, body_h=None):
    """The app shell at the narrowest width of a breakpoint, drawn from the build's own numbers."""
    s = next(x for x in D["shells"] if x["breakpoint"] == bp)
    inline = [p.split(".")[2] for p in s["inline"]]
    col = k.frame(parent, f"{bp} shell", gap=10)
    if label:
        k.text(col, f"{bp.upper()} · {s['checkedAt']}px", "caption", "color/fg/subtle", weight=700)
    win = window(k, col, s["checkedAt"], bp, f"Shell · {bp} · {s['checkedAt']}px")
    if density: dmode(k, win, density)
    header_bar(k, win, menu="nav" not in inline)
    # A fixed-height body: the panes and the main column fill it (FigCraft can't size a hug row around filling children).
    body = k.frame(win, "Body", "horizontal", 0, 0, sizingH="fill", h=body_h or (430 if bp == "sm" else 360), sizingV=None)
    if "nav" in inline: nav_pane(k, body)
    mc = k.frame(body, "Main column", gap=0, sizingH="fill")
    setp(k, mc, sizingV="fill")
    main = k.frame(mc, "Main region", gap=0, sizingH="fill")
    bind_pad(k, main, "layout.margin", "lr"); bind_pad(k, main, "space.inset.xl", "tb"); bind(k, main, "gap", "space.stack.md")
    spec(k, main, "Projects", "type.heading.lg")
    measure_box(k, main, PARA, "type.body.md")
    g = k.frame(main, "Grid · follows the region", gap=6, sizingH="fill")
    rmode(k, g, s["regionGrid"])
    guides(k, g, offset=False)
    col_bars(k, g, s["columns"], h=cols_h)
    if s["regionGrid"] != bp:
        k.tag(g, f"region {s['mainPx']}px → the {s['regionGrid']} grid · {s['columns']} × {s['columnPx']}px")
    else:
        k.tag(g, f"{s['columns']} columns of {s['columnPx']}px")
    if "aside" in inline: aside_pane(k, body, True)
    else: aside_pane(k, mc, False)
    return col


# ------------------------------------------------------------ Five principles
def principles(k, D):
    b = start(k, "Five principles", "Five principles shape every layout decision in this system. Each one is checked by the build at the narrowest width of every breakpoint — the demo next to it shows what it means.")
    s = k.section(b, "The principles", "Read them once; every chapter after this one applies them.")
    M = D["measure"]
    lg = next(x for x in D["shells"] if x["breakpoint"] == "lg")
    items = [
        ("The measure follows the text", f"Running text stops at layout/measure/reading — {M['rem']}rem, about {M['chars']} characters of body text at every breakpoint and every text size. A wider screen gives wider margins, not longer lines.", "measure"),
        ("Sizes add up", f"A pane sits beside the content only where the main region still holds a full reading line and its grid keeps columns of at least {D['limits']['minColumn']}px. The build adds the widths up at every breakpoint.", "add"),
        ("Grids follow their region", f"A grid takes the columns of the space it has. Beside the open navigation at {D['min']['lg']}px the main region is {lg['mainPx']}px, so its grid is {lg['regionGrid']}: {lg['columns']} columns of {lg['columnPx']}px, not twelve of {D['keep12'].split('of ')[1].split('px')[0]}px.", "region"),
        ("Linked, not copied", "Gutters and margins point at the spacing scale; type and layout share one set of breakpoints; the header follows density like the controls in it.", "linked"),
        ("Nothing scrolls sideways", f"Every page works at {D['limits']['reflowWidth']} × {D['limits']['reflowHeight']}px — a 1280 × 1024 window at 400% zoom — in every density, and the sticky header never hides the item that has focus.", "reflow"),
    ]
    for t, body, demo in items:
        c = k.frame(s, t, "horizontal", 32, 28, sizingH="fill", bind="color/bg/surface", radius=16, stroke="color/border/subtle", align="center")
        col = k.frame(c, "Text", gap=6, sizingH="fill")
        k.text(col, t, "h2"); k.text(col, body, "body", "color/fg/muted", fill=True)
        d = k.frame(c, "Demo", "horizontal", 16, 20, w=600, bind="color/bg/surface-sunken", radius=12, align="center", main="center")
        if demo == "measure":
            for w, lab, kind in [(None, f"{M['rem']}rem · about {M['chars']} characters", "do"), (640, f"640px · about {M['chars640']} characters", "avoid")]:
                m = k.frame(d, lab, gap=6, sizingH="fill")
                k.inst(kind, m)
                bx = k.frame(m, "Lines", gap=4, sizingH="fill")
                for frac in (1, 1, 1, 0.6):
                    r = k.f.tool("create_node", type="rectangle", parent=bx, width=int((544 if w is None else w) / 4 * frac), height=6, name="line", props={"cornerRadius": 2})["id"]
                    k.f.cmd("variable.bind", ids=[r], field="fill", variable="color/fg/subtle")
                k.text(m, lab, "caption", "color/fg/muted", weight=400)
        elif demo == "add":
            col2 = k.frame(d, "Sum", gap=8, sizingH="fill")
            r = k.row(col2, 2, align="center")
            for lab, px, bg in [("nav", 256, "color/bg/surface"), ("main", lg["mainPx"], "color/bg/brand-subtle")]:
                bx = k.frame(r, lab, "horizontal", 0, 0, w=px // 2, h=40, sizingV=None, bind=bg, radius=4, stroke="color/border/default", align="center", main="center")
                k.text(bx, f"{lab} {px}", "caption", "color/fg/muted", weight=600)
            k.text(col2, f"{D['min']['lg']} − 256 − 2 × 40 = {lg['mainContentPx']}px ≥ {M['px']}px  ✓", "small", "color/fg/default", weight=600)
            k.text(col2, f"with the supporting pane too: {D['threeAtLg']}px  ✕ — so it waits for xl", "small", "color/fg/muted")
        elif demo == "region":
            for lab, n, w_ in [("window at lg · 12 columns", 12, 260), (f"main region · {lg['regionGrid']} · {lg['columns']} columns", lg["columns"], 200)]:
                m = k.frame(d, lab, gap=6)
                r = k.frame(m, "Cols", "horizontal", 3, 0, w=w_)
                for _ in range(n):
                    x = k.f.tool("create_node", type="rectangle", parent=r, width=4, height=48, name="column", props={"cornerRadius": 1})["id"]
                    k.f.cmd("variable.bind", ids=[x], field="fill", variable="color/bg/brand-subtle"); setp(k, x, sizingH="fill")
                k.text(m, lab, "caption", "color/fg/muted", weight=400)
        elif demo == "linked":
            col2 = k.frame(d, "Links", gap=10)
            for a, z in [("layout/gutter", "space/4 · 6 · 6 · 8"), ("layout/margin", "space/4 · 8 · 10 · 16"), ("layout/header/height", "space/16 · 14 · 12 (density)"), ("breakpoints", "shared with every type style")]:
                r = k.row(col2, 10, align="center", fill=False)
                k.chip(r, a); k.text(r, "→", "body", "color/fg/subtle"); k.chip(r, z, bind="color/bg/brand-subtle")
        else:
            m = k.frame(d, "Phone", gap=6, align="center")
            ph = k.frame(m, "320 × 256", gap=6, w=160, h=128, sizingV=None, bind="color/bg/surface", radius=6, stroke="color/border/strong")
            k.pad(ph, 8, 8, 8, 8)
            block(k, ph, "header scrolls away", h=20, fill=True)
            block(k, ph, "content · 288px", h=60, fill=True)
            k.text(m, "400% zoom · drawn at half size", "caption", "color/fg/muted", weight=400)
    s = k.section(b, "How this foundation is organised", "The chapters follow the order you'd lay out a product in: the idea, the widths a window can have, the structure, the grid, the widths of content, the regions of an app and its header, then how to use it all.")
    grid = k.row(s, 16, wrap=True)
    for t in CH:
        c = k.frame(grid, t, gap=6, pad=18, w=344, bind="color/bg/surface", radius=12, stroke="color/border/subtle")
        k.text(c, GROUP[t].upper(), "caption", "color/fg/subtle", weight=700)
        k.text(c, t, "body", weight=600, fill=True)
        k.text(c, TEASER.get(t, "the principles behind every decision").capitalize(), "small", "color/fg/muted", fill=True)
    finish(k, b, "Five principles")
    return b


# ------------------------------------------------------------ Breakpoints
def breakpoints(k, D):
    b = start(k, "Breakpoints", f"A breakpoint is the window width where the layout changes. There are {len(BPS)}, shared by type and layout, so headings grow and columns appear at the same moments. Each lasts until the next begins.")
    s = k.section(b, "From 0 to the widest screen", "Drawn at half size. sm starts at 0, so every window — a 280px folded phone included — has a layout; each breakpoint is checked at its first pixel.")
    ruler = k.card(s, 16, 28)
    bar = k.frame(ruler, "Ruler", "horizontal", 0, 0, w=960)
    edges = [D["min"][bp] for bp in BPS] + [1920]
    for i, bp in enumerate(BPS):
        seg = k.frame(bar, bp, gap=4, w=(edges[i + 1] - edges[i]) // 2, h=72, sizingV=None, bind="color/bg/brand-subtle" if i % 2 == 0 else "color/bg/surface-sunken", stroke="color/border/default", radius=4)
        k.pad(seg, 10, 10, 8, 8)
        k.text(seg, bp, "h3", "color/fg/brand")
        k.text(seg, f"{edges[i]}{'–' + str(edges[i + 1] - 1) if i < 3 else '+'}px", "caption", "color/fg/muted", weight=400)
    marks = k.row(ruler, 10, align="center")
    k.tag(marks, f"checked at {D['limits']['reflowWidth']} · {D['min']['md']} · {D['min']['lg']} · {D['min']['xl']}px")
    k.text(marks, "the narrowest width of each — a layout that works at its first pixel works across it", "small", "color/fg/muted")
    s = k.section(b, "Breakpoint tokens", "Primitives: they name the widths. Media queries can't read variables, so code uses the same numbers in em.")
    def cell(c, i, v, w):
        if i == 0: k.text(c, v, "mono"); return True
        if i in (3, 4): k.chip(c, v) if v not in ("none", "no prefix") else k.text(c, v, "small", "color/fg/muted"); return True
    rows = []
    for bk in D["breakpoints"]:
        documented.append(f"breakpoint.{bk['name']}")
        rows.append([f"breakpoint/{bk['name']}", f"{bk['minPx']}px", f"{bk['checkedAt']}px", f"(min-width: {bk['em']}em)" if bk["minPx"] else "none", f"{bk['name']}:" if bk["minPx"] else "no prefix", bk["use"]])
    grid_table(k, s, [("Token", 200), ("From", 100), ("Checked at", 120), ("Media query", 240), ("Tailwind", 130), ("What it is for", None)], rows, cell)
    s = k.section(b, "In em, not px", "Media queries in em follow the reader's default text size. At 32px text a window gets the layout of one half as wide, with twice the room per character.")
    r = k.row(s, 16, align="min")
    for t, body in [("Default text (16px)", f"1em = 16px. md from {D['min']['md']}px, lg from {D['min']['lg']}px, xl from {D['min']['xl']}px."),
                    ("200% text (32px)", f"1em = 32px. md from {2 * D['min']['md']}px, lg from {2 * D['min']['lg']}px — a 1280px window gets the md layout."),
                    ("Mobile first", "Write the sm layout with no query, then add what changes at md, lg and xl. Tailwind's own sm: and 2xl: are switched off.")]:
        c = k.card(r, 8, 24); k.text(c, t, "h3"); k.text(c, body, "small", "color/fg/muted", fill=True)
    rules(k, b, [("No breakpoints of your own", "A 768px breakpoint is a fifth layout nobody designed or checked. If something breaks between two breakpoints, let it wrap or let it follow its region."),
                 ("min-width only", "Desktop-first max-width queries leave the smallest screens with the most overrides and the most bugs.")])
    finish(k, b, "Breakpoints")
    return b


# ------------------------------------------------------------ How tokens are built
def tokens(k, D):
    b = start(k, "How tokens are built", "Layout tokens live in four collections. Each holds one kind of value and changes with one kind of mode — the breakpoint, the density, or nothing at all.")
    s = k.section(b, "Collections and modes", "How layout appears in Figma's Variables panel.")
    lay = [t["name"] for t in D["tokens"] if t["collection"] == "Layout"]
    grid_table(k, s, [("Collection", 200), ("Modes", 300), ("Layout tokens", 460), ("Changes with", None)], [
        ["Primitives", "Value · hidden from publishing", "breakpoint/sm · md · lg · xl, and the spacing scale", "nothing — raw values"],
        ["Responsive", " · ".join(BPS), "layout/columns, layout/gutter, layout/margin (and every type style)", "the breakpoint"],
        ["Layout", "Value", " · ".join(fig(n) for n in lay), "nothing — one value each, checked against every breakpoint"],
        ["Density", " · ".join([D["defaultDensity"]] + [d for d in DENS if d != D["defaultDensity"]]), "layout/header/height, layout/scroll-padding/top (and every spacing token)", "the density"]])
    s = k.section(b, "Reading a name", "Category, kind, job — general to specific. Widths are named by what they hold, never by size or side: sides swap in right-to-left languages.")
    c = k.card(s, 18, 32, direction="horizontal", align="max")
    for p, part in [("layout", "Category"), ("/  pane", "Kind"), ("/  nav", "Job")]:
        col = k.frame(c, part, gap=10, align="center")
        k.text(col, p, "h1", "color/fg/brand" if part == "Job" else "color/fg/default")
        k.text(col, part.upper(), "caption", "color/fg/subtle", weight=700)
    s = k.section(b, "One name, three places", "Designers and developers say the same word for the same width.")
    r = k.row(s, 16)
    eg = T(D, "layout.measure.reading")
    for t, v in [("Figma variable", eg["figma"]), ("CSS variable", eg["cssVar"]), ("Tailwind", ", ".join(eg["tailwind"]))]:
        c = k.card(r, 8, 20); k.text(c, t, "caption", "color/fg/subtle", weight=700); k.text(c, v, "mono", fill=True)
    s = k.section(b, "One variable, four values", "Each cell is a frame set to a breakpoint mode; the bar is the variable itself. Nothing was redrawn.")
    tbl = k.card(s, 0, 0)
    head = k.frame(tbl, "Head", "horizontal", 16, 12, sizingH="fill", bind="color/bg/surface-sunken"); k.pad(head, 24, 24)
    for t, w in [("Variable", 220)] + [(f"{bp} mode", 250) for bp in BPS]:
        cc = k.frame(head, t, w=w); k.text(cc, t, "caption", "color/fg/muted", weight=700)
    for n in ["layout.gutter", "layout.margin"]:
        row = k.frame(tbl, n, "horizontal", 16, 14, sizingH="fill", align="center", stroke="color/border/subtle"); k.pad(row, 24, 24)
        setp(k, row, strokeSides=[1, 0, 0, 0])
        cc = k.frame(row, "Var", w=220); k.text(cc, fig(n), "mono")
        for bp in BPS:
            cell = k.frame(row, bp, gap=6, w=250); rmode(k, cell, bp)
            x = k.f.tool("create_node", type="rectangle", parent=cell, width=10, height=10, name="bar", props={"cornerRadius": 2})["id"]
            k.f.cmd("variable.bind", ids=[x], field="fill", variable="color/bg/brand"); bind(k, x, "width", n)
            k.text(cell, f"{T(D, n)['breakpoints'][bp]['value']}px", "caption", "color/fg/muted", weight=600)
    k.inst("note", b, {"Body": "A page frame set to a Responsive mode shows that breakpoint's columns, gutter, margin and type. A region frame — the main region beside an open pane — sets its own mode for its own width, exactly as a grid inside a region does in code."}, fill=True)
    finish(k, b, "How tokens are built")
    return b


# ------------------------------------------------------------ The page grid
def page_grid(k, D):
    b = start(k, "The page grid", "The page grid divides the content into columns so things on different parts of a page line up. Three tokens make it, all per breakpoint; gutters and margins point at the spacing scale.")
    s = k.section(b, "Grid tokens", "Each value cell is set to its breakpoint mode; the bar is the variable.")
    tbl = k.card(s, 0, 0)
    head = k.frame(tbl, "Head", "horizontal", 16, 12, sizingH="fill", bind="color/bg/surface-sunken"); k.pad(head, 24, 24)
    for t, w in [("Token", 200), ("Use it for", None)] + [(f"{bp} (≥ {D['min'][bp]}px)", 170) for bp in BPS]:
        cc = k.frame(head, t, w=w, sizingH=None if w else "fill"); k.text(cc, t, "caption", "color/fg/muted", weight=700)
    for n in ["layout.columns", "layout.gutter", "layout.margin"]:
        t = T(D, n); documented.append(n)
        row = k.frame(tbl, n, "horizontal", 16, 14, sizingH="fill", align="center", stroke="color/border/subtle"); k.pad(row, 24, 24)
        setp(k, row, strokeSides=[1, 0, 0, 0])
        cc = k.frame(row, "Token", w=200); k.text(cc, t["figma"], "mono")
        cc = k.frame(row, "Use", sizingH="fill"); k.text(cc, t["use"], "small", fill=True)
        for bp in BPS:
            cell = k.frame(row, bp, gap=6, w=170); rmode(k, cell, bp)
            v = t["breakpoints"][bp]
            if n != "layout.columns":
                x = k.f.tool("create_node", type="rectangle", parent=cell, width=10, height=10, name="bar", props={"cornerRadius": 2})["id"]
                k.f.cmd("variable.bind", ids=[x], field="fill", variable="color/bg/brand"); bind(k, x, "width", n)
            k.text(cell, f"{v['value']}{'px' if n != 'layout.columns' else ' columns'}" + (f" · {fig(v['primitive'])}" if v["primitive"] else ""), "caption", "color/fg/muted", weight=600)
    s = k.section(b, "The grid at the narrowest width of each breakpoint", f"Real widths. Each window is set to its breakpoint mode: the margins and gutters are the variables, and the frame's layout grid (Ctrl+G in Figma) is bound to all three tokens. Columns stay at least {D['limits']['minColumn']}px wide and gutters take no more than a third of the row.")
    for g in D["grids"]:
        col = k.frame(s, g["bp"], gap=10)
        k.text(col, f"{g['bp'].upper()} · {g['width']}px window · {g['content']}px of content · {next(x['columns'] for x in D['breakpoints'] if x['name'] == g['bp'])} columns of {g['column']}px · gutters {round(g['share'] * 100)}%", "caption", "color/fg/subtle", weight=700)
        win = window(k, col, g["width"], g["bp"], f"Grid · {g['bp']}")
        guides(k, win)
        inner = k.frame(win, "Page", gap=0, sizingH="fill"); bind_pad(k, inner, "layout.margin", "lr"); bind_pad(k, inner, "space.inset.lg", "tb")
        col_bars(k, inner, next(x["columns"] for x in D["breakpoints"] if x["name"] == g["bp"]), h=72)
    s = k.section(b, "Grids follow their region", f"At {D['min']['lg']}px the window has the lg grid. Beside the open navigation, the main region is {next(x['mainPx'] for x in D['shells'] if x['breakpoint'] == 'lg')}px wide — so its grid frame is set to the md mode, as the container query does in code.")
    r = k.row(s, 32, align="min")
    shell(k, r, D, "lg", cols_h=48)
    c = k.card(r, 10, 24, w=320)
    k.inst("avoid", c)
    k.text(c, "Twelve columns kept beside the pane", "h3", fill=True)
    k.text(c, D["keep12"].replace("at 1024px the main region keeps", "The main region keeps") + ".", "small", "color/fg/muted", fill=True)
    k.inst("do", c)
    k.text(c, "The grid follows the region", "h3", fill=True)
    lg = next(x for x in D["shells"] if x["breakpoint"] == "lg")
    k.text(c, f"{lg['mainPx']}px is the {lg['regionGrid']} grid: {lg['columns']} columns of {lg['columnPx']}px. Spans follow too.", "small", "color/fg/muted", fill=True)
    s = k.section(b, "Spans by fraction", "Items say how much of the grid they take; the classes turn that into whole columns for the grid they're in, so a third stays a third beside an open pane. On the smallest grid everything but a quarter takes the full row.")
    spans = ["full", "half", "third", "two-thirds", "quarter"]
    grid_table(k, s, [("Grid", 220)] + [(f".{D['prefix']}-span-{x}", None) for x in spans],
               [[f"{bk['name']} · {bk['columns']} columns"] + [str(bk["spans"][x]) for x in spans] for bk in D["breakpoints"]])
    r = k.row(s, 24, align="min")
    for bp in ["md", "lg"]:
        bk = next(x for x in D["breakpoints"] if x["name"] == bp)
        col = k.frame(r, bp, gap=8, w=560)
        k.text(col, f"{bp} grid · two-thirds {bk['spans']['two-thirds']} + a third {bk['spans']['third']}", "caption", "color/fg/subtle", weight=700)
        fr = k.frame(col, "Spans", "horizontal", 0, 0, w=560); rmode(k, fr, bp); bind(k, fr, "gap", "layout.gutter")
        colw = (560 - (bk["columns"] - 1) * bk["gutter"]) / bk["columns"]
        for part in ("two-thirds", "third"):
            n = bk["spans"][part]
            x = k.frame(fr, part, "horizontal", 0, 0, w=round(n * colw + (n - 1) * bk["gutter"]), h=56, sizingV=None, bind="color/bg/surface", radius=6, stroke="color/border/default", align="center", main="center")
            k.text(x, f"span {n} of {bk['columns']}", "caption", "color/fg/muted", weight=600)
    rules(k, b, [("Span columns, don't set widths", f"A card is .{D['prefix']}-span-third; it is never 320px wide. On the next breakpoint it spans what fits."),
                 ("Let items shrink", f"Grid tracks are minmax(0, 1fr) and items have min-width: 0, so one long URL can't push the page sideways. The .{D['prefix']}-grid class does both."),
                 ("Full width is still inside the margins", "A band can run edge to edge; its content stays inside the page margins.")])
    finish(k, b, "The page grid")
    return b


# ------------------------------------------------------------ Widths named by job
def widths(k, D):
    b = start(k, "Widths named by job", "Not everything should be as wide as the page. Each kind of content gets the width that serves it, and each width has a name that says what it is for.")
    s = k.section(b, "Width tokens", "The bar is the variable itself, at its real size.")
    tbl = k.card(s, 0, 0)
    head = k.frame(tbl, "Head", "horizontal", 16, 12, sizingH="fill", bind="color/bg/surface-sunken"); k.pad(head, 24, 24)
    for t, w in [("Token", 240), ("Use it for", 420), ("Value", None)]:
        cc = k.frame(head, t, w=w, sizingH=None if w else "fill"); k.text(cc, t, "caption", "color/fg/muted", weight=700)
    for n in ["layout.container.max", "layout.measure.reading", "layout.tile.min"]:
        t = T(D, n); documented.append(n)
        row = k.frame(tbl, n, "horizontal", 16, 14, sizingH="fill", align="center", stroke="color/border/subtle"); k.pad(row, 24, 24)
        setp(k, row, strokeSides=[1, 0, 0, 0])
        cc = k.frame(row, "Token", w=240); k.text(cc, t["figma"], "mono")
        cc = k.frame(row, "Use", w=420); k.text(cc, t["use"], "small", fill=True)
        cc = k.frame(row, "Value", gap=6, sizingH="fill")
        x = k.f.tool("create_node", type="rectangle", parent=cc, width=10, height=10, name="bar", props={"cornerRadius": 2})["id"]
        k.f.cmd("variable.bind", ids=[x], field="fill", variable="color/bg/brand"); bind(k, x, "width", n)
        k.text(cc, f"{t['rem']}rem · {t['px']}px at 16px text" if t.get("rem") else f"{t['px']}px", "caption", "color/fg/muted", weight=600)
    s = k.section(b, "Which width?", "Pick by what the content is.")
    dw = next(d for d in D["decisions"] if d["what"] == "How wide content gets")
    grid_table(k, s, [("Content", 560), ("Width", None)], [[w, fig_all(x)] for w, x in dw["answers"]])
    s = k.section(b, "The page stops growing where xl begins", f"layout/container/max is computed: {D['min']['xl']} − 2 × {D['marginXl']} = {D['container']}px. Below {D['min']['xl']}px the content fills the window minus its margins; above it the content stays {D['container']}px and the margins grow. Drawn at a quarter size.")
    r = k.row(s, 24, align="max")
    for wv, bp in [(1024, "lg"), (1440, "xl"), (1920, "xl")]:
        m = next(x["margin"] for x in D["breakpoints"] if x["name"] == bp)
        content = min(wv - 2 * m, D["container"])
        col = k.frame(r, str(wv), gap=6)
        win = k.frame(col, f"{wv}px window", "horizontal", 0, 0, w=wv // 4, h=90, sizingV=None, bind="color/bg/surface-sunken", radius=4, stroke="color/border/strong", align="center", main="center")
        block(k, win, f"{content}", w=content // 4, h=70, bind_="color/bg/brand-subtle")
        k.text(col, f"{wv}px · content {content}px · margins {(wv - content) // 2}px", "caption", "color/fg/muted", weight=400)
    s = k.section(b, "The reading width is in rem", f"{D['measure']['rem']}rem holds about {D['measure']['chars']} characters of {D['measure']['body']}px body text — inside the 45–75 most guidance recommends and under WCAG 1.4.8's 80. Because it is rem, it grows with the reader's text and keeps the same characters per line.")
    r = k.row(s, 32, align="min")
    c1 = k.frame(r, "Default", gap=8, w=560)
    k.inst("do", c1)
    measure_box(k, c1, "People read a page in short sweeps. When a line runs too long the eye loses its place on the way back to the start of the next one; when it runs too short the reader keeps jumping down before a thought is complete.")
    k.text(c1, f"{D['measure']['px']}px at 16px text · about {D['measure']['chars']} characters", "caption", "color/fg/muted", weight=400)
    c2 = k.frame(r, "640px", gap=8, w=660)
    k.inst("avoid", c2)
    p2 = k.frame(c2, "640px", gap=0, w=640)
    spec(k, p2, "People read a page in short sweeps. When a line runs too long the eye loses its place on the way back to the start of the next one; when it runs too short the reader keeps jumping down before a thought is complete.", "type.body.md", fill=True)
    k.text(c2, f"640px, a px width that grew with the screen · about {D['measure']['chars640']} characters", "caption", "color/fg/muted", weight=400)
    s = k.section(b, "Tiles fit what the row holds", f"A tile grid places as many columns of at least {D['tile']}px as fit and drops to one full-width tile when even one doesn't. No breakpoints; the gaps follow density. Real widths, each tile's minimum width bound to layout/tile/min.")
    for tp in D["tilesPerRow"][:3]:
        col = k.frame(s, tp["bp"], gap=8)
        k.text(col, f"{tp['bp'].upper()} · {tp['content']}px of content · {tp['tiles']} per row", "caption", "color/fg/subtle", weight=700)
        row = k.frame(col, "Tiles", "horizontal", 0, 0, w=tp["content"], wrap=True)
        bind(k, row, "gap", "space.inline.lg"); bind(k, row, "crossGap", "space.stack.lg")
        for lab in ["Projects 18", "Members 42", "Storage 312 GB", "Reports 7"]:
            t_ = k.frame(row, lab, gap=0, bind="color/bg/surface", radius=8, stroke="color/border/subtle")
            bind(k, t_, "minWidth", "layout.tile.min"); bind_pad(k, t_, "space.inset.lg"); setp(k, t_, sizingH="fill")
            spec(k, t_, lab, "type.title.md")
    rules(k, b, [("Text never takes the page width", "Paragraphs, help and forms stop at the reading width even on a 2560px screen."),
                 ("Data takes the room it needs", "Tables use the region's full width; a table wider than that scrolls inside its own focusable, named container — not the page."),
                 ("Never a fixed width on a container", "max-width with a token, never width in px: a 1200px box scrolls 880px sideways on a 320px screen.")])
    finish(k, b, "Widths named by job")
    return b


def fig_all(s):
    import re
    return re.sub(r"\b(layout|space|breakpoint)\.[a-z0-9.-]*[a-z0-9]", lambda m: fig(m.group(0)), s)


# ------------------------------------------------------------ Regions and panes
def regions(k, D):
    b = start(k, "Regions and panes", "An app screen has a few regions with fixed jobs. The job says where something goes — and what happens to it on a smaller screen.")
    s = k.section(b, "Regions by job", "In code they are the children of the shell, always in this order: header, navigation, main, supporting.")
    nav = next(p for p in D["panes"] if p["name"] == "layout.pane.nav"); aside = next(p for p in D["panes"] if p["name"] == "layout.pane.aside")
    grid_table(k, s, [("Region", 220), ("Job", 460), ("In code", 220), ("On smaller screens", None)], [
        ["Header", "Product name, search, account, global actions", 'data-shell="header"', "Stays at the top (next chapter)"],
        ["Navigation pane", nav["use"].split(";")[0], 'data-shell="nav"', f"Below {nav['from']}: a drawer the app opens"],
        ["Main region", "The task the screen is for — it always keeps priority", 'data-shell="main"', "Never shrinks below one reading line while a pane is open"],
        ["Supporting pane", aside["use"].split(";")[0], 'data-shell="aside"', f"Below {aside['from']}: under the main content"],
        ["Overlays", "A short task on top of the page: a dialog, a sheet, a menu", "Elevation", "Not a pane: it covers the page and gives focus back when it closes"]])
    s = k.section(b, "Pane tokens", "Widths in px, so the build can add them up. Each pane goes beside the content from its breakpoint.")
    tbl = k.card(s, 0, 0)
    head = k.frame(tbl, "Head", "horizontal", 16, 12, sizingH="fill", bind="color/bg/surface-sunken"); k.pad(head, 24, 24)
    for t, w in [("Token", 220), ("Use it for", 360), ("Width", 340), ("Beside the content from", 200), ("Below that", None)]:
        cc = k.frame(head, t, w=w, sizingH=None if w else "fill"); k.text(cc, t, "caption", "color/fg/muted", weight=700)
    for p in [nav, aside]:
        documented.append(p["name"])
        row = k.frame(tbl, p["name"], "horizontal", 16, 14, sizingH="fill", align="center", stroke="color/border/subtle"); k.pad(row, 24, 24)
        setp(k, row, strokeSides=[1, 0, 0, 0])
        cc = k.frame(row, "Token", w=220); k.text(cc, fig(p["name"]), "mono")
        cc = k.frame(row, "Use", w=360); k.text(cc, p["use"].split(";")[0], "small", fill=True)
        cc = k.frame(row, "Width", gap=6, w=340)
        x = k.f.tool("create_node", type="rectangle", parent=cc, width=10, height=10, name="bar", props={"cornerRadius": 2})["id"]
        k.f.cmd("variable.bind", ids=[x], field="fill", variable="color/bg/brand"); bind(k, x, "width", p["name"])
        k.text(cc, f"{p['width']}px", "caption", "color/fg/muted", weight=600)
        cc = k.frame(row, "From", w=200); k.text(cc, f"{p['from']} (≥ {D['min'][p['from']]}px)", "small")
        cc = k.frame(row, "Below", sizingH="fill"); k.text(cc, "a drawer" if p["below"] == "drawer" else "below the main content", "small")
    s = k.section(b, "The shell at each breakpoint", "Real widths, from the build's own sums. The main region pads itself with the window's margin; the grid inside it is set to the mode of the region's own width.")
    for bp in BPS:
        sh = next(x for x in D["shells"] if x["breakpoint"] == bp)
        c = k.frame(s, f"{bp} at {sh['checkedAt']}px", gap=10)
        inl = " + ".join(fig(n) for n in sh["inline"]) or "no pane beside the content"
        k.text(c, f"{bp.upper()} · {sh['checkedAt']}px  ·  {inl}  ·  main region {sh['mainPx']}px, content {sh['mainContentPx']}px" + (f" ≥ {D['measure']['px']}px" if sh["inline"] else "") + f"  ·  grid inside main: {sh['regionGrid']}, {sh['columns']} × {sh['columnPx']}px", "caption", "color/fg/subtle", weight=700)
        shell(k, c, D, bp, cols_h=40, label=False)
    s = k.section(b, "The drawer", f"Below lg the navigation is a drawer: hidden, and out of the tab order, until the menu button opens it. It leaves at least {D['limits']['drawerStrip']}px of the page visible on a {D['limits']['reflowWidth']}px screen.")
    r = k.row(s, 32, align="min")
    col = k.frame(r, "Drawer", gap=10)
    k.text(col, f"SM · {D['limits']['reflowWidth']}px · drawer open", "caption", "color/fg/subtle", weight=700)
    win = window(k, col, D["limits"]["reflowWidth"], "sm", "Drawer · sm")
    header_bar(k, win, menu=True)
    body = k.frame(win, "Body", "horizontal", 0, 0, sizingH="fill", h=300, sizingV=None)
    nv = nav_pane(k, body)
    k.f.cmd("variable.bind", ids=[nv], field="fill", variable="color/bg/surface-overlay")
    strip = k.frame(body, "Page behind", gap=0, sizingH="fill", bind="color/bg/scrim")
    setp(k, strip, sizingV="fill")
    c = k.frame(r, "Behaviour", gap=10, w=520)
    for t_, body_ in [("The button", "aria-expanded and aria-controls; it hides itself from lg, where the pane is inline."), ("Opening", "Focus moves to the first link in the drawer."),
                      ("Closing", "Escape closes it and focus returns to the button.")]:
        k.marked(c, t_, body_, mono=False)
    s = k.section(b, "Order", "The regions come in one order in the code, and the layout never contradicts it — a keyboard or screen-reader user meets them in the order a sighted user sees them, at every width.")
    r = k.row(s, 12, align="center", fill=False)
    for i, n in enumerate(["header", "nav", "main", "aside"]):
        k.tag(r, f'data-shell="{n}"')
        if i < 3: k.text(r, "→", "h3", "color/fg/subtle")
    rules(k, b, [("The main region keeps priority", "When space runs out, panes move — under the content or into a drawer — before the main region gives up its reading line."),
                 ("Panes by job, not by side", "A pane is nav or aside, not left or right; start and end flip in right-to-left languages."),
                 ("Never reorder visually", "No order or row-reverse to move a pane: change the code order instead.")])
    finish(k, b, "Regions and panes")
    return b


# ------------------------------------------------------------ The header and scrolling
def header(k, D):
    b = start(k, "The header and scrolling", "The header stays at the top while the page scrolls, so search and navigation are one step away. Because it holds controls, its height follows density like they do.")
    s = k.section(b, "Header tokens", "Each value cell is set to its density mode; the bar is the variable.")
    tbl = k.card(s, 0, 0)
    head = k.frame(tbl, "Head", "horizontal", 16, 12, sizingH="fill", bind="color/bg/surface-sunken"); k.pad(head, 24, 24)
    for t, w in [("Token", 260), ("Use it for", None)] + [(d + (" · default mode" if d == D["defaultDensity"] else ""), 190) for d in DENS]:
        cc = k.frame(head, t, w=w, sizingH=None if w else "fill"); k.text(cc, t, "caption", "color/fg/muted", weight=700)
    for n in ["layout.header.height", "layout.scroll-padding.top"]:
        t = T(D, n); documented.append(n)
        row = k.frame(tbl, n, "horizontal", 16, 14, sizingH="fill", align="center", stroke="color/border/subtle"); k.pad(row, 24, 24)
        setp(k, row, strokeSides=[1, 0, 0, 0])
        cc = k.frame(row, "Token", w=260); k.text(cc, t["figma"], "mono")
        cc = k.frame(row, "Use", sizingH="fill"); k.text(cc, t["use"], "small", fill=True)
        for d in DENS:
            cell = k.frame(row, d, gap=6, w=190); dmode(k, cell, d)
            x = k.f.tool("create_node", type="rectangle", parent=cell, width=10, height=10, name="bar", props={"cornerRadius": 2})["id"]
            k.f.cmd("variable.bind", ids=[x], field="fill", variable="color/bg/brand"); bind(k, x, "width", n)
            k.text(cell, f"{t['densities'][d]['px']}px", "caption", "color/fg/muted", weight=600)
    s = k.section(b, "It holds its controls", f"The same header in three frames, each set to a density mode: its minimum height and the control in it move together, with at least {D['limits']['headerRoom']}px to spare.")
    r = k.row(s, 24, align="min")
    for d in DENS:
        h = D["header"][d]
        col = k.frame(r, d, gap=8, w=420)
        dmode(k, col, d)
        k.text(col, f"{d.upper()} · header {h['header']}px · control {h['control']}px · {h['header'] - h['control']}px of room", "caption", "color/fg/subtle", weight=700)
        win = window(k, col, 400, "sm", f"Header · {d}")
        dmode(k, win, d)
        header_bar(k, win, menu=True, label="New")
    s = k.section(b, "It sticks only where there is room", f"The header stays at the top in windows at least {D['limits']['stickyFromEm']}em tall ({D['limits']['stickyFromEm'] * 16}px at 16px text). In shorter ones it scrolls away: at 400% zoom it would take a fifth of the screen, and at 200% text a header that wraps would outgrow its scroll padding. Drawn at half size.")
    r = k.row(s, 32, align="min")
    for title, hgt, sticky in [(f"{D['limits']['stickyFromEm'] * 16}px tall — sticks", 240, True), (f"{D['limits']['reflowHeight']}px tall (400% zoom) — scrolls away", 128, False)]:
        col = k.frame(r, title, gap=8)
        win = k.frame(col, title, gap=4, w=200, h=hgt, sizingV=None, bind="color/bg/surface", radius=6, stroke="color/border/strong")
        k.pad(win, 0, 0, 0, 8)
        if sticky: block(k, win, "header", h=28, fill=True, bind_="color/bg/surface-raised")
        k.pad(win, 0, 0, 0, 8)
        for _ in range(3 if sticky else 2): block(k, win, "content", h=40, fill=True)
        k.text(col, title, "caption", "color/fg/muted", weight=400)
    s = k.section(b, "Focus is never hidden under it", "When someone tabs back up a page, the browser scrolls the focused item to the top edge — under a sticky header. Scroll padding tells it to stop below the header. tokens.css sets it, linked to the header height, and grows it with the reader's text.")
    r = k.row(s, 32, align="min")
    for title, ok in [("Without scroll padding", False), ("With layout/scroll-padding/top", True)]:
        col = k.frame(r, title, gap=8, w=420)
        k.inst("do" if ok else "avoid", col)
        win = k.frame(col, title, gap=0, w=400, h=200, sizingV=None, bind="color/bg/canvas", radius=6, stroke="color/border/strong")
        setp(k, win, clip=True)
        def focused(parent):
            link = k.frame(parent, "Focused link", "horizontal", 0, 0, radius=4, stroke="color/border/focus", strokeW=2, align="center")
            k.pad(link, 6, 6, 2, 2)
            spec(k, link, "Storage settings", "type.body.md", "color/fg/link")
            return link
        if not ok:
            link = focused(win); setp(k, link, absolute=True, x=16, y=12)  # drawn first, so the header covers it
        hd = k.frame(win, "Header", "horizontal", 0, 0, sizingH="fill", bind="color/bg/surface-raised", align="center")
        bind(k, hd, "height", "layout.header.height"); setp(k, hd, sizingV="fixed"); bind_pad(k, hd, "layout.margin", "lr")
        if not ok: setp(k, hd, opacity=0.9)
        spec(k, hd, "Atlas", "type.title.md")
        body = k.frame(win, "Page", gap=0, sizingH="fill"); bind_pad(k, body, "layout.margin", "lr"); bind(k, body, "gap", "space.stack.md")
        if ok:
            k.pad(body, None, None, 0, None)
            focused(body)
        for _ in range(2): block(k, body, "content", h=36, fill=True)
        k.text(col, "the link lands under the header" if not ok else "the browser stops at the scroll padding: just below the header", "caption", "color/fg/muted", weight=400)
    rules(k, b, [("Minimum height, not height", "At 200% text the header grows instead of cutting off its labels; keep it to one row of controls."),
                 ("More sticky bars, more padding", "A sticky toolbar under the header adds its height to the scroll padding and sticks under the same height condition."),
                 ("A header that can wrap", "If it can wrap even in a tall window, measure it in the browser and set the scroll padding from its real height (the handoff shows how).")])
    finish(k, b, "The header and scrolling")
    return b


# ------------------------------------------------------------ Choosing a layout
def choosing(k, D):
    b = start(k, "Choosing a layout", "Four questions get you to the right layout: how wide should this be, where does it go, how do I divide the space, and when does it change?")
    for d in [x for x in D["decisions"] if x["what"] != "How wide content gets"]:
        s = k.section(b, d["what"], d["question"])
        def cell(c, i, v, w):
            if i == 1: k.text(c, v, "small", fill=True); return True
        grid_table(k, s, [("When", 620), ("Use", None)], [[w, fig_all(x)] for w, x in d["answers"]], cell)
    s = k.section(b, "Worked example — a project settings screen", "Laid out one question at a time, at xl with every pane open. Each part is tagged with the token or class that sets its width.")
    r = k.row(s, 32, align="min")
    col = k.frame(r, "Example", gap=10)
    win = window(k, col, D["min"]["xl"], "xl", f"Settings screen · {D['min']['xl']}px")
    header_bar(k, win, menu=False)
    body = k.frame(win, "Body", "horizontal", 0, 0, sizingH="fill", h=600, sizingV=None)
    nv = nav_pane(k, body, ("Overview", "Settings", "Members", "Storage"))
    main = k.frame(body, "Main region", gap=0, sizingH="fill"); bind_pad(k, main, "layout.margin", "lr"); bind_pad(k, main, "space.inset.xl", "tb"); bind(k, main, "gap", "space.stack.xl")
    spec(k, main, "Project settings", "type.heading.lg")
    tiles = k.frame(main, "Usage tiles", "horizontal", 0, 0, sizingH="fill", wrap=True); bind(k, tiles, "gap", "space.inline.lg"); bind(k, tiles, "crossGap", "space.stack.lg")
    for lab in ["Storage 312 GB", "Members 9", "Reports 2"]:
        t_ = k.frame(tiles, lab, gap=0, bind="color/bg/surface", radius=8, stroke="color/border/subtle"); bind(k, t_, "minWidth", "layout.tile.min"); bind_pad(k, t_, "space.inset.lg"); setp(k, t_, sizingH="fill")
        spec(k, t_, lab, "type.title.md")
    k.tag(main, "layout/tile/min · a tile grid")
    form = k.frame(main, "Form", gap=0, sizingH="fill"); bind(k, form, "maxWidth", "layout.measure.reading"); bind(k, form, "gap", "space.stack.lg")
    from story_space import field
    field(k, form, "Project name", "Onboarding redesign"); field(k, form, "Owner", "Meera Iyer")
    k.tag(main, "layout/measure/reading · one column")
    aside_pane(k, body, True)
    k.tag(col, "header · layout/pane/nav · main (.ds-page) · layout/pane/aside")
    s = k.section(b, "Do and avoid", "Measured in this build.")
    def cell2(c, i, v, w):
        if i == 2: k.text(c, v, "small", "color/fg/success", fill=True); return True
    grid_table(k, s, [("Avoid", 380), ("Measured", 520), ("Do", None)], [[fig_all(m["mistake"]), fig_all(m["measured"]), f"{fig_all(m['fix'])} — {fig_all(m['fixValue'])}"] for m in D["mistakes"]], cell2)
    finish(k, b, "Choosing a layout")
    return b


# ------------------------------------------------------------ Readers' settings and products
def settings(k, D):
    b = start(k, "Readers' settings and products", "People zoom, enlarge text and pick denser screens; products add panes of their own. The layout is built so none of that breaks a screen.")
    s = k.section(b, "Zoom: 400% is a phone", f"At 400% zoom a 1280 × 1024 window is {D['limits']['reflowWidth']} × {D['limits']['reflowHeight']}px — the sm layout. Every page works there without scrolling sideways; the header scrolls away so the page keeps its height. Real size.")
    r = k.row(s, 32, align="min")
    win = window(k, r, D["limits"]["reflowWidth"], "sm", "400% zoom")
    setp(k, win, sizingV="fixed"); setp(k, win, height=D["limits"]["reflowHeight"])
    main = k.frame(win, "Page", gap=0, sizingH="fill"); bind_pad(k, main, "layout.margin", "lr"); bind_pad(k, main, "space.inset.lg", "tb"); bind(k, main, "gap", "space.stack.md")
    spec(k, main, "Projects", "type.heading.lg")
    measure_box(k, main, PARA)
    c = k.frame(r, "Numbers", gap=8, w=520)
    k.marked(c, "Content width", f"{D['limits']['reflowWidth']} − 2 × {D['marginSm']} = {D['limits']['reflowWidth'] - 2 * D['marginSm']}px (margins are px, so they stay {D['marginSm']}px)", mono=False)
    k.marked(c, "Header", f"scrolls with the page: it sticks only from {D['limits']['stickyFromEm']}em tall", mono=False)
    s = k.section(b, "Bigger text", "Breakpoints in em and the reading width in rem: at 200% text a window gets the layout of one half as wide, and lines keep their length. Margins and gutters are px, so the text gets the extra room.")
    grid_table(k, s, [("Window", 200), ("At 16px text", 360), ("At 32px text (200%)", None)], [
        [f"{w}px", next(bk["name"] for bk in reversed(D["breakpoints"]) if bk["minPx"] <= w), next(bk["name"] for bk in reversed(D["breakpoints"]) if bk["minPx"] <= w / 2)] for w in (600, 1024, 1280, 1440, 1920)])
    s = k.section(b, "What the config changes", "Only choices live in the config; everything else is computed and checked.")
    L = D["limits"]["panes"]
    grid_table(k, s, [("Follows the config", 760), ("Fixed on purpose", None)], [
        [f"The navigation pane's width (layout.nav, now {T(D, 'layout.pane.nav')['px']}px; {L['nav'][0]}–{L['nav'][1]}px)", "The breakpoints, the columns and the reading width"],
        [f"The supporting pane's width (layout.aside, now {T(D, 'layout.pane.aside')['px']}px; {L['aside'][0]}–{L['aside'][1]}px)", "The page cap — computed from the xl margin"],
        [f"The tile width (layout.tile, now {D['tile']}px; {L['tile'][0]}–{L['tile'][1]}px)", "Every check"],
        ["Panes added for this product (layout.panes)", "Token names — nothing in designs or code is renamed"]])
    product = [p for p in D["panes"] if p.get("product")]
    if product:
        s = k.section(b, "Panes added for this product", "Defined in the engine config and checked like the built-in ones.")
        grid_table(k, s, [("Token", 260), ("Use it for", 480), ("Width", 120), ("From", None)], [[fig(p["name"]), p["use"], f"{p['width']}px", p["from"]] for p in product])
    s = k.section(b, "Adding a pane", f"Name it by its job, give a width in px and the breakpoint where it goes inline. The build assumes every pane can be open at once and adds them up at every breakpoint from there. With the built-in panes open at xl, there is room for one more of up to {D['room']}px.")
    c = k.card(s, 8, 24)
    k.text(c, '{ "layout": { "panes": [ { "name": "layout.pane.outline", "width": 192, "from": "xl", "side": "end", "description": "Headings of a long page, to jump between them" } ] } }', "mono", fill=True)
    k.text(c, f"A 288px inspector at xl would leave {next(x['mainContentPx'] for x in D['shells'] if x['breakpoint'] == 'xl') - 288}px for the content and fails L3. The build refuses widths that aren't px multiples of 8, names that say where or how big, a pane inline on sm and names that already exist.", "small", "color/fg/muted", fill=True)
    s = k.section(b, "Accessibility reference", "What the build checks for layout, and the result for this build.")
    grid_table(k, s, [("Check", 80), ("What it checks", 840), ("WCAG", 160), ("Result", None)], [[x["id"], x["title"], f"{x['wcag']} ({x['level']})", f"{x['status']} · {x['summary']}"] for x in D["checks"]])
    finish(k, b, "Readers' settings and products")
    return b


CHAPTER_FNS = [principles, breakpoints, tokens, page_grid, widths, regions, header, choosing, settings]

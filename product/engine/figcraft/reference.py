"""Reference pages: look-up material, Light and Dark, measured. Uses Kit (k) and engine data (D)."""

TEXT_BGS = ["canvas", "surface", "surface-raised", "surface-overlay", "surface-sunken", "surface-hover", "surface-pressed", "selected"]


def _pair_lookup(D, mode):
    return {(p["fg"], p["bg"], p["over"]): p["ratio"] for p in D["pairsAll"][mode]}


def scales(k, D):
    k.page("R1 Scales")
    b = k.board("Reference · R1", "Scales", "Six hues × 19 grades. The same grade has the same contrast in every hue. Under each shade: its hex, then contrast against white (W) and black (B).", w=1840)
    for sc in D["scales"]:
        s = k.frame(b, sc["hue"], gap=14, sizingH="fill")
        k.text(s, sc["hue"].capitalize(), "h3")
        row = k.row(s, 6)
        for st in sc["steps"]:
            cell = k.frame(row, f"{sc['hue']}/{st['g']}", gap=4, sizingH="fill")
            r_ = k.rect(cell, 80, 72, bind=st["v"], radius=8)
            k.f.tool("set_properties", ids=[r_], props={"sizingH": "fill"})
            k.text(cell, str(st["g"]), "caption", "color/fg/default", weight=700)
            k.text(cell, st["hex"], "caption", "color/fg/muted", mono=True, weight=400)
            k.text(cell, f"W {st['w']}", "caption", "color/fg/subtle", weight=400)
            k.text(cell, f"B {st['b']}", "caption", "color/fg/subtle", weight=400)
    return b


GROUPS = [("Backgrounds", "color.bg."), ("Text and icons", "color.fg."), ("Actions", "color.action."), ("Borders", "color.border."), ("Data", "color.data."), ("Shadow", "color.shadow.")]


def roles(k, D):
    k.page("R2 Roles")
    out = {}
    for i, mode in enumerate(["Light", "Dark"]):
        b = k.board("Reference · R2", f"Roles — {mode}", "Every role you can use, what it's for, and the shade it points to in this mode.", mode=mode, x=i * 1540, w=1460, name=f"Roles {mode}")
        for gname, prefix in GROUPS:
            items = [t for t in D["sem"] if t["path"].startswith(prefix)]
            s = k.section(b, f"{len(items)} roles", gname, {"Backgrounds": "Fills behind content, from the page to selected rows and state tints.",
                                                    "Text and icons": "Everything people read, plus icon colours (3 : 1).",
                                                    "Actions": "Buttons by job: primary, secondary, ghost, danger, disabled.",
                                                    "Borders": "Outlines that identify controls, decorative dividers, focus.",
                                                    "Data": "Gain and loss, chart series, axes and gridlines.",
                                                    "Shadow": "Shadow colours used by the elevation levels."}[gname])
            card = k.card(s, 0, 8)
            for t in items:
                row = k.frame(card, t["v"], "horizontal", 16, 10, sizingH="fill", align="center")
                if prefix == "color.fg." or (prefix == "color.action." and t["path"].endswith(".fg")):
                    base = "color/bg/surface-sunken"
                    if t["path"].startswith("color.fg.on-"): base = "color/bg/" + t["path"].split("on-")[1]
                    if prefix == "color.action.": base = t["v"].rsplit("/", 1)[0] + "/bg"
                    sw = k.frame(row, "swatch", "horizontal", w=56, h=40, sizingV=None, radius=8, bind=base, align="center", main="center")
                    k.text(sw, "Aa", "h3", t["v"])
                elif prefix == "color.border." or t["path"].endswith(".border"):
                    k.frame(row, "swatch", w=56, h=40, sizingV=None, radius=8, bind="color/bg/surface", stroke=t["v"], strokeW=2)
                else:
                    k.rect(row, 56, 40, bind=t["v"], radius=8, stroke="color/border/subtle")
                col = k.frame(row, "label", gap=2, sizingH="fill")
                k.text(col, t["v"].replace("color/", ""), "mono", weight=600)
                k.text(col, t["desc"], "small", "color/fg/muted", fill=True)
                k.text(row, (t["light"] if mode == "Light" else t["dark"]).upper(), "mono", "color/fg/subtle")
        out[f"Roles {mode}"] = b
    return out


def pairs(k, D):
    k.page("R3 Pairs")
    out = {}
    for i, mode in enumerate(["Light", "Dark"]):
        L = _pair_lookup(D, mode)
        b = k.board("Reference · R3", f"Pairing matrix — {mode}", "Every role on every background it may sit on, with its measured contrast. Empty means the pair isn't supported. Text needs 4.5 : 1, icons and borders 3 : 1.", mode=mode, x=i * 1840, w=1760, name=f"Pairs {mode}")
        for num, title, intro, fgs, sample in [
            ("01", "Text", "4.5 : 1 or more on every listed background.", ["fg/default", "fg/muted", "fg/subtle", "fg/brand", "fg/link", "fg/link-hover", "fg/success", "fg/warning", "fg/danger", "fg/info", "fg/gain", "fg/loss"], "Aa"),
            ("02", "Icons", "3 : 1 or more. Text roles can colour icons too.", ["fg/icon", "fg/icon-subtle", "fg/default", "fg/muted", "fg/brand", "fg/success", "fg/warning", "fg/danger", "fg/info"], "●"),
            ("03", "Borders and focus", "3 : 1 or more — these outlines show where a control is.", ["border/strong", "border/input", "border/focus", "border/success", "border/warning", "border/danger", "border/info"], "▢"),
        ]:
            s = k.section(b, num, title, intro)
            tbl = k.card(s, 6, 20)
            head = k.row(tbl, 6)
            k.frame(head, "corner", w=200, h=20, sizingV=None)
            for bg in TEXT_BGS:
                hc = k.frame(head, bg, sizingH="fill"); k.text(hc, bg, "caption", "color/fg/muted")
            for fg in fgs:
                row = k.row(tbl, 6, fg, align="center")
                lc = k.frame(row, "label", "horizontal", w=200, h=40, sizingV=None, align="center"); k.text(lc, fg, "mono", weight=600)
                for bg in TEXT_BGS:
                    ratio = L.get((f"color/{fg}", f"color/bg/{bg}", None))
                    cell = k.frame(row, bg, "horizontal", 8, 8, sizingH="fill", radius=8, bind=f"color/bg/{bg}" if ratio else None, align="center", stroke=None if ratio else "color/border/subtle")
                    if ratio:
                        if title.startswith("Borders"):
                            k.frame(cell, "line", w=22, h=22, sizingV=None, radius=4, stroke=f"color/{fg}", strokeW=2)
                        else:
                            k.text(cell, sample, "h3" if sample == "Aa" else "body", f"color/{fg}")
                        k.text(cell, f"{ratio:.2f}", "small", f"color/{fg}" if not title.startswith("Borders") else "color/fg/default", weight=600)
                    else:
                        k.text(cell, "—", "small", "color/fg/subtle")
        s = k.section(b, "04", "State tints", "Translucent hover and pressed layers, measured on top of the surface underneath.")
        tbl = k.card(s, 6, 20)
        for layer in ["state-hover", "state-pressed"]:
            row = k.row(tbl, 6, layer, align="center")
            lc = k.frame(row, "label", "horizontal", w=200, h=40, sizingV=None, align="center"); k.text(lc, "bg/" + layer, "mono", weight=600)
            for base in ["canvas", "surface", "surface-sunken"]:
                outer = k.frame(row, base, "horizontal", 0, 0, sizingH="fill", radius=8, bind=f"color/bg/{base}")
                cell = k.frame(outer, "tint", "horizontal", 10, 10, sizingH="fill", radius=8, bind=f"color/bg/{layer}", align="center")
                for fg in ["fg/default", "fg/muted", "fg/brand"]:
                    ratio = L.get((f"color/{fg}", f"color/bg/{layer}", f"color/bg/{base}"))
                    k.text(cell, f"{ratio:.2f}" if ratio else "—", "small", f"color/{fg}", weight=600)
                k.text(cell, "on " + base, "caption", "color/fg/subtle")
        out[f"Pairs {mode}"] = b
    return out


def actions(k, D):
    k.page("R4 Actions")
    out = {}
    for i, mode in enumerate(["Light", "Dark"]):
        b = k.board("Reference · R4", f"Actions — {mode}", "Buttons by importance, in every state. One primary action per view; ghost for low-emphasis actions; danger only for things that can't be undone.", mode=mode, x=i * 1540, w=1460, name=f"Actions {mode}")
        s = k.section(b, "01", "Buttons", "Each column is a state. The focus ring is added on top of any state.")
        tbl = k.card(s, 18, 28)
        hdr = k.row(tbl, 20)
        k.frame(hdr, "corner", w=140, h=16, sizingV=None)
        for st in ["Default", "Hover", "Pressed", "Focused", "Disabled"]:
            c = k.frame(hdr, st, sizingH="fill"); k.text(c, st, "caption", "color/fg/muted")
        for kind, label in [("primary", "Place order"), ("secondary", "Cancel"), ("ghost", "Add to list"), ("danger", "Delete")]:
            row = k.row(tbl, 20, kind, align="center")
            lc = k.frame(row, "label", w=140); k.text(lc, kind.capitalize(), "body", weight=600)
            border = "color/action/secondary/border" if kind == "secondary" else None
            for st, sfx in [("Default", ""), ("Hover", "-hover"), ("Pressed", "-pressed")]:
                c = k.frame(row, st, sizingH="fill")
                k.btn(c, f"color/action/{kind}/bg{sfx}", f"color/action/{kind}/fg", label, border=border)
            c = k.frame(row, "Focused", sizingH="fill")
            rg = k.ring(c); k.btn(rg, f"color/action/{kind}/bg", f"color/action/{kind}/fg", label, border=border)
            c = k.frame(row, "Disabled", sizingH="fill")
            k.btn(c, "color/action/disabled/bg", "color/action/disabled/fg", label, border="color/action/disabled/border")
        s = k.section(b, "02", "Inside menus and dialogs", "Items in overlays use solid item colours for hover and pressed — tints would lower contrast there.")
        ov = k.frame(s, "Menu", gap=4, pad=8, w=320, bind="color/bg/surface-overlay", radius=12, stroke="color/border/subtle", shadow=(3, (0, 6, 16)))
        for lab, bg in [("Modify order", None), ("Add alert · bg/item-hover", "color/bg/item-hover"), ("Share · bg/item-pressed", "color/bg/item-pressed")]:
            it = k.frame(ov, lab, "horizontal", 8, 10, sizingH="fill", bind=bg, radius=6, align="center"); k.pad(it, 12, 12)
            k.text(it, "›", "body", "color/fg/icon-subtle"); k.text(it, lab, "small")
        out[f"Actions {mode}"] = b
    return out


GLYPH = {"success": "✓", "warning": "!", "danger": "✕", "info": "i"}
COPY = {"success": ("Order placed", "25 shares of HDFC Bank at ₹1,642.30."), "warning": ("Market closes in 15 minutes", "Orders after 3:30 PM go to the next session."),
        "danger": ("Payment failed", "Your bank declined the transfer. No money was taken."), "info": ("New statement ready", "Your October statement is available to download.")}


def status(k, D):
    k.page("R5 Status")
    out = {}
    for i, mode in enumerate(["Light", "Dark"]):
        b = k.board("Reference · R5", f"Status — {mode}", "Alerts, badges and toasts for the four intents. Every one has an icon and words.", mode=mode, x=i * 1540, w=1460, name=f"Status {mode}")
        s = k.section(b, "01", "Alerts", "Tinted background, intent-coloured icon, normal text.")
        r = k.row(s, 16, wrap=True)
        for st in ["success", "warning", "danger", "info"]:
            a = k.frame(r, st, "horizontal", 12, 18, w=630, bind=f"color/bg/{st}-subtle", radius=10)
            k.text(a, GLYPH[st], "h3", f"color/fg/{st}")
            col = k.frame(a, "Text", gap=2, sizingH="fill")
            k.text(col, COPY[st][0], "body", weight=600); k.text(col, COPY[st][1], "small", "color/fg/muted", fill=True)
        s = k.section(b, "02", "Badges", "Solid for strong signals, subtle for quiet ones.")
        for style in ["solid", "subtle"]:
            row = k.row(s, 12, style, fill=False)
            for st, word in [("success", "Executed"), ("warning", "Pending"), ("danger", "Rejected"), ("info", "New"), ("brand", "Pro")]:
                bg = f"color/bg/{st}" if style == "solid" else f"color/bg/{st}-subtle"
                fg = f"color/fg/on-{st}" if style == "solid" else f"color/fg/{st}"
                bd = k.frame(row, word, "horizontal", 4, 0, bind=bg, radius=99, align="center"); k.pad(bd, 10, 10, 4, 4)
                k.text(bd, f"{GLYPH.get(st, '★')} {word}", "caption", fg, weight=700)
        s = k.section(b, "03", "Toast", "Floats at elevation 3: overlay surface, outline and shadow.")
        t_ = k.frame(s, "Toast", "horizontal", 12, 16, w=440, bind="color/bg/surface-overlay", radius=10, align="center", stroke="color/border/subtle", shadow=(3, (0, 6, 16)))
        k.text(t_, "✓", "h3", "color/fg/success"); k.text(t_, "Watchlist saved", "body", weight=600); k.spacer(t_)
        gb = k.frame(t_, "Undo", "horizontal", 0, 0, bind="color/action/ghost/bg", radius=4); k.pad(gb, 10, 10, 6, 6)
        k.text(gb, "Undo", "small", "color/action/ghost/fg", weight=600)
        out[f"Status {mode}"] = b
    return out


LEVELS = [("color/bg/canvas", None, None, "0", "Page"), ("color/bg/surface", 1, (0, 1, 3), "1", "Cards"), ("color/bg/surface-raised", 2, (0, 2, 8), "2", "Raised"),
          ("color/bg/surface-overlay", 3, (0, 6, 16), "3", "Menus"), ("color/bg/surface-overlay", 4, (0, 12, 32), "4", "Dialogs")]


def layering(k, D):
    k.page("R6 Layering")
    out = {}
    for i, mode in enumerate(["Light", "Dark"]):
        b = k.board("Reference · R6", f"Layering — {mode}", "Five levels. Each pairs a surface with a shadow colour from this foundation; levels 3 and 4 add an outline.", mode=mode, x=i * 1540, w=1460, name=f"Layering {mode}")
        s = k.section(b, "01", "Levels", "From the page up to dialogs.")
        row = k.row(s, 28)
        for bg, lvl, sh, n, lab in LEVELS:
            c = k.frame(row, lab, gap=6, pad=20, h=160, sizingV=None, sizingH="fill", bind=bg, radius=12,
                        shadow=(lvl, sh) if sh else None, stroke="color/border/subtle" if (lvl or 0) >= 3 else ("color/border/default" if lvl is None else None))
            k.text(c, f"Level {n}", "h3"); k.text(c, lab, "small", "color/fg/muted"); k.text(c, bg.replace("color/", ""), "mono", "color/fg/subtle")
        s = k.section(b, "02", "Dialog over scrim", "The scrim dims the page; the dialog sits at level 4.")
        sc = k.frame(s, "Scrim", "horizontal", 0, 56, sizingH="fill", bind="color/bg/scrim", radius=12, align="center", main="center")
        dlg = k.frame(sc, "Dialog", gap=12, pad=24, w=400, bind="color/bg/surface-overlay", radius=12, stroke="color/border/subtle", shadow=(4, (0, 12, 32)))
        k.text(dlg, "Cancel this order?", "h3"); k.text(dlg, "25 shares of HDFC Bank at ₹1,642.30. You can place it again later.", "small", "color/fg/muted", fill=True)
        act = k.row(dlg, 12, fill=False)
        k.btn(act, "color/action/secondary/bg", "color/action/secondary/fg", "Keep order", border="color/action/secondary/border")
        k.btn(act, "color/action/danger/bg", "color/action/danger/fg", "Cancel order")
        out[f"Layering {mode}"] = b
    return out


def data(k, D):
    k.page("R7 Data")
    out = {}
    for i, mode in enumerate(["Light", "Dark"]):
        dd = D["data"][mode]
        b = k.board("Reference · R7", f"Data colours — {mode}", "Gain and loss differ in lightness as well as hue and always carry a sign or arrow. The chart palette stays distinguishable for colour-blind readers.", mode=mode, x=i * 1540, w=1460, name=f"Data {mode}")
        s = k.section(b, "01", "Gain and loss", "Text roles for numbers, mark roles for candles and bars.")
        c = k.card(s, 20)
        row = k.row(c, 40, fill=False)
        for nm, val, var in [("NIFTY 50", "▲ +2.41%", "color/fg/gain"), ("BANKNIFTY", "▼ −0.86%", "color/fg/loss"), ("SENSEX", "▲ +1.12%", "color/fg/gain")]:
            q = k.frame(row, nm, gap=4); k.text(q, nm, "caption", "color/fg/muted"); k.text(q, val, "h2", var)
        candles = k.row(c, 10, "Candles", align="max", fill=False)
        for hgt, up in [(70, 1), (50, 0), (90, 1), (40, 0), (110, 1), (60, 0), (80, 1), (100, 1), (45, 0), (75, 1), (95, 1), (55, 0)]:
            k.rect(candles, 18, hgt, bind="color/data/gain" if up else "color/data/loss", radius=2)
        cv = k.row(c, 24, fill=False)
        for t, v in dd["cvd"].items():
            q = k.frame(cv, t, gap=2); k.text(q, t, "caption", "color/fg/subtle"); k.text(q, f"{v:.3f}", "num")
        k.text(c, "OKLab distance between gain and loss as seen with each type of vision. Rule: 0.10 or more for every type.", "small", "color/fg/muted", fill=True)
        s = k.section(b, "02", "Chart palette", "Use series in order: 1, 2, 3… Each stays 0.07 or more apart from every other under all three common colour-vision types (the Okabe-Ito palette scores 0.076), and keeps 3 : 1 against the surface.")
        c = k.card(s, 16)
        bars = k.row(c, 16, "Bars", align="max", fill=False)
        for n in range(1, 9):
            col = k.frame(bars, f"chart-{n}", gap=6, align="center")
            k.rect(col, 64, 50 + (n * 37) % 90, bind=f"color/data/chart-{n}", radius=4)
            k.text(col, f"chart-{n}", "caption", "color/fg/muted")
        out[f"Data {mode}"] = b
    return out


def in_use(k, D):
    k.page("R8 In use")
    out = {}
    for i, mode in enumerate(["Light", "Dark"]):
        s = k.frame(name=f"Trading screen {mode}", w=1280, gap=0, pad=0, bind="color/bg/canvas", x=i * 1360, radius=16, stroke="color/border/subtle")
        k.f.cmd("variable.setMode", ids=[s], collection="Color", mode=mode)
        hd = k.frame(s, "Header", "horizontal", 20, 18, sizingH="fill", bind="color/bg/surface-raised", align="center", stroke="color/border/subtle"); k.pad(hd, 32, 32)
        k.f.tool("set_properties", ids=[hd], props={"strokeSides": [0, 0, 1, 0]})
        k.text(hd, "Portfolio", "h3"); k.spacer(hd)
        for t, c in [("Markets", "color/fg/muted"), ("Orders", "color/fg/muted"), ("Statements", "color/fg/link")]:
            k.text(hd, t, "small", c, weight=500)
        body = k.frame(s, "Body", "horizontal", 24, 32, sizingH="fill")
        left = k.frame(body, "Left", gap=24, sizingH="fill")
        pc = k.card(left, 8, 24)
        k.text(pc, "Total value", "small", "color/fg/muted"); k.text(pc, "₹12,48,930.50", "h1")
        rw = k.row(pc, 12, fill=False); k.text(rw, "▲ +₹29,412.10", "body", "color/fg/gain", weight=600); k.text(rw, "+2.41% today", "body", "color/fg/muted")
        wl = k.card(left, 0, 0)
        hr = k.frame(wl, "Head", "horizontal", 16, 12, sizingH="fill", bind="color/bg/surface-sunken"); k.pad(hr, 24, 24)
        for t, fl in [("Instrument", True), ("Price", False), ("Change", False)]:
            cc = k.frame(hr, t, sizingH="fill" if fl else None, w=None if fl else 130); k.text(cc, t, "caption", "color/fg/muted", weight=700)
        for nm, px, ch, up, sel in [("HDFC Bank", "1,642.30", "+1.24%", 1, 0), ("Reliance", "2,918.75", "−0.62%", 0, 0), ("Infosys", "1,476.10", "+0.38%", 1, 1), ("Tata Motors", "1,012.40", "−1.85%", 0, 0)]:
            row = k.frame(wl, nm, "horizontal", 16, 14, sizingH="fill", bind="color/bg/selected" if sel else None, align="center", stroke="color/border/subtle"); k.pad(row, 24, 24)
            k.f.tool("set_properties", ids=[row], props={"strokeSides": [1, 0, 0, 0]})
            c1 = k.frame(row, "name", sizingH="fill"); k.text(c1, ("✓ " if sel else "") + nm, "body", weight=600)
            c2 = k.frame(row, "price", w=130); k.text(c2, f"₹{px}", "body")
            c3 = k.frame(row, "change", w=130); k.text(c3, ("▲ " if up else "▼ ") + ch, "body", "color/fg/gain" if up else "color/fg/loss", weight=600)
        right = k.frame(body, "Order", gap=16, pad=24, w=400, bind="color/bg/surface", radius=16, stroke="color/border/subtle")
        k.text(right, "Buy Infosys", "h3")
        seg = k.frame(right, "Side", "horizontal", 0, 4, sizingH="fill", bind="color/bg/surface-sunken", radius=6)
        for t, on in [("Buy", 1), ("Sell", 0)]:
            sg = k.frame(seg, t, "horizontal", 0, 8, sizingH="fill", bind="color/action/primary/bg" if on else None, radius=4, align="center", main="center")
            k.text(sg, t, "small", "color/action/primary/fg" if on else "color/fg/muted", weight=600)
        for lab, val, focus in [("Quantity", "25", False), ("Limit price", "1,476.10", True)]:
            col = k.frame(right, lab, gap=6, sizingH="fill"); k.text(col, lab, "small", weight=600)
            host = k.ring(col) if focus else col
            inp = k.frame(host, "Input", "horizontal", 0, 0, w=320 if focus else None, h=40, sizingV=None, sizingH=None if focus else "fill", bind="color/bg/surface", radius=4, align="center", stroke="color/border/input"); k.pad(inp, 12)
            k.text(inp, val, "body")
        al = k.frame(right, "Alert", "horizontal", 10, 12, sizingH="fill", bind="color/bg/warning-subtle", radius=8)
        k.text(al, "!", "body", "color/fg/warning", weight=700); k.text(al, "Market closes in 15 minutes.", "small", fill=True)
        tot = k.row(right, 0); k.text(tot, "Estimated total", "small", "color/fg/muted"); k.spacer(tot); k.text(tot, "₹36,902.50", "body", weight=700)
        k.btn(right, "color/action/primary/bg", "color/action/primary/fg", "Place buy order", fillw=True)
        out[f"In use {mode}"] = s
    return out


def do_avoid(k, D):
    k.page("R9 Do and avoid")
    b = k.board("Reference · R9", "Do and avoid", "Each pair shows the right way, the common mistake, and why it matters.")
    pairs_ = [
        ("Show change with a sign or arrow", "▲ +2.41%", "color/fg/gain", "Colour alone for change", "+2.41%", "color/fg/gain", "Red and green look alike to many people. The arrow carries the meaning.", "1.4.1"),
        ("Underline links", "View statement", "color/fg/link", "Links shown by colour only", "View statement", "color/fg/link", "Without an underline, a link is just blue text to anyone who can't tell blue from black.", "1.4.1"),
        ("Use the on- colour on a fill", "Buy", "color/action/primary/fg", "Brand text on the brand fill", "Buy", "color/fg/brand", "Brand text on brand fill is 1.2 : 1 — the label disappears.", "1.4.3"),
        ("Inputs use border/input", "Quantity", "color/border/input", "Decorative borders on inputs", "Quantity", "color/border/subtle", "If people can't see the edge of a field, they can't find where to type. Input borders need 3 : 1.", "1.4.11"),
    ]
    for i, (dt, ds, dc, at, as_, ac, why, wcag) in enumerate(pairs_):
        s = k.section(b, f"0{i + 1}", dt, f"WCAG {wcag}")
        r = k.row(s, 24, align="min")
        for kind, title, sample, colvar in [("do", dt, ds, dc), ("avoid", at, as_, ac)]:
            c = k.card(r, 14, 24)
            k.inst(kind, c)
            demo = k.frame(c, "Demo", "horizontal", 0, 20, sizingH="fill", radius=10, bind="color/bg/surface-sunken", align="center")
            if i == 1:
                t_ = k.text(demo, sample, "h3", colvar)
                if kind == "do": k.f.cmd("text.style", id=t_, textDecoration="underline")
            elif i == 2:
                k.btn(demo, "color/action/primary/bg", colvar, sample)
            elif i == 3:
                fld = k.frame(demo, "Field", "horizontal", 0, 0, w=240, h=40, sizingV=None, bind="color/bg/surface", radius=4, align="center", stroke=colvar); k.pad(fld, 12)
                k.text(fld, sample, "body", "color/fg/subtle")
            else:
                k.text(demo, sample, "h2", colvar)
            k.text(c, title, "h3", fill=True)
        k.inst("why", r, {"Body": why})
    return b


FIXES = {"color/fg/subtle|color/bg/brand": "fg/on-brand", "color/fg/brand|color/bg/brand": "fg/on-brand", "color/fg/on-brand|color/bg/warning": "fg/on-warning",
         "color/fg/gain|color/bg/success": "fg/on-success", "color/fg/muted|color/bg/danger": "fg/on-danger", "color/border/subtle|color/bg/surface": "border/input"}


def not_allowed(k, D):
    k.page("R10 Not allowed")
    b = k.board("Reference · R10", "Not allowed", "Pairs outside the contract, measured. Each fails in at least one mode — and each has a role that fixes it.")
    r = k.row(b, 24, wrap=True)
    for bad in D["bad"]:
        c = k.frame(r, bad["label"], gap=12, pad=24, w=410, bind="color/bg/surface", radius=16, stroke="color/border/subtle")
        k.inst("avoid", c)
        demo = k.frame(c, "Demo", "horizontal", 12, 20, sizingH="fill", bind=bad["bg"], radius=10, align="center")
        if bad["fg"].startswith("color/border"):
            bx = k.frame(demo, "Input", "horizontal", 0, 0, w=220, h=40, sizingV=None, bind="color/bg/surface", radius=4, align="center", stroke=bad["fg"]); k.pad(bx, 12)
            k.text(bx, "Quantity", "body", "color/fg/subtle")
        else:
            k.text(demo, "Aa  Place order", "h3", bad["fg"])
        k.text(c, bad["label"], "h3", fill=True)
        k.text(c, f"{bad['fg'].replace('color/', '')} on {bad['bg'].replace('color/', '')}", "mono", "color/fg/muted")
        k.text(c, f"Light {bad['Light']:.2f} : 1  ·  Dark {bad['Dark']:.2f} : 1  ·  needs {bad['min']} : 1", "small", "color/fg/danger", weight=600)
        fx = k.row(c, 8, align="center"); k.inst("do", fx); k.text(fx, "Use " + FIXES[f"{bad['fg']}|{bad['bg']}"], "small", "color/fg/default", weight=600)
    return b


def handoff(k, D):
    k.page("R11 Handoff")
    P = D.get("prefix", "ds")
    b = k.board("Reference · R11", "Handoff", "One name in three places: Figma variable, CSS custom property and Tailwind class. Modes switch in code the way they switch in Figma.")
    s = k.section(b, "01", "Name map", "The most used roles. Every role follows the same pattern.")
    tbl = k.card(s, 0, 0)
    cols = [("Figma variable", 300), ("CSS custom property", 380), ("Tailwind (v4)", 260), ("Light", 120), ("Dark", 120)]
    hr = k.frame(tbl, "Head", "horizontal", 16, 14, sizingH="fill", bind="color/bg/surface-sunken"); k.pad(hr, 24, 24)
    for t, w in cols:
        cc = k.frame(hr, t, w=w); k.text(cc, t, "caption", "color/fg/muted", weight=700)
    semd = {t["v"]: t for t in D["sem"]}
    for v, tw in [("color/bg/canvas", "bg-bg-canvas"), ("color/bg/surface", "bg-bg-surface"), ("color/action/primary/bg", "bg-action-primary-bg"),
                  ("color/action/primary/fg", "text-action-primary-fg"), ("color/fg/default", "text-fg-default"), ("color/fg/muted", "text-fg-muted"),
                  ("color/fg/link", "text-fg-link"), ("color/fg/icon", "text-fg-icon"), ("color/border/input", "border-border-input"),
                  ("color/border/focus", "outline-border-focus"), ("color/fg/gain", "text-fg-gain"), ("color/data/chart-1", "fill-data-chart-1")]:
        row = k.frame(tbl, v, "horizontal", 16, 12, sizingH="fill", align="center", stroke="color/border/subtle"); k.pad(row, 24, 24)
        k.f.tool("set_properties", ids=[row], props={"strokeSides": [1, 0, 0, 0]})
        vals = [v, f"var(--{P}-{v.replace('/', '-')})", tw, semd[v]["light"][:7], semd[v]["dark"][:7]]
        for (t, w), val in zip(cols, vals):
            cc = k.frame(row, t, "horizontal", 8, 0, w=w, align="center")
            if t in ("Light", "Dark"): k.rect(cc, 16, 16, fill=val, radius=4, stroke="color/border/default")
            k.text(cc, val, "mono", "color/fg/default" if t == "Figma variable" else "color/fg/muted", weight=600 if t == "Figma variable" else 400)
    s = k.section(b, "02", "In code", "Three snippets cover most of the work.")
    r = k.row(s, 24, align="min")
    for title, code in [("Switch theme", '<html data-theme="dark">\n\n/* or follow the OS */\n@media (prefers-color-scheme: dark) { … }'),
                        ("Use a role", f".card {{\n  background: var(--{P}-color-bg-surface);\n  color: var(--{P}-color-fg-default);\n  border: 1px solid var(--{P}-color-border-subtle);\n}}"),
                        ("Focus ring (built in)", f":focus-visible {{\n  outline: 2px solid var(--{P}-color-border-focus);\n  outline-offset: 2px;\n}}")]:
        c = k.card(r, 12, 24); k.text(c, title, "h3")
        cb = k.frame(c, "Code", gap=0, pad=16, sizingH="fill", bind="color/bg/surface-sunken", radius=8)
        k.text(cb, code, "mono", "color/fg/default")
    return b


def checks(k, D):
    k.page("R12 Checks")
    b = k.board("Reference · R12", "Build checks", f"Results from the engine run that generated this file (brand {D['brand']}). {D['counts']['pairs']} pairs measured.")
    c = k.card(b, 4, 24)
    for ch in D["checks"]:
        row = k.frame(c, ch["id"], "horizontal", 16, 10, sizingH="fill", align="center")
        st = ch["status"]
        badge = k.frame(row, "Badge", "horizontal", 0, 0, bind="color/bg/success-subtle" if st == "pass" else ("color/bg/info-subtle" if st == "info" else "color/bg/danger-subtle"), radius=99); k.pad(badge, 10, 10, 3, 3)
        k.text(badge, st.upper(), "caption", "color/fg/success" if st == "pass" else ("color/fg/info" if st == "info" else "color/fg/danger"), weight=700)
        k.text(row, ch["id"], "mono", weight=600)
        k.text(row, ch["title"], "body", fill=True)
        k.text(row, f"{ch['wcag']} · {ch['level']} · {ch['summary']}", "small", "color/fg/muted")
    return b


REFERENCE = [scales, roles, pairs, actions, status, layering, data, in_use, do_avoid, not_allowed, handoff, checks]

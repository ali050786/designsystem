# Version 2 pages. Executed inside build_colour.py (uses f, frame, text, rect, page, board, card, D, made).

def btn(parent, bg, fg, label, outline=None, name="Button"):
    b = frame(parent, name, "horizontal", 0, 0, bind=bg, radius=4, align="center")
    f.tool("set_properties", ids=[b], props={"paddingLeft": 20, "paddingRight": 20, "paddingTop": 10, "paddingBottom": 10})
    if outline:
        f.tool("set_properties", ids=[b], props={"strokes": ["#000000"], "strokeWeight": 1, "strokeAlign": "inside"})
        f.cmd("variable.bind", ids=[b], field="stroke", variable=outline)
    text(b, label, 15, 600, fg)
    return b

def ring(parent, name="Focus ring", radius=8):
    """Focus ring: 2px ring, 2px offset, drawn as a wrapper (ring radius = shape + offset)."""
    w = frame(parent, name, "horizontal", 0, 4, radius=radius, align="center")
    f.tool("set_properties", ids=[w], props={"strokes": ["#000000"], "strokeWeight": 2, "strokeAlign": "inside"})
    f.cmd("variable.bind", ids=[w], field="stroke", variable="color/border/focus")
    return w

def labelled(parent, caption, name=None):
    col = frame(parent, name or caption, gap=8, align="center")
    return col, (lambda: text(col, caption, 12, 500, "color/fg/muted"))

def field(parent, label, value, border="color/border/input", bg="color/bg/surface", fg="color/fg/default",
          width=240, weight=1, helper=None, helper_color="color/fg/muted"):
    col = frame(parent, label, gap=6)
    text(col, label, 13, 600, "color/fg/default")
    box = frame(col, "Input", "horizontal", 0, 0, w=width, h=40, sizingV=None, bind=bg, radius=4, align="center")
    f.tool("set_properties", ids=[box], props={"paddingLeft": 12, "strokes": ["#000000"], "strokeWeight": weight, "strokeAlign": "inside"})
    f.cmd("variable.bind", ids=[box], field="stroke", variable=border)
    text(box, value, 15, 400, fg, tabular=True)
    if helper:
        text(col, helper, 12, 500, helper_color)
    return col, box

# ---------------------------------------------------------------- States
page("States")
for i, mode in enumerate(["Light", "Dark"]):
    b = board(f"States — {mode}", "Every interactive state has its own role, so contrast holds in each. Focus is a 2px ring with a 2px gap, in border/focus.", mode=mode, x=i * 1100, w=1040, name=f"States {mode}")
    k = card(b, name="Buttons")
    text(k, "Buttons", 20, 600)
    row = frame(k, "Row", "horizontal", 24, 0, align="max")
    for cap, bg, fg in [("Default", "color/bg/brand", "color/fg/on-brand"), ("Hover", "color/bg/brand-hover", "color/fg/on-brand"),
                        ("Pressed", "color/bg/brand-pressed", "color/fg/on-brand"), ("Disabled", "color/bg/disabled", "color/fg/disabled")]:
        col, cap_ = labelled(row, cap); btn(col, bg, fg, "Place order"); cap_()
    col, cap_ = labelled(row, "Focused"); r_ = ring(col); btn(r_, "color/bg/brand", "color/fg/on-brand", "Place order"); cap_()
    row2 = frame(k, "Secondary", "horizontal", 24, 0, align="max")
    for cap, bg in [("Secondary", "color/bg/surface"), ("Hover", "color/bg/surface-hover"), ("Pressed", "color/bg/surface-pressed")]:
        col, cap_ = labelled(row2, cap); btn(col, bg, "color/fg/default", "Cancel", outline="color/border/strong"); cap_()

    k = card(b, name="Rows")
    text(k, "List and table rows", 20, 600)
    for cap, bg in [("Default", "color/bg/surface"), ("Hover", "color/bg/surface-hover"), ("Pressed", "color/bg/surface-pressed"), ("Selected", "color/bg/selected")]:
        row = frame(k, cap, "horizontal", 16, 12, sizingH="fill", bind=bg, radius=6, align="center")
        text(row, "HDFC Bank", 15, 600)
        nm = frame(row, "spacer", sizingH="fill")
        text(row, "₹1,642.30", 15, 500, tabular=True)
        text(row, "▲ +1.24%", 14, 600, "color/fg/gain", tabular=True)
        text(row, cap, 12, 500, "color/fg/muted")

    k = card(b, name="Inputs")
    text(k, "Inputs", 20, 600)
    row = frame(k, "Row", "horizontal", 24, 0)
    field(row, "Quantity", "25", helper="Default · border/input")
    col = frame(row, "Focused", gap=6)
    text(col, "Price", 13, 600)
    r_ = ring(col, radius=8)
    box = frame(r_, "Input", "horizontal", 0, 0, w=232, h=40, sizingV=None, bind="color/bg/surface", radius=4, align="center")
    f.tool("set_properties", ids=[box], props={"paddingLeft": 12, "strokes": ["#000000"], "strokeWeight": 1, "strokeAlign": "inside"})
    f.cmd("variable.bind", ids=[box], field="stroke", variable="color/border/input")
    text(box, "1,642.30", 15, 400, tabular=True)
    text(col, "Focused · border/focus ring", 12, 500, "color/fg/muted")
    row = frame(k, "Row 2", "horizontal", 24, 0)
    field(row, "Amount", "−500", border="color/border/danger", weight=2, helper="✕ Enter an amount above ₹0", helper_color="color/fg/danger")
    field(row, "Account", "Linked", border="color/border/subtle", bg="color/bg/disabled", fg="color/fg/disabled", helper="Disabled · exempt from contrast")
    made[f"States {mode}"] = b

# ---------------------------------------------------------------- Status
page("Status")
glyph = {"success": "✓", "warning": "!", "danger": "✕", "info": "i"}
copy = {"success": ("Order placed", "25 shares of HDFC Bank at ₹1,642.30."),
        "warning": ("Market closes in 15 minutes", "Orders after 3:30 PM go to the next session."),
        "danger": ("Payment failed", "Your bank declined the transfer. No money was taken."),
        "info": ("New statement ready", "Your October statement is available to download.")}
for i, mode in enumerate(["Light", "Dark"]):
    b = board(f"Status — {mode}", "Status colours always come with an icon and words. Subtle backgrounds carry body text; solid fills take their on- colour.", mode=mode, x=i * 1100, w=1040, name=f"Status {mode}")
    k = card(b, name="Alerts")
    text(k, "Alerts", 20, 600)
    for s in ["success", "warning", "danger", "info"]:
        a = frame(k, s, "horizontal", 12, 16, sizingH="fill", bind=f"color/bg/{s}-subtle", radius=8)
        text(a, glyph[s], 18, 700, f"color/fg/{s}")
        col = frame(a, "Text", gap=2, sizingH="fill")
        text(col, copy[s][0], 15, 600, "color/fg/default")
        text(col, copy[s][1], 14, 400, "color/fg/muted", fill=True)
    k = card(b, name="Badges")
    text(k, "Badges", 20, 600)
    for style in ["solid", "subtle"]:
        row = frame(k, style, "horizontal", 12, 0)
        for s, word in [("success", "Executed"), ("warning", "Pending"), ("danger", "Rejected"), ("info", "New"), ("brand", "Pro")]:
            bg = f"color/bg/{s}" if style == "solid" else f"color/bg/{s}-subtle"
            fg = f"color/fg/on-{s}" if style == "solid" else (f"color/fg/{s}")
            bd = frame(row, word, "horizontal", 4, 0, bind=bg, radius=99, align="center")
            f.tool("set_properties", ids=[bd], props={"paddingLeft": 10, "paddingRight": 10, "paddingTop": 4, "paddingBottom": 4})
            text(bd, f"{glyph.get(s, '★')} {word}", 13, 600, fg)
    k = card(b, name="Toast")
    text(k, "Toast", 20, 600)
    t_ = frame(k, "Toast", "horizontal", 12, 16, w=420, sizingV="hug", bind="color/bg/surface-overlay", radius=10, align="center")
    f.tool("set_properties", ids=[t_], props={"strokes": ["#000000"], "strokeWeight": 1, "strokeAlign": "inside",
                                              "effects": [{"type": "dropShadow", "color": "#00000033", "offset": [0, 6], "radius": 16, "spread": 0}]})
    f.cmd("variable.bind", ids=[t_], field="stroke", variable="color/border/subtle")
    f.cmd("variable.bind", ids=[t_], field="effects/0/color", variable="color/shadow/3")
    text(t_, "✓", 18, 700, "color/fg/success")
    text(t_, "Watchlist saved", 15, 600)
    sp = frame(t_, "spacer", sizingH="fill")
    text(t_, "Undo", 15, 600, "color/fg/link")
    made[f"Status {mode}"] = b

# ---------------------------------------------------------------- Layering
page("Layering")
levels = [("color/bg/canvas", None, None, "0 · Page"), ("color/bg/surface", 1, (0, 1, 3), "1 · Cards"),
          ("color/bg/surface-raised", 2, (0, 2, 8), "2 · Raised"), ("color/bg/surface-overlay", 3, (0, 6, 16), "3 · Menus"),
          ("color/bg/surface-overlay", 4, (0, 12, 32), "4 · Dialogs")]
for i, mode in enumerate(["Light", "Dark"]):
    b = board(f"Layering — {mode}", "Each level pairs a surface with a shadow whose colour comes from Colour. Overlays add an outline, so layers never rely on shadow alone. In Dark, higher means lighter.", mode=mode, x=i * 1240, w=1180, name=f"Layering {mode}")
    row = frame(b, "Levels", "horizontal", 28, 24, sizingH="fill", bind="color/bg/canvas")
    for bg, lvl, sh, cap in levels:
        c_ = frame(row, cap, gap=8, pad=20, w=180, h=150, sizingV=None, bind=bg, radius=12)
        if sh:
            f.tool("set_properties", ids=[c_], props={"effects": [{"type": "dropShadow", "color": "#00000022", "offset": [sh[0], sh[1]], "radius": sh[2], "spread": 0}]})
            f.cmd("variable.bind", ids=[c_], field="effects/0/color", variable=f"color/shadow/{lvl}")
        if lvl and lvl >= 3:
            f.tool("set_properties", ids=[c_], props={"strokes": ["#000000"], "strokeWeight": 1, "strokeAlign": "inside"})
            f.cmd("variable.bind", ids=[c_], field="stroke", variable="color/border/subtle")
        if lvl is None:
            f.tool("set_properties", ids=[c_], props={"strokes": ["#000000"], "strokeWeight": 1, "strokeAlign": "inside", "dashes": [4, 4]})
            f.cmd("variable.bind", ids=[c_], field="stroke", variable="color/border/default")
        text(c_, f"Level {cap}", 15, 600)
        text(c_, bg.replace("color/", ""), 12, 400, "color/fg/muted", mono=True)
    k = card(b, name="Dialog demo")
    text(k, "Dialog over scrim", 20, 600)
    sc = frame(k, "Scrim", "horizontal", 0, 48, sizingH="fill", bind="color/bg/scrim", radius=12, align="center")
    f.tool("set_properties", ids=[sc], props={"mainAlign": "center"})
    dlg = frame(sc, "Dialog", gap=12, pad=24, w=380, sizingV="hug", bind="color/bg/surface-overlay", radius=12)
    f.tool("set_properties", ids=[dlg], props={"strokes": ["#000000"], "strokeWeight": 1, "strokeAlign": "inside",
                                               "effects": [{"type": "dropShadow", "color": "#00000033", "offset": [0, 12], "radius": 32, "spread": 0}]})
    f.cmd("variable.bind", ids=[dlg], field="stroke", variable="color/border/subtle")
    f.cmd("variable.bind", ids=[dlg], field="effects/0/color", variable="color/shadow/4")
    text(dlg, "Cancel this order?", 20, 600)
    text(dlg, "25 shares of HDFC Bank at ₹1,642.30. You can place it again later.", 14, 400, "color/fg/muted", fill=True)
    act = frame(dlg, "Actions", "horizontal", 12, 0)
    btn(act, "color/bg/surface", "color/fg/default", "Keep order", outline="color/border/strong")
    btn(act, "color/bg/danger", "color/fg/on-danger", "Cancel order")
    made[f"Layering {mode}"] = b

# ---------------------------------------------------------------- Not allowed
page("Not allowed")
fixes = {"color/fg/subtle|color/bg/brand": "color/fg/on-brand", "color/fg/brand|color/bg/brand": "color/fg/on-brand",
         "color/fg/on-brand|color/bg/warning": "color/fg/on-warning", "color/fg/gain|color/bg/success": "color/fg/on-success",
         "color/fg/muted|color/bg/danger": "color/fg/on-danger", "color/border/subtle|color/bg/surface": "color/border/input"}
b = board("Not allowed", "Pairs outside the contract, measured. Each fails WCAG in at least one mode — and each has a role that fixes it.", w=1440)
grid = frame(b, "Grid", "horizontal", 24, 0, sizingH="fill", wrap=True)
f.tool("set_properties", ids=[grid], props={"crossGap": 24})
for bad in D["bad"]:
    k = frame(grid, bad["label"], gap=12, pad=24, w=410, sizingV="hug", bind="color/bg/surface", radius=16, strokeBind="color/border/subtle")
    text(k, "Avoid", 13, 700, "color/fg/danger")
    demo = frame(k, "Demo", "horizontal", 12, 20, sizingH="fill", bind=bad["bg"], radius=10, align="center")
    if bad["fg"].startswith("color/border"):
        bx = frame(demo, "Input", "horizontal", 0, 0, w=220, h=40, sizingV=None, bind="color/bg/surface", radius=4, align="center")
        f.tool("set_properties", ids=[bx], props={"paddingLeft": 12, "strokes": ["#000000"], "strokeWeight": 1, "strokeAlign": "inside"})
        f.cmd("variable.bind", ids=[bx], field="stroke", variable=bad["fg"])
        text(bx, "Quantity", 15, 400, "color/fg/subtle")
    else:
        text(demo, "Aa  Place order", 18, 600, bad["fg"])
    text(k, bad["label"], 16, 600, fill=True)
    text(k, f"{bad['fg'].replace('color/', '')} on {bad['bg'].replace('color/', '')}", 12, 400, "color/fg/muted", mono=True)
    text(k, f"Light {bad['Light']:.2f} : 1   ·   Dark {bad['Dark']:.2f} : 1   ·   needs {bad['min']} : 1", 14, 600, "color/fg/danger", tabular=True)
    fix = fixes[f"{bad['fg']}|{bad['bg']}"]
    text(k, f"Use instead: {fix.replace('color/', '')}", 14, 600, "color/fg/success")
made["Not allowed"] = b

# ---------------------------------------------------------------- In use
page("In use")
for i, mode in enumerate(["Light", "Dark"]):
    s = frame(name=f"Trading screen {mode}", w=1200, gap=0, pad=0, bind="color/bg/canvas", x=i * 1280)
    f.cmd("variable.setMode", ids=[s], collection="Color", mode=mode)
    hd = frame(s, "Header", "horizontal", 16, 20, sizingH="fill", bind="color/bg/surface", align="center")
    f.tool("set_properties", ids=[hd], props={"paddingLeft": 32, "paddingRight": 32, "strokes": ["#000000"], "strokeWeight": 1, "strokeSides": [0, 0, 1, 0], "strokeAlign": "inside"})
    f.cmd("variable.bind", ids=[hd], field="stroke", variable="color/border/subtle")
    text(hd, "Portfolio", 18, 700)
    sp = frame(hd, "spacer", sizingH="fill")
    for t, c in [("Markets", "color/fg/muted"), ("Orders", "color/fg/muted"), ("Statements", "color/fg/link")]:
        text(hd, t, 15, 500, c)
    body = frame(s, "Body", "horizontal", 24, 32, sizingH="fill")
    left = frame(body, "Left", gap=24, sizingH="fill")
    pc = card(left, 8, 24, name="Value")
    text(pc, "Total value", 13, 500, "color/fg/muted")
    text(pc, "₹12,48,930.50", 36, 700, tabular=True)
    rw = frame(pc, "Change", "horizontal", 12, 0)
    text(rw, "▲ +₹29,412.10", 15, 600, "color/fg/gain", tabular=True)
    text(rw, "+2.41% today", 15, 500, "color/fg/muted", tabular=True)
    wl = card(left, 0, 0, name="Watchlist")
    hr = frame(wl, "Head", "horizontal", 16, 12, sizingH="fill", bind="color/bg/surface-sunken")
    f.tool("set_properties", ids=[hr], props={"paddingLeft": 24, "paddingRight": 24})
    for t, flex in [("Instrument", True), ("Price", False), ("Change", False)]:
        cc = frame(hr, t, sizingH="fill" if flex else None, w=None if flex else 120, sizingV="hug")
        text(cc, t, 12, 600, "color/fg/muted")
    for nm, px, ch, up, sel in [("HDFC Bank", "1,642.30", "+1.24%", 1, 0), ("Reliance", "2,918.75", "−0.62%", 0, 0),
                                ("Infosys", "1,476.10", "+0.38%", 1, 1), ("Tata Motors", "1,012.40", "−1.85%", 0, 0)]:
        row = frame(wl, nm, "horizontal", 16, 14, sizingH="fill", bind="color/bg/selected" if sel else "color/bg/surface", align="center")
        f.tool("set_properties", ids=[row], props={"paddingLeft": 24, "paddingRight": 24, "strokes": ["#000000"], "strokeWeight": 1, "strokeSides": [1, 0, 0, 0], "strokeAlign": "inside"})
        f.cmd("variable.bind", ids=[row], field="stroke", variable="color/border/subtle")
        c1 = frame(row, "name", sizingH="fill"); text(c1, nm, 15, 600)
        c2 = frame(row, "price", w=120, sizingV="hug"); text(c2, f"₹{px}", 15, 500, tabular=True)
        c3 = frame(row, "change", w=120, sizingV="hug"); text(c3, ("▲ " if up else "▼ ") + ch, 15, 600, "color/fg/gain" if up else "color/fg/loss", tabular=True)
    right = frame(body, "Order", gap=16, pad=24, w=380, sizingV="hug", bind="color/bg/surface", radius=16, strokeBind="color/border/subtle")
    text(right, "Buy Infosys", 20, 700)
    seg = frame(right, "Side", "horizontal", 0, 4, sizingH="fill", bind="color/bg/surface-sunken", radius=6)
    for t, on in [("Buy", 1), ("Sell", 0)]:
        sg = frame(seg, t, "horizontal", 0, 8, sizingH="fill", bind="color/bg/brand" if on else "color/bg/surface-sunken", radius=4, align="center")
        f.tool("set_properties", ids=[sg], props={"mainAlign": "center"})
        text(sg, t, 14, 600, "color/fg/on-brand" if on else "color/fg/muted")
    field(right, "Quantity", "25", width=332)
    col = frame(right, "Price", gap=6)
    text(col, "Limit price", 13, 600)
    r_ = ring(col, radius=8)
    box = frame(r_, "Input", "horizontal", 0, 0, w=324, h=40, sizingV=None, bind="color/bg/surface", radius=4, align="center")
    f.tool("set_properties", ids=[box], props={"paddingLeft": 12, "strokes": ["#000000"], "strokeWeight": 1, "strokeAlign": "inside"})
    f.cmd("variable.bind", ids=[box], field="stroke", variable="color/border/input")
    text(box, "1,476.10", 15, 400, tabular=True)
    al = frame(right, "Alert", "horizontal", 10, 12, sizingH="fill", bind="color/bg/warning-subtle", radius=8)
    text(al, "!", 16, 700, "color/fg/warning")
    text(al, "Market closes in 15 minutes.", 14, 500, "color/fg/default", fill=True)
    tot = frame(right, "Total", "horizontal", 0, 0, sizingH="fill")
    text(tot, "Estimated total", 14, 500, "color/fg/muted")
    sp = frame(tot, "spacer", sizingH="fill")
    text(tot, "₹36,902.50", 16, 700, tabular=True)
    pb = btn(right, "color/bg/brand", "color/fg/on-brand", "Place buy order", name="Primary")
    f.tool("set_properties", ids=[pb], props={"sizingH": "fill", "mainAlign": "center"})
    made[f"In use {mode}"] = s

# ---------------------------------------------------------------- Handoff
page("Handoff")
P = D.get("prefix", "ds")
b = board("Handoff", "One name, three places. Figma variable → CSS custom property → Tailwind class. Modes switch in code the same way they switch in Figma.", w=1440)
k = card(b, 0, 0, name="Name map")
hr = frame(k, "Head", "horizontal", 16, 14, sizingH="fill", bind="color/bg/surface-sunken")
f.tool("set_properties", ids=[hr], props={"paddingLeft": 24, "paddingRight": 24})
cols = [("Figma variable", 260), ("CSS custom property", 330), ("Tailwind (v4)", 240), ("Light", 120), ("Dark", 120)]
for t, wdt in cols:
    cc = frame(hr, t, w=wdt, sizingV="hug"); text(cc, t, 12, 600, "color/fg/muted")
semd = {t["v"]: t for t in D["sem"]}
for v, tw in [("color/bg/canvas", "bg-bg-canvas"), ("color/bg/surface", "bg-bg-surface"), ("color/bg/brand", "bg-bg-brand"),
              ("color/fg/default", "text-fg-default"), ("color/fg/muted", "text-fg-muted"), ("color/fg/on-brand", "text-fg-on-brand"),
              ("color/fg/link", "text-fg-link"), ("color/border/input", "border-border-input"), ("color/border/focus", "outline-border-focus"),
              ("color/fg/gain", "text-fg-gain"), ("color/data/chart-1", "fill-data-chart-1")]:
    row = frame(k, v, "horizontal", 16, 12, sizingH="fill", align="center")
    f.tool("set_properties", ids=[row], props={"paddingLeft": 24, "paddingRight": 24, "strokes": ["#000000"], "strokeWeight": 1, "strokeSides": [1, 0, 0, 0], "strokeAlign": "inside"})
    f.cmd("variable.bind", ids=[row], field="stroke", variable="color/border/subtle")
    vals = [v, f"var(--{P}-{v.replace('/', '-')})", tw, semd[v]["light"][:7], semd[v]["dark"][:7]]
    for (t, wdt), val in zip(cols, vals):
        cc = frame(row, t, "horizontal", 8, 0, w=wdt, sizingV="hug", align="center")
        if t in ("Light", "Dark"):
            sw_ = rect(cc, 16, 16, fill=val, radius=4)
            f.tool("set_properties", ids=[sw_], props={"strokes": ["#000000"], "strokeWeight": 1, "strokeAlign": "inside"})
            f.cmd("variable.bind", ids=[sw_], field="stroke", variable="color/border/default")
        text(cc, val, 13, 500 if t == "Figma variable" else 400, "color/fg/default" if t == "Figma variable" else "color/fg/muted", mono=True)
row = frame(b, "Code", "horizontal", 24, 0, sizingH="fill")
for title, code in [
    ("Switch theme", f'<html data-theme="dark">\n\n/* or follow the OS: */\n@media (prefers-color-scheme: dark) {{ … }}'),
    ("Use a role", f".card {{\n  background: var(--{P}-color-bg-surface);\n  color: var(--{P}-color-fg-default);\n  border: 1px solid var(--{P}-color-border-subtle);\n}}"),
    ("Focus ring (built in)", f":focus-visible {{\n  outline: 2px solid var(--{P}-color-border-focus);\n  outline-offset: 2px;\n}}"),
]:
    k = card(row, 12, 24, name=title)
    text(k, title, 18, 600)
    cb = frame(k, "Code", gap=0, pad=16, sizingH="fill", bind="color/bg/surface-sunken", radius=8)
    text(cb, code, 13, 400, "color/fg/default", mono=True, lh=20)
k = card(b, 8, 24, name="Scopes")
text(k, "Where each group appears in Figma's pickers", 18, 600)
for g_, sc in [("bg/*", "Frame and shape fills"), ("fg/*", "Text fills (and icon shapes)"), ("border/*", "Strokes"),
               ("data/*", "Shape fills and strokes (charts)"), ("shadow/*", "Effect colours"), ("Primitives", "Hidden — never picked directly")]:
    row = frame(k, g_, "horizontal", 16, 4, sizingH="fill")
    cc = frame(row, "g", w=160, sizingV="hug"); text(cc, g_, 14, 600, mono=True)
    text(row, sc, 14, 400, "color/fg/muted")
made["Handoff"] = b

# ---------------------------------------------------------------- page order
ORDER = ["Cover", "Overview", "Scales", "Roles", "Pairs", "States", "Status", "Layering", "Data", "In use", "Usage", "Not allowed", "Handoff", "Checks"]
pl = f.cmd("page.list"); pl = pl.get("pages", pl) if isinstance(pl, dict) else pl
byname = {p_["name"]: p_["id"] for p_ in pl}
for idx, nm in enumerate(ORDER):
    if nm in byname:
        f.cmd("page.move", id=byname[nm], index=idx)
if "Page 1" in byname and "Page 1" not in ORDER:
    f.cmd("page.delete", id=byname["Page 1"])

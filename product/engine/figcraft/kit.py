"""Doc kit for the ds foundation files: type scale, layout helpers and reusable components (FigCraft MCP)."""
import json

FONT, MONO = "Inter", "JetBrains Mono"
# Type scale used by every documentation page (px size, line height, weight).
TYPE = {
    "display": (64, 72, 700), "h1": (48, 56, 700), "lead": (20, 30, 400), "h2": (28, 36, 600),
    "h3": (20, 28, 600), "body": (16, 24, 400), "small": (14, 20, 400), "caption": (12, 16, 500),
    "eyebrow": (13, 16, 600), "mono": (13, 20, 400), "num": (16, 24, 600),
}
PAGE_W, PAGE_PAD, CONTENT_W = 1440, 80, 1280


class Kit:
    def __init__(self, f):
        self.f = f
        self.comp = {}

    # ------------------------------------------------------------ primitives
    def frame(self, parent=None, name="frame", direction="vertical", gap=0, pad=0, w=None, h=None, bind=None,
              sizingH=None, sizingV="hug", radius=None, stroke=None, align=None, main=None, wrap=False, x=0, y=0,
              fill=None, strokeW=1, effects=None, shadow=None):
        f = self.f
        props = {"layout": direction, "gap": gap, "padding": pad, "fills": [fill] if fill else []}
        if sizingV: props["sizingV"] = sizingV
        if radius: props["cornerRadius"] = radius
        if align: props["crossAlign"] = align
        if main: props["mainAlign"] = main
        if wrap: props["wrap"] = True
        args = dict(type="frame", name=name, props=props, x=x, y=y)
        if w: args["width"] = w
        if h: args["height"] = h
        if parent is not None: args["parent"] = parent
        nid = f.tool("create_node", **args)["id"]
        if sizingH is None and w is None: sizingH = "hug"
        if sizingH: f.tool("set_properties", ids=[nid], props={"sizingH": sizingH})
        if bind: f.cmd("variable.bind", ids=[nid], field="fill", variable=bind)
        if stroke:
            f.tool("set_properties", ids=[nid], props={"strokes": ["#000000"], "strokeWeight": strokeW, "strokeAlign": "inside"})
            f.cmd("variable.bind", ids=[nid], field="stroke", variable=stroke)
        if shadow:
            lvl, (ox, oy, rad) = shadow
            f.tool("set_properties", ids=[nid], props={"effects": [{"type": "dropShadow", "color": "#00000022", "offset": [ox, oy], "radius": rad, "spread": 0}]})
            f.cmd("variable.bind", ids=[nid], field="effects/0/color", variable=f"color/shadow/{lvl}")
        return nid

    def text(self, parent, s, style="body", color="color/fg/default", fill=False, width=None, weight=None, mono=False, name=None):
        f = self.f
        size, lh, wt = TYPE[style]
        props = {"fontFamily": MONO if (mono or style == "mono") else FONT, "fontSize": size, "fontWeight": weight or wt, "lineHeight": lh}
        if style == "eyebrow": props["letterSpacing"] = "4%"
        args = dict(type="text", text=s, props=props)
        if parent is not None: args["parent"] = parent
        if name: args["name"] = name
        nid = f.tool("create_node", **args)["id"]
        if width:
            f.tool("set_properties", ids=[nid], props={"width": width})
            f.tool("set_properties", ids=[nid], props={"sizingH": "fixed"})
        if fill:
            f.tool("set_properties", ids=[nid], props={"sizingH": "fill"})
        if color.startswith("#"):
            f.tool("set_properties", ids=[nid], props={"fills": [color]})
        else:
            f.cmd("variable.bind", ids=[nid], field="fill", variable=color)
        return nid

    def rect(self, parent, w, h, bind=None, radius=6, fill=None, stroke=None, name="rect"):
        f = self.f
        nid = f.tool("create_node", type="rectangle", parent=parent, width=w, height=h, name=name,
                     props={"cornerRadius": radius, **({"fills": [fill]} if fill else {})})["id"]
        if bind: f.cmd("variable.bind", ids=[nid], field="fill", variable=bind)
        if stroke:
            f.tool("set_properties", ids=[nid], props={"strokes": ["#000000"], "strokeWeight": 1, "strokeAlign": "inside"})
            f.cmd("variable.bind", ids=[nid], field="stroke", variable=stroke)
        return nid

    def spacer(self, parent):
        return self.frame(parent, "spacer", sizingH="fill")

    def pad(self, nid, l=None, r=None, t=None, b=None):
        props = {}
        if l is not None: props["paddingLeft"] = l
        if r is not None: props["paddingRight"] = r
        if t is not None: props["paddingTop"] = t
        if b is not None: props["paddingBottom"] = b
        self.f.tool("set_properties", ids=[nid], props=props)

    def page(self, name):
        f = self.f
        pid = f.cmd("page.add", name=name)
        pid = pid.get("id") if isinstance(pid, dict) else pid
        f.cmd("page.select", id=pid)
        return pid

    # ------------------------------------------------------------ components
    def _component(self, nid, props):
        f = self.f
        r = f.cmd("component.create", ids=[nid])
        cid = r.get("id", nid) if isinstance(r, dict) else nid
        for name, (layer, default) in props.items():
            f.cmd("component.addProperty", id=cid, name=name, type="text", default=default, layer=layer)
        return cid

    def build_components(self):
        """Doc kit: built once on its own page; every page uses instances."""
        f = self.f
        x = 0
        # Page header
        c = self.frame(name="Doc/Page header", gap=12, w=CONTENT_W, x=x, y=0)
        e = self.text(c, "Colour · Roles", "eyebrow", "color/fg/brand", name="Eyebrow")
        t = self.text(c, "Page title", "h1", name="Title")
        l = self.text(c, "One or two sentences that say what this page teaches and why it matters.", "lead", "color/fg/muted", fill=True, name="Lead")
        self.comp["page"] = self._component(c, {"Eyebrow": (e, "Colour · Roles"), "Title": (t, "Page title"), "Lead": (l, "Lead")})
        # Section header
        c = self.frame(name="Doc/Section header", gap=8, w=CONTENT_W, x=0, y=260)
        t = self.text(c, "Section title", "h2", name="Title")
        i = self.text(c, "What this section shows, in one sentence.", "body", "color/fg/muted", fill=True, name="Intro")
        self.comp["section"] = self._component(c, {"Title": (t, "Section title"), "Intro": (i, "Intro")})
        # Why box
        c = self.frame(name="Doc/Why", gap=6, pad=20, w=360, bind="color/bg/surface-sunken", radius=12, x=0, y=420)
        self.text(c, "WHY IT MATTERS", "caption", "color/fg/subtle", weight=700)
        b = self.text(c, "The reason behind the rule, in plain words.", "small", "color/fg/default", fill=True, name="Body")
        self.comp["why"] = self._component(c, {"Body": (b, "Reason")})
        # Rule callout
        c = self.frame(name="Doc/Rule", direction="horizontal", gap=14, pad=20, w=600, bind="color/bg/brand-subtle", radius=12, x=420, y=420)
        self.text(c, "→", "h3", "color/fg/brand")
        col = self.frame(c, "Text", gap=4, sizingH="fill")
        t = self.text(col, "Rule title", "h3", name="Title")
        b = self.text(col, "One sentence that states the rule.", "body", "color/fg/default", fill=True, name="Body")
        self.comp["rule"] = self._component(c, {"Title": (t, "Rule"), "Body": (b, "Body")})
        # Note callout
        c = self.frame(name="Doc/Note", direction="horizontal", gap=14, pad=20, w=600, bind="color/bg/info-subtle", radius=12, x=1060, y=420)
        self.text(c, "i", "h3", "color/fg/info")
        b = self.text(c, "A helpful note.", "body", "color/fg/default", fill=True, name="Body")
        self.comp["note"] = self._component(c, {"Body": (b, "Note")})
        # Verdicts
        for kind, bg, fg, glyph, xx in [("Do", "color/bg/success-subtle", "color/fg/success", "✓", 0), ("Avoid", "color/bg/danger-subtle", "color/fg/danger", "✕", 140)]:
            c = self.frame(name=f"Doc/{kind}", direction="horizontal", gap=6, bind=bg, radius=99, align="center", x=xx, y=620)
            self.pad(c, 12, 12, 4, 4)
            self.text(c, f"{glyph} {kind}", "caption", fg, weight=700)
            self.comp[kind.lower()] = self._component(c, {})
        # Role tag: names the role of a part of an example, right where it is
        c = self.frame(name="Doc/Role tag", direction="horizontal", bind="color/bg/brand-subtle", radius=6, align="center", x=300, y=620)
        self.pad(c, 8, 8, 3, 3)
        n = self.text(c, "bg/surface", "caption", "color/fg/brand", mono=True, weight=600, name="Role")
        self.comp["tag"] = self._component(c, {"Role": (n, "bg/surface")})
        return self.comp

    def inst(self, key, parent, props=None, fill=False):
        f = self.f
        i = f.cmd("instance.create", component=self.comp[key], parent=parent)
        iid = i.get("id") if isinstance(i, dict) else i
        if props: f.cmd("instance.setProperties", ids=[iid], properties=props)
        if fill: f.tool("set_properties", ids=[iid], props={"sizingH": "fill"})
        return iid

    # ------------------------------------------------------------ page scaffolding
    def board(self, eyebrow, title, lead, mode="Light", x=0, w=PAGE_W, name=None):
        b = self.frame(name=name or title, w=w, pad=PAGE_PAD, gap=72, bind="color/bg/canvas", x=x)
        self.f.cmd("variable.setMode", ids=[b], collection="Color", mode=mode)
        self.inst("page", b, {"Eyebrow": eyebrow, "Title": title, "Lead": lead}, fill=True)
        return b

    def section(self, parent, title, intro):
        s = self.frame(parent, title, gap=28, sizingH="fill")
        self.inst("section", s, {"Title": title, "Intro": intro}, fill=True)
        return s

    def card(self, parent, gap=16, pad=28, sizingH="fill", direction="vertical", bind="color/bg/surface", name="Card", w=None, radius=16, align=None):
        return self.frame(parent, name, direction, gap, pad, bind=bind, sizingH=None if w else sizingH, w=w, radius=radius,
                          stroke="color/border/subtle", align=align)

    def row(self, parent, gap=24, name="Row", align=None, fill=True, wrap=False):
        r = self.frame(parent, name, "horizontal", gap, 0, sizingH="fill" if fill else None, align=align, wrap=wrap)
        if wrap: self.f.tool("set_properties", ids=[r], props={"crossGap": gap})
        return r

    def with_why(self, parent, why, name="Content + why"):
        """Two columns: content on the left, the Why box on the right."""
        r = self.row(parent, 32, name, align="min")
        left = self.frame(r, "Content", gap=20, sizingH="fill")
        self.inst("why", r, {"Body": why})
        return left

    def btn(self, parent, bg, fg, label, border=None, name="Button", fillw=False):
        b = self.frame(parent, name, "horizontal", 8, 0, bind=bg, radius=4, align="center", main="center", stroke=border)
        self.pad(b, 20, 20, 10, 10)
        self.text(b, label, "small", fg, weight=600)
        if fillw: self.f.tool("set_properties", ids=[b], props={"sizingH": "fill"})
        return b

    def ring(self, parent, radius=8):
        return self.frame(parent, "Focus ring", "horizontal", 0, 4, radius=radius, align="center", stroke="color/border/focus", strokeW=2)

    def chip(self, parent, label, bind="color/bg/surface-sunken", color="color/fg/default", mono=True):
        c = self.frame(parent, label, "horizontal", 0, 0, bind=bind, radius=6, align="center")
        self.pad(c, 8, 8, 3, 3)
        self.text(c, label, "mono" if mono else "small", color)
        return c

    def tag(self, parent, role):
        """Role tag placed on an example, naming the role of that part."""
        return self.inst("tag", parent, {"Role": role})

    def marked(self, parent, label, sub=None, mono=True):
        """Legend line: role name (or term) + explanation."""
        col = self.frame(parent, f"Legend · {label}", gap=2, sizingH="fill")
        self.text(col, label, "mono" if mono else "small", "color/fg/default", weight=600)
        if sub: self.text(col, sub, "small", "color/fg/muted", fill=True)
        return col

import sys, os, json, re
sys.path.insert(0, '/home/claude/fc')
from mcp import FigCraft
src, outdir = sys.argv[1], sys.argv[2]
os.makedirs(outdir, exist_ok=True)
f = FigCraft()
f.tool('open_file', path=src)
pl = f.cmd('page.list'); pl = pl.get('pages', pl) if isinstance(pl, dict) else pl
n = 0
for i, p in enumerate(pl):
    if p['name'].strip() in ('-', '') or p['name'] == 'Doc kit': continue
    f.cmd('page.select', id=p['id'])
    d0 = f.tool('inspect_document'); doc = {'document': d0} if 'pages' in d0 else d0
    page = next(pg for pg in doc['document']['pages'] if pg['id'] == p['id'])
    kids = [c['id'] for c in page.get('children', []) if c.get('type') in ('FRAME', 'SECTION', 'COMPONENT', 'COMPONENT_SET', 'GROUP')]
    if not kids: continue
    safe = re.sub(r'[^A-Za-z0-9]+', '-', p['name']).strip('-')
    f.tool('export', ids=kids, format='png', path=f'{outdir}/{i:02d}-{safe}.png', scale=0.5)
    n += 1
print(src, '→', n, 'page images')
f.close()

#!/usr/bin/env bash
# Installs the fonts FigCraft needs to render the ds foundation files and the Surf reference files in a fresh cloud
# session: JetBrains Mono (ds mono styles) and IBM Plex Mono (used by every Surf file). Inter ships with the image.
# Usage: bash product/engine/figcraft/setup_fonts.sh
set -euo pipefail
pip install -q --break-system-packages fonttools brotli 2>/dev/null || pip install -q fonttools brotli
work="$(mktemp -d)"
( cd "$work" && npm pack -q @fontsource/jetbrains-mono @ibm/plex-mono >/dev/null && for t in *.tgz; do mkdir -p "${t%.tgz}" && tar xzf "$t" -C "${t%.tgz}"; done )
python3 - "$work" <<'PY'
import glob, os, sys
from fontTools.ttLib import TTFont
work, dest = sys.argv[1], os.path.expanduser("~/.local/share/fonts/ds")
os.makedirs(dest, exist_ok=True)
files = glob.glob(f"{work}/*jetbrains-mono*/package/files/jetbrains-mono-latin-[4-7]00-normal.woff2")
files += [f for f in glob.glob(f"{work}/*plex-mono*/package/fonts/complete/woff2/*.woff2") if "Italic" not in f]
for f in files:
    t = TTFont(f); t.flavor = None
    t.save(os.path.join(dest, os.path.basename(f).replace(".woff2", ".ttf")))
print(f"installed {len(files)} font files into {dest}")
PY
fc-cache -f >/dev/null 2>&1 || true
families="$(fc-list : family)"
for fam in "Inter" "JetBrains Mono" "IBM Plex Mono"; do
  if grep -q "^$fam" <<< "$families"; then echo "ok       $fam"; else echo "MISSING  $fam"; fi
done
rm -rf "$work"

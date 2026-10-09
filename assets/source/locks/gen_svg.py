# The lock art (keys, chain bands, padlock bodies and shackles, gold and
# silver, and the rope loop) as SVG, drawn 4 px to the game's art unit.
# Canvas sizes and where each piece's middle falls must match ART_ORIGIN in
# objects/locks.js. Rebuild:
#   python3 gen_svg.py && node render_svg.mjs . ../../locks

import math, os
OUT = os.path.dirname(os.path.abspath(__file__)) + '/'

METAL = {
    'gold':   dict(hi='#fffbe0', light='#ffe680', base='#ffc928', mid='#f5a40c', dark='#d27a00', edge='#9a5200', hole='#5a2e00'),
    'silver': dict(hi='#ffffff', light='#f4f7fb', base='#d6dee9', mid='#b3bfd0', dark='#8592a8', edge='#56627a', hole='#2c3446'),
}

def svg(w, h, body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{body}</svg>'

def grads(m, p):
    # p: id prefix
    return f'''
<linearGradient id="{p}v" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="{m['light']}"/><stop offset="0.45" stop-color="{m['base']}"/>
  <stop offset="0.8" stop-color="{m['mid']}"/><stop offset="1" stop-color="{m['dark']}"/></linearGradient>
<linearGradient id="{p}d" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="{m['light']}"/><stop offset="0.5" stop-color="{m['base']}"/>
  <stop offset="1" stop-color="{m['dark']}"/></linearGradient>
<linearGradient id="{p}cyl" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="{m['dark']}"/><stop offset="0.3" stop-color="{m['light']}"/>
  <stop offset="0.55" stop-color="{m['base']}"/><stop offset="1" stop-color="{m['dark']}"/></linearGradient>
<linearGradient id="{p}cylh" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="{m['mid']}"/><stop offset="0.28" stop-color="{m['hi']}"/>
  <stop offset="0.55" stop-color="{m['base']}"/><stop offset="1" stop-color="{m['dark']}"/></linearGradient>
<radialGradient id="{p}hole" cx="0.5" cy="0.35" r="0.7">
  <stop offset="0" stop-color="{m['mid']}"/><stop offset="1" stop-color="{m['dark']}"/></radialGradient>
<filter id="{p}sh" x="-30%" y="-30%" width="160%" height="170%">
  <feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#0d1630" flood-opacity="0.35"/></filter>
'''

# ---- key: 360x184, origin (176, 96); bow centre (80,96); tip x~336 ----
def key(m, p):
    cx, cy = 80, 96
    return svg(360, 184, f'''<defs>{grads(m,p)}
<mask id="{p}cut" maskUnits="userSpaceOnUse" x="0" y="0" width="360" height="184">
  <rect width="360" height="184" fill="#fff"/><circle cx="{cx}" cy="{cy}" r="22" fill="#000"/></mask></defs>
<g mask="url(#{p}cut)"><g filter="url(#{p}sh)">
  <!-- bit -->
  <path d="M250 104 h28 v48 a10 10 0 0 1 -10 10 h-8 a10 10 0 0 1 -10 -10 z" fill="url(#{p}cyl)" stroke="{m['edge']}" stroke-width="5"/>
  <path d="M294 104 h26 v32 a10 10 0 0 1 -10 10 h-6 a10 10 0 0 1 -10 -10 z" fill="url(#{p}cyl)" stroke="{m['edge']}" stroke-width="5"/>
  <!-- shaft -->
  <rect x="120" y="76" width="216" height="36" rx="18" fill="url(#{p}cylh)" stroke="{m['edge']}" stroke-width="5"/>
  <rect x="140" y="83" width="170" height="7" rx="3.5" fill="{m['hi']}" opacity="0.9"/>
  <!-- collar -->
  <rect x="122" y="64" width="30" height="60" rx="12" fill="url(#{p}cyl)" stroke="{m['edge']}" stroke-width="5"/>
  <rect x="129" y="70" width="8" height="40" rx="4" fill="{m['hi']}" opacity="0.8"/>
  <!-- bow -->
  <circle cx="{cx}" cy="{cy}" r="62" fill="url(#{p}d)" stroke="{m['edge']}" stroke-width="5"/>
  <circle cx="{cx}" cy="{cy}" r="48" fill="none" stroke="{m['light']}" stroke-width="5" opacity="0.6"/>
  <path d="M{cx-38} {cy-30} A48 48 0 0 1 {cx+26} {cy-42}" fill="none" stroke="{m['hi']}" stroke-width="9" stroke-linecap="round" opacity="0.95"/>
  <circle cx="{cx+30}" cy="{cy-30}" r="5" fill="{m['hi']}" opacity="0.9"/>
  <!-- the rim of the hole through the bow -->
  <circle cx="{cx}" cy="{cy}" r="24" fill="none" stroke="{m['edge']}" stroke-width="5"/>
  <path d="M{cx+16} {cy+16} A22 22 0 0 1 {cx-12} {cy+19}" fill="none" stroke="{m['hi']}" stroke-width="4" stroke-linecap="round" opacity="0.8"/>
</g></g>
''')

# ---- chain band: 96x496, centre (48,248); along y ----
def chain(m, p):
    parts = []
    # edge-on links behind, at -36, 0, 36 units -> px 248 + y*4
    for u in (-36, 0, 36):
        y = 248 + u * 4
        parts.append(f'<rect x="36" y="{y-50}" width="24" height="100" rx="12" fill="url(#{p}cyl)" stroke="{m["edge"]}" stroke-width="4"/>')
        parts.append(f'<rect x="41" y="{y-40}" width="5" height="80" rx="2.5" fill="{m["hi"]}" opacity="0.8"/>')
    for u in (-54, -18, 18, 54):
        y = 248 + u * 4
        parts.append(f'''<ellipse cx="48" cy="{y}" rx="30" ry="46" fill="none" stroke="{m['edge']}" stroke-width="22"/>
<ellipse cx="48" cy="{y}" rx="30" ry="46" fill="none" stroke="url(#{p}d)" stroke-width="15"/>
<path d="M22 {y-14} A28 44 0 0 1 52 {y-44}" fill="none" stroke="{m['hi']}" stroke-width="5" stroke-linecap="round"/>
<path d="M74 {y+14} A28 44 0 0 1 44 {y+44}" fill="none" stroke="{m['dark']}" stroke-width="4" stroke-linecap="round" opacity="0.7"/>''')
    return svg(96, 496, f'<defs>{grads(m,p)}</defs><g filter="url(#{p}sh)">' + ''.join(parts) + '</g>')

# ---- padlock body: 240x216, top-centre origin (120,8); body y 8..184; keyhole (120,82) ----
def body(m, p):
    return svg(240, 216, f'''<defs>{grads(m,p)}
<linearGradient id="{p}lip" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{m['mid']}"/><stop offset="1" stop-color="{m['edge']}"/></linearGradient>
<radialGradient id="{p}plate" cx="0.45" cy="0.35" r="0.7"><stop offset="0" stop-color="{m['base']}"/><stop offset="1" stop-color="{m['dark']}"/></radialGradient></defs>
<g filter="url(#{p}sh)">
  <rect x="10" y="10" width="220" height="174" rx="42" fill="url(#{p}lip)" stroke="{m['edge']}" stroke-width="5"/>
  <rect x="16" y="14" width="208" height="150" rx="36" fill="url(#{p}v)"/>
  <!-- bevel: lit top rim -->
  <path d="M40 22 H200 A26 26 0 0 1 214 34" fill="none" stroke="{m['hi']}" stroke-width="6" stroke-linecap="round" opacity="0.9"/>
  <!-- gloss -->
  <rect x="34" y="30" width="110" height="26" rx="13" fill="{m['hi']}" opacity="0.55"/>
  <circle cx="166" cy="42" r="8" fill="{m['hi']}" opacity="0.7"/>
  <!-- rivets -->
  <g>{''.join(f'<circle cx="{x}" cy="140" r="11" fill="url(#{p}d)" stroke="{m["edge"]}" stroke-width="3"/><circle cx="{x-3}" cy="136" r="3.5" fill="{m["hi"]}"/>' for x in (46, 194))}</g>
  <!-- keyhole plate -->
  <circle cx="120" cy="84" r="42" fill="url(#{p}plate)" stroke="{m['edge']}" stroke-width="4"/>
  <circle cx="120" cy="84" r="42" fill="none" stroke="{m['hi']}" stroke-width="3" opacity="0.5" stroke-dasharray="70 400" transform="rotate(200 120 84)"/>
  <path d="M120 58 a17 17 0 0 1 9 31.5 l5 28 a5 5 0 0 1 -5 6 h-18 a5 5 0 0 1 -5 -6 l5 -28 a17 17 0 0 1 9 -31.5 z" fill="{m['hole']}"/>
  <path d="M110 70 a12 12 0 0 1 14 -6" fill="none" stroke="#ffffff" stroke-width="2.5" opacity="0.25"/>
</g>''')

# ---- shackle: 200x180, origin (100,132); legs x 36/164, arc centre (100,100) r 64; legs end y 172 ----
def shackle(m, p):
    d = 'M36 176 V100 A64 64 0 0 1 164 100 V176'
    return svg(200, 180, f'''<defs>{grads(m,p)}</defs>
<g>
  <path d="{d}" fill="none" stroke="{m['edge']}" stroke-width="40" stroke-linecap="butt"/>
  <path d="{d}" fill="none" stroke="{m['dark']}" stroke-width="32"/>
  <path d="{d}" fill="none" stroke="{m['base']}" stroke-width="22" transform="translate(-3 -3)"/>
  <path d="{d}" fill="none" stroke="{m['light']}" stroke-width="10" transform="translate(-6 -6)"/>
  <path d="M30 150 V100 A70 70 0 0 1 80 34" fill="none" stroke="{m['hi']}" stroke-width="5" stroke-linecap="round" opacity="0.9"/>
</g>''')

# ---- rope loop: 192x192, centre (96,96), ring r 64 ----
def rope():
    strands = []
    n = 22
    for i in range(n):
        a = i / n * math.tau
        a2 = a + 0.22
        r1, r2 = 50, 78
        x1, y1 = 96 + math.cos(a) * r1, 96 + math.sin(a) * r1
        x2, y2 = 96 + math.cos(a2) * r2, 96 + math.sin(a2) * r2
        strands.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="#7c4a1c" stroke-width="5" stroke-linecap="round" opacity="0.75"/>')
        a3 = a + 0.11
        x3, y3 = 96 + math.cos(a3) * 58, 96 + math.sin(a3) * 58
        x4, y4 = 96 + math.cos(a3 + 0.12) * 70, 96 + math.sin(a3 + 0.12) * 70
        strands.append(f'<line x1="{x3:.1f}" y1="{y3:.1f}" x2="{x4:.1f}" y2="{y4:.1f}" stroke="#f2d3a0" stroke-width="3" stroke-linecap="round" opacity="0.7"/>')
    return svg(192, 192, f'''<defs><filter id="rsh" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#0d1630" flood-opacity="0.35"/></filter></defs>
<g filter="url(#rsh)">
  <circle cx="96" cy="96" r="64" fill="none" stroke="#6b3d14" stroke-width="36"/>
  <circle cx="96" cy="96" r="64" fill="none" stroke="#c98c4a" stroke-width="28"/>
  {''.join(strands)}
  <path d="M44 70 A58 58 0 0 1 80 40" fill="none" stroke="#ffe7bd" stroke-width="4" stroke-linecap="round" opacity="0.8"/>
</g>''')

for color, m in METAL.items():
    for name, fn in (('key', key), ('chain', chain), ('body', body), ('shackle', shackle)):
        open(OUT + f'{name}-{color}.svg', 'w').write(fn(m, color[0] + name[0]))
open(OUT + 'rope.svg', 'w').write(rope())
print(sorted(os.listdir(OUT)))

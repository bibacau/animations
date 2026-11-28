"""Vectorise a raster logo into crisp, scalable colour layers (potrace).

usage:
  python trace_logo.py logo.png logo.json                       # auto-detect the logo colours
  python trace_logo.py logo.png logo.json --colors "#e41b24,#3ea74d" [--names wordmark,leaf]
Output: {"viewBox":[w,h], "bbox":[x0,y0,x1,y1], "layers":[{"name","color","paths":[svg path d...]}]}
Each layer is a list of closed paths (outer contours + holes; draw with fill-rule evenodd).
Needs: pip install potracer pillow numpy
Why: small or blurry logo files look soft when scaled up; vector paths stay sharp at any
size, keep the exact brand colours, and let the letters be animated separately.
"""
import argparse, json
import numpy as np
import potrace
from PIL import Image, ImageFilter

UP = 6   # trace at 6x so curves come out smooth

def to_paths(mask, scale):
    plist = potrace.Bitmap(~mask).trace(turdsize=40, alphamax=1.1, opticurve=True, opttolerance=0.3)   # potracer traces False pixels
    out = []
    for c in plist:
        sp = c.start_point; d = [f"M{sp.x / scale:.2f},{sp.y / scale:.2f}"]
        for sg in c.segments:
            if sg.is_corner: d.append(f"L{sg.c.x / scale:.2f},{sg.c.y / scale:.2f}L{sg.end_point.x / scale:.2f},{sg.end_point.y / scale:.2f}")
            else: d.append(f"C{sg.c1.x / scale:.2f},{sg.c1.y / scale:.2f} {sg.c2.x / scale:.2f},{sg.c2.y / scale:.2f} {sg.end_point.x / scale:.2f},{sg.end_point.y / scale:.2f}")
        out.append("".join(d) + "Z")
    return out

def hexrgb(h): h = h.lstrip('#'); return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)])

def auto_colors(im, n=10):
    """find the logo's real colours: quantise, drop the background, merge near-duplicates
    (anti-aliasing makes several shades of one colour), then re-measure each colour from
    its solid pixels only (so edge blending with the background doesn't wash it out)"""
    a = np.asarray(im.convert('RGB')).reshape(-1, 3).astype(int)
    q = im.convert('RGB').quantize(colors=n, method=Image.Quantize.MEDIANCUT)
    pal = np.array(q.getpalette()[:n * 3]).reshape(-1, 3); counts = np.bincount(np.array(q).ravel(), minlength=n)
    cands = []
    for i in np.argsort(-counts):
        c = pal[i]
        if counts[i] / counts.sum() < 0.003 or c.min() > 215: continue          # too rare / background
        if any(np.sqrt(((c - d) ** 2).sum()) < 90 for d in cands): continue      # shade of a colour we have
        cands.append(c)
    sat = a.max(1) - a.min(1)
    out = []
    for c in cands:
        near = a[(np.sqrt(((a - c) ** 2).sum(1)) < 110) & ((sat > 60) | (a.max(1) < 120))]
        if len(near) < 30: continue
        m = np.median(near, 0)
        if any(np.sqrt(((m - d) ** 2).sum()) < 95 for d in out): continue   # same colour, re-measured
        out.append(m)
    return out

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('src'); ap.add_argument('dst')
    ap.add_argument('--colors'); ap.add_argument('--names'); ap.add_argument('--tol', type=float, default=70)
    a = ap.parse_args()
    im = Image.open(a.src).convert('RGBA'); bg = Image.new('RGBA', im.size, 'white'); im = Image.alpha_composite(bg, im).convert('RGB')
    W, H = im.size
    cols = [hexrgb(c) for c in a.colors.split(',')] if a.colors else auto_colors(im)
    names = a.names.split(',') if a.names else [f'layer{i}' for i in range(len(cols))]
    big = np.asarray(im.resize((W * UP, H * UP), Image.LANCZOS).filter(ImageFilter.GaussianBlur(UP * 0.35))).astype(int)
    dist = np.stack([np.sqrt(((big - c) ** 2).sum(-1)) for c in cols])          # distance to each logo colour
    nearest = dist.argmin(0); close = dist.min(0) < a.tol
    layers, allm = [], np.zeros(nearest.shape, bool)
    for i, c in enumerate(cols):
        m = (nearest == i) & close; allm |= m
        layers.append({"name": names[i] if i < len(names) else f'layer{i}', "color": '#%02x%02x%02x' % tuple(int(v) for v in c), "paths": to_paths(m, UP)})
    ys, xs = np.where(allm)
    json.dump({"viewBox": [W, H], "bbox": [xs.min() / UP, ys.min() / UP, xs.max() / UP, ys.max() / UP], "layers": layers}, open(a.dst, 'w'))
    for L in layers: print(L['name'], L['color'], len(L['paths']), 'paths')

if __name__ == '__main__':
    main()

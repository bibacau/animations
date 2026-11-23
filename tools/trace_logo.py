"""Vectorise the supplied T-POT logo (red wordmark + green leaf/swoosh) with potrace.

usage: python tools/trace_logo.py assets/tpot_logo_src.png assets/tpot_logo.json
Output JSON: {"viewBox":[w,h], "layers":[{"color":"#e3202a","paths":["M ... Z", ...]}, ...]}
Each colour layer is a list of closed SVG paths (outer contours + holes, even-odd fill).
"""
import json
import sys

import numpy as np
import potrace
from PIL import Image, ImageFilter

UP = 6  # trace at 6x so curves are smooth


def mask_to_paths(mask, scale):
    bm = potrace.Bitmap(~mask)  # potracer traces the False pixels
    plist = bm.trace(turdsize=40, alphamax=1.1, opticurve=True, opttolerance=0.3)
    out = []
    for curve in plist:
        sp = curve.start_point
        d = [f"M{sp.x / scale:.2f},{sp.y / scale:.2f}"]
        for seg in curve.segments:
            if seg.is_corner:
                d.append(f"L{seg.c.x / scale:.2f},{seg.c.y / scale:.2f}L{seg.end_point.x / scale:.2f},{seg.end_point.y / scale:.2f}")
            else:
                d.append(f"C{seg.c1.x / scale:.2f},{seg.c1.y / scale:.2f} {seg.c2.x / scale:.2f},{seg.c2.y / scale:.2f} {seg.end_point.x / scale:.2f},{seg.end_point.y / scale:.2f}")
        d.append("Z")
        out.append("".join(d))
    return out


def main(src, dst):
    im = Image.open(src).convert("RGB")
    W, H = im.size
    big = im.resize((W * UP, H * UP), Image.LANCZOS).filter(ImageFilter.GaussianBlur(UP * 0.35))
    a = np.asarray(big).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    red = (r > 140) & (r - g > 70) & (r - b > 60)
    green = (g > r + 15) & (g > 80) & (g > b)
    # colours sampled from the source
    src_a = np.asarray(im).astype(int)
    def mean_col(m_small):
        c = src_a[m_small].mean(0)
        return "#%02x%02x%02x" % tuple(int(x) for x in c)
    rs, gs, bs = src_a[..., 0], src_a[..., 1], src_a[..., 2]
    red_col = mean_col((rs > 180) & (gs < 70) & (bs < 70))
    green_col = mean_col((gs > rs + 60) & (gs > 120))
    layers = [
        {"name": "wordmark", "color": red_col, "paths": mask_to_paths(red, UP)},
        {"name": "leaf_swoosh", "color": green_col, "paths": mask_to_paths(green, UP)},
    ]
    ys, xs = np.where(red | green)
    bbox = [xs.min() / UP, ys.min() / UP, xs.max() / UP, ys.max() / UP]
    json.dump({"viewBox": [W, H], "bbox": bbox, "layers": layers}, open(dst, "w"))
    print("red", red_col, len(layers[0]["paths"]), "paths | green", green_col, len(layers[1]["paths"]), "paths | bbox", bbox)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])

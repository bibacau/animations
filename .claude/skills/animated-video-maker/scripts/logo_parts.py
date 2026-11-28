"""Split a traced logo (output of trace_logo.py) into separately animatable parts.

usage: python logo_parts.py logo.json logo_parts.json
Every closed shape of every colour layer becomes a part; holes (counters, like the inside
of a P or O) are merged into the shape that contains them. Parts are named
<layer>_<n>, numbered left -> right, e.g. wordmark_0 ... wordmark_4, leaf_swoosh_0.
"""
import json, re, sys

def bbox(d):
    n = list(map(float, re.findall(r"-?\d+\.?\d*", d)))
    xs, ys = n[0::2], n[1::2]
    return [min(xs), min(ys), max(xs), max(ys)]

def inside(a, b):
    return a[0] > b[0] and a[1] > b[1] and a[2] < b[2] and a[3] < b[3]

def main(src, dst):
    L = json.load(open(src))
    parts = []
    for layer in L["layers"]:
        ps = [{"d": d, "bb": bbox(d)} for d in layer["paths"]]
        outers = [p for p in ps if not any(inside(p["bb"], q["bb"]) for q in ps if q is not p)]
        outers.sort(key=lambda p: p["bb"][0])
        for i, o in enumerate(outers):
            paths = [o["d"]] + [q["d"] for q in ps if q is not o and inside(q["bb"], o["bb"])]
            parts.append({"name": f'{layer["name"]}_{i}', "layer": layer["name"], "color": layer["color"], "paths": paths, "bb": o["bb"]})
    json.dump({"bbox": L["bbox"], "parts": parts}, open(dst, "w"))
    for p in parts:
        print(p["name"], [round(v) for v in p["bb"]], len(p["paths"]))

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])

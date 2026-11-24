"""Split the traced logo (assets/logo/tpot_logo.json) into animatable parts:
T1, DASH, P (outer + counter), O (red crescent), T2, LEAF (green leaf + inner arc), SWOOSH.
usage: python tools/logo_parts.py assets/logo/tpot_logo.json assets/logo/tpot_logo_parts.json
"""
import json, re, sys

def bbox(d):
    nums = list(map(float, re.findall(r"-?\d+\.?\d*", d)))
    xs, ys = nums[0::2], nums[1::2]
    return [min(xs), min(ys), max(xs), max(ys)]

def main(src, dst):
    L = json.load(open(src))
    red, green = L["layers"]
    rp = [{"d": d, "bb": bbox(d)} for d in red["paths"]]
    # counters (holes) are paths fully inside another path's box
    def inside(a, b): return a[0] > b[0] and a[1] > b[1] and a[2] < b[2] and a[3] < b[3]
    outers = [p for p in rp if not any(inside(p["bb"], q["bb"]) for q in rp if q is not p)]
    outers.sort(key=lambda p: p["bb"][0])
    names = ["T1", "DASH", "P", "O", "T2"]
    parts = []
    for n, o in zip(names, outers):
        paths = [o["d"]] + [q["d"] for q in rp if q is not o and inside(q["bb"], o["bb"])]
        parts.append({"name": n, "color": red["color"], "paths": paths, "bb": o["bb"]})
    gp = sorted([{"d": d, "bb": bbox(d)} for d in green["paths"]], key=lambda p: -(p["bb"][2] - p["bb"][0]))
    parts.append({"name": "SWOOSH", "color": green["color"], "paths": [gp[0]["d"]], "bb": gp[0]["bb"]})
    for g in gp[1:]:
        parts.append({"name": "LEAF", "color": green["color"], "paths": [g["d"]], "bb": g["bb"]})
    json.dump({"bbox": L["bbox"], "parts": parts}, open(dst, "w"))
    for p in parts: print(p["name"], [round(v) for v in p["bb"]], len(p["paths"]))

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])

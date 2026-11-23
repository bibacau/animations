// The real T-POT logo (vector-traced from the supplied artwork, assets/tpot_logo.json):
//  * flat: a crisp canvas texture for the end card (exact brand colours, any resolution)
//  * 3D:   extruded parts (T, -, P, O-ring, T, leaf, swoosh) that can race, fly and assemble
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

export async function loadLogo() {
  const data = await fetch('/assets/tpot_logo.json').then((r) => r.json());
  const [x0, y0, x1, y1] = data.bbox;
  const pad = 6;
  const bw = x1 - x0 + pad * 2, bh = y1 - y0 + pad * 2;
  return { data, box: { x: x0 - pad, y: y0 - pad, w: bw, h: bh }, aspect: bw / bh };
}

/** flat logo on a transparent canvas, `px` wide */
export function logoTexture(logo, px = 2400) {
  const { box, data } = logo;
  const c = document.createElement('canvas');
  c.width = px; c.height = Math.round(px / logo.aspect);
  const g = c.getContext('2d');
  const s = px / box.w;
  g.setTransform(s, 0, 0, s, -box.x * s, -box.y * s);
  for (const L of data.layers) {
    g.fillStyle = L.color;
    g.fill(new Path2D(L.paths.join(' ')), 'evenodd');
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.NoColorSpace;   // composited in display space by the post pass
  tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4;
  tex.flipY = true;
  return tex;
}

/**
 * Extruded 3D logo. Returns { group, parts: {T1,dash,P,O,T2,leaf,swoosh}, width, height }
 * with every part's mesh centred on its own pivot (part.home = assembled position).
 */
export function logo3D(logo, width = 10, depth = 0.6) {
  const { data, box } = logo;
  const s = width / box.w;
  // each colour layer as one combined path so holes (the P counter) resolve together
  const svg = `<svg xmlns="http://www.w3.org/2000/svg">` + data.layers.map((L) => `<path fill="${L.color}" fill-rule="evenodd" d="${L.paths.join(' ')}"/>`).join('') + '</svg>';
  const parsed = new SVGLoader().parse(svg);
  const group = new THREE.Group();
  const shapes = [];
  parsed.paths.forEach((path, li) => {
    const color = path.userData.style.fill;
    for (const shape of SVGLoader.createShapes(path)) shapes.push({ shape, color, layer: data.layers[li].name });
  });
  const mats = {};
  const mat = (col) => (mats[col] ||= {
    lit: [new THREE.MeshStandardMaterial({ color: col, roughness: 0.3, metalness: 0.05 }), new THREE.MeshStandardMaterial({ color: new THREE.Color(col).multiplyScalar(0.55), roughness: 0.5 })],
  });
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
  const items = shapes.map(({ shape, color, layer }) => {
    const geo = new THREE.ExtrudeGeometry(shape, { depth: depth / s, bevelEnabled: true, bevelThickness: 0.6, bevelSize: 0.4, bevelSegments: 2, curveSegments: 10 });
    geo.scale(s, -s, s);                         // svg y-down -> y-up
    geo.computeBoundingBox();
    const b = geo.boundingBox; const c = new THREE.Vector3(); b.getCenter(c);
    geo.translate(-c.x, -c.y, -c.z);
    const mesh = new THREE.Mesh(geo, mat(color).lit); mesh.castShadow = true;
    const home = new THREE.Vector3(c.x - cx * s, c.y + cy * s, 0);
    const pivot = new THREE.Group(); pivot.add(mesh); pivot.position.copy(home); group.add(pivot);
    return { pivot, mesh, home, w: b.max.x - b.min.x, h: b.max.y - b.min.y, layer, color };
  });
  // name the parts by layer + horizontal order
  const red = items.filter((i) => i.layer === 'wordmark').sort((a, b) => a.home.x - b.home.x);
  const green = items.filter((i) => i.layer !== 'wordmark').sort((a, b) => b.w - a.w);
  const parts = { T1: red[0], dash: red[1], P: red[2], O: red[3], T2: red[4], swoosh: green[0], leaf: green[1] };
  return { group, parts, items, width, height: box.h * s, scale: s };
}

// CGI T-POT appliances. Built procedurally, kept clean and recognisable (no heavy distortion).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const BRAND = 'T-POT'; // never "TPOT" -- the dash is part of the name

function logoTexture(w = 512, h = 128, fg = '#ffffff', bg = null) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
  g.fillStyle = fg; g.font = `${Math.floor(h * 0.78)}px Anton, Impact, sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(BRAND, w / 2, h / 2 + h * 0.04);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

function logoPlate(w, h, fg = '#ffffff') {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: logoTexture(512, 128, fg), transparent: true, depthWrite: false }));
}

const paint = (col, o = {}) => new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.25, metalness: 0.1, clearcoat: 0.8, clearcoatRoughness: 0.15, ...o });
const metal = (col) => new THREE.MeshStandardMaterial({ color: col, roughness: 0.25, metalness: 0.9 });

/** TV with a live canvas screen (draw anything on it each frame through tv.screenCtx). */
export function makeTV() {
  const g = new THREE.Group();
  const W = 3.4, H = 2.0;
  const body = new THREE.Mesh(new RoundedBoxGeometry(W, H, 0.18, 3, 0.05), paint(0x111118, { roughness: 0.35 }));
  body.castShadow = true; g.add(body);
  const c = document.createElement('canvas'); c.width = 512; c.height = 300;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.16, H - 0.16), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  screen.position.z = 0.092; g.add(screen);
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.4, 0.1), metal(0x888899)); neck.position.set(0, -H / 2 - 0.2, -0.04); g.add(neck);
  const foot = new THREE.Mesh(new RoundedBoxGeometry(1.4, 0.06, 0.55, 2, 0.02), metal(0x888899)); foot.position.set(0, -H / 2 - 0.4, 0); foot.castShadow = true; g.add(foot);
  const logo = logoPlate(0.5, 0.12); logo.position.set(0, -H / 2 + 0.04, 0.095); g.add(logo);
  g.userData = { kind: 'tv', screen, screenCtx: c.getContext('2d'), screenTex: tex, W, H, base: -H / 2 - 0.43 };
  return g;
}

/** draw on a TV screen: mode 'off' | 'static' | 'logo' | 'text' | 'bars' */
export function drawTV(tv, mode, t, text = '', col = '#ffd400') {
  const { screenCtx: g, screenTex } = tv.userData; const w = 512, h = 300;
  if (mode === 'off') { g.fillStyle = '#050508'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(40, 30, 160, 20); }
  else if (mode === 'static') {
    const img = g.createImageData(128, 75); let s = Math.floor(t * 60) * 9973;
    for (let i = 0; i < img.data.length; i += 4) { s = (s * 16807) % 2147483647; const v = s % 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    const tmp = document.createElement('canvas'); tmp.width = 128; tmp.height = 75; tmp.getContext('2d').putImageData(img, 0, 0);
    g.imageSmoothingEnabled = false; g.drawImage(tmp, 0, 0, w, h);
  } else if (mode === 'bars') {
    const cols = ['#fff', '#ffd400', '#16e0ff', '#b4ff1e', '#ff4fd8', '#ff2a4d', '#2a5bff'];
    cols.forEach((c, i) => { g.fillStyle = c; g.fillRect(i * w / 7, 0, w / 7 + 1, h); });
  } else {
    const grd = g.createLinearGradient(0, 0, w, h); grd.addColorStop(0, '#2a0a5e'); grd.addColorStop(1, '#ff2a4d');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) { g.fillStyle = `rgba(255,255,255,${0.06})`; g.fillRect(0, ((t * 200 + i * 40) % h), w, 6); }
    g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle';
    const s = mode === 'logo' ? 170 : Math.min(190, 900 / Math.max(3, text.length));
    g.font = `${s}px Anton, Impact, sans-serif`; g.fillText(mode === 'logo' ? BRAND : text, w / 2, h / 2 + 8);
  }
  screenTex.needsUpdate = true;
}

/** Refrigerator with hinged doors and a glowing interior. */
export function makeFridge(col = 0xe9edf5) {
  const g = new THREE.Group();
  const W = 1.7, H = 3.6, D = 1.5;
  const shell = new THREE.Mesh(new RoundedBoxGeometry(W, H, D, 3, 0.08), paint(col));
  shell.castShadow = shell.receiveShadow = true; shell.position.y = H / 2; g.add(shell);
  const inside = new THREE.Mesh(new THREE.BoxGeometry(W - 0.2, H - 0.25, 0.1), new THREE.MeshBasicMaterial({ color: 0xfff6d0 }));
  inside.position.set(0, H / 2, D / 2 + 0.005); g.add(inside);
  const doors = [];
  const mkDoor = (h, y) => {
    const pivot = new THREE.Group(); pivot.position.set(-W / 2, y, D / 2 + 0.06); g.add(pivot);
    const d = new THREE.Mesh(new RoundedBoxGeometry(W, h - 0.04, 0.12, 2, 0.04), paint(col)); d.position.x = W / 2; d.castShadow = true; pivot.add(d);
    const handle = new THREE.Mesh(new RoundedBoxGeometry(0.07, Math.min(0.9, h * 0.5), 0.1, 2, 0.03), metal(0xbbbbcc)); handle.position.set(W - 0.18, 0, 0.1); pivot.add(handle);
    doors.push(pivot); return pivot;
  };
  mkDoor(1.15, H - 0.6); const low = mkDoor(2.4, 1.22);
  const logo = logoPlate(0.7, 0.18, '#1b1433'); logo.position.set(W / 2, 0.65, 0.07); low.add(logo);
  g.userData = { kind: 'fridge', doors, W, H, D, inside };
  return g;
}

/** Washing machine with a spinning drum visible through the door glass. */
export function makeWasher(col = 0xf4f6fb) {
  const g = new THREE.Group();
  const S = 2.0;
  const shell = new THREE.Mesh(new RoundedBoxGeometry(S, S * 1.1, S * 0.95, 3, 0.1), paint(col));
  shell.position.y = S * 0.55; shell.castShadow = shell.receiveShadow = true; g.add(shell);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(S * 0.92, 0.28, 0.04), paint(0x22202e)); panel.position.set(0, S * 1.0, S * 0.48); g.add(panel);
  const disp = logoPlate(0.55, 0.14, '#16e0ff'); disp.position.set(-0.45, S * 1.0, S * 0.505); g.add(disp);
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 20), metal(0xccccdd)); knob.rotation.x = Math.PI / 2; knob.position.set(0.6, S * 1.0, S * 0.5); g.add(knob);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.08, 12, 40), metal(0xb8bccc)); ring.position.set(0, S * 0.5, S * 0.48); g.add(ring);
  const drum = new THREE.Group(); drum.position.set(0, S * 0.5, S * 0.2); g.add(drum);
  const back = new THREE.Mesh(new THREE.CircleGeometry(0.6, 32), new THREE.MeshStandardMaterial({ color: 0x2b3550, metalness: 0.6, roughness: 0.3 })); back.position.z = -0.1; drum.add(back);
  for (let i = 0; i < 3; i++) { const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.2), metal(0x9aa3bb)); const a = i * Math.PI * 2 / 3; fin.position.set(Math.cos(a) * 0.35, Math.sin(a) * 0.35, 0); fin.rotation.z = a; drum.add(fin); }
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.58, 40), new THREE.MeshPhysicalMaterial({ color: 0x9fdcff, transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0, clearcoat: 1 }));
  glass.position.set(0, S * 0.5, S * 0.5); g.add(glass);
  g.userData = { kind: 'washer', drum, S, doorCenter: new THREE.Vector3(0, S * 0.5, S * 0.5) };
  return g;
}

/** Rice cooker (lathe body, dome lid, handle, display). */
export function makeRiceCooker(col = 0xffffff) {
  const g = new THREE.Group();
  const pts = [];
  for (let i = 0; i <= 12; i++) { const a = i / 12; pts.push(new THREE.Vector2(0.95 + Math.sin(a * Math.PI) * 0.12, a * 1.1)); }
  pts.unshift(new THREE.Vector2(0, 0));
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 40), paint(col)); body.castShadow = true; g.add(body);
  const lid = new THREE.Mesh(new THREE.SphereGeometry(1.0, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2.6), paint(0xd9dde8)); lid.scale.y = 0.55; lid.position.y = 1.08; lid.castShadow = true;
  const lidG = new THREE.Group(); lidG.position.set(0, 0, -0.9); lid.position.z = 0.9; lidG.add(lid); g.add(lidG);
  const knob = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.5, 3, 10), paint(0x1b1433)); knob.rotation.z = Math.PI / 2; knob.position.set(0, 1.62, 0.9); lidG.add(knob);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 1.08, 0.12, 40), paint(0xff2a4d)); band.position.y = 0.55; g.add(band);
  const disp = logoPlate(0.7, 0.18, '#ff2a4d'); disp.position.set(0, 0.82, 1.08); g.add(disp);
  g.userData = { kind: 'rice', lid: lidG };
  return g;
}

export function makeProduct(kind) {
  return { tv: makeTV, fridge: makeFridge, washer: makeWasher, rice: makeRiceCooker }[kind]();
}

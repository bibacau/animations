// Tiny performers: chibi mascots with a procedural rig (no storyline, pure physical comedy).
import * as THREE from 'three';
import { clamp } from './util.js';

const SKINS = {
  pip: { body: 0xff5a1f, belly: 0xffd400, limb: 0x1b1433, accent: 0x16e0ff },
  volt: { body: 0x16e0ff, belly: 0xffffff, limb: 0x1b1433, accent: 0xff2a4d },
  boo: { body: 0xb4ff1e, belly: 0x7b2cff, limb: 0x1b1433, accent: 0xff4fd8 },
};

export class Character {
  constructor(skin = 'pip', scale = 1) {
    const c = SKINS[skin];
    const M = (col, o = {}) => new THREE.MeshStandardMaterial({ color: col, roughness: 0.45, ...o });
    this.root = new THREE.Group();          // world placement (feet at origin)
    this.body = new THREE.Group();          // squash & stretch + lean
    this.root.add(this.body);
    this.root.scale.setScalar(scale);
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.28, 4, 12), M(c.body));
    torso.position.y = 0.62; this.body.add(torso);
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), M(c.belly));
    belly.scale.set(1, 1.1, 0.5); belly.position.set(0, 0.58, 0.17); this.body.add(belly);
    this.head = new THREE.Group(); this.head.position.y = 1.08; this.body.add(this.head);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.36, 18, 14), M(c.body));
    this.head.add(skull);
    const eyeW = M(0xffffff, { roughness: 0.2 }), eyeB = M(0x111111, { roughness: 0.1 });
    this.eyes = [];
    for (const s of [-1, 1]) {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), eyeW);
      e.position.set(0.13 * s, 0.05, 0.28); e.scale.z = 0.6;
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), eyeB);
      p.position.set(0, 0, 0.08); e.add(p);
      this.head.add(e); this.eyes.push(e);
    }
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.28), M(c.limb));
    ant.position.y = 0.45; this.head.add(ant);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), M(c.accent, { emissive: c.accent, emissiveIntensity: 0.8 }));
    bulb.position.y = 0.6; this.head.add(bulb); this.bulb = bulb;
    const limb = (len, r) => { const g = new THREE.CapsuleGeometry(r, len, 3, 8); g.translate(0, -len / 2 - r * 0.5, 0); return g; };
    const mkPivot = (x, y, geo) => { const p = new THREE.Group(); p.position.set(x, y, 0); const m = new THREE.Mesh(geo, M(c.limb)); m.castShadow = true; p.add(m); this.body.add(p); return p; };
    this.armL = mkPivot(-0.3, 0.8, limb(0.3, 0.06)); this.armR = mkPivot(0.3, 0.8, limb(0.3, 0.06));
    this.legL = mkPivot(-0.13, 0.4, limb(0.26, 0.075)); this.legR = mkPivot(0.13, 0.4, limb(0.26, 0.075));
    for (const m of [torso, skull, belly]) m.castShadow = true;
  }
  /**
   * pose(mode, p, k): mode in run|jump|fall|land|slide|surf|cheer|hang|climb|idle|launch|ride
   * p: cycle phase (0..1 repeating) ; k: extra amount (squash, lean)
   */
  pose(mode, p = 0, k = 0) {
    const s = Math.sin(p * Math.PI * 2), c = Math.cos(p * Math.PI * 2);
    const b = this.body; b.rotation.set(0, 0, 0); b.position.set(0, 0, 0); b.scale.set(1, 1, 1);
    this.head.rotation.set(0, 0, 0);
    const set = (o, x, z = 0) => { o.rotation.set(x, 0, z); };
    switch (mode) {
      case 'run':
        set(this.legL, s * 0.9); set(this.legR, -s * 0.9); set(this.armL, -s * 1.1, -0.2); set(this.armR, s * 1.1, 0.2);
        b.position.y = Math.abs(c) * 0.1; b.rotation.x = 0.25; break;
      case 'jump':
        set(this.legL, -0.9); set(this.legR, -0.5); set(this.armL, -2.6, -0.4); set(this.armR, -2.6, 0.4);
        b.scale.set(0.9, 1.15, 0.9); b.rotation.x = -0.1 + k * 0.5; break;
      case 'fall':
        set(this.legL, s * 1.4, -0.3); set(this.legR, -s * 1.4, 0.3); set(this.armL, -2.8 + s, -0.8); set(this.armR, -2.8 - s, 0.8);
        b.rotation.z = Math.sin(p * 9) * 0.3; this.head.rotation.x = -0.3; break;
      case 'land':
        set(this.legL, -0.5, -0.2); set(this.legR, -0.5, 0.2); set(this.armL, -0.5, -1.2); set(this.armR, -0.5, 1.2);
        b.scale.set(1 + k * 0.45, 1 - k * 0.4, 1 + k * 0.45); break;
      case 'slide':
        set(this.legL, -1.3); set(this.legR, -1.3); set(this.armL, -0.4, -1.4); set(this.armR, -0.4, 1.4);
        b.rotation.x = -0.6; b.position.y = -0.15; break;
      case 'surf':
        set(this.legL, -0.4, -0.4); set(this.legR, 0.4, 0.4); set(this.armL, s * 0.2, -1.5); set(this.armR, -s * 0.2, 1.5);
        b.rotation.y = 0.9; b.rotation.z = s * 0.12; b.scale.y = 0.92; break;
      case 'cheer':
        set(this.legL, 0, -0.15); set(this.legR, 0, 0.15); set(this.armL, -2.9 + s * 0.3, -0.3); set(this.armR, -2.9 - s * 0.3, 0.3);
        b.position.y = Math.abs(s) * 0.15; break;
      case 'hang':
        set(this.armL, -3.0, -0.1); set(this.armR, -3.0, 0.1); set(this.legL, s * 0.5); set(this.legR, -s * 0.4);
        b.rotation.x = s * 0.25; break;
      case 'climb':
        set(this.armL, -2.6 + s * 0.5); set(this.armR, -2.6 - s * 0.5); set(this.legL, -0.9 - s * 0.4); set(this.legR, -0.9 + s * 0.4); b.rotation.x = 0.35; break;
      case 'launch':
        set(this.legL, 0.2); set(this.legR, 0.2); set(this.armL, -3.1, -0.1); set(this.armR, -3.1, 0.1); b.scale.set(0.8, 1.35, 0.8); break;
      case 'ride':
        set(this.legL, -0.8, -0.2); set(this.legR, -0.8, 0.2); set(this.armL, -2.9, -0.5); set(this.armR, -0.4, 1.3); b.position.y = -0.1 + Math.abs(s) * 0.05; break;
      default: // idle bob
        set(this.armL, 0.1 + s * 0.15, -0.2); set(this.armR, 0.1 - s * 0.15, 0.2); set(this.legL, 0); set(this.legR, 0);
        b.scale.set(1 + clamp(k) * 0.2, 1 - clamp(k) * 0.2, 1);
    }
    this.bulb.scale.setScalar(1 + k * 0.8);
    return this;
  }
}

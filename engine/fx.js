// Deterministic FX: particle bursts, shockwave rings, beat-reactive background,
// post-processing (aberration, flash, zoom-blur, glitch, grain) and impact shake.
import * as THREE from 'three';
import { hash, clamp, decay } from './util.js';
import { PALETTE } from './text3d.js';

const MAXP = 1800;

export class FX {
  constructor(scene) {
    this.bursts = []; this.rings = []; this.impacts = []; this.flashes = []; this.glitches = []; this.zooms = [];
    const geo = new THREE.BoxGeometry(1, 1, 1);
    this.pmesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.4, emissiveIntensity: 0.4 }), MAXP);
    this.pmesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.pmesh.frustumCulled = false;
    const col = new THREE.Color();
    for (let i = 0; i < MAXP; i++) this.pmesh.setColorAt(i, col.set(0xffffff));
    scene.add(this.pmesh);
    this.ringPool = [];
    for (let i = 0; i < 8; i++) {
      const r = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 64), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
      r.visible = false; scene.add(r); this.ringPool.push(r);
    }
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._e = new THREE.Euler(); this._c = new THREE.Color();
  }
  /** particles: {t0, pos, n, speed, up, gravity, life, size, colors[], cone:{x,y,z}, spread, seed} */
  burst(o) { this.bursts.push({ n: 60, speed: 6, gravity: 9, life: 1.2, size: 0.12, colors: ['yellow', 'red', 'white'], spread: 1, seed: this.bursts.length * 13 + 1, cone: null, ...o }); }
  ring(o) {
    const n = o.normal || { x: 0, y: 1, z: 0 };
    this.rings.push({ life: 0.5, maxR: 6, color: 0xffffff, ...o, normal: new THREE.Vector3(n.x, n.y, n.z).normalize() });
  }
  impact(t0, amp = 1, k = 9) { this.impacts.push({ t0, amp, k }); }
  flash(t0, amt = 0.8, k = 10, color = 0xffffff) { this.flashes.push({ t0, amt, k, color: new THREE.Color(color) }); }
  glitch(t0, amt = 1, dur = 0.15) { this.glitches.push({ t0, amt, dur }); }
  zoom(t0, amt = 0.3, dur = 0.25) { this.zooms.push({ t0, amt, dur }); }
  clearAll() { this.bursts = []; this.rings = []; this.impacts = []; this.flashes = []; this.glitches = []; this.zooms = []; }

  update(t, w0 = -1e9, w1 = 1e9) {
    let k = 0; const m = this._m, q = this._q, e = this._e, c = this._c;
    for (const b of this.bursts) {
      const dt = t - b.t0; if (dt < 0 || dt > b.life || b.t0 < w0 - 0.05 || b.t0 >= w1) continue;
      for (let i = 0; i < b.n && k < MAXP; i++, k++) {
        const h1 = hash(b.seed * 31 + i * 1.7), h2 = hash(b.seed * 17 + i * 3.1), h3 = hash(b.seed * 7 + i * 5.3), h4 = hash(b.seed + i * 9.9);
        let dx, dy, dz;
        if (b.cone) { dx = b.cone.x + (h1 - 0.5) * b.spread; dy = b.cone.y + (h2 - 0.5) * b.spread; dz = (b.cone.z || 0) + (h3 - 0.5) * b.spread; }
        else { const th = h1 * Math.PI * 2, ph = Math.acos(2 * h2 - 1); dx = Math.sin(ph) * Math.cos(th); dy = Math.abs(Math.cos(ph)) * 0.8 + 0.2; dz = Math.sin(ph) * Math.sin(th); }
        const sp = b.speed * (0.4 + h4 * 0.8);
        const drag = (1 - Math.exp(-2.2 * dt)) / 2.2;
        const x = b.pos.x + dx * sp * drag, y = b.pos.y + dy * sp * drag - 0.5 * b.gravity * dt * dt, z = b.pos.z + dz * sp * drag;
        const life = 1 - dt / b.life;
        const s = b.size * (0.5 + h3) * Math.min(1, life * 2.5);
        e.set(dt * 9 * h1, dt * 7 * h2, dt * 5 * h3); q.setFromEuler(e);
        m.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(s, s * (b.flat ? 0.15 : 1), s));
        this.pmesh.setMatrixAt(k, m);
        const cn = b.colors[i % b.colors.length]; c.set(PALETTE[cn] ?? cn);
        this.pmesh.setColorAt(k, c);
      }
    }
    for (; k < MAXP; k++) { m.makeScale(0, 0, 0); this.pmesh.setMatrixAt(k, m); }
    this.pmesh.instanceMatrix.needsUpdate = true; if (this.pmesh.instanceColor) this.pmesh.instanceColor.needsUpdate = true;
    let r = 0;
    for (const o of this.rings) {
      const dt = t - o.t0; if (dt < 0 || dt > o.life || r >= this.ringPool.length || o.t0 < w0 - 0.05 || o.t0 >= w1) continue;
      const ring = this.ringPool[r++]; const u = dt / o.life;
      ring.visible = true; ring.position.copy(o.pos);
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), o.normal);
      const sc = 0.2 + (1 - Math.pow(1 - u, 3)) * o.maxR; ring.scale.set(sc, sc, sc);
      ring.material.color.set(o.color); ring.material.opacity = (1 - u) * 0.9;
    }
    for (; r < this.ringPool.length; r++) this.ringPool[r].visible = false;
  }
  shake(t) { let a = 0; for (const i of this.impacts) { const dt = t - i.t0; if (dt >= 0 && dt < 1) a += i.amp * decay(dt, i.k); } return a; }
  flashAt(t) {
    let a = 0; const col = new THREE.Color(0, 0, 0);
    for (const f of this.flashes) { const dt = t - f.t0; if (dt >= -0.01 && dt < 1) { const v = f.amt * decay(Math.max(0, dt), f.k); if (v > a) { a = v; col.copy(f.color); } } }
    return { a, col };
  }
  glitchAt(t) { let a = 0; for (const g of this.glitches) { const dt = t - g.t0; if (dt >= 0 && dt < g.dur) a = Math.max(a, g.amt * (1 - dt / g.dur)); } return a; }
  zoomAt(t) { let a = 0; for (const z of this.zooms) { const dt = t - z.t0; if (dt >= -z.dur * 0.5 && dt < z.dur) a = Math.max(a, z.amt * (1 - Math.abs(dt) / z.dur)); } return a; }
}

// ---------------- background ---------------------------------------------------------
export function makeBackground() {
  const mat = new THREE.ShaderMaterial({
    depthWrite: false, depthTest: false,
    uniforms: { uT: { value: 0 }, uA: { value: new THREE.Color(0x1b0b3a) }, uB: { value: new THREE.Color(0xff2a4d) }, uC: { value: new THREE.Color(0xffd400) },
      uPattern: { value: 0 }, uPulse: { value: 0 }, uSpin: { value: 0 }, uCount: { value: 0 }, uAspect: { value: 9 / 16 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.9999,1.0); }`,
    fragmentShader: `
      varying vec2 vUv; uniform float uT,uPattern,uPulse,uSpin,uCount,uAspect; uniform vec3 uA,uB,uC;
      float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
      void main(){
        vec2 p = vUv-0.5; p.x*=uAspect;
        float r=length(p); float a=atan(p.y,p.x);
        vec3 col = mix(uA,uB, smoothstep(-0.6,0.7,p.y+0.15*sin(uT*0.7)));
        if(uPattern<0.5){ // soft gradient + noise blobs
          col = mix(col, uC, 0.12*smoothstep(0.5,0.0,length(p-vec2(0.2*sin(uT*.5),0.1*cos(uT*.3)))));
        } else if(uPattern<1.5){ // sunburst rays
          float rays = step(0.5, fract(a/6.2831*14.0 + uSpin));
          col = mix(uA, uB, rays); col = mix(col, uC, smoothstep(0.35,0.0,r)*0.8);
        } else if(uPattern<2.5){ // retro perspective grid floor
          col = mix(uA, uB, smoothstep(0.0,-0.5,p.y));
          if(p.y<0.0){ float z = 0.25/(-p.y+0.02); float gx = abs(fract(p.x*z*2.0)-0.5); float gz = abs(fract(z+uT*1.5)-0.5);
            float l = smoothstep(0.06,0.0,min(gx,gz)*(1.0+z*0.1)); col = mix(col, uC, l*smoothstep(0.0,-0.08,p.y)); }
          col += uC*0.35*smoothstep(0.04,0.0,abs(p.y));
        } else if(uPattern<3.5){ // diagonal stripes
          float s = step(0.5, fract((p.x+p.y)*7.0 - uT*0.8 + uSpin));
          col = mix(uA, uB, s*0.85);
        } else if(uPattern<4.5){ // halftone dots
          vec2 g = fract(p*28.0)-0.5; float d = length(g); float rad = 0.18+0.25*smoothstep(0.7,-0.3,p.y+0.2*sin(uT));
          col = mix(uA, uB, smoothstep(rad,rad-0.05,d));
        } else { // starfield / speed
          col = uA*0.6; vec2 g=floor(p*90.0); float s=h(g); if(s>0.985) col+=uC*(0.6+0.4*sin(uT*8.0+s*40.0));
        }
        col += uPulse*0.18*uC*smoothstep(0.9,0.0,r);
        col *= 1.0 - 0.35*r*r;
        gl_FragColor = vec4(col,1.0);
      }`,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  quad.frustumCulled = false; quad.renderOrder = -1000;
  return quad;
}

// ---------------- post shader --------------------------------------------------------
export const PostShader = {
  uniforms: { tDiffuse: { value: null }, uAb: { value: 0.0015 }, uFlash: { value: 0 }, uFlashCol: { value: new THREE.Color(1, 1, 1) },
    uZoom: { value: 0 }, uGlitch: { value: 0 }, uSeed: { value: 0 }, uGrain: { value: 0.04 }, uInvert: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uAb,uFlash,uZoom,uGlitch,uSeed,uGrain,uInvert; uniform vec3 uFlashCol; varying vec2 vUv;
    float h(float n){ return fract(sin(n)*43758.5453); }
    void main(){
      vec2 uv=vUv;
      if(uGlitch>0.001){ float band=floor(uv.y*24.0+uSeed*7.0); float o=(h(band+uSeed)-0.5)*0.12*uGlitch*step(0.55,h(band*1.3+uSeed)); uv.x+=o; }
      vec2 d=uv-0.5; float ab=uAb+uGlitch*0.012+uZoom*0.01;
      vec3 c;
      if(uZoom>0.001){
        vec3 acc=vec3(0.0); for(int i=0;i<10;i++){ float s=1.0-uZoom*0.35*float(i)/9.0; vec2 q=0.5+d*s;
          acc+=vec3(texture2D(tDiffuse,q+d*ab).r, texture2D(tDiffuse,q).g, texture2D(tDiffuse,q-d*ab).b); }
        c=acc/10.0;
      } else {
        c=vec3(texture2D(tDiffuse,uv+d*ab).r, texture2D(tDiffuse,uv).g, texture2D(tDiffuse,uv-d*ab).b);
      }
      c=mix(c,1.0-c,uInvert);
      c=mix(c,uFlashCol,clamp(uFlash,0.0,1.0));
      c+= (h(dot(vUv,vec2(91.3,47.7))+uSeed)-0.5)*uGrain;
      float v=smoothstep(1.05,0.35,length(d*vec2(0.9,1.0))); c*=mix(0.72,1.0,v);
      gl_FragColor=vec4(c,1.0);
    }`,
};

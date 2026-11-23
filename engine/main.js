// Bootstrap: renderer, lights, post chain, director -> scenes. Exposes window.renderAt(t).
import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MusicClock } from './music.js';
import { FX, makeBackground, PostShader } from './fx.js';
import { planScenes, registerTransitions } from './director.js';
import { REGISTRY } from './scenes/index.js';
import { hash } from './util.js';
import { TypeLayer } from './typeLayer.js';
import { loadLogo, logoTexture } from './logo.js';

const qs = new URLSearchParams(location.search);
const W = +(qs.get('w') || 1920), H = +(qs.get('h') || 1080);

async function boot() {
  const [tl, anton, bowlby, logo] = await Promise.all([
    fetch('/data/timeline.json').then((r) => r.json()),
    new FontLoader().loadAsync('/assets/fonts/anton.typeface.json'),
    new FontLoader().loadAsync('/assets/fonts/bowlby.typeface.json'),
    loadLogo(),
  ]);
  await document.fonts.load('100px Anton'); await document.fonts.ready;

  const canvas = document.getElementById('c');
  canvas.width = W; canvas.height = H;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 600);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  const bg = makeBackground(); bg.material.uniforms.uAspect.value = W / H; scene.add(bg);
  const typeLayer = new TypeLayer(1280, 720);
  bg.material.uniforms.tType.value = typeLayer.tex;

  const hemi = new THREE.HemisphereLight(0xffffff, 0x3a2266, 1.1); scene.add(hemi);
  const key = new THREE.DirectionalLight(0xfff2e0, 2.6);
  key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 0.5, far: 80 });
  key.shadow.bias = -0.0008; key.shadow.normalBias = 0.02;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x66e0ff, 1.3); scene.add(rim, rim.target);

  const root = new THREE.Group(); scene.add(root);
  const fx = new FX(scene);
  const music = new MusicClock(tl);
  const ctx = { music, fx, root, fonts: { anton, bowlby }, memory: {}, camera, W, H, logo };

  const plan = planScenes(music, REGISTRY, +(qs.get('seed') || 7));
  const scenes = plan.map((p) => { const s = new p.template(ctx, p); s.events(); return s; });
  registerTransitions(music, fx, plan);
  window.__plan = plan.map((p) => ({ template: p.meta.id, t0: +p.t0.toFixed(3), t1: +p.t1.toFixed(3), text: p.phrase?.text || '(instrumental)' }));
  console.log('PLAN', JSON.stringify(window.__plan));

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(1); composer.setSize(W, H);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new OutputPass());                 // tone map + sRGB first ...
  const post = new ShaderPass(PostShader); composer.addPass(post);   // ... then grade/brand card in display space
  post.uniforms.tLogo.value = logoTexture(logo, 2400);
  post.uniforms.uAspect.value = W / H;

  const U = bg.material.uniforms;
  window.renderAt = (t) => {
    let active = scenes[0];
    for (const s of scenes) { if (t >= s.t0) active = s; s.group.visible = false; }
    active.group.visible = true;
    active.update(t);

    // ---- camera: scene camera + music-driven punch / shake / roll -------------------
    const c = active.cam;
    const e = music.energy(t);
    const kick = music.kick(t), snare = music.snare(t);
    const sh = fx.shake(t);
    camera.position.copy(c.pos);
    camera.position.x += (hash(t * 91.7) - 0.5) * sh * 0.5;
    camera.position.y += (hash(t * 53.3 + 1) - 0.5) * sh * 0.5;
    camera.up.set(0, 1, 0);
    camera.lookAt(c.look);
    camera.rotateZ(c.roll + (snare * 0.012 * (music.beatIndex(t) % 2 ? 1 : -1)) * (0.4 + e) + (hash(t * 33.1) - 0.5) * sh * 0.04);
    camera.fov = c.fov * (1 - kick * 0.035 * (0.3 + e) - sh * 0.02);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    if (active.afterCamera) active.afterCamera(camera, t);

    // ---- lights follow the action -------------------------------------------------
    const lt = active.light.target;
    key.target.position.copy(lt); key.position.set(lt.x + 6, lt.y + 14, lt.z + 8);
    rim.target.position.copy(lt); rim.position.set(lt.x - 8, lt.y + 4, lt.z - 6);

    // ---- background -----------------------------------------------------------------
    const b = active.bg;
    U.uT.value = t; U.uPattern.value = b.pattern; U.uSpin.value = b.spin || 0;
    U.uA.value.set(b.a); U.uB.value.set(b.b); U.uC.value.set(b.c);
    U.uPulse.value = music.beatPulse(t) * (0.5 + e);
    // full-frame lyric typography: words of the active scene already sung (never early)
    const ty = active.bgType === undefined ? {} : active.bgType;
    if (ty) {
      const sung = active.words.filter((w) => w.start <= t).map((w) => w.display);
      const kicks = music.kicks.filter((k) => k.t <= t);
      const lastK = kicks.at(-1);
      const step = kicks.length + (lastK ? Math.min(1, (t - lastK.t) / 0.12) : 0) - 1;
      typeLayer.draw({ text: ty.text ?? (sung.length ? sung.join(' ') : 'T-POT'), t, step, rows: ty.rows || 5, style: ty.style || 'mix',
        scrollY: ty.scrollY || 0, angle: ty.angle ?? -0.06, speed: ty.speed });
      U.uTypeAmt.value = (ty.amt ?? 0.16) * (1 + music.beatPulse(t) * 0.6);
      U.uTypeCol.value.set(ty.color ?? b.c);
    } else U.uTypeAmt.value = 0;

    fx.update(t, active.t0, active.t1);

    // ---- post -----------------------------------------------------------------------
    const fl = fx.flashAt(t);
    const PU = post.uniforms;
    PU.uFlash.value = fl.a; PU.uFlashCol.value.copy(fl.col);
    if (active.fade) { PU.uFlash.value = active.fade; PU.uFlashCol.value.setRGB(0, 0, 0); }
    PU.uZoom.value = fx.zoomAt(t) + (active.zoomBlur || 0);
    PU.uGlitch.value = fx.glitchAt(t) + music.hat(t) * 0.05 * e;
    PU.uSeed.value = Math.floor(t * 30) % 97;
    PU.uAb.value = 0.0012 + kick * 0.004 * e;
    PU.uInvert.value = active.invert || 0;
    const card = active.card || null;
    PU.uWipe.value = card ? card.wipe : 0;
    PU.uLogoAmt.value = card ? card.logo : 0;
    PU.uShine.value = card ? card.shine : -1;
    PU.uVig.value = card ? 1 - card.wipeDone : 1;
    if (card) { PU.uLogoRect.value.copy(card.rect); PU.uWipeC.value.copy(card.center); }
    composer.render();
  };
  window.frameJPEG = (t, q = 0.93) => { window.renderAt(t); return canvas.toDataURL('image/jpeg', q); };
  window.__duration = tl.duration;
  window.__ready = true;
}

boot().catch((e) => { console.error(e); window.__error = String(e.stack || e); });

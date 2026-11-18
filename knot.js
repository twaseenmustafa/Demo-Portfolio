/* Real-time contact knot: the Blender model (blender/knot.blend -> assets/knot/knot.glb, Draco),
   lit by a PMREM environment built from emissive panels that copy the Blender light rig
   (royal blue right, violet top-right, cool-white rim strip top-left, navy fill below).
   Crevice darkening comes from AO baked into vertex colours in Blender. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const lin = (r, g, b) => new THREE.Color().setRGB(r, g, b, THREE.LinearSRGBColorSpace);

export async function mountKnot(art, { reduced }) {
  const canvas = art.querySelector('.kx__gl');
  const coarse = matchMedia('(pointer: coarse)').matches;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch { return; } // no WebGL: the poster stays
  renderer.setPixelRatio(Math.min(devicePixelRatio, coarse ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  const env = new THREE.Scene();
  const panel = (w, h, pos, color, k) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: color.multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); env.add(m);
  };
  // Blender (x, y, z) -> three (x, z, -y); strengths follow the Blender emission values
  panel(12, 26, [13, 0, 2], lin(0.2, 0.28, 1), 2.4);
  panel(16, 10, [8, 11, 4], lin(0.72, 0.64, 1), 7);
  panel(14, 1.6, [-7, 9, 6], lin(0.9, 0.93, 1), 24);
  panel(24, 10, [0, -12, 4], lin(0.03, 0.05, 0.25), 3);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(env, 0.04).texture;
  scene.environment = envTex;
  env.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); });

  const rim = new THREE.DirectionalLight(lin(0.85, 0.9, 1), 2.2);
  rim.position.set(-7, 9, 6);
  scene.add(rim);

  // camera copied from the Blender poster camera (50 mm on 36 mm sensor, square frame)
  const camera = new THREE.PerspectiveCamera(39.6, 1, 0.1, 100);
  camera.position.set(6.9, 5.7, 14.1);
  const look = new THREE.Vector3(0, 0, 0); // centred: the section crops it into the corner
  camera.lookAt(look);

  const draco = new DRACOLoader().setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/libs/draco/gltf/');
  const gltf = await new GLTFLoader().setDRACOLoader(draco).loadAsync('assets/knot/knot.glb');
  draco.dispose();
  const knot = gltf.scene;
  const mat = new THREE.MeshPhysicalMaterial({ color: lin(0.4, 0.41, 0.6), metalness: 1, roughness: 0.17, clearcoat: 1, clearcoatRoughness: 0.05, vertexColors: true, envMapIntensity: 1 });
  knot.traverse(o => { if (o.isMesh) { o.material.dispose(); o.material = mat; } });
  const tilt = new THREE.Group();
  tilt.add(knot);
  scene.add(tilt);

  const fit = () => {
    const w = art.clientWidth, h = art.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep at least the square Blender frame visible: fixed vertical fov when wide, fixed horizontal when tall
    camera.fov = camera.aspect >= 1 ? 39.6 : THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(19.8)) / camera.aspect));
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(fit); ro.observe(art); fit();

  // cursor -> soft, heavy response; touch / idle -> slow sine drift
  const P = { x: 0, y: 0 }, T = { x: 0, y: 0 };
  let last = -1e9;
  const onMove = e => { if (e.pointerType === 'touch') return; T.x = (e.clientX / innerWidth) * 2 - 1; T.y = (e.clientY / innerHeight) * 2 - 1; last = performance.now(); };
  addEventListener('pointermove', onMove, { passive: true });

  const clock = new THREE.Clock();
  let t = 0, frames = 0, slow = 0, visible = false;
  const tick = () => {
    const dt = Math.min(clock.getDelta(), 0.1);
    t += dt;
    if (coarse || performance.now() - last > 4000) { T.x = Math.sin(t * 0.25) * 0.7; T.y = Math.cos(t * 0.19) * 0.5; }
    const k = 1 - Math.pow(0.95, dt * 60); // lerp 0.05 at 60 fps, frame-rate independent
    P.x += (T.x - P.x) * k; P.y += (T.y - P.y) * k;
    knot.rotation.y += 0.16 * dt; // tumbles on two axes so new parts keep rolling into the visible corner
    knot.rotation.x += 0.09 * dt;
    knot.rotation.z = Math.sin(t * 0.2) * 0.3;
    window.__knot = { y: knot.rotation.y, x: knot.rotation.x }; // the ASCII field behind reacts to these
    tilt.rotation.set(THREE.MathUtils.degToRad(6) * P.y, THREE.MathUtils.degToRad(6) * P.x, 0);
    scene.environmentRotation.set(P.y * 0.25, P.x * 0.6, 0);
    rim.position.set(-7 + P.x * 6, 9 - P.y * 4, 6);
    renderer.render(scene, camera);
    // weak device guard: if the first ~2 s average below ~28 fps, hand back to the poster
    if (frames < 120) { frames++; slow += dt; if (frames === 120 && slow / 120 > 1 / 28) stop(true); }
  };
  const run = on => renderer.setAnimationLoop(on && !reduced ? tick : null);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; run(visible && !document.hidden); });
  const onVis = () => run(visible && !document.hidden);
  io.observe(art); document.addEventListener('visibilitychange', onVis);

  renderer.render(scene, camera); // first frame (also the still frame for reduced motion)
  art.classList.add('is-live');

  function stop(fallback) {
    run(false); io.disconnect(); ro.disconnect();
    removeEventListener('pointermove', onMove); document.removeEventListener('visibilitychange', onVis);
    if (fallback) art.classList.remove('is-live');
    knot.traverse(o => o.isMesh && o.geometry.dispose());
    mat.dispose(); envTex.dispose(); pmrem.dispose(); renderer.dispose();
  }
  addEventListener('pagehide', () => stop(false), { once: true });
  return stop;
}

import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { buildApartment } from './build';
import { WalkController } from './controls/walk';
import { MaterialRegistry } from './core/materials';
import { ColorStore } from './core/state';
import { sunDirection } from './core/sun';
import { toWorld } from './core/geom';
import { center, walkStart } from './data/apartment';
import { defaultColors } from './data/palette';
import { Panel, type Mode, type Selection } from './ui/panel';

const viewport = document.getElementById('viewport')!;
const walkHint = document.getElementById('walk-hint')!;
const crosshair = document.getElementById('crosshair')!;

// ---- Renderer & scene
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
viewport.prepend(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.className = 'label-layer';
viewport.appendChild(labelRenderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#e9ecea');
const CENTER = toWorld(center[0], center[1], 0.8);

const camera = new THREE.PerspectiveCamera(45, 1, 0.05, 200);
const PERSPECTIVE_POS = new THREE.Vector3(CENTER.x - 5.5, 13, CENTER.z + 10);

// ---- Model
const store = new ColorStore(defaultColors);
const mats = new MaterialRegistry(store);
const apartment = buildApartment(mats);
scene.add(apartment.root);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(40, 64),
  new THREE.MeshStandardMaterial({ color: '#dde1de', roughness: 1 }),
);
ground.rotation.x = -Math.PI / 2;
ground.position.set(CENTER.x, -0.21, CENTER.z);
ground.receiveShadow = true;
scene.add(ground);

const compassEl = document.createElement('div');
compassEl.className = 'compass';
compassEl.textContent = 'N ↑';
const compass = new CSS2DObject(compassEl);
compass.position.copy(toWorld(center[0], 10.4, 0));
scene.add(compass);
const labelObjects = [...apartment.labels, compass];

// ---- Lights
const timer = new THREE.Timer();
const hemi = new THREE.HemisphereLight('#f2f5fb', '#d8d2c4', 1.6);
const ambient = new THREE.AmbientLight('#ffffff', 0.9);
scene.add(hemi, ambient);
const sun = new THREE.DirectionalLight('#fff4e0', 2.5);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.radius = 3;
Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 80 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.02;
sun.target.position.copy(CENTER);
scene.add(sun, sun.target);

const WARM = new THREE.Color('#ffb877');
const WHITE = new THREE.Color('#fff6ea');
function setSun(hour: number) {
  const { dir, altitude } = sunDirection(hour);
  sun.position.copy(CENTER).addScaledVector(dir, 30);
  const strength = THREE.MathUtils.clamp(Math.sin(altitude) * 3, 0, 1);
  sun.intensity = 2.6 * strength;
  sun.color.lerpColors(WARM, WHITE, THREE.MathUtils.clamp(altitude / 0.45, 0, 1));
  hemi.intensity = 1.0 + 0.8 * THREE.MathUtils.clamp(Math.sin(altitude) * 2, 0, 1);
}
setSun(16);

// ---- Navigation
const orbit = new OrbitControls(camera, renderer.domElement);
orbit.target.copy(CENTER);
orbit.enableDamping = true;
orbit.maxPolarAngle = Math.PI * 0.48;
orbit.minDistance = 2;
orbit.maxDistance = 40;
camera.position.copy(PERSPECTIVE_POS);

const walk = new WalkController(camera, renderer.domElement, apartment.obstacles, apartment.walkable);

let mode: Mode = 'orbit';
let showCeilings = false;
let showLabels = true;
let cutHeight: number | null = null;
const clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
const savedOrbit = { pos: new THREE.Vector3(), target: new THREE.Vector3() };

function applyVisibility() {
  apartment.ceilings.visible = mode === 'walk' || showCeilings;
  labelObjects.forEach((o) => (o.visible = mode === 'orbit' && showLabels));
  if (mode === 'orbit' && cutHeight !== null) {
    clipPlane.constant = cutHeight;
    renderer.clippingPlanes = [clipPlane];
  } else {
    renderer.clippingPlanes = [];
  }
}

function setMode(next: Mode) {
  if (next === mode) return;
  if (next === 'walk') {
    savedOrbit.pos.copy(camera.position);
    savedOrbit.target.copy(orbit.target);
    orbit.enabled = false;
    walk.enabled = true;
    walk.place(walkStart.at, walkStart.lookAt);
    camera.fov = 70;
    walkHint.hidden = false;
  } else {
    walk.enabled = false;
    walk.controls.unlock();
    orbit.enabled = true;
    camera.position.copy(savedOrbit.pos);
    orbit.target.copy(savedOrbit.target);
    camera.fov = 45;
    walkHint.hidden = true;
    crosshair.hidden = true;
  }
  camera.updateProjectionMatrix();
  mode = next;
  applyVisibility();
  panel.setMode(mode);
}

walkHint.addEventListener('click', () => walk.controls.lock());
walk.controls.addEventListener('lock', () => {
  walkHint.hidden = true;
  crosshair.hidden = false;
});
walk.controls.addEventListener('unlock', () => {
  crosshair.hidden = true;
  if (mode === 'walk') walkHint.hidden = false;
});

function setView(preset: 'perspective' | 'top') {
  orbit.target.copy(CENTER);
  if (preset === 'top') camera.position.set(CENTER.x, 17, CENTER.z + 0.01);
  else camera.position.copy(PERSPECTIVE_POS);
}

// ---- Picking & selection highlight
const raycaster = new THREE.Raycaster();
let selection: Selection | null = null;
let highlighted: THREE.MeshStandardMaterial | null = null;
let highlightUntil = 0; // brief flash only, so the glow never distorts the colour being chosen

const isShown = (o: THREE.Object3D | null): boolean => !o || (o.visible && isShown(o.parent));

function pick(ndc: THREE.Vector2): Selection | null {
  raycaster.setFromCamera(ndc, camera);
  for (const hit of raycaster.intersectObject(apartment.root, true)) {
    if (!isShown(hit.object)) continue;
    if (mode === 'orbit' && cutHeight !== null && hit.point.y > cutHeight) continue;
    const ud = hit.object.userData;
    if (ud.faces && hit.face) {
      const i = hit.face.materialIndex;
      return { key: ud.faces[i], faceId: ud.faceIds?.[i] };
    }
    if (ud.key) return { key: ud.key };
  }
  return null;
}

function select(sel: Selection | null) {
  selection = sel;
  panel.showSelection(sel);
  refreshHighlight();
  highlightUntil = timer.getElapsed() + 1.2;
}

function refreshHighlight() {
  if (highlighted) {
    highlighted.emissive.setRGB(0, 0, 0);
    highlighted.emissiveIntensity = 1;
  }
  highlighted = selection ? mats.materialFor(selection) : null;
  highlighted?.emissive.set('#4f86c6');
}
store.onChange(() => {
  const before = highlighted;
  refreshHighlight();
  if (highlighted !== before) highlightUntil = timer.getElapsed() + 1.2;
});

const down = new THREE.Vector2();
renderer.domElement.addEventListener('pointerdown', (e) => down.set(e.clientX, e.clientY));
renderer.domElement.addEventListener('pointerup', (e) => {
  if (mode === 'walk') {
    if (walk.controls.isLocked) select(pick(new THREE.Vector2(0, 0)));
    return;
  }
  if (down.distanceTo(new THREE.Vector2(e.clientX, e.clientY)) > 5) return;
  const rect = renderer.domElement.getBoundingClientRect();
  select(pick(new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)));
});
window.addEventListener('keydown', (e) => {
  if (e.code === 'Escape' && mode === 'orbit') select(null);
});

// ---- Panel
const panel = new Panel(document.getElementById('panel')!, store, {
  setMode,
  setCeilings: (on) => {
    showCeilings = on;
    applyVisibility();
  },
  setLabels: (on) => {
    showLabels = on;
    applyVisibility();
  },
  setCut: (h) => {
    cutHeight = h;
    applyVisibility();
  },
  setSun,
  view: setView,
  select,
});
applyVisibility();

// ---- Resize & loop
function resize() {
  const { clientWidth: w, clientHeight: h } = viewport;
  renderer.setSize(w, h);
  labelRenderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(viewport);
resize();

// Handle for debugging from the browser console / automated screenshots.
Object.assign(window, { apartment3d: { scene, camera, orbit, setMode, setView, select, store } });

renderer.setAnimationLoop((time) => {
  timer.update(time);
  if (mode === 'orbit') orbit.update();
  else walk.update(timer.getDelta());
  if (highlighted) {
    const left = highlightUntil - timer.getElapsed();
    highlighted.emissiveIntensity = left > 0 ? 0.35 * Math.abs(Math.sin(left * 4)) : 0;
  }
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
});

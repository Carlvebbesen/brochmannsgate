import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { buildApartment, updateObstacle } from './build';
import { setPose } from './build/furniture';
import { WalkController } from './controls/walk';
import { MaterialRegistry } from './core/materials';
import { Remote, isNewRemote, rememberSeen, type SyncStatus } from './core/remote';
import { ColorStore } from './core/state';
import { sunDirection } from './core/sun';
import { loadVinyl } from './core/vinyl';
import { toWorld } from './core/geom';
import { center, rooms, walkStart } from './data/apartment';
import { furnitureDefaults } from './data/furniture';
import { defaultColors } from './data/palette';
import { Panel, type Mode, type Selection } from './ui/panel';
import { Plan2D, PLAN_SVG_CSS } from './ui/plan2d';
import { ElectricalPanel, newItem } from './ui/electrical';

const viewport = document.getElementById('viewport')!;
const walkHint = document.getElementById('walk-hint')!;
const planHost = document.getElementById('plan')!;
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
const store = new ColorStore(defaultColors, furnitureDefaults);
const mats = new MaterialRegistry(store, loadVinyl(renderer.capabilities.getMaxAnisotropy()));
const apartment = buildApartment(mats);
scene.add(apartment.root);

// ---- Furniture: positioned from the store (defaults, then any saved drag), kept in sync with it
function applyFurniturePoses(onlyId?: string) {
  for (const item of apartment.furniture) {
    if (onlyId && item.id !== onlyId) continue;
    setPose(item.group, store.getPose(item.id));
    if (item.obstacle) updateObstacle(item.obstacle, item);
  }
}
applyFurniturePoses();
store.onChange((c) => {
  if (c.type === 'furniture') applyFurniturePoses(c.id);
  else if (c.type === 'all') applyFurniturePoses();
});

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
const dimensionObjects = apartment.dimensions;

// ---- Lights
const timer = new THREE.Timer();
// Soft, directional fill from a generic interior (image-based lighting), instead of a flat ambient light.
// It also gives the lacquered floor its faint reflections.
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.4;
const hemi = new THREE.HemisphereLight('#f2f5fb', '#d8d2c4', 0.2);
scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff4e0', 2.5);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.radius = 4;
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
  const daylight = THREE.MathUtils.clamp(Math.sin(altitude) * 2, 0, 1);
  // Tuned against screenshots: stronger fill washes out the sun patches and the floor.
  hemi.intensity = 0.1 + 0.15 * daylight;
  scene.environmentIntensity = 0.2 + 0.3 * daylight;
}
setSun(store.view.sun);

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
const clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
const savedOrbit = { pos: new THREE.Vector3(), target: new THREE.Vector3() };

function applyVisibility() {
  const { ceilings, labels, cut, dimensions } = store.view;
  apartment.ceilings.visible = mode === 'walk' || ceilings;
  labelObjects.forEach((o) => (o.visible = mode === 'orbit' && labels));
  dimensionObjects.forEach((o) => (o.visible = mode === 'orbit' && dimensions));
  if (mode === 'orbit' && cut !== null) {
    clipPlane.constant = cut;
    renderer.clippingPlanes = [clipPlane];
  } else {
    renderer.clippingPlanes = [];
  }
}

function setMode(next: Mode) {
  if (next === mode) return;
  // The el-plan is a flat 2D sheet drawn over the scene; the 3D view keeps its camera underneath.
  const toPlan = next === 'plan';
  planHost.hidden = !toPlan;
  renderer.domElement.style.visibility = toPlan ? 'hidden' : '';
  labelRenderer.domElement.style.visibility = toPlan ? 'hidden' : '';
  if (toPlan) {
    walk.enabled = false;
    walk.controls.unlock();
    orbit.enabled = false;
    walkHint.hidden = true;
    crosshair.hidden = true;
    mode = next;
    panel.setMode(mode);
    plan.refresh(); // renders the 3D top view now, if that is the base
    return;
  }
  if (mode === 'plan') {
    selectPoint(null);
    setElEditing(false); // the el-plan always opens view-only
    orbit.enabled = true;
    mode = 'orbit';
    if (next === 'orbit') {
      panel.setMode(mode);
      return;
    }
  }
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
  setMoveFurniture(moveFurniture);
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
    const cut = store.view.cut;
    if (mode === 'orbit' && cut !== null && hit.point.y > cut) continue;
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
store.onChange((c) => {
  if (c.type === 'view' || c.type === 'all') {
    applyVisibility();
    setSun(store.view.sun);
  }
  if (c.type === 'all') panel.setViewSettings(store.view);
  const before = highlighted;
  refreshHighlight();
  if (highlighted !== before) highlightUntil = timer.getElapsed() + 1.2;
});

function ndcFromEvent(e: PointerEvent): THREE.Vector2 {
  const rect = renderer.domElement.getBoundingClientRect();
  return new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
}

// ---- Dragging movable furniture (dollhouse view only): click-drag translates it across the floor.
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const APARTMENT_BOUNDS = rooms.reduce(
  (b, r) => {
    for (const [x, y] of r.polygon) {
      b.x0 = Math.min(b.x0, x);
      b.x1 = Math.max(b.x1, x);
      b.y0 = Math.min(b.y0, y);
      b.y1 = Math.max(b.y1, y);
    }
    return b;
  },
  { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity },
);

function furnitureAt(ndc: THREE.Vector2): (typeof apartment.furniture)[number] | null {
  raycaster.setFromCamera(ndc, camera);
  for (const hit of raycaster.intersectObject(apartment.root, true)) {
    if (!isShown(hit.object)) continue;
    let o: THREE.Object3D | null = hit.object;
    while (o) {
      const id = o.userData.furnitureId as string | undefined;
      if (id) return apartment.furniture.find((f) => f.id === id) ?? null;
      o = o.parent;
    }
    return null; // the nearest hit isn't furniture – don't drag through it
  }
  return null;
}

function groundHit(ndc: THREE.Vector2): THREE.Vector3 | null {
  raycaster.setFromCamera(ndc, camera);
  return raycaster.ray.intersectPlane(groundPlane, new THREE.Vector3());
}

let drag: { item: (typeof apartment.furniture)[number]; offset: THREE.Vector3; moved: boolean } | null = null;
/** Off by default: dragging never nudges furniture until the owner turns this on (panel: "Move furniture"). */
let moveFurniture = false;
function setMoveFurniture(on: boolean) {
  moveFurniture = on;
  renderer.domElement.style.cursor = on && mode === 'orbit' ? 'grab' : '';
}

const down = new THREE.Vector2();
renderer.domElement.addEventListener('pointerdown', (e) => {
  down.set(e.clientX, e.clientY);
  if (mode !== 'orbit' || e.button !== 0 || !moveFurniture) return;
  const item = furnitureAt(ndcFromEvent(e));
  const hit = item && groundHit(ndcFromEvent(e));
  if (!item || !hit) return;
  orbit.enabled = false;
  renderer.domElement.style.cursor = 'grabbing';
  drag = { item, offset: item.group.position.clone().sub(hit), moved: false };
});
window.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const hit = groundHit(ndcFromEvent(e));
  if (!hit) return;
  const target = hit.add(drag.offset);
  const { w, d } = drag.item.footprint;
  const x = THREE.MathUtils.clamp(target.x, APARTMENT_BOUNDS.x0 + w / 2, APARTMENT_BOUNDS.x1 - w / 2);
  const y = THREE.MathUtils.clamp(-target.z, APARTMENT_BOUNDS.y0 + d / 2, APARTMENT_BOUNDS.y1 - d / 2);
  drag.item.group.position.set(x, 0, -y);
  if (drag.item.obstacle) updateObstacle(drag.item.obstacle, drag.item);
  drag.moved = true;
});
window.addEventListener('pointerup', (e) => {
  if (drag) {
    const { item, moved } = drag;
    drag = null;
    orbit.enabled = true;
    renderer.domElement.style.cursor = moveFurniture && mode === 'orbit' ? 'grab' : '';
    if (moved) {
      store.setPose(item.id, { x: item.group.position.x, y: -item.group.position.z, yaw: item.group.rotation.y });
      return;
    }
  }
  if (mode === 'walk') {
    if (walk.controls.isLocked) select(pick(new THREE.Vector2(0, 0)));
    return;
  }
  if (down.distanceTo(new THREE.Vector2(e.clientX, e.clientY)) > 5) return;
  select(pick(ndcFromEvent(e)));
});
window.addEventListener('keydown', (e) => {
  if (e.code === 'Escape' && mode === 'orbit') select(null);
});

// ---- Render quality (per browser, not shared): ambient occlusion and a sharper sun shadow map
const QUALITY_KEY = 'leilighet-3d:quality';
let highQuality = true;
try {
  highQuality = localStorage.getItem(QUALITY_KEY) !== 'low';
} catch {
  // storage unavailable – default to high
}

const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }));
composer.addPass(new RenderPass(scene, camera));
const gtao = new GTAOPass(scene, camera);
// Radius in metres: enough to darken room corners, skirting lines and the gap under cabinets.
gtao.updateGtaoMaterial({ radius: 0.5, distanceExponent: 1, thickness: 1, scale: 1, samples: 16, distanceFallOff: 1, screenSpaceRadius: false });
composer.addPass(gtao);
composer.addPass(new OutputPass());

function setQuality(high: boolean) {
  highQuality = high;
  const size = high ? 4096 : 2048;
  if (sun.shadow.mapSize.x !== size) {
    sun.shadow.mapSize.set(size, size);
    sun.shadow.map?.dispose();
    sun.shadow.map = null;
  }
  try {
    localStorage.setItem(QUALITY_KEY, high ? 'high' : 'low');
  } catch {
    // ignore
  }
}
setQuality(highQuality);

// ---- Panel
const panel = new Panel(document.getElementById('panel')!, store, {
  setMode,
  setMoveFurniture,
  setCeilings: (ceilings) => store.setView({ ceilings }),
  setLabels: (labels) => store.setView({ labels }),
  setDimensions: (dimensions) => store.setView({ dimensions }),
  setCut: (cut) => store.setView({ cut }),
  setSun: (sun) => store.setView({ sun }),
  setVinyl: (vinyl) => store.setView({ vinyl }),
  setQuality,
  view: setView,
  select,
  login: async (password) => {
    const res = await remote.login(password);
    if (res.ok) {
      showSync('saved');
      // Unlocking publishes what this browser shows, so any local experiments become the shared version.
      remote.queueSave(store.toJSON());
    }
    return res;
  },
  logout: async () => {
    await remote.logout();
    showSync('idle');
  },
});
panel.setViewSettings(store.view);
panel.setQuality(highQuality);
applyVisibility();

// ---- El-plan (2D top view for the electrical work)
let pointSelection: string | null = null;
const plan = new Plan2D(planHost, store, {
  select: (id) => selectPoint(id),
  place: (type, x, y) => {
    const item = newItem(type, x, y);
    store.addElectrical(item);
    selectPoint(item.id);
  },
  renderModel: renderTopView,
});
const electrical = new ElectricalPanel(document.getElementById('electrical')!, store, {
  setTool: (type) => plan.setTool(type),
  setEditing: (on) => setElEditing(on),
  select: (id) => selectPoint(id),
  fit: () => plan.fit(),
  print: () => printPlan(),
  exportPng: () => exportPlanPng(),
});

function setElEditing(on: boolean) {
  plan.setEditing(on);
  electrical.setEditing(on);
}

/**
 * The 3D model seen straight down with an orthographic camera framed on `rect` (plan metres), so
 * it lines up exactly with the el-plan's coordinates. Ceilings are hidden, as in the dollhouse
 * top view. Returns a JPEG data URL (it is embedded in prints and PNG exports too).
 */
function renderTopView(rect: { x0: number; x1: number; y0: number; y1: number }, ppm: number): string {
  const w = Math.round((rect.x1 - rect.x0) * ppm);
  const h = Math.round((rect.y1 - rect.y0) * ppm);
  // Camera space: right = +x (east), up = -z (north), so the frustum is simply the plan rectangle.
  const cam = new THREE.OrthographicCamera(rect.x0, rect.x1, rect.y1, rect.y0, 0.1, 60);
  cam.position.set(0, 30, 0);
  cam.up.set(0, 0, -1);
  cam.lookAt(0, 0, 0);
  const ceilings = apartment.ceilings.visible;
  const clipping = renderer.clippingPlanes;
  apartment.ceilings.visible = false;
  renderer.clippingPlanes = [];
  const ratio = renderer.getPixelRatio();
  renderer.setPixelRatio(1);
  renderer.setSize(w, h, false);
  renderer.render(scene, cam);
  const url = renderer.domElement.toDataURL('image/jpeg', 0.88);
  apartment.ceilings.visible = ceilings;
  renderer.clippingPlanes = clipping;
  renderer.setPixelRatio(ratio);
  resize();
  return url;
}

function selectPoint(id: string | null) {
  pointSelection = id;
  plan.setSelected(id);
  electrical.showSelection(id);
}

store.onChange((c) => {
  // Anything that changes how the model looks makes the 3D top view stale.
  if (c.type !== 'electrical' && (c.type !== 'view' || mode !== 'plan')) plan.invalidateModel();
  if (c.type === 'electrical' || c.type === 'all' || (c.type === 'view' && mode === 'plan')) plan.refresh();
  if (c.type === 'electrical' && pointSelection && !store.electrical.some((i) => i.id === pointSelection)) selectPoint(null);
});

window.addEventListener('keydown', (e) => {
  if (mode !== 'plan') return;
  const typing = (e.target as HTMLElement | null)?.closest('input, select, textarea');
  if (e.code === 'Escape') {
    electrical.setTool(null);
    selectPoint(null);
  } else if (e.code === 'KeyE' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
    setElEditing(!electrical.isEditing);
  } else if ((e.key === 'Delete' || e.key === 'Backspace') && pointSelection && !typing && electrical.isEditing) {
    e.preventDefault();
    store.removeElectrical(pointSelection);
    selectPoint(null);
  }
});

function planSheet(): string {
  return plan.toSVG();
}

function printPlan() {
  const win = window.open('', '_blank');
  if (!win) {
    alert('The print window was blocked. Allow pop-ups for this page, or use PNG instead.');
    return;
  }
  win.document.write(
    `<!doctype html><html><head><title>El-plan – Brochmanns gate 14C</title><style>@page{size:A3 landscape;margin:8mm}html,body{margin:0}svg{width:100%;height:auto}${PLAN_SVG_CSS}</style></head><body>${planSheet()}</body></html>`,
  );
  win.document.close();
  win.addEventListener('load', () => win.print());
}

function exportPlanPng() {
  const svg = planSheet();
  const img = new Image();
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  img.onload = () => {
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'el-plan.png';
      a.click();
      URL.revokeObjectURL(a.href);
    });
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    alert('Could not render the plan as PNG – use Print instead.');
  };
  img.src = url;
}

// ---- Shared settings (Cloudflare KV via worker/index.ts)
const remote = new Remote();
function showSync(status: SyncStatus, message?: string) {
  panel.showSync({ available: remote.available, editable: remote.editable, status, message });
}
remote.onStatus = showSync;
store.onPersist = (file) => remote.queueSave(file);
remote.load().then(({ settings }) => {
  // A newer shared version replaces this browser's local experiments; otherwise keep them.
  if (settings && isNewRemote(settings.savedAt)) {
    store.applyRemote(settings);
    rememberSeen(settings.savedAt);
  }
  if (remote.available) showSync('saved');
});

// ---- Resize & loop
function resize() {
  const { clientWidth: w, clientHeight: h } = viewport;
  renderer.setSize(w, h);
  composer.setSize(w, h);
  labelRenderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(viewport);
resize();

// Handle for debugging from the browser console / automated screenshots.
Object.assign(window, { apartment3d: { scene, camera, orbit, setMode, setView, select, store, remote, renderer, gtao, setQuality, plan, selectPoint } });

renderer.setAnimationLoop((time) => {
  timer.update(time);
  if (mode === 'plan') return; // the canvas is hidden under the flat sheet
  if (mode === 'orbit') orbit.update();
  else walk.update(timer.getDelta());
  if (highlighted) {
    const left = highlightUntil - timer.getElapsed();
    highlighted.emissiveIntensity = left > 0 ? 0.35 * Math.abs(Math.sin(left * 4)) : 0;
  }
  if (highQuality) composer.render();
  else renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
});

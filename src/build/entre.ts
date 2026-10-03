import * as THREE from 'three';
import { toWorld } from '../core/geom';
import { entryWall as E, laundryBaskets as L } from '../data/furniture';
import type { Rect } from '../data/types';
import type { BuildContext } from './context';

const rect = (x0: number, x1: number, y0: number, y1: number): Rect => ({ x0, x1, y0, y1 });

/**
 * Wall-mounted pieces in the entry (fixed, not draggable): on the coat-hook wall the Allsarp knaggrekke and the
 * Norrgavel hat shelf on two consoles above it (the Bäckebo shoe bench below is movable furniture), and the three
 * ReCollector laundry baskets on the corridor's kommodevegg.
 */
export function buildEntryWall(ctx: BuildContext) {
  buildHookRail(ctx);
  buildHatShelf(ctx);
  buildLaundryBaskets(ctx);
}

/** Turns a box's wood grain 90° (the grain map runs along u), so it runs up the tall faces and across the top. */
function crossGrain(mesh: THREE.Mesh) {
  const uv = mesh.geometry.getAttribute('uv') as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i), uv.getX(i));
  uv.needsUpdate = true;
}

/**
 * ReCollector Smart Wall-Mounted Laundry Basket ×3, Nordic Oak (product photos): a plain oak box — top and bottom
 * over the full width, sides between, thin back — hung flush on the wall and closed by a full tilt-out flap that sits
 * flush in the front with a hairline gap all round. No handle: it opens with a push latch. Shown closed, so the
 * linen bag on its rod inside is not modelled. Front faces -x (west, into the corridor).
 */
function buildLaundryBaskets(ctx: BuildContext) {
  const key = 'furniture.laundryBasket';
  const { x: wall, width: w, height, depth, z0, panel: t, back, gap, count } = L;
  const front = wall - depth;
  const z1 = z0 + height;
  const y0 = L.cy - (count * w) / 2;
  const part = (r: Rect, za: number, zb: number) => crossGrain(ctx.box(key, r, za, zb, { rounded: 0.0015 }));
  const skin = 0.003; // the flap's visible front; the dark block behind it makes the hairline gap read as a shadow

  for (let i = 0; i < count; i++) {
    const a = y0 + i * w;
    const b = a + w;
    part(rect(front, wall, a, b), z1 - t, z1);
    part(rect(front, wall, a, b), z0, z0 + t);
    part(rect(front, wall, a, a + t), z0 + t, z1 - t);
    part(rect(front, wall, b - t, b), z0 + t, z1 - t);
    part(rect(wall - back, wall, a + t, b - t), z0 + t, z1 - t);
    ctx.box('shadowGap', rect(front + skin, front + t, a + t, b - t), z0 + t, z1 - t);
    crossGrain(ctx.box(key, rect(front, front + skin, a + t + gap, b - t - gap), z0 + t + gap, z1 - t - gap));
  }
  ctx.obstacles.push(rect(front, wall, y0, y0 + count * w));
}

/** 1898 Allsarp: a round oak rod with nine short round pegs, screwed flat to the wall. */
function buildHookRail(ctx: BuildContext) {
  const key = 'furniture.hookRail';
  const { length, depth, rodR, pegR, count, endInset, z } = E.hooks;
  const rodY = E.y + rodR;
  ctx.cylinder(key, [E.cx, rodY], z, rodR, length, 'x');
  const pegLen = depth - rodR; // from the rod's centre to the 6 cm total depth
  const x0 = E.cx - length / 2 + endInset;
  const step = (length - 2 * endInset) / (count - 1);
  for (let i = 0; i < count; i++) {
    ctx.cylinder(key, [x0 + i * step, rodY + pegLen / 2], z + rodR * 0.3, pegR, pegLen, 'y');
  }
}

/** Norrgavel Hyllplan Rundat 90 cm (oak, rounded front corners) on two wooden consoles. */
function buildHatShelf(ctx: BuildContext) {
  const key = 'furniture.hatShelf';
  const { length, depth, thickness, top, consoleDepth, consoleH, consoleInset } = E.shelf;
  const bottom = top - thickness;
  ctx.box(key, rect(E.cx - length / 2, E.cx + length / 2, E.y, E.y + depth), bottom, top, { rounded: 0.006 });

  // Console profile in (depth out from the wall, height): a solid L with a concave quarter curve underneath.
  const t = 0.025;
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(0, consoleH);
  shape.lineTo(consoleDepth, consoleH);
  shape.lineTo(consoleDepth, consoleH - t);
  shape.absellipse(consoleDepth, 0, consoleDepth - t, consoleH - t, Math.PI / 2, Math.PI, false);
  shape.lineTo(0, 0);
  const width = 0.022;
  const geo = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false, curveSegments: 16 });
  // Shape x → plan +y (out of the wall), shape y → up, extrusion → plan x.
  geo.rotateY(Math.PI / 2);
  geo.translate(-width / 2, 0, 0);
  for (const sx of [-1, 1]) {
    const mesh = new THREE.Mesh(geo, ctx.mats.get(key));
    mesh.position.copy(toWorld(E.cx + sx * (length / 2 - consoleInset), E.y, bottom - consoleH));
    ctx.finish(mesh, key, {});
  }
}

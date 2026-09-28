import * as THREE from 'three';
import { toWorld } from '../core/geom';
import { entryWall as E } from '../data/furniture';
import type { Rect } from '../data/types';
import type { BuildContext } from './context';

const rect = (x0: number, x1: number, y0: number, y1: number): Rect => ({ x0, x1, y0, y1 });

/**
 * Wall-mounted pieces on the entry's coat-hook wall (fixed, not draggable): the Allsarp knaggrekke and the
 * Norrgavel hat shelf on two consoles above it. The Bäckebo shoe bench below is movable furniture.
 */
export function buildEntryWall(ctx: BuildContext) {
  buildHookRail(ctx);
  buildHatShelf(ctx);
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

/** Norrgavel Hyllplan Rundat 90 cm (birch, rounded front corners) on two wooden consoles. */
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

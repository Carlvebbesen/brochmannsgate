import { CEILING } from '../data/apartment';
import { kontorMillwork as M, tv } from '../data/furniture';
import type { Rect } from '../data/types';
import type { BuildContext } from './context';

const rect = (x0: number, x1: number, y0: number, y1: number): Rect => ({ x0, x1, y0, y1 });

/**
 * Fixed built-ins in Kontor (never move, unlike the furniture in `furniture.ts`):
 * a 6-door Pax wardrobe facing Hovedsoverom, a 4-door wardrobe + legless desk on the opposite wall,
 * and the wall-mounted TV in Tvstue (on the same wall, seen from the other side).
 */
export function buildKontorMillwork(ctx: BuildContext) {
  buildPax(ctx);
  buildOppositeWall(ctx);
  buildTv(ctx);
}

/** North wall (B12): 6 doors × 0.5 m up to 2.36 m, filled to the ceiling with matching wood above. */
function buildPax(ctx: BuildContext) {
  const { pax, depth, doorTop, ceiling } = M;
  const x0 = pax.x0;
  const x1 = x0 + pax.doorCount * pax.doorWidth;
  const y1 = pax.y1;
  const y0 = y1 - depth;
  ctx.box('kontor.wardrobe', rect(x0, x1, y0, y1), 0, doorTop);
  ctx.box('kontor.wardrobe', rect(x0, x1, y0, y1), doorTop, ceiling);
  for (let i = 1; i < pax.doorCount; i++) {
    const x = x0 + i * pax.doorWidth;
    ctx.box('shadowGap', rect(x - 0.006, x + 0.006, y0 - 0.002, y0 + 0.001), 0.03, doorTop - 0.03);
  }
}

/** South wall (B23): a 100+75 cm wardrobe (4 doors), then a floating legless desk to the corner. */
function buildOppositeWall(ctx: BuildContext) {
  const { opposite, depth, doorTop } = M;
  const y0 = opposite.y0;
  const y1 = y0 + depth;
  const wardrobeX1 = opposite.x0 + opposite.wardrobeWidth;

  ctx.box('kontor.wardrobe', rect(opposite.x0, wardrobeX1, y0, y1), 0, doorTop);
  ctx.box('kontor.wardrobe', rect(opposite.x0, wardrobeX1, y0, y1), doorTop, CEILING);
  let x = opposite.x0;
  for (const width of opposite.doorWidths.slice(0, -1)) {
    x += width;
    ctx.box('shadowGap', rect(x - 0.006, x + 0.006, y1 - 0.001, y1 + 0.002), 0.03, doorTop - 0.03);
  }

  ctx.box(
    'kontor.wardrobe',
    rect(wardrobeX1, opposite.deskX1, y0, y1),
    opposite.deskTop - opposite.deskThickness,
    opposite.deskTop,
  );
}

/** Wall-mounted TV in Tvstue, on the same wall as the Pax/desk wall (seen from Tvstue's side). */
function buildTv(ctx: BuildContext) {
  const hw = tv.width / 2;
  const hh = (tv.z1 - tv.z0) / 2;
  const cz = (tv.z0 + tv.z1) / 2;
  ctx.box('tv.frame', rect(tv.x - hw - 0.02, tv.x + hw + 0.02, tv.y, tv.y + 0.02), cz - hh - 0.02, cz + hh + 0.02);
  ctx.box('tv.screen', rect(tv.x - hw, tv.x + hw, tv.y - tv.thickness, tv.y - tv.thickness + 0.02), tv.z0, tv.z1);
}

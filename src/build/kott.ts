import { CEILING, KOTT } from '../data/apartment';
import { kottFittings as F } from '../data/kott';
import type { Rect } from '../data/types';
import type { BuildContext } from './context';

const rect = (x0: number, x1: number, y0: number, y1: number): Rect => ({ x0, x1, y0, y1 });

const COATS = ['kott.coatCream', 'kott.coatGreen', 'kott.coatBlack', 'kott.coatBeige', 'kott.coatBlack'];
const SHOES = ['kott.shoeWhite', 'kott.shoeBlack', 'kott.shoeBrown', 'kott.shoeWhite', 'kott.shoeBlack', 'kott.shoeBrown', 'kott.shoeBlack', 'kott.shoeBrown', 'kott.shoeBlack'];

/**
 * Kott fittings (fixed): boxes on two shelves at the top, a coat rail, a low shoe rack at the back,
 * a stick vacuum and peg rail on the left (west) wall and wire baskets on the right (east) wall.
 */
export function buildKott(ctx: BuildContext) {
  buildUpperShelves(ctx);
  buildCoats(ctx);
  buildShoeRack(ctx);
  buildLeftWall(ctx);
  buildRightWall(ctx);
}

/** Two wall-to-wall oak shelves on side battens, each with two storage boxes. */
function buildUpperShelves(ctx: BuildContext) {
  const { depth, tops, boxH, boxW, boxD } = F.upperShelves;
  const y0 = KOTT.y1 - depth;
  const w = KOTT.x1 - KOTT.x0;
  for (const top of tops) {
    ctx.box('kott.shelves', rect(KOTT.x0, KOTT.x1, y0, KOTT.y1), top - F.board, top, { rounded: 0.003 });
    for (const x of [KOTT.x0, KOTT.x1 - 0.018]) {
      ctx.box('kott.shelves', rect(x, x + 0.018, y0 + 0.02, KOTT.y1), top - F.board - 0.03, top - F.board);
    }
    const gap = (w - 2 * boxW) / 3;
    for (let i = 0; i < 2; i++) {
      const bx = KOTT.x0 + gap + i * (boxW + gap);
      const by = KOTT.y1 - 0.02 - boxD;
      if (top + boxH > CEILING - 0.02) continue;
      ctx.box('kott.boxes', rect(bx, bx + boxW, by, by + boxD), top, top + boxH, { rounded: 0.008 });
      // lid seam
      ctx.box('shadowGap', rect(bx - 0.001, bx + boxW + 0.001, by - 0.001, by + boxD + 0.001), top + boxH - 0.035, top + boxH - 0.032);
    }
  }
}

/** Steel rail under the lower shelf with five coats on hangers. */
function buildCoats(ctx: BuildContext) {
  const { v, z, r } = F.rail;
  const y = KOTT.y1 - v;
  const w = KOTT.x1 - KOTT.x0;
  ctx.cylinder('steel', [(KOTT.x0 + KOTT.x1) / 2, y], z, r, w - 0.004, 'x');
  for (const x of [KOTT.x0 + 0.01, KOTT.x1 - 0.01]) ctx.cylinder('steel', [x, y], z, 0.025, 0.02, 'x');

  const { width, thickness, bottom, top, count } = F.coats;
  const step = (w - 0.1) / count;
  for (let i = 0; i < count; i++) {
    const cx = KOTT.x0 + 0.05 + step * (i + 0.5);
    const key = COATS[i % COATS.length];
    // Body, then narrower shoulders so it reads as a coat on a hanger.
    ctx.box(key, rect(cx - thickness / 2, cx + thickness / 2, y - width / 2, y + width / 2), bottom, top - 0.08, { rounded: 0.04 });
    ctx.box(key, rect(cx - thickness / 2 + 0.01, cx + thickness / 2 - 0.01, y - width / 2 + 0.04, y + width / 2 - 0.04), top - 0.12, top, { rounded: 0.04 });
    ctx.box('kott.shelves', rect(cx - 0.006, cx + 0.006, y - 0.2, y + 0.2), top - 0.01, top + 0.01);
    ctx.cylinder('steel', [cx, y], (top + z) / 2, 0.003, z - top, 'z');
  }
  ctx.obstacles.push(rect(KOTT.x0, KOTT.x1, y - width / 2, KOTT.y1));
}

/** Low shoe rack (three shelves) against the back wall, with a few pairs on each shelf. */
function buildShoeRack(ctx: BuildContext) {
  const { depth, shelves, sideTop } = F.shoeRack;
  const b = F.board;
  const y0 = KOTT.y1 - depth;
  const x0 = KOTT.x0 + 0.01;
  const x1 = KOTT.x1 - 0.01;
  for (const x of [x0, x1 - b]) ctx.box('kott.shelves', rect(x, x + b, y0, KOTT.y1), 0, sideTop);
  for (const top of shelves) ctx.box('kott.shelves', rect(x0 + b, x1 - b, y0, KOTT.y1), top - b, top);

  const pairW = 0.2;
  const pairs = 3;
  const gap = (x1 - x0 - 2 * b - pairs * pairW) / (pairs + 1);
  shelves.forEach((top, s) => {
    const next = shelves[s + 1] ?? sideTop + 0.2;
    const h = Math.min(0.12, next - top - 0.04);
    for (let p = 0; p < pairs; p++) {
      const px = x0 + b + gap + p * (pairW + gap);
      const key = SHOES[(s * pairs + p) % SHOES.length];
      for (const sx of [0, pairW / 2 + 0.005]) {
        const r = rect(px + sx, px + sx + pairW / 2 - 0.01, y0 + 0.02, y0 + 0.28);
        ctx.box(key, r, top, top + 0.03, { rounded: 0.012 });
        // heel/upper part at the back, toe low at the front
        ctx.box(key, rect(r.x0, r.x1, r.y0 + 0.1, r.y1), top, top + h, { rounded: 0.03 });
      }
    }
  });
}

/** Stick vacuum in its wall dock near the door, and a short oak peg rail further in. */
function buildLeftWall(ctx: BuildContext) {
  const { u, v, dockZ } = F.vacuum;
  const x = KOTT.x0 + u;
  const y = KOTT.y0 + v;
  ctx.box('kott.vacuum', rect(KOTT.x0, KOTT.x0 + 0.02, y - 0.04, y + 0.04), dockZ - 0.05, dockZ + 0.08);
  ctx.cylinder('kott.vacuum', [x, y], dockZ - 0.02, 0.045, 0.2, 'z'); // motor + bin
  ctx.cylinder('kott.vacuumAccent', [x, y], dockZ + 0.1, 0.047, 0.05, 'z');
  ctx.box('kott.vacuum', rect(x - 0.02, x + 0.02, y + 0.03, y + 0.08), dockZ - 0.02, dockZ + 0.12, { rounded: 0.01 }); // handle
  ctx.cylinder('kott.vacuumAccent', [x, y], (dockZ - 0.12 + 0.07) / 2, 0.017, dockZ - 0.12 - 0.07, 'z'); // wand
  ctx.box('kott.vacuum', rect(x - 0.05, x + 0.05, y - 0.11, y + 0.05), 0.005, 0.07, { rounded: 0.02 }); // floor head

  const { v0, v1, z, pegs } = F.pegRail;
  ctx.box('kott.shelves', rect(KOTT.x0, KOTT.x0 + 0.02, KOTT.y0 + v0, KOTT.y0 + v1), z - 0.035, z + 0.035, { rounded: 0.004 });
  for (let i = 0; i < pegs; i++) {
    const py = KOTT.y0 + v0 + ((i + 0.5) * (v1 - v0)) / pegs;
    ctx.cylinder('kott.shelves', [KOTT.x0 + 0.05, py], z, 0.008, 0.06, 'x');
  }
}

/** Three white wire baskets and a small shelf with cleaning bottles on the right wall. */
function buildRightWall(ctx: BuildContext) {
  const { v0, v1, depth, height, bottoms, shelfTop } = F.baskets;
  const x1 = KOTT.x1;
  const x0 = x1 - depth;
  const y0 = KOTT.y0 + v0;
  const y1 = KOTT.y0 + v1;
  const t = 0.005;
  for (const z of bottoms) {
    ctx.box('kott.baskets', rect(x0, x1, y0, y1), z, z + t);
    ctx.box('kott.baskets', rect(x0, x0 + t, y0, y1), z, z + height);
    for (const y of [y0, y1 - t]) ctx.box('kott.baskets', rect(x0, x1, y, y + t), z, z + height);
    // wire rungs on the front
    for (let i = 1; i < 6; i++) {
      const y = y0 + ((y1 - y0) * i) / 6;
      ctx.box('kott.baskets', rect(x0 - 0.002, x0 + 0.003, y - 0.002, y + 0.002), z, z + height);
    }
  }
  ctx.box('kott.baskets', rect(x0, x1, y0, y1), shelfTop - F.board, shelfTop, { rounded: 0.003 });
  const bottles: [number, number, string][] = [
    [0.08, 0.24, 'kott.bottleWhite'],
    [0.15, 0.2, 'kott.bottleGreen'],
    [0.22, 0.26, 'kott.bottleWhite'],
  ];
  for (const [v, h, key] of bottles) ctx.cylinder(key, [x1 - depth / 2, KOTT.y0 + v0 + v], shelfTop + h / 2, 0.03, h, 'z');
  ctx.cylinder('kott.bottleGreen', [x1 - depth / 2, (y0 + y1) / 2], bottoms[1] + 0.07, 0.028, 0.13, 'z');
}

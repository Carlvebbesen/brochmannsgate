import * as THREE from 'three';

/** Procedural bump maps (generated once, shared) that give wood and fabric surfaces a bit of real texture,
 * independent of whatever flat colour the owner picks for them. */

function canvasTexture(size: number, paint: (ctx: CanvasRenderingContext2D) => void, repeat: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  paint(canvas.getContext('2d')!);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

/** Fine horizontal wood-grain streaks. */
export function woodGrainMap(): THREE.CanvasTexture {
  return canvasTexture(
    256,
    (ctx) => {
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 900; i++) {
        const y = Math.random() * 256;
        const shade = 118 + Math.random() * 20;
        ctx.strokeStyle = `rgba(${shade},${shade},${shade},${0.25 + Math.random() * 0.25})`;
        ctx.lineWidth = 0.6 + Math.random() * 1.2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        let x = 0;
        while (x < 256) {
          x += 8 + Math.random() * 20;
          ctx.lineTo(x, y + (Math.random() - 0.5) * 3);
        }
        ctx.stroke();
      }
    },
    2,
  );
}

/** Fine woven-fabric noise for upholstery. */
export function fabricWeaveMap(): THREE.CanvasTexture {
  return canvasTexture(
    128,
    (ctx) => {
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, 128, 128);
      const img = ctx.getImageData(0, 0, 128, 128);
      for (let i = 0; i < img.data.length; i += 4) {
        const n = 128 + (Math.random() - 0.5) * 34;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = n;
        img.data[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    },
    6,
  );
}

/** Side of one cement tile in the entry, in metres (P: Lhådös Hope Gloucester, 15 × 15 cm). */
export const CEMENT_TILE = 0.15;

/**
 * Colour map for the entry's patterned tiles, after the owner's pick (Lhådös Hope Gloucester) and reference photo:
 * a grey ring with a pale-grey eight-petal flower in the middle of each tile, framed by a pale blue-grey quatrefoil,
 * and denim-blue C-scrolls in mirrored pairs along each edge plus a lobed cloud on each edge's midpoint, on an
 * off-white ground. Shapes on an edge are drawn whole and clipped, so the neighbouring tile completes them.
 * Floor UVs are plan metres, so one repeat = one tile; `origin` is the plan corner the tiles are laid out from.
 */
export function cementTileMap(origin: readonly [number, number]): THREE.CanvasTexture {
  const S = 512;
  const BLUE = '#7896c6';
  const PALE = '#cfd7df';
  const RING = '#a9abad';
  const PETAL = '#c6c8ca';
  const GROUND = '#f5f3ed';
  const tex = canvasTexture(
    S,
    (ctx) => {
      const disc = (x: number, y: number, r: number, fill: string) => {
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.arc(x * S, y * S, r * S, 0, Math.PI * 2);
        ctx.fill();
      };
      ctx.fillStyle = GROUND;
      ctx.fillRect(0, 0, S, S);

      // Pale quatrefoil behind the medallion, its lobes reaching towards the tile corners.
      for (let i = 0; i < 4; i++) {
        const a = Math.PI / 4 + (i * Math.PI) / 2;
        disc(0.5 + Math.cos(a) * 0.2, 0.5 + Math.sin(a) * 0.2, 0.2, PALE);
      }
      disc(0.5, 0.5, 0.34, PALE);

      // A thick C-scroll: an open ring with a round curl at each end, its gap facing `face` (radians).
      const scroll = (x: number, y: number, face: number) => {
        const r = 0.052 * S;
        ctx.save();
        ctx.translate(x * S, y * S);
        ctx.rotate(face);
        ctx.strokeStyle = BLUE;
        ctx.lineWidth = 0.044 * S;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0.95, Math.PI * 2 - 0.95);
        ctx.stroke();
        ctx.fillStyle = BLUE;
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.arc(Math.cos(0.95) * r * 1.05, s * Math.sin(0.95) * r * 1.05, 0.031 * S, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      };
      // Lobed blue cloud, centred on an edge midpoint; `along` is the edge direction.
      const cloud = (x: number, y: number, along: number) => {
        ctx.save();
        ctx.translate(x * S, y * S);
        ctx.rotate(along);
        ctx.fillStyle = BLUE;
        for (const [dx, dy, r] of [
          [0, 0, 0.06],
          [-0.068, 0, 0.042],
          [0.068, 0, 0.042],
          [0, -0.06, 0.04],
          [0, 0.06, 0.04],
        ]) {
          ctx.beginPath();
          ctx.arc(dx * S, dy * S, r * S, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      };

      // Each corner: a pale diamond on the corner itself, and two C-scrolls (one along each edge), their gaps
      // facing the edge so that, with the neighbour's mirror image, they read as "C Ↄ" pairs across the joint.
      for (const cx of [0, 1]) {
        for (const cy of [0, 1]) {
          const sx = cx ? -1 : 1; // direction into the tile
          const sy = cy ? -1 : 1;
          ctx.fillStyle = PALE;
          ctx.beginPath();
          ctx.moveTo(cx * S, (cy + sy * 0.09) * S);
          ctx.lineTo((cx + sx * 0.09) * S, cy * S);
          ctx.lineTo(cx * S, (cy - sy * 0.09) * S);
          ctx.lineTo((cx - sx * 0.09) * S, cy * S);
          ctx.fill();
          disc(cx, cy, 0.025, BLUE);
          // along the horizontal edge (y = cy): sits just inside, gap facing the edge
          scroll(cx + sx * 0.2, cy + sy * 0.082, sy > 0 ? -Math.PI / 2 : Math.PI / 2);
          // along the vertical edge (x = cx)
          scroll(cx + sx * 0.082, cy + sy * 0.2, sx > 0 ? Math.PI : 0);
        }
      }
      cloud(0.5, 0, 0);
      cloud(0.5, 1, 0);
      cloud(0, 0.5, Math.PI / 2);
      cloud(1, 0.5, Math.PI / 2);

      // Medallion: off-white disc, a grey ring, and a pale-grey pointed eight-petal flower.
      disc(0.5, 0.5, 0.29, GROUND);
      ctx.strokeStyle = RING;
      ctx.lineWidth = 0.028 * S;
      ctx.beginPath();
      ctx.arc(0.5 * S, 0.5 * S, 0.258 * S, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = PETAL;
      const c = S / 2;
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        const tip = 0.2 * S;
        const w = 0.055 * S;
        ctx.save();
        ctx.translate(c, c);
        ctx.rotate(a);
        ctx.beginPath();
        ctx.moveTo(0.02 * S, 0);
        ctx.quadraticCurveTo(0.1 * S, -w, tip, 0);
        ctx.quadraticCurveTo(0.1 * S, w, 0.02 * S, 0);
        ctx.fill();
        ctx.restore();
      }
      disc(0.5, 0.5, 0.018, RING);

      // grout
      ctx.strokeStyle = '#dcd8d0';
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 0, S, S);
    },
    1 / CEMENT_TILE,
  );
  tex.colorSpace = THREE.SRGBColorSpace;
  const frac = (v: number) => v - Math.floor(v);
  tex.offset.set(frac(-origin[0] / CEMENT_TILE), frac(-origin[1] / CEMENT_TILE));
  tex.anisotropy = 8;
  return tex;
}

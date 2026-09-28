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

/** Side of one cement tile in the entry, in metres (E: classic 20 × 20 cm, matching the owner's reference photo). */
export const CEMENT_TILE = 0.2;

/**
 * Colour map for the entry's patterned cement tiles (owner's reference photo): a grey medallion with a white
 * rosette in each tile, blue scroll crosses where four tiles meet, on an off-white ground. Floor UVs are plan
 * metres, so one repeat = one tile; `origin` is the plan corner the tiles are laid out from.
 */
export function cementTileMap(origin: readonly [number, number]): THREE.CanvasTexture {
  const S = 512;
  const BLUE = '#7090c8';
  const GREY = '#b9bcc1';
  const GROUND = '#f2f0eb';
  const tex = canvasTexture(
    S,
    (ctx) => {
      ctx.fillStyle = GROUND;
      ctx.fillRect(0, 0, S, S);

      // Blue scroll cross, centred on each tile corner (clipped by the canvas, so neighbours complete it).
      const cross = (cx: number, cy: number) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.fillStyle = BLUE;
        for (let i = 0; i < 4; i++) {
          ctx.save();
          ctx.rotate((i * Math.PI) / 2);
          // arm along the tile edge: a tapering lobe
          ctx.beginPath();
          ctx.moveTo(0, -0.05 * S);
          ctx.quadraticCurveTo(0.2 * S, -0.07 * S, 0.3 * S, 0);
          ctx.quadraticCurveTo(0.2 * S, 0.07 * S, 0, 0.05 * S);
          ctx.fill();
          // a pair of C-scrolls curling off the arm towards the medallions
          for (const side of [-1, 1]) {
            ctx.beginPath();
            ctx.arc(0.19 * S, side * 0.1 * S, 0.045 * S, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = GROUND;
            ctx.beginPath();
            ctx.arc(0.2 * S, side * 0.11 * S, 0.022 * S, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = BLUE;
          }
          ctx.restore();
        }
        // diamond at the corner itself
        ctx.beginPath();
        ctx.moveTo(0, -0.09 * S);
        ctx.lineTo(0.09 * S, 0);
        ctx.lineTo(0, 0.09 * S);
        ctx.lineTo(-0.09 * S, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = GROUND;
        ctx.beginPath();
        ctx.arc(0, 0, 0.03 * S, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };
      for (const cx of [0, S]) for (const cy of [0, S]) cross(cx, cy);

      // Grey medallion with a white eight-petal rosette in the middle of the tile.
      const c = S / 2;
      ctx.fillStyle = GREY;
      ctx.beginPath();
      ctx.arc(c, c, 0.27 * S, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = GROUND;
      ctx.beginPath();
      ctx.arc(c, c, 0.235 * S, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = GREY;
      ctx.beginPath();
      ctx.arc(c, c, 0.2 * S, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = GROUND;
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        ctx.beginPath();
        ctx.ellipse(c + Math.cos(a) * 0.1 * S, c + Math.sin(a) * 0.1 * S, 0.085 * S, 0.035 * S, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = GREY;
      ctx.beginPath();
      ctx.arc(c, c, 0.04 * S, 0, Math.PI * 2);
      ctx.fill();
      // small blue dots between the petals' tips and the ring
      ctx.fillStyle = BLUE;
      for (let i = 0; i < 8; i++) {
        const a = ((i + 0.5) * Math.PI) / 4;
        ctx.beginPath();
        ctx.arc(c + Math.cos(a) * 0.215 * S, c + Math.sin(a) * 0.215 * S, 0.012 * S, 0, Math.PI * 2);
        ctx.fill();
      }

      // grout
      ctx.strokeStyle = '#d9d6cf';
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

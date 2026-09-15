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

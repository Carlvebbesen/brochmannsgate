"""
Builds the tileable vinyl-floor textures (Bastion vinylgulv 1-stav Furu) from the manufacturer's flat swatch.

    python3 scripts/floor-texture.py

Output in public/textures/: vinyl-color.webp, vinyl-normal.webp, vinyl-rough.webp.
One tile is 2 plank lengths × 8 rows = 3.656 × 1.76 m, with the grain along the image width. Rows are staggered at random
(at least 30 cm between neighbouring end joints), and each plank is a random strip of the swatch, flipped at random.
Every plank has a bevel (fas) on all four edges. Keep the tile size in sync with VINYL in src/core/vinyl.ts.
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'plan/images/floor/bastion-furu-swatch.jpg'
OUT = ROOT / 'public/textures'

PLANK_L, PLANK_W = 1.828, 0.220  # m, from parkett.no
COLS, ROWS = 2, 8
W, H = 4096, 2048
PLANK_PX, ROW_PX = W // COLS, H // ROWS
PX_PER_MM = PLANK_PX / (PLANK_L * 1000)
MIN_STAGGER = round(300 * PX_PER_MM)  # installation rule: end joints ≥ 30 cm apart
BEVEL_PX = 2.0 * PX_PER_MM  # visible bevel width on each side of a joint
BEVEL_DEPTH_PX = 0.9  # in pixel units, for the normal map slope

rng = np.random.default_rng(1414)


def ring_dist(a: int, b: int) -> int:
    d = abs(a - b) % PLANK_PX
    return min(d, PLANK_PX - d)


def stagger() -> list[int]:
    """Row offsets of the end joints; neighbours (including last → first, since the tile wraps) differ by ≥ 30 cm."""
    while True:
        offs = [int(rng.integers(0, PLANK_PX)) for _ in range(ROWS)]
        near = all(ring_dist(offs[i], offs[(i + 1) % ROWS]) >= MIN_STAGGER for i in range(ROWS))
        # avoid the "H" look where every second row lines up
        far = all(ring_dist(offs[i], offs[(i + 2) % ROWS]) >= MIN_STAGGER // 2 for i in range(ROWS))
        if near and far:
            return offs


src = Image.open(SRC).convert('RGB')
src = src.crop((4, 4, src.width - 4, src.height - 4))  # drop any edge artefacts from the JPEG
strip_h = round(src.width * PLANK_W / PLANK_L)  # a plank's aspect ratio, cut from the swatch's full width

color = np.zeros((H, W, 3), np.float32)
offsets = stagger()
for r, off in enumerate(offsets):
    for c in range(COLS):
        y = int(rng.integers(0, src.height - strip_h + 1))
        plank = src.crop((0, y, src.width, y + strip_h))
        if rng.random() < 0.5:
            plank = plank.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        if rng.random() < 0.5:
            plank = plank.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
        px = np.asarray(plank.resize((PLANK_PX, ROW_PX), Image.Resampling.LANCZOS), np.float32) / 255
        px *= 1 + rng.normal(0, 0.025)  # plank-to-plank brightness
        px *= 1 + rng.normal(0, 0.008, 3)  # and a faint hue shift
        x0 = (off + c * PLANK_PX) % W
        cols = (np.arange(PLANK_PX) + x0) % W
        color[r * ROW_PX:(r + 1) * ROW_PX, cols] = px

# Distance (px) from each pixel to the nearest joint → bevel profile 0 (joint) … 1 (flat top).
yy = np.arange(H)[:, None] % ROW_PX + 0.5
dy = np.minimum(yy, ROW_PX - yy)
xx = np.arange(W)[None, :]
dx = np.full((H, W), np.inf, np.float32)
for r, off in enumerate(offsets):
    rows = slice(r * ROW_PX, (r + 1) * ROW_PX)
    for c in range(COLS):
        seam = (off + c * PLANK_PX) % W
        d = np.abs((xx - seam + W / 2) % W - W / 2) + 0.5
        dx[rows] = np.minimum(dx[rows], d)
bevel = np.clip(np.minimum(dx, dy) / BEVEL_PX, 0, 1)
smooth = bevel * bevel * (3 - 2 * bevel)

# Colour: a darker line in the joint (shadow + dirt line), fading over the bevel.
color *= (0.70 + 0.30 * smooth)[..., None]
color = np.clip(color, 0, 1)

# Height: the bevel slope plus a faint grain relief from the swatch's luminance (dark grain lines sit slightly lower).
lum = color @ np.array([0.2126, 0.7152, 0.0722], np.float32)
lum_img = Image.fromarray((lum * 255).astype(np.uint8))
fine = np.asarray(lum_img.filter(ImageFilter.GaussianBlur(0.8)), np.float32) / 255
coarse = np.asarray(lum_img.filter(ImageFilter.GaussianBlur(6)), np.float32) / 255
height = bevel * BEVEL_DEPTH_PX + (fine - coarse) * 1.5

# Tangent-space normals (OpenGL convention, as three.js expects). Image rows run down, UV v runs up.
gx = (np.roll(height, -1, 1) - np.roll(height, 1, 1)) / 2
gy = (np.roll(height, -1, 0) - np.roll(height, 1, 0)) / 2
n = np.stack([-gx, gy, np.ones_like(gx)], -1)
n /= np.linalg.norm(n, axis=-1, keepdims=True)
normal = (n * 0.5 + 0.5) * 255

# Roughness (three.js reads the green channel): satin lacquer, a little rougher in the joints and over dark grain.
rough = 0.48 + (1 - smooth) * 0.3 + (coarse - fine) * 0.6
rough = np.clip(rough, 0.3, 0.9)

OUT.mkdir(parents=True, exist_ok=True)
Image.fromarray((color * 255).round().astype(np.uint8)).save(OUT / 'vinyl-color.webp', quality=90, method=6)
Image.fromarray(normal.round().astype(np.uint8)).save(OUT / 'vinyl-normal.webp', quality=92, method=6)
rough_img = Image.fromarray((rough * 255).round().astype(np.uint8)).resize((W // 2, H // 2), Image.Resampling.BOX)
rough_img.convert('RGB').save(OUT / 'vinyl-rough.webp', quality=90, method=6)

avg = (color.reshape(-1, 3).mean(0) * 255).round().astype(int)
print('offsets (mm):', [round(o / PX_PER_MM) for o in offsets])
print('average colour: #%02x%02x%02x' % tuple(avg))
for f in sorted(OUT.glob('vinyl-*')):
    print(f.name, f'{f.stat().st_size / 1e6:.2f} MB')

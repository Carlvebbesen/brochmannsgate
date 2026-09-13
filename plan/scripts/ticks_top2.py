from PIL import Image
import numpy as np

im = Image.open('/Users/carlvaldemarebbesen/Development/leilighet-3d/plan/images/plantegning.png').convert('L')
arr = np.array(im)
dark = (arr < 150).astype(int)
band = dark[205:226, :]  # just below the line, avoid text above
colsum = band.sum(axis=0)
cols = [x for x in range(len(colsum)) if colsum[x] > 10]
groups = []
cur = [cols[0]]
for c in cols[1:]:
    if c - cur[-1] <= 3:
        cur.append(c)
    else:
        groups.append(cur)
        cur = [c]
groups.append(cur)
for g in groups:
    # weighted centroid
    w = [colsum[x] for x in g]
    cen = sum(x*wi for x,wi in zip(g,w))/sum(w)
    print(f"{cen:.2f}  range={g[0]}-{g[-1]}  weights={w}")

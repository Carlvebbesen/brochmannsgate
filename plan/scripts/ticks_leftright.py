from PIL import Image
import numpy as np

im = Image.open('/Users/carlvaldemarebbesen/Development/leilighet-3d/plan/images/plantegning.png').convert('L')
arr = np.array(im)
dark = (arr < 150).astype(int)

def find_ticks(xcenter, xr, label):
    band = dark[:, xcenter-xr:xcenter+xr+1]
    rowsum = band.sum(axis=1)
    rows = [y for y in range(len(rowsum)) if rowsum[y] > 8]
    groups = []
    cur=[rows[0]]
    for r in rows[1:]:
        if r-cur[-1] <=3:
            cur.append(r)
        else:
            groups.append(cur); cur=[r]
    groups.append(cur)
    print(label)
    for g in groups:
        w=[rowsum[y] for y in g]
        cen=sum(y*wi for y,wi in zip(g,w))/sum(w)
        print(f"  {cen:.2f} range={g[0]}-{g[-1]} weights={w}")

find_ticks(132, 8, "LEFT")
find_ticks(1369, 8, "RIGHT")

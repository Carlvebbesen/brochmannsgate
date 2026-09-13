from PIL import Image
import numpy as np

im = Image.open('/Users/carlvaldemarebbesen/Development/leilighet-3d/plan/images/plantegning.png').convert('L')
arr = np.array(im)
dark = arr < 150
# ticks extend above/below the line at y=210, e.g. y in [195,225], look for columns where band is dark beyond just the line itself
band = dark[195:226, :]  # rows 195..225
colsum = band.sum(axis=0)
# the line itself contributes ~2 px per column (thickness ~2), ticks contribute more (~30 px tall)
cols = [x for x in range(len(colsum)) if colsum[x] > 15]
# group consecutive
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
    print(sum(g)/len(g), len(g))

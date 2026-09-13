from PIL import Image
import numpy as np

im = Image.open('/Users/carlvaldemarebbesen/Development/leilighet-3d/plan/images/plantegning.png').convert('L')
arr = np.array(im)
dark = arr < 100  # very dark = wall black fill
# scan rows 260-290 for thick wall presence per column
for y in [265,270,275,280,285]:
    row = dark[y,:]
    cols = [x for x in range(300,1350) if row[x]]
    if cols:
        # group into ranges
        groups=[]
        cur=[cols[0]]
        for c in cols[1:]:
            if c-cur[-1]<=2:
                cur.append(c)
            else:
                groups.append((cur[0],cur[-1])); cur=[c]
        groups.append((cur[0],cur[-1]))
        print(y, groups)

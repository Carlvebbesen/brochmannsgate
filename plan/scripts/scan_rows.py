from PIL import Image
import numpy as np

im = Image.open('/Users/carlvaldemarebbesen/Development/leilighet-3d/plan/images/plantegning.png').convert('L')
arr = np.array(im)
dark = arr < 150
for y in range(150, 260):
    s = dark[y, 300:1350].sum()
    if s > 200:
        print(y, s)

from PIL import Image
import numpy as np

im = Image.open('/Users/carlvaldemarebbesen/Development/leilighet-3d/plan/images/plantegning.png').convert('L')
arr = np.array(im)
dark = arr < 150
h,w = arr.shape

# find left vertical dimension line (a column with many dark pixels across rows 260-1290)
print("LEFT search")
for x in range(100, 200):
    s = dark[260:1300, x].sum()
    if s > 800:
        print(x, s)

print("RIGHT search")
for x in range(1340, 1420):
    s = dark[260:1300, x].sum()
    if s > 800:
        print(x, s)

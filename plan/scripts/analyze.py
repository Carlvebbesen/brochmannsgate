from PIL import Image
import numpy as np

im = Image.open('/Users/carlvaldemarebbesen/Development/leilighet-3d/plan/images/plantegning.png').convert('L')
arr = np.array(im)
print("shape", arr.shape)  # (height, width)

# Find dark pixels (walls, lines, text) threshold
dark = arr < 128

# Top dimension line region: roughly y in [195,215] based on visual (image height 1456, dims text near top ~197)
# Let's scan column sums of darkness in row range to find horizontal line row
for y in range(190, 230):
    row = dark[y, 300:1350]
    if row.sum() > 800:
        print("candidate top line row", y, row.sum())

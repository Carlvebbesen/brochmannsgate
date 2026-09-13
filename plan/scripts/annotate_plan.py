"""Draw reference labels (walls A.., doors D1.., windows V1..) on the floor plan for Q&A with the owner."""
from PIL import Image, ImageDraw, ImageFont

SRC = "/Users/carlvaldemarebbesen/Development/leilighet-3d/plan/images/plantegning.png"
DST = "/Users/carlvaldemarebbesen/Development/leilighet-3d/plan/images/plantegning-annotert.png"

img = Image.open(SRC).convert("RGB")
d = ImageDraw.Draw(img)
font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 26)

def tag(x, y, text, color):
    l, t, r, b = d.textbbox((x, y), text, font=font, anchor="mm")
    d.rounded_rectangle((l - 6, t - 4, r + 6, b + 4), radius=6, fill="white", outline=color, width=3)
    d.text((x, y), text, font=font, fill=color, anchor="mm")

RED, BLUE, GREEN, PURPLE = (200, 30, 30), (20, 80, 200), (10, 130, 60), (130, 40, 160)

# Walls (red)
walls = {
    "A": (745, 560),   # Bad east wall, facing Entre
    "B": (822, 500),   # stub between front door and Kott
    "C": (765, 600),   # kitchen/bad wall, north face (facing Entre)
    "D": (835, 670),   # end face of kitchen wall (corridor west side)
    "E": (915, 630),   # corridor east wall between bedroom doors
    "F": (640, 1238),  # living room south wall
    "G": (365, 1070),  # living room west wall (windows)
    "H": (400, 900),   # wall with balcony door (living room north, west part)
    "I": (515, 790),   # kitchen west wall (windows to balcony)
    "J": (640, 720),   # kitchen back wall (counter)
    "K": (915, 1150),  # living room east wall (to Tvstue)
    "L": (805, 800),   # short wall stub / column at island end
}
for k, (x, y) in walls.items():
    tag(x, y, k, RED)

# Doors (blue)
doors = {
    "D1": (762, 440),  # front door
    "D2": (690, 480),  # bathroom door
    "D3": (900, 500),  # kott door
    "D4": (985, 470),  # hovedsoverom door
    "D5": (995, 690),  # kontor door
    "D6": (1000, 985), # tvstue door
    "D7": (420, 990),  # balcony door
}
for k, (x, y) in doors.items():
    tag(x, y, k, BLUE)

# Windows (green)
wins = {
    "V1": (280, 1070), # living room west
    "V2": (430, 735),  # kitchen -> balcony
    "V3": (430, 520),  # bathroom -> balcony
    "V4": (1250, 435), # hovedsoverom
    "V5": (1250, 760), # kontor
    "V6": (1250, 1090),# tvstue
}
for k, (x, y) in wins.items():
    tag(x, y, k, GREEN)

# Balcony railing parts (purple)
for k, (x, y) in {"R1": (385, 440), "R2": (215, 620), "R3": (270, 900)}.items():
    tag(x, y, k, PURPLE)

img.save(DST)
print("saved", DST, img.size)
